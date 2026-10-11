package io.github.EEES0.jakupsil.serviceTest;

import io.github.EEES0.jakupsil.service.ConvertDocxToPdf;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
public class ConvertDocxToPdfTest {
    private final ConvertDocxToPdf convertDocxToPdf = new ConvertDocxToPdf();
    byte[] docxBytes;
    @Test
    public void convertDocxToPdfTest() throws IOException, InterruptedException {

        try (XWPFDocument docx = new XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            XWPFParagraph paragraph = docx.createParagraph();
            paragraph.createRun().setText("test docx");

            docx.write(output);
            docxBytes = output.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                docxBytes
        );

        byte[] result = convertDocxToPdf.convertDocxToPdf(file);
        assertNotNull(result);
        assertTrue(result.length > 0);
    }

}
