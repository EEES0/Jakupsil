export function initDownload(editor, documentFormat) {
    const titleInput = document.getElementById("doc-title");
    const downloadButton = document.getElementById("file-download");
    const fileFormatSelect = document.getElementById("file-format");
    const downloadStatus = document.getElementById("download-status");
    const downloadEndpoints = {
        docx: "/api/docx",
        pdf: "/api/pdf"
    };

    const pdfSaveControls = document.getElementById("pdf-save-controls");
    const pdfSaveLink = document.getElementById("pdf-save-link");
    const pdfShareButton = document.getElementById("pdf-share-button");
    let pdfUrl = null;
    let pdfFile = null;

    if (pdfShareButton) {
        pdfShareButton.addEventListener("click", async () => {
            if (!pdfFile || pdfShareButton.disabled) return;
            pdfShareButton.disabled = true;
            try {
                await navigator.share({ files: [pdfFile] });
                downloadStatus.textContent = "공유 창에서 파일 저장을 선택해주세요.";
            } catch (error) {
                if (error.name !== "AbortError") {
                    downloadStatus.textContent = "공유할 수 없습니다. PDF 파일 저장 버튼을 이용해주세요.";
                }
            } finally {
                pdfShareButton.disabled = false;
            }
        });
    }

    downloadButton.addEventListener("click", async () => {
        if (downloadButton.disabled) return;

        const extension = documentFormat;
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
            if (extension === "pdf" && pdfSaveControls && pdfSaveLink) {
                // PDF 미리보기 대신 다운로드를 요청하며 원본 바이트는 유지합니다.
                const downloadBlob = new Blob([result], { type: "application/octet-stream" });
                const nextUrl = URL.createObjectURL(downloadBlob);
                if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                pdfUrl = nextUrl;
                pdfSaveLink.href = pdfUrl;
                pdfSaveLink.download = filename;
                pdfSaveControls.hidden = false;
                pdfFile = new File([result], filename, { type: "application/pdf" });
                let canShareFile = false;
                try {
                    canShareFile = typeof navigator.share === "function"
                        && typeof navigator.canShare === "function"
                        && navigator.canShare({ files: [pdfFile] });
                } catch (error) {
                    // 공유가 제한되어도 다운로드 링크는 사용할 수 있습니다.
                }
                if (pdfShareButton) pdfShareButton.hidden = !canShareFile;
                downloadStatus.textContent = filename + " 생성 완료. PDF 파일 저장 버튼을 눌러 다운로드해주세요."
                    + (canShareFile ? " 미리보기로 열리면 공유하여 저장을 이용해주세요." : "");
            } else {
                const url = URL.createObjectURL(result);
                const a = document.createElement("a");
                try {
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                } finally {
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                }
                downloadStatus.textContent = filename + " 다운로드를 시작했습니다.";
            }
        } catch (error) {
            console.error("파일 다운로드 실패:", error);
            downloadStatus.textContent = "파일을 다운로드하지 못했습니다. 서버 연결 및 선택한 형식의 지원 여부를 확인하고 다시 시도해주세요.";
        } finally {
            downloadButton.disabled = false;
            fileFormatSelect.disabled = true;
            downloadButton.textContent = "다운로드";
            downloadButton.setAttribute("aria-busy", "false");
        }
    });
}
