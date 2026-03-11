"""
Celery tasks for mockup preview rendering.
"""

import os
import io
import uuid
import logging
import traceback
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

import boto3
from celery import shared_task
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.core.files.storage import default_storage
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from botocore.exceptions import ClientError

from .models import MockupRender, ProductMockupTemplate, Draft, DraftAsset


logger = logging.getLogger(__name__)


@dataclass
class RenderConfig:
    """Configuration for a render job."""
    draft_id: int
    template_id: int
    render_id: str
    output_width: int = 1200
    output_height: int = 1200
    thumbnail_width: int = 400
    thumbnail_height: int = 400
    jpeg_quality: int = 90


class RenderingError(Exception):
    """Custom exception for rendering errors."""
    pass


class S3Manager:
    """Handle S3 operations for rendering."""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', 'test-access-key'),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', 'test-secret-key'),
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1'),
        )
        self.bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'test-bucket')
    
    def download_image(self, s3_key: str) -> Image.Image:
        """Download image from S3 and return PIL Image."""
        try:
            logger.info(f"Downloading image from S3: {s3_key}")
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            image_data = response['Body'].read()
            
            # Open with PIL
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGBA for consistent handling
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            logger.info(f"Downloaded image: {image.size}, mode: {image.mode}")
            return image
            
        except ClientError as e:
            logger.error(f"S3 error downloading {s3_key}: {e}")
            raise RenderingError(f"Failed to download image from S3: {e}")
        except Exception as e:
            logger.error(f"Error opening image {s3_key}: {e}")
            raise RenderingError(f"Failed to open image: {e}")
    
    def upload_image(self, image: Image.Image, s3_key: str, format: str = 'JPEG', 
                     quality: int = 90) -> Dict[str, int]:
        """Upload PIL Image to S3 and return metadata."""
        try:
            logger.info(f"Uploading image to S3: {s3_key}")
            
            # Save to bytes buffer
            buffer = io.BytesIO()
            
            if format.upper() == 'PNG':
                image.save(buffer, format='PNG', optimize=True)
            else:
                # Convert to RGB for JPEG
                if image.mode != 'RGB':
                    rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                    rgb_image.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                    image = rgb_image
                
                image.save(buffer, format='JPEG', quality=quality, optimize=True)
            
            buffer.seek(0)
            file_size = buffer.tell()
            buffer.seek(0)
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=buffer,
                ContentType=f'image/{format.lower()}',
                CacheControl='max-age=31536000'  # 1 year cache
            )
            
            logger.info(f"Uploaded image: {s3_key}, size: {file_size} bytes")
            
            return {
                'width': image.width,
                'height': image.height,
                'file_size': file_size
            }
            
        except Exception as e:
            logger.error(f"Error uploading image {s3_key}: {e}")
            raise RenderingError(f"Failed to upload image: {e}")


class FontManager:
    """Manage fonts for text rendering."""
    
    def __init__(self):
        self.font_cache = {}
        self.default_fonts = {
            'sans-serif': ['Arial.ttf', 'DejaVuSans.ttf', 'Liberation Sans.ttf'],
            'serif': ['Times.ttf', 'DejaVuSerif.ttf', 'Liberation Serif.ttf'],
            'monospace': ['Courier.ttf', 'DejaVuSansMono.ttf', 'Liberation Mono.ttf'],
        }
    
    def get_font(self, family: str, size: int, weight: str = 'normal') -> ImageFont.FreeTypeFont:
        """Get font with fallback to default fonts."""
        cache_key = f"{family}_{size}_{weight}"
        
        if cache_key in self.font_cache:
            return self.font_cache[cache_key]
        
        # Try to load the requested font family
        font_paths = self._get_font_paths(family, weight)
        
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, size=size)
                self.font_cache[cache_key] = font
                logger.debug(f"Loaded font: {font_path}, size: {size}")
                return font
            except OSError:
                continue
        
        # Fallback to default font
        try:
            font = ImageFont.load_default()
            self.font_cache[cache_key] = font
            logger.warning(f"Using default font for {family} {size}px")
            return font
        except:
            raise RenderingError(f"Could not load any font for {family}")
    
    def _get_font_paths(self, family: str, weight: str) -> List[str]:
        """Get possible font file paths for a font family."""
        # Normalize family name
        family_lower = family.lower()
        
        # Map CSS font families to system fonts
        if 'arial' in family_lower or 'helvetica' in family_lower:
            base_fonts = self.default_fonts['sans-serif']
        elif 'times' in family_lower or 'georgia' in family_lower:
            base_fonts = self.default_fonts['serif']
        elif 'courier' in family_lower or 'monaco' in family_lower:
            base_fonts = self.default_fonts['monospace']
        else:
            base_fonts = self.default_fonts['sans-serif']
        
        paths = []
        
        # Add system font directories
        font_dirs = [
            '/System/Library/Fonts/',  # macOS
            '/usr/share/fonts/',  # Linux
            'C:/Windows/Fonts/',  # Windows
            '/usr/local/share/fonts/',  # Local fonts
        ]
        
        for font_name in base_fonts:
            for font_dir in font_dirs:
                if os.path.exists(font_dir):
                    paths.append(os.path.join(font_dir, font_name))
        
        return paths


