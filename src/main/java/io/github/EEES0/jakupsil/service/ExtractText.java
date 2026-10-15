package io.github.EEES0.jakupsil.service;

import net.sourceforge.tess4j.ITessAPI;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;

@Service
public class ExtractText {
    public String extractText(MultipartFile image)
            throws IOException, TesseractException {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("이미지를 선택해 주세요");
        }

        String dataPath = System.getenv("TESSDATA_PATH");

        if (dataPath == null || dataPath.isBlank()) {
            throw new IllegalStateException(
                    "TESSDATA_PATH 환경변수가 설정되지 않았습니다"
            );
        }

        BufferedImage bufferedImage;

        try (InputStream inputStream = image.getInputStream()) {
            bufferedImage = ImageIO.read(inputStream);
        }

        if (bufferedImage == null) {
            throw new IllegalArgumentException(
                    "지원하지 않거나 손상된 이미지입니다"
            );
        }

        try {
            Tesseract tesseract = new Tesseract();

            tesseract.setDatapath(dataPath);
            tesseract.setLanguage("kor+eng");
            tesseract.setOcrEngineMode(
                    ITessAPI.TessOcrEngineMode.OEM_LSTM_ONLY
            );

            return tesseract.doOCR(bufferedImage);

        } finally {
            bufferedImage.flush();
        }
    }
}
