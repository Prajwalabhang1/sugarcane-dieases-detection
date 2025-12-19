"""
Configuration File for ऊस एकरी १०० टन
Professional AI-powered Sugarcane Disease Detection System
Chordz Technologies
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

# Application Configuration
APP_NAME = "ऊस एकरी १०० टन"
COMPANY_NAME = "Chordz Technologies"
VERSION = "2.0.0"


class Config:
    """Base configuration class"""

    # Application settings
    APP_NAME = APP_NAME
    COMPANY_NAME = COMPANY_NAME
    VERSION = VERSION
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-change-in-production'

    # Model configuration
    IMAGE_SIZE = 128
    IMAGE_CHANNELS = 3
    MODEL_INPUT_SHAPE = (IMAGE_SIZE, IMAGE_CHANNELS, IMAGE_SIZE)

    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif'}
    UPLOAD_FOLDER = BASE_DIR / "uploads"

    # Model Paths
    MODEL_PATH = BASE_DIR / "models" / "Final_Model.keras"
    CLASS_MAPPING_PATH = BASE_DIR / "models" / "class_mapping.json"
    DISEASE_SOLUTIONS_PATH = BASE_DIR / "models" / "disease_solutions.json"

    # Data Paths
    EMERGENCY_CONTACTS_PATH = BASE_DIR / "data" / "emergency_contacts.json"
    SEASONAL_ADVICE_PATH = BASE_DIR / "data" / "seasonal_advice.json"
    COST_ESTIMATES_PATH = BASE_DIR / "data" / "cost_estimates.json"
    FARMER_PROFILES_PATH = BASE_DIR / "data" / "farmer_profiles.json"

    # Logging
    LOG_FOLDER = BASE_DIR / "logs"
    LOG_FILE = LOG_FOLDER / "app.log"

    @staticmethod
    def init_app(app):
        """Initialize application"""
        pass


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Override SECRET_KEY with environment variable (required for production)
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # Validate SECRET_KEY
    if not SECRET_KEY or SECRET_KEY == 'dev-key-change-in-production':
        import sys
        print("WARNING: SECRET_KEY not set or using default value!")
        print("Set a secure SECRET_KEY in your .env file")
        # In strict production, you might want to exit here
        # sys.exit(1)
    
    # Production server settings
    SERVER_NAME = os.environ.get('SERVER_NAME')  # e.g., 'api.yourdomain.com'
    PREFERRED_URL_SCHEME = 'https'  # Use HTTPS in production
    
    # Session security
    SESSION_COOKIE_SECURE = True  # Only send cookies over HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Iframe embedding configuration
    ALLOWED_IFRAME_PARENTS = os.environ.get('ALLOWED_IFRAME_PARENTS', '*').split(',')



class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
