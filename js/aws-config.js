// AWS Configuration for public customer site
const awsConfig = {
    "aws_project_region": "us-east-2",
    "aws_cognito_identity_pool_id": "us-east-2:099c5276-e823-4b19-868a-20f62c653782",
    "aws_cognito_region": "us-east-2",
    "aws_appsync_graphqlEndpoint": "https://364vw33yefgirm4lhvwegdop4a.appsync-api.us-east-2.amazonaws.com/graphql",
    "aws_appsync_region": "us-east-2",
    "aws_appsync_authenticationType": "AWS_IAM", // Changed for public access
    "aws_user_files_s3_bucket": "sugarbowl-admin-imagesc1ae6-dev",
    "aws_user_files_s3_bucket_region": "us-east-2"
};

export default awsConfig;
