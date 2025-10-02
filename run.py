#!/usr/bin/env python3
"""
ऊस एकरी १०० टन - Sugarcane Disease Detection System
Application Launcher with WORKING MODEL INTEGRATION
Author: Chordz Technologies
Date: 2025
"""
import os
import sys
from app import create_app

def main():
    """Main application entry point"""
    print("=" * 60)
    print("🌾 Starting ऊस एकरी १०० टन")
    print("🏢 Chordz Technologies")
    print("📅 Sugarcane Disease Detection System")
    print("🔧 Working Model Integration Version")
    print("=" * 60)
    
    # Get configuration environment
    config_name = os.getenv('FLASK_CONFIG', 'development')
    
    try:
        # Create Flask application
        app = create_app(config_name)
        
        # Get host and port from environment or use defaults
        host = os.getenv('HOST', '0.0.0.0')
        port = int(os.getenv('PORT', 5000))
        debug = config_name == 'development'
        
        print(f"\n🌐 Server Configuration:")
        print(f"   Environment: {config_name}")
        print(f"   Host: {host}")
        print(f"   Port: {port}")
        print(f"   Debug: {debug}")
        print(f"   URL: http://localhost:{port}")
        print(f"\n📱 Ready to serve farmers!")
        print("🛑 Press Ctrl+C to stop")
        print("=" * 60)
        
        # Run the Flask application
        app.run(
            host=host,
            port=port,
            debug=debug,
            use_reloader=False  # Prevent double model loading
        )
        
    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        print("💡 Make sure all required files are in the correct locations")
        sys.exit(1)
        
    except KeyboardInterrupt:
        print(f"\n🛑 Application stopped by user")
        sys.exit(0)
        
    except Exception as e:
        print(f"\n❌ Application failed to start: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
