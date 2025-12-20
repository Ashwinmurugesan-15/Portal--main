import os


class BaseConfig:
    APP_ENV = os.getenv("APP_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "")
    EXCEL_FILE = os.getenv("EXCEL_FILE", os.path.join("uploads", "data.xlsx"))
    SHEET_NAME = os.getenv("SHEET_NAME", "Candidates")
    USER_DB = os.getenv("USER_DB", os.path.join("database", "users.db"))
    DATABASE = os.getenv("DATABASE", os.path.join("database", "candidates.db"))
    EMAIL_CONFIG = {
        "SMTP_SERVER": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "SMTP_PORT": int(os.getenv("SMTP_PORT", "587")),
        "SENDER_EMAIL": os.getenv("SENDER_EMAIL", ""),
        "SENDER_PASSWORD": os.getenv("SENDER_PASSWORD", ""),
        "SENDER_NAME": os.getenv("SENDER_NAME", "HR Recruitment Team"),
    }
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
    API_BASE_URL = os.getenv("API_BASE_URL", "")
    RESUME_API_BASE_URL = os.getenv("RESUME_API_BASE_URL", "")
    API_CONFIG = {
        "BASE_URL": API_BASE_URL,
        "RESUME_BASE_URL": RESUME_API_BASE_URL,
    }
    API_ALLOWED_ORIGINS = os.getenv("API_ALLOWED_ORIGINS", "*")
    DEBUG = False
    PORT = int(os.getenv("PORT", "5000"))


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    EXCEL_FILE = os.getenv("DEV_EXCEL_FILE", BaseConfig.EXCEL_FILE)
    USER_DB = os.getenv("DEV_USER_DB", BaseConfig.USER_DB)
    DATABASE = os.getenv("DEV_DATABASE", BaseConfig.DATABASE)
    API_BASE_URL = os.getenv("DEV_API_BASE_URL", BaseConfig.API_BASE_URL)
    RESUME_API_BASE_URL = os.getenv("DEV_RESUME_API_BASE_URL", BaseConfig.RESUME_API_BASE_URL)
    API_CONFIG = {
        "BASE_URL": API_BASE_URL,
        "RESUME_BASE_URL": RESUME_API_BASE_URL,
    }
    PORT = int(os.getenv("DEV_PORT", BaseConfig.PORT))


class ProductionConfig(BaseConfig):
    DEBUG = False
    EXCEL_FILE = os.getenv("PROD_EXCEL_FILE", BaseConfig.EXCEL_FILE)
    USER_DB = os.getenv("PROD_USER_DB", BaseConfig.USER_DB)
    DATABASE = os.getenv("PROD_DATABASE", BaseConfig.DATABASE)
    API_BASE_URL = os.getenv("PROD_API_BASE_URL", BaseConfig.API_BASE_URL)
    RESUME_API_BASE_URL = os.getenv("PROD_RESUME_API_BASE_URL", BaseConfig.RESUME_API_BASE_URL)
    API_CONFIG = {
        "BASE_URL": API_BASE_URL,
        "RESUME_BASE_URL": RESUME_API_BASE_URL,
    }
    PORT = int(os.getenv("PROD_PORT", BaseConfig.PORT))
