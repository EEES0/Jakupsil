import { Editor, Node } from "https://esm.sh/@tiptap/core@3.31.3";
import StarterKit from "https://esm.sh/@tiptap/starter-kit@3.31.3";
import TextAlign from "https://esm.sh/@tiptap/extension-text-align@3.31.3";
import { TextStyle, FontSize } from "https://esm.sh/@tiptap/extension-text-style@3.31.3";

import { initToolbar } from "./toolbar.js?v=20261011-2";
import { initTheme } from "./theme.js";
import { initDownload } from "./download.js?v=20261014-7";
import { initServerPing } from "./server.js?v=20261011-1";

const documentFormat = document.body.dataset.documentFormat;

const PageBreak = Node.create({
    name: "pageBreak",
    group: "block",
    atom: true,
    selectable: true,

    parseHTML() {
        return [{ tag: 'div[data-type="pageBreak"]' }];
    },

    renderHTML() {
        return ["div", {
            "data-type": "pageBreak",
            class: "page-break",
            contenteditable: "false",
            role: "separator",
            "aria-label": "페이지 나누기"
        }, ["span", { "aria-hidden": "true" }, "페이지 나누기"]];
    }
});

const editor = new Editor({
    element: document.getElementById("editor"),

    extensions: [
        StarterKit.configure({
            italic: documentFormat === "pdf" ? false : {}
        }),
        TextAlign.configure({
            types: ['heading', 'paragraph']
        }),
        TextStyle,
        FontSize,
        ...(documentFormat === "docx" ? [PageBreak] : []),
    ],
});

initToolbar(editor);
initTheme();
initDownload(editor, documentFormat);
initServerPing();
