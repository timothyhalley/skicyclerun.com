#!/bin/bash
set -e

# 1. Get Account ID
echo "Fetching AWS Account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$ACCOUNT_ID" ]; then
    echo "Error: Could not get AWS Account ID. Make sure 'aws configure' is set up."
    exit 1
fi
echo "Deploying to Account: $ACCOUNT_ID"

# 2. Zip the lambda
echo "Zipping Lambda function..."
zip -j scripts/auto-confirm-user.zip scripts/auto-confirm-user.js

# 3. Create Role (Ignore error if exists)
echo "Creating IAM Role..."
aws iam create-role --role-name CognitoAutoConfirmRole --assume-role-policy-document '{"Version": "2012-10-17","Statement": [{ "Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]}' 2>/dev/null || echo "Role already exists, continuing..."

# 4. Attach Policy
echo "Attaching Policy..."
aws iam attach-role-policy --role-name CognitoAutoConfirmRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

echo "Waiting 10s for role propagation..."
sleep 10

# 5. Create Function (or update if exists)
echo "Deploying Lambda Function..."
aws lambda create-function --function-name SkiCycleRun_AutoConfirm --runtime nodejs18.x --handler auto-confirm-user.handler --role arn:aws:iam::$ACCOUNT_ID:role/CognitoAutoConfirmRole --zip-file fileb://scripts/auto-confirm-user.zip 2>/dev/null || \
aws lambda update-function-code --function-name SkiCycleRun_AutoConfirm --zip-file fileb://scripts/auto-confirm-user.zip

# 6. Add Permission (Ignore error if exists)
echo "Adding Cognito Permission..."
aws lambda add-permission --function-name SkiCycleRun_AutoConfirm --statement-id "CognitoInvoke" --action "lambda:InvokeFunction" --principal cognito-idp.amazonaws.com --source-arn arn:aws:cognito-idp:us-west-2:$ACCOUNT_ID:userpool/us-west-2_nkPiRBTSr 2>/dev/null || echo "Permission already exists..."

# 7. Update User Pool
echo "Linking Lambda to User Pool..."
aws cognito-idp update-user-pool --user-pool-id us-west-2_nkPiRBTSr --lambda-config PreSignUp=arn:aws:lambda:us-west-2:$ACCOUNT_ID:function:SkiCycleRun_AutoConfirm

echo "---------------------------------------------------"
echo "✅ Success! Auto-Confirm Lambda deployed and linked."
echo "New users will now be automatically confirmed."
echo "---------------------------------------------------"
