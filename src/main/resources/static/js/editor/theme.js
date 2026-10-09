export function initTheme() {
    const darkInput = document.getElementById("dark-mode");
    const whiteInput = document.getElementById("white-mode");

    function updateThemeState() {
        const isDark = document.body.classList.contains("dark");
        darkInput.setAttribute("aria-pressed", String(isDark));
        whiteInput.setAttribute("aria-pressed", String(!isDark));
    }

    darkInput.addEventListener("click", () => {
        document.body.classList.add("dark");
        updateThemeState();
    });
    whiteInput.addEventListener("click", () => {
        document.body.classList.remove("dark");
        updateThemeState();
    });
    updateThemeState();
}
