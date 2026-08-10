# Changelog

All notable changes to the **ODRISYSTEMS Infrastructure Monitoring Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-10

### 🚀 Added
- **Core Infrastructure Observability**: Distributed server telemetry collection (CPU, RAM, Disk, Uptime) and real-time dashboard visualization.
- **Backup Verification System**: Automated tracking of backup jobs (`SUCCESS` vs `FAILED`), size metrics, duration logging, and automatic failure alerting.
- **Automated Threshold Engine**: Dynamic `WARNING` and `CRITICAL` alert creation based on server resource utilization thresholds.
- **Immutable Audit Trail**: Centralized audit logging for authentication events, server additions, alert resolutions, and backup operations.
- **Multi-Tenant RBAC Authorization**: 4-tier Role-Based Access Control (`ADMIN`, `INFRASTRUCTURE_MANAGER`, `MONITORING_OPERATOR`, `READ_ONLY`).
- **Containerized Nginx Proxying**: High-performance production deployment setup using Docker Compose and Nginx API path proxying.
- **Automated Startup Reconciliation**: Database lifespan event to seed default RBAC accounts and maintain password integrity across deployments.
- **Comprehensive Pytest Suite**: Full test coverage for audit logs, backup monitoring, notifications, RBAC authorization, and server alerts.

### 🔐 Security
- Secure bcrypt password hashing for user credentials.
- OAuth2 JWT Bearer authentication scheme with configurable token expiration.
- Complete separation of production secrets via `.env.example` templates and strict `.gitignore` rules.
