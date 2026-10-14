export const TILE_SIZE = 1024;
export const TILE_OVERLAP = 192;
export const MAX_PIXELS = 64000000;
export const MAX_DIMENSION = 16384;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

export function* createTiles(width, height) {
    for (let y = 0; y < height; y += TILE_SIZE) {
        for (let x = 0; x < width; x += TILE_SIZE) {
            const center = { x, y, width: Math.min(TILE_SIZE, width - x), height: Math.min(TILE_SIZE, height - y) };
            const left = Math.max(0, x - TILE_OVERLAP);
            const top = Math.max(0, y - TILE_OVERLAP);
            const right = Math.min(width, x + center.width + TILE_OVERLAP);
            const bottom = Math.min(height, y + center.height + TILE_OVERLAP);
            yield { center, expanded: { x: left, y: top, width: right - left, height: bottom - top }, crop: { x: x - left, y: y - top } };
        }
    }
}

export function checkAbort(signal) {
    if (signal.aborted) throw new DOMException("취소됨", "AbortError");
}

export function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
        try {
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("이미지를 저장하지 못했습니다. 크기를 줄여 다시 시도해주세요.")), "image/png");
        } catch (error) { reject(error); }
    });
}

export function prepareCanvas(canvas, width, height) {
    try {
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 생성 실패");
        context.clearRect(0, 0, width, height);
        // 일부 브라우저는 한도를 넘는 Canvas를 조용히 생성합니다.
        context.fillRect(width - 1, height - 1, 1, 1);
        if (context.getImageData(width - 1, height - 1, 1, 1).data[3] !== 255) throw new Error("Canvas 크기 초과");
        context.clearRect(0, 0, width, height);
        return context;
    } catch {
        throw new Error("이미지를 처리하지 못했습니다. 크기를 줄여 다시 시도해주세요.");
    }
}

function waitRetry(ms, signal) {
    return new Promise((resolve, reject) => {
        checkAbort(signal);
        const abort = () => { clearTimeout(timer); reject(new DOMException("취소됨", "AbortError")); };
        const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
        signal.addEventListener("abort", abort, { once: true });
    });
}

export async function requestTile(blob, signal, onRetry = () => {}, expected) {
    for (let attempt = 0; ; attempt++) {
        checkAbort(signal);
        try {
            const body = new FormData();
            body.append("images", blob, "tile.png");
            const response = await fetch("/api/enhancement/image", { method: "POST", body, signal });
            if (!response.ok) {
                const error = new Error("보정에 실패했습니다. 다시 시도해주세요.");
                error.retryable = response.status >= 500 || response.status === 408 || response.status === 429;
                throw error;
            }
            if ((response.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase() !== "image/png") {
                const error = new Error("보정된 이미지를 받지 못했습니다. 다시 시도해주세요.");
                error.retryable = false;
                throw error;
            }
            const result = await response.blob();
            if (!result.size) throw new Error("보정된 이미지를 받지 못했습니다. 다시 시도해주세요.");
            checkAbort(signal);
            if (!expected) return result;
            let bitmap;
            try {
                bitmap = await createImageBitmap(result);
                checkAbort(signal);
                if (bitmap.width !== expected.width || bitmap.height !== expected.height) {
                    const error = new Error("보정된 이미지 크기가 달라 처리를 중단했습니다. 다시 시도해주세요.");
                    error.retryable = false;
                    throw error;
                }
                return bitmap;
            } catch (error) { bitmap?.close(); throw error; }
        } catch (error) {
            checkAbort(signal);
            if (error.name === "AbortError" || error.retryable === false || attempt >= MAX_RETRIES) throw error;
            onRetry(attempt + 1);
            await waitRetry(RETRY_DELAY * (attempt + 1), signal);
        }
    }
}

export async function processTiles(original, output, signal, onProgress) {
    const { width, height } = original;
    if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS) {
        throw new Error("이미지 해상도가 너무 큽니다. 크기를 줄여 다시 선택해주세요.");
    }
    const target = prepareCanvas(output, width, height);
    const work = document.createElement("canvas");
    const total = Math.ceil(width / TILE_SIZE) * Math.ceil(height / TILE_SIZE);
    let completed = 0;
    onProgress(completed, total);
    try {
        for (const tile of createTiles(width, height)) {
            checkAbort(signal);
            const { center: c, expanded: e, crop } = tile;
            const context = prepareCanvas(work, e.width, e.height);
            context.drawImage(original, e.x, e.y, e.width, e.height, 0, 0, e.width, e.height);
            const blob = await canvasBlob(work);
            checkAbort(signal);
            if (blob.size > 10 * 1024 * 1024) throw new Error("이미지 크기를 줄여 다시 시도해주세요.");
            let bitmap;
            try {
                bitmap = await requestTile(blob, signal, retry => onProgress(completed, total, retry), e);
                checkAbort(signal);
                if (bitmap.width !== e.width || bitmap.height !== e.height) {
                    throw new Error("보정된 이미지 크기가 달라 처리를 중단했습니다. 다시 시도해주세요.");
                }
                target.drawImage(bitmap, crop.x, crop.y, c.width, c.height, c.x, c.y, c.width, c.height);
            } finally { bitmap?.close(); }
            completed++;
            onProgress(completed, total);
        }
    } finally { work.width = work.height = 0; }
}
