package io.github.EEES0.docxeditor.service;

import io.github.EEES0.docxeditor.dto.CreateDocxRequest;
import io.github.EEES0.docxeditor.dto.ContentNode;
import io.github.EEES0.docxeditor.dto.TextNode;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;


@Service
public class CreateDocx {
    /**
     * docx문서 생성하고 바이트 배열로 반환함
     */
    public byte[] createDocxByte(CreateDocxRequest request) throws IOException {

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