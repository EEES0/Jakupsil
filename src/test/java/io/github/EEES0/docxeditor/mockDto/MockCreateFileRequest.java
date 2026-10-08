package io.github.EEES0.docxeditor.mockDto;

import io.github.EEES0.docxeditor.dto.createFile.*;

import java.util.List;

public class MockCreateFileRequest {
    public static CreateFileRequest mockCreateFileRequest() {
        MarkAttrs markAttrs = new MarkAttrs("24px");
        List<Mark> marks = List.of(
                new Mark("textStyle", markAttrs),
                new Mark("underline", null),
                new Mark("bold", null),
                new Mark("italic", null)
        );
        TextNode textNode = new TextNode(
                "text",
                "test text",
                marks
        );

        ContentNode contentNode = new ContentNode(
                "paragraph",
                new Attrs("center"),
                List.of(textNode)
        );

        return new CreateFileRequest(null, List.of(contentNode));
    }
}
