import sys
from pdf2docx import Converter
import os

def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_pdf_to_docx.py input.pdf output.docx")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]

    if not os.path.exists(input_pdf):
        print(f"Error: Input file does not exist -> {input_pdf}")
        sys.exit(1)

    try:
        cv = Converter(input_pdf)
        cv.convert(output_docx, start=0, end=None)
        cv.close()
        print("Conversion successful")
    except Exception as e:
        print("Conversion failed:", e)
        sys.exit(1)

if __name__ == "__main__":
    main()
