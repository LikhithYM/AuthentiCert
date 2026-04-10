import { useState, useCallback } from 'react'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import ProgressTracker from './components/ProgressTracker'
import ResultDashboard from './components/ResultDashboard'
import BulkResultsDashboard from './components/BulkResultsDashboard'
import HistoryList from './components/HistoryList'
import RoleSelector from './components/RoleSelector'
import axios from 'axios'
import './App.css'

const API_BASE = 'http://127.0.0.1:5000/api'

const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'extraction', label: 'Text Extraction' },
  { id: 'url_detection', label: 'URL Detection' },
  { id: 'official_fetch', label: 'Fetching Official Data' },
  { id: 'comparison', label: 'Comparing' },
  { id: 'tampering', label: 'Tampering Analysis' },
  { id: 'result', label: 'Result' },
]

function App() {
  const [theme, setTheme] = useState('dark')
  const [role, setRole] = useState(null) // null | 'student' | 'teacher'
  const [page, setPage] = useState('upload') // upload | verifying | result | bulk-result | history
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState(null)
  const [bulkResult, setBulkResult] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }, [])

  const handleUpload = useCallback(async (file) => {
    setError(null)
    setResult(null)
    setPage('verifying')
    setCurrentStep(0)

    const formData = new FormData()
    formData.append('file', file)

    // Animate through steps
    const stepDelay = (step) => new Promise(resolve => {
      setTimeout(() => {
        setCurrentStep(step)
        resolve()
      }, 600)
    })

    try {
      await stepDelay(1) // extraction

      const response = await axios.post(`${API_BASE}/verify`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Animate remaining steps
      await stepDelay(2) // url detection
      await stepDelay(3) // official fetch
      await stepDelay(4) // comparison
      await stepDelay(5) // tampering
      await stepDelay(6) // result

      setResult(response.data)
      setPage('result')

      // Fetch updated history
      try {
        const histRes = await axios.get(`${API_BASE}/history`)
        setHistory(histRes.data)
      } catch { /* ignore */ }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Verification failed'
      setError(msg)
      setPage('upload')
    }
  }, [])

  const handleBulkUpload = useCallback(async (files) => {
    setError(null)
    setBulkResult(null)
    setPage('verifying')
    setCurrentStep(0)

    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    const stepDelay = (step) => new Promise(resolve => setTimeout(() => { setCurrentStep(step); resolve() }, 600))

    try {
      await stepDelay(1)

      const response = await axios.post(`${API_BASE}/verify-bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await stepDelay(2)
      await stepDelay(3)
      await stepDelay(4)
      await stepDelay(5)
      await stepDelay(6)

      setBulkResult(response.data)
      setPage('bulk-result')

      try {
        const histRes = await axios.get(`${API_BASE}/history`)
        setHistory(histRes.data)
      } catch { /* ignore */ }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Bulk verification failed'
      setError(msg)
      setPage('upload')
    }
  }, [])

  const handleDownloadReport = useCallback(async () => {
    if (!bulkResult) return;
    try {
      const response = await axios.post(`${API_BASE}/report`, bulkResult, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AuthentiCert_Report_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Failed to download PDF report");
    }
  }, [bulkResult])

  const goToUpload = useCallback(() => {
    setPage('upload')
    setResult(null)
    setBulkResult(null)
    setError(null)
    setCurrentStep(0)
  }, [])

  const handleChangeRole = useCallback(() => {
    setRole(null)
    setPage('upload')
  }, [])

  const goToHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`)
      setHistory(res.data)
    } catch { /* ignore */ }
    setPage('history')
  }, [])

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        currentPage={page}
        role={role}
        onChangeRole={handleChangeRole}
        onNavigate={(p) => {
          if (p === 'history') goToHistory()
          else goToUpload()
        }}
      />

      <main className="main-content">
        <div className="container">
          {!role && (
            <RoleSelector onSelectRole={setRole} />
          )}

          {role && page === 'upload' && (
            <div className="page animate-fade-in-up">
              <div className="hero-section">
                <div className="hero-badge">
                  <span className="hero-badge-dot"></span>
                  AI-Powered Verification
                </div>
                <h1 className="hero-title">
                  Certificate Authenticity
                  <span className="hero-gradient"> Verification</span>
                </h1>
                <p className="hero-subtitle">
                  Upload any certificate to instantly verify its authenticity using OCR extraction,
                  official source comparison, and AI-powered tampering detection.
                </p>
              </div>

              {error && (
                <div className="error-banner animate-fade-in-up">
                  <span>⚠️</span> {error}
                  <button onClick={() => setError(null)} className="error-close">×</button>
                </div>
              )}

              <UploadZone
                mode={role === 'teacher' ? 'bulk' : 'single'}
                onUpload={handleUpload}
                onBulkUpload={handleBulkUpload}
              />

              <div className="features-grid animate-fade-in-up animate-delay-3">
                <div className="feature-card glass-card">
                  <div className="feature-icon" style={{ background: 'var(--info-bg)' }}>🔍</div>
                  <h3>OCR Extraction</h3>
                  <p>Advanced text extraction from PDFs and images using Tesseract OCR</p>
                </div>
                <div className="feature-card glass-card">
                  <div className="feature-icon" style={{ background: 'var(--warning-bg)' }}>🔗</div>
                  <h3>Source Verification</h3>
                  <p>Fetches and compares data from official verification pages</p>
                </div>
                <div className="feature-card glass-card">
                  <div className="feature-icon" style={{ background: 'var(--danger-bg)' }}>🛡️</div>
                  <h3>Tampering Detection</h3>
                  <p>AI-powered image analysis detects Photoshop edits and manipulations</p>
                </div>
              </div>
            </div>
          )}

          {role && page === 'verifying' && (
            <div className="page animate-fade-in-up">
              <div className="verifying-section">
                <h2>Verifying Certificate{role === 'teacher' ? 's' : ''}...</h2>
                <p className="text-secondary">Please wait while we analyze your document{role === 'teacher' ? 's' : ''}</p>
                <ProgressTracker steps={STEPS} currentStep={currentStep} />
              </div>
            </div>
          )}

          {role && page === 'result' && result && (
            <div className="page animate-fade-in-up">
              <ResultDashboard result={result} onBack={goToUpload} />
            </div>
          )}

          {role && page === 'bulk-result' && bulkResult && (
            <div className="page animate-fade-in-up">
              <BulkResultsDashboard
                batchResult={bulkResult}
                onBack={goToUpload}
                onDownloadReport={handleDownloadReport}
              />
            </div>
          )}

          {role && page === 'history' && (
            <div className="page animate-fade-in-up">
              <HistoryList history={history} onBack={goToUpload} />
            </div>
          )}
        </div>
      </main >
    </>
  )
}

export default App
