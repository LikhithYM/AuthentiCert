import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import './ScoreGauge.css'

function ScoreGauge({ score, status }) {
    const [displayed, setDisplayed] = useState(0)

    useEffect(() => {
        if (score === null || score === undefined) return
        const duration = 1500
        const start = performance.now()
        const animate = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayed(Math.round(eased * score))
            if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }, [score])

    if (score === null || score === undefined) {
        return (
            <div className="score-gauge">
                <div className="gauge-ring unverifiable">
                    <svg viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" className="gauge-bg" />
                    </svg>
                    <div className="gauge-center">
                        <span className="gauge-value">?</span>
                        <span className="gauge-label">N/A</span>
                    </div>
                </div>
            </div>
        )
    }

    const radius = 52
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (displayed / 100) * circumference

    const getColor = () => {
        if (status === 'verified') return 'var(--success)'
        if (status === 'suspicious') return 'var(--warning)'
        if (status === 'tampered') return 'var(--danger)'
        return 'var(--text-muted)'
    }

    const getGlow = () => {
        return 'none'
    }

    return (
        <div className="score-gauge">
            <motion.div
                className="gauge-ring"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                style={{ filter: `drop-shadow(${getGlow()})` }}
            >
                <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={radius} className="gauge-bg" />
                    <motion.circle
                        cx="60"
                        cy="60"
                        r={radius}
                        className="gauge-fill"
                        style={{
                            stroke: getColor(),
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                        }}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                </svg>
                <div className="gauge-center">
                    <span className="gauge-value" style={{ color: getColor() }}>{displayed}</span>
                    <span className="gauge-unit">%</span>
                    <span className="gauge-label">Authenticity</span>
                </div>
            </motion.div>
        </div>
    )
}

export default ScoreGauge
