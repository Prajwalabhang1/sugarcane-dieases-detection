"""
Image Processor for Sugarcane Disease Detection
MATCHES Streamlit preprocessing: RGB → 128x128 → normalize [0,1] → scale [-1,1]
Based on MobileNetV2 preprocessing requirements
"""
import logging
import numpy as np
from PIL import Image
import io
import traceback

logger = logging.getLogger(__name__)

# Constants
IMG_SIZE = 128


class FarmerFriendlyImageProcessor:
    """Image processor matching your Streamlit preprocessing pipeline"""

    def __init__(self, config):
        self.config = config
        self.target_size = (IMG_SIZE, IMG_SIZE)
        self.channels = 3

    def process_image_for_prediction(self, image_file):
        """
        Complete preprocessing pipeline matching Streamlit logic:
        1. Load & convert to RGB
        2. Resize to 128x128 (LANCZOS)
        3. Convert to float32 array
        4. Normalize to [0, 1]
        5. Scale to [-1, 1] (MobileNetV2 requirement)
        6. Add batch dimension
        """
        try:
            logger.info("Processing image...")

            # Step 1: Load and validate
            image = self._load_and_convert_rgb(image_file)
            if image is None:
                return None

            # Step 2: Resize with LANCZOS resampling
            resized = self._resize_image(image)

            # Step 3: Convert to NumPy array (float32)
            img_array = np.array(resized, dtype=np.float32)
            logger.info(f"Array shape: {img_array.shape}, dtype: {img_array.dtype}")

            # Step 4: First normalization [0, 255] → [0, 1]
            img_array = img_array / 255.0
            logger.info(f"After /255: [{np.min(img_array):.3f}, {np.max(img_array):.3f}]")

            # Step 5: Second normalization [0, 1] → [-1, 1] (MobileNetV2)
            img_array = (img_array - 0.5) * 2.0
            logger.info(f"After MobileNetV2 scaling: [{np.min(img_array):.3f}, {np.max(img_array):.3f}]")

            # Step 6: Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            logger.info(f"Final shape: {img_array.shape}")

            # Validation
            expected_shape = (1, IMG_SIZE, IMG_SIZE, 3)
            if img_array.shape != expected_shape:
                raise ValueError(f"Shape mismatch: expected {expected_shape}, got {img_array.shape}")

            # Check for NaN or infinity
            if np.isnan(img_array).any():
                raise ValueError("Image contains NaN values")
            if not np.isfinite(img_array).all():
                raise ValueError("Image contains infinite values")

            logger.info("✅ Image processed successfully")
            return img_array

        except Exception as e:
            logger.error(f"Image processing error: {str(e)}")
            traceback.print_exc()
            return None

    def _load_and_convert_rgb(self, image_file):
        """Load image and convert to RGB (Step 1)"""
        try:
            # Handle different input types
            if hasattr(image_file, 'read'):
                image_data = image_file.read()
                image_file.seek(0)
                image = Image.open(io.BytesIO(image_data))
            else:
                image = Image.open(image_file)

            # Force RGB conversion
            if image.mode != 'RGB':
                logger.info(f"Converting {image.mode} → RGB")
                image = image.convert('RGB')

            logger.info(f"✅ Loaded: {image.size}, mode: {image.mode}")
            return image

        except Exception as e:
            logger.error(f"Image load error: {str(e)}")
            return None

    def _resize_image(self, image: Image.Image):
        """Resize to 128x128 with LANCZOS resampling (Step 2)"""
        try:
            original_size = image.size
            # LANCZOS resampling preserves edge features for disease detection
            resized = image.resize(self.target_size, Image.Resampling.LANCZOS)
            logger.info(f"✅ Resized: {original_size} → {resized.size}")
            return resized
        except Exception as e:
            logger.error(f"Resize error: {str(e)}")
            # Fallback to default resize
            return image.resize(self.target_size)


# Global instance
_image_processor = None


def get_image_processor(config=None):
    """Get global image processor instance"""
    global _image_processor
    if _image_processor is None and config:
        _image_processor = FarmerFriendlyImageProcessor(config)
    return _image_processor


def initialize_image_processor(config=None):
    """Initialize image processor"""
    if config is None:
        try:
            from flask import current_app
            config = current_app.config
        except:
            logger.warning("Could not get Flask config")
            return False

    processor = get_image_processor(config)
    if processor:
        logger.info("✅ Image processor initialized (MobileNetV2 preprocessing)")
        return True
    return False
