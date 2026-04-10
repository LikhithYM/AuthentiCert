"""
Text extraction module — OCR + PDF text extraction + field parsing.
"""
import re
import os
import fitz  # PyMuPDF
from PIL import Image

# Try to import pytesseract; if Tesseract is not installed, OCR will be unavailable
try:
    import pytesseract
    # Windows default install path
    if os.name == 'nt':
        tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


def extract_text_from_pdf(filepath):
    """
    Extract text from a PDF file.
    First tries embedded text via PyMuPDF;
    if that yields little text, falls back to OCR on rendered pages.
    """
    doc = fitz.open(filepath)
    text_parts = []
    
    for page in doc:
        text = page.get_text()
        if text.strip():
            text_parts.append(text.strip())
    
    embedded_text = '\n'.join(text_parts)
    
    # If embedded text is too short, try OCR
    if len(embedded_text) < 30 and TESSERACT_AVAILABLE:
        ocr_parts = []
        for page in doc:
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_text = pytesseract.image_to_string(img)
            if ocr_text.strip():
                ocr_parts.append(ocr_text.strip())
        if ocr_parts:
            return '\n'.join(ocr_parts)
    
    doc.close()
    return embedded_text


def extract_text_from_image(filepath):
    """
    Extract text from an image file using Tesseract OCR.
    """
    if not TESSERACT_AVAILABLE:
        return "[OCR unavailable — Tesseract not installed]"
    
    img = Image.open(filepath)
    text = pytesseract.image_to_string(img)
    return text.strip()


def extract_verification_urls(text):
    """
    Find verification URLs in the extracted text.
    Looks for common certificate verification URL patterns.
    """
    url_pattern = re.compile(
        r'https?://(?:www\.)?'
        r'(?:coursera\.org/verify/[\w-]+|'
        r'udemy\.com/certificate/[\w-]+|'
        r'courses\.edx\.org/certificates/[\w-]+|'
        r'verify\.edx\.org/cert/[\w-]+|'
        r'linkedin\.com/learning/certificates/[\w-]+|'
        r'freecodecamp\.org/certification/[\w/]+|'
        r'credential\.net/[\w-]+|'
        r'credly\.com/badges/[\w-]+|'
        r'[\w.-]+/(?:verify|certificate|cert|validate|credentials?)/[\w./-]+)',
        re.IGNORECASE
    )
    
    urls = url_pattern.findall(text)
    
    # Also look for any generic URL
    if not urls:
        generic_pattern = re.compile(
            r'https?://[^\s<>"{}|\\^`\[\]]+',
            re.IGNORECASE
        )
        urls = generic_pattern.findall(text)
    
    return list(set(urls))


def extract_fields(text):
    """
    Parse extracted text and try to identify certificate fields.
    Uses heuristic patterns common in certificates.
    """
    fields = {
        'name': None,
        'course': None,
        'institution': None,
        'date': None,
        'certificate_id': None,
        'verification_url': None,
        'raw_text': text
    }
    
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # --- Name extraction ---
    name_patterns = [
        r'(?:awarded to|presented to|certif(?:y|ied) that|granted to|this is to certify that|issued to|earned by|completed by)\s*[:\-]?\s*(.+)',
        r'(?:name|recipient|student|learner)\s*[:\-]\s*(.+)',
    ]
    for pat in name_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            name_candidate = m.group(1).strip().strip('.')
            # Names are usually 2-4 words, all alpha
            if 1 < len(name_candidate.split()) <= 5 and len(name_candidate) < 60:
                fields['name'] = name_candidate
                break
    
    # Fallback: first prominent line (often the name in large font)
    if not fields['name'] and lines:
        for line in lines[:5]:
            words = line.split()
            if 2 <= len(words) <= 4 and all(w.isalpha() for w in words) and len(line) < 40:
                fields['name'] = line
                break
    
    # --- Course extraction ---
    course_patterns = [
        r'(?:course|program|specialization|track)\s*[:\-]\s*(.+)',
        r'(?:has successfully completed|completed the?)\s+(?:the\s+)?(?:online\s+)?(?:course\s+)?["\"]?(.+?)["\"]?\s*(?:on|offered|by|$)',
        r'(?:for completing|completion of)\s+(?:the\s+)?(.+?)(?:\s+(?:course|program|offered|by|on)|$)',
    ]
    for pat in course_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            course = m.group(1).strip().strip('.')
            if len(course) > 3:
                fields['course'] = course
                break
    
    # --- Institution extraction ---
    institution_patterns = [
        r'(?:issued by|offered by|provided by|authorized by|institution|university|organisation|organization)\s*[:\-]?\s*(.+)',
        r'(?:Coursera|Udemy|edX|LinkedIn Learning|Stanford University|MIT|Harvard|Google|Microsoft|IBM|Meta|AWS|Amazon)',
    ]
    for pat in institution_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            if m.groups():
                fields['institution'] = m.group(1).strip().strip('.')
            else:
                fields['institution'] = m.group(0).strip()
            break
    
    # --- Date extraction ---
    date_patterns = [
        r'(?:date|issued|completed|awarded)\s*[:\-]?\s*(\w+ \d{1,2},?\s*\d{4})',
        r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
        r'(\w+ \d{1,2},?\s*\d{4})',
        r'(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})',
    ]
    for pat in date_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields['date'] = m.group(1).strip() if m.groups() else m.group(0).strip()
            break
    
    # --- Certificate ID ---
    id_patterns = [
        r'(?:certificate\s*(?:id|no|number|#)|credential\s*id|cert\s*id|id)\s*[:\-#]?\s*([\w-]{5,})',
        r'(?:verify(?:ication)?)\s*(?:code|id|number|#)\s*[:\-]?\s*([\w-]{5,})',
    ]
    for pat in id_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields['certificate_id'] = m.group(1).strip()
            break
    
    # --- Verification URL ---
    urls = extract_verification_urls(text)
    if urls:
        fields['verification_url'] = urls[0]
    
    return fields


def process_file(filepath):
    """
    Main entry point: extract text and fields from a PDF or image.
    """
    ext = os.path.splitext(filepath)[1].lower()
    
    if ext == '.pdf':
        text = extract_text_from_pdf(filepath)
    elif ext in ('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'):
        text = extract_text_from_image(filepath)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
    
    fields = extract_fields(text)
    return text, fields
