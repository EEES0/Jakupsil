import { Editor } from "https://esm.sh/@tiptap/core";
import StarterKit from "https://esm.sh/@tiptap/starter-kit";
import Underline from "https://esm.sh/@tiptap/extension-underline";
import TextAlign from "https://esm.sh/@tiptap/extension-text-align";
import Placeholder from "https://esm.sh/@tiptap/extension-placeholder";
import { TextStyle, FontSize } from "https://esm.sh/@tiptap/extension-text-style";
const editor = new Editor({
    element: document.getElementById("editor"),

    extensions: [
        StarterKit,
        Underline,
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

const fontSizeSelect = document.getElementById("font-size");
fontSizeSelect.addEventListener("change", () => {
    const size = fontSizeSelect.value;
    editor.chain().focus().setFontSize(size).run();
});

document.getElementById("download").addEventListener("click", async () => {
    const content = editor.getJSON();
    const response = await fetch("http://localhost:8080/api/docx", {
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
    a.download = "download.docx";
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
});