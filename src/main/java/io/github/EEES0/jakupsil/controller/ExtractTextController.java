package io.github.EEES0.jakupsil.controller;

import io.github.EEES0.jakupsil.service.ExtractText;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/image-text")
public class ExtractTextController {
    private final ExtractText extractText;

    public ExtractTextController(ExtractText extractText) {
        this.extractText = extractText;
    }

    @PostMapping("")
    public ResponseEntity<String> extractText(@RequestParam("image")MultipartFile request) throws TesseractException, IOException {
        String result = extractText.extractText(request);
        return ResponseEntity.ok()
                .header(
                        "Content-Type",
                        "text/plain")
                .body(result);
    }
}
