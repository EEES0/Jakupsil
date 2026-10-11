package io.github.EEES0.jakupsil.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class MergePdf {

    public byte[] mergePdf(MultipartFile[] files) throws IOException {

        if (files == null || files.length < 2) {
            throw new IllegalArgumentException(
                    "PDF 파일을 2개 이상 선택해주세요."
            );
        }

        PDFMergerUtility merger = new PDFMergerUtility();

        try (PDDocument result = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            for (MultipartFile file : files) {

                if (file == null || file.isEmpty()) {
                    throw new IllegalArgumentException(
                            "빈 파일이 있습니다."
                    );
                }

                // 실제 PDF인지 여부는 Loader.loadPDF()가 읽으면서 확인
                try (PDDocument source =
                             Loader.loadPDF(file.getBytes())) {

                    merger.appendDocument(result, source);
                }
            }

            result.save(output);

            return output.toByteArray();
        }
    }
}