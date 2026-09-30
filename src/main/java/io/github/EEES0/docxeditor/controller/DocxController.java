package io.github.EEES0.docxeditor.controller;


import io.github.EEES0.docxeditor.dto.CreateDocxRequest;
import io.github.EEES0.docxeditor.service.CreateDocx;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:63342")
public class DocxController {
    private final CreateDocx createDocx;

    public DocxController(CreateDocx createDocx) {
        this.createDocx = createDocx;
    }

    @PostMapping("/docx")
    public ResponseEntity<byte[]> createDocxByte(@RequestBody CreateDocxRequest request) throws IOException {
        byte[] file = createDocx.createDocxByte(request);

        return ResponseEntity.ok()
                .header(
                        "Content-Disposition",
                        "attachment; filename=report.docx"
                )
                .header(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )
                .body(file);
    }

}
