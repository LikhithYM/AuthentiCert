import { Moon, Sun, Shield, History, Upload, UserCircle } from 'lucide-react'
import './Header.css'

function Header({ theme, onToggleTheme, currentPage, role, onChangeRole, onNavigate }) {
    return (
        <header className="header">
            <div className="header-inner container">
                <div className="header-brand" onClick={() => onNavigate('upload')} role="button" tabIndex={0}>
                    <div className="header-logo">
                        <Shield size={22} />
                    </div>
                    <span className="header-title">AuthentiCert</span>
                </div>

                <nav className="header-nav">
                    {role && (
                        <div className="role-badge">
                            <UserCircle size={14} />
                            <span>{role === 'teacher' ? 'Teacher' : 'Student'}</span>
                            <button className="change-role-btn" onClick={onChangeRole}>Change</button>
                        </div>
                    )}
                    <button
                        className={`nav-link ${currentPage === 'upload' || currentPage === 'verifying' || currentPage === 'result' || currentPage === 'bulk-result' ? 'active' : ''}`}
                        onClick={() => onNavigate('upload')}
                    >
                        <Upload size={16} />
                        Verify
                    </button>
                    <button
                        className={`nav-link ${currentPage === 'history' ? 'active' : ''}`}
                        onClick={() => onNavigate('history')}
                    >
                        <History size={16} />
                        History
                    </button>
                </nav>

                <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
                    <div className="theme-toggle-track">
                        <div className={`theme-toggle-thumb ${theme === 'light' ? 'light' : ''}`}>
                            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                        </div>
                    </div>
                </button>
            </div>
        </header>
    )
}

export default Header
