import { initTheme } from "./editor/theme.js";
import { initServerPing } from "./editor/server.js?v=20261011-1";

initTheme();
initServerPing();

const form = document.getElementById("convert-form");
const fileInput = document.getElementById("docx-file");
const selectedFile = document.getElementById("selected-file");
const convertButton = document.getElementById("convert-button");
const status = document.getElementById("convert-status");
const downloadLink = document.getElementById("converted-download");
let downloadUrl = null;
let isConverting = false;

function clearDownload() {
    downloadLink.hidden = true;
    downloadLink.removeAttribute("href");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
}

function isValidFile(file) {
    return Boolean(file && /.docx$/i.test(file.name) && file.size > 0);
}

fileInput.addEventListener("change", () => {
    clearDownload();
    const file = fileInput.files[0];
    convertButton.disabled = !isValidFile(file);
    status.textContent = "";
    selectedFile.textContent = file
        ? file.name + " · " + (file.size / 1024).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + " KB"
        : "선택된 파일이 없습니다.";
    if (file && !isValidFile(file)) {
        status.textContent = "내용이 있는 .docx 파일을 선택해주세요.";
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isConverting) return;
    const file = fileInput.files[0];
    if (!isValidFile(file)) {
        status.textContent = "내용이 있는 .docx 파일을 선택해주세요.";
        fileInput.focus();
        return;
    }
    clearDownload();
    isConverting = true;
    convertButton.disabled = true;
    fileInput.disabled = true;
    convertButton.textContent = "변환 중…";
    convertButton.setAttribute("aria-busy", "true");
    status.textContent = "PDF로 변환하고 있습니다. 서버가 시작 중이면 시간이 걸릴 수 있습니다.";

    try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/conversion/docx-pdf", { method: "POST", body });
        if (!response.ok) {
            if (response.status === 413) throw new Error("파일이 너무 큽니다. 더 작은 DOCX 파일로 다시 시도해주세요.");
            if (response.status === 400 || response.status === 415) throw new Error("변환할 수 없는 파일입니다. DOCX 파일을 확인해주세요.");
            throw new Error("파일을 변환하지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
        const pdf = await response.blob();
        if (!pdf.size || !(response.headers.get("Content-Type") || "").toLowerCase().includes("application/pdf")) {
            throw new Error("PDF 파일을 받지 못했습니다. 다시 시도해주세요.");
        }
        downloadUrl = URL.createObjectURL(pdf);
        downloadLink.href = downloadUrl;
        downloadLink.download = file.name.replace(/.docx$/i, ".pdf");
        downloadLink.hidden = false;
        status.textContent = "변환 완료. PDF 파일 저장 버튼을 눌러 다운로드해주세요.";
    } catch (error) {
        status.textContent = error instanceof TypeError
            ? "서버에 연결할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요."
            : error.message;
    } finally {
        isConverting = false;
        fileInput.disabled = false;
        convertButton.disabled = !isValidFile(fileInput.files[0]);
        convertButton.textContent = "PDF로 변환";
        convertButton.setAttribute("aria-busy", "false");
    }
});
window.addEventListener("pagehide", clearDownload);