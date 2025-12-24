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
    Server-side PDF generation using WeasyPrint.
    Produces high-quality PDFs with full CSS support and Marathi fonts.
    """
    try:
        import os
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
        
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
        
        # Extract Data
        disease_name = diagnosis.get('diseasename', 'अज्ञात')
        disease_english = diagnosis.get('diseasenameenglish', 'Unknown')
        confidence = diagnosis.get('confidence', 0)
        confidence_text = diagnosis.get('confidencetext', f"{confidence}%")
        confidence_level = diagnosis.get('confidencelevel', 'मध्यम')
        severity = diagnosis.get('severity', 'मध्यम')

        # Paths
        reports_dir = os.path.join(current_app.static_folder, 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        font_path = os.path.join(current_app.static_folder, 'fonts', 'NotoSansDevanagari-Regular.ttf')
        # WeasyPrint needs file:// URL for local fonts
        font_url = f"file://{font_path}"
        
        filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(reports_dir, filename)
        
        # Helper: Clean list items
        def format_list(items):
            if not items or not isinstance(items, list): return ""
            return "".join([f"<li>{item}</li>" for item in items if item and item != "Not available"])

        # Content Generation
        symptoms_content = ""
        if farmerinfo.get('symptoms'):
            s = farmerinfo['symptoms']
            symptoms_content = f"""
            <div class="section">
                <h3>🔍 रोगाची लक्षणे (Symptoms)</h3>
                <div class="card">
                    <p><strong>सार:</strong> {s.get('symptoms', 'N/A')}</p>
                    { f'<div class="detailed-list"><strong>तपशील:</strong><ul>{format_list(s.get("detailed", []))}</ul></div>' if s.get("detailed") else '' }
                </div>
            </div>
            """
            
        treatment_content = ""
        if farmerinfo.get('treatment'):
            t = farmerinfo['treatment']
            treatment_content = f"""
            <div class="section">
                <h3>💊 उपचार पद्धती (Treatment)</h3>
                <div class="card treatment-card">
                    <div class="highlight-box">
                        <strong>मुख्य उपाय:</strong><br/>
                        {t.get('solution', 'N/A').replace(chr(10), '<br/>')}
                    </div>
                     { f'<div class="organic-section"><strong>🌿 सेंद्रिय उपाय:</strong><ul>{format_list(t.get("organic_solutions", []))}</ul></div>' if t.get("organic_solutions") else '' }
                </div>
            </div>
            """

        prevention_content = ""
        if farmerinfo.get('prevention', {}).get('immediate_care'):
            prevention_content = f"""
            <div class="section">
                <h3>🛡️ प्रतिबंधक उपाय (Prevention)</h3>
                <div class="card">
                    <ul>{format_list(farmerinfo['prevention']['immediate_care'])}</ul>
                </div>
            </div>
            """

        action_content = ""
        if actionplan.get('nextsteps', {}).get('steps'):
             action_content = f"""
            <div class="section">
                <h3>📋 कृती आराखडा (Action Plan)</h3>
                <div class="card action-card">
                    <ul>{format_list(actionplan['nextsteps']['steps'])}</ul>
                </div>
            </div>
            """
            
        # HTML Template with Modern CSS for WeasyPrint
        html_string = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @font-face {{
                    font-family: 'Noto Sans Devanagari';
                    src: url('{font_url}');
                }}
                @page {{
                    size: A4;
                    margin: 2cm;
                    @bottom-center {{
                        content: "Page " counter(page) " of " counter(pages);
                        font-family: 'Noto Sans Devanagari', sans-serif;
                        font-size: 9pt;
                    }}
                }}
                body {{
                    font-family: 'Noto Sans Devanagari', sans-serif;
                    color: #333;
                    line-height: 1.5;
                    font-size: 11pt;
                }}
                .header {{
                    text-align: center;
                    border-bottom: 3px solid #4CAF50;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                .header h1 {{ color: #2E7D32; margin: 0; font-size: 24pt; }}
                .header p {{ color: #666; margin: 5px 0 0 0; }}
                
                .meta-grid {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 30px;
                    background: #f1f8e9;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #c5e1a5;
                }}
                .meta-item {{ padding: 5px; }}
                .label {{ font-weight: bold; color: #558b2f; display: block; font-size: 0.9em; }}
                .value {{ font-size: 1.1em; font-weight: 600; }}
                
                h3 {{
                    color: #1565C0;
                    border-bottom: 2px solid #BBDEFB;
                    padding-bottom: 5px;
                    margin-top: 25px;
                }}
                
                .card {{
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    border-radius: 5px;
                    padding: 15px;
                    page-break-inside: avoid;
                }}
                
                .treatment-card {{ border-left: 4px solid #FF9800; background: #fff3e0; border-color: #ffe0b2; }}
                .highlight-box {{ margin-bottom: 15px; }}
                .organic-section {{ border-top: 1px dashed #ffa726; padding-top: 10px; }}
                
                .action-card {{ background: #e3f2fd; border: 1px solid #90caf9; }}
                
                ul {{ padding-left: 20px; margin: 5px 0; }}
                li {{ margin-bottom: 6px; }}
                
                .footer {{
                    margin-top: 40px;
                    text-align: center;
                    font-size: 9pt;
                    color: #777;
                    border-top: 1px solid #eee;
                    padding-top: 15px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Sugarcane Disease Report</h1>
                <p>Chordz Technologies | AI Diagnosis</p>
                <p style="font-size: 0.9rem; margin-top: 5px;">Generated on: {datetime.now().strftime('%d %B %Y, %I:%M %p')}</p>
            </div>
            
            <div class="meta-grid">
                <div class="meta-item">
                    <span class="label">Disease (Marathi)</span>
                    <span class="value">{disease_name}</span>
                </div>
                <div class="meta-item">
                    <span class="label">Disease (English)</span>
                    <span class="value">{disease_english}</span>
                </div>
                <div class="meta-item">
                    <span class="label">Confidence Score</span>
                    <span class="value">{confidence_text}</span>
                </div>
                <div class="meta-item">
                    <span class="label">Severity Level</span>
                    <span class="value" style="color: {'#d32f2f' if severity == 'High' else '#f57c00' if severity == 'Medium' else '#388e3c'}">{severity}</span>
                </div>
            </div>
            
            {symptoms_content}
            {treatment_content}
            {prevention_content}
            {action_content}
            
            <div class="footer">
                <p>For expert consultation, call: <strong>+91 7517311326</strong> | Email: chordzconnect@gmail.com</p>
                <p>&copy; {datetime.now().year} Chordz Technologies. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        # Generate PDF
        HTML(string=html_string).write_pdf(filepath)
        
        # Return download URL
        download_url = f"/api/download-report/{filename}"
        full_url = request.url_root.rstrip('/') + download_url
        
        return jsonify({'success': True, 'url': full_url, 'filename': filename})

    except Exception as e:
        logger.error(f"WeasyPrint PDF error: {e}")
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
