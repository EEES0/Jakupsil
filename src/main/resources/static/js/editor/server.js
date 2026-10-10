export function initServerPing() {
    async function pingServer() {
        try {
            const response = await fetch("/api/ping/ping", {
                cache: "no-store"
            });

            if (!response.ok) {
                console.warn("서버 확인 실패:", response.status);
            }
        } catch (error) {
            console.warn("서버에 연결할 수 없습니다:", error);
        }
    }

    pingServer();

    setInterval(() => {
        if (document.visibilityState === "visible") {
            pingServer();
        }
    }, 5 * 60 * 1000);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            pingServer();
        }
    });
}
