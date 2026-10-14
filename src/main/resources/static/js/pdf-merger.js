import { initTheme } from "./editor/theme.js";
import { initServerPing } from "./editor/server.js?v=20261011-1";

initTheme();
initServerPing();

const form = document.getElementById("convert-form");
const fileInput = document.getElementById("pdf-files");
const list = document.getElementById("pdf-list");
const selectedFile = document.getElementById("selected-file");
const pageCount = document.getElementById("file-count");
const titleInput = document.getElementById("pdf-title");
const convertButton = document.getElementById("convert-button");
const status = document.getElementById("convert-status");
let files = [];
let isConverting = false;

function renderFiles() {
    list.replaceChildren();
    files.forEach((item, index) => {
        const row = document.createElement("li");
        row.className = "image-item";
        const details = document.createElement("div");
        details.className = "image-details";
        const name = document.createElement("p");
        name.textContent = item.file.name;
        const info = document.createElement("small");
        info.textContent = (index + 1) + "번째 파일 · " + (item.file.size / 1024).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + " KB";
        details.append(name, info);
        const actions = document.createElement("div");
        actions.className = "image-actions";
        for (const [action, label] of [["up", "↑"], ["down", "↓"], ["remove", "삭제"]]) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.dataset.action = action;
            button.dataset.index = String(index);
            button.setAttribute("aria-label", item.file.name + " " + ({ up: "앞 순서로 이동", down: "뒤 순서로 이동", remove: "삭제" })[action]);
            button.disabled = isConverting || (action === "up" && index === 0) || (action === "down" && index === files.length - 1);
            actions.append(button);
        }
        row.append(details, actions);
        list.append(row);
    });
    selectedFile.textContent = files.length ? files.length + "개 선택됨 · 각 파일의 모든 페이지를 순서대로 합칩니다." : "선택된 PDF가 없습니다.";
    pageCount.textContent = files.length + "개 파일";
    convertButton.disabled = isConverting || files.length < 2;
}

fileInput.addEventListener("change", () => {
    if (isConverting) return;
    let rejected = 0;
    for (const file of fileInput.files) {
        if (!file.size || !/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) {
            rejected += 1;
            continue;
        }
        files.push({ file });
    }
    fileInput.value = "";
    renderFiles();
    status.textContent = rejected ? rejected + "개 파일을 추가하지 못했습니다. 내용이 있는 PDF 파일만 선택해주세요." : "";
});

list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || isConverting || button.disabled) return;
    const index = Number(button.dataset.index);
    const action = button.dataset.action;
    if (action === "remove") {
        files.splice(index, 1);
    } else {
        const target = index + (action === "up" ? -1 : 1);
        if (target < 0 || target >= files.length) return;
        [files[index], files[target]] = [files[target], files[index]];
    }
    renderFiles();
    status.textContent = action === "remove" ? "PDF를 목록에서 삭제했습니다." : "파일 순서를 변경했습니다.";
    const focusIndex = Math.min(action === "remove" ? index : index + (action === "up" ? -1 : 1), files.length - 1);
    const next = list.children[focusIndex]?.querySelector('button[data-action="remove"]');
    (next || fileInput).focus();
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isConverting) return;
    if (files.length < 2) {
        status.textContent = "PDF 파일을 2개 이상 선택해주세요.";
        fileInput.focus();
        return;
    }
    const title = titleInput.value.trim().replace(/\.pdf$/i, "");
    const filename = title ? title + ".pdf" : files[0].file.name;
    isConverting = true;
    fileInput.disabled = true;
    titleInput.disabled = true;
    convertButton.textContent = "합치는 중…";
    convertButton.setAttribute("aria-busy", "true");
    renderFiles();
    status.textContent = files.length + "개의 PDF를 합치고 있습니다.";
    try {
        const body = new FormData();
        files.forEach(({ file }) => body.append("files", file));
        const response = await fetch("/api/pdf/merge", { method: "POST", body });
        if (!response.ok) {
            if (response.status === 413) throw new Error("PDF 용량이 너무 큽니다. 파일 수나 용량을 줄여주세요.");
            if (response.status === 400 || response.status === 415) throw new Error("합칠 수 없는 파일입니다. PDF 파일을 확인해주세요.");
            if (response.status === 404 || response.status === 405) throw new Error("합치기에 실패했습니다. 잠시 후 다시 시도해주세요.");
            throw new Error("PDF를 합치지 못했습니다. 손상되었거나 암호가 설정된 PDF인지 확인해주세요.");
        }
        const pdf = await response.blob();
        if (!pdf.size || !(response.headers.get("Content-Type") || "").toLowerCase().includes("application/pdf")) {
            throw new Error("PDF 파일을 받지 못했습니다. 다시 시도해주세요.");
        }
        const url = URL.createObjectURL(pdf);
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
        status.textContent = "합치기 완료. " + filename + " 다운로드를 시작했습니다.";
    } catch (error) {
        status.textContent = error instanceof TypeError ? "연결에 실패했습니다. 다시 시도해주세요." : error.message;
    } finally {
        isConverting = false;
        fileInput.disabled = false;
        titleInput.disabled = false;
        convertButton.textContent = "PDF 합치기";
        convertButton.setAttribute("aria-busy", "false");
        renderFiles();
    }
});

renderFiles();
