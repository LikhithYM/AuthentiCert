import React from 'react';
import './RoleSelector.css';

function RoleSelector({ onSelectRole }) {
    return (
        <div className="role-selector animate-fade-in-up">
            <div className="role-header">
                <h2>Welcome to AuthentiCert</h2>
                <p>Select your role to get started with certificate verification</p>
            </div>

            <div className="role-cards">
                <button
                    className="role-card glass-card student-card"
                    onClick={() => onSelectRole('student')}
                >
                    <div className="role-icon">🧑‍🎓</div>
                    <h3>Student / User</h3>
                    <p>Verify a single certificate instantly to check its authenticity.</p>
                    <ul className="role-features">
                        <li>✓ Single file upload</li>
                        <li>✓ Instant detailed results</li>
                        <li>✓ Downloadable report</li>
                    </ul>
                </button>

                <button
                    className="role-card glass-card teacher-card"
                    onClick={() => onSelectRole('teacher')}
                >
                    <div className="role-icon">👨‍🏫</div>
                    <h3>Teacher / Evaluator</h3>
                    <p>Verify multiple student certificates at once in a batch process.</p>
                    <ul className="role-features">
                        <li>✓ Bulk upload (up to 100 files)</li>
                        <li>✓ Summary dashboard</li>
                        <li>✓ Export full batch PDF report</li>
                    </ul>
                </button>
            </div>
        </div>
    );
}

export default RoleSelector;
