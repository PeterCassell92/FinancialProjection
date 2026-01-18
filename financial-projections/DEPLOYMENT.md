# Deployment Guide

This guide covers deploying the Financial Projections application in both test and production environments using Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Test Environment Deployment](#test-environment-deployment)
4. [Production Deployment](#production-deployment)
5. [Database Backups](#database-backups)
6. [Monitoring and Health Checks](#monitoring-and-health-checks)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- Docker Engine 20.10+ installed
- Docker Compose v2.0+ installed
- At least 2GB of available RAM
- At least 10GB of available disk space

Check your Docker installation:

```bash
docker --version
docker compose version
```

---

## Environment Configuration

### 1. Copy the Example Environment File

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your specific configuration:

**For Production:**

```bash
# Database Configuration
POSTGRES_USER=financialapp
POSTGRES_PASSWORD=your-very-secure-password-here  # CHANGE THIS!
POSTGRES_DB=financial_projections
POSTGRES_PORT=5432

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3000
APP_PORT=3000

# Optional: Prisma Studio (for debugging)
STUDIO_PORT=5555

# Optional: Backup Configuration
BACKUP_RETENTION_DAYS=7
```

**For Test Environment:**

Test environment uses predefined credentials in `docker-compose.test.yml`:
- User: `testuser`
- Password: `testpassword`
- Database: `financial_projections_test`
- Port: `5433` (to avoid conflicts with production)

---

## Test Environment Deployment

The test environment includes:
- PostgreSQL database with test data
- Next.js application in development mode
- Prisma Studio for database inspection
- Automatic seeding with realistic test data

### 1. Start Test Environment

```bash
docker compose -f docker-compose.test.yml up -d
```

### 2. View Logs

```bash
# All services
docker compose -f docker-compose.test.yml logs -f

# Specific service
docker compose -f docker-compose.test.yml logs -f app-test
```

### 3. Access Services

- **Application**: http://localhost:3001
- **Prisma Studio**: http://localhost:5556
- **PostgreSQL**: localhost:5433

### 4. Run Database Migrations

Migrations run automatically on startup, but you can run them manually:

```bash
docker compose -f docker-compose.test.yml exec app-test npx prisma migrate deploy
```

### 5. Reseed Test Data

To reset and reseed the test database:

```bash
docker compose -f docker-compose.test.yml exec app-test npx prisma migrate reset --force
```

### 6. Stop Test Environment

```bash
docker compose -f docker-compose.test.yml down
```

### 7. Clean Up (Remove All Data)

```bash
docker compose -f docker-compose.test.yml down -v
```

---

## Production Deployment

The production environment includes:
- PostgreSQL database with persistent storage
- Optimized Next.js production build
- Optional Prisma Studio (debug profile)
- Optional automated backups (backup profile)
- Health checks for all services

### 1. Build Production Images

```bash
docker compose build
```

This creates optimized Docker images using multi-stage builds.

### 2. Start Production Services

**Basic deployment (database + app):**

```bash
docker compose up -d
```

**With Prisma Studio for debugging:**

```bash
docker compose --profile debug up -d
```

**With automated backups:**

```bash
docker compose --profile backup up -d
```

**All services:**

```bash
docker compose --profile debug --profile backup up -d
```

### 3. Initial Database Setup

The application automatically runs migrations on startup. To verify:

```bash
docker compose logs app | grep -i migrate
```

### 4. Access Services

- **Application**: http://localhost:3000 (or your configured `APP_PORT`)
- **Prisma Studio**: http://localhost:5555 (if using `--profile debug`)
- **PostgreSQL**: localhost:5432 (or your configured `POSTGRES_PORT`)

### 5. Health Check

Check application health:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-18T12:00:00.000Z",
  "database": "connected"
}
```

### 6. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres
```

### 7. Stop Production Services

```bash
docker compose down
```

**Note**: This preserves your data in the `postgres-data` volume.

### 8. Update Production Deployment

When updating to a new version:

```bash
# Pull latest code
git pull

# Rebuild images
docker compose build

# Stop services
docker compose down

# Start updated services
docker compose up -d

# Check health
curl http://localhost:3000/api/health
```

---

## Database Backups

### Automated Backups

Enable automated daily backups at 2 AM:

```bash
docker compose --profile backup up -d
```

Backups are stored in `./backups/` directory with the format:
```
financial_projections_YYYYMMDD_HHMMSS.sql.gz
```

Old backups are automatically removed after `BACKUP_RETENTION_DAYS` (default: 7 days).

### Manual Backup

Create a manual backup:

```bash
# Create backup directory
mkdir -p backups

# Run backup
docker compose exec postgres pg_dump \
  -U financialapp \
  -d financial_projections \
  --no-owner \
  --no-acl \
  | gzip > backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup

To restore from a backup file:

```bash
# Stop the application
docker compose stop app

# Decompress and restore
gunzip < backups/financial_projections_20240118_020000.sql.gz | \
  docker compose exec -T postgres psql \
    -U financialapp \
    -d financial_projections

# Restart application
docker compose start app
```

### Backup to Remote Storage

For production systems, consider backing up to remote storage:

```bash
# Example: AWS S3
aws s3 sync ./backups/ s3://your-bucket/financial-projections-backups/

# Example: rsync to remote server
rsync -avz ./backups/ user@remote-server:/path/to/backups/
```

---

## Monitoring and Health Checks

### Application Health

Docker automatically monitors container health. Check status:

```bash
docker compose ps
```

Healthy output:
```
NAME                              STATUS
financial-projections-app         Up (healthy)
financial-projections-db          Up (healthy)
```

### Database Connection

Test database connectivity:

```bash
docker compose exec postgres psql \
  -U financialapp \
  -d financial_projections \
  -c "SELECT version();"
```

### Disk Space

Monitor disk usage of volumes:

```bash
docker system df -v
```

### Container Resources

Monitor resource usage:

```bash
docker stats
```

### View Database Size

```bash
docker compose exec postgres psql \
  -U financialapp \
  -d financial_projections \
  -c "SELECT pg_size_pretty(pg_database_size('financial_projections'));"
```

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker compose logs app
```

**Common issues:**
- Database not ready: Wait for postgres health check to pass
- Port conflict: Change `APP_PORT` in `.env`
- Migration failure: Check database credentials

### Database Connection Errors

**Verify database is running:**
```bash
docker compose ps postgres
```

**Check database logs:**
```bash
docker compose logs postgres
```

**Test connection:**
```bash
docker compose exec postgres psql \
  -U financialapp \
  -d financial_projections
```

### Port Already in Use

**Find what's using the port:**
```bash
sudo lsof -i :3000  # or :5432 for database
```

**Change port in `.env`:**
```bash
APP_PORT=3001
POSTGRES_PORT=5433
```

### Out of Disk Space

**Clean up Docker:**
```bash
# Remove unused containers, images, networks
docker system prune -a

# Remove unused volumes (WARNING: deletes data)
docker volume prune
```

### Corrupted Database

**Reset database (WARNING: destroys all data):**
```bash
docker compose down -v
docker compose up -d
```

### Prisma Migration Issues

**Reset migrations (development only):**
```bash
docker compose exec app npx prisma migrate reset --force
```

**Apply pending migrations:**
```bash
docker compose exec app npx prisma migrate deploy
```

### Container Keeps Restarting

**Check container logs:**
```bash
docker compose logs --tail=100 app
```

**Inspect container:**
```bash
docker compose ps
docker inspect financial-projections-app
```

### Health Check Failing

**Manual health check:**
```bash
curl -v http://localhost:3000/api/health
```

**Check application logs:**
```bash
docker compose logs app | grep health
```

---

## Production Best Practices

### Security

1. **Change default passwords** - Never use default credentials in production
2. **Use secrets management** - Consider Docker secrets or external secret managers
3. **Restrict network access** - Use firewall rules to limit database access
4. **Enable SSL/TLS** - Use a reverse proxy (nginx/Caddy) with SSL certificates
5. **Regular updates** - Keep Docker images and dependencies updated

### Performance

1. **Resource limits** - Set memory and CPU limits in docker-compose.yml
2. **Database tuning** - Adjust PostgreSQL configuration for your workload
3. **Monitor metrics** - Use monitoring tools (Prometheus, Grafana)
4. **Regular backups** - Enable automated backups with retention policy

### Reliability

1. **Health checks** - Ensure all services have proper health checks
2. **Restart policies** - Use `unless-stopped` for automatic recovery
3. **Logging** - Configure log rotation to prevent disk fill
4. **Monitoring** - Set up alerts for service failures

### Scaling

For larger deployments, consider:

1. **Separate database server** - Move PostgreSQL to dedicated hardware
2. **Load balancing** - Deploy multiple app instances behind a load balancer
3. **Caching** - Add Redis for session and data caching
4. **CDN** - Serve static assets via CDN
5. **Container orchestration** - Use Kubernetes for advanced deployments

---

## Environment Differences

| Feature | Test Environment | Production Environment |
|---------|------------------|------------------------|
| **Port** | 3001 | 3000 |
| **Database Port** | 5433 | 5432 |
| **Build** | Development | Optimized Production |
| **Hot Reload** | Enabled | Disabled |
| **Source Maps** | Full | None |
| **Seeding** | Automatic | Manual |
| **Prisma Studio** | Always On | Optional (debug profile) |
| **Backups** | Not Configured | Optional (backup profile) |
| **Health Checks** | Basic | Full |

---

## Quick Reference

### Common Commands

```bash
# Start test environment
docker compose -f docker-compose.test.yml up -d

# Start production
docker compose up -d

# Start production with debugging
docker compose --profile debug up -d

# View logs
docker compose logs -f

# Stop services (keep data)
docker compose down

# Stop services (remove data)
docker compose down -v

# Rebuild images
docker compose build

# Check health
curl http://localhost:3000/api/health

# Manual backup
docker compose exec postgres pg_dump -U financialapp -d financial_projections | gzip > backup.sql.gz

# Restore backup
gunzip < backup.sql.gz | docker compose exec -T postgres psql -U financialapp -d financial_projections
```

---

## Support

For issues and questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs: `docker compose logs`
3. Check [README.md](./README.md) for general documentation
4. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

---

## Next Steps

After successful deployment:

1. Access the application at http://localhost:3000 (or your configured URL)
2. Configure settings (currency, date format, initial balance)
3. Create your first bank account
4. Start adding projection events
5. Set up recurring rules for regular income/expenses
6. Enable automated backups for production

---

**Last Updated**: January 2026
