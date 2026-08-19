from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    usn = Column(String(50), unique=True, index=True, nullable=True) # Unique Student Number (e.g. 1CR23CD001)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False) # 'student', 'admin', 'recruiter'
    company_name = Column(String(100), nullable=True)
    approval_status = Column(String(20), default="Approved") # 'Approved', 'Pending', 'Rejected'
    reset_key = Column(String(10), nullable=True)
    reset_key_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("StudentProfile", back_populates="user", uselist=False)

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    usn = Column(String(50), unique=True, nullable=False)
    branch = Column(String(50), default="Computer Science")
    cgpa = Column(Float, default=0.0)
    major_projects = Column(Integer, default=0)
    mini_projects = Column(Integer, default=0)
    workshops_certs = Column(Integer, default=0)
    skills_count = Column(Integer, default=0)
    skills_list = Column(Text, default="")
    communication_rating = Column(Float, default=0.0)
    internship = Column(String(10), default="No") # 'Yes' or 'No'
    hackathon = Column(String(10), default="No") # 'Yes' or 'No'
    tenth_percentage = Column(Float, default=0.0)
    twelfth_percentage = Column(Float, default=0.0)
    backlogs = Column(Integer, default=0)
    resume_text = Column(Text, nullable=True)
    resume_pdf = Column(Text, nullable=True) # Base64 PDF data URL
    profile_photo = Column(Text, nullable=True) # Base64 data URL or image URL
    projects_details = Column(Text, nullable=True) # JSON array of projects
    internships_details = Column(Text, nullable=True) # JSON array of internships
    certifications_details = Column(Text, nullable=True) # JSON array of certifications
    sgpa_details = Column(Text, nullable=True) # JSON object of semester SGPAs (sem1..sem8)
    mock_interview_score = Column(Float, nullable=True, default=None) # Score out of 100
    placement_prob = Column(Float, default=0.0)
    placement_status = Column(String(50), default="Profile Incomplete")
    completion_email_sent = Column(Boolean, default=False)
    mock_interview_exited_mid = Column(Boolean, default=False)
    last_mock_interview_at = Column(DateTime, nullable=True)
    mock_reminder_last_sent_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_name = Column(String(100), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(100), default="Bangalore")
    ctc_lpa = Column(Float, default=12.0)
    min_cgpa = Column(Float, default=7.0)
    max_backlogs = Column(Integer, default=0)
    required_skills = Column(Text, nullable=False)
    status = Column(String(20), default="Active") # 'Active', 'Closed'
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(30), default="Applied") # 'Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'
    ai_fit_score = Column(Float, default=0.0)
    ai_fit_summary = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("JobPosting", back_populates="applications")
    student = relationship("User")

class DriveReport(Base):
    __tablename__ = "drive_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    total_students = Column(Integer, default=0)
    avg_placement_prob = Column(Float, default=0.0)
    ai_report_markdown = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class InterviewRequest(Base):
    __tablename__ = "interview_requests"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    meeting_link = Column(String(255), nullable=False)
    status = Column(String(20), default="Pending") # 'Pending', 'Accepted', 'Declined', 'Completed'
    student_notes = Column(Text, nullable=True)
    reminder_30m_sent = Column(Boolean, default=False)
    ai_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    job = relationship("JobPosting")
    recruiter = relationship("User", foreign_keys=[recruiter_id])
    student = relationship("User", foreign_keys=[student_id])
