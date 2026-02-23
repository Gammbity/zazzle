"""
Management command to create sample draft data for testing and development.
"""

import uuid
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction

from apps.designs.models import Draft, DraftAsset
from apps.products.models import ProductType, ProductVariant


User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample draft data for testing and development.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=3,
            help='Number of users to create drafts for (default: 3)',
        )
        parser.add_argument(
            '--drafts-per-user',
            type=int,
            default=5,
            help='Number of drafts per user (default: 5)',
        )
        parser.add_argument(
            '--assets-per-draft',
            type=int,
            default=2,
            help='Maximum assets per draft (default: 2)',
        )

    def handle(self, *args, **options):
        num_users = options['users']
        drafts_per_user = options['drafts_per_user']
        max_assets_per_draft = options['assets_per_draft']

        # Check if we have product data
        product_types = list(ProductType.objects.all())
        if not product_types:
            self.stderr.write(
                self.style.ERROR(
                    'No ProductType objects found. Please create product data first.'
                )
            )
            return

        product_variants = list(ProductVariant.objects.all())
        if not product_variants:
            self.stderr.write(
                self.style.ERROR(
                    'No ProductVariant objects found. Please create product data first.'
                )
            )
            return

        # Get or create test users
        users = []
        for i in range(num_users):
            username = f'testuser{i+1}'
            email = f'testuser{i+1}@example.com'
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': f'Test',
                    'last_name': f'User {i+1}',
                }
            )
            users.append(user)
            
            if created:
                self.stdout.write(f'Created user: {username}')

        # Sample text layers for draft creation
        sample_text_layers = [
            [
                {
                    "id": "text1",
                    "text": "Custom Design",
                    "x": 100,
                    "y": 50,
                    "font_size": 24,
                    "color": "#000000",
                    "font_family": "Arial",
                    "weight": "bold"
                }
            ],
            [
                {
                    "id": "text1",
                    "text": "Your Brand",
                    "x": 50,
                    "y": 30,
                    "font_size": 32,
                    "color": "#FF0000",
                    "font_family": "Helvetica",
                    "weight": "normal"
                },
                {
                    "id": "text2",
                    "text": "Professional Quality",
                    "x": 60,
                    "y": 80,
                    "font_size": 16,
                    "color": "#333333",
                    "font_family": "Georgia",
                    "style": "italic"
                }
            ],
            [
                {
                    "id": "text1",
                    "text": "Made to Order",
                    "x": 75,
                    "y": 45,
                    "font_size": 28,
                    "color": "#0066CC",
                    "font_family": "Times",
                    "weight": "bold"
                }
            ],
        ]

        # Sample editor states
        sample_editor_states = [
            {
                "zoom": 1.0,
                "pan_x": 0,
                "pan_y": 0,
                "selected_layer": "text1",
                "tool": "text",
                "canvas_width": 400,
                "canvas_height": 300
            },
            {
                "zoom": 1.2,
                "pan_x": -20,
                "pan_y": 10,
                "selected_layer": None,
                "tool": "select",
                "canvas_width": 400,
                "canvas_height": 300,
                "grid_visible": True
            },
            {
                "zoom": 0.8,
                "pan_x": 15,
                "pan_y": -5,
                "selected_layer": "text2",
                "tool": "text",
                "canvas_width": 400,
                "canvas_height": 300,
                "guides_visible": True
            },
        ]

        draft_names = [
            "Summer Collection Design",
            "Corporate Branding",
            "Birthday Party Theme",
            "Wedding Anniversary",
            "Sports Team Logo",
            "Holiday Greeting",
            "Motivational Quote",
            "Family Reunion",
            "Business Card Design",
            "Event Promotion",
        ]

        created_drafts = 0
        created_assets = 0

        with transaction.atomic():
            for user in users:
                self.stdout.write(f'Creating drafts for user: {user.username}')
                
                for draft_num in range(drafts_per_user):
                    # Select random product type and variant
                    product_type = random.choice(product_types)
                    
                    # Get variants for this product type
                    type_variants = [v for v in product_variants if v.product_type == product_type]
                    if not type_variants:
                        continue
                    
                    product_variant = random.choice(type_variants)
                    
                    # Create draft
                    draft = Draft.objects.create(
                        uuid=uuid.uuid4(),
                        customer=user,
                        product_type=product_type,
                        product_variant=product_variant,
                        name=random.choice(draft_names) + f" #{draft_num + 1}",
                        text_layers=random.choice(sample_text_layers),
                        editor_state=random.choice(sample_editor_states),
                        status=random.choice(['draft', 'preview_rendering', 'preview_ready']),
                    )
                    created_drafts += 1

                    # Create 0-2 sample assets for this draft
                    num_assets = random.randint(0, max_assets_per_draft)
                    
                    for asset_num in range(num_assets):
                        asset = DraftAsset.objects.create(
                            uuid=uuid.uuid4(),
                            draft=draft,
                            original_filename=f"sample_asset_{asset_num + 1}.png",
                            s3_key=f"drafts/{user.id}/{draft.uuid}/sample_asset_{asset_num + 1}.png",
                            content_type="image/png",
                            file_size=random.randint(50000, 2000000),  # 50KB to 2MB
                            width=random.randint(800, 2400),
                            height=random.randint(600, 1800),
                            asset_type=random.choice(['image', 'graphic', 'logo', 'background']),
                            transform={
                                "x": random.randint(0, 200),
                                "y": random.randint(0, 150),
                                "scale_x": round(random.uniform(0.5, 2.0), 2),
                                "scale_y": round(random.uniform(0.5, 2.0), 2),
                                "rotation": random.randint(0, 360),
                            },
                            z_index=asset_num + 1,
                        )
                        created_assets += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created:\n'
                f'  - Users: {len(users)} (may include existing)\n'
                f'  - Drafts: {created_drafts}\n'
                f'  - Assets: {created_assets}'
            )
        )

        # Show some statistics
        total_drafts = Draft.objects.count()
        total_assets = DraftAsset.objects.count()
        
        self.stdout.write(
            f'\nDatabase totals:\n'
            f'  - Total drafts: {total_drafts}\n'
            f'  - Total assets: {total_assets}'
        )