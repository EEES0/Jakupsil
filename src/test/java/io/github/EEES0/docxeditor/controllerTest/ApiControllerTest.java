package io.github.EEES0.docxeditor.controllerTest;


import io.github.EEES0.docxeditor.controller.ApiController;
import io.github.EEES0.docxeditor.dto.createFile.CreateFileRequest;
import io.github.EEES0.docxeditor.service.CreateDocx;
import io.github.EEES0.docxeditor.service.CreatePdf;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ApiController.class)
public class ApiControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private CreateDocx createDocx;
    @MockitoBean
    private CreatePdf createPdf;

    @Test
    public void createDocxByte() throws Exception {
        byte[] mockByte = "mock.docx".getBytes();
        given(createDocx.createDocxByte(any(CreateFileRequest.class)))
                .willReturn(mockByte);

        mockMvc.perform(post("/api/docx")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "type": "doc",
                          "content": [
                            {
                              "type": "paragraph",
                              "attrs": {
                                "textAlign": "center"
                              },
                              "content": [
                                {
                                  "type": "text",
                                  "text": "안녕하세요 ",
                                  "marks": [
                                    {
                                      "type": "bold"
                                    }
                                  ]
                                },
                                {
                                  "type": "text",
                                  "text": "큰 글씨",
                                  "marks": [
                                    {
                                      "type": "textStyle",
                                      "attrs": {
                                        "fontSize": "24px"
                                      }
                                    },
                                    {
                                      "type": "underline"
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(content().bytes(mockByte))
                .andExpect(header().string("Content-Type",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));

        then(createDocx).should().createDocxByte(any(CreateFileRequest.class));
    }
    //pdf 생성 테스트도 추가하기
}

