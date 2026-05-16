import sys

try:
    import PyPDF2
    with open('c:\\roomzy\\Roomzy_Backend_Documentation.docx.pdf', 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
    with open('c:\\roomzy\\backend\\scratch\\pdf_content.txt', 'w', encoding='utf-8') as out:
        out.write(text)
    print("Success with PyPDF2")
except Exception as e:
    print(f"Failed PyPDF2: {e}")
    try:
        import fitz
        doc = fitz.open('c:\\roomzy\\Roomzy_Backend_Documentation.docx.pdf')
        text = ''
        for page in doc:
            text += page.get_text() + '\n'
        with open('c:\\roomzy\\backend\\scratch\\pdf_content.txt', 'w', encoding='utf-8') as out:
            out.write(text)
        print("Success with fitz")
    except Exception as e2:
        print(f"Failed fitz: {e2}")
