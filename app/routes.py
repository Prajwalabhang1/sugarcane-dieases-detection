"""
FIXED ROUTES - Correct JSON structure + Marathi translations
Chordz Technologies - Sugarcane Disease Detection
"""
import logging, os, json, base64, io
from datetime import datetime
from flask import Blueprint, render_template, request, jsonify, current_app
import traceback

logger = logging.getLogger(__name__)
main_bp = Blueprint('main', __name__)

# Hardcoded Marathi translations
MARATHI_NAMES = {
    'Healthy': 'निरोगी',
    'Yellow Leaf': 'पिवळी पाने',
    'RedRot': 'लाल किडणे',
    'Red Rot': 'लाल किडणे',
    'Rust': 'गंज',
    'BrownRust': 'तपकिरी गंज',
    'Brown Rust': 'तपकिरी गंज',
    'Mosaic': 'मोझेक',
    'Grassy shoot': 'गवताळ फांदी',
    'Banded Chlorosis': 'पट्टेदार पांढरा रोग',
    'Brown Spot': 'तपकिरी डाग',
    'Dried Leaves': 'सुकलेली पाने',
    'Pokkah Boeng': 'पोक्का बोएंग',
    'Sett Rot': 'बियाणे किडणे'
}

@main_bp.route('/')
def home():
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Home error: {e}")
        return str(e), 500

@main_bp.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@main_bp.route('/api/all-diseases')
def get_all_diseases():
    try:
        from utils.model_loader import get_model_loader
        ml = get_model_loader(current_app.config)
        if not ml or not ml.classes:
            return jsonify({'success': False}), 503
        diseases = []
        for d in ml.classes:
            info = ml.get_disease_info(d)
            if not info.get('marathi_name') or info['marathi_name'] == d:
                info['marathi_name'] = MARATHI_NAMES.get(d, d)
            diseases.append(info)
        return jsonify({'success': True, 'total': len(diseases), 'diseases': diseases})
    except Exception as e:
        logger.error(f"Get diseases error: {e}")
        return jsonify({'success': False}), 500

@main_bp.route('/api/farmer-support')
def farmer_support():
    return jsonify({'success': True, 'emergency_contacts': {}, 'seasonal_advice': {}, 'cost_estimates': {}})

def get_confidence_level(confidence):
    if confidence >= 0.9: return "उच्च"
    elif confidence >= 0.7: return "मध्यम"
    else: return "कमी"

def get_severity(disease_name):
    severity_map = {
        'Healthy': 'None',
        'RedRot': 'Critical',
        'Red Rot': 'Critical',
        'Grassy shoot': 'Critical',
        'Sett Rot': 'Critical',
        'BrownRust': 'High',
        'Mosaic': 'High',
        'Pokkah Boeng': 'High',
        'Rust': 'High',
        'Banded Chlorosis': 'Medium',
        'Brown Spot': 'Medium',
        'Yellow Leaf': 'Medium',
        'Dried Leaves': 'Medium'
    }
    return severity_map.get(disease_name, "Medium")

