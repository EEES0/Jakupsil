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

    public byte[] convertDocxToPdf(MultipartFile file) throws IOException, InterruptedException {
        String python = System.getenv()
                .getOrDefault(
                        "PYTHON_EXECUTABLE",
                        "python/.venv/Scripts/python.exe"
                );

        String script = System.getenv()
                .getOrDefault(
                        "PYTHON_SCRIPT",
                        "python/convertDocxToPdf.py"
                );

        ProcessBuilder builder = new ProcessBuilder(
                python,
                script
        );

        Process process = builder.start();
        builder.redirectError(ProcessBuilder.Redirect.INHERIT);

        try (OutputStream output = process.getOutputStream()) {
            file.getInputStream().transferTo(output);
        }

        ByteArrayOutputStream pdfOutput = new ByteArrayOutputStream();

        try (InputStream input = process.getInputStream()) {
            input.transferTo(pdfOutput);
        }

        boolean finished = process.waitFor(60, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            throw new IOException("PDF 변환 시간 초과");
        }

        if (process.exitValue() != 0) {
            throw new IOException("PDF 변환 실패");
        }

        return pdfOutput.toByteArray();
    }
}
