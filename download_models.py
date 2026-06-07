import os
import logging
from transformers import pipeline, AutoImageProcessor, ConvNextForImageClassification

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DownloadModels")

# Set cache directory path (frozen directly inside the container build context)
cache_dir = os.path.abspath("assets/models")
os.makedirs(cache_dir, exist_ok=True)

logger.info(f"Targeting local pre-cache directory: {cache_dir}")

# 1. Pre-cache DeBERTa-v3-NLI Model
try:
    logger.info("Pre-caching: cross-encoder/nli-deberta-v3-large")
    pipeline(
        "text-classification",
        model="cross-encoder/nli-deberta-v3-large",
        cache_dir=cache_dir
    )
except Exception as e:
    logger.error(f"Failed to cache DeBERTa NLI: {e}")

# 2. Pre-cache Whisper-Tiny Model
try:
    logger.info("Pre-caching: openai/whisper-tiny")
    pipeline(
        "automatic-speech-recognition",
        model="openai/whisper-tiny",
        cache_dir=cache_dir
    )
except Exception as e:
    logger.error(f"Failed to cache Whisper: {e}")

# 3. Pre-cache ConvNeXt-Tiny Model
try:
    logger.info("Pre-caching: facebook/convnext-tiny-224")
    AutoImageProcessor.from_pretrained("facebook/convnext-tiny-224", cache_dir=cache_dir)
    ConvNextForImageClassification.from_pretrained("facebook/convnext-tiny-224", cache_dir=cache_dir)
except Exception as e:
    logger.error(f"Failed to cache ConvNeXt: {e}")

logger.info("Pre-caching process completed.")
