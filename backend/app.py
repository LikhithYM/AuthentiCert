"""
Certificate Authenticity Verification System — Flask Backend
"""
import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Enable CORS for frontend
    CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])
    
    # Register API routes
    from routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Root welcome page
    @app.route('/')
    def index():
        return '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CertVerify API</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    background: #0a0e1a;
                    color: #f3f4f6;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                body::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background:
                        radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.05) 0%, transparent 50%);
                    pointer-events: none;
                }
                .container {
                    position: relative;
                    text-align: center;
                    max-width: 600px;
                    padding: 3rem 2rem;
                    background: rgba(17,24,39,0.8);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    backdrop-filter: blur(16px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                }
                .logo {
                    width: 56px; height: 56px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.5rem;
                    font-size: 1.5rem; color: white;
                }
                h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
                .gradient { background: linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                p { color: #9ca3af; margin-bottom: 1.5rem; line-height: 1.6; }
                .badge {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.375rem 0.875rem;
                    background: rgba(16,185,129,0.12);
                    border: 1px solid rgba(16,185,129,0.2);
                    border-radius: 9999px;
                    color: #10b981; font-size: 0.8125rem; font-weight: 600;
                }
                .dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: pulse 2s ease-in-out infinite; }
                @keyframes pulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
                .endpoints { text-align: left; margin-top: 1.5rem; }
                .endpoints h3 { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
                .ep {
                    display: flex; align-items: center; gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                }
                .method {
                    padding: 0.25rem 0.5rem; border-radius: 4px;
                    font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.04em;
                }
                .get { background: rgba(59,130,246,0.15); color: #3b82f6; }
                .post { background: rgba(245,158,11,0.15); color: #f59e0b; }
                .path { font-family: monospace; font-size: 0.875rem; color: #d1d5db; }
                .desc { margin-left: auto; font-size: 0.75rem; color: #6b7280; }
                a { color: #6366f1; text-decoration: none; }
                a:hover { color: #818cf8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🛡️</div>
                <h1>Cert<span class="gradient">Verify</span> API</h1>
                <p>Certificate Authenticity Verification System backend is running.</p>
                <div class="badge"><span class="dot"></span> Server Online</div>
                <div class="endpoints">
                    <h3>API Endpoints</h3>
                    <div class="ep">
                        <span class="method post">POST</span>
                        <span class="path">/api/verify</span>
                        <span class="desc">Upload &amp; verify certificate</span>
                    </div>
                    <div class="ep">
                        <span class="method get">GET</span>
                        <span class="path">/api/history</span>
                        <span class="desc">Verification history</span>
                    </div>
                    <div class="ep">
                        <span class="method get">GET</span>
                        <span class="path">/api/health</span>
                        <span class="desc">Health check</span>
                    </div>
                </div>
                <p style="margin-top:1.5rem; font-size: 0.8125rem;">
                    Frontend: <a href="http://localhost:5173" target="_blank">http://localhost:5173</a>
                </p>
            </div>
        </body>
        </html>
        '''
    
    # Health check endpoint
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'online', 'service': 'CertVerify API'})
    
    # Serve uploaded files (for preview)
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
