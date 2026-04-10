import React from 'react';
import { Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import './BulkResultsDashboard.css';

function BulkResultsDashboard({ batchResult, onDownloadReport, onBack }) {
    if (!batchResult) return null;

    const { total_processed, verified_count, results } = batchResult;
    const invalid_count = total_processed - verified_count;
    const verifRate = total_processed > 0 ? Math.round((verified_count / total_processed) * 100) : 0;

    return (
        <div className="bulk-dashboard animate-fade-in-up">
            <div className="bulk-header-actions">
                <button className="btn-secondary" onClick={onBack}>
                    ← Back to Upload
                </button>
                <button className="btn-primary" onClick={onDownloadReport}>
                    <Download size={18} /> Download PDF Report
                </button>
            </div>

            <div className="bulk-summary-cards">
                <div className="summary-card glass-card">
                    <div className="summary-val">{total_processed}</div>
                    <div className="summary-label">Total Certificates</div>
                </div>
                <div className="summary-card glass-card success">
                    <div className="summary-val">{verified_count}</div>
                    <div className="summary-label">Verified Authentic</div>
                </div>
                <div className="summary-card glass-card error">
                    <div className="summary-val">{invalid_count}</div>
                    <div className="summary-label">Invalid / Unverifiable</div>
                </div>
                <div className="summary-card glass-card">
                    <div className="summary-val">{verifRate}%</div>
                    <div className="summary-label">Verification Rate</div>
                </div>
            </div>

            <div className="bulk-table-container glass-card">
                <h3>Detailed Results</h3>
                <div className="table-responsive">
                    <table className="bulk-table">
                        <thead>
                            <tr>
                                <th>Certificate File</th>
                                <th>Extracted Name</th>
                                <th>Official Name</th>
                                <th>Completion Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((res, idx) => {
                                const extraction = res.steps?.extraction?.fields || {};
                                const official = res.steps?.official_fetch?.data || {};
                                const status = res.final_status || 'error';

                                let StatusIcon = AlertTriangle;
                                let statusClass = 'status-warning';
                                let statusText = 'Unknown';

                                if (status === 'verified') {
                                    StatusIcon = CheckCircle;
                                    statusClass = 'status-success';
                                    statusText = 'Verified';
                                } else if (status === 'suspicious') {
                                    StatusIcon = AlertTriangle;
                                    statusClass = 'status-warning';
                                    statusText = 'Suspicious';
                                } else if (status === 'tampered' || status === 'error' || status === 'unverifiable') {
                                    StatusIcon = XCircle;
                                    statusClass = 'status-error';
                                    statusText = status.charAt(0).toUpperCase() + status.slice(1);
                                }

                                return (
                                    <tr key={res.id || idx}>
                                        <td className="file-cell" title={res.filename}>
                                            {res.filename}
                                        </td>
                                        <td>{extraction.name || <span className="text-muted">N/A</span>}</td>
                                        <td>{official.name || <span className="text-muted">N/A</span>}</td>
                                        <td>{extraction.date || <span className="text-muted">N/A</span>}</td>
                                        <td>
                                            <span className={`status-badge ${statusClass}`} title={res.final_message}>
                                                <StatusIcon size={14} /> {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default BulkResultsDashboard;