class TextRenderer:
    """Render text layers onto images."""
    
    def __init__(self):
        self.font_manager = FontManager()
    
    def render_text_layer(self, image: Image.Image, text_layer: Dict) -> Image.Image:
        """Render a single text layer onto an image."""
        try:
            # Extract text properties
            text = text_layer.get('text', '')
            if not text:
                return image
            
            x = text_layer.get('x', 0)
            y = text_layer.get('y', 0)
            font_size = text_layer.get('font_size', 16)
            color = text_layer.get('color', '#000000')
            font_family = text_layer.get('font_family', 'Arial')
            font_weight = text_layer.get('weight', 'normal')
            
            # Validate and clamp font size
            font_size = max(settings.RENDERING_FONT_SIZE_MIN, 
                            min(settings.RENDERING_FONT_SIZE_MAX, font_size))
            
            # Get font
            font = self.font_manager.get_font(font_family, font_size, font_weight)
            
            # Create drawing context
            draw = ImageDraw.Draw(image)
            
            # Convert color
            if isinstance(color, str) and color.startswith('#'):
                color = color[1:]
                if len(color) == 3:
                    color = ''.join([c*2 for c in color])
                color = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
            else:
                color = (0, 0, 0)  # Default black
            
            # Draw text with outline for better visibility
            outline_width = max(1, font_size // 20)
            
            # Draw outline
            for adj_x in range(-outline_width, outline_width + 1):
                for adj_y in range(-outline_width, outline_width + 1):
                    if adj_x != 0 or adj_y != 0:
                        draw.text((x + adj_x, y + adj_y), text, font=font, fill=(255, 255, 255))
            
            # Draw main text
            draw.text((x, y), text, font=font, fill=color)
            
            logger.debug(f"Rendered text: '{text[:20]}...' at ({x}, {y})")
            return image
            
        except Exception as e:
            logger.error(f"Error rendering text layer: {e}")
            raise RenderingError(f"Failed to render text: {e}")


class MockupCompositor:
    """Composite design elements onto mockup templates."""
    
    def __init__(self):
        self.s3_manager = S3Manager()
        self.text_renderer = TextRenderer()
    
    def render_mockup(self, config: RenderConfig) -> Tuple[str, str]:
        """Render complete mockup and return S3 keys for image and thumbnail."""
        try:
            # Load draft and template
            draft = Draft.objects.get(id=config.draft_id)
            template = ProductMockupTemplate.objects.get(id=config.template_id)
            
            logger.info(f"Rendering mockup for draft {draft.uuid} with template {template.name}")
            
            # Download mockup template
            mockup_image = self.s3_manager.download_image(template.template_s3_key)
            
            # Create design canvas
            design_image = self._create_design_canvas(draft, template)
            
            # Composite design onto mockup
            result_image = self._composite_design_on_mockup(design_image, mockup_image, template)
            
            # Resize to target dimensions
            if result_image.size != (config.output_width, config.output_height):
                result_image = result_image.resize(
                    (config.output_width, config.output_height), 
                    Image.Resampling.LANCZOS
                )
            
            # Generate S3 keys
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            base_key = f"renders/{draft.customer.id}/{config.render_id}"
            
            output_key = f"{base_key}/mockup_{timestamp}.jpg"
            thumbnail_key = f"{base_key}/thumb_{timestamp}.jpg"
            
            # Upload full-size image
            metadata = self.s3_manager.upload_image(
                result_image, 
                output_key, 
                format='JPEG', 
                quality=config.jpeg_quality
            )
            
            # Create and upload thumbnail
            thumbnail = result_image.copy()
            thumbnail.thumbnail(
                (config.thumbnail_width, config.thumbnail_height), 
                Image.Resampling.LANCZOS
            )
            
            self.s3_manager.upload_image(
                thumbnail,
                thumbnail_key,
                format='JPEG',
                quality=85
            )
            
            logger.info(f"Rendered mockup successfully: {output_key}")
            
            return output_key, thumbnail_key, metadata
            
        except Exception as e:
            logger.error(f"Error rendering mockup: {e}")
            logger.error(traceback.format_exc())
            raise RenderingError(str(e))
    
    def _create_design_canvas(self, draft: Draft, template: ProductMockupTemplate) -> Image.Image:
        """Create the design canvas with all elements."""
        # Create canvas with template design area size
        canvas = Image.new('RGBA', (template.design_area_width, template.design_area_height), (255, 255, 255, 0))
        
        # Render assets first (behind text)
        assets = DraftAsset.objects.filter(draft=draft).order_by('z_index')
        for asset in assets:
            try:
                asset_image = self.s3_manager.download_image(asset.s3_key)
                canvas = self._composite_asset(canvas, asset_image, asset)
            except Exception as e:
                logger.warning(f"Failed to render asset {asset.uuid}: {e}")
                continue
        
        # Render text layers on top
        for text_layer in draft.text_layers or []:
            canvas = self.text_renderer.render_text_layer(canvas, text_layer)
        
        return canvas
    
    def _composite_asset(self, canvas: Image.Image, asset_image: Image.Image, 
                         asset: DraftAsset) -> Image.Image:
        """Composite an asset onto the canvas with transforms."""
        try:
            transform = asset.transform or {}
            
            # Get transform values
            x = transform.get('x', 0)
            y = transform.get('y', 0)
            scale_x = transform.get('scale_x', 1.0)
            scale_y = transform.get('scale_y', 1.0)
            rotation = transform.get('rotation', 0.0)
            
            # Apply scaling
            if scale_x != 1.0 or scale_y != 1.0:
                new_width = int(asset_image.width * scale_x)
                new_height = int(asset_image.height * scale_y)
                asset_image = asset_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Apply rotation
            if rotation != 0:
                asset_image = asset_image.rotate(rotation, expand=True)
            
            # Paste onto canvas
            if asset_image.mode == 'RGBA':
                canvas.paste(asset_image, (int(x), int(y)), asset_image)
            else:
                canvas.paste(asset_image, (int(x), int(y)))
            
            return canvas
            
        except Exception as e:
            logger.warning(f"Error compositing asset: {e}")
            return canvas
    
    def _composite_design_on_mockup(self, design: Image.Image, mockup: Image.Image, 
                                    template: ProductMockupTemplate) -> Image.Image:
        """Composite the design onto the mockup using template positioning."""
        # Apply perspective transformation if defined
        if template.perspective_matrix:
            design = self._apply_perspective_transform(design, template.perspective_matrix)
        
        # Apply rotation if needed
        if template.design_rotation != 0:
            design = design.rotate(template.design_rotation, expand=True)
        
        # Apply opacity
        if template.design_opacity < 1.0:
            alpha = design.split()[-1] if design.mode == 'RGBA' else None
            if alpha:
                alpha = alpha.point(lambda p: int(p * template.design_opacity))
                design.putalpha(alpha)
        
        # Resize design to fit the template area
        design = design.resize(
            (template.design_area_width, template.design_area_height),
            Image.Resampling.LANCZOS
        )
        
        # Composite onto mockup
        result = mockup.copy()
        
        if design.mode == 'RGBA':
            result.paste(design, (template.design_area_x, template.design_area_y), design)
        else:
            result.paste(design, (template.design_area_x, template.design_area_y))
        
        return result
    
    def _apply_perspective_transform(self, image: Image.Image, matrix: List[float]) -> Image.Image:
        """Apply perspective transformation using the provided matrix."""
        try:
            # PIL perspective transform expects 8 coefficients
            if len(matrix) == 8:
                return image.transform(
                    image.size,
                    Image.Transform.PERSPECTIVE,
                    matrix,
                    Image.Resampling.BICUBIC
                )
        except Exception as e:
            logger.warning(f"Failed to apply perspective transform: {e}")
        
        return image


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def render_draft_preview(self, render_id: str) -> Dict:
    """
    Celery task to render a draft preview.
    
    Args:
        render_id: UUID of the MockupRender instance
    
    Returns:
        dict: Result metadata
    """
    try:
        logger.info(f"Starting render task for {render_id}")
        
        # Get the render job
        try:
            render_lookup = uuid.UUID(str(render_id))
        except (TypeError, ValueError) as exc:
            raise MockupRender.DoesNotExist(f"Render job not found: {render_id}") from exc

        render_job = MockupRender.objects.get(render_id=render_lookup)
        render_job.status = 'processing'
        render_job.task_id = self.request.id
        render_job.processing_started_at = timezone.now()
        render_job.save(update_fields=['status', 'task_id', 'processing_started_at'])
        
        # Create render config
        config = RenderConfig(
            draft_id=render_job.draft.id,
            template_id=render_job.mockup_template.id,
            render_id=render_id,
            output_width=getattr(settings, 'RENDERING_IMAGE_MAX_SIZE', 1200),
            output_height=getattr(settings, 'RENDERING_IMAGE_MAX_SIZE', 1200),
            jpeg_quality=getattr(settings, 'RENDERING_OUTPUT_QUALITY', 90)
        )
        
        # Perform the rendering
        compositor = MockupCompositor()
        output_key, thumbnail_key, metadata = compositor.render_mockup(config)
        
        # Update render job with results
        render_job.status = 'completed'
        render_job.output_image_s3_key = output_key
        render_job.output_thumbnail_s3_key = thumbnail_key
        render_job.output_width = metadata['width']
        render_job.output_height = metadata['height']
        render_job.output_file_size = metadata['file_size']
        render_job.processing_completed_at = timezone.now()
        render_job.save()
        
        logger.info(f"Render task completed successfully for {render_id}")
        
        return {
            'render_id': render_id,
            'status': 'completed',
            'output_key': output_key,
            'thumbnail_key': thumbnail_key,
            'metadata': metadata
        }
        
    except MockupRender.DoesNotExist:
        logger.error(f"Render job not found: {render_id}")
        raise

    except DjangoValidationError as exc:
        logger.error(f"Invalid render identifier {render_id}: {exc}")
        raise MockupRender.DoesNotExist(f"Render job not found: {render_id}") from exc
        
    except Exception as exc:
        logger.error(f"Render task failed for {render_id}: {exc}")
        logger.error(traceback.format_exc())
        
        try:
            render_job = MockupRender.objects.get(render_id=render_id)
            render_job.status = 'failed'
            render_job.error_message = str(exc)[:1000]  # Limit error message length
            render_job.retry_count += 1
            render_job.processing_completed_at = timezone.now()
            render_job.save()
        except:
            pass

        if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            return {
                'render_id': render_id,
                'status': 'failed',
                'error': str(exc)
            }
        
        # Retry if we haven't exceeded max retries
        if self.request.retries < self.max_retries:
            # Exponential backoff
            delay = 60 * (2 ** self.request.retries)
            logger.info(f"Retrying render task {render_id} in {delay} seconds")
            raise self.retry(exc=exc, countdown=delay)
        
        # Max retries exceeded
        logger.error(f"Max retries exceeded for render task {render_id}")
        return {
            'render_id': render_id,
            'status': 'failed',
            'error': str(exc)
        }


@shared_task
def cleanup_render_files(older_than_days: int = 30) -> Dict:
    """
    Clean up old render files from S3.
    
    Args:
        older_than_days: Delete renders older than this many days
    
    Returns:
        dict: Cleanup statistics
    """
    try:
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=older_than_days)
        
        # Find old completed renders
        old_renders = MockupRender.objects.filter(
            status__in=['completed', 'failed'],
            created_at__lt=cutoff_date
        )
        
        s3_manager = S3Manager()
        deleted_count = 0
        error_count = 0
        
        for render in old_renders:
            try:
                # Delete S3 files
                if render.output_image_s3_key:
                    s3_manager.s3_client.delete_object(
                        Bucket=s3_manager.bucket_name,
                        Key=render.output_image_s3_key
                    )
                
                if render.output_thumbnail_s3_key:
                    s3_manager.s3_client.delete_object(
                        Bucket=s3_manager.bucket_name,
                        Key=render.output_thumbnail_s3_key
                    )
                
                # Delete database record
                render.delete()
                deleted_count += 1
                
            except Exception as e:
                logger.error(f"Error cleaning up render {render.render_id}: {e}")
                error_count += 1
        
        logger.info(f"Cleanup completed: {deleted_count} renders deleted, {error_count} errors")
        
        return {
            'deleted_count': deleted_count,
            'error_count': error_count,
            'cutoff_date': cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cleanup task failed: {e}")
        return {
            'error': str(e),
            'deleted_count': 0,
            'error_count': 0
        }
