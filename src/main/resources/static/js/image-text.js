import { initTheme } from "./editor/theme.js";
import { initServerPing } from "./editor/server.js?v=20261015-1";

initTheme();
initServerPing();

const form = document.getElementById("convert-form");
const fileInput = document.getElementById("text-image");
const selectedFile = document.getElementById("selected-file");
const extractButton = document.getElementById("convert-button");
const status = document.getElementById("convert-status");
const resultSection = document.getElementById("text-result-section");
const resultText = document.getElementById("extracted-text");
const copyButton = document.getElementById("copy-text");
let controller = null;

function isValidSelection() {
    const file = fileInput.files[0];
    return fileInput.files.length === 1 && file && file.size > 0
        && ["image/jpeg", "image/png"].includes(file.type);
}

function resetResult() {
    resultText.value = "";
    resultSection.hidden = true;
    copyButton.disabled = true;
}

fileInput.addEventListener("change", () => {
    if (controller) return;
    resetResult();
    const file = fileInput.files[0];
    selectedFile.textContent = file ? file.name : "선택된 파일이 없습니다.";
    extractButton.disabled = !isValidSelection();
    status.textContent = file && !isValidSelection() ? "JPG·PNG 이미지 한 장을 선택해주세요." : "";
});

form.addEventListener("submit", async event => {
    event.preventDefault();
    if (controller) return;
    if (!isValidSelection()) {
        status.textContent = "JPG·PNG 이미지 한 장을 선택해주세요.";
        return;
    }
    resetResult();
    controller = new AbortController();
    const signal = controller.signal;
    fileInput.disabled = extractButton.disabled = true;
    extractButton.textContent = "추출 중…";
    extractButton.setAttribute("aria-busy", "true");
    status.textContent = "텍스트를 추출 중입니다.";
    try {
        const body = new FormData();
        body.append("image", fileInput.files[0]);
        const response = await fetch("/api/image-text", { method: "POST", body, signal });
        if (!response.ok) {
            if (response.status === 413) throw new Error("파일이 너무 큽니다. 크기를 줄여 다시 선택해주세요.");
            if (response.status === 400 || response.status === 415) throw new Error("이미지를 읽지 못했습니다. 다른 JPG·PNG 이미지를 선택해주세요.");
            throw new Error("텍스트 추출에 실패했습니다. 다시 시도해주세요.");
        }
        if ((response.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase() !== "text/plain") {
            throw new Error("텍스트를 받지 못했습니다. 다시 시도해주세요.");
        }
        const text = await response.text();
        if (signal.aborted) return;
        resultText.value = text;
        resultSection.hidden = false;
        copyButton.disabled = !text.trim();
        status.textContent = text.trim() ? "추출했습니다. 결과를 확인하고 복사하세요." : "인식된 글자가 없습니다. 글자가 선명한 사진을 선택해주세요.";
    } catch (error) {
        if (!signal.aborted) status.textContent = "텍스트 추출에 실패했습니다. 다시 시도해주세요.";
        if (!signal.aborted && !(error instanceof TypeError)) status.textContent = error.message;
    } finally {
        controller = null;
        fileInput.disabled = false;
        extractButton.disabled = !isValidSelection();
        extractButton.textContent = "텍스트 추출";
        extractButton.setAttribute("aria-busy", "false");
    }
});

copyButton.addEventListener("click", async () => {
    if (copyButton.disabled) return;
    copyButton.disabled = true;
    try {
        await navigator.clipboard.writeText(resultText.value);
        status.textContent = "복사했습니다.";
    } catch {
        resultText.focus();
        resultText.select();
        status.textContent = "텍스트를 선택했습니다. 직접 복사해주세요.";
    } finally { copyButton.disabled = !resultText.value.trim(); }
});

window.addEventListener("pagehide", () => controller?.abort());
extractButton.disabled = !isValidSelection();
