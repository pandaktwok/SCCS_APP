import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCNY2IBpRbmg3sr2gB1a9lVT5Ttm6qEvMw")
genai.configure(api_key=API_KEY)

def classify_invoice(text_content):
    """
    Classifies the invoice text into one of the categories.
    """
    prompt = f"""
    You are an automated financial assistant for Sociedade Cultural Cruzeiro do Sul.
    You must extract the project category and project code (Termo) from this invoice text.
    Valid Categories: 'FIA', 'FMI', 'Município'
    
    Invoice Text:
    {text_content}
    
    Return the result strictly as valid JSON with NO markdown formatting:
    {{
        "category": "FIA | FMI | Município",
        "termo": "e.g., T 3104",
        "invoice_number": "e.g., 1055"
    }}
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        # Parse JSON
        result = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
        return result
    except Exception as e:
        print(f"Error classifying invoice: {e}")
        return None

if __name__ == "__main__":
    import sys
    # Read text from stdin or file
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            content = f.read()
            print(json.dumps(classify_invoice(content)))
