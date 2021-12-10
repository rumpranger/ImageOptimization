# Automatic image resizing and optimization using lambda@edge / cloudfront / webp

## Caveat

This is a quick and dirty POC meant to demonstrate capability. There are better ways to accomplish most of the following; I urge you to find and share them. (The node code, S3 Policies, CDK integration, iam roles, permissions etc could all use improvement)

## Implementation steps

* Install docker
* Edit the origin-response-function/handler.js to use the correct bucket
* Edit the CloudFormation/template.yml to use the correct folder in the package bucket. We need to store the zip's here because the response handler is over 10mb when zipped and won'r upload manually to CloudFormation arn:aws:s3:::CORP-image-optimization-services
* In terminal enter the project sub directory eg: google.com
* Run the commands from the commands.sh file - These build + bundle the required node packages
* Upload the freshly created zip files from the zip folder to the corresponding folder in the following s3 bucket: arn:aws:s3:::CORP-image-optimization-services
* Open up AWS/CloudFormation in your browser
* Click on "Create Stack"
* Select upload a template
* Select the template.yml file from the CloudFormation folder - the other one will create a new cloudfront distribution - optional 
* Click "next"
* Enter a descriptive name ie: super-webp-resize-optimization
* Follow through to creation (you can leave the fields blank) checking the aknowledgements and finishing with "create stack"
* Wait a few minutes for the stack to build
* Verify that the lambda functions were created (keep that tab open, you will need the ARN's) https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions
* Go to the viewer request function and click on the permissions tab
* From there click on the role and copy the ARN from within IAM
* Open the S3 bucket 
* Click on permissions
* In the grantee section verify that "Everyone" has list object access (this is probably a BAD idea)
* Go to the policy section
* Update the policy using the template located in S3/policy.json using the ROLE ARN you copied above
* Select the distribution to be modified in CloudFront and choose modify https://console.aws.amazon.com/cloudfront/home?region=us-east-1#
* Go to the behaviors tab and edit the existing behavior(s) 
* Scroll down to "Lambda Function Associations"
* Add a new Viewer Request 
* Input the corresponding lambda ARN - *TRICKY*
* * Go to Lambda, select the viewer request function 
* * Click "view details"
* * Copy the ARN top right
* * Verify the version is appended to the end - :1 or :2 etc.
* * If the Version is not appended, add it now - default should be :1
* Add a new Origin Response
* Input the corresponding lambda ARN - *TRICKY*
* * Go to Lambda, select the origin response function 
* * Click "view details"
* * Copy the ARN top right
* * Verify the version is appended to the end - :1 or :2 etc.
* * If the Version is not appended, add it now - default should be :1
* Click "Yes edit"
* Open the website and verify everything works as expected

## Notes

1. Will only output webp - you can add other extensions as you wish
2. Potential to be abused - any dimensions appended to the end of an image will trigger image creation



### References:

* https://awesome.commutatus.com/domains/engineering/efficient/cloudfront-image-conversion.html
* https://aws.amazon.com/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/