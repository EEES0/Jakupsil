const sidebarToggle = document.getElementById("sidebar-toggle");
const narrowScreen = window.matchMedia("(max-width: 760px)");
function setSidebarExpanded(expanded) {
    document.body.classList.toggle("sidebar-collapsed", !expanded);
    sidebarToggle.setAttribute("aria-expanded", String(expanded));
    const label = expanded ? "사이드바 접기" : "사이드바 펼치기";
    sidebarToggle.setAttribute("aria-label", label);
    sidebarToggle.title = label;
}
sidebarToggle.addEventListener("click", () => {
    setSidebarExpanded(sidebarToggle.getAttribute("aria-expanded") !== "true");
});
narrowScreen.addEventListener("change", () => setSidebarExpanded(!narrowScreen.matches));
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && narrowScreen.matches) {
        setSidebarExpanded(false);
        sidebarToggle.focus();
    }
});
document.addEventListener("click", (event) => {
    if (narrowScreen.matches && !event.target.closest("#workspace-sidebar, #sidebar-toggle")) {
        setSidebarExpanded(false);
    }
});
setSidebarExpanded(!narrowScreen.matches);