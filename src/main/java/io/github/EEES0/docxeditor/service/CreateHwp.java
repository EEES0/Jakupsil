package io.github.EEES0.docxeditor.service;

import io.github.EEES0.docxeditor.dto.createFile.ContentNode;
import io.github.EEES0.docxeditor.dto.createFile.CreateFileRequest;
import io.github.EEES0.docxeditor.dto.createFile.TextNode;
import kr.dogfoot.hwplib.object.HWPFile;
import kr.dogfoot.hwplib.object.bodytext.Section;
import kr.dogfoot.hwplib.object.bodytext.paragraph.Paragraph;
import kr.dogfoot.hwplib.object.docinfo.CharShape;
import kr.dogfoot.hwplib.object.docinfo.charshape.BorderType2;
import kr.dogfoot.hwplib.object.docinfo.charshape.UnderLineSort;
import kr.dogfoot.hwplib.tool.blankfilemaker.BlankFileMaker;
import kr.dogfoot.hwplib.writer.HWPWriter;
import kr.dogfoot.hwplib.object.docinfo.ParaShape;
import kr.dogfoot.hwplib.object.docinfo.parashape.Alignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

/*TODO: 언젠가 완성할것
**/
@Service
public class CreateHwp {

    public byte[] createHwpByte(CreateFileRequest request) throws Exception {
        HWPFile hwpFile = BlankFileMaker.make();

        Section section = hwpFile.getBodyText()
                .getSectionList().getFirst();

        var shapeList = hwpFile.getDocInfo().getCharShapeList();

        int index = 0;

        for (ContentNode content : request.content()) {
            Paragraph paragraph;

            if (index == 0) {
                paragraph = section.getParagraph(0);
            } else {
                paragraph = section.addNewParagraph();

                paragraph.getHeader().copy(
                        section.getParagraph(0).getHeader()
                );

                paragraph.getHeader().getControlMask().setValue(0);
                paragraph.getHeader().getDivideSort().setValue((short) 0);

                paragraph.createText();
                paragraph.getText().addString("");

                paragraph.createCharShape();
                paragraph.getCharShape().addParaCharShape(0, 0);

                paragraph.getHeader().setCharShapeCount(1);
                paragraph.getHeader().setLineAlignCount(0);
                paragraph.getHeader().setRangeTagCount(0);
            }

            var paraShapeList = hwpFile.getDocInfo().getParaShapeList();
            ParaShape paraShape = paraShapeList.getFirst().clone();

            Alignment alignment = Alignment.Left;

            if (content.attrs() != null
                    && content.attrs().textAlign() != null) {

                alignment = switch (content.attrs().textAlign()) {
                    case "center" -> Alignment.Center;
                    case "right" -> Alignment.Right;
                    case "justify" -> Alignment.Justify;
                    default -> Alignment.Left;
                };
            }

            paraShape.getProperty1().setAlignment(alignment);
            int paraShapeId = paraShapeList.size();
            paraShapeList.add(paraShape);

            paragraph.getHeader().setParaShapeId(paraShapeId);

            if (content.content() != null) {
                for (TextNode node : content.content()) {
                    if (node.text() == null || node.text().isEmpty()) {
                        continue;
                    }

                    long startPosition =
                            paragraph.getText().getCharSize() - 1L;

                    CharShape shape = shapeList.getFirst().clone();

                    shape.getProperty().setBold(false);
                    shape.getProperty().setItalic(false);
                    shape.getProperty().setUnderLineSort(
                            UnderLineSort.None
                    );

                    shape.setBaseSize(1050);

                    if (node.marks() != null) {
                        for (var mark : node.marks()) {
                            if (mark == null || mark.type() == null) {
                                continue;
                            }

                            switch (mark.type()) {
                                case "bold" ->
                                        shape.getProperty().setBold(true);

                                case "italic" ->
                                        shape.getProperty().setItalic(true);

                                case "underline" -> {
                                    shape.getProperty().setUnderLineSort(
                                            UnderLineSort.Bottom
                                    );
                                    shape.getProperty().setUnderLineShape(
                                            BorderType2.Solid
                                    );
                                }

                                case "textStyle" -> {
                                    var attr = mark.attrs();

                                    if (attr != null
                                            && attr.fontSize() != null
                                            && !attr.fontSize().isBlank()) {

                                        shape.setBaseSize(
                                                toHwpFontSize(attr.fontSize())
                                        );
                                    }
                                }

                                default -> {
                                    // 지원하지 않는 mark는 생략
                                }
                            }
                        }
                    }

                    int shapeId = shapeList.size();
                    shapeList.add(shape);

                    paragraph.getCharShape().addParaCharShape(
                            startPosition,
                            shapeId
                    );

                    paragraph.getText().addString(node.text());
                }
            }

            paragraph.getHeader().setCharShapeCount(
                    paragraph.getCharShape()
                            .getPositonShapeIdPairList()
                            .size()
            );

            index++;
        }

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            HWPWriter.toStream(hwpFile, output);
            return output.toByteArray();
        }
    }

    private int toHwpFontSize(String fontSize) {
        String value = fontSize.trim();
        double pt;

        if (value.endsWith("px")) {
            double px = Double.parseDouble(
                    value.substring(0, value.length() - 2)
            );
            pt = px * 0.75;

        } else if (value.endsWith("pt")) {
            pt = Double.parseDouble(
                    value.substring(0, value.length() - 2)
            );

        } else {
            throw new IllegalArgumentException(
                    "지원하지 않는 글자 크기: " + fontSize
            );
        }

        double hwpSize = pt * 100;

        if (!Double.isFinite(hwpSize)
                || hwpSize < 1
                || hwpSize > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(
                    "잘못된 글자 크기: " + fontSize
            );
        }

        return (int) Math.round(hwpSize);
    }
}