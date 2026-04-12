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

            {/* Full field comparison table */}
            {expanded && compFields.length > 0 && (
                <div className="comp-table-wrapper">
                    <table className="comp-table">
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Uploaded</th>
                                <th>Official</th>
                                <th>Match</th>
                                <th>Similarity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compFields.map((f, i) => (
                                <tr
                                    key={i}
                                    className={
                                        f.match === false ? 'row-mismatch'
                                        : f.match === true  ? 'row-match'
                                        : ''
                                    }
                                >
                                    <td className="field-name-cell">{f.field}</td>
                                    <td className={f.match === false ? 'val-bad' : ''}>{f.uploaded}</td>
                                    <td className={f.match === false ? 'val-good' : ''}>{f.official}</td>
                                    <td className="match-cell">
                                        {f.match === true  && <span className="match-yes">✓</span>}
                                        {f.match === false && <span className="match-no">✗</span>}
                                        {f.match === null  && <span className="match-na">?</span>}
                                    </td>
                                    <td className="sim-cell">
                                        {f.similarity != null
                                            ? `${Math.round(f.similarity * 100)}%`
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
