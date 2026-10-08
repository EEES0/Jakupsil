package io.github.EEES0.docxeditor.dto.createFile;
import java.util.ArrayList;
import java.util.List;
public record ContentNode(
        String type,
        Attrs attrs,
        List<TextNode> content
    ) {
}

