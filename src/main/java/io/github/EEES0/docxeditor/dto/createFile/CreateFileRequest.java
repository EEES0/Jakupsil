package io.github.EEES0.docxeditor.dto.createFile;

import java.util.List;

public record CreateFileRequest(
        String type,
        List<ContentNode> content
) {
}