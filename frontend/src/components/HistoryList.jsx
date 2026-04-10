import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Clock } from 'lucide-react'
import './HistoryList.css'

const STATUS_ICONS = {
    verified: { icon: ShieldCheck, cls: 'badge-success' },
    suspicious: { icon: ShieldAlert, cls: 'badge-warning' },
    tampered: { icon: ShieldX, cls: 'badge-danger' },
    unverifiable: { icon: ShieldQuestion, cls: 'badge-info' },
    error: { icon: ShieldX, cls: 'badge-danger' },
}

function HistoryList({ history, onBack }) {
    return (
        <div className="history-page">
            <div className="history-header">
                <button className="btn btn-outline" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h2>Verification History</h2>
            </div>

            {history.length === 0 ? (
                <motion.div
                    className="history-empty glass-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Clock size={48} className="empty-icon" />
                    <h3>No verifications yet</h3>
                    <p>Upload a certificate to get started</p>
                </motion.div>
            ) : (
                <div className="history-list">
                    {history.map((item, i) => {
                        const conf = STATUS_ICONS[item.final_status] || STATUS_ICONS.error
                        const Icon = conf.icon

                        return (
                            <motion.div
                                key={item.id}
                                className="history-item glass-card"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="history-item-left">
                                    <div className={`history-icon ${conf.cls}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="history-info">
                                        <span className="history-filename">{item.filename}</span>
                                        <span className="history-time">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="history-item-right">
                                    {item.final_score !== null && item.final_score !== undefined && (
                                        <div className="history-score">
                                            <span className="score-num">{item.final_score}%</span>
                                        </div>
                                    )}
                                    <span className={`badge ${conf.cls}`}>
                                        {item.final_status}
                                    </span>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default HistoryList
