import sys
import os
from PyPDF2 import PdfMerger

def merge_pdfs(invoice_pdf, pix_receipt_pdf, output_path):
    """
    Merges the invoice PDF and the PIX receipt PDF into a single document.
    """
    try:
        merger = PdfMerger()
        
        # Append the main invoice
        merger.append(invoice_pdf)
        
        # Append the PIX receipt
        merger.append(pix_receipt_pdf)
        
        # Ensure target directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Write out the merged PDF
        merger.write(output_path)
        merger.close()
        
        print(f"Successfully merged {invoice_pdf} and {pix_receipt_pdf} into {output_path}")
        return True
    except Exception as e:
        print(f"Error merging PDFs: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python merge_pdf.py <invoice_path> <pix_receipt_path> <output_path>")
        sys.exit(1)
        
    invoice = sys.argv[1]
    pix = sys.argv[2]
    out = sys.argv[3]
    
    success = merge_pdfs(invoice, pix, out)
    if not success:
        sys.exit(1)
