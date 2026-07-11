from markdown_pdf import MarkdownPdf, Section

pdf = MarkdownPdf(toc_level=0)
with open("Presentation.md", "r") as f:
    text = f.read()

pdf.add_section(Section(text))
pdf.save("Presentation.pdf")
print("PDF created successfully!")
