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

    const pageBreakButton = document.getElementById("page-break");
    if (pageBreakButton) {
        pageBreakButton.addEventListener("click", () => {
            if (pageBreakButton.disabled) return;
            editor.chain().focus().insertContent({ type: "pageBreak" })
                .createParagraphNear().run();
        });
    }

    function updateToolbarState() {
        if (pageBreakButton) {
            // DTO는 최상위 ContentNode만 페이지 구분으로 처리합니다.
            const { $from, $to } = editor.state.selection;
            pageBreakButton.disabled = $from.depth > 1 || $to.depth > 1;
        }
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
