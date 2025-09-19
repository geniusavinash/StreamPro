# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Multi-Camera Streaming Platform.

## Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured to access your cluster
- Docker registry access
- Persistent Volume provisioner
- Ingress controller (nginx recommended)
- cert-manager for TLS certificates (optional)

## Quick Start

1. **Update Configuration**
   ```bash
   # Update secrets with your actual values
   kubectl create secret generic camera-streaming-secrets \
     --from-literal=JWT_SECRET=your-jwt-secret \
     --from-literal=ENCRYPTION_KEY=your-32-character-encryption-key \
     --from-literal=DATABASE_PASSWORD=your-db-password \
     --from-literal=REDIS_PASSWORD=your-redis-password \
     -n camera-streaming
   ```

2. **Deploy the Platform**
   ```bash
   # Make deploy script executable (Linux/Mac)
   chmod +x deploy.sh
   
   # Run deployment
   ./deploy.sh latest production
   ```

3. **Verify Deployment**
   ```bash
   kubectl get pods -n camera-streaming
   kubectl get services -n camera-streaming
   ```

## Architecture

The deployment consists of:

- **PostgreSQL**: Primary database with persistent storage
- **Redis**: Caching and session storage
- **NGINX RTMP**: Streaming server with HLS support
- **Backend API**: NestJS application with auto-scaling
- **Ingress**: Load balancer and SSL termination
- **Monitoring**: Prometheus metrics and Grafana dashboards

## Storage Classes

The deployment assumes these storage classes:
- `fast-ssd`: For high-performance storage (Redis, HLS)
- `standard`: For regular storage (recordings, logs)

Update the storage class names in the PVC manifests if needed.

## Scaling

### Horizontal Pod Autoscaler (HPA)

The backend and RTMP services have HPA configured:

- **Backend**: 3-20 replicas based on CPU/memory
- **RTMP**: 2-10 replicas based on CPU/memory

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment camera-streaming-backend --replicas=5 -n camera-streaming

# Scale RTMP servers
kubectl scale deployment nginx-rtmp --replicas=3 -n camera-streaming
```

## Monitoring

### Prometheus Metrics

Metrics are exposed at `/monitoring/prometheus` endpoint and automatically scraped by Prometheus.

### Grafana Dashboard

A pre-configured dashboard is included in `monitoring.yaml`.

### Alerts

Critical alerts are configured for:
- High CPU/Memory usage
- Service health failures
- High error rates
- Camera offline status

## Security

### Network Policies

Network policies restrict traffic between pods and external access.

### Secrets Management

Sensitive data is stored in Kubernetes secrets:
- JWT secrets
- Database passwords
- TLS certificates

### RBAC

Consider implementing RBAC for production deployments:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: camera-streaming
  name: camera-streaming-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
```

## Backup and Recovery

### Database Backup

```bash
# Create database backup
kubectl exec -n camera-streaming deployment/postgres -- pg_dump -U postgres camera_streaming > backup.sql

# Restore from backup
kubectl exec -i -n camera-streaming deployment/postgres -- psql -U postgres camera_streaming < backup.sql
```

### Persistent Volume Backup

Use your cloud provider's volume snapshot feature or tools like Velero.

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n camera-streaming
   kubectl logs <pod-name> -n camera-streaming
   ```

2. **Database connection issues**
   ```bash
   # Check if PostgreSQL is ready
   kubectl exec -n camera-streaming deployment/postgres -- pg_isready -U postgres
   ```

3. **Redis connection issues**
   ```bash
   # Test Redis connection
   kubectl exec -n camera-streaming deployment/redis -- redis-cli ping
   ```

4. **Ingress not working**
   ```bash
   kubectl describe ingress camera-streaming-ingress -n camera-streaming
   ```

### Debug Commands

```bash
# Get all resources
kubectl get all -n camera-streaming

# Check events
kubectl get events -n camera-streaming --sort-by='.lastTimestamp'

# Port forward for local access
kubectl port-forward -n camera-streaming service/camera-streaming-backend 3000:3000

# Execute commands in pods
kubectl exec -it -n camera-streaming deployment/camera-streaming-backend -- /bin/bash
```

## Production Considerations

### High Availability

- Deploy across multiple availability zones
- Use external managed databases (RDS, Cloud SQL)
- Implement proper backup strategies
- Set up monitoring and alerting

### Performance

- Tune resource requests and limits
- Configure appropriate HPA metrics
- Use node affinity for optimal placement
- Monitor and optimize database queries

### Security

- Enable Pod Security Standards
- Use network policies
- Implement proper RBAC
- Regular security updates
- Scan images for vulnerabilities

### Cost Optimization

- Use spot instances where appropriate
- Implement cluster autoscaling
- Monitor resource usage
- Right-size resource requests

## Customization

### Environment-specific Configuration

Create environment-specific overlays:

```bash
mkdir -p overlays/staging overlays/production

# staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patchesStrategicMerge:
- replica-count.yaml
```

### Custom Storage

Update PVC configurations for your storage requirements:

```yaml
spec:
  resources:
    requests:
      storage: 100Gi  # Adjust size
  storageClassName: your-storage-class
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Kubernetes events and logs
3. Consult the application documentation
4. Open an issue in the project repository