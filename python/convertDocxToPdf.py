import sys

from word2pdf import convert
from word2pdf.fonts import manager


if "NanumGothic" not in manager.CJK_FALLBACKS:
    manager.CJK_FALLBACKS.insert(0, "NanumGothic")


def convert_pdf(docx_bytes: bytes) -> bytes:
    return convert(
        docx_bytes,
        default_font="NanumGothic",
        default_font_override="NanumGothic",
        font_fallback="word",
        font_dirs=["/usr/local/share/fonts/jakupsil"],
        font_cache=False,
    )


if __name__ == "__main__":
    docx_bytes = sys.stdin.buffer.read()
    pdf_bytes = convert_pdf(docx_bytes)

    sys.stdout.buffer.write(pdf_bytes)
    sys.stdout.buffer.flush()