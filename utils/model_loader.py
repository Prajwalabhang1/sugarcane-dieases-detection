"""
AI Model Loader - FIXED WITH FALLBACK PATHS
Works even if config.py is missing attributes
"""
import os
import json
import logging
import tensorflow as tf
import numpy as np
from pathlib import Path
from typing import Tuple, Optional, Dict, Any

logger = logging.getLogger(__name__)


class SugarcaneModelLoader:
    """Model loader with FALLBACK PATH SUPPORT"""

    def __init__(self, config):
        """Initialize with fallback paths"""
        self.config = config
        self.model = None
        self.classes = []
        self.disease_solutions = {}
        self.class_mapping = {}
        self.model_metadata = {}

        # Get BASE_DIR with fallback
        self.base_dir = self._get_base_dir()

    def _get_base_dir(self):
        """Get base directory with fallback"""
        if hasattr(self.config, 'BASE_DIR'):
            return Path(self.config.BASE_DIR)
        # Fallback: get from __file__
        return Path(__file__).parent.parent

    def _get_path(self, attr_name, default_subpath):
        """Get path with fallback"""
        # Try to get from config
        if hasattr(self.config, attr_name):
            path = getattr(self.config, attr_name)
            if isinstance(path, str):
                return Path(path)
            return path

        # Fallback to constructed path
        fallback = self.base_dir / default_subpath
        logger.warning(f"Using fallback path for {attr_name}: {fallback}")
        return fallback

    def load_all_components(self) -> bool:
        """Load model with fallback path support"""
        try:
            logger.info("Starting: Loading disease detection system...")

            if not self._load_disease_data():
                return False

            if not self._load_model_with_fallbacks():
                return False

            if not self._validate_components():
                return False

            logger.info(f"Success: {len(self.classes)} disease types loaded!")
            return True

        except Exception as e:
            logger.error(f"Loading error: {str(e)}")
            return False

    def _load_disease_data(self) -> bool:
        """Load disease data with FALLBACK PATHS"""
        try:
            logger.info("Loading disease classification data...")

            # Get class_mapping.json path with fallback
            class_mapping_path = self._get_path(
                'CLASS_MAPPING_PATH',
                'models/class_mapping.json'
            )

            if not os.path.exists(class_mapping_path):
                logger.error(f"File not found: {class_mapping_path}")
                return False

            with open(class_mapping_path, 'r', encoding='utf-8') as f:
                self.class_mapping = json.load(f)

            self.classes = self.class_mapping.get('classes', [])
            if not self.classes:
                logger.error("Classes list is empty")
                return False

            logger.info(f"Loaded {len(self.classes)} disease types")

            # Load disease solutions with fallback
            solutions_path = self._get_path(
                'DISEASE_SOLUTIONS_PATH',
                'models/disease_solutions.json'
            )

            if os.path.exists(solutions_path):
                with open(solutions_path, 'r', encoding='utf-8') as f:
                    self.disease_solutions = json.load(f)
                logger.info(f"Loaded {len(self.disease_solutions)} disease solutions")
            else:
                logger.warning(f"Solutions file not found: {solutions_path}")
                self.disease_solutions = {}

            return True

        except Exception as e:
            logger.error(f"Data loading error: {str(e)}")
            return False

    def _load_model_with_fallbacks(self) -> bool:
        """Load model with FALLBACK PATH"""
        try:
            logger.info("Loading AI model...")

            # Get model path with fallback
            model_path = self._get_path(
                'MODEL_PATH',
                'models/Final_Model.keras'
            )

            if not os.path.exists(model_path):
                logger.error(f"Model file not found: {model_path}")
                return False

            os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

            # Try loading
            try:
                self.model = tf.keras.models.load_model(model_path)
                logger.info("Model loaded successfully!")
                return True
            except Exception as e1:
                logger.warning(f"Primary loading failed: {e1}")

                try:
                    self.model = self._create_model_architecture()
                    self.model.load_weights(model_path)
                    logger.info("Model loaded via architecture + weights!")
                    return True
                except Exception as e2:
                    logger.warning(f"Architecture method failed: {e2}")

                    try:
                        self.model = tf.keras.models.load_model(model_path, compile=False)
                        self.model.compile(
                            optimizer='adam',
                            loss='categorical_crossentropy',
                            metrics=['accuracy']
                        )
                        logger.info("Model loaded via recompile!")
                        return True
                    except Exception as e3:
                        logger.error(f"All loading methods failed")
                        return False

        except Exception as e:
            logger.error(f"Model loading error: {str(e)}")
            return False

    def _create_model_architecture(self):
        """Create model architecture"""
        try:
            input_shape = (128, 128, 3)
            base_model = tf.keras.applications.MobileNetV2(
                input_shape=input_shape,
                include_top=False,
                weights='imagenet'
            )
            base_model.trainable = False

            model = tf.keras.Sequential([
                base_model,
                tf.keras.layers.GlobalAveragePooling2D(),
                tf.keras.layers.Dropout(0.2),
                tf.keras.layers.Dense(len(self.classes), activation='softmax')
            ])

            model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )

            return model
        except Exception as e:
            logger.error(f"Architecture error: {str(e)}")
            return None

    def _validate_components(self) -> bool:
        """Validate components"""
        if self.model is None:
            logger.error("Model not loaded")
            return False
        if not self.classes:
            logger.error("Classes not loaded")
            return False
        return True

    def predict(self, processed_image: np.ndarray) -> Optional[Dict[str, Any]]:
        """Make prediction"""
        if self.model is None:
            return None

        try:
            expected_shape = (1, 128, 128, 3)
            if processed_image.shape != expected_shape:
                logger.error(f"Invalid shape: {processed_image.shape}")
                return None

            predictions = self.model.predict(processed_image, verbose=0)[0]
            predicted_idx = np.argmax(predictions)
            confidence = float(predictions[predicted_idx])
            predicted_class = self.classes[predicted_idx]

            return {
                'success': True,
                'predicted_class': predicted_class,
                'confidence': confidence,
                'all_predictions': predictions.tolist(),
                'class_probabilities': {
                    self.classes[i]: float(predictions[i])
                    for i in range(len(self.classes))
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_disease_info(self, disease_name: str) -> Dict[str, Any]:
        """Get complete disease information"""
        disease_info = self.disease_solutions.get(disease_name, {}).copy()
        marathi_name = self.class_mapping.get('marathi_names', {}).get(disease_name, disease_name)
        disease_info['disease_name'] = disease_name
        disease_info['marathi_name'] = marathi_name
        return disease_info


# Global instance
_model_loader = None

def get_model_loader(config=None):
    """Get model loader instance"""
    global _model_loader
    if _model_loader is None and config:
        _model_loader = SugarcaneModelLoader(config)
    return _model_loader

def initialize_model_and_data(config=None):
    """Initialize model and data"""
    if config is None:
        try:
            from flask import current_app
            config = current_app.config
        except:
            return False

    loader = get_model_loader(config)
    if loader:
        return loader.load_all_components()
    return False
