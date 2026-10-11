package io.github.EEES0.jakupsil.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.util.Matrix;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@Service
public class ConvertImageToPdf {

    public byte[] convertImageToPdf(MultipartFile[] images)
            throws Exception {

        if (images == null || images.length == 0) {
            throw new IllegalArgumentException("이미지가 없습니다.");
        }

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            for (MultipartFile image : images) {

                if (image == null || image.isEmpty()) {
                    throw new IllegalArgumentException(
                            "빈 이미지가 있습니다."
                    );
                }

                String type = image.getContentType();

                if (!"image/jpeg".equals(type)
                        && !"image/png".equals(type)) {
                    throw new IllegalArgumentException(
                            "JPG, PNG 이미지만 지원합니다."
                    );
                }

                byte[] imageBytes = image.getBytes();

                PDImageXObject pdfImage =
                        PDImageXObject.createFromByteArray(
                                document,
                                imageBytes,
                                image.getOriginalFilename()
                        );

                int orientation = getOrientation(imageBytes);

                PDPage page = new PDPage(PDRectangle.A4);
                document.addPage(page);

                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                float imageWidth = pdfImage.getWidth();
                float imageHeight = pdfImage.getHeight();

                // 90도 회전 또는 대각선 반전 시 가로·세로가 바뀜
                boolean swapsDimensions =
                        orientation >= 5 && orientation <= 8;

                float displayWidth = swapsDimensions
                        ? imageHeight : imageWidth;

                float displayHeight = swapsDimensions
                        ? imageWidth : imageHeight;

                float margin = 20;

                // 비율을 유지하면서 페이지 안에 들어갈 배율 계산
                float scale = Math.min(
                        (pageWidth - margin * 2) / displayWidth,
                        (pageHeight - margin * 2) / displayHeight
                );

                // 작은 이미지는 확대하지 않음
                scale = Math.min(scale, 1.0f);

                float width = displayWidth * scale;
                float height = displayHeight * scale;

                // 페이지 중앙에 배치
                float x = (pageWidth - width) / 2;
                float y = (pageHeight - height) / 2;

                Matrix matrix = switch (orientation) {
                    // 좌우 반전
                    case 2 -> new Matrix(
                            -width, 0,
                            0, height,
                            x + width, y
                    );

                    // 180도 회전
                    case 3 -> new Matrix(
                            -width, 0,
                            0, -height,
                            x + width, y + height
                    );

                    // 상하 반전
                    case 4 -> new Matrix(
                            width, 0,
                            0, -height,
                            x, y + height
                    );

                    // 대각선 반전
                    case 5 -> new Matrix(
                            0, -height,
                            -width, 0,
                            x + width, y + height
                    );

                    // 시계 방향 90도 회전
                    case 6 -> new Matrix(
                            0, -height,
                            width, 0,
                            x, y + height
                    );

                    // 반대쪽 대각선 반전
                    case 7 -> new Matrix(
                            0, height,
                            width, 0,
                            x, y
                    );

                    // 반시계 방향 90도 회전
                    case 8 -> new Matrix(
                            0, height,
                            -width, 0,
                            x + width, y
                    );

                    // 회전 없음
                    default -> new Matrix(
                            width, 0,
                            0, height,
                            x, y
                    );
                };

                try (PDPageContentStream content =
                             new PDPageContentStream(document, page)) {

                    content.drawImage(pdfImage, matrix);
                }
            }

            document.save(output);
            return output.toByteArray();
        }
    }

    private int getOrientation(byte[] imageBytes)
            throws Exception {

        try (ByteArrayInputStream input =
                     new ByteArrayInputStream(imageBytes)) {

            Metadata metadata =
                    ImageMetadataReader.readMetadata(input);

            ExifIFD0Directory directory =
                    metadata.getFirstDirectoryOfType(
                            ExifIFD0Directory.class
                    );

            // 방향 정보가 없으면 기본 방향 사용
            if (directory == null
                    || !directory.containsTag(
                    ExifIFD0Directory.TAG_ORIENTATION
            )) {
                return 1;
            }

            return directory.getInt(
                    ExifIFD0Directory.TAG_ORIENTATION
            );
        }
    }
}