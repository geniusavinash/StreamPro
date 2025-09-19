# Camera Streaming Platform - Monitoring Stack

This directory contains the complete monitoring and observability stack for the Camera Streaming Platform.

## Components

### Core Monitoring
- **Prometheus**: Metrics collection and storage
- **Alertmanager**: Alert routing and notification management
- **Grafana**: Visualization and dashboards
- **Node Exporter**: System metrics collection
- **Blackbox Exporter**: External endpoint monitoring

### Database Monitoring
- **Postgres Exporter**: PostgreSQL metrics
- **Redis Exporter**: Redis metrics

### Container Monitoring
- **cAdvisor**: Container resource usage metrics

### Logging
- **Loki**: Log aggregation
- **Promtail**: Log collection agent

### Tracing
- **Jaeger**: Distributed tracing

### Load Balancing
- **Traefik**: Reverse proxy with automatic service discovery

## Quick Start

1. **Start the monitoring stack**:
   ```bash
   docker-compose up -d
   ```

2. **Access the services**:
   - Grafana: http://localhost:3001 (admin/admin123)
   - Prometheus: http://localhost:9090
   - Alertmanager: http://localhost:9093
   - Jaeger: http://localhost:16686

3. **Configure Grafana**:
   - Import the provided dashboards
   - Set up notification channels
   - Configure alert rules

## Configuration

### Prometheus Configuration

The Prometheus configuration includes:
- Service discovery for Kubernetes pods and services
- Scraping configuration for all components
- Recording rules for aggregated metrics
- Remote write configuration for long-term storage

Key scrape targets:
- Camera Streaming Backend: `/monitoring/prometheus`
- NGINX RTMP: `/stat` endpoint
- Database and Redis exporters
- System metrics via Node Exporter

### Alert Rules

Alert rules are organized by service:
- **Service availability**: Service down, high error rates
- **Performance**: High response times, resource usage
- **Infrastructure**: Database, Redis, RTMP service health
- **Security**: Unauthorized access, rate limiting
- **Kubernetes**: Pod crashes, deployment issues

### Alertmanager Configuration

Alertmanager routes alerts based on:
- **Severity**: Critical alerts get immediate notification
- **Team**: Platform, streaming, operations, security teams
- **Environment**: Different handling for dev/staging/prod

Notification channels:
- **Email**: For critical alerts and team-specific notifications
- **Slack**: Real-time notifications to team channels
- **PagerDuty**: For critical production issues

### Grafana Dashboards

Pre-configured dashboards:
- **Overview**: High-level service health and metrics
- **Application**: Detailed application performance
- **Infrastructure**: System resources and Kubernetes
- **Database**: PostgreSQL and Redis performance
- **Streaming**: RTMP and video streaming metrics
- **Security**: Authentication, authorization, and security events

## Monitoring Best Practices

### Metrics Collection

1. **Golden Signals**:
   - Latency: Response time percentiles
   - Traffic: Request rate
   - Errors: Error rate and types
   - Saturation: Resource utilization

2. **Business Metrics**:
   - Camera online/offline status
   - Stream success rate
   - Recording failures
   - User activity

3. **Infrastructure Metrics**:
   - CPU, memory, disk usage
   - Network throughput
   - Database performance
   - Container resource usage

### Alerting Strategy

1. **Alert Fatigue Prevention**:
   - Use inhibition rules to reduce noise
   - Set appropriate thresholds
   - Group related alerts
   - Implement escalation policies

2. **Runbooks**:
   - Every alert should have a runbook
   - Include troubleshooting steps
   - Document escalation procedures
   - Keep runbooks up to date

3. **SLA/SLO Monitoring**:
   - Define service level objectives
   - Monitor error budgets
   - Alert on SLO violations
   - Track SLA compliance

### Dashboard Design

1. **Hierarchy**:
   - Overview dashboards for executives
   - Service dashboards for teams
   - Detailed dashboards for debugging

2. **Visualization**:
   - Use appropriate chart types
   - Include context and annotations
   - Show trends and patterns
   - Highlight anomalies

## Production Deployment

### Kubernetes Deployment

For production Kubernetes deployment:

```bash
# Deploy monitoring namespace
kubectl apply -f k8s/monitoring-namespace.yaml

# Deploy Prometheus
kubectl apply -f k8s/prometheus/

# Deploy Alertmanager
kubectl apply -f k8s/alertmanager/

# Deploy Grafana
kubectl apply -f k8s/grafana/
```

### High Availability

For production environments:
- Deploy Prometheus in HA mode with multiple replicas
- Use external storage for long-term metrics retention
- Configure Alertmanager clustering
- Set up Grafana with external database

### Security

1. **Authentication**:
   - Enable authentication for all services
   - Use RBAC for Kubernetes deployments
   - Implement SSO integration

2. **Network Security**:
   - Use network policies to restrict access
   - Enable TLS for all communications
   - Secure service-to-service communication

3. **Data Protection**:
   - Encrypt metrics data at rest
   - Secure backup procedures
   - Implement data retention policies

## Troubleshooting

### Common Issues

1. **Metrics not appearing**:
   - Check Prometheus targets page
   - Verify service discovery configuration
   - Check network connectivity
   - Review scrape configuration

2. **Alerts not firing**:
   - Verify alert rule syntax
   - Check Prometheus rule evaluation
   - Review Alertmanager configuration
   - Test notification channels

3. **Dashboard issues**:
   - Check data source configuration
   - Verify query syntax
   - Review time range settings
   - Check variable configuration

### Debug Commands

```bash
# Check Prometheus configuration
curl http://localhost:9090/api/v1/status/config

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Alertmanager configuration
curl http://localhost:9093/api/v1/status

# Check Grafana health
curl http://localhost:3001/api/health
```

## Maintenance

### Regular Tasks

1. **Update configurations**:
   - Review and update alert thresholds
   - Add new services to monitoring
   - Update dashboard queries
   - Review notification channels

2. **Capacity planning**:
   - Monitor storage usage
   - Plan for metric retention
   - Scale monitoring infrastructure
   - Optimize query performance

3. **Security updates**:
   - Update monitoring components
   - Review access permissions
   - Audit configuration changes
   - Test backup procedures

### Backup and Recovery

1. **Configuration backup**:
   - Version control all configurations
   - Backup Grafana dashboards
   - Export Prometheus rules
   - Document recovery procedures

2. **Data backup**:
   - Configure remote write for metrics
   - Backup Grafana database
   - Archive historical data
   - Test restore procedures

## Integration

### CI/CD Integration

The monitoring stack integrates with CI/CD pipelines:
- Deployment annotations in Grafana
- Alert suppression during deployments
- Performance testing integration
- Automated dashboard updates

### External Services

Integration with external services:
- **PagerDuty**: Critical alert escalation
- **Slack**: Team notifications
- **Email**: Alert notifications
- **Webhook**: Custom integrations

## Support

For monitoring-related issues:
1. Check the troubleshooting section
2. Review service logs
3. Consult the runbooks
4. Contact the platform team