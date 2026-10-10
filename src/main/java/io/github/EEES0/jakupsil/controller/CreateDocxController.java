package io.github.EEES0.jakupsil.controller;


import io.github.EEES0.jakupsil.dto.createFile.CreateFileRequest;
import io.github.EEES0.jakupsil.service.CreateDocx;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@RestController
@RequestMapping("/api/documents/docx")
public class CreateDocxController {
    private final CreateDocx createDocx;
    private final ObjectMapper objectMapper;

    public CreateDocxController(CreateDocx createDocx, ObjectMapper objectMapper) {
        this.createDocx = createDocx;
        this.objectMapper = objectMapper;
    }
    private static final Logger log = LoggerFactory.getLogger(CreateDocxController.class);

    @PostMapping("")
    public ResponseEntity<byte[]> createDocxByte(@RequestBody CreateFileRequest request) throws IOException {
        byte[] file = createDocx.createDocxByte(request);
        log.info("DOCX Request JSON : {}", objectMapper.writeValueAsString(request));

        return ResponseEntity.ok()
                .header("Content-Disposition","attachment")
                .header(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )
                .body(file);

    }

   }
