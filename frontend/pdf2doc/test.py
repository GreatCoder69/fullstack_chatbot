from pdf2docx import Converter

# Input and output file names
pdf_file = 'pie_manual.pdf'
docx_file = 'pie_manual.docx'

# Create a PDF converter object
cv = Converter(pdf_file)

# Convert entire PDF to DOCX
cv.convert(docx_file, start=0, end=None)

# Close the converter
cv.close()

print(f"✅ Converted '{pdf_file}' to '{docx_file}' successfully.")
