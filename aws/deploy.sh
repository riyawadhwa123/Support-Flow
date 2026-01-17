#!/bin/bash

# AWS Deployment Script for SupportFlow AI Platform
# Prerequisites: AWS CLI configured with appropriate credentials

set -e

# Configuration
STACK_NAME="supportflow-production"
REGION="us-east-1"
ECR_REPOSITORY="supportflow-app"
ECS_CLUSTER="supportflow-cluster"
ECS_SERVICE="supportflow-service"

echo "=== SupportFlow AWS Deployment ==="
echo ""

# Step 1: Create ECR Repository if it doesn't exist
echo "Step 1: Setting up ECR Repository..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $REGION 2>/dev/null || \
  aws ecr create-repository --repository-name $ECR_REPOSITORY --region $REGION

# Get ECR repository URI
ECR_URI=$(aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $REGION --query 'repositories[0].repositoryUri' --output text)
echo "ECR Repository: $ECR_URI"
echo ""

# Step 2: Build and Push Docker Image
echo "Step 2: Building and pushing Docker image..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

docker build -t $ECR_REPOSITORY:latest .
docker tag $ECR_REPOSITORY:latest $ECR_URI:latest
docker push $ECR_URI:latest
echo "Docker image pushed successfully!"
echo ""

# Step 3: Create Secrets in AWS Secrets Manager
echo "Step 3: Creating secrets in AWS Secrets Manager..."
# Note: Replace with actual values or set as environment variables
aws secretsmanager create-secret --name supportflow/supabase-url --secret-string "$SUPABASE_URL" --region $REGION 2>/dev/null || \
  aws secretsmanager update-secret --secret-id supportflow/supabase-url --secret-string "$SUPABASE_URL" --region $REGION

aws secretsmanager create-secret --name supportflow/supabase-anon-key --secret-string "$SUPABASE_ANON_KEY" --region $REGION 2>/dev/null || \
  aws secretsmanager update-secret --secret-id supportflow/supabase-anon-key --secret-string "$SUPABASE_ANON_KEY" --region $REGION

aws secretsmanager create-secret --name supportflow/elevenlabs-api-key --secret-string "$ELEVENLABS_API_KEY" --region $REGION 2>/dev/null || \
  aws secretsmanager update-secret --secret-id supportflow/elevenlabs-api-key --secret-string "$ELEVENLABS_API_KEY" --region $REGION

echo "Secrets configured!"
echo ""

# Step 4: Deploy CloudFormation Stack
echo "Step 4: Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file aws/cloudformation-template.yml \
  --stack-name $STACK_NAME \
  --parameter-overrides Environment=production \
  --capabilities CAPABILITY_IAM \
  --region $REGION

echo "CloudFormation stack deployed!"
echo ""

# Step 5: Register ECS Task Definition
echo "Step 5: Registering ECS Task Definition..."
# Update the task definition with the ECR URI
sed "s|YOUR_ECR_REPOSITORY:latest|$ECR_URI:latest|g" aws/ecs-task-definition.json > /tmp/task-def.json
TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file:///tmp/task-def.json --region $REGION --query 'taskDefinition.taskDefinitionArn' --output text)
echo "Task Definition registered: $TASK_DEF_ARN"
echo ""

# Step 6: Create or Update ECS Service
echo "Step 6: Creating/Updating ECS Service..."
# Get VPC and subnet information from CloudFormation stack
VPC_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='VPC'].OutputValue" --output text --region $REGION)
SUBNETS=$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --query "StackResources[?ResourceType=='AWS::EC2::Subnet'].PhysicalResourceId" --output text --region $REGION | tr '\t' ',')
SECURITY_GROUP=$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --query "StackResources[?LogicalResourceId=='ECSSecurityGroup'].PhysicalResourceId" --output text --region $REGION)
TARGET_GROUP=$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --query "StackResources[?LogicalResourceId=='TargetGroup'].PhysicalResourceId" --output text --region $REGION)

# Check if service exists
if aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $REGION 2>/dev/null | grep -q "ACTIVE"; then
  echo "Updating existing service..."
  aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --task-definition $TASK_DEF_ARN \
    --region $REGION
else
  echo "Creating new service..."
  aws ecs create-service \
    --cluster $ECS_CLUSTER \
    --service-name $ECS_SERVICE \
    --task-definition $TASK_DEF_ARN \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TARGET_GROUP,containerName=supportflow,containerPort=3000" \
    --region $REGION
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Load Balancer URL:"
aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerURL'].OutputValue" --output text --region $REGION
echo ""
echo "CloudFront URL:"
aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text --region $REGION
echo ""

