"""
Management command to download and install Google Fonts for text rendering.
"""

import os
import requests
from urllib.parse import urlparse
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Download and install Google Fonts for text rendering.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fonts-dir',
            type=str,
            default='apps/designs/static/designs/fonts',
            help='Directory to store font files',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite existing font files',
        )

    def handle(self, *args, **options):
        fonts_dir = options['fonts_dir']
        force = options['force']

        os.makedirs(fonts_dir, exist_ok=True)

        self.stdout.write('=' * 50)
        self.stdout.write('Google Fonts Installation')
        self.stdout.write('=' * 50)

        # Define fonts to download with their Google Fonts URLs
        fonts_to_download = [
            {
                'name': 'Open Sans Regular',
                'filename': 'open-sans-regular.ttf',
                'url': 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4.ttf'
            },
            {
                'name': 'Open Sans Bold',
                'filename': 'open-sans-bold.ttf',
                'url': 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4.ttf'
            },
            {
                'name': 'Open Sans Italic',
                'filename': 'open-sans-italic.ttf',
                'url': 'https://fonts.gstatic.com/s/opensans/v34/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk5s.ttf'
            },
            {
                'name': 'Roboto Regular',
                'filename': 'roboto-regular.ttf',
                'url': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf'
            },
            {
                'name': 'Roboto Bold',
                'filename': 'roboto-bold.ttf',
                'url': 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf'
            },
            {
                'name': 'Source Serif Pro Regular',
                'filename': 'source-serif-regular.ttf',
                'url': 'https://fonts.gstatic.com/s/sourceserifpro/v15/6xK1dSBYKcSV-LCoeQqfX1RYOo3qPZ7qsDJB9cme.ttf'
            },
            {
                'name': 'Source Serif Pro Bold',
                'filename': 'source-serif-bold.ttf',
                'url': 'https://fonts.gstatic.com/s/sourceserifpro/v15/6xKydSBYKcSV-LCoeQqfX1RYOo3qPZZMqSx4jcmeSQ.ttf'
            },
            {
                'name': 'Source Serif Pro Italic',
                'filename': 'source-serif-italic.ttf',
                'url': 'https://fonts.gstatic.com/s/sourceserifpro/v15/6xK3dSBYKcSV-LCoeQqfX1RYOo3qPZ7vADRBkcmeSXxx.ttf'
            },
            {
                'name': 'Playfair Display Regular',
                'filename': 'playfair-regular.ttf',
                'url': 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDYbtXK-F2qO0g.ttf'
            },
            {
                'name': 'Playfair Display Bold',
                'filename': 'playfair-bold.ttf',
                'url': 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDYbtXK-F2qO0g.ttf'
            },
            {
                'name': 'Source Code Pro Regular',
                'filename': 'source-code-regular.ttf',
                'url': 'https://fonts.gstatic.com/s/sourcecodepro/v22/HI_SiYsKILxRpg3hIP6sJ7fM7PqPMcMnZFqUwX28DMyQ.ttf'
            },
            {
                'name': 'JetBrains Mono Bold',
                'filename': 'jetbrains-mono-bold.ttf',
                'url': 'https://fonts.gstatic.com/s/jetbrainsmono/v13/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yK10blQ.ttf'
            }
        ]

        downloaded_count = 0
        skipped_count = 0
        error_count = 0

        for font_info in fonts_to_download:
            try:
                result = self._download_font(font_info, fonts_dir, force)
                
                if result == 'downloaded':
                    downloaded_count += 1
                elif result == 'skipped':
                    skipped_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                self.stderr.write(f"Error downloading font {font_info['name']}: {e}")
                error_count += 1

        # Summary
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write('INSTALLATION SUMMARY:')
        self.stdout.write(f"Fonts processed: {len(fonts_to_download)}")
        self.stdout.write(f"Downloaded: {downloaded_count}")
        self.stdout.write(f"Skipped: {skipped_count}")
        self.stdout.write(f"Errors: {error_count}")
        
        if downloaded_count > 0:
            self.stdout.write('\nFont installation complete!')
            self.stdout.write('Fonts are now available for text rendering.')
        
        # Show next steps
        self.stdout.write('\nNext steps:')
        self.stdout.write('1. Test font rendering: python manage.py test_font_rendering')
        self.stdout.write('2. Create some drafts with text layers')
        self.stdout.write('3. Request preview renders to see fonts in action')

    def _download_font(self, font_info, fonts_dir, force):
        """Download a single font file."""
        
        name = font_info['name']
        filename = font_info['filename']
        url = font_info['url']
        
        file_path = os.path.join(fonts_dir, filename)
        
        self.stdout.write(f"\nProcessing: {name}")
        
        # Check if file already exists
        if os.path.exists(file_path) and not force:
            self.stdout.write(f"  File exists: {filename}")
            return 'skipped'
        
        try:
            # Download the font
            self.stdout.write(f"  Downloading: {url}")
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            # Save to file
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Verify file size
            file_size = os.path.getsize(file_path)
            if file_size < 1000:  # Less than 1KB is probably an error
                raise ValueError(f"Downloaded file too small: {file_size} bytes")
            
            self.stdout.write(f"  Saved: {filename} ({file_size:,} bytes)")
            return 'downloaded'
            
        except requests.RequestException as e:
            self.stderr.write(f"  Network error: {e}")
            return 'error'
        except Exception as e:
            self.stderr.write(f"  Error: {e}")
            return 'error'