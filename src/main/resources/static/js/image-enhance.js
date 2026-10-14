import { initTheme } from "./editor/theme.js";
import { initServerPing } from "./editor/server.js?v=20261011-1";

initTheme();
initServerPing();

const form = document.getElementById("convert-form");
const fileInput = document.getElementById("enhance-image");
const selectedFile = document.getElementById("selected-file");
const convertButton = document.getElementById("convert-button");
const saveTypeSelect = document.getElementById("save-type");
const status = document.getElementById("convert-status");
let isConverting = false;

function isValidFile(file) {
    return Boolean(fileInput.files.length === 1 && file && ["image/jpeg", "image/png"].includes(file.type) && file.size > 0 && file.size <= 10 * 1024 * 1024);
}

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    convertButton.disabled = !isValidFile(file);
    status.textContent = "";
    selectedFile.textContent = file
        ? file.name + " · " + (file.size / 1024).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + " KB"
        : "선택된 파일이 없습니다.";
    if (file && !isValidFile(file)) {
        status.textContent = "10MB 이하의 JPG·PNG 이미지 한 장을 선택해주세요.";
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isConverting) return;
    const file = fileInput.files[0];
    if (!isValidFile(file)) {
        status.textContent = "10MB 이하의 JPG·PNG 이미지 한 장을 선택해주세요.";
        fileInput.focus();
        return;
    }
    const saveType = saveTypeSelect.value;
    const mimeTypes = { png: "image/png", pdf: "application/pdf" };
    if (!mimeTypes[saveType]) {
        status.textContent = "PNG 또는 PDF 형식을 선택해주세요.";
        return;
    }
    const filename = file.name.replace(/\.[^.]+$/, "") + "." + saveType;
    isConverting = true;
    convertButton.disabled = true;
    fileInput.disabled = true;
    saveTypeSelect.disabled = true;
    convertButton.textContent = "처리 중…";
    convertButton.setAttribute("aria-busy", "true");
    status.textContent = "이미지 대비를 강조하고 있습니다. 잠시 기다려주세요.";

    try {
        const body = new FormData();
        body.append("images", file);
        body.append("saveType", saveType);
        const response = await fetch("/api/enhancement/image", { method: "POST", body });
        if (!response.ok) {
            if (response.status === 413) throw new Error("이미지가 너무 큽니다. 10MB 이하 이미지를 선택해주세요.");
            if (response.status === 400 || response.status === 415) throw new Error("처리할 수 없는 이미지입니다. 크기와 파일 형식을 확인해주세요.");
            throw new Error("이미지 처리에 실패했습니다. 읽을 수 있는 1,200만 픽셀 이하 이미지인지 확인해주세요.");
        }
        const result = await response.blob();
        if (!result.size || !(response.headers.get("Content-Type") || "").toLowerCase().includes(mimeTypes[saveType])) {
            throw new Error(saveType.toUpperCase() + " 파일을 받지 못했습니다. 다시 시도해주세요.");
        }
        const url = URL.createObjectURL(result);
        const link = document.createElement("a");
        try {
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
        } finally {
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        status.textContent = "처리 완료. " + filename + " 다운로드를 시작했습니다.";
    } catch (error) {
        status.textContent = error instanceof TypeError
            ? "서버에 연결할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요."
            : error.message;
    } finally {
        isConverting = false;
        fileInput.disabled = false;
        saveTypeSelect.disabled = false;
        convertButton.disabled = !isValidFile(fileInput.files[0]);
        convertButton.textContent = "대비 강조 후 다운로드";
        convertButton.setAttribute("aria-busy", "false");
    }
});
