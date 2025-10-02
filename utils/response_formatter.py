"""
Response Formatter for Farmer-Friendly API Responses
Professional formatting with Marathi language support
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def format_farmer_response(analysis_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format analysis result into farmer-friendly response
    Optimized for mobile display and Marathi language
    """
    try:
        # Base response structure
        formatted_response = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'app_info': {
                'name': 'ऊस एकरी १०० टन',
                'company': 'Chordz Technologies',
                'message': 'आपल्या पिकाची काळजी आमची जबाबदारी'
            }
        }
        
        # Main diagnosis information
        formatted_response['diagnosis'] = {
            'disease_name': analysis_result['disease_name_marathi'],
            'disease_name_english': analysis_result['disease_name_english'],
            'confidence': analysis_result['confidence'],
            'confidence_text': f"{analysis_result['confidence']}% विश्वास",
            'confidence_level': analysis_result.get('confidence_level_marathi', 'मध्यम'),
            'severity': analysis_result.get('severity_level', 'मध्यम'),
            'status_color': _get_status_color(analysis_result['disease_name_english'], analysis_result['confidence'])
        }
        
        # Farmer-friendly information sections
        formatted_response['farmer_info'] = {
            'symptoms': {
                'title': 'रोगाची लक्षणे',
                'basic': analysis_result.get('symptoms', 'माहिती नाही'),
                'detailed': analysis_result.get('detailed_symptoms', []),
                'icon': '🔍'
            },
            'treatment': {
                'title': 'उपचार पद्धती',
                'content': analysis_result.get('solution', 'कृषी तज्ञांचा सल्ला घ्या'),
                'immediate_actions': analysis_result.get('immediate_actions', []),
                'icon': '💊'
            },
            'prevention': {
                'title': 'प्रतिबंधक उपाय',
                'content': analysis_result.get('prevention', 'नियमित काळजी घ्या'),
                'long_term_care': analysis_result.get('long_term_care', []),
                'icon': '🛡️'
            },
            'cost_info': {
                'title': 'खर्चाचा अंदाज',
                'total': analysis_result.get('cost_estimate', 'माहिती नाही'),
                'breakdown': analysis_result.get('cost_breakdown', {}),
                'timeline': analysis_result.get('recovery_timeline', {}),
                'icon': '💰'
            }
        }
        
        # Action guidance for farmers
        formatted_response['action_plan'] = {
            'next_steps': {
                'title': 'पुढील पावले',
                'steps': analysis_result.get('next_steps_marathi', [
                    'दररोज पिकाची तपासणी करा',
                    'उपचारानंतरचे बदल नोंदवा',
                    'शंका असल्यास पुन्हा फोटो घ्या'
                ]),
                'icon': '📋'
            },
            'warning_signs': {
                'title': 'सावधगिरीची चिन्हे',
                'signs': analysis_result.get('warning_signs', [
                    'लक्षणे वाढत असल्यास',
                    'नवीन भागात पसरत असल्यास'
                ]),
                'icon': '⚠️'
            },
            'success_indicators': {
                'title': 'यशाची चिन्हे',
                'indicators': analysis_result.get('success_indicators', [
                    'नवीन हिरवी पाने येणे',
                    'जुनी लक्षणे कमी होणे'
                ]),
                'icon': '✅'
            }
        }
        
        # Expert consultation guidance
        formatted_response['expert_guidance'] = {
            'consultation_needed': analysis_result.get('expert_consultation', False),
            'urgency_level': _get_urgency_level(analysis_result),
            'when_to_consult': _get_consultation_guidance(analysis_result),
            'emergency_protocol': analysis_result.get('urgency_required', False)
        }
        
        # Additional helpful information
        formatted_response['additional_info'] = {
            'recovery_time': analysis_result.get('recovery_time', 'माहिती नाही'),
            'scientific_name': analysis_result.get('scientific_name', ''),
            'alternative_diagnoses': analysis_result.get('alternative_diagnoses', []),
            'confidence_explanation': _explain_confidence(analysis_result['confidence'])
        }
        
        # Mobile-friendly display settings
        formatted_response['display_settings'] = {
            'primary_color': _get_status_color(analysis_result['disease_name_english'], analysis_result['confidence']),
            'show_alternatives': len(analysis_result.get('alternative_diagnoses', [])) > 0,
            'highlight_urgency': analysis_result.get('urgency_required', False),
            'show_cost_breakdown': bool(analysis_result.get('cost_breakdown', {}))
        }
        
        return formatted_response
        
    except Exception as e:
        logger.error(f"❌ Response formatting error: {str(e)}")
        return format_error_response(
            'परिणाम दाखवण्यात त्रुटी',
            'Error formatting results',
            500
        )

