package io.github.EEES0.docxeditor.controller;

import io.github.EEES0.docxeditor.dto.CreateDocxRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.RequestBody;

import java.io.IOException;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(DocxController.class)
public class DocxControllerTest {

    @Autowired
    private MockMvc mockMvc;
    private byte[] expected = {};

    @Test
    void CreateDocxTest() throws Exception {
        mockMvc.perform(post("/docx"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .andExpect(content().bytes(expected));

    }
}

