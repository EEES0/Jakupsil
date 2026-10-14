package io.github.EEES0.jakupsil.service;

import nu.pattern.OpenCV;
import org.opencv.core.Core;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class ImageContrastEnhance {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    // 겹침 영역까지 포함한 타일의 최대 가로·세로
    private static final int MAX_TILE_SIDE = 2048;

    // 모든 타일에서 동일하게 사용하는 보정 설정
    private static final double BACKGROUND_SIGMA = 20.0;
    private static final int BLUR_RADIUS = 60;
    private static final int BLUR_KERNEL_SIZE = BLUR_RADIUS * 2 + 1;

    static {
        OpenCV.loadLocally();
    }

    public byte[] imageContrastEnhance(
            MultipartFile image
    ) throws IOException {

        validateFile(image);

        byte[] bytes = image.getBytes();

        MatOfByte inputBytes = new MatOfByte(bytes);
        MatOfByte outputBytes = new MatOfByte();

        Mat gray = null;
        Mat background = new Mat();
        Mat normalized = new Mat();

        try {
            // 1. 전달받은 타일을 회색조로 디코딩
            gray = Imgcodecs.imdecode(
                    inputBytes,
                    Imgcodecs.IMREAD_GRAYSCALE
            );

            validateTile(gray);

            // 2. 배경 밝기 보정
            normalizeBackground(gray, background, normalized);

            // 3. 입력과 같은 크기의 PNG로 인코딩
            boolean encoded = Imgcodecs.imencode(
                    ".png",
                    normalized,
                    outputBytes
            );

            if (!encoded) {
                throw new IOException("PNG 이미지 생성에 실패했습니다");
            }

            return outputBytes.toArray();

        } finally {
            inputBytes.release();
            outputBytes.release();

            if (gray != null) {
                gray.release();
            }

            background.release();
            normalized.release();
        }
    }

    private void validateFile(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException(
                    "이미지 조각을 전송해 주세요"
            );
        }

        if (image.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "이미지 조각은 10MB 이하만 전송할 수 있습니다"
            );
        }
    }

    private void validateTile(Mat image) {
        if (image.empty()) {
            throw new IllegalArgumentException(
                    "읽을 수 없는 이미지 파일입니다"
            );
        }

        if (image.cols() > MAX_TILE_SIDE
                || image.rows() > MAX_TILE_SIDE) {

            throw new IllegalArgumentException(
                    "겹침 영역을 포함한 이미지 조각의 "
                            + "가로·세로는 각각 "
                            + MAX_TILE_SIDE
                            + "픽셀 이하여야 합니다"
            );
        }
    }

    private void normalizeBackground(
            Mat gray,
            Mat background,
            Mat normalized
    ) {
        // 타일 크기와 관계없이 동일한 커널과 sigma 사용
        Imgproc.GaussianBlur(
                gray,
                background,
                new Size(BLUR_KERNEL_SIZE, BLUR_KERNEL_SIZE),
                BACKGROUND_SIGMA,
                BACKGROUND_SIGMA,
                Core.BORDER_REFLECT_101
        );

        // 배경 밝기가 0인 경우를 방지
        Core.max(
                background,
                new Scalar(1),
                background
        );

        // 원본 밝기 / 배경 밝기 × 255
        Core.divide(
                gray,
                background,
                normalized,
                255.0
        );
    }
}