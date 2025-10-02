"""
Advanced Disease Analysis Engine
Professional AI-powered diagnosis with farmer-friendly explanations
"""
import logging
import numpy as np
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class AdvancedDiseaseAnalyzer:
    """Professional disease analyzer with comprehensive diagnosis"""
    
    def __init__(self, model_loader, config):
        """Initialize disease analyzer"""
        self.model_loader = model_loader
        self.config = config
        # CORRECTED confidence thresholds for your model
        self.confidence_thresholds = {
            'high': 0.80,
            'medium': 0.60, 
            'low': 0.40
        }
        
    def analyze_disease(self, processed_image: np.ndarray, farmer_context: Dict = None) -> Dict[str, Any]:
        """Perform comprehensive disease analysis with CORRECTED processing"""
        try:
            logger.info("🔬 रोग विश्लेषण सुरू...")
            
            if farmer_context is None:
                farmer_context = {}
                
            # Basic context setup
            farmer_context.setdefault('farm_size', 1.0)
            farmer_context.setdefault('location', '')
            farmer_context.setdefault('experience', 'beginner')
            
            # Perform AI prediction with CORRECTED model
            prediction_result = self.perform_ai_prediction(processed_image)
            if not prediction_result['success']:
                return prediction_result
                
            logger.info("✅ AI विश्लेषण पूर्ण")
            
            # Analyze confidence levels
            confidence_analysis = self.analyze_confidence(
                prediction_result['predictions'],
                prediction_result['predicted_class']
            )
            
            # Get comprehensive disease information
            disease_info = self.get_comprehensive_disease_info(
                prediction_result['predicted_class'],
                prediction_result['confidence'],
                farmer_context
            )
            
            # Generate farmer recommendations
            recommendations = self.generate_farmer_recommendations(
                prediction_result['predicted_class'],
                prediction_result['confidence'],
                farmer_context
            )
            
            # Calculate treatment costs
            cost_analysis = self.calculate_treatment_costs(
                prediction_result['predicted_class'],
                farmer_context.get('farm_size', 1.0)
            )
            
            # Compile comprehensive result
            comprehensive_result = {
                'success': True,
                'diagnosis': {
                    'predicted_class': prediction_result['predicted_class'],
                    'confidence': prediction_result['confidence'],
                    'confidence_level': confidence_analysis['level'],
                    'confidence_marathi': confidence_analysis['level_marathi'],
                    'severity': confidence_analysis['severity'],
                    'marathi_name': disease_info['marathi_name']
                },
                'disease_information': disease_info,
                'confidence_analysis': confidence_analysis,
                'recommendations': recommendations,
                'cost_analysis': cost_analysis,
                'farmer_context': farmer_context,
                'alternative_diagnoses': self.get_alternative_diagnoses(prediction_result['all_predictions']),
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"🎯 निदान पूर्ण: {prediction_result['predicted_class']}")
            return comprehensive_result
            
        except Exception as e:
            logger.error(f"Disease analysis failed: {str(e)}")
            return {
                'success': False,
                'error': f'रोग विश्लेषण अपयशी: {str(e)}',
                'error_marathi': 'विश्लेषणात अडचण आली'
            }
    
    def perform_ai_prediction(self, processed_image: np.ndarray) -> Dict[str, Any]:
        """Perform AI prediction using the CORRECTED model"""
        try:
            if self.model_loader is None or self.model_loader.model is None:
                raise ValueError("Model not loaded")
                
            # Validate input shape for 128x128 model
            expected_shape = (1, 128, 128, 3)
            if processed_image.shape != expected_shape:
                raise ValueError(f"Invalid input shape: {processed_image.shape}, expected: {expected_shape}")
            
            # Make prediction
            predictions = self.model_loader.model.predict(processed_image, verbose=0)[0]
            
            # Get predicted class
            predicted_class_idx = np.argmax(predictions)
            confidence = float(predictions[predicted_class_idx])
            predicted_class = self.model_loader.classes[predicted_class_idx]
            
            logger.info(f"AI Prediction: {predicted_class} ({confidence:.2%})")
            
            return {
                'success': True,
                'predicted_class': predicted_class,
                'confidence': confidence,
                'predictions': predictions,
                'all_predictions': predictions.tolist(),
                'class_probabilities': {
                    self.model_loader.classes[i]: float(predictions[i])
                    for i in range(len(self.model_loader.classes))
                }
            }
            
        except Exception as e:
            logger.error(f"AI prediction failed: {str(e)}")
            return {
                'success': False,
                'error': f'AI prediction failed: {str(e)}'
            }
    
    def analyze_confidence(self, predictions: np.ndarray, predicted_class: str) -> Dict[str, Any]:
        """Analyze prediction confidence with CORRECTED thresholds"""
        max_confidence = float(np.max(predictions))
        second_max = float(np.partition(predictions.flatten(), -2)[-2])
        confidence_gap = max_confidence - second_max
        
        # Determine confidence level
        if max_confidence >= self.confidence_thresholds['high']:
            level = 'high'
            level_marathi = 'उच्च खात्री'
            reliability = 'विश्वसनीय'
        elif max_confidence >= self.confidence_thresholds['medium']:
            level = 'medium'
            level_marathi = 'मध्यम खात्री'
            reliability = 'चांगली'
        else:
            level = 'low'
            level_marathi = 'कमी खात्री'
            reliability = 'संशयास्पद'
        
        # Determine severity
        if predicted_class == 'Healthy':
            severity = 'निरोगी'
        elif predicted_class in ['RedRot', 'Mosaic', 'Grassy shoot']:
            severity = 'गंभीर'
        elif predicted_class in ['Brown Spot', 'BrownRust', 'Rust']:
            severity = 'मध्यम'
        else:
            severity = 'सामान्य'
        
        return {
            'level': level,
            'level_marathi': level_marathi,
            'confidence_score': max_confidence,
            'confidence_gap': confidence_gap,
            'reliability': reliability,
            'severity': severity,
            'urgent': max_confidence > 0.8 and predicted_class != 'Healthy',
            'expert_needed': predicted_class in ['RedRot', 'Mosaic', 'Grassy shoot']
        }
    
    def get_comprehensive_disease_info(self, disease_name: str, confidence: float, farmer_context: Dict) -> Dict[str, Any]:
        """Get comprehensive disease information from CORRECTED data"""
        disease_solution = self.model_loader.disease_solutions.get(disease_name, {})
        marathi_name = self.model_loader.class_mapping.get(disease_name, disease_name)
        
        return {
            'disease_name': disease_name,
            'marathi_name': marathi_name,
            'symptoms': disease_solution.get('symptoms', 'लक्षणे उपलब्ध नाहीत'),
            'detailed_symptoms': disease_solution.get('detailed_symptoms', []),
            'solution': disease_solution.get('solution', 'उपचार माहिती उपलब्ध नाही'),
            'prevention': disease_solution.get('prevention', 'प्रतिबंध माहिती उपलब्ध नाही'),
            'organic_solutions': disease_solution.get('organic_solutions', []),
            'immediate_care': disease_solution.get('immediate_care', []),
            'stage_specific_care': disease_solution.get('stage_specific_care', {}),
            'expected_recovery_time': disease_solution.get('expected_recovery_time', 'माहिती उपलब्ध नाही')
        }
    
    def generate_farmer_recommendations(self, disease_name: str, confidence: float, farmer_context: Dict) -> Dict[str, Any]:
        """Generate personalized farmer recommendations"""
        experience_level = farmer_context.get('experience', 'beginner')
        farm_size = farmer_context.get('farm_size', 1.0)
        
        # Base recommendations
        recommendations = {
            'immediate_actions': [],
            'weekly_care': [],
            'monthly_care': [],
            'warnings': [],
            'success_indicators': []
        }
        
        # Disease-specific recommendations
        if disease_name == 'Healthy':
            recommendations['immediate_actions'] = [
                'सध्याचे व्यवस्थापन चालू ठेवा',
                'नियमित तपासणी करत रहा'
            ]
        elif disease_name == 'RedRot':
            recommendations['immediate_actions'] = [
                'संक्रमित भाग तातडीने काढून टाका',
                'तज्ञ सल्ला घ्या',
                'बाजूचे पीक वेगळे करा'
            ]
            recommendations['warnings'] = [
                'ही बाब तातडीने हाताळण्याची गरज आहे',
                'इतर पिकांमध्ये पसरू शकते'
            ]
        
        # Experience-based adjustments
        if experience_level == 'beginner':
            recommendations['expert_consultation'] = 'तज्ञ सल्ला घेणे आवश्यक'
        
        return recommendations
    
    def calculate_treatment_costs(self, disease_name: str, farm_size: float) -> Dict[str, Any]:
        """Calculate treatment costs based on disease and farm size"""
        # Base costs per acre (in INR)
        base_costs = {
            'Healthy': 0,
            'RedRot': 2400,
            'Brown Spot': 700,
            'BrownRust': 800,
            'Mosaic': 3000,
            'Grassy shoot': 2800,
            'Rust': 650,
            'Yellow Leaf': 500,
            'Pokkah Boeng': 900,
            'Banded Chlorosis': 600,
            'Sett Rot': 1200,
            'Dried Leaves': 400
        }
        
        base_cost = base_costs.get(disease_name, 1000)
        total_cost = base_cost * farm_size
        
        return {
            'base_cost_per_acre': base_cost,
            'total_estimated_cost': total_cost,
            'cost_breakdown': {
                'medicines': total_cost * 0.6,
                'labor': total_cost * 0.3,
                'equipment': total_cost * 0.1
            },
            'cost_range': {
                'minimum': total_cost * 0.8,
                'maximum': total_cost * 1.2
            },
            'currency': 'INR',
            'farm_size_acres': farm_size
        }
    
    def get_alternative_diagnoses(self, all_predictions: List[float]) -> List[Dict[str, Any]]:
        """Get alternative diagnoses with probabilities"""
        # Sort predictions to get top alternatives
        sorted_indices = np.argsort(all_predictions)[::-1]
        alternatives = []
        
        for i, idx in enumerate(sorted_indices[1:4]):  # Top 3 alternatives
            if all_predictions[idx] > 0.1:  # Only show if probability > 10%
                class_name = self.model_loader.classes[idx]
                marathi_name = self.model_loader.class_mapping.get(class_name, class_name)
                alternatives.append({
                    'disease_name': class_name,
                    'marathi_name': marathi_name,
                    'probability': float(all_predictions[idx]),
                    'rank': i + 2
                })
        
        return alternatives

# Global instance getter
_disease_analyzer = None

def get_disease_analyzer(model_loader=None, config=None):
    """Get global disease analyzer instance"""
    global _disease_analyzer
    if _disease_analyzer is None and model_loader and config:
        _disease_analyzer = AdvancedDiseaseAnalyzer(model_loader, config)
    return _disease_analyzer
