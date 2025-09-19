#!/bin/bash

# Camera Streaming Platform Kubernetes Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="camera-streaming"
DOCKER_REGISTRY="your-registry.com"
IMAGE_TAG="${1:-latest}"
ENVIRONMENT="${2:-production}"

echo -e "${BLUE}🚀 Deploying Camera Streaming Platform to Kubernetes${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Image Tag: ${IMAGE_TAG}${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo -e "${YELLOW}📋 Checking required tools...${NC}"
for tool in kubectl kustomize docker; do
    if ! command_exists $tool; then
        echo -e "${RED}❌ $tool is not installed${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required tools are available${NC}"

# Check Kubernetes connection
echo -e "${YELLOW}🔗 Checking Kubernetes connection...${NC}"
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connected to Kubernetes cluster${NC}"

# Build and push Docker image
echo -e "${YELLOW}🐳 Building and pushing Docker image...${NC}"
cd ..
docker build -t ${DOCKER_REGISTRY}/camera-streaming-backend:${IMAGE_TAG} .
docker push ${DOCKER_REGISTRY}/camera-streaming-backend:${IMAGE_TAG}
echo -e "${GREEN}✅ Docker image built and pushed${NC}"

cd k8s

# Update image tag in kustomization
echo -e "${YELLOW}📝 Updating image tag in kustomization...${NC}"
sed -i.bak "s/newTag: .*/newTag: ${IMAGE_TAG}/" kustomization.yaml
echo -e "${GREEN}✅ Image tag updated${NC}"

# Create namespace if it doesn't exist
echo -e "${YELLOW}📦 Creating namespace...${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✅ Namespace ready${NC}"

# Apply secrets (you should customize these)
echo -e "${YELLOW}🔐 Applying secrets...${NC}"
echo -e "${YELLOW}⚠️  Make sure to update secrets with actual values before production deployment${NC}"
kubectl apply -f secrets.yaml
echo -e "${GREEN}✅ Secrets applied${NC}"

# Deploy PostgreSQL
echo -e "${YELLOW}🐘 Deploying PostgreSQL...${NC}"
kubectl apply -f postgres.yaml
echo -e "${GREEN}✅ PostgreSQL deployed${NC}"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Deploy Redis
echo -e "${YELLOW}🔴 Deploying Redis...${NC}"
kubectl apply -f redis.yaml
echo -e "${GREEN}✅ Redis deployed${NC}"

# Wait for Redis to be ready
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=300s
echo -e "${GREEN}✅ Redis is ready${NC}"

# Deploy NGINX RTMP
echo -e "${YELLOW}📺 Deploying NGINX RTMP...${NC}"
kubectl apply -f nginx-rtmp.yaml
echo -e "${GREEN}✅ NGINX RTMP deployed${NC}"

# Deploy backend application
echo -e "${YELLOW}🚀 Deploying backend application...${NC}"
kustomize build . | kubectl apply -f -
echo -e "${GREEN}✅ Backend application deployed${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=camera-streaming-backend -n ${NAMESPACE} --timeout=600s
echo -e "${GREEN}✅ Backend is ready${NC}"

# Deploy ingress
echo -e "${YELLOW}🌐 Deploying ingress...${NC}"
kubectl apply -f ingress.yaml
echo -e "${GREEN}✅ Ingress deployed${NC}"

# Deploy monitoring
echo -e "${YELLOW}📊 Deploying monitoring...${NC}"
kubectl apply -f monitoring.yaml
echo -e "${GREEN}✅ Monitoring deployed${NC}"

# Get service information
echo -e "${BLUE}📋 Deployment Summary${NC}"
echo -e "${BLUE}===================${NC}"

echo -e "${YELLOW}Services:${NC}"
kubectl get services -n ${NAMESPACE}

echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n ${NAMESPACE}

echo -e "${YELLOW}Ingress:${NC}"
kubectl get ingress -n ${NAMESPACE}

echo -e "${YELLOW}HPA Status:${NC}"
kubectl get hpa -n ${NAMESPACE}

# Get external IPs
BACKEND_IP=$(kubectl get service camera-streaming-backend -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending")
RTMP_IP=$(kubectl get service nginx-rtmp-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending")

echo -e "${BLUE}🔗 Access Information${NC}"
echo -e "${BLUE}===================${NC}"
echo -e "${GREEN}Backend API: http://${BACKEND_IP}:3000${NC}"
echo -e "${GREEN}RTMP Endpoint: rtmp://${RTMP_IP}:1935/live${NC}"
echo -e "${GREEN}HLS Endpoint: http://${RTMP_IP}:8080/hls${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${GREEN}Production API: https://api.camera-streaming.example.com${NC}"
    echo -e "${GREEN}Production Streaming: https://streaming.camera-streaming.example.com${NC}"
fi

# Health check
echo -e "${YELLOW}🏥 Performing health check...${NC}"
sleep 30
if kubectl exec -n ${NAMESPACE} deployment/camera-streaming-backend -- curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${YELLOW}Check logs with: kubectl logs -n ${NAMESPACE} deployment/camera-streaming-backend${NC}"
fi

# Cleanup
rm -f kustomization.yaml.bak

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}To monitor the deployment:${NC}"
echo -e "${BLUE}  kubectl get pods -n ${NAMESPACE} -w${NC}"
echo -e "${BLUE}  kubectl logs -n ${NAMESPACE} deployment/camera-streaming-backend -f${NC}"
echo -e "${BLUE}To access the application:${NC}"
echo -e "${BLUE}  kubectl port-forward -n ${NAMESPACE} service/camera-streaming-backend 3000:3000${NC}"