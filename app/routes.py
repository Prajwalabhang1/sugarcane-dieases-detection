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
    Server-side PDF generation for WebView compatibility.
    Accepts JSON with disease report data and returns a downloadable PDF URL.
    """
    try:
        from flask import make_response
        from io import BytesIO
        import os
        
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
        
        disease_name = diagnosis.get('diseasename', 'अज्ञात')
        disease_english = diagnosis.get('diseasenameenglish', 'Unknown')
        confidence = diagnosis.get('confidence', 0)
        severity = diagnosis.get('severity', 'मध्यम')

        # Ensure reports directory exists
        reports_dir = os.path.join(current_app.static_folder, 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        # Generate filename
        filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(reports_dir, filename)
        
        # Try generating PDF
        pdf_generated = False
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            
            # Create PDF directly to file
            doc = SimpleDocTemplate(filepath, pagesize=A4, topMargin=30, bottomMargin=30)
            elements = []
            styles = getSampleStyleSheet()
            
            # Title
            title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, spaceAfter=20, alignment=1)
            elements.append(Paragraph("Sugarcane Disease Detection Report", title_style))
            elements.append(Spacer(1, 20))
            
            # Disease Info Table
            table_data = [
                ['Disease (Marathi)', disease_name],
                ['Disease (English)', disease_english],
                ['Confidence', f"{confidence}%"],
                ['Severity', severity],
                ['Date', datetime.now().strftime('%Y-%m-%d %H:%M')]
            ]
            
            table = Table(table_data, colWidths=[150, 300])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgreen),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('PADDING', (0, 0), (-1, -1), 10),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 20))
            
            # Dynamic content...
            if farmerinfo.get('symptoms', {}).get('detailed'):
                elements.append(Paragraph("Symptoms:", styles['Heading2']))
                for s in farmerinfo['symptoms']['detailed']:
                    elements.append(Paragraph(f"• {s}", styles['Normal']))
                elements.append(Spacer(1, 10))

            if farmerinfo.get('treatment', {}).get('solution'):
                elements.append(Paragraph("Treatment:", styles['Heading2']))
                elements.append(Paragraph(farmerinfo['treatment']['solution'], styles['Normal']))
                elements.append(Spacer(1, 10))
                
            # Footer
            elements.append(Spacer(1, 30))
            elements.append(Paragraph("Powered by Chordz Technologies | +91 7517311326", styles['Normal']))
            
            doc.build(elements)
            pdf_generated = True
            
        except ImportError:
            logger.warning("reportlab not found, falling back to HTML")
        except Exception as e:
            logger.error(f"ReportLab error: {e}")
            
        # Fallback to HTML if PDF failed
        if not pdf_generated:
            # Change extension to .html
            filename = filename.replace('.pdf', '.html')
            filepath = os.path.join(reports_dir, filename)
            
            html_content = f"""
            <html><body>
                <h1>Report: {disease_name}</h1>
                <p>Confidence: {confidence}%</p>
                <p>Date: {datetime.now()}</p>
                <hr>
                <p>{farmerinfo.get('treatment', {}).get('solution', '')}</p>
            </body></html>
            """
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(html_content)

        # Return public URL
        public_url = f"/static/reports/{filename}"
        full_url = request.url_root.rstrip('/') + public_url
        
        return jsonify({'success': True, 'url': full_url, 'filename': filename})

    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
