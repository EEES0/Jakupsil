import { Editor } from "https://esm.sh/@tiptap/core@3.31.3";
import StarterKit from "https://esm.sh/@tiptap/starter-kit@3.31.3";
import TextAlign from "https://esm.sh/@tiptap/extension-text-align@3.31.3";
import Placeholder from "https://esm.sh/@tiptap/extension-placeholder@3.31.3";
import { TextStyle, FontSize } from "https://esm.sh/@tiptap/extension-text-style@3.31.3";
const editor = new Editor({
    element: document.getElementById("editor"),

    extensions: [
        StarterKit,
        TextAlign.configure({
            types: ['heading', 'paragraph']
        }),
        TextStyle,
        FontSize,
        Placeholder.configure({
            placeholder: "내용을 입력하세요..."
        })
    ],
});

document.getElementById("align-left").addEventListener("click", () => {
    editor.chain().focus().setTextAlign("left").run();
});
document.getElementById("align-center").addEventListener("click", () => {
    editor.chain().focus().setTextAlign("center").run();
});
document.getElementById("align-right").addEventListener("click", () => {
    editor.chain().focus().setTextAlign("right").run();
});
document.getElementById("bold").addEventListener("click", () => {
    editor.chain().focus().toggleBold().run();
});

document.getElementById("underline").addEventListener("click", () => {
    editor.chain().focus().toggleUnderline().run();
});

document.getElementById("italic").addEventListener("click", () => {
    editor.chain().focus().toggleItalic().run();
});
let title = "제목";
const titleInput = document.getElementById("doc-title");
titleInput.addEventListener("input", () => {
    title = titleInput.value;
})

const fontSizeSelect = document.getElementById("font-size");
fontSizeSelect.addEventListener("change", () => {
    const size = fontSizeSelect.value;
    editor.chain().focus().setFontSize(size).run();
});

const darkInput = document.getElementById("dark-mode");
const whiteInput = document.getElementById("white-mode");
darkInput.addEventListener("click", () => {
    document.body.classList.add("dark");
})
whiteInput.addEventListener("click", () => {
    document.body.classList.remove("dark");
})

document.getElementById("download").addEventListener("click", async () => {
    const content = editor.getJSON();
    const response = await fetch("/api/docx", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: content.content
        })
    });
    console.log(content.content)

    if (!response.ok) {
        throw new Error("서버 응답 없음");
    }

    const result = await response.blob();
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");

    a.href = url;
    a.download = title + ".docx";
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
});