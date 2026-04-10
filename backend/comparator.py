"""
Comparison engine — field-by-field comparison with fuzzy matching
and authenticity score calculation.
"""
from difflib import SequenceMatcher


def _normalize(text):
    """Normalize text for comparison."""
    if not text:
        return ''
    return ' '.join(text.lower().strip().split())


def _fuzzy_match(a, b, threshold=0.80):
    """
    Compare two strings with fuzzy matching.
    Returns (is_match, similarity_ratio).
    """
    na, nb = _normalize(a), _normalize(b)
    if not na or not nb:
        return (False, 0.0)
    
    if na == nb:
        return (True, 1.0)
    
    ratio = SequenceMatcher(None, na, nb).ratio()
    return (ratio >= threshold, round(ratio, 4))


def compare_fields(uploaded, official):
    """
    Compare uploaded certificate fields against official data.
    
    Returns:
        {
            'fields': [
                {
                    'field': 'name',
                    'uploaded': '...',
                    'official': '...',
                    'match': True/False,
                    'similarity': 0.0–1.0,
                    'weight': int
                },
                ...
            ],
            'score': 0–100,
            'status': 'verified' | 'tampered' | 'unverifiable',
            'mismatches': ['name', ...]
        }
    """
    
    FIELD_WEIGHTS = {
        'name': 35,
        'course': 25,
        'institution': 15,
        'date': 10,
        'certificate_id': 15,
    }
    
    def _normalize_date(date_str):
        if not date_str:
            return ""
        d = date_str.lower()
        d = d.replace("september", "sep").replace("sept", "sep")
        d = d.replace("october", "oct")
        d = d.replace("november", "nov")
        d = d.replace("december", "dec")
        d = d.replace("january", "jan")
        d = d.replace("february", "feb")
        d = d.replace("march", "mar")
        d = d.replace("april", "apr")
        d = d.replace("august", "aug")
        # Keep it simple for now, remove commas and extra spaces
        return ' '.join(d.replace(',', ' ').split())
    
    results = []
    weighted_score = 0
    total_weight = 0
    mismatches = []
    
    for field, weight in FIELD_WEIGHTS.items():
        u_val = uploaded.get(field)
        o_val = official.get(field)
        
        if u_val is None and o_val is None:
            # Both missing — skip
            continue
        
        if u_val is None or o_val is None:
            # One side missing — can't compare definitively
            results.append({
                'field': field,
                'uploaded': u_val or '(not found)',
                'official': o_val or '(not found)',
                'match': None,
                'similarity': None,
                'weight': weight,
                'note': 'Field missing on one side'
            })
            continue
        
        # Special handling for date
        if field == 'date':
            u_norm = _normalize_date(str(u_val))
            o_norm = _normalize_date(str(o_val))
            is_match, similarity = _fuzzy_match(u_norm, o_norm, threshold=0.80)
        else:
            is_match, similarity = _fuzzy_match(str(u_val), str(o_val))
        
        results.append({
            'field': field,
            'uploaded': str(u_val),
            'official': str(o_val),
            'match': is_match,
            'similarity': similarity,
            'weight': weight,
        })
        
        weighted_score += similarity * weight
        total_weight += weight
        
        if not is_match:
            mismatches.append(field)
    
    # Calculate overall score
    score = round((weighted_score / total_weight) * 100, 1) if total_weight > 0 else 0
    
    # Determine status
    if not results or total_weight == 0:
        status = 'unverifiable'
    elif score >= 85 and len(mismatches) == 0:
        status = 'verified'
    elif score >= 60:
        status = 'suspicious'
    else:
        status = 'tampered'
    
    return {
        'fields': results,
        'score': score,
        'status': status,
        'mismatches': mismatches,
    }
