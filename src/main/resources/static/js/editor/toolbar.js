export function initToolbar(editor) {
    const fontSizeSelect = document.getElementById("font-size");
    const formatButtons = [
        { format: "bold", command: "toggleBold" },
        { format: "underline", command: "toggleUnderline" },
        { format: "italic", command: "toggleItalic" }
    ].map((item) => ({ ...item, button: document.getElementById(item.format) }))
        .filter(({ button }) => button !== null);
    const alignmentButtons = ["left", "center", "right"].map((alignment) => ({
        alignment,
        button: document.getElementById("align-" + alignment)
    }));

    formatButtons.forEach(({ button, command }) => {
        button.addEventListener("click", () => {
            editor.chain().focus()[command]().run();
        });
    });
    alignmentButtons.forEach(({ button, alignment }) => {
        button.addEventListener("click", () => {
            editor.chain().focus().setTextAlign(alignment).run();
        });
    });
    fontSizeSelect.addEventListener("change", () => {
        editor.chain().focus().setFontSize(fontSizeSelect.value).run();
    });

    function updateToolbarState() {
        formatButtons.forEach(({ button, format }) => {
            button.setAttribute("aria-pressed", String(editor.isActive(format)));
        });
        alignmentButtons.forEach(({ button, alignment }) => {
            button.setAttribute("aria-pressed", String(editor.isActive({ textAlign: alignment })));
        });
        fontSizeSelect.value = editor.getAttributes("textStyle").fontSize || "14px";
    }

    editor.on("selectionUpdate", updateToolbarState);
    editor.on("transaction", updateToolbarState);
    updateToolbarState();
}
