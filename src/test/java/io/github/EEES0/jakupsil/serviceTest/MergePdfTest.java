package io.github.EEES0.jakupsil.serviceTest;

import io.github.EEES0.jakupsil.service.MergePdf;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;

public class MergePdfTest {
    MergePdf mergePdf = new MergePdf();

    @Test
    public void mergePdfTest() throws IOException {
        try(
            InputStream firstPdfInput = getClass()
                .getClassLoader()
                .getResourceAsStream("MergePdfTestFirstPdf.pdf");

            InputStream secondPdfInput = getClass()
                    .getClassLoader()
                    .getResourceAsStream("MergePdfTestSecondPdf.pdf")

        ) {
            assertNotNull(firstPdfInput, "firstInput이 없습니다.");
            assertNotNull(secondPdfInput, "secondInput이 없습니다.");

            MultipartFile[] request = new MultipartFile[]{
                    new MockMultipartFile(
                            "files",
                            "MergePdfTestFirstPdf.pdf",
                            MediaType.APPLICATION_PDF_VALUE,
                            firstPdfInput
                    ),
                    new MockMultipartFile(
                            "files",
                            "MergePdfTestSecondPdf.pdf",
                            MediaType.APPLICATION_PDF_VALUE,
                            secondPdfInput
                    )
            };
            byte[] result = mergePdf.mergePdf(request);

            assertNotNull(result);
            assertTrue(result.length > 0);

            try (PDDocument document = Loader.loadPDF(result)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String[] expected = {"First Pdf", "Second Pdf"};

                assertEquals(expected.length, document.getNumberOfPages(),
                        "병합된 PDF는 2페이지여야 합니다");

                for (int page = 1; page <= document.getNumberOfPages(); page++) {
                    stripper.setStartPage(page);
                    stripper.setEndPage(page);

                    String text = stripper.getText(document).strip();

                    String firstLine = text.lines()
                            .filter(line -> !line.isBlank())
                            .findFirst()
                            .orElse("");

                    assertEquals(expected[page - 1], firstLine);
                }
            }

        }
    }
}
