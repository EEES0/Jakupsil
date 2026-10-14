package io.github.EEES0.jakupsil.service;

import nu.pattern.OpenCV;
import org.opencv.core.Core;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.CLAHE;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class ImageContrastEnhance {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final long MAX_PIXELS = 12_000_000L;

    static {
        OpenCV.loadLocally();
    }

    public byte[] imageContrastEnhance(MultipartFile image) throws IOException {
        validateFile(image);

        MatOfByte inputBytes = new MatOfByte(image.getBytes());

        Mat gray = null;
        Mat background = new Mat();
        Mat normalized = new Mat();
        Mat enhanced = new Mat();

        MatOfByte outputBytes = new MatOfByte();
        CLAHE clahe = null;

        try {
            // 1. 파일 바이트를 회색조 이미지로 읽기
            gray = Imgcodecs.imdecode(
                    inputBytes,
                    Imgcodecs.IMREAD_GRAYSCALE
            );

            validateImage(gray);

            // 2. 배경 밝기를 추정하고 그림자 완화
            normalizeBackground(gray, background, normalized);

            // 3. 구역별 대비 개선
            clahe = Imgproc.createCLAHE(
                    1.5,
                    new Size(8, 8)
            );

            clahe.apply(normalized, enhanced);

            // 4. 결과 이미지를 PNG 파일 바이트로 변환
            boolean encoded = Imgcodecs.imencode(
                    ".png",
                    enhanced,
                    outputBytes
            );

            if (!encoded) {
                throw new IOException("PNG 이미지 생성에 실패했습니다");
            }

            return outputBytes.toArray();

        } finally {
            // OpenCV가 사용하는 네이티브 메모리 정리
            inputBytes.release();
            outputBytes.release();

            if (gray != null) {
                gray.release();
            }

            background.release();
            normalized.release();
            enhanced.release();

            if (clahe != null) {
                clahe.collectGarbage();
            }
        }
    }

    private void validateFile(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("이미지를 선택해 주세요");
        }

        if (image.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "이미지는 10MB 이하만 업로드할 수 있습니다"
            );
        }
    }

    private void validateImage(Mat image) {
        if (image.empty()) {
            throw new IllegalArgumentException(
                    "읽을 수 없는 이미지 파일입니다"
            );
        }

        long pixels = (long) image.cols() * image.rows();

        if (pixels > MAX_PIXELS) {
            throw new IllegalArgumentException(
                    "이미지는 1,200만 픽셀 이하만 처리할 수 있습니다"
            );
        }
    }

    private void normalizeBackground(
            Mat gray,
            Mat background,
            Mat normalized
    ) {
        // 이미지 크기에 따라 배경 추정 범위 조절
        double sigma = Math.clamp(
                Math.max(gray.cols(), gray.rows()) / 50.0
                ,
                5.0,
                60.0);

        // 원본을 변경하지 않고 배경 추정용 이미지를 생성
        Imgproc.GaussianBlur(
                gray,
                background,
                new Size(0, 0),
                sigma
        );

        // 나눗셈에 사용할 배경 밝기를 최소 1로 제한
        Core.max(
                background,
                new Scalar(1),
                background
        );

        // 보정 밝기 = 원본 밝기 / 배경 밝기 × 255
        Core.divide(
                gray,
                background,
                normalized,
                255.0
        );
    }
}