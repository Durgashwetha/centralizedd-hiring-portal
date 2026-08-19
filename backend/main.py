import os
import io
import json
import base64
import pdfplumber
import bcrypt
from typing import List, Optional
import threading
import time
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.config import settings
from backend.database import Base, engine, get_db, SessionLocal
from backend.models import User, StudentProfile, JobPosting, Application, DriveReport, InterviewRequest
from backend.ml_service import predict_placement_likelihood, get_model_metadata
from backend import groq_service
from backend.email_service import (
    send_approval_email, 
    send_rejection_email, 
    send_incomplete_profile_warning_email,
    send_recruiter_drive_approval_email,
    send_interview_scorecard_to_student_email
)

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

def incomplete_profile_watchdog():
    """
    Background worker thread that runs every 60 seconds.
    Checks for student accounts created > 5 minutes ago with incomplete profiles,
    sends a warning email notice to complete their profile within 3 working days,
    and flags completion_email_sent = True.
    """
    while True:
        try:
            time.sleep(60)
            db = SessionLocal()
            five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
            
            profiles = db.query(StudentProfile).filter(
                StudentProfile.completion_email_sent == False
            ).all()

            for prof in profiles:
                user = db.query(User).filter(User.id == prof.user_id).first()
                if not user or user.role != "student":
                    continue
                
                if user.created_at and user.created_at <= five_mins_ago:
                    is_incomplete = (
                        (not prof.resume_text or len(prof.resume_text.strip()) < 20) and
                        (prof.cgpa == 0.0 or not prof.skills_list or prof.skills_list == "")
                    )
                    
                    if is_incomplete:
                        send_incomplete_profile_warning_email(user.email, user.full_name)
                    
                    prof.completion_email_sent = True
                    db.commit()
            db.close()
        except Exception as e:
            print(f"Error in incomplete profile watchdog: {e}")

# Start background thread on startup
watchdog_thread = threading.Thread(target=incomplete_profile_watchdog, daemon=True)
watchdog_thread.start()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Centralized Placement Prediction & Talent Analytics System"
)

# Enable CORS for Frontend Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login")

# Helper Functions using Native bcrypt
def get_password_hash(password: str) -> str:
    pwd_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password[:72].encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

# Automatic Database Seeder for Mandatory Placement Officer Account
@app.on_event("startup")
def seed_mandatory_accounts():
    db = SessionLocal()
    try:
        admin_emails = ["placement@cmr@gmail.com", "placement@cmr.edu"]
        for email_addr in admin_emails:
            existing = db.query(User).filter(User.email == email_addr).first()
            if not existing:
                admin_user = User(
                    email=email_addr,
                    hashed_password=get_password_hash("Placement@cmr123"),
                    full_name="CMR Placement Officer",
                    role="admin"
                )
                db.add(admin_user)
                db.commit()
                print(f"Seeded mandatory Placement Officer account: {email_addr}")
            else:
                existing.hashed_password = get_password_hash("Placement@cmr123")
                existing.role = "admin"
                db.commit()
    except Exception as e:
        print(f"Seeding note: {e}")
    finally:
        db.close()

# Pydantic Schemas
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "student"
    usn: Optional[str] = None
    company_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class StudentProfileUpdate(BaseModel):
    branch: Optional[str] = "Computer Science"
    cgpa: float
    major_projects: int = 1
    mini_projects: int = 2
    workshops_certs: int = 2
    skills_count: int = 5
    skills_list: str = "Python, React, SQL"
    communication_rating: float = 4.0
    internship: str = "Yes"
    hackathon: str = "No"
    tenth_percentage: float = 85.0
    twelfth_percentage: float = 82.0
    backlogs: int = 0
    projects_details: Optional[str] = "[]"
    internships_details: Optional[str] = "[]"
    certifications_details: Optional[str] = "[]"
    sgpa_details: Optional[str] = "{}"

class JobCreateRequest(BaseModel):
    title: str
    description: str
    location: str = "Bangalore"
    ctc_lpa: float = 8.0
    min_cgpa: float = 7.0
    max_backlogs: int = 0
    required_skills: str = "Python, SQL"

class SkillGapRequest(BaseModel):
    job_description: str

class MentorChatRequest(BaseModel):
    message: str
    chat_history: List[dict] = []

class MockAnswerRequest(BaseModel):
    question: str
    answer: str

class ApplicationStatusUpdate(BaseModel):
    application_id: int
    status: str

class InterviewNotesRequest(BaseModel):
    candidate_name: str
    role_title: str
    raw_notes: str

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        user_id = int(token)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session token")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication token invalid")

# Root & Health API
@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

