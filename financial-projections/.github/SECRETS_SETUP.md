# GitHub Secrets Setup Guide

This document explains how to configure GitHub secrets for the Docker build workflow.

## Required Secrets

You need to configure the following secrets in your GitHub repository:

### 1. TEST_DATABASE_URL

Database URL used during the **test** Docker image build for Prisma client generation.

**Format:**
```
postgresql://testuser:testpassword@localhost:5432/financial_projections_test?schema=public
```

**Note:** This is only used at build time for Prisma to generate the client. The actual runtime DATABASE_URL is set in `docker-compose.test.yml`.

### 2. PROD_DATABASE_URL

Database URL used during the **production** Docker image build for Prisma client generation.

**Format:**
```
postgresql://produser:prodpassword@localhost:5432/financial_projections?schema=public
```

**Note:** This is only used at build time. The actual runtime DATABASE_URL is set via environment variables in `docker-compose.yml` or your deployment platform.

---

## How to Add Secrets to GitHub

### Via GitHub Web Interface

1. Go to your repository on GitHub
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - **Name**: `TEST_DATABASE_URL`
   - **Value**: `postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public`
   - Click **Add secret**

6. Repeat for `PROD_DATABASE_URL`

### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate
gh auth login

# Add TEST_DATABASE_URL secret
gh secret set TEST_DATABASE_URL --body "postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

# Add PROD_DATABASE_URL secret
gh secret set PROD_DATABASE_URL --body "postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

# List secrets to verify
gh secret list
```

---

## Local Development

For local development, you **don't need** to set these secrets. The Dockerfiles have default placeholder values that work for local builds:

```bash
# Local test build (uses default placeholder)
docker compose -f docker-compose.test.yml up -d --build

# Local production build (uses default placeholder)
docker compose up -d --build
```

The actual DATABASE_URL is provided at **runtime** via environment variables in the docker-compose files, not at build time.

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/docker-build.yml`) uses these secrets to build Docker images:

1. **On Push/PR**: Workflow triggers
2. **Build Step**: Passes secrets as build args
   ```yaml
   build-args: |
     DATABASE_URL=${{ secrets.TEST_DATABASE_URL }}
   ```
3. **Prisma Generate**: Runs with the build arg
4. **Image Created**: Pushed to GitHub Container Registry

---

## Security Best Practices

### For Build-Time Secrets

The DATABASE_URL used at build time is **not** the actual production database URL. It's just a placeholder needed for Prisma to generate the client code.

**Why?**
- Prisma needs a valid connection string format to generate the client
- The actual database doesn't need to exist
- The placeholder is not stored in the final image

**Recommended placeholder format:**
```
postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public
```

### For Runtime Secrets

The **actual** production database URL should:
- Never be committed to the repository
- Be set via environment variables at runtime
- Use secure password management (Vault, AWS Secrets Manager, etc.)
- Be different from the build-time placeholder

Example using `.env` file (git-ignored):
```bash
# .env (never commit this)
DATABASE_URL="postgresql://realuser:securepassword@prod-db:5432/financial_projections?schema=public"
```

---

## Updating Secrets

To update a secret:

### Via Web Interface
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click on the secret name
3. Click **Update secret**
4. Enter new value and click **Update secret**

### Via CLI
```bash
# Update TEST_DATABASE_URL
gh secret set TEST_DATABASE_URL --body "new-value-here"
```

---

## Troubleshooting

### Build fails with "Cannot resolve environment variable: DATABASE_URL"

**Cause:** GitHub secret not set or workflow not using it correctly.

**Solution:**
1. Verify secret exists: `gh secret list`
2. Check workflow file uses `${{ secrets.TEST_DATABASE_URL }}`
3. Check secret name matches exactly (case-sensitive)

### Local build fails with same error

**Cause:** Build argument not provided and no default set.

**Solution:** The Dockerfiles now have default values, so this shouldn't happen. If it does:

```bash
# Provide build arg explicitly
docker build \
  --build-arg DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" \
  -f Dockerfile.test \
  -t test-image .
```

### Can I use the same secret for both test and prod?

**Yes!** Since these are just placeholders for Prisma client generation, you can use the same value:

```bash
PLACEHOLDER_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

gh secret set TEST_DATABASE_URL --body "$PLACEHOLDER_URL"
gh secret set PROD_DATABASE_URL --body "$PLACEHOLDER_URL"
```

---

## Environment Variables Summary

| Variable | Where | Purpose |
|----------|-------|---------|
| `TEST_DATABASE_URL` (secret) | GitHub Actions | Build arg for test image |
| `PROD_DATABASE_URL` (secret) | GitHub Actions | Build arg for prod image |
| `DATABASE_URL` (env) | docker-compose.test.yml | Runtime connection |
| `DATABASE_URL` (env) | docker-compose.yml | Runtime connection |
| `DATABASE_URL` (env) | .env file | Local development |

---

**Last Updated**: January 2026
