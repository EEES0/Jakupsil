package io.github.EEES0.docxeditor.service;

import io.github.EEES0.docxeditor.dto.CreateDocxRequest;
import io.github.EEES0.docxeditor.dto.EditorBlock;
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

        for (EditorBlock block : request.blocks()) {

            XWPFParagraph paragraph =
                    document.createParagraph();

            XWPFRun run =
                    paragraph.createRun();

            run.setText(block.data().text());

            switch (block.type()) {

                case "heading1" -> {
                    run.setBold(true);
                    run.setFontSize(28);
                }

                case "heading2" -> {
                    run.setBold(true);
                    run.setFontSize(22);
                }

                case "heading3" -> {
                    run.setBold(true);
                    run.setFontSize(18);
                }

                case "paragraph" -> {
                    run.setFontSize(12);
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