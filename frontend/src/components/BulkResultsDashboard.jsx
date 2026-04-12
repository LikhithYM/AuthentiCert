import React, { useState } from 'react';
import { Download, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import MismatchDetail from './MismatchDetail';
import './BulkResultsDashboard.css';

const STATUS_CONFIG = {
    authentic:    { icon: ShieldCheck,   cls: 'status-authentic', label: 'Authentic'   },
    valid:        { icon: CheckCircle,   cls: 'status-valid',     label: 'Valid'        },
    suspicious:   { icon: AlertTriangle, cls: 'status-warning',   label: 'Suspicious'  },
    tampered:     { icon: XCircle,       cls: 'status-error',     label: 'Tampered'    },
    unverifiable: { icon: AlertTriangle, cls: 'status-info',      label: 'Unverifiable'},
    error:        { icon: XCircle,       cls: 'status-error',     label: 'Error'       },
};

function scorePillClass(score) {
    if (score == null) return 'pill-grey';
    if (score >= 85)   return 'pill-green';
    if (score >= 60)   return 'pill-yellow';
    return 'pill-red';
}

function BulkResultsDashboard({ batchResult, onDownloadReport, onBack }) {
    const [expandedIds, setExpandedIds] = useState(new Set());

    if (!batchResult) return null;

    const { total_processed, verified_count, results = [] } = batchResult;
    const invalid_count = total_processed - verified_count;
    const verifRate     = total_processed > 0
        ? Math.round((verified_count / total_processed) * 100) : 0;

    const avgScore = results.length > 0
        ? Math.round(
            results.reduce((s, r) => {
                const v = r.score_breakdown?.match_score ?? r.final_score;
                return s + (v ?? 0);
            }, 0) / results.length
          )
        : 0;

    const toggleExpand = (id) =>
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    return (
        <div className="bulk-dashboard animate-fade-in-up">
            {/* Actions bar */}
            <div className="bulk-header-actions">
                <button className="btn-secondary" onClick={onBack}>
                    ← Back to Upload
                </button>
                <button className="btn-primary" onClick={onDownloadReport}>
                    <Download size={16} /> Download PDF Report
                </button>
            </div>

            {/* Summary cards */}
            <div className="bulk-summary-cards">
                <div className="summary-card glass-card">
                    <div className="summary-val">{total_processed}</div>
                    <div className="summary-label">Total Certificates</div>
                </div>
                <div className="summary-card glass-card success">
                    <div className="summary-val">{verified_count}</div>
                    <div className="summary-label">Verified / Authentic</div>
                </div>
                <div className="summary-card glass-card error">
                    <div className="summary-val">{invalid_count}</div>
                    <div className="summary-label">Invalid / Suspicious</div>
                </div>
                <div className="summary-card glass-card avg">
                    <div className="summary-val">{verifRate}%</div>
                    <div className="summary-label">Verification Rate</div>
                </div>
                <div className="summary-card glass-card info">
                    <div className="summary-val">{avgScore}%</div>
                    <div className="summary-label">Avg Match Score</div>
                </div>
            </div>

            {/* Results table */}
            <div className="bulk-table-container glass-card">
                <h3>Detailed Results</h3>
                <div className="table-responsive">
                    <table className="bulk-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Certificate File</th>
                                <th>Match %</th>
                                <th>Text</th>
                                <th>Field</th>
                                <th>Image</th>
                                <th>Status</th>
                                <th>Key Mismatch</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((res, idx) => {
                                const status   = res.final_status || 'error';
                                const conf     = STATUS_CONFIG[status] || STATUS_CONFIG.error;
                                const StatusIcon = conf.icon;

                                const breakdown = res.score_breakdown || {};
                                const matchScore = breakdown.match_score ?? res.final_score;
                                const textScore  = breakdown.text_score;
                                const fieldScore = breakdown.field_score;
                                const imageScore = breakdown.image_score;

                                const mismatches = res.mismatches || [];
                                const keyMismatch = mismatches.length > 0
                                    ? mismatches[0].field
                                    : 'None';

                                const compFields = res.steps?.comparison?.fields || [];
                                const isExpanded = expandedIds.has(res.id || idx);

                                const formatPct = (v) =>
                                    v != null ? `${parseFloat(v).toFixed(1)}%` : '—';

                                return (
                                    <React.Fragment key={res.id || idx}>
                                        <tr className={mismatches.length > 0 ? 'row-has-mismatch' : ''}>
                                            <td className="idx-cell">{idx + 1}</td>
                                            <td className="file-cell" title={res.filename}>
                                                📄 {res.filename}
                                            </td>
                                            <td>
                                                <span className={`score-pill ${scorePillClass(matchScore)}`}>
                                                    {formatPct(matchScore)}
                                                </span>
                                            </td>
                                            <td className="sub-score">{formatPct(textScore)}</td>
                                            <td className="sub-score">{formatPct(fieldScore)}</td>
                                            <td className="sub-score">{formatPct(imageScore)}</td>
                                            <td>
                                                <span className={`status-badge ${conf.cls}`}>
                                                    <StatusIcon size={13} />
                                                    {conf.label}
                                                </span>
                                            </td>
                                            <td className={mismatches.length > 0 ? 'key-mismatch-cell mismatch-highlight' : 'key-mismatch-cell'}>
                                                {mismatches.length > 0
                                                    ? <><span className="mismatch-dot" />  {keyMismatch}</>
                                                    : <span className="no-mismatch">✓ None</span>
                                                }
                                            </td>
                                            <td>
                                                <button
                                                    className="details-btn"
                                                    onClick={() => toggleExpand(res.id || idx)}
                                                    title={isExpanded ? 'Collapse' : 'View Details'}
                                                >
                                                    {isExpanded
                                                        ? <ChevronUp size={14} />
                                                        : <ChevronDown size={14} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expandable detail row */}
                                        {isExpanded && (
                                            <tr className="detail-row">
                                                <td colSpan={9}>
                                                    <div className="detail-panel">
                                                        <div className="detail-meta">
                                                            <span>📄 {res.filename}</span>
                                                            {res.steps?.url_detection?.url && (
                                                                <a
                                                                    href={res.steps.url_detection.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="detail-url"
                                                                >
                                                                    🔗 Verification URL
                                                                </a>
                                                            )}
                                                            <span className="detail-msg">{res.final_message}</span>
                                                        </div>
                                                        <MismatchDetail
                                                            mismatches={mismatches}
                                                            compFields={compFields}
                                                            matchScore={matchScore}
                                                            textScore={textScore}
                                                            fieldScore={fieldScore}
                                                            imageScore={imageScore}
                                                            collapsible={false}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
