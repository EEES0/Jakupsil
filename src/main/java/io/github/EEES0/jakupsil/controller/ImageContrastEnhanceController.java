package io.github.EEES0.jakupsil.controller;

import io.github.EEES0.jakupsil.service.ConvertImageToPdf;
import io.github.EEES0.jakupsil.service.ImageContrastEnhance;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/enhancement/image")
public class ImageContrastEnhanceController {
    private final ImageContrastEnhance imageContrastEnhance;
    private final ConvertImageToPdf convertImageToPdf;
    public ImageContrastEnhanceController(ImageContrastEnhance imageContrastEnhance, ConvertImageToPdf convertImageToPdf) {
        this.imageContrastEnhance = imageContrastEnhance;
        this.convertImageToPdf = convertImageToPdf;
    }

    @PostMapping("")
    public ResponseEntity<byte[]> imageContrastEnhance(@RequestParam("images")MultipartFile request) throws IOException {
        byte[] result = imageContrastEnhance.imageContrastEnhance(request);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment")
                .header(
                        "Content-Type",
                        "image/png"
                )
                .body(result);
    }
}
