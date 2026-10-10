import { initTheme } from "./editor/theme.js";

(() => {
    const searchInput = document.getElementById("tool-search");
    const searchStatus = document.getElementById("search-status");
    const emptyState = document.getElementById("empty-state");
    const sections = [...document.querySelectorAll(".tool-section")].map((section) => ({
        section,
        count: section.querySelector(".section-count"),
        cards: [...section.querySelectorAll(".tool-card")]
    }));

    function normalizeName(value) {
        return value.toLocaleLowerCase().replace(/\s+/g, "");
    }

    function filterTools() {
        const query = normalizeName(searchInput.value);
        let total = 0;
        let available = 0;
        sections.forEach(({ section, count, cards }) => {
            let visibleCount = 0;
            cards.forEach((card) => {
                const matches = normalizeName(card.dataset.toolName + " " + (card.dataset.toolKeywords || "")).includes(query);
                card.hidden = !matches;
                if (matches) {
                    visibleCount += 1;
                    if (card.classList.contains("is-available")) available += 1;
                }
            });
            section.hidden = visibleCount === 0;
            count.textContent = visibleCount + "개 도구";
            total += visibleCount;
        });
        emptyState.hidden = total !== 0;
        searchStatus.textContent = (query ? "검색 결과 " : "") + total + "개 도구 · " + available + "개 사용 가능";
    }

    searchInput.addEventListener("input", filterTools);
    document.getElementById("reset-search").addEventListener("click", () => {
        searchInput.value = "";
        filterTools();
        searchInput.focus();
    });
    document.getElementById("search-field").hidden = false;
    filterTools();

    const themeKey = "jakupsil-theme";
    let savedTheme;
    try {
        savedTheme = localStorage.getItem(themeKey);
    } catch (error) {
        // 저장소를 사용할 수 없어도 테마 전환은 유지합니다.
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.classList.toggle("dark", savedTheme === "dark" || (savedTheme !== "light" && prefersDark));
    initTheme();
    ["dark-mode", "white-mode"].forEach((id) => {
        document.getElementById(id).addEventListener("click", () => {
            try {
                localStorage.setItem(themeKey, document.body.classList.contains("dark") ? "dark" : "light");
            } catch (error) {
                // 저장소를 사용할 수 없는 환경에서는 현재 화면에만 적용합니다.
            }
        });
    });
})();