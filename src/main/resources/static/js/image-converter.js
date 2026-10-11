import { initTheme } from "./editor/theme.js";
import { initServerPing } from "./editor/server.js?v=20261011-1";

initTheme();
initServerPing();

const form = document.getElementById("convert-form");
const fileInput = document.getElementById("image-files");
const list = document.getElementById("image-list");
const selectedFile = document.getElementById("selected-file");
const pageCount = document.getElementById("page-count");
const titleInput = document.getElementById("pdf-title");
const convertButton = document.getElementById("convert-button");
const status = document.getElementById("convert-status");
let images = [];
let isConverting = false;

function renderImages() {
    list.replaceChildren();
    images.forEach((item, index) => {
        const row = document.createElement("li");
        row.className = "image-item";
        const preview = document.createElement("img");
        preview.src = item.url;
        preview.alt = "";
        const details = document.createElement("div");
        details.className = "image-details";
        const name = document.createElement("p");
        name.textContent = item.file.name;
        const info = document.createElement("small");
        info.textContent = (index + 1) + "페이지 · " + (item.file.size / 1024).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + " KB";
        details.append(name, info);
        const actions = document.createElement("div");
        actions.className = "image-actions";
        for (const [action, label] of [["up", "↑"], ["down", "↓"], ["remove", "삭제"]]) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.dataset.action = action;
            button.dataset.index = String(index);
            button.setAttribute("aria-label", item.file.name + " " + ({ up: "앞 페이지로 이동", down: "뒤 페이지로 이동", remove: "삭제" })[action]);
            button.disabled = isConverting || (action === "up" && index === 0) || (action === "down" && index === images.length - 1);
            actions.append(button);
        }
        row.append(preview, details, actions);
        list.append(row);
    });
    selectedFile.textContent = images.length ? images.length + "장 선택됨 · 목록 순서대로 PDF가 생성됩니다." : "선택된 이미지가 없습니다.";
    pageCount.textContent = images.length + "페이지";
    convertButton.disabled = isConverting || images.length === 0;
}

fileInput.addEventListener("change", () => {
    if (isConverting) return;
    let rejected = 0;
    for (const file of fileInput.files) {
        if (!file.size || !["image/jpeg", "image/png"].includes(file.type)) {
            rejected += 1;
            continue;
        }
        images.push({ file, url: URL.createObjectURL(file) });
    }
    fileInput.value = "";
    renderImages();
    status.textContent = rejected ? rejected + "개 파일을 추가하지 못했습니다. 내용이 있는 JPG·PNG 이미지만 선택해주세요." : "";
});

list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || isConverting || button.disabled) return;
    const index = Number(button.dataset.index);
    const action = button.dataset.action;
    if (action === "remove") {
        URL.revokeObjectURL(images[index].url);
        images.splice(index, 1);
    } else {
        const target = index + (action === "up" ? -1 : 1);
        if (target < 0 || target >= images.length) return;
        [images[index], images[target]] = [images[target], images[index]];
    }
    renderImages();
    status.textContent = action === "remove" ? "이미지를 목록에서 삭제했습니다." : "페이지 순서를 변경했습니다.";
    const focusIndex = Math.min(action === "remove" ? index : index + (action === "up" ? -1 : 1), images.length - 1);
    const next = list.children[focusIndex]?.querySelector('button[data-action="remove"]');
    (next || fileInput).focus();
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isConverting) return;
    if (!images.length) {
        status.textContent = "변환할 JPG·PNG 이미지를 선택해주세요.";
        fileInput.focus();
        return;
    }
    const title = titleInput.value.trim().replace(/\.pdf$/i, "");
    const filename = (title || images[0].file.name.replace(/\.[^.]+$/, "")) + ".pdf";
    isConverting = true;
    fileInput.disabled = true;
    titleInput.disabled = true;
    convertButton.textContent = "변환 중…";
    convertButton.setAttribute("aria-busy", "true");
    renderImages();
    status.textContent = images.length + "장의 이미지를 PDF로 변환하고 있습니다.";
    try {
        const body = new FormData();
        images.forEach(({ file }) => body.append("images", file));
        const response = await fetch("/api/conversion/image-pdf", { method: "POST", body });
        if (!response.ok) {
            if (response.status === 413) throw new Error("이미지 용량이 너무 큽니다. 파일 수나 용량을 줄여주세요.");
            if (response.status === 400 || response.status === 415) throw new Error("변환할 수 없는 이미지입니다. JPG·PNG 파일을 확인해주세요.");
            if (response.status === 404 || response.status === 405) throw new Error("이미지 변환 API에 연결되지 않았습니다. 서버 배포와 API 매핑을 확인해주세요.");
            throw new Error("이미지를 변환하지 못했습니다. 잠시 후 다시 시도해주세요.");
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
        status.textContent = "변환 완료. " + filename + " 다운로드를 시작했습니다.";
    } catch (error) {
        status.textContent = error instanceof TypeError ? "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요." : error.message;
    } finally {
        isConverting = false;
        fileInput.disabled = false;
        titleInput.disabled = false;
        convertButton.textContent = "PDF로 변환";
        convertButton.setAttribute("aria-busy", "false");
        renderImages();
    }
});

window.addEventListener("pagehide", (event) => {
    if (!event.persisted) images.forEach(({ url }) => URL.revokeObjectURL(url));
});
renderImages();
