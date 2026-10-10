package io.github.EEES0.jakupsil.dto.createFile;

import java.util.List;

public record TextNode(
        String type,
        String text,
        List<Mark> marks
) {
}
