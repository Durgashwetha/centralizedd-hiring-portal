import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "CampusQuant AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Secret Key for JWT
    SECRET_KEY: str = "campusquant_secret_key_2026_super_secure_jwt_token_auth"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database Settings (XAMPP MySQL on localhost:3306, with SQLite fallback)
    MYSQL_DB_URL: str = "mysql+pymysql://root:@localhost:3306/campusquant_db"
    SQLITE_DB_URL: str = "sqlite:///./campusquant.db"
    
    # Groq API Keys Pool (Read from environment variables)
    GROQ_API_KEYS: list = [
        os.getenv("GROQ_API_KEY", "your_groq_api_key_here"),
        os.getenv("GROQ_API_KEY_SECONDARY", "your_secondary_groq_api_key_here")
    ]
    
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_FALLBACK_MODEL: str = "mixtral-8x7b-32768"

    # SMTP Gmail Email Credentials
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_EMAIL: str = os.getenv("SMTP_EMAIL", "campusquantai@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "your_smtp_app_password")

settings = Settings()