def format_error_response(error_marathi: str, error_english: str, status_code: int) -> tuple:
    """Format error response in farmer-friendly manner"""
    error_response = {
        'success': False,
        'timestamp': datetime.now().isoformat(),
        'error': {
            'message_marathi': error_marathi,
            'message_english': error_english,
            'status_code': status_code,
            'support_info': {
                'suggestion_marathi': _get_error_suggestion(status_code),
                'contact_help': 'सहाय्यासाठी: 1800-XXX-XXXX'
            }
        },
        'app_info': {
            'name': 'ऊस एकरी १०० टन',
            'company': 'Chordz Technologies'
        }
    }
    
    return error_response, status_code

def _get_status_color(disease_name: str, confidence: float) -> str:
    """Get color code based on disease severity and confidence"""
    if disease_name == 'Healthy':
        return '#4CAF50'  # Green for healthy
    elif disease_name in ['RedRot', 'Sett Rot', 'Grassy shoot']:
        return '#F44336'  # Red for critical diseases
    elif confidence < 60:
        return '#FF9800'  # Orange for low confidence
    else:
        return '#2196F3'  # Blue for moderate diseases

def _get_urgency_level(analysis_result: Dict[str, Any]) -> str:
    """Determine urgency level in Marathi"""
    if analysis_result.get('urgency_required', False):
        return 'तत्काळ'
    elif analysis_result['confidence'] < 60:
        return 'लवकरच'
    else:
        return 'आठवड्यात'

def _get_consultation_guidance(analysis_result: Dict[str, Any]) -> str:
    """Get when to consult expert guidance"""
    disease = analysis_result['disease_name_english']
    confidence = analysis_result['confidence']
    
    if disease in ['RedRot', 'Sett Rot']:
        return 'तत्काळ कृषी तज्ञांशी संपर्क साधा'
    elif confidence < 60:
        return 'निदान निश्चित करण्यासाठी तज्ञांचा सल्ला घ्या'
    elif disease == 'Healthy':
        return 'नियमित तपासणी चालू ठेवा'
    else:
        return 'उपचारानंतर सुधारणा न दिसल्यास तज्ञांशी संपर्क साधा'

def _explain_confidence(confidence: float) -> str:
    """Explain confidence level to farmers"""
    if confidence >= 80:
        return 'AI ला या निदानावर पूर्ण विश्वास आहे'
    elif confidence >= 60:
        return 'AI ला या निदानावर चांगला विश्वास आहे'
    else:
        return 'AI ला संशय आहे, तज्ञांची पुष्टी घ्या'

def _get_error_suggestion(status_code: int) -> str:
    """Get error-specific suggestions in Marathi"""
    suggestions = {
        400: 'कृपया योग्य छायाचित्र निवडा आणि पुन्हा प्रयत्न करा',
        404: 'कृपया मुख्य पेजावर परत जा',
        413: 'छोटे आकाराचे छायाचित्र वापरा',
        500: 'कृपया काही वेळानंतर पुन्हा प्रयत्न करा',
        503: 'प्रणाली लोड होत आहे, थोडा वेळ थांबा'
    }
    return suggestions.get(status_code, 'कृपया पुन्हा प्रयत्न करा')
