package io.github.EEES0.jakupsil.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class ConvertImageToPdf {
    public byte[] convertImageToPdf(MultipartFile[] images)
            throws IOException {

        if (images == null || images.length == 0) {
            throw new IllegalArgumentException("이미지가 없습니다.");
        }

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            for (MultipartFile image : images) {

                if (image.isEmpty()) {
                    throw new IllegalArgumentException("빈 이미지가 있습니다.");
                }

                String type = image.getContentType();

                if (!"image/jpeg".equals(type) &&
                        !"image/png".equals(type)) {
                    throw new IllegalArgumentException(
                            "JPG, PNG 이미지만 지원합니다."
                    );
                }

                PDImageXObject pdfImage =
                        PDImageXObject.createFromByteArray(
                                document,
                                image.getBytes(),
                                image.getOriginalFilename()
                        );

                PDPage page = new PDPage(PDRectangle.A4);
                document.addPage(page);

                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                float imageWidth = pdfImage.getWidth();
                float imageHeight = pdfImage.getHeight();

                float margin = 20;

                float scale = Math.min(
                        (pageWidth - margin * 2) / imageWidth,
                        (pageHeight - margin * 2) / imageHeight
                );

                // 원본보다 확대하지 않도록 제한
                scale = Math.min(scale, 1.0f);

                float width = imageWidth * scale;
                float height = imageHeight * scale;

                float x = (pageWidth - width) / 2;
                float y = (pageHeight - height) / 2;

                try (PDPageContentStream content =
                             new PDPageContentStream(document, page)) {

                    content.drawImage(pdfImage, x, y, width, height);
                }
            }

            document.save(output);

            return output.toByteArray();
        }
    }
}
