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
