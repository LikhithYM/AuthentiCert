"""
QR Code detection and decoding module.
Uses pyzbar + OpenCV to find QR codes in certificate images.
"""
import os
import re
import cv2
import numpy as np
from PIL import Image

try:
    from pyzbar.pyzbar import decode as pyzbar_decode
    PYZBAR_AVAILABLE = True
except (ImportError, OSError, Exception):
    PYZBAR_AVAILABLE = False

try:
    import fitz  # PyMuPDF — to render PDF pages as images
except ImportError:
    fitz = None


def _image_from_path(filepath):
    """Load image as a numpy array (BGR for OpenCV)."""
    img = cv2.imread(filepath)
    if img is None:
        # Try with PIL as fallback
        pil_img = Image.open(filepath).convert('RGB')
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    return img


def _images_from_pdf(filepath):
    """Render each PDF page to an image (numpy array)."""
    if fitz is None:
        return []
    doc = fitz.open(filepath)
    images = []
    for page in doc:
        pix = page.get_pixmap(dpi=300)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
        img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        images.append(img_bgr)
    doc.close()
    return images


def detect_qr(filepath):
    """
    Detect and decode QR codes in a certificate file.
    Returns a list of decoded data strings (usually URLs).
    """
    if not PYZBAR_AVAILABLE:
        return []

    ext = os.path.splitext(filepath)[1].lower()

    if ext == '.pdf':
        images = _images_from_pdf(filepath)
    else:
        images = [_image_from_path(filepath)]

    decoded_data = []

    for img in images:
        if img is None:
            continue

        # Try decoding directly
        results = pyzbar_decode(img)

        # If nothing found, try preprocessing
        if not results:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Sharpen
            sharpened = cv2.filter2D(gray, -1, np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]))
            results = pyzbar_decode(sharpened)

        if not results:
            # Threshold
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            results = pyzbar_decode(thresh)

        for result in results:
            data = result.data.decode('utf-8', errors='replace')
            decoded_data.append(data)

    # Filter for URLs
    url_results = [d for d in decoded_data if re.match(r'https?://', d, re.IGNORECASE)]

    return url_results if url_results else decoded_data
