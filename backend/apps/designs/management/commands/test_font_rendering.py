"""
Management command to test font rendering functionality.
"""

import os
from django.core.management.base import BaseCommand
from django.conf import settings
from PIL import Image, ImageDraw, ImageFont


class Command(BaseCommand):
    help = 'Test font rendering functionality with sample text.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--font-family',
            type=str,
            default=None,
            help='Specific font family to test (e.g., "sans-serif", "arial")',
        )
        parser.add_argument(
            '--font-size',
            type=int,
            default=24,
            help='Font size to test (default: 24)',
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default='font_test_output',
            help='Directory to save test images',
        )
        parser.add_argument(
            '--text',
            type=str,
            default='The quick brown fox jumps over the lazy dog',
            help='Test text to render',
        )

    def handle(self, *args, **options):
        font_family = options['font_family']
        font_size = options['font_size']
        output_dir = options['output_dir']
        test_text = options['text']

        os.makedirs(output_dir, exist_ok=True)

        self.stdout.write('=' * 50)
        self.stdout.write('Font Rendering Test')
        self.stdout.write('=' * 50)

        # Get font configuration
        font_config = getattr(settings, 'RENDERING_FONTS', {})
        if not font_config:
            self.stderr.write("No RENDERING_FONTS configuration found in settings")
            return

        # Test specific font family or all families
        families_to_test = [font_family] if font_family else font_config.keys()

        success_count = 0
        error_count = 0

        for family in families_to_test:
            self.stdout.write(f"\nTesting font family: {family}")
            
            if family not in font_config:
                self.stderr.write(f"  Font family '{family}' not found in configuration")
                error_count += 1
                continue

            try:
                success = self._test_font_family(
                    family, font_config[family], font_size, test_text, output_dir
                )
                if success:
                    success_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                self.stderr.write(f"  Error testing {family}: {e}")
                error_count += 1

        # Summary
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write('TEST SUMMARY:')
        self.stdout.write(f"Font families tested: {len(families_to_test)}")
        self.stdout.write(f"Successful: {success_count}")
        self.stdout.write(f"Errors: {error_count}")
        
        if success_count > 0:
            self.stdout.write(f"\nTest images saved to: {os.path.abspath(output_dir)}")

    def _test_font_family(self, family_name, family_config, font_size, text, output_dir):
        """Test rendering a specific font family."""
        
        weights = ['regular', 'bold', 'italic'] if 'bold' in family_config or 'italic' in family_config else ['regular']
        weights = [w for w in weights if w in family_config]
        
        self.stdout.write(f"  Available weights: {', '.join(weights)}")
        
        for weight in weights:
            try:
                # Load font
                font_path = family_config[weight]
                
                # Try absolute path first, then relative to project root
                if not os.path.isabs(font_path):
                    font_path = os.path.join(os.getcwd(), font_path)
                
                if not os.path.exists(font_path):
                    # Try fallback fonts
                    fallback_fonts = family_config.get('fallback', [])
                    font_loaded = False
                    
                    for fallback in fallback_fonts:
                        try:
                            if not fallback.endswith(('.ttf', '.otf')):
                                continue
                            fallback_path = os.path.join(os.path.dirname(font_path), fallback)
                            if os.path.exists(fallback_path):
                                font_path = fallback_path
                                font_loaded = True
                                break
                        except:
                            continue
                    
                    if not font_loaded:
                        self.stdout.write(f"    {weight}: Font file not found: {font_path}")
                        continue
                
                # Load the font
                try:
                    font = ImageFont.truetype(font_path, size=font_size)
                except Exception:
                    # Fallback to default font
                    font = ImageFont.load_default()
                    self.stdout.write(f"    {weight}: Using default font (original font failed to load)")
                
                # Create test image
                img_width = 800
                img_height = 200
                image = Image.new('RGBA', (img_width, img_height), (255, 255, 255, 255))
                draw = ImageDraw.Draw(image)
                
                # Draw text
                text_color = (0, 0, 0, 255)  # Black
                x, y = 50, 50
                
                # Draw with outline for better visibility
                outline_color = (255, 255, 255, 255)  # White outline
                for adj_x in [-1, 0, 1]:
                    for adj_y in [-1, 0, 1]:
                        if adj_x != 0 or adj_y != 0:
                            draw.text((x + adj_x, y + adj_y), text, font=font, fill=outline_color)
                
                draw.text((x, y), text, font=font, fill=text_color)
                
                # Add font info
                info_text = f"Font: {family_name} {weight} | Size: {font_size}px | File: {os.path.basename(font_path)}"
                info_font = ImageFont.load_default()
                draw.text((x, y + 80), info_text, font=info_font, fill=(128, 128, 128, 255))
                
                # Save image
                output_filename = f"{family_name}_{weight}_{font_size}px.png"
                output_path = os.path.join(output_dir, output_filename)
                image.save(output_path, 'PNG')
                
                self.stdout.write(f"    {weight}: ✓ Rendered successfully → {output_filename}")
                
            except Exception as e:
                self.stdout.write(f"    {weight}: ✗ Error - {e}")
                return False
        
        return True