package io.github.EEES0.docxeditor.controller;


import io.github.EEES0.docxeditor.dto.createFile.CreateFileRequest;
import io.github.EEES0.docxeditor.service.CreateDocx;
//import io.github.EEES0.docxeditor.service.CreateHwp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final CreateDocx createDocx;
    public ApiController(CreateDocx createDocx) {
        this.createDocx = createDocx;
    }
    private static final Logger log = LoggerFactory.getLogger(ApiController.class);

    @GetMapping("/ping")
    public String ping() {
        return "wakeup";
    }

    @PostMapping("/docx")
    public ResponseEntity<byte[]> createDocxByte(@RequestBody CreateFileRequest request) throws IOException {
        byte[] file = createDocx.createDocxByte(request);
        log.info("Request JSON : {}", request);

        return ResponseEntity.ok()
                .header("Content-Disposition","attachment")
                .header(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )
                .body(file);

    }
    /*
    @PostMapping("/hwp")
    public ResponseEntity<byte[]> createHwpByte(@RequestBody CreateFileRequest request) throws Exception {
        byte[] file = createHwp.createHwpByte(request);

        return ResponseEntity.ok()
                .header("Content-Disposition","attachment")
                .header(
                        "Content-Type",
                        "application/vnd.hancom.hwp"
                )
                .body(file);
    }
     */

}
