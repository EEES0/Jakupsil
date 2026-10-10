import sys
from word2pdf import convert


def convert_pdf(docx_byte : bytes) -> bytes:
    return convert(
        docx_bytes,
        default_font="Noto Sans CJK KR",
        font_fallback="closest",
        font_dirs=["/usr/share/fonts/opentype/noto"]
    )


if __name__ == "__main__":
    docx_bytes = sys.stdin.buffer.read()

    pdf_bytes = convert_pdf(docx_bytes)

    sys.stdout.buffer.write(pdf_bytes)
    sys.stdout.buffer.flush()