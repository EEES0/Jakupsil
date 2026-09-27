class Heading1 {
    static get toolbox() {
        return {
            title: "Heading 1",
            icon: "H1"
        };
    }

    constructor({ data }) {
        this.data = data;
    }

    render() {
        const element = document.createElement("h1");

        element.contentEditable = true;
        element.className = "custom-heading";
        element.innerHTML = this.data.text || "";

        return element;
    }

    save(blockContent) {
        return {
            text: blockContent.innerHTML,
            level: 1
        };
    }
}


class Heading2 {
    static get toolbox() {
        return {
            title: "Heading 2",
            icon: "H2"
        };
    }

    constructor({ data }) {
        this.data = data;
    }

    render() {
        const element = document.createElement("h2");

        element.contentEditable = true;
        element.className = "custom-heading";
        element.innerHTML = this.data.text || "";

        return element;
    }

    save(blockContent) {
        return {
            text: blockContent.innerHTML,
            level: 2
        };
    }
}


class Heading3 {
    static get toolbox() {
        return {
            title: "Heading 3",
            icon: "H3"
        };
    }

    constructor({ data }) {
        this.data = data;
    }

    render() {
        const element = document.createElement("h3");

        element.contentEditable = true;
        element.className = "custom-heading";
        element.innerHTML = this.data.text || "";

        return element;
    }

    save(blockContent) {
        return {
            text: blockContent.innerHTML,
            level: 3
        };
    }
}


const editor = new EditorJS({
    holder: "editorjs",

    tools: {
        heading1: Heading1,
        heading2: Heading2,
        heading3: Heading3
    },

    inlineToolbar: true,

    placeholder: "내용을 입력하세요..."
});


document
    .getElementById("download")
    .addEventListener("click", async () => {

        try {
            const data = await editor.save();

            console.log(data);

            const response = await fetch(
                "/api/docx",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(data)
                }
            );

            if (!response.ok) {
                console.error(
                    "DOCX 생성 실패: ",
                    response.status
                );
                return;
            }

            const blob = await response.blob();

            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");

            a.href = url;
            a.download = "report.docx";

            document.body.appendChild(a);

            a.click();

            a.remove();

            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("예외 발생:", error);
        }
    });