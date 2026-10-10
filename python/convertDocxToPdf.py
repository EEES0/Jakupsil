import sys
from word2pdf import convert


def convert_pdf(docx_byte : bytes) -> bytes:
    return convert(docx_byte)


if __name__ == "__main__":
    docx_bytes = sys.stdin.buffer.read()

    pdf_bytes = convert_pdf(docx_bytes)

    sys.stdout.buffer.write(pdf_bytes)
    sys.stdout.buffer.flush()