import React, { useState } from 'react';
import './MismatchDetail.css';

/**
 * MismatchDetail — reusable expandable panel for structured mismatch list.
 * Used in both ResultDashboard (single cert) and BulkResultsDashboard (drill-down).
 *
 * Props:
 *   mismatches   : Array<{ field, uploaded, official }>
 *   compFields   : Array<{ field, uploaded, official, match, similarity, ... }>  (optional)
 *   matchScore   : number | null
 *   textScore    : number | null
 *   fieldScore   : number | null
 *   imageScore   : number | null
 *   collapsible  : bool (default true)
 */
function MismatchDetail({
    mismatches = [],
    compFields = [],
    matchScore = null,
    textScore  = null,
    fieldScore = null,
    imageScore = null,
    collapsible = true,
}) {
    const [expanded, setExpanded] = useState(!collapsible);

    const hasMismatches = mismatches.length > 0;

    return (
        <div className={`mismatch-detail ${hasMismatches ? 'has-mismatches' : 'no-mismatches'}`}>
            {/* Score breakdown bars */}
            <div className="score-breakdown">
                <ScoreBar label="Overall Match" value={matchScore} primary />
                <ScoreBar label="Text Match"    value={textScore}  />
                <ScoreBar label="Field Match"   value={fieldScore} />
                <ScoreBar label="Image Match"   value={imageScore} />
            </div>

            {/* Mismatch summary */}
            {hasMismatches ? (
                <div className="mismatch-summary-banner">
                    <span className="mismatch-icon">⚠️</span>
                    <strong>{mismatches.length} mismatch{mismatches.length > 1 ? 'es' : ''} detected</strong>
                    {collapsible && (
                        <button
                            className="expand-btn"
                            onClick={() => setExpanded(e => !e)}
                        >
                            {expanded ? '▲ Hide' : '▼ Details'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="mismatch-none-banner">
                    <span>✅</span> All checked fields match
                </div>
            )}

            {/* Detailed mismatch rows */}
            {expanded && hasMismatches && (
                <div className="mismatch-rows">
                    {mismatches.map((m, i) => (
                        <div className="mismatch-row" key={i}>
                            <span className="mismatch-field-name">{m.field}</span>
                            <span className="mismatch-uploaded">
                                <span className="mismatch-label">Uploaded</span>
                                {m.uploaded || '—'}
                            </span>
                            <span className="mismatch-arrow">→</span>
                            <span className="mismatch-official">
                                <span className="mismatch-label">Official</span>
                                {m.official || '—'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Side-by-side Comparison View */}
            {expanded && compFields.length > 0 && (
                <div className="side-by-side-comparison">
                    <div className="comparison-card">
                        <h4>Uploaded Certificate</h4>
                        <div className="comparison-fields">
                            {compFields.map((f, i) => (
                                <div key={`up-${i}`} className={`comp-field ${f.match === false ? 'field-mismatch' : f.match === true ? 'field-match' : ''}`}>
                                    <span className="comp-field-label">{f.field}</span>
                                    <span className="comp-field-value">{f.uploaded || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="comparison-card">
                        <h4>Official Record</h4>
                        <div className="comparison-fields">
                            {compFields.map((f, i) => (
                                <div key={`off-${i}`} className={`comp-field ${f.match === false ? 'field-mismatch' : f.match === true ? 'field-match' : ''}`}>
                                    <span className="comp-field-label">{f.field}</span>
                                    <div className="comp-field-value-group">
                                        <span className="comp-field-value">{f.official || '—'}</span>
                                        {f.match === true && <span className="match-icon match-yes">✓</span>}
                                        {f.match === false && <span className="match-icon match-no">✗</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ScoreBar({ label, value, primary = false }) {
    const pct = value != null ? Math.min(100, Math.max(0, value)) : null;
    const color =
        pct == null       ? '#6b7280'
        : pct >= 85       ? '#10b981'
        : pct >= 60       ? '#f59e0b'
        :                   '#ef4444';

    return (
        <div className={`score-bar-row ${primary ? 'primary' : ''}`}>
            <span className="score-bar-label">{label}</span>
            <div className="score-bar-track">
                {pct != null ? (
                    <div
                        className="score-bar-fill"
                        style={{ width: `${pct}%`, background: color }}
                    />
                ) : (
                    <div className="score-bar-unavail" />
                )}
            </div>
            <span className="score-bar-value" style={{ color }}>
                {pct != null ? `${pct.toFixed(1)}%` : '—'}
            </span>
        </div>
    );
}

export default MismatchDetail;
