"""
Management command to upload mockup templates to S3 and create database records.
"""

import os
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files.storage import default_storage

import boto3
from PIL import Image

from apps.designs.models import ProductMockupTemplate
from apps.products.models import ProductType


class Command(BaseCommand):
    help = 'Upload mockup templates to S3 and create database records.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--templates-dir',
            type=str,
            default='apps/designs/static/designs/mockups',
            help='Directory containing mockup templates',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be uploaded without actually uploading',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite existing templates',
        )

    def handle(self, *args, **options):
        templates_dir = options['templates_dir']
        dry_run = options['dry_run']
        force = options['force']

        if not os.path.exists(templates_dir):
            self.stderr.write(f"Templates directory not found: {templates_dir}")
            return

        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )

        self.stdout.write('=' * 50)
        self.stdout.write('Mockup Template Upload')
        self.stdout.write('=' * 50)

        # Load template configurations
        config_file = os.path.join(templates_dir, 'templates.json')
        if not os.path.exists(config_file):
            self.stderr.write(f"Template configuration not found: {config_file}")
            self._create_sample_config(config_file)
            return

        with open(config_file, 'r') as f:
            template_configs = json.load(f)

        uploaded_count = 0
        skipped_count = 0
        error_count = 0

        for config in template_configs:
            try:
                result = self._process_template(
                    config, templates_dir, s3_client, dry_run, force
                )
                
                if result == 'uploaded':
                    uploaded_count += 1
                elif result == 'skipped':
                    skipped_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                self.stderr.write(f"Error processing template {config.get('name', 'unknown')}: {e}")
                error_count += 1

        # Summary
        self.stdout.write('\n' + '=' * 50)
        if dry_run:
            self.stdout.write('DRY RUN SUMMARY:')
        else:
            self.stdout.write('UPLOAD SUMMARY:')
        
        self.stdout.write(f"Templates processed: {len(template_configs)}")
        self.stdout.write(f"Uploaded: {uploaded_count}")
        self.stdout.write(f"Skipped: {skipped_count}")
        self.stdout.write(f"Errors: {error_count}")

    def _process_template(self, config, templates_dir, s3_client, dry_run, force):
        """Process a single template configuration."""
        
        # Validate config
        required_fields = ['name', 'product_type', 'image_file', 'design_area']
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Missing required field: {field}")

        name = config['name']
        product_type_name = config['product_type']
        image_file = config['image_file']
        design_area = config['design_area']

        self.stdout.write(f"\nProcessing template: {name}")

        # Get product type
        try:
            product_type = ProductType.objects.get(name=product_type_name)
        except ProductType.DoesNotExist:
            raise ValueError(f"Product type not found: {product_type_name}")

        # Check if template already exists
        existing = ProductMockupTemplate.objects.filter(
            product_type=product_type,
            name=name
        ).first()

        if existing and not force:
            self.stdout.write(f"  Template already exists: {existing.id}")
            return 'skipped'

        # Load and validate image
        image_path = os.path.join(templates_dir, image_file)
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")

        # Get image dimensions
        with Image.open(image_path) as img:
            template_width, template_height = img.size

        self.stdout.write(f"  Image: {image_file} ({template_width}x{template_height})")
        self.stdout.write(f"  Product: {product_type_name}")
        self.stdout.write(f"  Design area: {design_area}")

        if dry_run:
            self.stdout.write("  [DRY RUN] Would upload template")
            return 'uploaded'

        # Generate S3 key
        s3_key = f"mockups/{product_type.id}/{name.lower().replace(' ', '_')}.png"

        # Upload to S3
        with open(image_path, 'rb') as f:
            s3_client.put_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=s3_key,
                Body=f,
                ContentType='image/png',
                CacheControl='max-age=31536000'  # 1 year cache
            )

        self.stdout.write(f"  Uploaded to S3: {s3_key}")

        # Create or update database record
        template_data = {
            'name': name,
            'template_s3_key': s3_key,
            'design_area_x': design_area['x'],
            'design_area_y': design_area['y'],
            'design_area_width': design_area['width'],
            'design_area_height': design_area['height'],
            'template_width': template_width,
            'template_height': template_height,
            'design_rotation': config.get('design_rotation', 0.0),
            'design_opacity': config.get('design_opacity', 1.0),
            'perspective_matrix': config.get('perspective_matrix'),
            'sort_order': config.get('sort_order', 0),
            'is_active': config.get('is_active', True),
        }

        if existing:
            for key, value in template_data.items():
                setattr(existing, key, value)
            existing.save()
            template = existing
            self.stdout.write(f"  Updated database record: {template.id}")
        else:
            template = ProductMockupTemplate.objects.create(
                product_type=product_type,
                **template_data
            )
            self.stdout.write(f"  Created database record: {template.id}")

        return 'uploaded'

    def _create_sample_config(self, config_file):
        """Create a sample templates.json configuration file."""
        
        sample_config = [
            {
                "name": "Front View",
                "product_type": "Classic T-Shirt",
                "image_file": "tshirt_front.png",
                "design_area": {
                    "x": 150,
                    "y": 100,
                    "width": 300,
                    "height": 400
                },
                "design_rotation": 0.0,
                "design_opacity": 0.9,
                "sort_order": 1,
                "is_active": True
            },
            {
                "name": "Back View",
                "product_type": "Classic T-Shirt",
                "image_file": "tshirt_back.png",
                "design_area": {
                    "x": 150,
                    "y": 100,
                    "width": 300,
                    "height": 400
                },
                "design_rotation": 0.0,
                "design_opacity": 0.9,
                "sort_order": 2,
                "is_active": True
            },
            {
                "name": "Standard View",
                "product_type": "Coffee Mug",
                "image_file": "mug_standard.png",
                "design_area": {
                    "x": 80,
                    "y": 120,
                    "width": 200,
                    "height": 150
                },
                "design_rotation": -5.0,
                "design_opacity": 1.0,
                "sort_order": 1,
                "is_active": True,
                "perspective_matrix": [1.0, 0.1, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0]
            },
            {
                "name": "Front Layout",
                "product_type": "Business Card",
                "image_file": "business_card_front.png",
                "design_area": {
                    "x": 50,
                    "y": 50,
                    "width": 300,
                    "height": 180
                },
                "design_rotation": 0.0,
                "design_opacity": 1.0,
                "sort_order": 1,
                "is_active": True
            }
        ]
        
        os.makedirs(os.path.dirname(config_file), exist_ok=True)
        
        with open(config_file, 'w') as f:
            json.dump(sample_config, f, indent=2)
        
        self.stdout.write(f"Created sample configuration: {config_file}")
        self.stdout.write("\nPlease:")
        self.stdout.write("1. Add your mockup template images to the templates directory")
        self.stdout.write("2. Update the configuration with correct file names and design areas")
        self.stdout.write("3. Run this command again to upload templates")
        self.stdout.write("\nTemplate image requirements:")
        self.stdout.write("- PNG format with transparency")
        self.stdout.write("- High resolution (recommended: 2000x2000px or larger)")
        self.stdout.write("- Clear design area where customer artwork will be placed")