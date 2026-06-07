#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration variables
PROJECT_ID=${GCP_PROJECT_ID:-"truthguard-cloud-production"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="truthguard-backend"
REPOSITORY="truthguard-registry"
IMAGE_TAG="latest"

echo "========================================================================"
echo "TRUTHGUARD CLOUD DEPLOYMENT SPECIFICATION - GOOGLE CLOUD RUN"
echo "========================================================================"
echo "Project ID:  $PROJECT_ID"
echo "Region:      $REGION"
echo "Service:     $SERVICE_NAME"
echo "========================================================================"

# Step 1: Ensure Google Cloud SDK commands are authenticated
echo "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "Error: No active gcloud account found. Please run 'gcloud auth login' first."
    exit 1
fi

# Step 2: Configure Docker registry authentication for Artifact Registry
echo "Enabling Google Artifact Registry API..."
gcloud services enable artifactregistry.googleapis.com run.googleapis.com --project="$PROJECT_ID"

echo "Creating Artifact Registry repository if it does not exist..."
gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format=docker \
    --location="$REGION" \
    --description="TruthGuard production container repository" \
    --project="$PROJECT_ID" || true

REGISTRY_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$SERVICE_NAME:$IMAGE_TAG"

# Step 3: Build and tag the optimized Docker container
echo "Building optimized model-baked Docker image..."
echo "This step downloads all weights (DeBERTa-v3, Whisper, ConvNeXt) and bakes them inside the image."
docker build -t "$REGISTRY_URL" .

# Step 4: Configure docker auth helper for gcloud
echo "Authenticating Docker configuration against GCR..."
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# Step 5: Push image to Google Artifact Registry
echo "Pushing model-baked image to Google Artifact Registry..."
docker push "$REGISTRY_URL"

# Step 6: Deploy to Google Cloud Run
echo "Deploying container to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image="$REGISTRY_URL" \
    --platform=managed \
    --region="$REGION" \
    --allow-unauthenticated \
    --min-instances=0 \
    --max-instances=3 \
    --memory=4Gi \
    --cpu=2 \
    --project="$PROJECT_ID"

echo "========================================================================"
echo "DEPLOYMENT COMPLETE!"
echo "Service URL is printed in the Cloud Run status above."
echo "Update your .env.production EXPO_PUBLIC_TRUTHGUARD_API_URL value with this URL."
echo "========================================================================"
