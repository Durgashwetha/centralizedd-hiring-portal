# 🚀 CampusQuant AI — Enterprise Campus Placement & Virtual Hiring Platform

**CampusQuant AI** is a state-of-the-art, end-to-end Institutional Career Co-pilot & Virtual Placement Management Platform powered by **XGBoost Machine Learning**, **Groq LLaMA 3 Generative AI**, and **Real-time WebRTC / Web Speech Video Interviewing**.

Designed specifically for universities, recruiters, and engineering candidates, CampusQuant AI streamlines campus hiring drives, automates candidate screening with 94.5% ML accuracy, and provides Google Meet-style virtual interview rooms with automated email scorecards.

---

## 🌟 Key Features & Capabilities

### 🎓 1. Student Portal & Academic Career Tracker
- **USN Branch Detection**: Auto-detects academic department from University Student Number (USN) across 100+ VTU, Autonomous, AICTE, and Deemed University branch codes (e.g., `CD` / `DS` → *Computer Science & Data Science*, `CS` → *Computer Science & Engineering*).
- **Auto-Calculated CGPA & SGPA Tracker**: Interactive Semester 1 to Semester 8 SGPA input grid with real-time cumulative CGPA auto-calculation.
- **11-Feature Academic Portfolio**: Records 10th Marks %, 12th/Diploma Marks %, CGPA, Active Backlogs, Major Projects, Mini Projects, Certifications & Workshops, Internship Experience, Hackathons, Technical Skills, and Communication Rating.
- **XGBoost Placement Probability Engine**: Real-time ML prediction of candidate placement likelihood with personalized positive drivers and actionable improvement areas.
- **ATS Resume PDF Reviewer**: Instant PDF resume parser and ATS compatibility analyzer scoring keyword match, layout quality, and experience impact.
- **Groq LLaMA 3 Skill Gap Analyzer**: Compares candidate skill set against target Job Descriptions (JD) to highlight missing skills and learning roadmaps.
- **Interactive Mock Interview Simulator**: Features technical and HR mock rounds with voice-to-text recording, real-time timer, AI feedback, and performance scoring.
- **Virtual Google Meet Invitations**: Direct dashboard view for recruiter-scheduled live virtual interviews with strict 30-minute active window security locks.

### 🏢 2. Recruiter Portal & Drive Isolation Engine
- **Isolated Campus Drive Management**: Strict data isolation ensuring recruiters only view and manage campus hiring drives posted by their own enterprise organization.
- **Structured Campus Drive Posting**: Create rich job descriptions with CTC (LPA), minimum CGPA criteria, backlog limits, required skills, and job locations.
- **Applicant Pipeline & Resume Review**: View candidate profiles, download resumes, and review calculated AI Fit Scores.
- **AI Head-to-Head Candidate Matrix**: Compare candidate profiles side-by-side using Groq LLaMA 3 to generate structured Markdown comparison tables with clear candidate advantage badges (`Candidate A`, `Candidate B`, `Tie`).
- **Google Meet Interview Scheduler**: Schedule virtual hiring rounds with target dates, times, and interviewer instructions.
- **Live Google Meet Room Launcher**: One-click launch into WebRTC video rooms with live speech transcription during the active meeting window.

### 🏛️ 3. Institutional Admin Portal
- **Campus Placement Analytics**: Institution-wide statistics covering overall placement rate, active campus drives, total registered candidates, and average CTC.
- **Talent Pool & Drive Oversight**: Approve job postings, oversee student profiles, and monitor active virtual hiring drives.
- **Student Comparison Matrix**: Side-by-side candidate comparative table rendering cleanly formatted markdown matrices.

### 📹 4. Enterprise Google Meet Virtual Interview Room
- **WebRTC Audio/Video Streaming**: Real-time camera self-view with floating Picture-in-Picture (PiP) drag-free candidate/recruiter view.
- **Live Speech-to-Text Transcriber**: Continuous Web Speech API transcription recording spoken candidate responses into real-time interview notes.
- **In-Room AI Notes Summarizer**: One-click Groq LLaMA 3 synthesis turning raw speech transcripts into structured evaluation notes.
- **Strict 30-Minute Active Window Lock**:
  - **Early Access Lock**: Locks virtual room if accessed > 5 minutes before scheduled start time.
  - **Expiry Lock**: Automatically locks link and marks meeting expired > 35 minutes after scheduled start time (granting a 30-min interview window + 5-min grace period).
- **Automated SMTP Scorecard Dispatch**: On recruiter "End Meeting", the synthesized AI evaluation scorecard is instantly dispatched directly to the student's registered email address.

---

## 🤖 XGBoost Machine Learning Model Specification

The placement prediction module is powered by an **XGBoost (Extreme Gradient Boosting)** binary classifier trained on **10,002 student academic and technical records** (`Placement_Prediction_data.csv`).

### 📊 Model Performance Metrics

