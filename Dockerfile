# Use an official lightweight Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables for production execution and cache paths
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/app/assets/models \
    TRANSFORMERS_CACHE=/app/assets/models \
    HF_HUB_DISABLE_SYMLINKS_WARNING=1 \
    HF_HUB_OFFLINE=1

# Set the working directory
WORKDIR /app

# Install system dependencies needed for FFmpeg, OpenCV, and git
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only version first to keep the image size small
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    transformers \
    python-multipart \
    numpy \
    pillow \
    soundfile \
    scipy \
    sentencepiece

# Copy download_models.py and run it during build to pre-cache model weights
COPY download_models.py /app/download_models.py
# Enable internet during build time so HF Hub can be queried
ENV HF_HUB_OFFLINE=0
RUN python /app/download_models.py
# Re-enable offline mode for run time to prevent any remote hub connections
ENV HF_HUB_OFFLINE=1

# Copy the application code
COPY app.py /app/app.py

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
