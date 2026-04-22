import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowLeft, ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX,
    Check, X, AlertTriangle, Download, Eye, BarChart2
} from 'lucide-react'
import ScoreGauge from './ScoreGauge'
import MismatchDetail from './MismatchDetail'
import './ResultDashboard.css'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:5000/api'

const STATUS_CONFIG = {
    authentic: {
        icon: ShieldCheck,
        label: 'Authentic',
        badgeClass: 'badge-authentic',
        color: 'var(--success)',
    },
    valid: {
        icon: ShieldCheck,
        label: 'Valid (Minor Differences)',
        badgeClass: 'badge-valid',
        color: '#0ea5e9',
    },
    suspicious: {
        icon: ShieldAlert,
        label: 'Suspicious',
        badgeClass: 'badge-warning',
        color: 'var(--warning)',
    },
    tampered: {
        icon: ShieldX,
        label: 'Tampered / Invalid',
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
    const [downloadingPdf, setDownloadingPdf] = useState(false)

    const statusConf  = STATUS_CONFIG[result.final_status] || STATUS_CONFIG.error
    const StatusIcon  = statusConf.icon

    const extractedFields = result.steps?.extraction?.fields || {}
    const officialData    = result.steps?.official_fetch?.data || {}
    const comparisonData  = result.steps?.comparison || {}
    const compFields      = comparisonData.fields || []
    const tamperingData   = result.steps?.tampering || {}
    const mismatches      = result.mismatches || []
    const breakdown       = result.score_breakdown || {}

    const handleDownloadJson = () => {
        const data = JSON.stringify(result, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `verification_${result.id?.slice(0, 8) || 'report'}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleDownloadPdf = async () => {
        setDownloadingPdf(true)
        try {
            const response = await axios.post(`${API_BASE}/report/single`, result, {
                responseType: 'blob',
            })
            const url  = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href  = url
            link.setAttribute('download', `AuthentiCert_${result.id?.slice(0, 8)}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch {
            alert('Failed to download PDF report')
        } finally {
            setDownloadingPdf(false)
        }
    }

    return (
        <div className="result-dashboard">
            {/* Header */}
            <div className="result-header">
                <button className="btn btn-outline" onClick={onBack}>
                    <ArrowLeft size={16} /> New Verification
                </button>
                <div className="result-header-actions">
                    <button className="btn btn-outline" onClick={handleDownloadJson}>
                        <Download size={16} /> JSON
                    </button>
                    <button
                        className="btn btn-primary-sm"
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                    >
                        <Download size={16} /> {downloadingPdf ? 'Generating…' : 'PDF Report'}
                    </button>
                </div>
            </div>

            {/* Hero — Score + Status */}
            <motion.div
                className="result-hero glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="result-hero-content">
                    <div className="result-score-section">
                        <ScoreGauge score={breakdown.match_score ?? result.final_score} status={result.final_status} />
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

            {/* Score Breakdown + Mismatch Panel */}
            {(compFields.length > 0 || mismatches.length > 0) && (
                <motion.div
                    className="result-section glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="section-title">
                        <BarChart2 size={18} /> Comparison Analysis
                    </h3>
                    <MismatchDetail
                        mismatches={mismatches}
                        compFields={compFields}
                        matchScore={breakdown.match_score}
                        textScore={breakdown.text_score}
                        fieldScore={breakdown.field_score}
                        imageScore={breakdown.image_score}
                        collapsible={false}
                    />
                </motion.div>
            )}

            {/* Image Similarity (if available) */}
            {comparisonData.image_score != null && (
                <motion.div
                    className="result-section glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <h3 className="section-title">🖼️ Image Comparison</h3>
                    <div className="image-comparison-row">
                        <div className="img-score-card">
                            <div className="img-score-value" style={{
                                color: comparisonData.image_score >= 85 ? 'var(--success)'
                                     : comparisonData.image_score >= 60 ? 'var(--warning)'
                                     : 'var(--danger)'
                            }}>
                                {comparisonData.image_score?.toFixed(1)}%
                            </div>
                            <div className="img-score-label">Image Similarity (SSIM)</div>
                        </div>
                        {comparisonData.mismatch_regions?.length > 0 && (
                            <div className="img-regions">
                                <span className="img-regions-label">
                                    {comparisonData.mismatch_regions.length} mismatch region{comparisonData.mismatch_regions.length > 1 ? 's' : ''} detected
                                </span>
                                <div className="img-region-list">
                                    {comparisonData.mismatch_regions.slice(0, 5).map((r, i) => (
                                        <span key={i} className="img-region-tag">
                                            {r.description || `Region (${r.x},${r.y})`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
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
                    {Object.entries(extractedFields)
                        .filter(([k]) => k !== 'raw_text')
                        .map(([key, value]) => (
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
                                    {tamperingData.details.ela.tampered
                                        ? '⚠️ Potential edits detected'
                                        : '✅ No significant edits detected'}
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
                                        ? `⚠️ Editor: ${tamperingData.details.metadata.editor_name}`
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

                {tamperingData.indicators?.length > 0 && (
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
                    transition={{ delay: 0.5 }}
                >
                    <h3 className="section-title">🔗 Verification URL</h3>
                    <a
                        href={result.steps.url_detection.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="verification-url"
                    >
                        {result.steps.url_detection.url}
                    </a>
                    <span className="url-source">Source: {result.steps.url_detection.source}</span>
                </motion.div>
            )}
        </div>
    )
}

export default ResultDashboard
