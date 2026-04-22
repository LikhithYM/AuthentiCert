import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Image, X } from 'lucide-react'
import './UploadZone.css'

const ACCEPT = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
}

function UploadZone({ onUpload, onBulkUpload, mode = 'single' }) {
    const [selectedFiles, setSelectedFiles] = useState([])

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            if (mode === 'single') {
                setSelectedFiles([acceptedFiles[0]])
            } else {
                // In bulk mode, append or replace? Let's replace for simplicity
                setSelectedFiles(acceptedFiles.slice(0, 100)) // Max 100
            }
        }
    }, [mode])

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: ACCEPT,
        maxSize: 16 * 1024 * 1024, // 16 MB
        multiple: mode === 'bulk',
    })

    const handleVerify = () => {
        if (selectedFiles.length === 1 && mode === 'single') {
            onUpload(selectedFiles[0])
        } else if (selectedFiles.length > 0 && mode === 'bulk') {
            onBulkUpload(selectedFiles)
        }
    }

    const handleClear = (e) => {
        e.stopPropagation()
        setSelectedFiles([])
    }

    const handleRemoveFile = (e, index) => {
        e.stopPropagation()
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const getFileIcon = (file) => {
        if (file.type === 'application/pdf') return <FileText size={24} />
        return <Image size={24} />
    }

    return (
        <div className="upload-zone-wrapper animate-fade-in-up animate-delay-2">
            <div
                {...getRootProps()}
                className={`upload-zone glass-card ${isDragActive ? 'drag-active' : ''} ${isDragReject ? 'drag-reject' : ''} ${selectedFiles.length > 0 ? 'has-file' : ''}`}
            >
                <input {...getInputProps()} id="certificate-upload" />

                <AnimatePresence mode="wait">
                    {selectedFiles.length === 0 ? (
                        <motion.div
                            key="empty"
                            className="upload-empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <h3>{mode === 'bulk' ? 'Drop multiple certificates here' : 'Drop your certificate here'}</h3>
                            <p>or click to browse files</p>
                            <div className="upload-formats">
                                <span className="format-badge">PDF</span>
                                <span className="format-badge">JPG</span>
                                <span className="format-badge">PNG</span>
                            </div>
                            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Bulk upload supported (50+ files)
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="selected"
                            className="upload-selected"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {mode === 'single' ? (
                                <div className="file-preview-row">
                                    <div className="file-icon-box">
                                        {getFileIcon(selectedFiles[0])}
                                    </div>
                                    <div className="file-info">
                                        <span className="file-name">{selectedFiles[0].name}</span>
                                        <span className="file-size">{formatSize(selectedFiles[0].size)}</span>
                                    </div>
                                    <button className="file-remove" onClick={handleClear}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="bulk-file-list">
                                    <div className="bulk-file-header">
                                        <span>{selectedFiles.length} files selected</span>
                                        <button className="btn-clear-all" onClick={handleClear}>Clear All</button>
                                    </div>
                                    <div className="bulk-scroll-area">
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="file-preview-row compact">
                                                <div className="file-info">
                                                    <span className="file-name">{file.name}</span>
                                                    <span className="file-size">{formatSize(file.size)}</span>
                                                </div>
                                                <button className="file-remove" onClick={(e) => handleRemoveFile(e, idx)}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {selectedFiles.length > 0 && (
                <motion.div
                    className="upload-actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button className="btn btn-primary btn-verify" onClick={handleVerify}>
                        <Shield size={18} />
                        {mode === 'bulk' ? `Verify ${selectedFiles.length} Certificates` : 'Verify Certificate'}
                    </button>
                </motion.div>
            )}
        </div>
    )
}

function Shield({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    )
}

export default UploadZone
