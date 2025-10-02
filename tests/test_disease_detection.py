#!/usr/bin/env python3
"""
Comprehensive Test Suite for ऊस एकरी १०० टन
Professional testing for sugarcane disease detection system
Chordz Technologies
"""

import unittest
import json
import tempfile
import os
import sys
from pathlib import Path
import requests
from PIL import Image
import numpy as np

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.ai_engine import AIEngine
from app.core.config import get_settings
from app.api.main import app
from fastapi.testclient import TestClient

class TestDiseaseDetection(unittest.TestCase):
    """Test disease detection functionality"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        print("🧪 Setting up ऊस एकरी १०० टन Test Suite...")
        
        cls.client = TestClient(app)
        cls.ai_engine = AIEngine()
        cls.settings = get_settings()
        
        # Create test image
        cls.test_image_path = cls.create_test_image()
        
        print("✅ Test setup complete")
    
    @classmethod
    def create_test_image(cls):
        """Create a test image for testing"""
        # Create a simple test image
        image = Image.new('RGB', (224, 224), color='green')
        
        # Add some brown spots to simulate disease
        pixels = image.load()
        for i in range(50, 100):
            for j in range(50, 100):
                pixels[i, j] = (139, 69, 19)  # Brown color
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        image.save(temp_file.name)
        
        return temp_file.name
    
    def test_ai_engine_initialization(self):
        """Test AI engine initialization"""
        self.assertIsNotNone(self.ai_engine)
        self.assertIsNotNone(self.ai_engine.model)
        self.assertIsNotNone(self.ai_engine.class_mapping)
        print("✅ AI Engine initialization test passed")
    
    def test_model_loading(self):
        """Test model loading"""
        self.assertTrue(self.ai_engine.model_loaded)
        self.assertGreater(len(self.ai_engine.class_mapping), 0)
        print("✅ Model loading test passed")
    
    def test_image_preprocessing(self):
        """Test image preprocessing"""
        with open(self.test_image_path, 'rb') as f:
            image_data = f.read()
        
        processed_image = self.ai_engine.preprocess_image(image_data)
        
        self.assertIsNotNone(processed_image)
        self.assertEqual(processed_image.shape, (1, 224, 224, 3))
        print("✅ Image preprocessing test passed")
    
    def test_disease_prediction(self):
        """Test disease prediction"""
        with open(self.test_image_path, 'rb') as f:
            image_data = f.read()
        
        prediction = self.ai_engine.predict_disease(image_data)
        
        self.assertIsNotNone(prediction)
        self.assertIn('disease_name', prediction)
        self.assertIn('confidence', prediction)
        self.assertIn('disease_name_english', prediction)
        self.assertTrue(0 <= prediction['confidence'] <= 100)
        print("✅ Disease prediction test passed")
    
    def test_farmer_response_generation(self):
        """Test farmer-friendly response generation"""
        test_prediction = {
            'disease_name': 'तपकिरी ठिपके',
            'disease_name_english': 'Brown Spot',
            'confidence': 85.5,
            'severity': 'मध्यम'
        }
        
        farmer_context = {
            'experience': 'नवीन',
            'farm_size': 2.5,
            'location': 'पुणे',
            'crop_stage': 'वाढ'
        }
        
        response = self.ai_engine.generate_farmer_response(
            test_prediction, farmer_context
        )
        
        self.assertIsNotNone(response)
        self.assertIn('symptoms', response)
        self.assertIn('treatment', response)
        self.assertIn('prevention', response)
        self.assertIn('cost_info', response)
        print("✅ Farmer response generation test passed")

class TestAPIEndpoints(unittest.TestCase):
    """Test API endpoints"""
    
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_image_path = TestDiseaseDetection.create_test_image()
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get("/api/health")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('system_status', data)
        print("✅ Health endpoint test passed")
    
    def test_predict_endpoint_success(self):
        """Test successful prediction endpoint"""
        with open(self.test_image_path, 'rb') as f:
            files = {'image': ('test.jpg', f, 'image/jpeg')}
            data = {
                'farm_size': '2.5',
                'location': 'पुणे',
                'crop_stage': 'वाढ',
                'experience': 'मध्यम'
            }
            
            response = self.client.post("/api/predict", files=files, data=data)
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        
        self.assertTrue(result['success'])
        self.assertIn('diagnosis', result)
        self.assertIn('farmer_info', result)
        self.assertIn('action_plan', result)
        print("✅ Predict endpoint success test passed")
    
    def test_predict_endpoint_no_image(self):
        """Test prediction endpoint without image"""
        response = self.client.post("/api/predict", data={'farm_size': '2'})
        
        self.assertEqual(response.status_code, 422)
        print("✅ Predict endpoint validation test passed")
    
    def test_predict_endpoint_invalid_image(self):
        """Test prediction endpoint with invalid image"""
        files = {'image': ('test.txt', b'not an image', 'text/plain')}
        
        response = self.client.post("/api/predict", files=files)
        
        self.assertEqual(response.status_code, 400)
        result = response.json()
        self.assertFalse(result['success'])
        self.assertIn('error', result)
        print("✅ Invalid image test passed")
    
    def test_all_diseases_endpoint(self):
        """Test all diseases endpoint"""
        response = self.client.get("/api/all-diseases")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data['success'])
        self.assertIn('diseases', data)
        self.assertGreater(len(data['diseases']), 0)
        print("✅ All diseases endpoint test passed")

class TestDataIntegrity(unittest.TestCase):
    """Test data file integrity"""
    
    def test_class_mapping_integrity(self):
        """Test class mapping file"""
        class_mapping_path = PROJECT_ROOT / "data" / "class_mapping.json"
        
        self.assertTrue(class_mapping_path.exists())
        
        with open(class_mapping_path) as f:
            data = json.load(f)
        
        self.assertIn('class_mapping', data)
        self.assertGreater(len(data['class_mapping']), 0)
        
        # Check all required fields
        for disease_id, info in data['class_mapping'].items():
            self.assertIn('marathi_name', info)
            self.assertIn('english_name', info)
            self.assertIn('scientific_name', info)
            
        print("✅ Class mapping integrity test passed")
    
    def test_disease_solutions_integrity(self):
        """Test disease solutions file"""
        solutions_path = PROJECT_ROOT / "data" / "disease_solutions.json"
        
        self.assertTrue(solutions_path.exists())
        
        with open(solutions_path) as f:
            data = json.load(f)
        
        self.assertIn('disease_solutions', data)
        
        # Check solution structure
        for disease, solution in data['disease_solutions'].items():
            self.assertIn('symptoms', solution)
            self.assertIn('treatment', solution)
            self.assertIn('prevention', solution)
            
        print("✅ Disease solutions integrity test passed")
    
    def test_cost_estimates_integrity(self):
        """Test cost estimates file"""
        cost_path = PROJECT_ROOT / "data" / "cost_estimates.json"
        
        self.assertTrue(cost_path.exists())
        
        with open(cost_path) as f:
            data = json.load(f)
        
        self.assertIn('cost_estimates', data)
        self.assertIn('treatment_costs', data['cost_estimates'])
        
        print("✅ Cost estimates integrity test passed")

class TestMarathiInterface(unittest.TestCase):
    """Test Marathi language interface"""
    
    def test_marathi_response_format(self):
        """Test Marathi response formatting"""
        ai_engine = AIEngine()
        
        test_prediction = {
            'disease_name': 'लाल कुजणे',
            'disease_name_english': 'RedRot',
            'confidence': 90.2,
            'severity': 'गंभीर'
        }
        
        farmer_context = {
            'experience': 'नवीन',
            'farm_size': 1.5,
            'location': 'सातारा'
        }
        
        response = ai_engine.generate_farmer_response(
            test_prediction, farmer_context
        )
        
        # Check Marathi text presence
        symptoms_text = response['symptoms']['basic']
        self.assertTrue(self.contains_marathi_text(symptoms_text))
        
        treatment_text = response['treatment']['content']
        self.assertTrue(self.contains_marathi_text(treatment_text))
        
        print("✅ Marathi interface test passed")
    
    def contains_marathi_text(self, text):
        """Check if text contains Marathi characters"""
        marathi_range = range(0x0900, 0x097F)  # Devanagari Unicode range
        return any(ord(char) in marathi_range for char in text)

class TestPerformance(unittest.TestCase):
    """Test system performance"""
    
    def test_prediction_speed(self):
        """Test prediction response time"""
        import time
        
        ai_engine = AIEngine()
        
        with open(TestDiseaseDetection.test_image_path, 'rb') as f:
            image_data = f.read()
        
        start_time = time.time()
        prediction = ai_engine.predict_disease(image_data)
        end_time = time.time()
        
        prediction_time = end_time - start_time
        
        self.assertIsNotNone(prediction)
        self.assertLess(prediction_time, 10.0)  # Should be under 10 seconds
        
        print(f"✅ Prediction completed in {prediction_time:.2f} seconds")
    
    def test_concurrent_requests(self):
        """Test handling multiple concurrent requests"""
        import threading
        import time
        
        client = TestClient(app)
        results = []
        
        def make_request():
            with open(TestDiseaseDetection.test_image_path, 'rb') as f:
                files = {'image': ('test.jpg', f.read(), 'image/jpeg')}
                response = client.post("/api/predict", files=files)
                results.append(response.status_code)
        
        # Create 5 concurrent requests
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check all requests succeeded
        self.assertEqual(len(results), 5)
        self.assertTrue(all(status == 200 for status in results))
        
        print("✅ Concurrent requests test passed")

class TestSecurity(unittest.TestCase):
    """Test security measures"""
    
    def test_file_size_limit(self):
        """Test file size validation"""
        client = TestClient(app)
        
        # Create large dummy file (>16MB)
        large_file_content = b'x' * (17 * 1024 * 1024)
        
        files = {'image': ('large.jpg', large_file_content, 'image/jpeg')}
        response = client.post("/api/predict", files=files)
        
        self.assertEqual(response.status_code, 413)
        print("✅ File size limit test passed")
    
    def test_file_type_validation(self):
        """Test file type validation"""
        client = TestClient(app)
        
        # Try to upload non-image file
        files = {'image': ('malicious.exe', b'malicious content', 'application/exe')}
        response = client.post("/api/predict", files=files)
        
        self.assertEqual(response.status_code, 400)
        result = response.json()
        self.assertFalse(result['success'])
        
        print("✅ File type validation test passed")

class TestIntegration(unittest.TestCase):
    """Integration tests"""
    
    def test_end_to_end_prediction(self):
        """Test complete end-to-end prediction flow"""
        client = TestClient(app)
        
        # Step 1: Check system health
        health_response = client.get("/api/health")
        self.assertEqual(health_response.status_code, 200)
        
        # Step 2: Make prediction
        with open(TestDiseaseDetection.test_image_path, 'rb') as f:
            files = {'image': ('test.jpg', f, 'image/jpeg')}
            data = {
                'farm_size': '3.0',
                'location': 'कोल्हापूर',
                'crop_stage': 'वाढ',
                'experience': 'अनुभवी'
            }
            
            prediction_response = client.post("/api/predict", files=files, data=data)
        
        self.assertEqual(prediction_response.status_code, 200)
        result = prediction_response.json()
        
        # Verify complete response structure
        required_fields = [
            'success', 'diagnosis', 'farmer_info', 'action_plan',
            'expert_guidance', 'display_settings', 'metadata'
        ]
        
        for field in required_fields:
            self.assertIn(field, result)
        
        # Verify Marathi content
        self.assertIn('disease_name', result['diagnosis'])
        self.assertIn('symptoms', result['farmer_info'])
        
        print("✅ End-to-end prediction test passed")
    
    def test_farmer_context_integration(self):
        """Test farmer context integration"""
        client = TestClient(app)
        
        # Test different farmer profiles
        profiles = [
            {'experience': 'नवीन', 'farm_size': '1.0'},
            {'experience': 'मध्यम', 'farm_size': '3.5'},
            {'experience': 'अनुभवी', 'farm_size': '8.0'}
        ]
        
        for profile in profiles:
            with open(TestDiseaseDetection.test_image_path, 'rb') as f:
                files = {'image': ('test.jpg', f.read(), 'image/jpeg')}
                
                response = client.post("/api/predict", files=files, data=profile)
                
                self.assertEqual(response.status_code, 200)
                result = response.json()
                
                # Verify context-aware response
                self.assertIn('farmer_info', result)
                self.assertIn('cost_info', result['farmer_info'])
        
        print("✅ Farmer context integration test passed")

def run_tests():
    """Run all tests with proper reporting"""
    print("\n" + "="*60)
    print("🧪 RUNNING ऊस एकरी १०० टन TEST SUITE")
    print("="*60)
    
    # Create test suite
    test_classes = [
        TestDiseaseDetection,
        TestAPIEndpoints, 
        TestDataIntegrity,
        TestMarathiInterface,
        TestPerformance,
        TestSecurity,
        TestIntegration
    ]
    
    suite = unittest.TestSuite()
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2, buffer=True)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    print(f"Tests Run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success Rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print("\n❌ FAILURES:")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback}")
    
    if result.errors:
        print("\n💥 ERRORS:")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback}")
    
    if result.wasSuccessful():
        print("\n🎉 ALL TESTS PASSED! System ready for deployment.")
    else:
        print("\n⚠️ Some tests failed. Please fix issues before deployment.")
    
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
