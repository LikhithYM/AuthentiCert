"""
Image tampering detection module.
Uses Error Level Analysis (ELA), metadata inspection, and basic analysis.
"""
import os
import io
import json
import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS
import cv2

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None


def _load_image(filepath):
    """Load an image from file, converting PDFs to images first."""
    ext = os.path.splitext(filepath)[1].lower()
    
    if ext == '.pdf' and fitz:
        doc = fitz.open(filepath)
        page = doc[0]
        pix = page.get_pixmap(dpi=200)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        doc.close()
        return img
    else:
        return Image.open(filepath).convert('RGB')


def ela_analysis(filepath, quality=90):
    """
    Error Level Analysis (ELA).
    Re-saves the image at a known quality and measures the difference.
    Edited regions show higher error levels.
    
    Returns:
        {
            'mean_error': float,
            'max_error': float,
            'suspicious_regions': int,
            'tampered': bool,
            'confidence': float
        }
    """
    try:
        original = _load_image(filepath)
        
        # Re-save at known quality
        buffer = io.BytesIO()
        original.save(buffer, 'JPEG', quality=quality)
        buffer.seek(0)
        resaved = Image.open(buffer)
        
        # Compute difference
        orig_arr = np.array(original, dtype=np.float64)
        resaved_arr = np.array(resaved, dtype=np.float64)
        
        # Ensure same size
        min_h = min(orig_arr.shape[0], resaved_arr.shape[0])
        min_w = min(orig_arr.shape[1], resaved_arr.shape[1])
        orig_arr = orig_arr[:min_h, :min_w]
        resaved_arr = resaved_arr[:min_h, :min_w]
        
        diff = np.abs(orig_arr - resaved_arr)
        
        # Scale for visibility
        ela_image = (diff * 20).clip(0, 255).astype(np.uint8)
        
        mean_error = float(np.mean(diff))
        max_error = float(np.max(diff))
        
        # Count suspicious regions (areas with high error)
        gray_diff = np.mean(diff, axis=2)
        threshold = np.mean(gray_diff) + 2 * np.std(gray_diff)
        suspicious_mask = gray_diff > threshold
        suspicious_count = int(np.sum(suspicious_mask))
        total_pixels = gray_diff.shape[0] * gray_diff.shape[1]
        suspicious_ratio = suspicious_count / total_pixels if total_pixels > 0 else 0
        
        # Heuristic: if suspicious regions are concentrated (not uniform noise)
        tampered = suspicious_ratio > 0.005 and mean_error > 5
        confidence = min(suspicious_ratio * 100, 1.0)
        
        return {
            'mean_error': round(mean_error, 2),
            'max_error': round(max_error, 2),
            'suspicious_pixel_ratio': round(suspicious_ratio, 6),
            'tampered': tampered,
            'confidence': round(confidence, 2),
        }
    except Exception as e:
        return {
            'error': str(e),
            'tampered': False,
            'confidence': 0,
        }


def metadata_analysis(filepath):
    """
    Check image metadata (EXIF) for signs of editing software.
    Returns info about editing tools found in metadata.
    """
    try:
        img = Image.open(filepath)
        exif_data = img._getexif()
        
        result = {
            'has_exif': exif_data is not None,
            'editor_detected': False,
            'editor_name': None,
            'suspicious_tags': [],
        }
        
        if not exif_data:
            return result
        
        known_editors = [
            'photoshop', 'gimp', 'paint.net', 'pixlr', 'canva',
            'affinity', 'corel', 'lightroom', 'illustrator',
            'inkscape', 'sketch', 'figma', 'snapseed'
        ]
        
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, str(tag_id))
            str_value = str(value).lower() if value else ''
            
            for editor in known_editors:
                if editor in str_value:
                    result['editor_detected'] = True
                    result['editor_name'] = str(value)
                    break
            
            if tag_name in ('Software', 'ProcessingSoftware', 'HostComputer'):
                result['suspicious_tags'].append({
                    'tag': tag_name,
                    'value': str(value),
                })
        
        return result
    except Exception as e:
        return {
            'error': str(e),
            'has_exif': False,
            'editor_detected': False,
        }


def font_consistency_check(filepath):
    """
    Basic font consistency analysis.
    Checks for variance in text region properties that might indicate editing.
    """
    try:
        img_pil = _load_image(filepath)
        img = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Edge detection to find text regions
        edges = cv2.Canny(gray, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if len(contours) < 5:
            return {
                'consistent': True,
                'confidence': 0.5,
                'note': 'Not enough text regions to analyze',
            }
        
        # Analyze contour properties
        heights = []
        for c in contours:
            x, y, w, h = cv2.boundingRect(c)
            if 5 < h < 200 and 5 < w < 500:
                heights.append(h)
        
        if len(heights) < 3:
            return {
                'consistent': True,
                'confidence': 0.3,
                'note': 'Insufficient measurable text regions',
            }
        
        heights_arr = np.array(heights)
        std_dev = float(np.std(heights_arr))
        mean_h = float(np.mean(heights_arr))
        cv_ratio = std_dev / mean_h if mean_h > 0 else 0
        
        # High coefficient of variation might indicate mixed fonts
        suspicious = cv_ratio > 0.8
        
        return {
            'consistent': not suspicious,
            'coefficient_of_variation': round(cv_ratio, 4),
            'mean_height': round(mean_h, 2),
            'std_deviation': round(std_dev, 2),
            'regions_analyzed': len(heights),
            'confidence': round(min(cv_ratio, 1.0), 2),
        }
    except Exception as e:
        return {
            'error': str(e),
            'consistent': True,
            'confidence': 0,
        }


def analyze_tampering(filepath):
    """
    Run all tampering detection checks.
    Returns combined results with an overall tampering assessment.
    """
    ela = ela_analysis(filepath)
    metadata = metadata_analysis(filepath)
    fonts = font_consistency_check(filepath)
    
    # Combine signals
    tampering_signals = 0
    total_signals = 3
    
    if ela.get('tampered'):
        tampering_signals += 1
    if metadata.get('editor_detected'):
        tampering_signals += 1
    if not fonts.get('consistent', True):
        tampering_signals += 1
    
    overall_tampered = tampering_signals >= 2
    overall_confidence = round(tampering_signals / total_signals, 2)
    
    indicators = []
    if ela.get('tampered'):
        indicators.append('Error Level Analysis detected potential edits')
    if metadata.get('editor_detected'):
        indicators.append(f'Editing software detected: {metadata.get("editor_name", "unknown")}')
    if not fonts.get('consistent', True):
        indicators.append('Font inconsistencies detected')
    
    return {
        'tampered': overall_tampered,
        'confidence': overall_confidence,
        'indicators': indicators,
        'details': {
            'ela': ela,
            'metadata': metadata,
            'font_analysis': fonts,
        }
    }
