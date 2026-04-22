# 🛡️ AuthentiCert - Certificate Authenticity Verification System

AuthentiCert is a state-of-the-art, full-stack AI-powered platform designed to instantly and reliably verify the authenticity of educational and professional certificates. By combining advanced Optical Character Recognition (OCR), automated web scraping, structural image comparison, and AI-driven tampering detection, AuthentiCert provides a robust defense against credential fraud.

![AuthentiCert UI Demo](https://via.placeholder.com/1000x500.png?text=AuthentiCert+Dashboard)

## ✨ Key Features

- **🔍 Intelligent OCR Extraction:** High-accuracy text and metadata extraction from both PDFs and image formats using Tesseract OCR.
- **🔗 Automated Source Verification:** Dynamically scrapes and fetches official verification records from institutional databases to validate claims.
- **⚖️ Granular Data Comparison:** Matches extracted certificate fields against official data with similarity scoring and visual mismatch highlighting.
- **🛡️ AI Tampering & Fraud Detection:** Advanced computer vision techniques including Error Level Analysis (ELA), metadata inspection, and font inconsistency detection to flag forged documents.
- **🖼️ Image Similarity Scoring:** Structural Similarity Index (SSIM) checks between uploaded certificates and official institutional templates.
- **⚡ Professional Enterprise UI:** A premium, responsive, cybersecurity-themed interface built with React, featuring glassmorphism, subtle animations, and intuitive data visualizations (score gauges, progress trackers).
- **👥 Role-Based Workflows:** Supports distinct user flows (e.g., Single Document verification for Students, Bulk Validation for Teachers).
- **📊 Comprehensive PDF Reporting:** Generates and downloads detailed, forensic verification reports for individual files or bulk batches.

## 🛠️ Technology Stack

### Frontend (User Interface)
- **Framework:** React 19, Vite
- **Styling:** Custom CSS (Cybersecurity Dark Theme, Glassmorphism)
- **Animations & Icons:** Framer Motion, Lucide React
- **HTTP Client:** Axios
- **File Uploads:** React Dropzone

### Backend (Processing Engine)
- **Framework:** Python 3.9+, Flask
- **Data Extraction:** PyTesseract (OCR), PyMuPDF
- **Web Scraping:** Beautiful Soup 4 / Selenium (for official data retrieval)
- **Computer Vision:** OpenCV, Pillow, scikit-image (for tampering and SSIM)
- **Document Generation:** ReportLab (for PDF reports)

## 📂 Project Architecture

```text
AuthentiCert/
├── backend/                  # Python Flask Application
│   ├── app.py                # Main Flask application instance
│   ├── routes.py             # API endpoint definitions (/verify, /verify-bulk, /report)
│   ├── extractor.py          # OCR and PDF text extraction logic
│   ├── scraper.py            # Automated official database fetching
│   ├── tampering.py          # Error Level Analysis (ELA) & metadata forensics
│   ├── comparator.py         # Textual and field-level similarity scoring
│   ├── image_comparator.py   # Structural Image Comparison (SSIM)
│   ├── normalizer.py         # String normalization and cleansing
│   ├── report_generator.py   # Forensic PDF report generation
│   └── requirements.txt      # Python dependencies
└── frontend/                 # React Frontend
    ├── src/
    │   ├── components/       # Reusable UI components (UploadZone, ResultDashboard, etc.)
    │   ├── App.jsx           # Main React Application router/state
    │   ├── App.css           # Global layout styling
    │   └── index.css         # Design system tokens and animations
    ├── index.html            # HTML entry point
    ├── vite.config.js        # Vite bundler configuration
    └── package.json          # Node dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (3.9 or higher)
- Tesseract OCR (Must be installed on the host system and added to PATH)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/LikhithYM/AuthentiCert.git
   cd AuthentiCert
   ```

2. **Backend Setup**
   Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   # Optional: Create a virtual environment
   # python -m venv venv
   # source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   pip install -r requirements.txt
   ```
   Start the backend Flask server:
   ```bash
   python app.py
   ```
   *The backend will run on `http://127.0.0.1:5000`.*

3. **Frontend Setup**
   Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
   Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

## 🔒 Usage Flow

1. **Select Role:** Choose between Student (single upload) or Teacher (bulk upload).
2. **Upload Document:** Drag and drop a PDF, JPG, or PNG certificate.
3. **Automated Verification:** The system automatically extracts text, locates the verification URL, scrapes the official record, compares the data, and runs tampering forensics.
4. **Review Results:** View the comprehensive dashboard showing the overall match score, specific field mismatches, tampering indicators, and image similarity.
5. **Download Report:** Export a detailed PDF breakdown of the analysis.

## 📄 License
This project is open-source.