# ----------------- AUTHENTICATION ROUTES -----------------
@app.post(f"{settings.API_PREFIX}/auth/register", response_model=TokenResponse)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    if data.role == "admin":
        raise HTTPException(
            status_code=403, 
            detail="Placement Officer registration is restricted. Please log in using official credentials: placement@cmr@gmail.com"
        )

    email_clean = data.email.strip().lower()
    usn_clean = data.usn.strip().upper() if data.usn else None

    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        if existing_user.approval_status == "Rejected":
            raise HTTPException(
                status_code=400,
                detail="⚠️ Account Request On Hold / Rejected: Your previous registration request for this email was placed on hold or rejected by the Placement Officer. Please contact the Placement Office directly to release your request."
            )
        elif existing_user.approval_status == "Pending":
            raise HTTPException(
                status_code=400,
                detail="⚠️ Request Access Pending: Your registration request for this email is currently pending review by the CMR Placement Officer. You will receive an official email once verified."
            )
        else:
            raise HTTPException(status_code=400, detail="User with this email already exists and is active.")
    
    if usn_clean:
        existing_usn = db.query(User).filter(User.usn == usn_clean).first()
        if existing_usn:
            if existing_usn.approval_status == "Rejected":
                raise HTTPException(
                    status_code=400,
                    detail=f"⚠️ Account Request On Hold: The registration request for USN {usn_clean} was placed on hold or rejected by the Placement Officer. Please contact the Placement Office to release your request."
                )
            elif existing_usn.approval_status == "Pending":
                raise HTTPException(
                    status_code=400,
                    detail=f"⚠️ Request Access Pending: The registration request for USN {usn_clean} is currently under review by the Placement Officer."
                )
            else:
                raise HTTPException(status_code=400, detail="User with this USN already exists.")

    hashed_pwd = get_password_hash(data.password)
    # Both students and recruiters require placement officer approval!
    approval = "Pending"

    user = User(
        email=email_clean,
        hashed_password=hashed_pwd,
        full_name=data.full_name.strip(),
        role=data.role,
        usn=usn_clean,
        company_name=data.company_name,
        approval_status=approval
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == "student":
        prof = StudentProfile(
            user_id=user.id,
            usn=usn_clean or f"1CR23{user.id:03d}",
            branch="Computer Science & Engineering",
            cgpa=0.0,
            skills_list="",
            placement_prob=0.0,
            placement_status="Profile Incomplete",
            mock_interview_score=None
        )
        db.add(prof)
        db.commit()

    raise HTTPException(
        status_code=202,
        detail=f"✅ Request Access Sent! Your {data.role.capitalize()} registration request has been submitted to the CMR Placement Officer for verification. You will receive an official email once approved."
    )

@app.post(f"{settings.API_PREFIX}/auth/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    login_str = form_data.username.strip()
    user = db.query(User).filter((User.email == login_str.lower()) | (User.usn == login_str.upper())).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        if user and user.role in ["recruiter", "admin"]:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        elif not user and ("@" in login_str or not any(c.isdigit() for c in login_str)):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        else:
            raise HTTPException(status_code=400, detail="Incorrect email/USN or password")

    if user.role != "admin" and user.approval_status != "Approved":
        if user.approval_status == "Pending":
            raise HTTPException(
                status_code=403,
                detail="⚠️ Request Access Pending: Your account request is under review by the CMR Placement Officer. Please check your registered email for updates."
            )
        elif user.approval_status == "Rejected":
            raise HTTPException(
                status_code=403,
                detail="❌ Request Rejected / On Hold: Your account request was rejected or placed on hold by the Placement Officer. Please contact the Placement Office directly to release your request."
            )

    return {
        "access_token": str(user.id),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "usn": user.usn,
            "company_name": user.company_name
        }
    }

class RequestResetKeyInput(BaseModel):
    email: str

class ResetPasswordInput(BaseModel):
    email: str
    reset_key: str
    new_password: str

@app.post(f"{settings.API_PREFIX}/auth/forgot-password/request-key")
def request_password_reset_key(data: RequestResetKeyInput, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email address.")
    
    reset_code = f"{random.randint(100000, 999999)}"
    user.reset_key = reset_code
    user.reset_key_expires_at = datetime.now() + timedelta(minutes=15)
    db.commit()

    recipient_name = user.full_name
    def send_key_async():
        send_password_reset_key_email(email_clean, recipient_name, reset_code)

    threading.Thread(target=send_key_async, daemon=True).start()

    return {"message": f"6-digit security key sent to {email_clean}. Please check your email inbox."}

@app.post(f"{settings.API_PREFIX}/auth/forgot-password/reset-password")
def reset_password_with_key(data: ResetPasswordInput, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower()
    key_clean = data.reset_key.strip()
    
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email address.")
    
    if not user.reset_key or user.reset_key != key_clean:
        raise HTTPException(status_code=400, detail="Invalid 6-digit security key. Please check the key sent to your email.")
    
    if user.reset_key_expires_at and datetime.now() > user.reset_key_expires_at:
        raise HTTPException(status_code=400, detail="Security key has expired (valid for 15 minutes). Please request a new key.")
    
    user.hashed_password = get_password_hash(data.new_password)
    user.reset_key = None
    user.reset_key_expires_at = None
    db.commit()

    return {"message": "Password reset successfully! You can now sign in with your new password."}

@app.get(f"{settings.API_PREFIX}/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "usn": current_user.usn,
        "company_name": current_user.company_name
    }

# ----------------- STUDENT ROUTES -----------------
@app.get(f"{settings.API_PREFIX}/student/profile")
def get_student_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(
            user_id=current_user.id,
            usn=current_user.usn or "1CR23CD001",
            branch="Computer Science & Engineering",
            cgpa=7.5,
            skills_list="Python, React, SQL, Data Structures"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@app.put(f"{settings.API_PREFIX}/student/profile")
def update_student_profile(data: StudentProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id, usn=current_user.usn or "1CR23CD001")
        db.add(profile)

    profile.branch = data.branch
    profile.cgpa = data.cgpa
    profile.major_projects = data.major_projects
    profile.mini_projects = data.mini_projects
    profile.workshops_certs = data.workshops_certs
    profile.skills_count = data.skills_count
    profile.skills_list = data.skills_list
    profile.communication_rating = data.communication_rating
    profile.internship = data.internship
    profile.hackathon = data.hackathon
    profile.tenth_percentage = data.tenth_percentage
    profile.twelfth_percentage = data.twelfth_percentage
    profile.backlogs = data.backlogs

    profile.projects_details = data.projects_details
    profile.internships_details = data.internships_details
    profile.certifications_details = data.certifications_details
    profile.sgpa_details = data.sgpa_details

    # Auto-sync numeric counts from detailed portfolio arrays if present
    try:
        if data.projects_details and len(data.projects_details.strip()) > 2:
            p_list = json.loads(data.projects_details)
            if isinstance(p_list, list) and len(p_list) > 0:
                profile.major_projects = len(p_list)
    except Exception:
        pass

    try:
        if data.internships_details and len(data.internships_details.strip()) > 2:
            i_list = json.loads(data.internships_details)
            if isinstance(i_list, list):
                profile.internship = "Yes" if len(i_list) > 0 else "No"
    except Exception:
        pass

    try:
        if data.certifications_details and len(data.certifications_details.strip()) > 2:
            c_list = json.loads(data.certifications_details)
            if isinstance(c_list, list) and len(c_list) > 0:
                profile.workshops_certs = len(c_list)
    except Exception:
        pass

    prof_dict = data.dict()
    ml_res = predict_placement_likelihood(prof_dict)
    profile.placement_prob = ml_res['placement_probability']
    profile.placement_status = ml_res['readiness_tier']

    db.commit()
    db.refresh(profile)
    return {"profile": profile, "ml_analysis": ml_res}

@app.post(f"{settings.API_PREFIX}/student/resume-upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported")

    content = await file.read()
    b64 = base64.b64encode(content).decode("utf-8")
    data_url = f"data:application/pdf;base64,{b64}"

    extracted_text = ""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
    except Exception:
        extracted_text = f"Sample extracted resume content for {current_user.full_name}."

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        profile.resume_text = extracted_text
        profile.resume_pdf = data_url
        db.commit()

    prof_dict = {
        "branch": profile.branch if profile else "CS",
        "cgpa": profile.cgpa if profile else 7.5
    }

    ai_review = groq_service.evaluate_resume(extracted_text, prof_dict)
    return {
        "filename": file.filename,
        "extracted_text_snippet": extracted_text[:500] + "...",
        "ai_resume_review": ai_review
    }

@app.post(f"{settings.API_PREFIX}/student/avatar-upload")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    content_type = file.content_type or "image/jpeg"
    data_url = f"data:{content_type};base64,{b64}"

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        profile.profile_photo = data_url
        db.commit()

    return {"message": "Profile photo uploaded successfully", "profile_photo": data_url}

@app.get(f"{settings.API_PREFIX}/student/explain-predict")
def explain_student_predict(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    prof_dict = {
        "branch": profile.branch,
        "cgpa": profile.cgpa,
        "major_projects": profile.major_projects,
        "mini_projects": profile.mini_projects,
        "workshops_certs": profile.workshops_certs,
        "skills_count": profile.skills_count,
        "skills_list": profile.skills_list,
        "communication_rating": profile.communication_rating,
        "internship": profile.internship,
        "hackathon": profile.hackathon,
        "tenth_percentage": profile.tenth_percentage,
        "twelfth_percentage": profile.twelfth_percentage,
        "backlogs": profile.backlogs,
        "resume_text": profile.resume_text,
        "profile_photo": profile.profile_photo,
        "projects_details": profile.projects_details,
        "internships_details": profile.internships_details,
        "certifications_details": profile.certifications_details
    }

    ml_res = predict_placement_likelihood(prof_dict)
    groq_explanation = groq_service.explain_ml_prediction(prof_dict, ml_res)

    return {
        "ml_result": ml_res,
        "groq_explanation": groq_explanation,
        "model_metadata": get_model_metadata()
    }

@app.post(f"{settings.API_PREFIX}/student/skill-gap")
def get_skill_gap(data: SkillGapRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    student_skills = profile.skills_list if profile else "Python, SQL, React"
    analysis = groq_service.analyze_skill_gap(student_skills, data.job_description)
    return {"skill_gap_analysis": analysis}

@app.post(f"{settings.API_PREFIX}/student/chat-mentor")
def chat_with_mentor(data: MentorChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    apps_count = db.query(Application).filter(Application.student_id == current_user.id).count()

    has_resume = bool(profile and profile.resume_text and len(profile.resume_text.strip()) > 20)
    
    comp_score = 0
    if has_resume: comp_score += 40
    if profile and profile.cgpa > 0: comp_score += 15
    if profile and profile.skills_list and len(profile.skills_list) > 5: comp_score += 15
    if current_user.usn or (profile and profile.usn): comp_score += 10
    if profile and ((profile.major_projects or 0) > 0 or (profile.workshops_certs or 0) > 0): comp_score += 10
    if profile and profile.profile_photo: comp_score += 10

    context = {
        "usn": current_user.usn or (profile.usn if profile else "N/A"),
        "branch": profile.branch if profile else "Computer Science",
        "cgpa": profile.cgpa if profile else 7.5,
        "backlogs": profile.backlogs if profile else 0,
        "skills_list": profile.skills_list if profile else "Python, React",
        "major_projects": profile.major_projects if profile else 1,
        "internship": profile.internship if profile else "Yes",
        "has_resume": has_resume,
        "resume_excerpt": profile.resume_text if profile else "",
        "projects_details": profile.projects_details if profile else "",
        "internships_details": profile.internships_details if profile else "",
        "certifications_details": profile.certifications_details if profile else "",
        "completion_pct": comp_score,
        "applied_jobs_count": apps_count
    }

    messages = data.chat_history + [{"role": "user", "content": data.message}]
    response_text = groq_service.chat_mentor(messages, context)
    return {"reply": response_text}

@app.post(f"{settings.API_PREFIX}/student/mock-interview/question")
def get_mock_question(
    role: str = "Software Development Engineer", 
    topic: str = "Algorithms & System Design", 
    turn: int = 1,
    interview_type: str = "technical",
    job_description: Optional[str] = ""
):
    q = groq_service.generate_mock_interview_question(
        role=role, 
        topic=topic, 
        turn=turn, 
        interview_type=interview_type, 
        job_description=job_description or ""
    )
    return {"question": q, "role": role, "topic": topic, "interview_type": interview_type}

@app.post(f"{settings.API_PREFIX}/student/mock-interview/answer")
def submit_mock_answer(
    data: MockAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    feedback = groq_service.evaluate_interview_answer(data.question, data.answer)
    
    score = 85.0
    if "Overall Rating:" in feedback:
        try:
            rating_str = feedback.split("Overall Rating:")[1].split("/")[0].strip().replace("*", "")
            score = float(rating_str) * 10.0
        except Exception:
            score = 85.0

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        profile.mock_interview_score = score
    return {"feedback": feedback, "mock_interview_score": score}

from backend.email_service import (
    send_approval_email, 
    send_rejection_email, 
    send_incomplete_profile_warning_email,
    send_mid_session_exit_warning_email,
    send_weekly_mock_reminder_email,
    send_campus_drive_broadcast_email,
    send_password_reset_key_email,
    send_interview_call_letter_email,
    send_interview_request_to_student_email,
    send_interview_decision_to_recruiter_email,
    send_interview_30m_reminder_email,
    send_application_status_update_email
)

def weekly_mock_reminder_watchdog():
    """
    Background worker thread that runs every 60 seconds.
    Checks for active student accounts that haven't taken a mock interview in the last 7 days.
    Sends reminder emails every 2 days (48 hours) until they take a mock interview.
    """
    while True:
        try:
            time.sleep(60)
            db = SessionLocal()
            now = datetime.utcnow()
            seven_days_ago = now - timedelta(days=7)
            two_days_ago = now - timedelta(days=2)
            
            profiles = db.query(StudentProfile).all()
            for prof in profiles:
                user = db.query(User).filter(User.id == prof.user_id).first()
                if not user or user.role != "student" or user.approval_status != "Approved":
                    continue
                
                is_due = (prof.last_mock_interview_at is None) or (prof.last_mock_interview_at <= seven_days_ago)
                
                if is_due:
                    reminder_due = (prof.mock_reminder_last_sent_at is None) or (prof.mock_reminder_last_sent_at <= two_days_ago)
                    if reminder_due:
                        send_weekly_mock_reminder_email(user.email, user.full_name)
                        prof.mock_reminder_last_sent_at = now
                        db.commit()
            db.close()
        except Exception as e:
            print(f"Error in weekly mock reminder watchdog: {e}")

def interview_30m_reminder_watchdog():
    """
    Background worker thread running every 60 seconds.
    Checks for accepted interviews starting within the next 30 minutes.
    Sends automated reminder emails to both student and recruiter with Google Meet link.
    """
    while True:
        try:
            time.sleep(60)
            db = SessionLocal()
            now = datetime.utcnow()
            in_30m = now + timedelta(minutes=30)
            
            upcoming_interviews = db.query(InterviewRequest).filter(
                InterviewRequest.status == "Accepted",
                InterviewRequest.reminder_30m_sent == False,
                InterviewRequest.scheduled_at <= in_30m,
                InterviewRequest.scheduled_at >= now - timedelta(minutes=15)
            ).all()

            for req in upcoming_interviews:
                student = db.query(User).filter(User.id == req.student_id).first()
                recruiter = db.query(User).filter(User.id == req.recruiter_id).first()
                job = db.query(JobPosting).filter(JobPosting.id == req.job_id).first() if req.job_id else None

                comp_name = job.company_name if job else (recruiter.company_name if recruiter else "Enterprise Partner")
                job_title = job.title if job else "Campus Interview"
                m_link = req.meeting_link

                if student and student.email:
                    s_email = student.email
                    s_name = student.full_name
                    threading.Thread(
                        target=lambda: send_interview_30m_reminder_email(s_email, s_name, "Student Candidate", comp_name, job_title, m_link),
                        daemon=True
                    ).start()

                if recruiter and recruiter.email:
                    r_email = recruiter.email
                    r_name = recruiter.full_name
                    threading.Thread(
                        target=lambda: send_interview_30m_reminder_email(r_email, r_name, "Recruiter / Interviewer", comp_name, job_title, m_link),
                        daemon=True
                    ).start()

                req.reminder_30m_sent = True
                db.commit()

            db.close()
        except Exception as e:
            print(f"Error in 30-min interview reminder watchdog: {e}")

# Start background watchdog threads on startup
weekly_reminder_thread = threading.Thread(target=weekly_mock_reminder_watchdog, daemon=True)
weekly_reminder_thread.start()

interview_reminder_thread = threading.Thread(target=interview_30m_reminder_watchdog, daemon=True)
interview_reminder_thread.start()

class SaveMockScoreRequest(BaseModel):
    score: float
    mock_type: Optional[str] = "technical"
    exited_mid: Optional[bool] = False

@app.post(f"{settings.API_PREFIX}/student/mock-interview/score")
def save_mock_interview_score(
    data: SaveMockScoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    profile.mock_interview_score = round(data.score, 1)
    profile.mock_interview_exited_mid = bool(data.exited_mid)
    profile.last_mock_interview_at = datetime.utcnow()
    
    has_resume = bool(profile.resume_text and len(profile.resume_text.strip()) > 20)
    prof_dict = {
        "cgpa": profile.cgpa,
        "major_projects": profile.major_projects,
        "mini_projects": profile.mini_projects,
        "workshops_certs": profile.workshops_certs,
        "skills_count": profile.skills_count,
        "skills_list": profile.skills_list,
        "communication_rating": profile.communication_rating,
        "internship": profile.internship,
        "hackathon": profile.hackathon,
        "tenth_percentage": profile.tenth_percentage,
        "twelfth_percentage": profile.twelfth_percentage,
        "backlogs": profile.backlogs,
        "has_resume": has_resume,
        "mock_interview_score": profile.mock_interview_score,
    }
    ml_res = predict_placement_likelihood(prof_dict)
    profile.placement_prob = ml_res["placement_prob"]
    profile.placement_status = ml_res["placement_status"]
    
    db.commit()
    db.refresh(profile)

    if data.exited_mid:
        email_addr = current_user.email
        user_name = current_user.full_name
        def send_delayed_exit_warning():
            time.sleep(120) # 2 minute warning email
            send_mid_session_exit_warning_email(email_addr, user_name)
        
        t = threading.Thread(target=send_delayed_exit_warning, daemon=True)
        t.start()

    return {
        "message": "Mock interview score saved successfully",
        "mock_interview_score": profile.mock_interview_score,
        "mock_interview_exited_mid": profile.mock_interview_exited_mid,
        "placement_prob": profile.placement_prob,
        "placement_status": profile.placement_status
    }

@app.get(f"{settings.API_PREFIX}/student/jobs")
def list_student_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobPosting).filter(JobPosting.status == "Active").all()
    return jobs

@app.get(f"{settings.API_PREFIX}/student/role-recommendations")
def get_role_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    jobs = db.query(JobPosting).filter(JobPosting.status == "Active").all()
    
    apps = db.query(Application).filter(Application.student_id == current_user.id).all()
    app_statuses = {}
    for a in apps:
        j = db.query(JobPosting).filter(JobPosting.id == a.job_id).first()
        if j:
            app_statuses[f"{j.title} at {j.company_name}"] = a.status

    prof_dict = {
        "full_name": current_user.full_name,
        "cgpa": profile.cgpa if profile else 7.5,
        "branch": profile.branch if profile else "CS",
        "skills_list": profile.skills_list if profile else "Python, React",
        "major_projects": profile.major_projects if profile else 1,
        "internship": profile.internship if profile else "No",
        "placement_prob": profile.placement_prob if profile else 50.0,
        "resume_text": profile.resume_text if profile else "",
        "projects_details": profile.projects_details if profile else "",
        "internships_details": profile.internships_details if profile else "",
        "certifications_details": profile.certifications_details if profile else "",
        "existing_applications_status": app_statuses
    }
    
    jobs_summary = [{"title": j.title, "company": j.company_name, "skills": j.required_skills, "ctc": j.ctc_lpa} for j in jobs]
    recommendations = groq_service.recommend_roles(prof_dict, jobs_summary)
    return {"recommendations": recommendations}

@app.get(f"{settings.API_PREFIX}/student/my-applications")
def get_my_applications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.query(Application).filter(Application.student_id == current_user.id).all()
    res = []
    for a in apps:
        job = db.query(JobPosting).filter(JobPosting.id == a.job_id).first()
        res.append({
            "application_id": a.id,
            "job_id": a.job_id,
            "company_name": job.company_name if job else "N/A",
            "job_title": job.title if job else "N/A",
            "ctc_lpa": job.ctc_lpa if job else 0.0,
            "location": job.location if job else "N/A",
            "status": a.status,
            "ai_fit_score": a.ai_fit_score,
            "applied_at": a.applied_at
        })
    return res

@app.post(f"{settings.API_PREFIX}/student/apply/{{job_id}}")
def apply_to_job(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing_app = db.query(Application).filter(
        Application.job_id == job_id, Application.student_id == current_user.id
    ).first()
    if existing_app:
        return {"message": "Already applied", "application": existing_app}

    has_resume = bool(profile and profile.resume_text and len(profile.resume_text.strip()) > 20)

    cand_dict = {
        "full_name": current_user.full_name,
        "usn": current_user.usn or (profile.usn if profile else "N/A"),
        "cgpa": profile.cgpa if profile else 7.5,
        "skills_list": profile.skills_list if profile else "Python",
        "major_projects": profile.major_projects if profile else 1,
        "internship": profile.internship if profile else "No",
        "placement_prob": profile.placement_prob if profile else 50.0,
        "has_resume": has_resume,
        "projects_details": profile.projects_details if profile else "",
        "internships_details": profile.internships_details if profile else "",
        "certifications_details": profile.certifications_details if profile else ""
    }

    fit_result = groq_service.rank_candidate_fit(cand_dict, job.description)

    app_record = Application(
        job_id=job_id,
        student_id=current_user.id,
        status="Applied",
        ai_fit_score=fit_result.get("fit_score", 75.0),
        ai_fit_summary=json.dumps(fit_result)
    )
    db.add(app_record)
    db.commit()
    db.refresh(app_record)
    return {"message": "Application submitted successfully", "application": app_record, "fit_analysis": fit_result}

# ----------------- ADMIN ROUTES -----------------
@app.get(f"{settings.API_PREFIX}/admin/students")
def list_students(db: Session = Depends(get_db)):
    student_users = db.query(User).filter(User.role == "student").all()
    res = []
    for user in student_users:
        p = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
        has_resume = bool(p and p.resume_text and len(p.resume_text.strip()) > 20)
        res.append({
            "profile_id": p.id if p else None,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "usn": user.usn or (p.usn if p else "N/A"),
            "branch": p.branch if p else "Computer Science & Engineering",
            "cgpa": p.cgpa if p else 0.0,
            "skills_count": p.skills_count if p else 0,
            "skills_list": p.skills_list if p else "",
            "backlogs": p.backlogs if p else 0,
            "has_resume": has_resume,
            "major_projects": p.major_projects if p else 0,
            "workshops_certs": p.workshops_certs if p else 0,
            "internship": p.internship if p else "No",
            "projects_details": p.projects_details if p else "",
            "internships_details": p.internships_details if p else "",
            "certifications_details": p.certifications_details if p else "",
            "sgpa_details": p.sgpa_details if p else "{}",
            "profile_photo": p.profile_photo if p else None,
            "resume_text": p.resume_text if p else None,
            "mock_interview_score": (p.mock_interview_score if (p and p.mock_interview_score is not None) else "Not Attempted"),
            "mock_interview_exited_mid": bool(p.mock_interview_exited_mid) if p else False,
            "placement_prob": p.placement_prob if p else 0.0,
            "placement_status": p.placement_status if p else "Profile Pending"
        })
    return res

@app.post(f"{settings.API_PREFIX}/admin/create-student")
def admin_create_student(
    email: str = Form(...),
    full_name: str = Form(...),
    usn: str = Form(...),
    branch: str = Form("Computer Science"),
    cgpa: float = Form(7.5),
    db: Session = Depends(get_db)
):
    usn_clean = usn.upper().strip()
    existing = db.query(User).filter((User.email == email.strip().lower()) | (User.usn == usn_clean)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student with this email or USN already exists.")

    user = User(
        email=email.strip().lower(),
        usn=usn_clean,
        full_name=full_name.strip(),
        hashed_password=get_password_hash("student123"),
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = StudentProfile(
        user_id=user.id,
        usn=usn_clean,
        branch=branch,
        cgpa=cgpa
    )
    prof_dict = {"cgpa": cgpa, "backlogs": 0}
    ml_res = predict_placement_likelihood(prof_dict)
    profile.placement_prob = ml_res['placement_probability']
    profile.placement_status = ml_res['readiness_tier']

    db.add(profile)
    db.commit()
    return {"message": f"Student {full_name} ({usn_clean}) created successfully", "user": user}

@app.post(f"{settings.API_PREFIX}/admin/candidate-ai-breakdown/{{profile_id}}")
def get_candidate_360_breakdown(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    user = db.query(User).filter(User.id == profile.user_id).first()
    has_resume = bool(profile.resume_text and len(profile.resume_text.strip()) > 20)
    
    cand_data = {
        "full_name": user.full_name if user else "Student",
        "usn": profile.usn,
        "branch": profile.branch,
        "cgpa": profile.cgpa,
        "backlogs": profile.backlogs,
        "skills_list": profile.skills_list,
        "has_resume": has_resume,
        "projects_details": profile.projects_details,
        "internships_details": profile.internships_details,
        "certifications_details": profile.certifications_details,
        "placement_prob": profile.placement_prob,
        "placement_status": profile.placement_status,
        "mock_interview_score": profile.mock_interview_score if profile.mock_interview_score is not None else "Not Attempted"
    }
    
    report = groq_service.generate_360_candidate_evaluation(cand_data)
    return {"profile_id": profile_id, "evaluation_report": report, "candidate": cand_data}

@app.get(f"{settings.API_PREFIX}/admin/pending-requests")
def list_pending_requests(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role.in_(["student", "recruiter"]), User.approval_status == "Pending").all()
    return [{
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "usn": u.usn or "N/A",
        "role": u.role,
        "company_name": u.company_name or ("N/A" if u.role == "student" else "Enterprise Partner"),
        "created_at": u.created_at,
        "approval_status": u.approval_status
    } for u in users]

@app.get(f"{settings.API_PREFIX}/admin/rejected-requests")
def list_rejected_requests(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role.in_(["student", "recruiter"]), User.approval_status == "Rejected").all()
    return [{
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "usn": u.usn or "N/A",
        "role": u.role,
        "company_name": u.company_name or ("N/A" if u.role == "student" else "Enterprise Partner"),
        "created_at": u.created_at,
        "approval_status": u.approval_status
    } for u in users]

@app.post(f"{settings.API_PREFIX}/admin/approve-request/{{user_id}}")
def approve_user_request(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User request not found")
    user.approval_status = "Approved"
    db.commit()

    # Send Automated Approval Email via Gmail SMTP
    send_approval_email(user.email, user.full_name, user.role)
    return {"message": f"{user.role.capitalize()} request for {user.full_name} ({user.email}) approved successfully. Confirmation email sent."}

@app.post(f"{settings.API_PREFIX}/admin/reject-request/{{user_id}}")
def reject_user_request(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User request not found")
    user.approval_status = "Rejected"
    db.commit()

    # Send Automated Rejection/Hold Email via Gmail SMTP
    send_rejection_email(user.email, user.full_name, user.role)
    return {"message": f"{user.role.capitalize()} request for {user.full_name} ({user.email}) placed on hold/rejected. Notification email sent."}

@app.post(f"{settings.API_PREFIX}/admin/release-hold/{{user_id}}")
def release_user_hold(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User request not found")
    
    if user.role == "student":
        db.query(StudentProfile).filter(StudentProfile.user_id == user.id).delete()
    
    db.delete(user)
    db.commit()
    return {"message": f"Hold released for {user.email}. User can now resubmit a fresh request."}

@app.get(f"{settings.API_PREFIX}/admin/analytics")
def get_batch_analytics(db: Session = Depends(get_db)):
    profiles = db.query(StudentProfile).all()
    if not profiles:
        return {
            "total_students": 0,
            "avg_placement_prob": 0.0,
            "high_tier_count": 0,
            "mod_tier_count": 0,
            "low_tier_count": 0,
            "tier_counts": {"High": 0, "Medium": 0, "Low": 0},
            "branch_readiness": {}
        }

    total = len(profiles)
    total_prob = 0.0
    high_count = 0
    med_count = 0
    low_count = 0
    branch_map = {}

    for p in profiles:
        prob = float(p.placement_prob or 0.0)
        if prob == 0.0:
            mock_score = p.mock_interview_score if (p.mock_interview_score is not None and p.mock_interview_score > 0) else 50
            has_res = 1 if (p.resume_text and len(p.resume_text.strip()) > 20) else 0
            profile_dict = {
                "cgpa": p.cgpa or 7.5,
                "skills_count": p.skills_count or 3,
                "backlogs": p.backlogs or 0,
                "mock_score": mock_score,
                "has_resume": has_res,
                "major_projects": p.major_projects or 1,
                "workshops_certs": p.workshops_certs or 1,
                "internship": p.internship or "No"
            }
            pred_res = predict_placement_likelihood(profile_dict)
            prob = float(pred_res.get("placement_probability", 65.0))
            p.placement_prob = round(prob, 1)
            p.placement_status = "High Tier (>=70%)" if prob >= 70 else ("Medium Tier (40-69%)" if prob >= 40 else "Needs Training (<40%)")

        total_prob += prob

        if prob >= 70.0:
            high_count += 1
        elif prob >= 40.0:
            med_count += 1
        else:
            low_count += 1

        branch = p.branch or "Computer Science & Engineering"
        if branch not in branch_map:
            branch_map[branch] = []
        branch_map[branch].append(prob)

    db.commit()

    avg_placement_prob = round(total_prob / total, 1)
    branch_readiness = {branch: round(sum(probs) / len(probs), 1) for branch, probs in branch_map.items()}

    return {
        "total_students": total,
        "avg_placement_prob": avg_placement_prob,
        "high_tier_count": high_count,
        "high_tier_pct": round((high_count / total) * 100, 1),
        "mod_tier_count": med_count,
        "low_tier_count": low_count,
        "tier_counts": {
            "High": high_count,
            "Medium": med_count,
            "Low": low_count
        },
        "branch_readiness": branch_readiness,
        "resumes_uploaded": sum(1 for p in profiles if p.resume_text and len(p.resume_text.strip()) > 20),
        "total_applications": db.query(Application).count(),
        "active_companies": db.query(JobPosting).filter(JobPosting.status == "Active").count(),
        "model_metadata": get_model_metadata()
    }

@app.get(f"{settings.API_PREFIX}/admin/skill-demand-trends")
def get_skill_demand_trends(db: Session = Depends(get_db)):
    jobs = db.query(JobPosting).filter(JobPosting.status == "Active").all()
    profiles = db.query(StudentProfile).all()
    
    jobs_summary = [{"title": j.title, "company": j.company_name, "skills": j.required_skills} for j in jobs]
    all_student_skills = ", ".join([p.skills_list for p in profiles if p.skills_list])
    
    trend_analysis = groq_service.analyze_skill_demand_trends(jobs_summary, all_student_skills)
    return {"skill_demand_analysis": trend_analysis}

@app.post(f"{settings.API_PREFIX}/admin/generate-drive-report")
def generate_drive_report(db: Session = Depends(get_db)):
    stats = get_batch_analytics(db)
    stats['top_skills'] = "Python, React, Machine Learning, SQL, Data Structures"
    report_md = groq_service.generate_drive_summary_report(stats)

    drive_rec = DriveReport(
        title=f"Placement Intelligence Report - Batch {datetime.now().year}",
        total_students=stats['total_students'],
        avg_placement_prob=stats['high_tier_pct'],
        ai_report_markdown=report_md
    )
    db.add(drive_rec)
    db.commit()
    return {"report_markdown": report_md}

import csv
from fastapi.responses import Response

@app.get(f"{settings.API_PREFIX}/admin/export-students-csv")
def export_students_csv(db: Session = Depends(get_db)):
    profiles = db.query(StudentProfile).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Student Name", 
        "USN", 
        "Email", 
        "Branch", 
        "CGPA", 
        "Active Backlogs", 
        "Resume Status", 
        "AI Mock Interview Score", 
        "ML Placement Readiness %", 
        "Readiness Tier Status"
    ])
    
    for p in profiles:
        user = db.query(User).filter(User.id == p.user_id).first()
        has_resume = "Uploaded & Verified" if (p.resume_text and len(p.resume_text.strip()) > 20) else "Missing"
        
        if p.mock_interview_score is not None and p.mock_interview_score > 0 and p.mock_interview_score != 80:
            mock_str = f"{p.mock_interview_score}/100"
            if p.mock_interview_exited_mid:
                mock_str += " (Exited Mid-Session)"
        else:
            mock_str = "Not Attempted"

        cgpa_str = str(p.cgpa) if p.cgpa and p.cgpa > 0 else "N/A"

        writer.writerow([
            user.full_name if user else "N/A",
            p.usn or "N/A",
            user.email if user else "N/A",
            p.branch or "Computer Science & Engineering",
            cgpa_str,
            p.backlogs or 0,
            has_resume,
            mock_str,
            f"{p.placement_prob}%",
            p.placement_status or "Profile Incomplete"
        ])
    
    csv_bytes = output.getvalue().encode('utf-8')
    filename = f"CampusQuant_Student_Talent_Directory_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get(f"{settings.API_PREFIX}/admin/pending-job-drives")
def get_pending_job_drives(db: Session = Depends(get_db)):
    jobs = db.query(JobPosting).filter(JobPosting.status == "Pending Approval").all()
    res = []
    for j in jobs:
        recruiter = db.query(User).filter(User.id == j.recruiter_id).first()
        res.append({
            "job_id": j.id,
            "company_name": j.company_name,
            "title": j.title,
            "description": j.description,
            "location": j.location,
            "ctc_lpa": j.ctc_lpa,
            "min_cgpa": j.min_cgpa,
            "max_backlogs": j.max_backlogs,
            "required_skills": j.required_skills,
            "recruiter_name": recruiter.full_name if recruiter else "N/A",
            "recruiter_email": recruiter.email if recruiter else "N/A",
            "status": j.status,
            "created_at": j.created_at.strftime("%Y-%m-%d %H:%M") if j.created_at else ""
        })
    return res

@app.get(f"{settings.API_PREFIX}/admin/active-job-drives")
def get_active_job_drives(db: Session = Depends(get_db)):
    jobs = db.query(JobPosting).filter(JobPosting.status == "Active").order_by(JobPosting.created_at.desc()).all()
    res = []
    for j in jobs:
        recruiter = db.query(User).filter(User.id == j.recruiter_id).first()
        apps = db.query(Application).filter(Application.job_id == j.id).all()
        shortlisted = sum(1 for a in apps if (a.status or "").replace("'", "").replace('"', "").strip() in ["Shortlisted", "Interviewing", "Selected", "Offered", "Accepted"])
        offered = sum(1 for a in apps if (a.status or "").replace("'", "").replace('"', "").strip() in ["Selected", "Offered", "Accepted"])
        
        res.append({
            "job_id": j.id,
            "company_name": j.company_name,
            "title": j.title,
            "description": j.description,
            "location": j.location,
            "ctc_lpa": j.ctc_lpa,
            "min_cgpa": j.min_cgpa,
            "max_backlogs": j.max_backlogs,
            "required_skills": j.required_skills,
            "recruiter_name": recruiter.full_name if recruiter else "Enterprise Partner",
            "recruiter_email": recruiter.email if recruiter else "N/A",
            "status": j.status,
            "total_applicants": len(apps),
            "shortlisted_count": shortlisted,
            "offered_count": offered,
            "created_at": j.created_at.strftime("%Y-%m-%d %H:%M") if j.created_at else ""
        })
    return res

@app.post(f"{settings.API_PREFIX}/admin/close-job-drive/{{job_id}}")
def admin_close_job_drive(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job drive not found")
    job.status = "Closed"
    db.commit()
    return {"message": f"Drive '{job.title}' marked as Closed", "job_id": job.id, "status": "Closed"}

@app.post(f"{settings.API_PREFIX}/recruiter/close-job-drive/{{job_id}}")
def recruiter_close_job_drive(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id, JobPosting.recruiter_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job drive not found or unauthorized")
    job.status = "Closed"
    db.commit()
    return {"message": f"Drive '{job.title}' marked as Closed", "job_id": job.id, "status": "Closed"}

@app.get(f"{settings.API_PREFIX}/admin/live-placement-feed")
def get_admin_live_placement_feed(db: Session = Depends(get_db)):
    apps = db.query(Application).order_by(Application.id.desc()).limit(30).all()
    interviews = db.query(InterviewRequest).order_by(InterviewRequest.id.desc()).limit(30).all()

    feed_events = []

    for a in apps:
        student = db.query(User).filter(User.id == a.student_id).first()
        job = db.query(JobPosting).filter(JobPosting.id == a.job_id).first()
        feed_events.append({
            "id": f"app-{a.id}",
            "event_type": "Application Status Update",
            "student_name": student.full_name if student else "Student Candidate",
            "usn": student.usn if student else "N/A",
            "company_name": job.company_name if job else "Enterprise Partner",
            "job_title": job.title if job else "Campus Drive",
            "status": a.status,
            "timestamp": a.applied_at.strftime("%Y-%m-%d %H:%M") if a.applied_at else "Just Now",
            "details": f"Candidate status updated to {a.status} for {job.company_name if job else 'Company'} - {job.title if job else 'Role'}"
        })

    for i in interviews:
        student = db.query(User).filter(User.id == i.student_id).first()
        recruiter = db.query(User).filter(User.id == i.recruiter_id).first()
        job = db.query(JobPosting).filter(JobPosting.id == i.job_id).first() if i.job_id else None
        feed_events.append({
            "id": f"int-{i.id}",
            "event_type": "Interview Action",
            "student_name": student.full_name if student else "Candidate",
            "usn": student.usn if student else "N/A",
            "company_name": job.company_name if job else (recruiter.company_name if recruiter else "Recruiter"),
            "job_title": job.title if job else "Virtual Interview",
            "status": i.status,
            "timestamp": i.scheduled_at.strftime("%Y-%m-%d %H:%M") if i.scheduled_at else "Upcoming",
            "details": f"Interview {i.status} between {student.full_name if student else 'Candidate'} and {recruiter.full_name if recruiter else 'Recruiter'}"
        })

    return feed_events

@app.get(f"{settings.API_PREFIX}/admin/job-applications/{{job_id}}")
def get_admin_job_applications(job_id: int, db: Session = Depends(get_db)):
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    res = []
    for a in apps:
        student_user = db.query(User).filter(User.id == a.student_id).first()
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == a.student_id).first()
        
        summary = {}
        if a.ai_fit_summary:
            try:
                summary = json.loads(a.ai_fit_summary)
            except Exception:
                summary = {"strengths": [a.ai_fit_summary]}

        res.append({
            "application_id": a.id,
            "student_id": a.student_id,
            "profile_id": profile.id if profile else None,
            "full_name": student_user.full_name if student_user else "N/A",
            "email": student_user.email if student_user else "N/A",
            "usn": student_user.usn or (profile.usn if profile else "N/A"),
            "branch": profile.branch if profile else "Computer Science & Engineering",
            "cgpa": profile.cgpa if profile else 0.0,
            "ai_fit_score": a.ai_fit_score,
            "ai_fit_summary": summary,
            "status": a.status,
            "applied_at": a.applied_at.strftime("%Y-%m-%d %H:%M") if a.applied_at else ""
        })
    return res

@app.delete(f"{settings.API_PREFIX}/admin/delete-student/{{student_id}}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not user:
        raise HTTPException(status_code=404, detail="Student user record not found")
    
    # Delete dependent relations cleanly
    db.query(StudentProfile).filter(StudentProfile.user_id == student_id).delete()
    db.query(Application).filter(Application.student_id == student_id).delete()
    db.query(InterviewRequest).filter(InterviewRequest.student_id == student_id).delete()
    db.delete(user)
    db.commit()
    return {"message": f"Student '{user.full_name}' deleted successfully", "student_id": student_id}

@app.post(f"{settings.API_PREFIX}/admin/approve-job-drive/{{job_id}}")
def approve_job_drive(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job drive posting not found")
    
    job.status = "Active"
    db.commit()

    # Send Approval Email to Recruiter
    recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
    if recruiter and recruiter.email:
        send_recruiter_drive_approval_email(
            recipient_email=recruiter.email,
            recipient_name=recruiter.full_name,
            company_name=job.company_name,
            job_title=job.title
        )

    students = db.query(User).filter(User.role == "student", User.approval_status == "Approved").all()
    comp_name = job.company_name
    j_title = job.title
    ctc = job.ctc_lpa
    loc = job.location

    def broadcast_drive_emails():
        for s in students:
            if s.email:
                send_campus_drive_broadcast_email(s.email, s.full_name, comp_name, j_title, ctc, loc)

    threading.Thread(target=broadcast_drive_emails, daemon=True).start()

    return {"message": f"Job drive for '{job.company_name} - {job.title}' approved and broadcasted live to all student portals! Announcement emails sent."}

@app.post(f"{settings.API_PREFIX}/admin/reject-job-drive/{{job_id}}")
def reject_job_drive(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job drive posting not found")
    
    job.status = "Rejected"
    db.commit()
    return {"message": f"Job drive for '{job.company_name} - {job.title}' rejected."}

# ----------------- RECRUITER ROUTES -----------------
@app.get(f"{settings.API_PREFIX}/recruiter/my-posted-jobs")
def get_recruiter_posted_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        jobs = db.query(JobPosting).filter(JobPosting.status.in_(["Active", "Pending Approval"])).order_by(JobPosting.created_at.desc()).all()
    else:
        # Strictly isolate jobs posted by this specific recruiter user or matching company name
        jobs = db.query(JobPosting).filter(
            (JobPosting.recruiter_id == current_user.id) | 
            (JobPosting.company_name == current_user.company_name)
        ).filter(JobPosting.status.in_(["Active", "Pending Approval"])).order_by(JobPosting.created_at.desc()).all()
    return jobs

@app.post(f"{settings.API_PREFIX}/recruiter/post-job")
def post_job(
    data: JobCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Recruiter or Admin permissions required")

    job_status = "Active" if current_user.role == "admin" else "Pending Approval"

    job = JobPosting(
        recruiter_id=current_user.id,
        company_name=current_user.company_name or "Partner Enterprise",
        title=data.title,
        description=data.description,
        location=data.location,
        ctc_lpa=data.ctc_lpa,
        min_cgpa=data.min_cgpa,
        max_backlogs=data.max_backlogs,
        required_skills=data.required_skills,
        status=job_status
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@app.get(f"{settings.API_PREFIX}/recruiter/applications/{{job_id}}")
def get_job_applications(job_id: int, db: Session = Depends(get_db)):
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    result = []
    for a in apps:
        student_user = db.query(User).filter(User.id == a.student_id).first()
        student_prof = db.query(StudentProfile).filter(StudentProfile.user_id == a.student_id).first()
        has_resume = bool(student_prof and student_prof.resume_text and len(student_prof.resume_text.strip()) > 20)

        fit_data = {}
        if a.ai_fit_summary:
            try:
                fit_data = json.loads(a.ai_fit_summary)
            except Exception:
                fit_data = {"summary": a.ai_fit_summary}
        
        result.append({
            "application_id": a.id,
            "student_id": a.student_id,
            "student_name": student_user.full_name if student_user else "N/A",
            "usn": student_user.usn if student_user else "N/A",
            "email": student_user.email if student_user else "N/A",
            "branch": student_prof.branch if student_prof else "Computer Science & Engineering",
            "cgpa": student_prof.cgpa if student_prof else 0.0,
            "backlogs": student_prof.backlogs if student_prof else 0,
            "skills": student_prof.skills_list if student_prof else "",
            "skills_list": student_prof.skills_list if student_prof else "",
            "has_resume": has_resume,
            "profile_photo": student_prof.profile_photo if student_prof else None,
            "resume_text": student_prof.resume_text if student_prof else None,
            "resume_pdf": student_prof.resume_pdf if student_prof else None,
            "projects_details": student_prof.projects_details if student_prof else "[]",
            "internships_details": student_prof.internships_details if student_prof else "[]",
            "certifications_details": student_prof.certifications_details if student_prof else "[]",
            "sgpa_details": student_prof.sgpa_details if student_prof else "{}",
            "ml_placement_prob": student_prof.placement_prob if student_prof else 0.0,
            "mock_interview_score": student_prof.mock_interview_score if (student_prof and student_prof.mock_interview_score is not None) else None,
            "mock_interview_exited_mid": bool(student_prof and student_prof.mock_interview_exited_mid),
            "ai_fit_score": a.ai_fit_score,
            "fit_analysis": fit_data,
            "status": a.status
        })
    return result

@app.put(f"{settings.API_PREFIX}/recruiter/application-status")
def update_application_status(
    data: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app_record = db.query(Application).filter(Application.id == data.application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app_record.status = data.status.replace("'", "").replace('"', "").strip()
    db.commit()

    # Send Notification Email to Student
    student = db.query(User).filter(User.id == app_record.student_id).first()
    job = db.query(JobPosting).filter(JobPosting.id == app_record.job_id).first()

    if student and student.email and job:
        s_email = student.email
        s_name = student.full_name
        c_name = job.company_name
        j_title = job.title
        n_status = data.status
        threading.Thread(
            target=lambda: send_application_status_update_email(s_email, s_name, c_name, j_title, n_status),
            daemon=True
        ).start()

    return {"message": f"Status updated to {data.status}", "application_id": app_record.id, "new_status": data.status}

@app.post(f"{settings.API_PREFIX}/recruiter/generate-questions")
def generate_questions_for_jd(data: SkillGapRequest):
    questions = groq_service.generate_jd_interview_questions(data.job_description)
    return {"questions": questions}

@app.post(f"{settings.API_PREFIX}/recruiter/structure-notes")
def structure_notes(data: InterviewNotesRequest):
    scorecard = groq_service.structure_interview_notes(data.raw_notes, data.candidate_name, data.role_title)
    return {"scorecard": scorecard}

class CompareCandidatesRequest(BaseModel):
    student_a_id: int
    student_b_id: int
    job_id: Optional[int] = None

class BulkStatusUpdateRequest(BaseModel):
    application_ids: List[int]
    status: str
    send_interview_email: bool = False

@app.post(f"{settings.API_PREFIX}/recruiter/compare-candidates")
def compare_two_candidates(data: CompareCandidatesRequest, db: Session = Depends(get_db)):
    prof_a = db.query(StudentProfile).filter(StudentProfile.id == data.student_a_id).first()
    prof_b = db.query(StudentProfile).filter(StudentProfile.id == data.student_b_id).first()

    if not prof_a or not prof_b:
        raise HTTPException(status_code=404, detail="One or both student profiles not found")

    user_a = db.query(User).filter(User.id == prof_a.user_id).first()
    user_b = db.query(User).filter(User.id == prof_b.user_id).first()

    job_title = "Software Development Engineer"
    if data.job_id:
        job = db.query(JobPosting).filter(JobPosting.id == data.job_id).first()
        if job:
            job_title = job.title

    cand_a = {
        "full_name": user_a.full_name if user_a else "Candidate A",
        "usn": prof_a.usn,
        "branch": prof_a.branch,
        "cgpa": prof_a.cgpa,
        "backlogs": prof_a.backlogs,
        "skills_list": prof_a.skills_list,
        "placement_prob": prof_a.placement_prob,
        "mock_interview_score": f"{prof_a.mock_interview_score}/100" if prof_a.mock_interview_score else "Not Attempted",
        "has_resume": bool(prof_a.resume_text and len(prof_a.resume_text.strip()) > 20)
    }

    cand_b = {
        "full_name": user_b.full_name if user_b else "Candidate B",
        "usn": prof_b.usn,
        "branch": prof_b.branch,
        "cgpa": prof_b.cgpa,
        "backlogs": prof_b.backlogs,
        "skills_list": prof_b.skills_list,
        "placement_prob": prof_b.placement_prob,
        "mock_interview_score": f"{prof_b.mock_interview_score}/100" if prof_b.mock_interview_score else "Not Attempted",
        "has_resume": bool(prof_b.resume_text and len(prof_b.resume_text.strip()) > 20)
    }

    report = groq_service.compare_candidates_head_to_head(cand_a, cand_b, job_title)
    return {"comparison_report": report, "candidate_a": cand_a, "candidate_b": cand_b}

@app.post(f"{settings.API_PREFIX}/recruiter/bulk-update-status")
def bulk_update_application_status(data: BulkStatusUpdateRequest, db: Session = Depends(get_db)):
    apps = db.query(Application).filter(Application.id.in_(data.application_ids)).all()
    if not apps:
        raise HTTPException(status_code=404, detail="No matching applications found")

    updated_count = 0
    for a in apps:
        a.status = data.status
        updated_count += 1
        
        if data.send_interview_email and data.status in ["Shortlisted", "Interviewing"]:
            student_user = db.query(User).filter(User.id == a.student_id).first()
            job = db.query(JobPosting).filter(JobPosting.id == a.job_id).first()
            if student_user and student_user.email and job:
                s_email = student_user.email
                s_name = student_user.full_name
                c_name = job.company_name
                j_title = job.title
                
                def send_email_async():
                    send_interview_call_letter_email(s_email, s_name, c_name, j_title)
                
                threading.Thread(target=send_email_async, daemon=True).start()

    db.commit()
    return {"message": f"Successfully updated {updated_count} applications to '{data.status}'.", "updated_count": updated_count}

class ScheduleInterviewInput(BaseModel):
    student_id: int
    job_id: Optional[int] = None
    scheduled_at: str
    notes: Optional[str] = ""

class RespondInterviewInput(BaseModel):
    interview_id: int
    decision: str

class SubmitAINotesInput(BaseModel):
    interview_id: int
    notes_transcript: str

@app.post(f"{settings.API_PREFIX}/recruiter/schedule-interview")
def schedule_interview_request(
    data: ScheduleInterviewInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Recruiter permissions required")

    student_user = db.query(User).filter(User.id == data.student_id).first()
    if not student_user:
        raise HTTPException(status_code=404, detail="Student candidate not found")

    try:
        dt = datetime.fromisoformat(data.scheduled_at)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use YYYY-MM-DDTHH:MM")

    room_code = f"CQ-MEET-{random.randint(10000, 99999)}"
    m_link = f"http://localhost:5173?room={room_code}"

    job = db.query(JobPosting).filter(JobPosting.id == data.job_id).first() if data.job_id else None
    comp_name = job.company_name if job else (current_user.company_name or "Enterprise Partner")
    job_title = job.title if job else "Campus Interview"

    req = InterviewRequest(
        job_id=data.job_id,
        recruiter_id=current_user.id,
        student_id=data.student_id,
        scheduled_at=dt,
        meeting_link=m_link,
        status="Pending",
        student_notes=data.notes
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    s_email = student_user.email
    s_name = student_user.full_name
    dt_str = dt.strftime("%B %d, %Y at %I:%M %p")

    def send_invite_async():
        send_interview_request_to_student_email(s_email, s_name, comp_name, job_title, dt_str)

    threading.Thread(target=send_invite_async, daemon=True).start()

    return {
        "message": f"Live interview request scheduled for {s_name}! Email invitation dispatched.",
        "interview_id": req.id,
        "meeting_link": m_link,
        "scheduled_at": dt_str
    }

@app.get(f"{settings.API_PREFIX}/student/interview-requests")
def list_student_interview_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(InterviewRequest).filter(InterviewRequest.student_id == current_user.id).order_by(InterviewRequest.id.desc()).all()
    res = []
    for r in requests:
        recruiter = db.query(User).filter(User.id == r.recruiter_id).first()
        job = db.query(JobPosting).filter(JobPosting.id == r.job_id).first() if r.job_id else None
        res.append({
            "id": r.id,
            "company_name": job.company_name if job else (recruiter.company_name if recruiter else "Enterprise Partner"),
            "job_title": job.title if job else "Campus Recruitment Role",
            "recruiter_name": recruiter.full_name if recruiter else "Recruiter",
            "scheduled_at": r.scheduled_at.strftime("%Y-%m-%d %H:%M"),
            "meeting_link": r.meeting_link,
            "status": r.status,
            "notes": r.student_notes,
            "ai_notes": r.ai_notes
        })
    return res

@app.get(f"{settings.API_PREFIX}/recruiter/interview-requests")
def list_recruiter_interview_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(InterviewRequest).filter(InterviewRequest.recruiter_id == current_user.id).order_by(InterviewRequest.id.desc()).all()
    res = []
    for r in requests:
        student = db.query(User).filter(User.id == r.student_id).first()
        job = db.query(JobPosting).filter(JobPosting.id == r.job_id).first() if r.job_id else None
        res.append({
            "id": r.id,
            "student_name": student.full_name if student else "Candidate",
            "usn": student.usn if student else "N/A",
            "student_email": student.email if student else "N/A",
            "job_title": job.title if job else "Campus Role",
            "scheduled_at": r.scheduled_at.strftime("%Y-%m-%d %H:%M"),
            "meeting_link": r.meeting_link,
            "status": r.status,
            "notes": r.student_notes,
            "ai_notes": r.ai_notes
        })
    return res

@app.get(f"{settings.API_PREFIX}/admin/interview-requests")
def list_admin_interview_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required")

    requests = db.query(InterviewRequest).order_by(InterviewRequest.id.desc()).all()
    res = []
    for r in requests:
        student = db.query(User).filter(User.id == r.student_id).first()
        recruiter = db.query(User).filter(User.id == r.recruiter_id).first()
        job = db.query(JobPosting).filter(JobPosting.id == r.job_id).first() if r.job_id else None
        res.append({
            "id": r.id,
            "student_name": student.full_name if student else "Candidate",
            "usn": student.usn if student else "N/A",
            "recruiter_name": recruiter.full_name if recruiter else "Recruiter",
            "company_name": job.company_name if job else (recruiter.company_name if recruiter else "Enterprise Partner"),
            "job_title": job.title if job else "Campus Role",
            "scheduled_at": r.scheduled_at.strftime("%Y-%m-%d %H:%M"),
            "meeting_link": r.meeting_link,
            "status": r.status,
            "ai_notes": r.ai_notes
        })
    return res

@app.post(f"{settings.API_PREFIX}/student/respond-interview")
def respond_interview_request(
    data: RespondInterviewInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(InterviewRequest).filter(InterviewRequest.id == data.interview_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Interview request not found")

    req.status = data.decision
    db.commit()

    recruiter = db.query(User).filter(User.id == req.recruiter_id).first()
    job = db.query(JobPosting).filter(JobPosting.id == req.job_id).first() if req.job_id else None
    student = db.query(User).filter(User.id == req.student_id).first()

    if data.decision == "Completed" and req.job_id and req.student_id:
        app_record = db.query(Application).filter(
            Application.job_id == req.job_id,
            Application.student_id == req.student_id
        ).first()
        if app_record:
            app_record.status = "Interviewing"
            db.commit()

        if student and student.email and job:
            s_email = student.email
            s_name = student.full_name
            c_name = job.company_name
            j_title = job.title
            threading.Thread(
                target=lambda: send_application_status_update_email(s_email, s_name, c_name, j_title, "Interview Completed"),
                daemon=True
            ).start()
    
    if recruiter and recruiter.email and current_user and current_user.id == req.student_id:
        r_email = recruiter.email
        r_name = recruiter.full_name
        s_name = current_user.full_name
        j_title = job.title if job else "Campus Role"
        dec = data.decision
        
        def send_decision_async():
            send_interview_decision_to_recruiter_email(r_email, r_name, s_name, j_title, dec)
        
        threading.Thread(target=send_decision_async, daemon=True).start()

    return {"message": f"Interview request marked as {data.decision}. Status synced across portals."}

@app.post(f"{settings.API_PREFIX}/interview/submit-ai-notes")
def submit_ai_interview_notes(
    data: SubmitAINotesInput,
    db: Session = Depends(get_db)
):
    req = db.query(InterviewRequest).filter(InterviewRequest.id == data.interview_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Interview request not found")

    student = db.query(User).filter(User.id == req.student_id).first()
    job = db.query(JobPosting).filter(JobPosting.id == req.job_id).first() if req.job_id else None
    
    cand_name = student.full_name if student else "Candidate"
    job_title = job.title if job else "Campus Interview"
    company_name = job.company_name if job else "Enterprise Recruiter"

    summary_md = groq_service.analyze_live_interview_notes(data.notes_transcript, job_title, cand_name)
    req.ai_notes = summary_md
    req.status = "Completed"
    db.commit()

    if student and student.email:
        s_email = student.email
        s_name = cand_name
        c_name = company_name
        j_title = job_title
        sum_md = summary_md
        
        threading.Thread(
            target=lambda: send_interview_scorecard_to_student_email(s_email, s_name, c_name, j_title, sum_md),
            daemon=True
        ).start()

    return {"message": "AI interview notes analyzed, saved, and dispatched to student email!", "ai_notes": summary_md}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
