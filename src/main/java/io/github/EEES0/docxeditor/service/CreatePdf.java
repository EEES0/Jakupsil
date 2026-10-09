
package io.github.EEES0.docxeditor.service;

import io.github.EEES0.docxeditor.dto.createFile.ContentNode;
import io.github.EEES0.docxeditor.dto.createFile.CreateFileRequest;
import io.github.EEES0.docxeditor.dto.createFile.Mark;
import io.github.EEES0.docxeditor.dto.createFile.TextNode;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class CreatePdf {

    private static final float MARGIN = 50f;
    private static final float DEFAULT_FONT_SIZE = 10.5f;
    private static final float LINE_SPACING = 1.6f;
    private static final float PARAGRAPH_SPACING = 8f;

    // 출력할 문자와 서식 정보
    private record Glyph(
            String text,
            PDFont font,
            float fontSize,
            boolean underline,
            float width
    ) {}

    // PDF 한 줄의 레이아웃 정보
    private record Line(
            List<Glyph> glyphs,
            float width,
            float height
    ) {}

    public byte[] createPdfByte(CreateFileRequest request)
            throws IOException {

        if (request == null || request.content() == null) {
            throw new IllegalArgumentException(
                    "문서 내용이 존재하지 않습니다."
            );
        }

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            // 1. 한글 폰트 로딩
            //일반 폰트
            PDFont regularFont = loadFont(
                    document,
                    "/fonts/NanumGothic.ttf"
            );

            //강조 폰트
            PDFont boldFont = loadFont(
                    document,
                    "/fonts/NanumGothicBold.ttf"
            );

            // 2. 페이지 크기
            float pageHeight = PDRectangle.A4.getHeight();
            float availableWidth =
                    PDRectangle.A4.getWidth() - MARGIN * 2;

            // 3. 첫 페이지 생성
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDPageContentStream stream =
                    new PDPageContentStream(document, page);

            float y = pageHeight - MARGIN;

            try {
                // 4. 문단 순회
                for (ContentNode content : request.content()) {

                    if (content == null) {
                        continue;
                    }

                    if (!"paragraph".equals(content.type())
                            && !"heading".equals(content.type())) {
                        throw new IllegalArgumentException(
                                "지원하지 않는 요소: " + content.type()
                        );
                    }

                    // 문단의 글자를 줄 단위로 배치
                    List<Line> lines = layoutParagraph(
                            content,
                            regularFont,
                            boldFont,
                            availableWidth
                    );

                    // 문단 정렬 가져오기
                    String alignment = "left";

                    if (content.attrs() != null
                            && content.attrs().textAlign() != null) {

                        alignment = content.attrs().textAlign();
                    }

                    // 5. 줄 단위 출력
                    for (Line line : lines) {

                        // 페이지 공간이 부족하면 새 페이지 생성
                        if (y - line.height() < MARGIN) {

                            stream.close();

                            page = new PDPage(PDRectangle.A4);
                            document.addPage(page);

                            stream = new PDPageContentStream(
                                    document,
                                    page
                            );

                            y = pageHeight - MARGIN;
                        }

                        // 정렬에 맞는 X 좌표
                        float x = calculateX(
                                alignment,
                                line.width(),
                                availableWidth
                        );

                        // 현재 줄의 기준선
                        float baseline =
                                y - line.height() / LINE_SPACING;

                        drawLine(
                                stream,
                                line,
                                x,
                                baseline
                        );

                        y -= line.height();
                    }

                    // 문단 간격
                    y -= PARAGRAPH_SPACING;
                }
            } finally {
                stream.close();
            }

            // 6. PDF를 바이트 배열로 저장
            document.save(output);

            return output.toByteArray();
        }
    }

    // 한글 폰트 로딩
    private PDFont loadFont(
            PDDocument document,
            String path
    ) throws IOException {

        try (InputStream input =
                     getClass().getResourceAsStream(path)) {

            if (input == null) {
                throw new IOException(
                        "폰트 파일을 찾을 수 없습니다: " + path
                );
            }

            return PDType0Font.load(document, input);
        }
    }

    // 문단을 출력 가능한 줄 목록으로 변환
    private List<Line> layoutParagraph(
            ContentNode content,
            PDFont regularFont,
            PDFont boldFont,
            float maxWidth
    ) throws IOException {

        List<Line> lines = new ArrayList<>();
        List<Glyph> currentLine = new ArrayList<>();

        float currentWidth = 0f;
        float maxFontSize = DEFAULT_FONT_SIZE;

        if (content.content() != null) {

            for (TextNode node : content.content()) {

                if (node == null || node.text() == null) {
                    continue;
                }

                boolean bold = false;
                boolean underline = false;
                float fontSize = DEFAULT_FONT_SIZE;

                // Tiptap marks 분석
                if (node.marks() != null) {

                    for (Mark mark : node.marks()) {

                        if (mark == null || mark.type() == null) {
                            continue;
                        }

                        switch (mark.type()) {

                            case "bold" -> bold = true;

                            case "underline" -> underline = true;

                            case "textStyle" -> {
                                if (mark.attrs() != null
                                        && mark.attrs().fontSize() != null) {

                                    fontSize = toPdfFontSize(
                                            mark.attrs().fontSize()
                                    );
                                }
                            }

                            default -> {
                                // 지원하지 않는 mark 무시
                            }
                        }
                    }
                }

                // Bold 여부에 따라 폰트 선택
                PDFont font = bold ? boldFont : regularFont;

                String text = node.text()
                        .replace("\r\n", "\n")
                        .replace('\r', '\n');

                // 문자 단위로 너비 계산
                for (int codePoint : text.codePoints().toArray()) {

                    // 명시적인 줄바꿈
                    if (codePoint == '\n') {

                        lines.add(createLine(
                                currentLine,
                                currentWidth,
                                maxFontSize
                        ));

                        currentLine = new ArrayList<>();
                        currentWidth = 0f;
                        maxFontSize = DEFAULT_FONT_SIZE;
                        continue;
                    }

                    String character = new String(
                            Character.toChars(codePoint)
                    );

                    float charWidth =
                            font.getStringWidth(character)
                                    / 1000f * fontSize;

                    if (charWidth > maxWidth) {
                        throw new IllegalArgumentException(
                                "출력 영역을 초과하는 글자 크기입니다."
                        );
                    }

                    // 현재 줄의 너비 초과 시 줄바꿈
                    if (!currentLine.isEmpty()
                            && currentWidth + charWidth > maxWidth) {

                        lines.add(createLine(
                                currentLine,
                                currentWidth,
                                maxFontSize
                        ));

                        currentLine = new ArrayList<>();
                        currentWidth = 0f;
                        maxFontSize = DEFAULT_FONT_SIZE;
                    }

                    currentLine.add(new Glyph(
                            character,
                            font,
                            fontSize,
                            underline,
                            charWidth
                    ));

                    currentWidth += charWidth;

                    maxFontSize = Math.max(
                            maxFontSize,
                            fontSize
                    );
                }
            }
        }

        // 마지막 줄 또는 빈 문단 추가
        lines.add(createLine(
                currentLine,
                currentWidth,
                maxFontSize
        ));

        return lines;
    }

    // 한 줄 객체 생성
    private Line createLine(
            List<Glyph> glyphs,
            float width,
            float maxFontSize
    ) {
        return new Line(
                List.copyOf(glyphs),
                width,
                maxFontSize * LINE_SPACING
        );
    }

    // 문단 정렬에 따른 X 좌표
    private float calculateX(
            String alignment,
            float textWidth,
            float availableWidth
    ) {
        return switch (alignment) {

            case "center" ->
                    MARGIN + (availableWidth - textWidth) / 2f;

            case "right" ->
                    MARGIN + availableWidth - textWidth;

            case "left" -> MARGIN;

            default -> throw new IllegalArgumentException(
                    "지원하지 않는 정렬: " + alignment
            );
        };
    }

    // PDF에 실제 텍스트 및 밑줄 출력
    private void drawLine(
            PDPageContentStream stream,
            Line line,
            float startX,
            float baselineY
    ) throws IOException {

        float x = startX;

        for (Glyph glyph : line.glyphs()) {

            // 텍스트 출력
            stream.beginText();

            stream.setFont(
                    glyph.font(),
                    glyph.fontSize()
            );

            stream.newLineAtOffset(x, baselineY);

            stream.showText(glyph.text());

            stream.endText();

            // Underline
            if (glyph.underline() && !glyph.text().isBlank()) {

                float underlineY =
                        baselineY - glyph.fontSize() * 0.15f;

                stream.setLineWidth(
                        Math.max(
                                0.5f,
                                glyph.fontSize() * 0.05f
                        )
                );

                stream.moveTo(x, underlineY);

                stream.lineTo(
                        x + glyph.width(),
                        underlineY
                );

                stream.stroke();
            }

            // 다음 문자의 시작 위치
            x += glyph.width();
        }
    }

    // Tiptap fontSize를 PDF pt로 변환
    private float toPdfFontSize(String fontSize) {

        if (fontSize == null || fontSize.isBlank()) {
            return DEFAULT_FONT_SIZE;
        }

        String value = fontSize.trim();
        float size;

        try {
            if (value.endsWith("px")) {

                float px = Float.parseFloat(
                        value.substring(0, value.length() - 2)
                );

                size = px * 0.75f;

            } else if (value.endsWith("pt")) {

                size = Float.parseFloat(
                        value.substring(0, value.length() - 2)
                );

            } else {
                throw new IllegalArgumentException(
                        "지원하지 않는 글자 크기: " + value
                );
            }
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "잘못된 글자 크기: " + value,
                    e
            );
        }

        if (!Float.isFinite(size)
                || size < 1f
                || size > 200f) {
            throw new IllegalArgumentException(
                    "글자 크기 범위를 벗어났습니다: " + value
            );
        }

        return size;
    }
}
