package io.github.EEES0.docxeditor.serviceTest;

import io.github.EEES0.docxeditor.dto.createFile.CreateFileRequest;
import io.github.EEES0.docxeditor.mockDto.MockCreateFileRequest;
import io.github.EEES0.docxeditor.service.CreateDocx;
import org.apache.poi.xwpf.usermodel.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
public class CreateDocxTest {
    CreateDocx createDocx = new CreateDocx();
    @Test
    void createDocxByteTest() throws IOException {
        CreateFileRequest request = MockCreateFileRequest.mockCreateFileRequest();
        byte[] result = createDocx.createDocxByte(request);
        try(
            ByteArrayInputStream inputStream = new ByteArrayInputStream(result);
            XWPFDocument document = new XWPFDocument(inputStream);
        ) {
            XWPFParagraph paragraph = document.getParagraphs().getFirst();
            XWPFRun run = paragraph.getRuns().getFirst();
            assertThat(result).isNotEmpty();
            assertTrue(run.isBold());
            assertTrue(run.isItalic());
            assertEquals(UnderlinePatterns.SINGLE, run.getUnderline());
            assertEquals(18, run.getFontSizeAsDouble().intValue());
            assertEquals(ParagraphAlignment.CENTER, paragraph.getAlignment());
            assertEquals("test text", run.text());

        }
    }
}
