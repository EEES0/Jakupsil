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

    const themeButton = document.getElementById("theme-toggle");
    const themeLabel = document.getElementById("theme-label");
    const themeKey = "jakupsil-theme";
    let savedTheme;
    try {
        savedTheme = localStorage.getItem(themeKey);
    } catch (error) {
        // 저장소를 사용할 수 없어도 테마 전환은 유지합니다.
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    function setTheme(isDark) {
        document.body.classList.toggle("dark", isDark);
        themeButton.setAttribute("aria-pressed", String(isDark));
        themeButton.setAttribute("aria-label", isDark ? "라이트 모드" : "다크 모드");
        themeLabel.textContent = isDark ? "라이트 모드" : "다크 모드";
    }

    setTheme(savedTheme === "dark" || (savedTheme !== "light" && prefersDark));
    themeButton.hidden = false;
    themeButton.addEventListener("click", () => {
        const isDark = !document.body.classList.contains("dark");
        setTheme(isDark);
        try {
            localStorage.setItem(themeKey, isDark ? "dark" : "light");
        } catch (error) {
            // 저장소를 사용할 수 없는 환경에서는 현재 화면에만 적용합니다.
        }
    });
})();
