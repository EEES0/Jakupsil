import { Editor } from "https://esm.sh/@tiptap/core@3.31.3";
import StarterKit from "https://esm.sh/@tiptap/starter-kit@3.31.3";
import TextAlign from "https://esm.sh/@tiptap/extension-text-align@3.31.3";
import { TextStyle, FontSize } from "https://esm.sh/@tiptap/extension-text-style@3.31.3";

import { initToolbar } from "./toolbar.js";
import { initTheme } from "./theme.js";
import { initDownload } from "./download.js";
import { initServerPing } from "./server.js";

const editor = new Editor({
    element: document.getElementById("editor"),

    extensions: [
        StarterKit,
        TextAlign.configure({
            types: ['heading', 'paragraph']
        }),
        TextStyle,
        FontSize,
    ],
});

initToolbar(editor);
initTheme();
initDownload(editor);
initServerPing();
