package io.github.EEES0.docxeditor.dto;

import java.util.List;

public record CreateDocxRequest(
        String type,
        List<ContentNode> content
) {
}