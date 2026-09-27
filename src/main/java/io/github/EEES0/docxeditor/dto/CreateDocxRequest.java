package io.github.EEES0.docxeditor.dto;

import java.util.List;

public record CreateDocxRequest(
        long time,
        List<EditorBlock> blocks,
        String version
) {
}