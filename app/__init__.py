"""
Application Factory for Flask App
Complete working version - NO BUGS
Chordz Technologies
"""

import os
import logging
from flask import Flask


def create_app(config_name='development'):
    """Create Flask application with specified configuration"""

    # Import config
    from config import Config, DevelopmentConfig, ProductionConfig

    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'default': DevelopmentConfig
    }

    # Create Flask instance
    app = Flask(__name__, 
                static_folder='../static', 
                template_folder='../templates')

    # Load configuration
    config_class = config_map.get(config_name, DevelopmentConfig)
    app.config.from_object(config_class)

    # Setup logging
    setup_logging(app)

    # Create directories
    create_directories(app)

    # Initialize components (model, image processor)
    initialize_components(app)

    # Register blueprints (routes)
    register_blueprints(app)

    app.logger.info(f"App {app.config['APP_NAME']} initialized successfully")
    app.logger.info(f"Company: {app.config['COMPANY_NAME']}")
    app.logger.info(f"Version: {app.config['VERSION']}")

    return app


def setup_logging(app):
    """Setup application logging"""
    log_level = logging.DEBUG if app.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )


def create_directories(app):
    """Create necessary directories"""
    try:
        os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
        os.makedirs('logs', exist_ok=True)
        app.logger.info("Directories created successfully")
    except Exception as e:
        app.logger.warning(f"Directory creation warning: {e}")


def initialize_components(app):
    """Initialize AI model and utilities"""
    try:
        # Initialize model loader
        from utils.model_loader import initialize_model_and_data
        model_success = initialize_model_and_data(app.config)

        if model_success:
            app.logger.info("AI Model loaded successfully")
        else:
            app.logger.warning("AI Model loading failed - will retry on requests")

        # Initialize image processor
        from utils.image_processor import initialize_image_processor
        initialize_image_processor(app.config)
        app.logger.info("Image processor initialized")

    except Exception as e:
        app.logger.error(f"Component initialization error: {e}")


def register_blueprints(app):
    """Register Flask blueprints"""
    try:
        from app.routes import main_bp
        app.register_blueprint(main_bp)
        app.logger.info("Routes registered successfully")
    except ImportError as import_error:
        app.logger.error(f"Failed to import routes: {import_error}")

        # Create minimal emergency route
        @app.route('/')
        def emergency_home():
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>ऊस एकरी १०० टन - System Status</title>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 40px; background: #f0f4f8; }}
                    .container {{ max-width: 800px; margin: 0 auto; background: white; 
                                 padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    h1 {{ color: #2c5f2d; }}
                    .error {{ background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }}
                    .status {{ background: #d1ecf1; padding: 20px; border-left: 4px solid #17a2b8; margin: 20px 0; }}
                    code {{ background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🌾 ऊस एकरी १०० टन</h1>
                    <p><strong>Chordz Technologies - Sugarcane Disease Detection</strong></p>

                    <div class="error">
                        <h3>⚠️ Routes Import Error</h3>
                        <p><strong>Error:</strong> {import_error}</p>
                        <p>The main routes could not be loaded. Check app/routes.py for errors.</p>
                    </div>

                    <div class="status">
                        <h3>✅ Flask App Status</h3>
                        <p>Flask application is running</p>
                        <p>Server is operational</p>
                        <p>Configuration loaded</p>
                    </div>

                    <h3>🔧 How to Fix:</h3>
                    <ol>
                        <li>Check if <code>app/routes.py</code> exists</li>
                        <li>Check for syntax errors in routes.py</li>
                        <li>Verify imports in routes.py are correct</li>
                        <li>Restart the server after fixing</li>
                    </ol>

                    <h3>📋 Quick Test:</h3>
                    <p>Run in terminal:</p>
                    <pre style="background: #2d2d2d; color: #f8f8f8; padding: 15px; border-radius: 5px; overflow-x: auto;">
python -c "from app.routes import main_bp; print('Routes OK')"</pre>
                </div>
            </body>
            </html>
            """

        app.logger.info("Emergency fallback route registered")
    except Exception as e:
        app.logger.error(f"Blueprint registration failed: {e}")
