import { motion } from 'framer-motion'
import {
    ArrowLeft, ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX,
    Check, X, AlertTriangle, Download, Eye
} from 'lucide-react'
import ScoreGauge from './ScoreGauge'
import './ResultDashboard.css'

const STATUS_CONFIG = {
    verified: {
        icon: ShieldCheck,
        label: 'Verified',
        badgeClass: 'badge-success',
        color: 'var(--success)',
    },
    suspicious: {
        icon: ShieldAlert,
        label: 'Suspicious',
        badgeClass: 'badge-warning',
        color: 'var(--warning)',
    },
    tampered: {
        icon: ShieldX,
        label: 'Tampered',
        badgeClass: 'badge-danger',
        color: 'var(--danger)',
    },
    unverifiable: {
        icon: ShieldQuestion,
        label: 'Unverifiable',
        badgeClass: 'badge-info',
        color: 'var(--info)',
    },
    error: {
        icon: ShieldX,
        label: 'Error',
        badgeClass: 'badge-danger',
        color: 'var(--danger)',
    },
}

function ResultDashboard({ result, onBack }) {
    const statusConf = STATUS_CONFIG[result.final_status] || STATUS_CONFIG.error
    const StatusIcon = statusConf.icon

    const extractedFields = result.steps?.extraction?.fields || {}
    const officialData = result.steps?.official_fetch?.data || {}
    const comparisonFields = result.steps?.comparison?.fields || []
    const tamperingData = result.steps?.tampering || {}

    const handleDownload = () => {
        const data = JSON.stringify(result, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `verification_${result.id?.slice(0, 8) || 'report'}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="result-dashboard">
            {/* Header */}
            <div className="result-header">
                <button className="btn btn-outline" onClick={onBack}>
                    <ArrowLeft size={16} /> New Verification
                </button>
                <button className="btn btn-outline" onClick={handleDownload}>
                    <Download size={16} /> Download Report
                </button>
            </div>

            {/* Score + Status */}
            <motion.div
                className="result-hero glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="result-hero-content">
                    <div className="result-score-section">
                        <ScoreGauge score={result.final_score} status={result.final_status} />
                    </div>
                    <div className="result-status-section">
                        <div className={`badge ${statusConf.badgeClass}`}>
                            <StatusIcon size={14} /> {statusConf.label}
                        </div>
                        <h2 className="result-message">{result.final_message}</h2>
                        <div className="result-meta">
                            <span>📄 {result.filename}</span>
                            <span>🕐 {new Date(result.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Comparison Table */}
            {comparisonFields.length > 0 && (
                <motion.div
                    className="result-section glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="section-title">
                        <Eye size={18} /> Field Comparison
                    </h3>
                    <div className="comparison-table-wrapper">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Uploaded Certificate</th>
                                    <th>Official Record</th>
                                    <th>Match</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonFields.map((field, i) => (
                                    <tr key={i} className={field.match === false ? 'row-mismatch' : field.match === true ? 'row-match' : ''}>
                                        <td className="field-name">{field.field}</td>
                                        <td>{field.uploaded}</td>
                                        <td>{field.official}</td>
                                        <td className="match-cell">
                                            {field.match === true && (
                                                <span className="match-icon match-yes"><Check size={14} /></span>
                                            )}
                                            {field.match === false && (
                                                <span className="match-icon match-no"><X size={14} /></span>
                                            )}
                                            {field.match === null && (
                                                <span className="match-icon match-na"><AlertTriangle size={14} /></span>
                                            )}
                                            {field.similarity !== null && field.similarity !== undefined && (
                                                <span className="similarity">{Math.round(field.similarity * 100)}%</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Extracted Data */}
            <motion.div
                className="result-section glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="section-title">📝 Extracted Certificate Data</h3>
                <div className="data-grid">
                    {Object.entries(extractedFields).filter(([k]) => k !== 'raw_text').map(([key, value]) => (
                        <div key={key} className="data-item">
                            <span className="data-key">{key.replace(/_/g, ' ')}</span>
                            <span className="data-value">{value || '—'}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Tampering Analysis */}
            <motion.div
                className="result-section glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h3 className="section-title">🛡️ Tampering Analysis</h3>
                <div className="tampering-grid">
                    {/* ELA */}
                    <div className="tampering-card">
                        <h4>Error Level Analysis</h4>
                        {tamperingData.details?.ela ? (
                            <>
                                <div className={`tampering-status ${tamperingData.details.ela.tampered ? 'alert' : 'ok'}`}>
                                    {tamperingData.details.ela.tampered ? '⚠️ Potential edits detected' : '✅ No significant edits detected'}
                                </div>
                                <div className="tampering-stats">
                                    <span>Mean Error: {tamperingData.details.ela.mean_error}</span>
                                    <span>Max Error: {tamperingData.details.ela.max_error}</span>
                                </div>
                            </>
                        ) : (
                            <span className="text-muted">Analysis unavailable</span>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="tampering-card">
                        <h4>Metadata Analysis</h4>
                        {tamperingData.details?.metadata ? (
                            <>
                                <div className={`tampering-status ${tamperingData.details.metadata.editor_detected ? 'alert' : 'ok'}`}>
                                    {tamperingData.details.metadata.editor_detected
                                        ? `⚠️ Editor detected: ${tamperingData.details.metadata.editor_name}`
                                        : '✅ No editing software detected'}
                                </div>
                                <div className="tampering-stats">
                                    <span>Has EXIF: {tamperingData.details.metadata.has_exif ? 'Yes' : 'No'}</span>
                                </div>
                            </>
                        ) : (
                            <span className="text-muted">Analysis unavailable</span>
                        )}
                    </div>

                    {/* Font */}
                    <div className="tampering-card">
                        <h4>Font Consistency</h4>
                        {tamperingData.details?.font_analysis ? (
                            <>
                                <div className={`tampering-status ${!tamperingData.details.font_analysis.consistent ? 'alert' : 'ok'}`}>
                                    {tamperingData.details.font_analysis.consistent
                                        ? '✅ Fonts appear consistent'
                                        : '⚠️ Font inconsistencies detected'}
                                </div>
                                <div className="tampering-stats">
                                    <span>Regions: {tamperingData.details.font_analysis.regions_analyzed || '—'}</span>
                                    <span>CV: {tamperingData.details.font_analysis.coefficient_of_variation || '—'}</span>
                                </div>
                            </>
                        ) : (
                            <span className="text-muted">Analysis unavailable</span>
                        )}
                    </div>
                </div>

                {tamperingData.indicators && tamperingData.indicators.length > 0 && (
                    <div className="tampering-indicators">
                        <h4>🚧 Indicators</h4>
                        <ul>
                            {tamperingData.indicators.map((ind, i) => (
                                <li key={i}>{ind}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </motion.div>

            {/* Verification URL */}
            {result.steps?.url_detection?.url && (
                <motion.div
                    className="result-section glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <h3 className="section-title">🔗 Verification URL</h3>
                    <a href={result.steps.url_detection.url} target="_blank" rel="noopener noreferrer" className="verification-url">
                        {result.steps.url_detection.url}
                    </a>
                    <span className="url-source">Source: {result.steps.url_detection.source}</span>
                </motion.div>
            )}
        </div>
    )
}

export default ResultDashboard