| Metric | Score / Percentage |
| :--- | :--- |
| **Model Architecture** | `XGBoostClassifier` (n_estimators=150, max_depth=6, learning_rate=0.1) |
| **Accuracy** | **94.50%** (`0.9450`) |
| **Precision** | **92.83%** (`0.9283`) |
| **Recall** | **94.16%** (`0.9416`) |
| **F1 Score** | **93.49%** (`0.9349`) |
| **ROC AUC** | **99.04%** (`0.9904`) |

### 🛠️ Trained Model Features & Feature Importance Breakdown

The model evaluates **11 exact candidate features** to predict placement probability:

| Feature Name | Description | Importance Weight (%) |
| :--- | :--- | :--- |
| **Active Backlogs** | Number of current uncleared backlogs | **65.00%** |
| **Internship Experience** | Binary indicator of industrial internship (`Yes`/`No`) | **10.32%** |
| **CGPA** | Cumulative Grade Point Average (0.0 - 10.0) | **5.78%** |
| **Technical Skills Count** | Number of verified programming skills | **5.01%** |
| **Certifications & Workshops**| Count of completed certifications & technical workshops | **3.25%** |
| **Hackathon Experience** | Binary indicator of hackathon participation (`Yes`/`No`)| **3.20%** |
| **10th Percentage** | High school SSLC percentage | **2.70%** |
| **Mini Projects Count** | Count of mini & course projects | **1.50%** |
| **12th / Diploma %** | Senior secondary / polytechnic diploma percentage | **1.23%** |
| **Communication Rating** | Verbal & technical communication score (1.0 - 5.0) | **1.13%** |
| **Major Projects Count** | Count of major capstone software projects | **0.90%** |

---

## 💻 Software & System Requirements

### Required Runtimes & Dependencies
- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: v18.0.0 or higher (v20.11.0 recommended)
- **Python**: v3.10.0 or higher (v3.11 recommended)
- **Database**: SQLite (default `backend/campusquant.db`) or MySQL / PostgreSQL
- **Groq API Key**: (Optional for LLM features; fallbacks included)

### Python Backend Packages (`requirements.txt`)
```txt
fastapi>=0.100.0
uvicorn>=0.22.0
pydantic>=2.0.0
sqlalchemy>=2.0.0
xgboost>=1.7.0
scikit-learn>=1.2.0
joblib>=1.3.0
pandas>=2.0.0
numpy>=1.24.0
groq>=0.4.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
pdfplumber>=0.10.0
```

### Frontend Dependencies (`frontend/package.json`)
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: TailwindCSS & Custom Vanilla CSS Design System
- **Icons**: Lucide React (`lucide-react`)
- **HTTP Client**: Axios

---

## 🚀 How to Run the Application

### ⚡ Option 1: One-Click Master Launcher (Windows - Recommended)

Double-click or run the master script located at the project root:

```cmd
START_APP.bat
```

What `START_APP.bat` does automatically:
1. Cleans up stale background Python/Node processes.
2. Sets up runtime PATHs.
3. Launches FastAPI backend server on `http://127.0.0.1:8000`.
4. Launches Vite React frontend server on `http://localhost:5173`.
5. Automatically opens `http://localhost:5173` in your default browser!

---

### 🛠️ Option 2: Manual Terminal Execution

#### Step 1: Start Backend Server
```bash
# Navigate to project root
cd d:\Bangalore_project

# Activate Python Virtual Environment
.venv\Scripts\activate

# Start FastAPI server via Uvicorn
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API will run at:* `http://127.0.0.1:8000`  
*Interactive Swagger API Documentation:* `http://127.0.0.1:8000/docs`

#### Step 2: Start Frontend Server (In a new terminal window)
```bash
# Navigate to frontend directory
cd d:\Bangalore_project\frontend

# Install dependencies (if first run)
npm install

# Start Vite dev server
npm run dev
```
*Frontend application will run at:* `http://localhost:5173`

---

## 🔁 Model Re-Training Procedure

If you modify `Placement_Prediction_data.csv` or want to tune hyper-parameters:

```bash
cd d:\Bangalore_project
.venv\Scripts\python.exe train_model.py
```

This will retrain the `XGBoostClassifier`, calculate new evaluation metrics, update `backend/models/placement_model.joblib`, `scaler.joblib`, and regenerate `backend/models/model_metadata.json`.

---

## 🏆 Summary of Quality Audits & Verification

- ✅ **XGBoost Feature Alignment**: Verified all 11 features match between dataset, model, FastAPI backend schema, and React Student Portal form.
- ✅ **Google Meet 30-Min Window**: Strictly enforces lock screens before start time and automatically expires meeting links 35 minutes after scheduled time.
- ✅ **Recruiter Isolation**: Recruiters only access their own posted campus drives and candidate applications.
- ✅ **Email Scorecards**: Auto-sends synthesized candidate evaluation scorecards directly to student emails upon meeting end.
- ✅ **USN Branch Mapper**: Supports 100+ VTU/AICTE branch codes with `CD` correctly mapped to *Computer Science & Data Science*.

---

*Designed and developed for institutional campus placement excellence.*
