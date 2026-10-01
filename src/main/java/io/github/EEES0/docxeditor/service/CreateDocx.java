package io.github.EEES0.docxeditor.service;

import io.github.EEES0.docxeditor.dto.createFile.ContentNode;
import io.github.EEES0.docxeditor.dto.createFile.CreateFileRequest;
import io.github.EEES0.docxeditor.dto.createFile.Mark;
import io.github.EEES0.docxeditor.dto.createFile.TextNode;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;


@Service
public class CreateDocx {
    /**
     * docx문서 생성하고 바이트 배열로 반환함
     */
    public byte[] createDocxByte(CreateFileRequest request) throws IOException {

        XWPFDocument document = new XWPFDocument();

        for (ContentNode content : request.content()) {

            XWPFParagraph paragraph =
                    document.createParagraph();
            if (content.attrs() != null && content.attrs().textAlign() != null) {

                switch (content.attrs().textAlign()) {
                    case "left" -> paragraph.setAlignment(ParagraphAlignment.LEFT);

                    case "center" -> paragraph.setAlignment(ParagraphAlignment.CENTER);

                    case "right" -> paragraph.setAlignment(ParagraphAlignment.RIGHT);

                }
            }

            if (content.content() != null) {
                for (TextNode textContent : content.content()) {
                    XWPFRun run = paragraph.createRun();
                    if (textContent.marks() != null) {
                        for (Mark mark : textContent.marks()) {
                            switch (mark.type()) {
                                case "bold" -> run.setBold(true);
                                case "underline" -> run.setUnderline(UnderlinePatterns.SINGLE);
                                case "italic" -> run.setItalic(true);
                            }
                            if (mark.attrs() != null && mark.attrs().fontSize() != null) {
                                int size = Integer.parseInt(
                                        mark.attrs().fontSize()
                                                .substring(0, mark.attrs().fontSize().length() - 2));
                                run.setFontSize((int) Math.round(size * 0.75)); //px -> pt 변환 위해 0.75 곱하고 반올림
                            }
                        }
                    }
                    run.setText(textContent.text());
                }
            }
        }

        ByteArrayOutputStream out =
        new ByteArrayOutputStream();

        document.write(out);

        document.close();

        return out.toByteArray();
    }

}