import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

def get_engine():
    # Attempt MySQL connection first
    try:
        # Create database if it doesn't exist
        conn = pymysql.connect(host='localhost', user='root', password='', port=3306)
        cursor = conn.cursor()
        cursor.execute("CREATE DATABASE IF NOT EXISTS campusquant_db;")
        conn.close()
        
        engine = create_engine(settings.MYSQL_DB_URL, pool_pre_ping=True, echo=False)
        # Test connection & migration check
        with engine.connect() as connection:
            print("Successfully connected to MySQL database (campusquant_db).")
            # Auto-migrate columns
            for col in ['profile_photo', 'projects_details', 'internships_details', 'certifications_details', 'sgpa_details', 'resume_pdf']:
                try:
                    connection.execute(text(f"ALTER TABLE student_profiles ADD COLUMN {col} LONGTEXT NULL;"))
                    connection.commit()
                except Exception:
                    pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN mock_interview_score FLOAT NULL;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("UPDATE student_profiles SET mock_interview_score = NULL WHERE mock_interview_score = 80.0;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN completion_email_sent BOOLEAN DEFAULT 0;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN mock_interview_exited_mid BOOLEAN DEFAULT 0;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN last_mock_interview_at DATETIME NULL;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN mock_reminder_last_sent_at DATETIME NULL;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'Approved';"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN reset_key VARCHAR(10) NULL;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN reset_key_expires_at DATETIME NULL;"))
                connection.commit()
            except Exception:
                pass
        return engine
    except Exception as e:
        print(f"MySQL Connection Warning: {e}. Falling back to SQLite database.")
        engine = create_engine(
            settings.SQLITE_DB_URL, 
            connect_args={"check_same_thread": False}, 
            echo=False
        )
        with engine.connect() as connection:
            for col in ['profile_photo', 'projects_details', 'internships_details', 'certifications_details']:
                try:
                    connection.execute(text(f"ALTER TABLE student_profiles ADD COLUMN {col} TEXT NULL;"))
                    connection.commit()
                except Exception:
                    pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN mock_interview_score FLOAT NULL;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("UPDATE student_profiles SET mock_interview_score = NULL WHERE mock_interview_score = 80.0;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN completion_email_sent BOOLEAN DEFAULT 0;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN mock_interview_exited_mid BOOLEAN DEFAULT 0;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN last_mock_interview_at DATETIME NULL;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE student_profiles ADD COLUMN mock_reminder_last_sent_at DATETIME NULL;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'Approved';"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN reset_key VARCHAR(10) NULL;"))
                connection.commit()
            except Exception:
                pass
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN reset_key_expires_at DATETIME NULL;"))
                connection.commit()
            except Exception:
                pass
        return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
