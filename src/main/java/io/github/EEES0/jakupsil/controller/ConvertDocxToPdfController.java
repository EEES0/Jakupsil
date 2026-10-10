package io.github.EEES0.jakupsil.controller;

import io.github.EEES0.jakupsil.service.ConvertDocxToPdf;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/conversion/docx-pdf")
public class ConvertDocxToPdfController {

    private final ConvertDocxToPdf convertDocxToPdf;

    public ConvertDocxToPdfController(ConvertDocxToPdf convertDocxToPdf) {
        this.convertDocxToPdf = convertDocxToPdf;
    }
    @PostMapping("")
    public ResponseEntity<byte[]> convertDocxToPdf(@RequestParam("file")MultipartFile request) throws IOException, InterruptedException {
        byte[] file = convertDocxToPdf.convertDocxToPdf(request);
        return ResponseEntity.ok()
                .header("Content-Disposition","attachment")
                .header(
                        "Content-Type",
                        "application/pdf"
                )
                .body(file);
    }
}
