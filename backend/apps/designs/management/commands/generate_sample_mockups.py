"""
Management command to generate sample mockup template images for testing.
"""

import os
from django.core.management.base import BaseCommand
from django.conf import settings
from PIL import Image, ImageDraw, ImageFont


class Command(BaseCommand):
    help = 'Generate sample mockup template images for testing.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='apps/designs/static/designs/mockups',
            help='Directory to save generated images',
        )
        parser.add_argument(
            '--size',
            type=str,
            default='1200x1200',
            help='Image size in WxH format (default: 1200x1200)',
        )

    def handle(self, *args, **options):
        output_dir = options['output_dir']
        size_str = options['size']

        # Parse size
        try:
            width, height = map(int, size_str.split('x'))
        except ValueError:
            self.stderr.write('Invalid size format. Use WxH (e.g., 1200x1200)')
            return

        os.makedirs(output_dir, exist_ok=True)

        self.stdout.write('=' * 50)
        self.stdout.write('Generating Sample Mockup Templates')
        self.stdout.write('=' * 50)

        templates = [
            {
                'name': 'tshirt_front.png',
                'title': 'T-Shirt Front View',
                'design_area': {'x': 300, 'y': 200, 'width': 600, 'height': 700},
                'color': '#E8E8E8'
            },
            {
                'name': 'tshirt_back.png',
                'title': 'T-Shirt Back View',
                'design_area': {'x': 300, 'y': 200, 'width': 600, 'height': 700},
                'color': '#E0E0E0'
            },
            {
                'name': 'mug_standard.png',
                'title': 'Coffee Mug Standard View',
                'design_area': {'x': 400, 'y': 300, 'width': 400, 'height': 300},
                'color': '#FFFFFF'
            },
            {
                'name': 'business_card_front.png',
                'title': 'Business Card Front',
                'design_area': {'x': 250, 'y': 350, 'width': 700, 'height': 400},
                'color': '#F5F5F5'
            },
            {
                'name': 'calendar_monthly.png',
                'title': 'Desk Calendar Monthly View',
                'design_area': {'x': 200, 'y': 150, 'width': 800, 'height': 600},
                'color': '#FAFAFA'
            }
        ]

        generated_count = 0

        for template in templates:
            try:
                file_path = os.path.join(output_dir, template['name'])
                
                self.stdout.write(f"\nGenerating: {template['title']}")
                
                # Create base image
                img = Image.new('RGBA', (width, height), (255, 255, 255, 0))
                draw = ImageDraw.Draw(img)
                
                # Draw mockup background based on template type
                if 'tshirt' in template['name']:
                    self._draw_tshirt_mockup(img, draw, template, width, height)
                elif 'mug' in template['name']:
                    self._draw_mug_mockup(img, draw, template, width, height)
                elif 'business_card' in template['name']:
                    self._draw_business_card_mockup(img, draw, template, width, height)
                elif 'calendar' in template['name']:
                    self._draw_calendar_mockup(img, draw, template, width, height)
                
                # Draw design area outline (for reference, can be removed)
                area = template['design_area']
                self._draw_design_area_guide(
                    draw, area['x'], area['y'], area['width'], area['height']
                )
                
                # Save image
                img.save(file_path, 'PNG')
                file_size = os.path.getsize(file_path)
                
                self.stdout.write(f'  ✅ Saved: {template["name"]} ({file_size:,} bytes)')
                self.stdout.write(f'     Design area: {area["width"]}x{area["height"]} at ({area["x"]}, {area["y"]})')
                
                generated_count += 1
                
            except Exception as e:
                self.stderr.write(f'  ❌ Failed to generate {template["name"]}: {e}')

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(f'Generated {generated_count} mockup templates')
        
        if generated_count > 0:
            self.stdout.write('\nNext steps:')
            self.stdout.write('1. Upload templates to S3: python manage.py upload_mockup_templates')
            self.stdout.write('2. Create sample drafts: python manage.py create_sample_drafts')
            self.stdout.write('3. Test rendering: Create a draft and request a preview')
            
        self.stdout.write('\nNote: Generated images are simple placeholders.')
        self.stdout.write('For production, use professional mockup images.')

    def _draw_tshirt_mockup(self, img, draw, template, width, height):
        """Draw a simple t-shirt mockup."""
        # T-shirt body (simplified)
        body_color = template['color']
        
        # Main body rectangle
        body_left = width // 4
        body_right = 3 * width // 4
        body_top = height // 8
        body_bottom = 7 * height // 8
        
        draw.rectangle(
            [body_left, body_top, body_right, body_bottom],
            fill=body_color,
            outline='#CCCCCC',
            width=2
        )
        
        # Sleeves
        sleeve_width = width // 8
        # Left sleeve
        draw.rectangle(
            [body_left - sleeve_width, body_top + height // 16, body_left, body_top + height // 4],
            fill=body_color,
            outline='#CCCCCC',
            width=2
        )
        # Right sleeve
        draw.rectangle(
            [body_right, body_top + height // 16, body_right + sleeve_width, body_top + height // 4],
            fill=body_color,
            outline='#CCCCCC',
            width=2
        )
        
        # Neck
        neck_width = width // 12
        neck_height = height // 20
        neck_left = width // 2 - neck_width // 2
        neck_right = width // 2 + neck_width // 2
        
        draw.arc(
            [neck_left, body_top - neck_height, neck_right, body_top + neck_height],
            start=0, end=180,
            fill='#CCCCCC',
            width=3
        )

    def _draw_mug_mockup(self, img, draw, template, width, height):
        """Draw a simple mug mockup."""
        mug_color = template['color']
        
        # Mug body (cylinder viewed from angle)
        body_left = width // 3
        body_right = 2 * width // 3
        body_top = height // 4
        body_bottom = 3 * height // 4
        
        # Main body
        draw.rectangle(
            [body_left, body_top, body_right, body_bottom],
            fill=mug_color,
            outline='#AAAAAA',
            width=2
        )
        
        # Handle
        handle_left = body_right + 20
        handle_right = body_right + 60
        handle_top = body_top + height // 8
        handle_bottom = body_bottom - height // 8
        
        draw.arc(
            [handle_left, handle_top, handle_right, handle_bottom],
            start=270, end=90,
            fill=None,
            outline='#AAAAAA',
            width=8
        )
        
        # Rim
        draw.ellipse(
            [body_left, body_top - 10, body_right, body_top + 10],
            fill='#F0F0F0',
            outline='#AAAAAA',
            width=2
        )

    def _draw_business_card_mockup(self, img, draw, template, width, height):
        """Draw a simple business card mockup."""
        card_color = template['color']
        
        # Card with perspective
        card_left = width // 6
        card_right = 5 * width // 6
        card_top = height // 3
        card_bottom = 2 * height // 3
        
        # Card body
        draw.rectangle(
            [card_left, card_top, card_right, card_bottom],
            fill=card_color,
            outline='#CCCCCC',
            width=2
        )
        
        # Shadow for depth
        shadow_offset = 15
        draw.rectangle(
            [card_left + shadow_offset, card_top + shadow_offset, 
             card_right + shadow_offset, card_bottom + shadow_offset],
            fill='#E0E0E0',
            outline=None
        )
        
        # Redraw card on top
        draw.rectangle(
            [card_left, card_top, card_right, card_bottom],
            fill=card_color,
            outline='#CCCCCC',
            width=2
        )

    def _draw_calendar_mockup(self, img, draw, template, width, height):
        """Draw a simple desk calendar mockup."""
        calendar_color = template['color']
        
        # Calendar base
        base_left = width // 8
        base_right = 7 * width // 8
        base_top = height // 6
        base_bottom = 5 * height // 6
        
        # Main calendar body
        draw.rectangle(
            [base_left, base_top, base_right, base_bottom],
            fill=calendar_color,
            outline='#AAAAAA',
            width=2
        )
        
        # Stand/base
        stand_left = 2 * width // 5
        stand_right = 3 * width // 5
        stand_top = base_bottom - 20
        stand_bottom = base_bottom + 40
        
        draw.rectangle(
            [stand_left, stand_top, stand_right, stand_bottom],
            fill='#D0D0D0',
            outline='#AAAAAA',
            width=2
        )
        
        # Spiral binding (decorative)
        for i in range(5):
            x = base_left + (i + 1) * (base_right - base_left) // 6
            draw.circle([x, base_top - 10], 8, fill='#888888', outline='#666666')

    def _draw_design_area_guide(self, draw, x, y, w, h):
        """Draw a guide rectangle for the design area."""
        # Light blue dashed outline
        outline_color = '#4A90E2'
        
        # Draw dashed rectangle
        dash_length = 20
        gap_length = 10
        
        # Top edge
        for i in range(0, w, dash_length + gap_length):
            end = min(i + dash_length, w)
            draw.rectangle([x + i, y - 2, x + end, y + 2], fill=outline_color)
        
        # Bottom edge
        for i in range(0, w, dash_length + gap_length):
            end = min(i + dash_length, w)
            draw.rectangle([x + i, y + h - 2, x + end, y + h + 2], fill=outline_color)
        
        # Left edge
        for i in range(0, h, dash_length + gap_length):
            end = min(i + dash_length, h)
            draw.rectangle([x - 2, y + i, x + 2, y + end], fill=outline_color)
        
        # Right edge
        for i in range(0, h, dash_length + gap_length):
            end = min(i + dash_length, h)
            draw.rectangle([x + w - 2, y + i, x + w + 2, y + end], fill=outline_color)