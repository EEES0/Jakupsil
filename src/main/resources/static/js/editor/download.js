export function initDownload(editor) {
    const titleInput = document.getElementById("doc-title");
    const downloadButton = document.getElementById("docx-download");
    const fileFormatSelect = document.getElementById("file-format");
    const downloadStatus = document.getElementById("download-status");
    const downloadEndpoints = {
        docx: "/api/docx",
        hwp: "/api/hwp",
        pdf: "/api/pdf"
    };

    fileFormatSelect.addEventListener("change", () => {
        downloadStatus.textContent = "";
    });

    downloadButton.addEventListener("click", async () => {
        if (downloadButton.disabled) return;

        const extension = fileFormatSelect.value;
        const endpoint = downloadEndpoints[extension];
        if (!endpoint) {
            downloadStatus.textContent = "지원하는 파일 형식을 선택해주세요.";
            return;
        }

        const filename = (titleInput.value.trim() || "제목") + "." + extension;
        downloadButton.disabled = true;
        fileFormatSelect.disabled = true;
        downloadButton.textContent = "생성 중…";
        downloadButton.setAttribute("aria-busy", "true");
        downloadStatus.textContent = extension.toUpperCase() + " 파일을 생성하고 있습니다. 잠시 기다려주세요.";

        try {
            const content = editor.getJSON();
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: content.content
                })
            });

            if (!response.ok) {
                throw new Error("파일 생성 실패: " + response.status);
            }

            const result = await response.blob();
            const url = URL.createObjectURL(result);
            const a = document.createElement("a");
            try {
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
            } finally {
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            downloadStatus.textContent = filename + " 다운로드를 시작했습니다.";
        } catch (error) {
            console.error("파일 다운로드 실패:", error);
            downloadStatus.textContent = "파일을 다운로드하지 못했습니다. 서버 연결 및 선택한 형식의 지원 여부를 확인하고 다시 시도해주세요.";
        } finally {
            downloadButton.disabled = false;
            fileFormatSelect.disabled = false;
            downloadButton.textContent = "다운로드";
            downloadButton.setAttribute("aria-busy", "false");
        }
    });
}
