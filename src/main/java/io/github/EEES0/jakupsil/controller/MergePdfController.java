package io.github.EEES0.jakupsil.controller;

import io.github.EEES0.jakupsil.service.MergePdf;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/pdf/merge")
public class MergePdfController {
    private final MergePdf mergePdf;
    private MergePdfController(MergePdf mergePdf) {
        this.mergePdf = mergePdf;
    }

    @PostMapping("")
    public ResponseEntity<byte[]> mergePdf(@RequestParam("files")MultipartFile[] files) throws IOException {
        byte[] file = mergePdf.mergePdf(files);
        return ResponseEntity.ok()
                .header("Content-Disposition","attachment")
                .header(
                        "Content-Type",
                        "application/pdf"
                )
                .body(file);
    }
}
