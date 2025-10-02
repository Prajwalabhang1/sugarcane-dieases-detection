"""
Quick test to verify everything is working
"""
import os
import json

def test_setup():
    """Test if all required files exist"""
    print("🧪 Testing project setup...")
    
    required_files = [
        "models/Final_Model.keras",
        "models/class_mapping.json", 
        "models/disease_solutions.json",
        "templates/index.html",
        "static/js/app.js",
        "static/css/main.css"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
        else:
            print(f"✅ {file_path}")
    
    if missing_files:
        print(f"\n❌ Missing files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    # Test JSON files
    try:
        with open("models/class_mapping.json", 'r') as f:
            class_data = json.load(f)
        print(f"✅ Classes: {len(class_data.get('classes', []))}")
        
        with open("models/disease_solutions.json", 'r') as f:
            solutions = json.load(f)
        print(f"✅ Disease solutions: {len(solutions)}")
        
    except Exception as e:
        print(f"❌ JSON file error: {e}")
        return False
    
    print("\n🎯 All files found! Ready to run.")
    return True

if __name__ == "__main__":
    if test_setup():
        print("\n💡 Run the app with: python run.py")
    else:
        print("\n💡 Fix missing files first")
