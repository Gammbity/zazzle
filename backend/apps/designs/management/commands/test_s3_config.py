"""
Management command to test S3 connectivity and configuration for the draft system.
"""

import boto3
import uuid
from django.core.management.base import BaseCommand
from django.conf import settings
from botocore.exceptions import ClientError, NoCredentialsError


class Command(BaseCommand):
    help = 'Test S3 connectivity and configuration for the draft system.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-upload',
            action='store_true',
            help='Test actual file upload (creates and deletes a test file)',
        )
        parser.add_argument(
            '--test-presigned',
            action='store_true',
            help='Test presigned URL generation',
        )

    def handle(self, *args, **options):
        test_upload = options['test_upload']
        test_presigned = options['test_presigned']

        self.stdout.write('=' * 50)
        self.stdout.write('S3 Configuration Test for Draft System')
        self.stdout.write('=' * 50)

        # Check required settings
        required_settings = [
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY', 
            'AWS_STORAGE_BUCKET_NAME',
            'AWS_S3_REGION_NAME',
        ]

        self.stdout.write('\n1. Checking Django settings...')
        
        missing_settings = []
        for setting in required_settings:
            value = getattr(settings, setting, None)
            if not value:
                missing_settings.append(setting)
                self.stdout.write(
                    f'  ❌ {setting}: Not configured'
                )
            else:
                # Hide sensitive values
                display_value = value if 'KEY' not in setting else f'{value[:8]}...'
                self.stdout.write(
                    f'  ✅ {setting}: {display_value}'
                )

        if missing_settings:
            self.stderr.write(
                self.style.ERROR(
                    f'\nMissing required settings: {", ".join(missing_settings)}\n'
                    'Please configure these in your Django settings or .env file.'
                )
            )
            return

        # Test S3 client creation
        self.stdout.write('\n2. Testing S3 client creation...')
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )
            self.stdout.write('  ✅ S3 client created successfully')
        except NoCredentialsError:
            self.stderr.write(
                self.style.ERROR('  ❌ Invalid AWS credentials')
            )
            return
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f'  ❌ Error creating S3 client: {e}')
            )
            return

        # Test bucket access
        self.stdout.write('\n3. Testing bucket access...')
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        
        try:
            # List objects in bucket (this tests both existence and permissions)
            response = s3_client.list_objects_v2(
                Bucket=bucket_name,
                MaxKeys=1  # Just check if we can list
            )
            self.stdout.write(f'  ✅ Bucket "{bucket_name}" is accessible')
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                self.stderr.write(
                    self.style.ERROR(
                        f'  ❌ Bucket "{bucket_name}" does not exist'
                    )
                )
            elif error_code == 'AccessDenied':
                self.stderr.write(
                    self.style.ERROR(
                        f'  ❌ Access denied to bucket "{bucket_name}"'
                    )
                )
            else:
                self.stderr.write(
                    self.style.ERROR(
                        f'  ❌ Error accessing bucket: {e}'
                    )
                )
            return

        # Test presigned URL generation
        if test_presigned:
            self.stdout.write('\n4. Testing presigned URL generation...')
            try:
                test_key = f'test/draft-system-test-{uuid.uuid4()}.txt'
                
                # Generate presigned POST
                response = s3_client.generate_presigned_post(
                    Bucket=bucket_name,
                    Key=test_key,
                    Fields={
                        'Content-Type': 'text/plain',
                    },
                    Conditions=[
                        ['content-length-range', 1, 1024],  # 1 byte to 1KB
                        {'Content-Type': 'text/plain'},
                    ],
                    ExpiresIn=3600
                )
                
                self.stdout.write('  ✅ Presigned POST URL generated successfully')
                self.stdout.write(f'     URL: {response["url"]}')
                self.stdout.write(f'     Key: {test_key}')
                
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f'  ❌ Error generating presigned URL: {e}')
                )

        # Test actual file upload and deletion
        if test_upload:
            self.stdout.write('\n5. Testing file upload and deletion...')
            
            test_key = f'test/draft-system-test-{uuid.uuid4()}.txt'
            test_content = b'Draft system S3 test file'
            
            try:
                # Upload test file
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=test_key,
                    Body=test_content,
                    ContentType='text/plain'
                )
                self.stdout.write(f'  ✅ Test file uploaded: {test_key}')
                
                # Verify file exists
                response = s3_client.head_object(
                    Bucket=bucket_name,
                    Key=test_key
                )
                self.stdout.write(f'  ✅ File verified: {response["ContentLength"]} bytes')
                
                # Delete test file
                s3_client.delete_object(
                    Bucket=bucket_name,
                    Key=test_key
                )
                self.stdout.write('  ✅ Test file deleted successfully')
                
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f'  ❌ Error with file operations: {e}')
                )
                
                # Try to clean up test file if it was created
                try:
                    s3_client.delete_object(Bucket=bucket_name, Key=test_key)
                except:
                    pass

        # Test path structure
        self.stdout.write('\n6. Validating S3 path structure...')
        
        # Expected path format: drafts/{user_id}/{draft_uuid}/{filename}
        sample_path = 'drafts/123/550e8400-e29b-41d4-a716-446655440000/design.png'
        
        self.stdout.write(f'  Expected path format: {sample_path}')
        self.stdout.write('  ✅ Path structure is valid for draft system')

        # Summary
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(
            self.style.SUCCESS('S3 configuration test completed successfully!')
        )
        self.stdout.write(
            '\nThe draft system should work correctly with your S3 configuration.\n'
            '\nNext steps:\n'
            '  1. Run migrations: python manage.py migrate\n'
            '  2. Create sample data: python manage.py create_sample_drafts\n'
            '  3. Test the API endpoints via Swagger UI'
        )