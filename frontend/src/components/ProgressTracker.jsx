import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import './ProgressTracker.css'

function ProgressTracker({ steps, currentStep }) {
    return (
        <div className="progress-tracker glass-card">
            <div className="progress-steps">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep
                    const isPending = index > currentStep

                    return (
                        <div
                            key={step.id}
                            className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
                        >
                            <div className="step-indicator-wrapper">
                                <motion.div
                                    className="step-indicator"
                                    animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    {isCompleted ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', duration: 0.4 }}
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </motion.div>
                                    ) : isCurrent ? (
                                        <Loader2 size={14} className="spinner" />
                                    ) : (
                                        <span className="step-number">{index + 1}</span>
                                    )}
                                </motion.div>

                                {index < steps.length - 1 && (
                                    <div className="step-connector">
                                        <motion.div
                                            className="step-connector-fill"
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: isCompleted ? 1 : 0 }}
                                            transition={{ duration: 0.4, ease: 'easeOut' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <span className="step-label">{step.label}</span>
                        </div>
                    )
                })}
            </div>

            <div className="progress-bar-wrapper">
                <motion.div
                    className="progress-bar-fill"
                    animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}

export default ProgressTracker
