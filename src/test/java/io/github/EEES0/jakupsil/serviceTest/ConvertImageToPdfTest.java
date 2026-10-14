package io.github.EEES0.jakupsil.serviceTest;


import io.github.EEES0.jakupsil.service.ConvertImageToPdf;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;

public class ConvertImageToPdfTest{
    ConvertImageToPdf convertImageToPdf = new ConvertImageToPdf();

    @Test
    public void convertImageToPdfTest() throws Exception {
        try (InputStream inputStream = getClass()
                .getClassLoader()
                .getResourceAsStream("convertImageToPdfTest.png")) {

            if (inputStream == null) {
                throw new IllegalArgumentException("테스트용 이미지가 없습니다");
            }

            MultipartFile[] request = new MultipartFile[]{
                    new MockMultipartFile(
                            "images",
                            "convertImageToPdfTest.png",
                            MediaType.IMAGE_PNG_VALUE,
                            inputStream
                    )
            };

            byte[] result = convertImageToPdf.convertImageToPdf(request);

            assertNotNull(result);
            assertTrue(result.length > 0);
            try (PDDocument document = Loader.loadPDF(result)) {

                assertEquals(request.length, document.getNumberOfPages(),
                        "입력 이미지 수와 PDF 페이지 수가 같아야 합니다");

                PDPage firstPage = document.getPage(0);
                PDResources resources = firstPage.getResources();

                assertNotNull(resources);

                boolean hasImage = false;

                for (COSName name : resources.getXObjectNames()) {
                    if (resources.isImageXObject(name)) {
                        hasImage = true;
                        break;
                    }
                }

                assertTrue(hasImage, "첫 페이지에 이미지가 있어야 합니다");
            }
        }
    }

}