@main_bp.route('/api/predict', methods=['POST'])
def predict_disease():
    try:
        logger.info("="*70)
        logger.info("PREDICT")

        img = None

        if request.files:
            for key in request.files:
                img = request.files[key]
                break

        if not img:
            raw = request.get_data()
            logger.info(f"{len(raw)} bytes")

            try:
                d = json.loads(raw.decode('utf-8'))
                if 'image' in d:
                    b64 = d['image'].split('base64,')[1] if 'base64,' in d['image'] else d['image']
                    img = io.BytesIO(base64.b64decode(b64))
            except Exception:
                if raw.startswith(b'--'):
                    try:
                        parts = raw.split(b'\r\n\r\n')
                        if len(parts) >= 2:
                            img_data = parts[1].split(b'\r\n--')[0]
                            img = io.BytesIO(img_data)
                    except Exception:
                        pass
                if not img:
                    img = io.BytesIO(raw)

        if not img:
            return jsonify({'success': False, 'error': 'No image'}), 400

        from utils.model_loader import get_model_loader
        from utils.image_processor import get_image_processor

        ml = get_model_loader(current_app.config)
        ip = get_image_processor(current_app.config)

        if not ml or not ml.model:
            return jsonify({'success': False, 'error': 'Model not loaded'}), 503

        proc = ip.process_image_for_prediction(img)
        if proc is None:
            return jsonify({'success': False, 'error': 'Processing failed'}), 400

        res = ml.predict(proc)
        if not res or not res.get('success'):
            return jsonify({'success': False, 'error': 'Prediction failed'}), 500

        disease_english = res['predicted_class']
        conf = res['confidence']
        inf = ml.get_disease_info(disease_english) or {}

        # Debug logging for disease info
        logger.info(f"[DEBUG] Predicted disease: '{disease_english}'")
        logger.info(f"[DEBUG] Loaded disease info: {json.dumps(inf, ensure_ascii=False, indent=2)}")

        # Get Marathi name with fallback
        marathi_name = MARATHI_NAMES.get(disease_english, disease_english)

        logger.info(f"SUCCESS: {disease_english} ({conf:.1%})")
        logger.info(f"Marathi: {marathi_name}")

        conf_pct = conf * 100

        # Build improved JSON response for frontend
        response = {
            'success': True,
            'diagnosis': {
                'diseasename': marathi_name,
                'diseasenameenglish': disease_english,
                'confidence': round(conf_pct, 1),
                'confidencetext': f"{conf_pct:.1f}%",
                'confidencelevel': get_confidence_level(conf),
                'severity': get_severity(disease_english)
            },
            'farmerinfo': {
                # Card 1: लक्षणे
                'symptoms': {
                    'detailed': inf.get('detailed_symptoms') if inf.get('detailed_symptoms') else ['माहिती उपलब्ध नाही']
                },
                # Card 2: उपचार
                'treatment': {
                    'solution': inf.get('solution', 'उपचार माहिती उपलब्ध नाही'),
                    'organic_solutions': inf.get('organic_solutions', [])
                },
                # Card 3: प्रतिबंध
                'prevention': {
                    'immediate_care': inf.get('immediate_care', [])
                },
                # Card 4: खर्च माहिती
                'costinfo': {
                    'cost_estimate': inf.get('cost_estimate', inf.get('cost', 'संपर्क करा तपशीलांसाठी')),
                    'recovery_time': inf.get('recovery_time', inf.get('expected_recovery_time', 'माहिती उपलब्ध नाही'))
                }
            },
            'actionplan': {
                'nextsteps': {
                    'steps': [
                        'तज्ञाशी सल्लामसलत करा',
                        'शिफारस केलेले उपचार सुरू करा',
                        '3-4 दिवसांनी पुन्हा तपासा'
                    ]
                }
            },
            'timestamp': datetime.now().isoformat()
        }

        # LOG THE COMPLETE RESPONSE
        logger.info("📤 RESPONSE JSON:")
        logger.info(json.dumps(response, indent=2, ensure_ascii=False))

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"ERR: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@main_bp.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    """
    Server-side PDF generation using xhtml2pdf.
    Converts HTML with Marathi content to a proper PDF file.
    """
    try:
        import os
        from xhtml2pdf import pisa
        
        # Handle both JSON and form-encoded data
        data = request.get_json(silent=True)
        if not data:
            form_data = request.form.get('data')
            if form_data:
                data = json.loads(form_data)
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        diagnosis = data.get('diagnosis', {})
        farmerinfo = data.get('farmerinfo', {})
        actionplan = data.get('actionplan', {})
        
        disease_name = diagnosis.get('diseasename', 'अज्ञात')
        disease_english = diagnosis.get('diseasenameenglish', 'Unknown')
        confidence = diagnosis.get('confidence', 0)
        confidence_text = diagnosis.get('confidencetext', f"{confidence}%")
        confidence_level = diagnosis.get('confidencelevel', 'मध्यम')
        severity = diagnosis.get('severity', 'मध्यम')

        # Ensure reports directory exists
        reports_dir = os.path.join(current_app.static_folder, 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        # Font path
        font_path = os.path.join(current_app.static_folder, 'fonts', 'NotoSansDevanagari-Regular.ttf')
        
        # Generate PDF filename
        filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(reports_dir, filename)
        
        # Helper functions
        def is_valid(content):
            return content and content != "Not available" and str(content).strip() != ""
        
        def format_list_items(items):
            if not items or not isinstance(items, list):
                return ""
            valid = [item for item in items if is_valid(item)]
            if not valid:
                return ""
            return "\\n".join([f"<li>{item}</li>" for item in valid])
        
        # Build sections (reuse logic)
        symptoms_html = ""
        if farmerinfo.get('symptoms'):
            symptoms = farmerinfo['symptoms']
            symptoms_html = '<div class="info-section">'
            symptoms_html += '<h3>🔍 रोगाची लक्षणे</h3>'
            if is_valid(symptoms.get('symptoms')):
                symptoms_html += f'<p><strong>मुख्य लक्षणे:</strong> {symptoms["symptoms"]}</p>'
            if symptoms.get('detailed'):
                detailed = format_list_items(symptoms['detailed'])
                if detailed:
                    symptoms_html += f'<p><strong>तपशीलवार लक्षणे:</strong></p><ul>{detailed}</ul>'
            symptoms_html += '</div>'
        
        treatment_html = ""
        if farmerinfo.get('treatment'):
            treatment = farmerinfo['treatment']
            treatment_html = '<div class="info-section">'
            treatment_html += '<h3>💊 उपचार पद्धती</h3>'
            if is_valid(treatment.get('solution')):
                solution = treatment['solution'].replace('\\n', '<br>')
                treatment_html += f'<div class="treatment-box"><strong>मुख्य उपाय:</strong><br>{solution}</div>'
            if treatment.get('organic_solutions'):
                organic = format_list_items(treatment['organic_solutions'])
                if organic:
                    treatment_html += f'<p><strong>सेंद्रिय उपाय:</strong></p><ul>{organic}</ul>'
            treatment_html += '</div>'
        
        prevention_html = ""
        if farmerinfo.get('prevention', {}).get('immediate_care'):
            care = format_list_items(farmerinfo['prevention']['immediate_care'])
            if care:
                prevention_html = '<div class="info-section">'
                prevention_html += '<h3>🛡️ प्रतिबंधक उपाय</h3>'
                prevention_html += f'<ul>{care}</ul>'
                prevention_html += '</div>'
        
        cost_html = ""
        if farmerinfo.get('costinfo'):
            costinfo = farmerinfo['costinfo']
            if is_valid(costinfo.get('cost_estimate')) or is_valid(costinfo.get('recovery_time')):
                cost_html = '<div class="info-section">'
                cost_html += '<h3>💰 अंदाजित खर्च</h3>'
                if is_valid(costinfo.get('cost_estimate')):
                    cost_html += f'<p><strong>खर्चाचा अंदाज:</strong> {costinfo["cost_estimate"]}</p>'
                if is_valid(costinfo.get('recovery_time')):
                    cost_html += f'<p><strong>सुधारण्याचा कालावधी:</strong> {costinfo["recovery_time"]}</p>'
                cost_html += '</div>'
        
        action_html = ""
        if actionplan.get('nextsteps', {}).get('steps'):
            steps = format_list_items(actionplan['nextsteps']['steps'])
            if steps:
                action_html = '<div class="info-section">'
                action_html += '<h3>📋 कृती आराखडा</h3>'
                action_html += f'<ul>{steps}</ul>'
                action_html += '</div>'
        
        # PDF-Specific HTML with Embedded Fonts
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @font-face {{
                    font-family: 'MarathiFont';
                    src: url('{font_path}');
                }}
                
                body {{
                    font-family: 'MarathiFont', sans-serif;
                    padding: 20px;
                    font-size: 12px;
                    color: #333;
                }}
                
                .header {{
                    background-color: #2e7d32;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }}
                
                .header h1 {{ font-size: 24px; margin: 5px 0; }}
                .header h2 {{ font-size: 16px; margin: 5px 0; opacity: 0.9; }}
                .header p {{ margin: 2px 0; }}
                
                .diagnosis-box {{
                    background-color: #e8f5e9;
                    border: 1px solid #4caf50;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }}
                
                .diagnosis-row {{
                    padding: 5px 0;
                    border-bottom: 1px solid #c8e6c9;
                }}
                
                .info-section {{
                    margin-bottom: 15px;
                    padding: 10px;
                    border: 1px solid #e0e0e0;
                }}
                
                h3 {{ color: #1565c0; border-bottom: 1px solid #90caf9; padding-bottom: 5px; }}
                
                .treatment-box {{
                    background-color: #fff3e0;
                    padding: 10px;
                    border: 1px solid #ffe0b2;
                }}
                
                .badge {{
                    background-color: #fff9c4;
                    padding: 2px 8px;
                    border-radius: 4px;
                }}
                
                .footer {{
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    margin-top: 30px;
                    border-top: 1px solid #eee;
                    padding-top: 10px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Sugarcane Disease Report</h1>
                <h2>Chordz Technologies</h2>
                <p>Date: {datetime.now().strftime('%d/%m/%Y')} | Time: {datetime.now().strftime('%I:%M %p')}</p>
            </div>
            
            <div class="diagnosis-box">
                <div class="diagnosis-row"><strong>Disease (Marathi):</strong> {disease_name}</div>
                <div class="diagnosis-row"><strong>Disease (English):</strong> {disease_english}</div>
                <div class="diagnosis-row"><strong>Confidence:</strong> {confidence_text}</div>
                <div class="diagnosis-row"><strong>Severity:</strong> <span class="badge">{severity}</span></div>
            </div>
            
            {symptoms_html}
            {treatment_html}
            {prevention_html}
            {cost_html}
            {action_html}
            
            <div class="footer">
                <p>Powered by Chordz Technologies | Contact: +91 7517311326</p>
                <p>AI-Based Sugarcane Disease Detection System</p>
            </div>
        </body>
        </html>
        """
        
        # Convert HTML to PDF using xhtml2pdf
        with open(filepath, "wb") as pdf_file:
            pisa_status = pisa.CreatePDF(
                html_content, 
                dest=pdf_file,
                encoding='utf-8'
            )
            
        if pisa_status.err:
            raise Exception("PDF Generation Error")
        
        # Return download URL
        download_url = f"/api/download-report/{filename}"
        full_url = request.url_root.rstrip('/') + download_url
        
        logger.info(f"PDF generated: {filename}")
        return jsonify({'success': True, 'url': full_url, 'filename': filename})

    except Exception as e:
        logger.error(f"Report generation error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@main_bp.route('/api/download-report/<path:filename>')
def download_report(filename):
    """
    Serve report with Content-Disposition: attachment to force download
    """
    try:
        from flask import send_from_directory
        reports_dir = os.path.join(current_app.static_folder, 'reports')
        return send_from_directory(reports_dir, filename, as_attachment=True)
    except Exception as e:
        logger.error(f"Download error: {e}")
        return str(e), 404
