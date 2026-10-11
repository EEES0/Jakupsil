package io.github.EEES0.jakupsil.dto.createFile;
import java.util.List;
public record ContentNode(
        String type,
        Attrs attrs,
        List<TextNode> content
    ) {
    @Override
    public String type() {
        return type;
    }

    @Override
    public Attrs attrs() {
        return attrs;
    }

    @Override
    public List<TextNode> content() {
        return content;
    }
}

