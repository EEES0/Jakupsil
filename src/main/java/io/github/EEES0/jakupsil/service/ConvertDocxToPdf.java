
package io.github.EEES0.jakupsil.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.TimeUnit;

@Service
public class ConvertDocxToPdf {

    public byte[] convertDocxToPdf(MultipartFile file)
            throws IOException, InterruptedException {

        String python = System.getenv("PYTHON_EXECUTABLE");

        if (python == null || python.isBlank()) {
            String os = System.getProperty("os.name").toLowerCase();

            if (os.contains("win")) {
                python = "python/.venv/Scripts/python.exe";
            } else {
                python = "python3";
            }
        }

        String script = System.getenv()
                .getOrDefault(
                        "PYTHON_SCRIPT",
                        "python/convertDocxToPdf.py"
                );

        ProcessBuilder builder = new ProcessBuilder(
                python,
                script
        );

        // Python의 오류 메시지는 서버 로그에 출력
        // stdout은 PDF 바이너리 데이터 전용
        builder.redirectError(ProcessBuilder.Redirect.INHERIT);

        Process process = builder.start();

        try {
            // DOCX 데이터를 Python stdin으로 전달
            try (InputStream fileInput = file.getInputStream();
                 OutputStream processInput = process.getOutputStream()) {

                fileInput.transferTo(processInput);
            }

            ByteArrayOutputStream pdfOutput = new ByteArrayOutputStream();

            // Python stdout에서 PDF 데이터 읽기
            try (InputStream processOutput = process.getInputStream()) {
                processOutput.transferTo(pdfOutput);
            }

            boolean finished = process.waitFor(60, TimeUnit.SECONDS);

            if (!finished) {
                throw new IOException("PDF 변환 시간 초과");
            }

            int exitCode = process.exitValue();

            if (exitCode != 0) {
                throw new IOException(
                        "PDF 변환 실패. Python 종료 코드: " + exitCode
                );
            }

            byte[] pdfBytes = pdfOutput.toByteArray();

            if (pdfBytes.length == 0) {
                throw new IOException("PDF 변환 결과가 비어 있습니다.");
            }

            return pdfBytes;

        } finally {
            if (process.isAlive()) {
                process.destroyForcibly();
                process.waitFor();
            }
        }
    }
}
