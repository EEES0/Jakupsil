package io.github.EEES0.jakupsil.controller;

import io.github.EEES0.jakupsil.service.ConvertImageToPdf;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/conversion/image-pdf")
public class ConvertImageToPdfController {
    private final ConvertImageToPdf convertImageToPdf;

    private ConvertImageToPdfController(ConvertImageToPdf convertImageToPdf) {
        this.convertImageToPdf = convertImageToPdf;
    }

    @PostMapping("")
    public ResponseEntity<byte[]> convertImageToPdf(@RequestParam("images")MultipartFile[] images) throws IOException {
        byte[] file = convertImageToPdf.convertImageToPdf(images);
        return ResponseEntity.ok()
                .header("Content-Disposition","attachment")
                .header(
                        "Content-Type",
                        "application/pdf"
                )
                .body(file);
    }
}
