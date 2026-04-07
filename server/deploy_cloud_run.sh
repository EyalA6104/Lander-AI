#!/bin/bash
# Deployment script for Lander-AI FastAPI backend to Google Cloud Run

# Using the new, clean Project ID
PROJECT_ID="lander-ai-prod" 

echo "Deploying lander-ai-api to project $PROJECT_ID in Google Cloud Run..."

gcloud run deploy lander-ai-api \
  --source . \
  --region me-central1 \
  --platform managed \
  --allow-unauthenticated \
  --project "$PROJECT_ID"

echo "Deployment finished!"