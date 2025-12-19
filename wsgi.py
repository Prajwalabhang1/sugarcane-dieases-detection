#!/usr/bin/env python3
"""
WSGI Entry Point for Production Deployment
ऊस एकरी १०० टन - Sugarcane Disease Detection System
Chordz Technologies
"""
import os
from app import create_app

# Get configuration from environment
config_name = os.getenv('FLASK_CONFIG', 'production')

# Create Flask application instance
app = create_app(config_name)

if __name__ == '__main__':
    # This block is only for direct execution (not used in production)
    # Production uses Gunicorn to run this module
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    app.run(host=host, port=port, debug=False)
