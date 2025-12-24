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
    Accepts JSON with disease report data and returns a downloadable PDF.
    """
    try:
        from flask import make_response
        from io import BytesIO
        
        # Handle both JSON and form-encoded data
        data = request.get_json(silent=True)
        if not data:
            # Try to get from form data
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
        severity = diagnosis.get('severity', 'मध्यम')
        
        # Create a simple text-based PDF using reportlab if available
        # Otherwise fall back to HTML that can be rendered
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30, bottomMargin=30)
            elements = []
            styles = getSampleStyleSheet()
            
            # Title
            title_style = ParagraphStyle(
                'Title',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=20,
                alignment=1  # Center
            )
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
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(table)
            elements.append(Spacer(1, 20))
            
            # Symptoms
            symptoms = farmerinfo.get('symptoms', {})
            if symptoms.get('detailed'):
                elements.append(Paragraph("Symptoms:", styles['Heading2']))
                for symptom in symptoms['detailed']:
                    elements.append(Paragraph(f"• {symptom}", styles['Normal']))
                elements.append(Spacer(1, 15))
            
            # Treatment
            treatment = farmerinfo.get('treatment', {})
            if treatment.get('solution'):
                elements.append(Paragraph("Treatment:", styles['Heading2']))
                elements.append(Paragraph(treatment['solution'], styles['Normal']))
                elements.append(Spacer(1, 15))
            
            # Prevention
            prevention = farmerinfo.get('prevention', {})
            if prevention.get('immediate_care'):
                elements.append(Paragraph("Prevention:", styles['Heading2']))
                for care in prevention['immediate_care']:
                    elements.append(Paragraph(f"• {care}", styles['Normal']))
                elements.append(Spacer(1, 15))
            
            # Cost Info
            costinfo = farmerinfo.get('costinfo', {})
            if costinfo.get('cost_estimate') or costinfo.get('recovery_time'):
                elements.append(Paragraph("Cost Information:", styles['Heading2']))
                if costinfo.get('cost_estimate'):
                    elements.append(Paragraph(f"Estimated Cost: {costinfo['cost_estimate']}", styles['Normal']))
                if costinfo.get('recovery_time'):
                    elements.append(Paragraph(f"Recovery Time: {costinfo['recovery_time']}", styles['Normal']))
                elements.append(Spacer(1, 15))
            
            # Footer
            elements.append(Spacer(1, 30))
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.grey,
                alignment=1
            )
            elements.append(Paragraph("Powered by Chordz Technologies", footer_style))
            elements.append(Paragraph("Contact: chordzconnect@gmail.com | +91 7517311326", footer_style))
            
            doc.build(elements)
            
            pdf_data = buffer.getvalue()
            buffer.close()
            
        except ImportError:
            # Fallback: Create a simple text-based response if reportlab is not available
            logger.warning("reportlab not available, using HTML fallback")
            
            # Generate HTML content that can be printed as PDF
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Disease Report - {disease_english}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 40px; }}
                    h1 {{ color: #2e7d32; text-align: center; }}
                    .section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }}
                    .section h2 {{ color: #1976d2; margin-top: 0; }}
                    table {{ width: 100%; border-collapse: collapse; }}
                    th, td {{ padding: 10px; border: 1px solid #ddd; text-align: left; }}
                    th {{ background: #4caf50; color: white; }}
                    .footer {{ text-align: center; color: #666; margin-top: 40px; font-size: 12px; }}
                </style>
            </head>
            <body>
                <h1>🌾 Sugarcane Disease Detection Report</h1>
                
                <div class="section">
                    <h2>Diagnosis</h2>
                    <table>
                        <tr><th>Disease (Marathi)</th><td>{disease_name}</td></tr>
                        <tr><th>Disease (English)</th><td>{disease_english}</td></tr>
                        <tr><th>Confidence</th><td>{confidence}%</td></tr>
                        <tr><th>Severity</th><td>{severity}</td></tr>
                        <tr><th>Date</th><td>{datetime.now().strftime('%Y-%m-%d %H:%M')}</td></tr>
                    </table>
                </div>
                
                <div class="footer">
                    <p>Powered by Chordz Technologies</p>
                    <p>Contact: chordzconnect@gmail.com | +91 7517311326</p>
                </div>
            </body>
            </html>
            """
            
            # Return HTML as attachment
            response = make_response(html_content)
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
            response.headers['Content-Disposition'] = f'attachment; filename="Disease_Report_{disease_english}_{datetime.now().strftime("%Y%m%d")}.html"'
            return response
        
        # Save PDF to static/reports folder
        import os
        
        # Ensure reports directory exists
        reports_dir = os.path.join(current_app.static_folder, 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        # Clean up old reports (optional) - remove files older than 1 hour
        try:
            import time
            current_time = time.time()
            for f in os.listdir(reports_dir):
                f_path = os.path.join(reports_dir, f)
                if os.path.isfile(f_path) and (current_time - os.path.getmtime(f_path) > 3600):
                    os.remove(f_path)
        except Exception:
            pass

        filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(reports_dir, filename)
        
        doc.build(elements)
        
        # Save buffer to file
        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())
            
        buffer.close()
        
        # Return public URL
        # For WebView 'breakout' strategy
        public_url = f"/static/reports/{filename}"
        full_url = request.url_root.rstrip('/') + public_url
        
        logger.info(f"PDF generated at: {filepath}")
        return jsonify({'success': True, 'url': full_url, 'filename': filename})
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
