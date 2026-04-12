# 🛡️ AuthentiCert - Certificate Authenticity Verification System

AuthentiCert is a full-stack AI-powered system designed to instantly verify the authenticity of educational and professional certificates. Using advanced OCR, web scraping, and AI image analysis, the platform detects tampering and matches certificate data against official databases, ensuring a high degree of trust and reliability.

## ✨ Key Features

- **🔍 OCR Extraction:** Advanced text and data extraction from PDFs and images using Tesseract OCR.
- **🔗 Official Source Verification:** Automatically fetches and compares extracted information from official verification databases to identify discrepancies.
- **🛡️ AI Tampering Detection:** Identifies potential image manipulation and Photoshop artifacts.
- **📱 Multi-format Support:** Validate documents across different formats including images and PDFs.
- **⚙️ Role-based Access:** Supports individual single-document verification and bulk validation processing based on roles (Teacher/Student).
- **📊 Comprehensive Reporting:** Generate and download detailed PDF verification reports.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, CSS, Axios
- **Backend:** Python, Flask
- **Data Processing:** Tesseract OCR for text extraction

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (3.9+)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/LikhithYM/AuthentiCert.git
   cd AuthentiCert
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   Start the backend server:
   ```bash
   python app.py
   ```
   *The backend will run on `http://127.0.0.1:5000`.*

3. **Frontend Setup**
   Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

## 📂 Project Structure

```text
AuthentiCert/
├── backend/                  # Flask Python APIs
│   ├── app.py                # App entrypoint
│   ├── extractor.py          # Text Extraction Scripts
│   ├── scraper.py            # Official Database Scrapers
│   ├── tampering.py          # Computer Vision Modules
│   ├── comparator.py         # Data Matching Layer
│   └── report_generator.py   # Final PDF report creation
└── frontend/                 # React UI
    ├── src/
    │   ├── components/       # Interface Sub-components
    │   ├── App.jsx           # Main App Logic
    │   └── ...
    └── package.json          # Dependency definitions
```

## 📄 License
This project is open-source.
