# Deployment Guide

This guide covers the deployment process for the Movie Agent Web App to Azure App Service.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure Infrastructure Setup](#azure-infrastructure-setup)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Environment Variables](#environment-variables)
5. [Monitoring and Alerts](#monitoring-and-alerts)
6. [Deployment Workflows](#deployment-workflows)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Tools

- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) (v2.50+)
- [Node.js](https://nodejs.org/) (v20.x LTS)
- [Git](https://git-scm.com/)
- GitHub account with repository access

### Azure Requirements

- Active Azure subscription
- Resource Group created
- Contributor access to the subscription/resource group

### GitHub Requirements

- Repository admin access (for secrets configuration)
- GitHub Actions enabled

---

## Azure Infrastructure Setup

### Option 1: Deploy with Bicep (Recommended)

The infrastructure is defined as code using Azure Bicep templates located in the `infrastructure/` directory.

#### 1. Login to Azure

```bash
az login
az account set --subscription "YOUR_SUBSCRIPTION_NAME"
```

#### 2. Create Resource Group

```bash
az group create \
  --name rg-movieagent-prod \
  --location eastus
```

#### 3. Deploy Infrastructure

**Production Environment:**

```bash
az deployment group create \
  --resource-group rg-movieagent-prod \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/parameters.prod.json
```

**Staging Environment:**

```bash
az deployment group create \
  --resource-group rg-movieagent-staging \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/parameters.staging.json
```

#### 4. Get Deployment Outputs

```bash
az deployment group show \
  --resource-group rg-movieagent-prod \
  --name main \
  --query properties.outputs
```

### Option 2: Manual Azure Portal Setup

1. **Create App Service Plan**
   - SKU: B1 (Basic) or higher for production
   - OS: Linux
   - Region: Your preferred region

2. **Create Web App**
   - Runtime: Node 20 LTS
   - Enable Application Insights
   - Configure deployment slots (staging)

3. **Create Application Insights**
   - Connected to Log Analytics Workspace
   - Web application type

4. **Create Key Vault (Optional)**
   - Standard tier
   - Enable RBAC authorization

---

## CI/CD Pipeline

### GitHub Actions Workflows

Two workflows are configured in `.github/workflows/`:

#### 1. CI Workflow (`ci.yml`)

Runs on all branches except `main`:
- Linting and type checking
- Unit tests with coverage
- Build verification

#### 2. Azure Deploy Workflow (`azure-deploy.yml`)

Runs on `main` branch and pull requests:
- Full build and test
- Deploy to staging (PRs)
- Deploy to production (main branch)
- Post-deployment health checks

### Setting Up GitHub Secrets

Configure the following secrets in your repository settings:

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Production publish profile | Azure Portal > App Service > Deployment Center > Manage publish profile |
| `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING` | Staging publish profile | Azure Portal > App Service > Deployment slots > staging > Manage publish profile |
| `CODECOV_TOKEN` | Codecov upload token (optional) | [codecov.io](https://codecov.io) |

#### Getting Publish Profile

```bash
# Production
az webapp deployment list-publishing-profiles \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --xml

# Staging slot
az webapp deployment list-publishing-profiles \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --slot staging \
  --xml
```

### Updating Workflow Configuration

Edit `.github/workflows/azure-deploy.yml` and update:

```yaml
env:
  AZURE_WEBAPP_NAME: your-app-name  # Your App Service name
```

---

## Environment Variables

### Required Variables in Azure

Configure these in Azure App Service > Configuration > Application settings:

| Variable | Required | Description |
|----------|----------|-------------|
| `TMDB_API_KEY` | Yes | TMDb API key |
| `LLM_PROVIDER` | Yes | `gemini` or `azure` |
| `GEMINI_API_KEY` | If using Gemini | Gemini API key |
| `AZURE_OPENAI_API_KEY` | If using Azure | Azure OpenAI key |
| `AZURE_OPENAI_ENDPOINT` | If using Azure | Azure OpenAI endpoint |
| `AZURE_OPENAI_DEPLOYMENT` | If using Azure | Deployment name |

### Setting Environment Variables

**Via Azure CLI:**

```bash
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --settings \
    TMDB_API_KEY="your_key" \
    LLM_PROVIDER="gemini" \
    GEMINI_API_KEY="your_key"
```

**Via Azure Portal:**

1. Navigate to App Service
2. Settings > Configuration
3. Application settings > New application setting
4. Add each variable
5. Save and restart

### Using Key Vault References (Recommended for Production)

For sensitive values, use Key Vault references:

```bash
# Store secret in Key Vault
az keyvault secret set \
  --vault-name YOUR_KEYVAULT_NAME \
  --name "TMDB-API-KEY" \
  --value "your_key"

# Reference in App Service
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --settings TMDB_API_KEY="@Microsoft.KeyVault(VaultName=YOUR_KEYVAULT_NAME;SecretName=TMDB-API-KEY)"
```

---

## Monitoring and Alerts

### Application Insights

The Bicep template automatically configures:

- **Live Metrics**: Real-time performance monitoring
- **Availability Tests**: Synthetic monitoring
- **Smart Detection**: Automatic anomaly detection
- **Application Map**: Visual dependency mapping

Access via Azure Portal > Application Insights > Your resource.

### Configured Alerts

The infrastructure includes these pre-configured alerts:

| Alert | Threshold | Severity |
|-------|-----------|----------|
| High CPU | > 80% for 5 min | 2 (Warning) |
| HTTP 5xx Errors | > 5 in 5 min | 1 (Error) |
| High Response Time | > 5s average | 2 (Warning) |

### Setting Up Alert Actions

```bash
# Create action group for email notifications
az monitor action-group create \
  --resource-group YOUR_RESOURCE_GROUP \
  --name "MovieAgentAlerts" \
  --short-name "MAAlerts" \
  --email-receiver name="Admin" email="admin@example.com"
```

### Viewing Logs

```bash
# Stream live logs
az webapp log tail \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP

# Download logs
az webapp log download \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --log-file logs.zip
```

---

## Deployment Workflows

### Standard Deployment (Automatic)

1. Push changes to a feature branch
2. Create Pull Request → Deploys to staging
3. Review and test on staging URL
4. Merge to main → Deploys to production
5. Automatic health check runs

### Manual Deployment

Use GitHub Actions workflow dispatch:

1. Go to Actions > Azure Deployment
2. Click "Run workflow"
3. Select environment (production/staging)
4. Click "Run workflow"

### Deployment via Azure CLI

```bash
# Build locally
npm run build

# Zip the build
zip -r deploy.zip .next public package.json package-lock.json next.config.js

# Deploy
az webapp deployment source config-zip \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --src deploy.zip
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with Build Error

**Symptom:** GitHub Actions fails during build step.

**Solution:**
```bash
# Test build locally
npm ci
npm run build
```

Check for TypeScript errors or missing dependencies.

#### 2. Application Not Starting

**Symptom:** App shows "Application Error" or 503.

**Solutions:**
- Check startup command: `npm run start`
- Verify Node.js version: `~20`
- Check logs: `az webapp log tail --name YOUR_APP --resource-group YOUR_RG`

#### 3. Environment Variables Not Working

**Symptom:** App runs but features don't work.

**Solutions:**
- Verify settings in Azure Portal
- Check for typos in variable names
- Restart the App Service after changes

#### 4. Health Check Failing

**Symptom:** Deployment completes but health check fails.

**Solutions:**
- Verify `/api/health` endpoint works locally
- Check if app needs more startup time
- Review health check response in logs

### Viewing Deployment Logs

```bash
# Deployment logs
az webapp log deployment show \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP

# Application logs
az webapp log show \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP
```

---

## Rollback Procedures

### Quick Rollback (Deployment Slots)

```bash
# Swap staging and production
az webapp deployment slot swap \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --slot staging \
  --target-slot production
```

### Rollback to Previous Deployment

1. Go to Azure Portal > App Service
2. Deployment Center > Logs
3. Find previous successful deployment
4. Click "Redeploy"

### Rollback via Git

```bash
# Find the last working commit
git log --oneline

# Revert to specific commit
git revert HEAD
git push origin main

# Or reset (destructive)
git reset --hard COMMIT_HASH
git push --force origin main
```

---

## Security Checklist

Before going to production, ensure:

- [ ] All API keys are in Azure Key Vault
- [ ] HTTPS only is enabled
- [ ] TLS 1.2 minimum is configured
- [ ] FTPS is disabled
- [ ] Application Insights is configured
- [ ] Alerts are set up
- [ ] Deployment slots are configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured

---

## Cost Optimization

### Recommended SKUs

| Environment | SKU | Estimated Monthly Cost |
|-------------|-----|------------------------|
| Development | F1 (Free) | $0 |
| Staging | B1 | ~$13 |
| Production | B1/S1 | $13-$70 |

### Cost-Saving Tips

1. Use free tier for development
2. Enable auto-scaling with minimum instances = 1
3. Configure App Insights sampling for high-traffic apps
4. Use deployment slots only in production
5. Clean up unused resources regularly

---

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions for Azure](https://docs.microsoft.com/azure/developer/github/github-actions)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
