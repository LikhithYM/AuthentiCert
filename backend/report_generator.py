import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from flask import current_app

def generate_report(batch_result, filename_prefix="verification_report"):
    """
    Generate a PDF report for a batch of verification results using ReportLab.
    Returns the absolute path to the generated PDF.
    """
    # Ensure export directory exists
    export_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reports')
    os.makedirs(export_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    pdf_filename = f"{filename_prefix}_{timestamp}.pdf"
    pdf_path = os.path.join(export_dir, pdf_filename)
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(letter),
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'],
        fontSize=24, spaceAfter=14, textColor=colors.HexColor('#0a0e1a')
    )
    subtitle_style = ParagraphStyle(
        'CustomSubtitle', parent=styles['Normal'],
        fontSize=12, spaceAfter=24, textColor=colors.HexColor('#4b5563')
    )
    section_style = ParagraphStyle(
        'SectionTitle', parent=styles['Heading2'],
        fontSize=16, spaceAfter=12, spaceBefore=20, textColor=colors.HexColor('#1f2937')
    )
    normal_style = styles['Normal']
    
    # 1. Title and Header
    elements.append(Paragraph("CertVerify — Verification Report", title_style))
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", subtitle_style))
    
    # 2. Summary Statistics
    total_certs = batch_result.get('total_processed', 0)
    verified_count = batch_result.get('verified_count', 0)
    invalid_count = total_certs - verified_count  # includes suspicious/tampered/unverifiable
    
    summary_data = [
        ['Total Certificates Processed', 'Verified', 'Invalid / Unverifiable'],
        [str(total_certs), str(verified_count), str(invalid_count)]
    ]
    
    summary_table = Table(summary_data, colWidths=[200, 100, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#111827')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 14),
        ('TEXTCOLOR', (1, 1), (1, 1), colors.HexColor('#10b981')), # Green for verified
        ('TEXTCOLOR', (2, 1), (2, 1), colors.HexColor('#ef4444')), # Red for invalid
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(Paragraph("Summary Statistics", section_style))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # 3. Detailed Results Table
    elements.append(Paragraph("Detailed Results", section_style))
    
    # Table Header
    headers = ['Filename', 'Extracted Name', 'Official Name', 'Date', 'Status', 'Reason/Notes']
    table_data = [headers]
    
    # Row colors based on status
    row_colors = []
    
    for idx, res in enumerate(batch_result.get('results', [])):
        # Extract fields safely
        filename = res.get('filename', 'Unknown')
        status = res.get('final_status', 'error').upper()
        
        # Determine color for this row
        if status == 'VERIFIED':
            bg_color = colors.HexColor('#ecfdf5') # Light green
        elif status == 'SUSPICIOUS' or status == 'UNVERIFIABLE':
            bg_color = colors.HexColor('#fffbeb') # Light yellow
        else:
            bg_color = colors.HexColor('#fef2f2') # Light red
            
        row_colors.append(bg_color)
        
        extraction = res.get('steps', {}).get('extraction', {}).get('fields', {})
        official = res.get('steps', {}).get('official_fetch', {}).get('data', {})
        
        ext_name = extraction.get('name', 'N/A') or 'N/A'
        off_name = official.get('name', 'N/A') or 'N/A'
        date = extraction.get('date', 'N/A') or 'N/A'
        
        # Shorten long names for the table
        ext_name = ext_name[:30] + '...' if len(ext_name) > 30 else ext_name
        off_name = off_name[:30] + '...' if len(off_name) > 30 else off_name
        filename = filename[:25] + '...' if len(filename) > 25 else filename
        
        reason = res.get('final_message', '')
        # truncate reason if too long
        reason = reason[:50] + '...' if len(reason) > 50 else reason
        
        table_data.append([
            filename,
            ext_name,
            off_name,
            date,
            status,
            reason
        ])
    
    # Create the detailed table
    # Adjust column widths for landscape A4/Letter (~750pts total)
    col_widths = [130, 130, 130, 80, 80, 180]
    detail_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    # Base table style
    table_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')), # Dark header
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('PADDING', (0, 1), (-1, -1), 6),
    ]
    
    # Apply row colors
    for idx, color in enumerate(row_colors):
        row_idx = idx + 1 # +1 for header
        table_style.append(('BACKGROUND', (0, row_idx), (-1, row_idx), color))
        
        # Make VERIFIED status green, others red/orange
        status_val = table_data[row_idx][4]
        if status_val == 'VERIFIED':
            table_style.append(('TEXTCOLOR', (4, row_idx), (4, row_idx), colors.HexColor('#059669')))
            table_style.append(('FONTNAME', (4, row_idx), (4, row_idx), 'Helvetica-Bold'))
        else:
            table_style.append(('TEXTCOLOR', (4, row_idx), (4, row_idx), colors.HexColor('#dc2626')))
            table_style.append(('FONTNAME', (4, row_idx), (4, row_idx), 'Helvetica-Bold'))
    
    detail_table.setStyle(TableStyle(table_style))
    elements.append(detail_table)
    
    # Build PDF
    doc.build(elements)
    
    return pdf_path
