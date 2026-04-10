"""
Web scraping module — fetches official certificate data from verification URLs.
Includes platform-specific parsers and a mock mode for demo purposes.
"""
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# ──────────────────────────────────────────────
# Mock data for demo / offline mode
# ──────────────────────────────────────────────

MOCK_CERTIFICATES = {
    'ABC123': {
        'name': 'Rahul Kumar',
        'course': 'Machine Learning',
        'institution': 'Stanford University',
        'date': 'January 15, 2025',
        'certificate_id': 'ABC123',
        'platform': 'Coursera',
    },
    'XYZ456': {
        'name': 'Priya Sharma',
        'course': 'Deep Learning Specialization',
        'institution': 'DeepLearning.AI',
        'date': 'March 10, 2025',
        'certificate_id': 'XYZ456',
        'platform': 'Coursera',
    },
    'DEF789': {
        'name': 'Amit Patel',
        'course': 'The Complete Python Bootcamp',
        'institution': 'Udemy',
        'date': 'February 20, 2025',
        'certificate_id': 'DEF789',
        'platform': 'Udemy',
    },
    'GHI012': {
        'name': 'Sneha Reddy',
        'course': 'CS50x Introduction to Computer Science',
        'institution': 'Harvard University',
        'date': 'December 5, 2024',
        'certificate_id': 'GHI012',
        'platform': 'edX',
    },
    'JKL345': {
        'name': 'Vikram Singh',
        'course': 'Cybersecurity Fundamentals',
        'institution': 'IBM',
        'date': 'November 30, 2024',
        'certificate_id': 'JKL345',
        'platform': 'Coursera',
    },
}


def _extract_cert_id_from_url(url):
    """Extract the certificate/verification ID from a URL."""
    # Common patterns
    patterns = [
        r'/verify/([A-Za-z0-9_-]+)',
        r'/certificate/([A-Za-z0-9_-]+)',
        r'/certificates/([A-Za-z0-9_-]+)',
        r'/cert/([A-Za-z0-9_-]+)',
        r'/credentials?/([A-Za-z0-9_-]+)',
        r'/badges?/([A-Za-z0-9_-]+)',
        r'/certification/([A-Za-z0-9/_-]+)',
    ]
    for pat in patterns:
        m = re.search(pat, url, re.IGNORECASE)
        if m:
            return m.group(1).strip('/')
    # Fallback: last path segment
    path = urlparse(url).path.rstrip('/')
    if path:
        return path.split('/')[-1]
    return None


def _detect_platform(url):
    """Identify the certificate platform from the URL."""
    domain = urlparse(url).netloc.lower()
    if 'coursera' in domain:
        return 'coursera'
    elif 'udemy' in domain:
        return 'udemy'
    elif 'edx' in domain:
        return 'edx'
    elif 'linkedin' in domain:
        return 'linkedin'
    elif 'freecodecamp' in domain:
        return 'freecodecamp'
    elif 'credential.net' in domain:
        return 'credentialnet'
    elif 'credly' in domain:
        return 'credly'
    return 'unknown'


def _try_mock(url):
    """Check if the URL matches a mock certificate."""
    cert_id = _extract_cert_id_from_url(url)
    if cert_id and cert_id in MOCK_CERTIFICATES:
        return MOCK_CERTIFICATES[cert_id]
    return None


def _scrape_generic(url):
    """
    Generic scraper: fetch page and extract text.
    Works for simple, server-rendered pages.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                          'AppleWebKit/537.36 (KHTML, like Gecko) '
                          'Chrome/120.0.0.0 Safari/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return {'error': f'Failed to fetch page: {str(e)}'}

    soup = BeautifulSoup(resp.text, 'lxml')
    
    # Remove scripts and styles
    for tag in soup(['script', 'style', 'noscript']):
        tag.decompose()
    
    page_text = soup.get_text(separator='\n', strip=True)
    
    # Try to extract fields from page text
    data = _parse_page_text(page_text)
    data['raw_page_text'] = page_text[:2000]
    data['source_url'] = url
    return data


def _parse_page_text(text):
    """Parse scraped page text for certificate fields."""
    fields = {
        'name': None,
        'course': None,
        'institution': None,
        'date': None,
        'certificate_id': None,
    }
    
    # Name patterns
    name_pats = [
        r'(?:awarded to|presented to|earned by|completed by|student|name)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})',
        r'(?:certif(?:y|ied|icate)\s+(?:that|for|of))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})',
    ]
    for pat in name_pats:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields['name'] = m.group(1).strip()
            break
    
    # Course
    course_pats = [
        r'(?:course|program|specialization)\s*[:\-]?\s*(.+?)(?:\n|$)',
        r'(?:completed?|has completed)\s+(?:the\s+)?(.+?)(?:\s+(?:by|on|offered)|$)',
    ]
    for pat in course_pats:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields['course'] = m.group(1).strip()[:100]
            break
    
    # Institution
    inst_pats = [
        r'(?:offered by|provided by|issued by|institution|university)\s*[:\-]?\s*(.+?)(?:\n|$)',
        r'(Coursera|Udemy|edX|LinkedIn Learning|Stanford|MIT|Harvard|Google|IBM|Microsoft|Meta|AWS)',
    ]
    for pat in inst_pats:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields['institution'] = m.group(1).strip() if m.lastindex else m.group(0)
            break
    
    # Date
    date_pats = [
        r'(?:date|issued|completed)\s*[:\-]?\s*(\w+ \d{1,2},?\s*\d{4})',
        r'(\w+ \d{1,2},?\s*\d{4})',
    ]
    for pat in date_pats:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields['date'] = m.group(1).strip()
            break
    
    # Certificate ID
    id_pats = [
        r'(?:certificate\s*(?:id|no|number)|credential\s*id)\s*[:\-#]?\s*([\w-]{5,})',
    ]
    for pat in id_pats:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields['certificate_id'] = m.group(1).strip()
            break
    
    return fields


def fetch_official_data(url):
    """
    Main entry point: fetch official certificate data from a verification URL.
    Tries mock data first, then real scraping.
    """
    if not url:
        return {'error': 'No verification URL provided'}
    
    # Try mock data first (for demo)
    mock = _try_mock(url)
    if mock:
        return {**mock, 'source': 'mock', 'source_url': url}
    
    # Try real scraping
    platform = _detect_platform(url)
    data = _scrape_generic(url)
    data['platform'] = platform
    data['source'] = 'scraped'
    
    return data
