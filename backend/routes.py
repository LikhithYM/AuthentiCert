"""
API Routes — unified verification pipeline.
"""
import os
import uuid
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

from extractor import process_file, extract_verification_urls
from scraper import fetch_official_data
from comparator import compare_fields
from tampering import analyze_tampering
from report_generator import generate_report

api_bp = Blueprint('api', __name__)

# In-memory verification history (for demo; replace with DB in production)
verification_history = []

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp'}


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _process_single_file(file, original_filename):
    """Core verification logic for a single file."""
    # Save the file
    filename = secure_filename(original_filename)
    unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_name)
    file.save(filepath)
    
    result = {
        'id': str(uuid.uuid4()),
        'filename': filename,
        'timestamp': datetime.now().isoformat(),
        'steps': {},
    }
    
    try:
        # Step 1: Text Extraction
        raw_text, extracted_fields = process_file(filepath)
        result['steps']['extraction'] = {
            'status': 'completed',
            'fields': extracted_fields,
            'raw_text_preview': raw_text[:500] if raw_text else '',
        }
        
        # Step 2: Verification URL
        verification_url = extracted_fields.get('verification_url')
        
        result['steps']['url_detection'] = {
            'status': 'completed',
            'url': verification_url,
            'source': 'text_extraction',
        }
        
        # Step 3: Fetch Official Data
        if verification_url:
            official_data = fetch_official_data(verification_url)
            result['steps']['official_fetch'] = {
                'status': 'completed',
                'data': official_data,
            }
            
        # Step 4: Compare
            comparison = compare_fields(extracted_fields, official_data)
            result['steps']['comparison'] = {
                'status': 'completed',
                **comparison,
            }
        else:
            result['steps']['official_fetch'] = {
                'status': 'skipped',
                'reason': 'No verification URL found',
            }
            result['steps']['comparison'] = {
                'status': 'skipped',
                'reason': 'No official data to compare against',
            }
        
        # Step 5: Tampering Detection
        tampering_result = analyze_tampering(filepath)
        result['steps']['tampering'] = {
            'status': 'completed',
            **tampering_result,
        }
        
        # Final Score & Status
        comparison_score = result['steps'].get('comparison', {}).get('score', None)
        tampering_detected = tampering_result.get('tampered', False)
        
        if comparison_score is not None:
            # Adjust score based on tampering
            final_score = comparison_score
            if tampering_detected:
                final_score = max(0, final_score - 15)
            
            result['final_score'] = round(final_score, 1)
            
            if final_score >= 85 and not tampering_detected:
                result['final_status'] = 'verified'
                result['final_message'] = 'Certificate is authentic. All checks passed.'
            elif final_score >= 60:
                result['final_status'] = 'suspicious'
                result['final_message'] = 'Certificate could not be fully verified. Some discrepancies found.'
            else:
                result['final_status'] = 'tampered'
                result['final_message'] = 'Certificate tampering detected. Significant mismatches found.'
        else:
            if tampering_detected:
                result['final_score'] = 30
                result['final_status'] = 'suspicious'
                result['final_message'] = 'No verification URL found, but image tampering indicators detected.'
            else:
                result['final_score'] = None
                result['final_status'] = 'unverifiable'
                result['final_message'] = 'Could not verify — no verification URL found in the certificate.'
        
        # Add mismatches to top level for easy display
        result['mismatches'] = result['steps'].get('comparison', {}).get('mismatches', [])
        
    except Exception as e:
        result['final_status'] = 'error'
        result['final_message'] = f'Verification failed: {str(e)}'
        result['final_score'] = None
    
    return result


@api_bp.route('/verify', methods=['POST'])
def verify_certificate():
    """Single file verification endpoint."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    if not _allowed_file(file.filename):
        return jsonify({'error': f'Unsupported file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    result = _process_single_file(file, file.filename)
    
    # Store in history
    history_entry = {
        'id': result['id'],
        'filename': result['filename'],
        'timestamp': result['timestamp'],
        'final_status': result.get('final_status'),
        'final_score': result.get('final_score'),
        'is_bulk': False
    }
    verification_history.insert(0, history_entry)
    
    return jsonify(result)


@api_bp.route('/verify-bulk', methods=['POST'])
def verify_certificates_bulk():
    """Bulk verification endpoint (supports multiple files)."""
    if 'files' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No valid files in request'}), 400
    
    results = []
    verified_count = 0
    
    for file in files:
        if file.filename and _allowed_file(file.filename):
            res = _process_single_file(file, file.filename)
            results.append(res)
            if res.get('final_status') == 'verified':
                verified_count += 1
    
    batch_id = str(uuid.uuid4())
    batch_result = {
        'id': batch_id,
        'timestamp': datetime.now().isoformat(),
        'is_bulk': True,
        'total_processed': len(results),
        'verified_count': verified_count,
        'results': results
    }
    
    # Store history for batch
    history_entry = {
        'id': batch_id,
        'filename': f"Batch of {len(results)} certificates",
        'timestamp': batch_result['timestamp'],
        'final_status': 'batch',
        'final_score': round((verified_count / len(results) * 100)) if results else 0,
        'is_bulk': True,
        'total_processed': len(results),
        'verified_count': verified_count
    }
    verification_history.insert(0, history_entry)
    
    return jsonify(batch_result)


@api_bp.route('/report', methods=['POST'])
def generate_pdf_report():
    """Generate and return a PDF report for a batch verification result."""
    batch_result = request.json
    if not batch_result:
        return jsonify({'error': 'No batch data provided'}), 400
    
    try:
        pdf_path = generate_report(batch_result)
        from flask import send_file
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=os.path.basename(pdf_path),
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': f'Report generation failed: {str(e)}'}), 500


@api_bp.route('/history', methods=['GET'])
def get_history():
    """Return verification history."""
    return jsonify(verification_history)


@api_bp.route('/history/<result_id>', methods=['GET'])
def get_history_item(result_id):
    """Return a single history item."""
    for item in verification_history:
        if item['id'] == result_id:
            return jsonify(item)
    return jsonify({'error': 'Not found'}), 404
