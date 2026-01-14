#!/bin/bash

# Docker Hub deployment script for time-tracker
# Reads credentials from .env file

set -e  # Exit on error

# Load environment variables from .env
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with DOCKERHUB_USERNAME and DOCKERHUB_TOKEN"
    exit 1
fi

# Source the .env file
export $(grep -v '^#' .env | grep -E 'DOCKERHUB_' | xargs)

# Validate credentials
if [ -z "$DOCKERHUB_USERNAME" ] || [ "$DOCKERHUB_USERNAME" = "your-dockerhub-username" ]; then
    echo "❌ Error: DOCKERHUB_USERNAME not set in .env"
    exit 1
fi

if [ -z "$DOCKERHUB_TOKEN" ] || [ "$DOCKERHUB_TOKEN" = "your-dockerhub-token-here" ]; then
    echo "❌ Error: DOCKERHUB_TOKEN not set in .env"
    echo ""
    echo "To create a token:"
    echo "1. Go to https://hub.docker.com/settings/security"
    echo "2. Click 'New Access Token'"
    echo "3. Copy token and add to .env file"
    exit 1
fi

# Configuration
IMAGE_NAME="time-tracker"
TAG="${1:-latest}"  # Use first argument as tag, default to 'latest'
FULL_IMAGE="${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "🐳 Building Docker image..."
echo "   Image: ${FULL_IMAGE}"
echo "   Using: Dockerfile.prod"
docker build -f Dockerfile.prod -t ${FULL_IMAGE} .

echo ""
echo "🔐 Logging in to Docker Hub..."
echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin

echo ""
echo "⬆️  Pushing to Docker Hub..."
docker push ${FULL_IMAGE}

echo ""
echo "✅ Success! Image pushed to Docker Hub"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Image URL: ${FULL_IMAGE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps for Render deployment:"
echo "  1. Go to Render Dashboard → Web Service → Settings"
echo "  2. Update Image URL to: ${FULL_IMAGE}"
echo "  3. Click 'Manual Deploy' to pull new image"
echo ""
echo "Or create new service:"
echo "  1. New Web Service → Deploy an existing image"
echo "  2. Image URL: ${FULL_IMAGE}"
echo "  3. Configure environment variables (see DEPLOYMENT.md)"
echo ""
