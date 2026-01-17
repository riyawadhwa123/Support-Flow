# SupportFlow AI - Deployment Guide

This guide provides step-by-step instructions for deploying SupportFlow AI to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Vercel Deployment](#vercel-deployment)
- [AWS Deployment](#aws-deployment)
- [Docker Deployment](#docker-deployment)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Node.js 18+** installed
2. **npm** or **yarn** package manager
3. **Docker** (for containerized deployment)
4. **AWS CLI** (for AWS deployment)
5. **Vercel CLI** (for Vercel deployment)
6. **Supabase account** with a project created
7. **ElevenLabs API key**
8. **Twilio account** (optional, for phone features)

## Environment Setup

### 1. Create Environment File

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Migrations

If using Supabase locally or hosted:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration file in your Supabase SQL editor
# File: supabase/migrations/001_initial_schema.sql
```

### 3. Start Development Server

```bash
npm run dev
```

Access the application at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Vercel Deployment

### Quick Deploy (Recommended for Testing)

1. **Install Vercel CLI:**

```bash
npm install -g vercel
```

2. **Login to Vercel:**

```bash
vercel login
```

3. **Deploy:**

```bash
vercel
```

### Environment Variables Setup

Add environment variables in Vercel Dashboard or via CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ELEVENLABS_API_KEY production
vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
vercel env add TWILIO_PHONE_NUMBER production
```

### Production Deploy

```bash
vercel --prod
```

## AWS Deployment

### Prerequisites for AWS

1. AWS CLI configured with credentials
2. Docker installed
3. Appropriate IAM permissions

### Step-by-Step AWS Deployment

#### 1. Set Environment Variables

```bash
export SUPABASE_URL="your_supabase_url"
export SUPABASE_ANON_KEY="your_anon_key"
export ELEVENLABS_API_KEY="your_elevenlabs_key"
```

#### 2. Run Deployment Script

```bash
chmod +x aws/deploy.sh
./aws/deploy.sh
```

This script will:
- Create ECR repository
- Build and push Docker image
- Create AWS Secrets Manager secrets
- Deploy CloudFormation stack (VPC, ALB, ECS, CloudFront)
- Register ECS task definition
- Create/update ECS service

#### 3. Manual AWS Setup (Alternative)

##### a. Create ECR Repository

```bash
aws ecr create-repository --repository-name supportflow-app --region us-east-1
```

##### b. Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t supportflow-app .

# Tag image
docker tag supportflow-app:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/supportflow-app:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/supportflow-app:latest
```

##### c. Deploy CloudFormation Stack

```bash
aws cloudformation deploy \
  --template-file aws/cloudformation-template.yml \
  --stack-name supportflow-production \
  --parameter-overrides Environment=production \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

##### d. Create Secrets in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name supportflow/supabase-url \
  --secret-string "your_supabase_url" \
  --region us-east-1

aws secretsmanager create-secret \
  --name supportflow/supabase-anon-key \
  --secret-string "your_anon_key" \
  --region us-east-1

aws secretsmanager create-secret \
  --name supportflow/elevenlabs-api-key \
  --secret-string "your_elevenlabs_key" \
  --region us-east-1
```

##### e. Register Task Definition and Create Service

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-definition.json \
  --region us-east-1

# Create service
aws ecs create-service \
  --cluster supportflow-cluster \
  --service-name supportflow-service \
  --task-definition supportflow-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --region us-east-1
```

## Docker Deployment

### Using Docker Compose (Local Development)

```bash
docker-compose up -d
```

This will start:
- Next.js application (port 3000)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)

### Production Docker Build

```bash
# Build image
docker build -t supportflow:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e ELEVENLABS_API_KEY=your_key \
  supportflow:latest
```

## Database Setup

### Supabase Setup

1. **Create a Supabase project** at https://supabase.com

2. **Run migrations:**
   - Go to SQL Editor in Supabase Dashboard
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the SQL

3. **Enable Row Level Security (RLS):**
   - RLS policies are included in the migration file
   - Verify they're active in the Supabase Dashboard

4. **Set up authentication:**
   - Enable Email provider in Authentication > Providers
   - Configure email templates if needed

### Database Backups

Set up automated backups in Supabase Dashboard:
- Settings > Database > Backups
- Enable Point-in-Time Recovery for production

## Monitoring and Logging

### AWS CloudWatch

View logs:

```bash
aws logs tail /ecs/supportflow-production --follow --region us-east-1
```

### Vercel Logs

```bash
vercel logs
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Issue:** Next.js build fails with module errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Database Connection Errors

**Issue:** Cannot connect to Supabase

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check if Supabase project is paused (free tier)
- Verify network connectivity

#### 3. ElevenLabs API Errors

**Issue:** API calls failing

**Solution:**
- Verify `ELEVENLABS_API_KEY` is correct
- Check API key permissions in ElevenLabs dashboard
- Verify you haven't exceeded rate limits

#### 4. Docker Build Issues

**Issue:** Docker build fails

**Solution:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t supportflow .
```

#### 5. AWS Deployment Issues

**Issue:** ECS tasks failing to start

**Solution:**
- Check CloudWatch logs for task errors
- Verify security group allows traffic on port 3000
- Ensure secrets are correctly configured in Secrets Manager
- Check task execution role has necessary permissions

### Health Checks

#### Local Development

```bash
curl http://localhost:3000
```

#### Production

```bash
curl https://your-domain.com
```

## Performance Optimization

### 1. Enable Caching

Configure Redis for session storage (already in docker-compose.yml)

### 2. CDN Configuration

CloudFront is automatically configured in AWS deployment for static asset caching.

### 3. Database Optimization

- Enable connection pooling in Supabase
- Add indexes for frequently queried columns
- Use database views for complex queries

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use AWS Secrets Manager** or similar for production secrets
3. **Enable HTTPS** for all production deployments
4. **Regular security updates** - keep dependencies updated
5. **API rate limiting** - implement on API routes
6. **Monitor logs** for suspicious activity

## Scaling

### Horizontal Scaling (AWS)

Update desired count in ECS service:

```bash
aws ecs update-service \
  --cluster supportflow-cluster \
  --service supportflow-service \
  --desired-count 4 \
  --region us-east-1
```

### Vertical Scaling

Update task definition with more CPU/Memory:
- Edit `aws/ecs-task-definition.json`
- Update `cpu` and `memory` values
- Re-register task definition

## Rollback

### Vercel Rollback

```bash
vercel rollback
```

### AWS Rollback

```bash
# List previous task definitions
aws ecs list-task-definitions --region us-east-1

# Update service to previous version
aws ecs update-service \
  --cluster supportflow-cluster \
  --service supportflow-service \
  --task-definition supportflow-app:PREVIOUS_VERSION \
  --region us-east-1
```

## Support

For issues or questions:
- Email: anmolx.work@gmail.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

## Next Steps

After deployment:
1. Configure your first agent
2. Upload knowledge base documents
3. Test voice interactions
4. Set up phone numbers with Twilio
5. Monitor conversation analytics

