package io.github.EEES0.jakupsil.dto.createFile;
import java.util.List;
public record ContentNode(
        String type,
        Attrs attrs,
        List<TextNode> content
    ) {
}

