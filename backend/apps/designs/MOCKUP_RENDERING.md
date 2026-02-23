# Mockup Preview Rendering System

A comprehensive system for generating realistic product mockups from customer designs using Celery for asynchronous processing.

## 🎨 Overview

The Mockup Preview Rendering system allows customers to see how their designs will look on actual products. It composites customer artwork (uploaded images + rendered text) onto professional mockup templates using Pillow and saves the results to S3.

### Key Features

✅ **Asynchronous Processing**: Celery-powered rendering for scalability  
✅ **Professional Mockups**: Support for multiple product views and angles  
✅ **Text Rendering**: High-quality text with custom fonts and styling  
✅ **Image Compositing**: Layer customer images with transforms (scale, rotate, position)  
✅ **S3 Integration**: Optimized storage with CDN-ready URLs  
✅ **Perspective Correction**: Apply perspective transforms for curved surfaces  
✅ **Error Handling**: Robust retry logic and comprehensive error reporting  
✅ **Admin Interface**: Complete management through Django admin  
✅ **API-First**: RESTful endpoints for frontend integration  

## 🏗️ Architecture

```
Customer Request → API Endpoint → Celery Task → Image Processing → S3 Storage
                             ↓
                    MockupRender Record → Status Updates → Polling Response
```

### Core Components

- **Models**: `MockupRender`, `ProductMockupTemplate`
- **Tasks**: Celery rendering pipeline with retry logic
- **API**: RESTful endpoints for triggering and monitoring renders
- **Templates**: Professional mockup images with design area definitions
- **Fonts**: Safe font collection for text rendering

## 📊 Database Models

### MockupRender

Tracks individual rendering jobs from request to completion.

```python
class MockupRender(models.Model):
    render_id = models.UUIDField()           # Public identifier
    draft = models.ForeignKey(Draft)         # Source design
    mockup_template = models.ForeignKey()    # Template to use
    user = models.ForeignKey(User)           # Requesting user
    
    # Status tracking
    status = CharField()                     # pending, processing, completed, failed
    task_id = CharField()                    # Celery task ID
    error_message = TextField()              # Error details if failed
    retry_count = PositiveIntegerField()     # Retry attempts
    
    # Output files
    output_image_s3_key = CharField()        # Full-size render
    output_thumbnail_s3_key = CharField()    # Thumbnail version
    
    # Processing metadata
    processing_started_at = DateTimeField()
    processing_completed_at = DateTimeField()
    output_width = PositiveIntegerField()
    output_height = PositiveIntegerField()
    output_file_size = PositiveIntegerField()
```

### ProductMockupTemplate

Defines how designs are rendered onto product mockups.

```python
class ProductMockupTemplate(models.Model):
    product_type = models.ForeignKey()       # Compatible product
    product_variant = models.ForeignKey()    # Specific variant (optional)
    name = CharField()                       # Display name
    
    # Template image
    template_s3_key = CharField()            # Base mockup image
    template_width = PositiveIntegerField()
    template_height = PositiveIntegerField()
    
    # Design placement
    design_area_x = PositiveIntegerField()   # Left offset
    design_area_y = PositiveIntegerField()   # Top offset  
    design_area_width = PositiveIntegerField()
    design_area_height = PositiveIntegerField()
    
    # Advanced settings
    design_rotation = FloatField()           # Rotation in degrees
    design_opacity = FloatField()            # Opacity (0.0-1.0)
    perspective_matrix = JSONField()         # 8-value transform matrix
```

## 🔄 Rendering Workflow

### 1. Trigger Render

```http
POST /api/designs/drafts/{uuid}/render-preview
Content-Type: application/json
Authorization: Bearer <token>

{
  "template_id": 123
}
```

**Response:**
```json
{
  "render_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Render job created and queued for processing.",
  "estimated_completion": "2026-02-23T10:02:00Z"
}
```

### 2. Processing Pipeline

1. **Validation**: Check template compatibility with draft product
2. **Asset Loading**: Download mockup template and draft assets from S3
3. **Design Canvas**: Create design area with customer artwork
   - Render text layers using PIL fonts
   - Composite uploaded images with transforms
4. **Mockup Composition**: Apply design to mockup template
   - Position in design area
   - Apply rotation, opacity, perspective
5. **Output Generation**: Create full-size and thumbnail images
6. **S3 Upload**: Store results with optimized settings

### 3. Status Monitoring

```http
GET /api/designs/renders/{render_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "render_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "draft_uuid": "draft-uuid",
  "template_name": "Front View",
  "output_url": "https://cdn.example.com/renders/full.jpg",
  "thumbnail_url": "https://cdn.example.com/renders/thumb.jpg",
  "processing_duration": "2.3 seconds",
  "output_width": 1200,
  "output_height": 1200,
  "created_at": "2026-02-23T10:00:00Z"
}
```

## 🎯 API Endpoints

### Template Management

- `GET /api/designs/templates/` - List all mockup templates
- `GET /api/designs/drafts/{uuid}/templates/` - Get available templates for draft

### Render Management

- `POST /api/designs/drafts/{uuid}/render-preview` - Trigger new render
- `GET /api/designs/renders/{render_id}` - Get render status
- `DELETE /api/designs/renders/{render_id}/cancel` - Cancel pending render
- `GET /api/designs/renders/` - List user's render jobs
- `GET /api/designs/drafts/{uuid}/renders` - Get render history for draft

### Query Parameters

Most list endpoints support filtering and sorting:

- `?status=completed` - Filter by render status
- `?product_type=1` - Filter by product type
- `?ordering=-created_at` - Sort by creation date

## ⚙️ Configuration

### Django Settings

```python
# Celery Configuration
CELERY_TASK_ROUTES = {
    'apps.designs.tasks.render_draft_preview': {'queue': 'renders'},
    'apps.designs.tasks.cleanup_render_files': {'queue': 'cleanup'},
}

# Rendering Configuration
RENDERING_MAX_RETRIES = 3
RENDERING_RETRY_DELAY = 60  # seconds
RENDERING_FONT_SIZE_MIN = 8
RENDERING_FONT_SIZE_MAX = 200
RENDERING_IMAGE_MAX_SIZE = 4000  # pixels
RENDERING_OUTPUT_QUALITY = 90  # JPEG quality

# Font Configuration
RENDERING_FONTS = {
    'sans-serif': {
        'regular': 'fonts/open-sans-regular.ttf',
        'bold': 'fonts/open-sans-bold.ttf',
        'fallback': ['roboto-regular.ttf', 'arial.ttf']
    },
    # ... more font families
}
```

### Environment Variables

```bash
# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# AWS S3 (required)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=cdn.yoursite.com  # Optional CDN

# Rendering (optional overrides)
RENDERING_MAX_RETRIES=5
RENDERING_IMAGE_MAX_SIZE=6000
```

## 🚀 Setup & Deployment

### 1. Install Dependencies

```bash
# Already included in requirements
pip install celery pillow boto3
```

### 2. Setup Fonts

```bash
# Download Google Fonts
python manage.py install_fonts

# Test font rendering
python manage.py test_font_rendering
```

### 3. Setup Mockup Templates

```bash
# Generate sample templates
python manage.py generate_sample_mockups

# Upload to S3 and create DB records
python manage.py upload_mockup_templates
```

### 4. Configure S3

```bash
# Test S3 connectivity
python manage.py test_s3_config --test-upload --test-presigned
```

### 5. Start Celery Workers

```bash
# Start render worker
celery -A zazzle worker -Q renders -l info

# Start cleanup worker (optional)
celery -A zazzle worker -Q cleanup -l info

# Monitor with Flower
celery -A zazzle flower
```

### 6. Database Migration

```bash
python manage.py migrate
```

## 🧪 Testing

### Unit Tests

```bash
# Run all render tests
python manage.py test apps.designs.tests.MockupRenderModelTestCase
python manage.py test apps.designs.tests.MockupRenderAPITestCase
python manage.py test apps.designs.tests.MockupRenderTaskTestCase

# Run with coverage
coverage run --source='.' manage.py test apps.designs
coverage report
```

### Integration Testing

```bash
# Create sample data
python manage.py create_sample_drafts --users 3 --drafts-per-user 5

# Test complete workflow
python manage.py shell
>>> from apps.designs.tests import test_complete_render_workflow
>>> test_complete_render_workflow()
```

### Load Testing

```bash
# Monitor render queue
python manage.py manage_render_queue --action status

# Stress test with multiple renders
python manage.py shell
>>> # Create multiple render jobs and monitor performance
```

## 📊 Monitoring & Maintenance

### Queue Management

```bash
# Check render queue status
python manage.py manage_render_queue --action status

# Retry failed renders
python manage.py manage_render_queue --action retry-failed

# Cancel stuck renders
python manage.py manage_render_queue --action cancel-stuck --stuck-hours 2

# Cleanup old renders
python manage.py manage_render_queue --action cleanup --cleanup-days 30
```

### Performance Monitoring

Key metrics to track:

- **Queue Length**: Pending renders count
- **Processing Time**: Average render duration
- **Success Rate**: Completed vs failed renders
- **Storage Usage**: S3 storage consumption
- **Error Patterns**: Common failure causes

### Django Admin

The admin interface provides comprehensive management:

- **Render Jobs**: View, retry, cancel, and analyze renders
- **Templates**: Manage mockup templates and design areas 
- **Bulk Actions**: Mass operations on renders
- **Visual Previews**: Thumbnail previews of outputs
- **Error Analysis**: Detailed error messages and retry counts

## 🔧 Troubleshooting

### Common Issues

#### Renders Stuck in "Processing"

```bash
# Check for stuck renders
python manage.py manage_render_queue --action status

# Cancel stuck renders
python manage.py manage_render_queue --action cancel-stuck

# Restart Celery workers
sudo systemctl restart celery-worker
```

#### Font Rendering Issues

```bash
# Test font availability
python manage.py test_font_rendering --font-family sans-serif

# Reinstall fonts
python manage.py install_fonts --force

# Check font paths in settings
python manage.py shell
>>> from django.conf import settings
>>> print(settings.RENDERING_FONTS)
```

#### S3 Upload Failures

```bash
# Test S3 configuration
python manage.py test_s3_config --test-upload

# Check AWS credentials
aws sts get-caller-identity

# Verify bucket permissions
aws s3 ls s3://your-bucket/renders/ --recursive
```

#### Celery Task Issues

```bash
# Check Celery status
celery -A zazzle status

# Inspect active tasks
celery -A zazzle inspect active

# Purge task queue
celery -A zazzle purge
```

### Error Analysis

Common error patterns and solutions:

| Error Type | Symptoms | Solution |
|------------|----------|----------|
| **Font Missing** | `OSError: cannot open resource` | Install fonts or update font paths |
| **S3 Permission** | `AccessDenied` in logs | Check AWS credentials and bucket policy |
| **Memory Error** | `MemoryError` during processing | Reduce image sizes or increase worker memory |
| **Task Timeout** | Renders stuck forever | Increase `CELERY_TASK_TIME_LIMIT` |
| **Template Missing** | `S3 key not found` | Upload mockup templates |

### Performance Optimization

#### Image Optimization

- **Template Size**: Keep mockup templates under 5MB
- **Output Quality**: Balance quality vs file size (90% recommended)
- **Progressive JPEG**: Enable for faster loading
- **CDN Integration**: Use AWS CloudFront for global delivery

#### Worker Optimization

```python
# Celery worker settings
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # Process one task at a time
CELERY_TASK_ACKS_LATE = True          # Prevent task loss
CELERY_WORKER_MAX_TASKS_PER_CHILD = 50  # Restart workers periodically
```

#### Memory Management

```python
# Font cache management
RENDERING_FONT_CACHE_SIZE = 100    # Number of fonts to cache
RENDERING_MAX_IMAGE_PIXELS = 50000000  # Prevent huge images
```

## 🔒 Security Considerations

### File Validation

- **Content Type**: Only allow PNG, JPG, WebP
- **File Size**: Limit individual files to 50MB
- **Filename**: Sanitize filenames to prevent path traversal
- **Image Validation**: Use PIL to validate image headers

### Access Control

- **Ownership**: Users can only access their own renders
- **Template Access**: Validate template compatibility with products
- **S3 Permissions**: Use least-privilege bucket policies
- **API Authentication**: Require valid JWT tokens

### Data Privacy

- **Temporary Files**: Clean up local temporary files
- **S3 Cleanup**: Regular cleanup of old renders
- **Error Logs**: Sanitize sensitive data in logs
- **GDPR Compliance**: Support data deletion requests

## 📈 Scaling Considerations

### Horizontal Scaling

```yaml
# Docker Compose scaling
version: '3'
services:
  render-worker:
    image: your-app:latest
    command: celery -A zazzle worker -Q renders
    deploy:
      replicas: 4  # Scale based on load
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

### Queue Partitioning

```python
# Separate queues by priority/type
CELERY_TASK_ROUTES = {
    'apps.designs.tasks.render_draft_preview': {'queue': 'renders'},
    'apps.designs.tasks.render_priority_preview': {'queue': 'priority'},
    'apps.designs.tasks.cleanup_render_files': {'queue': 'maintenance'},
}
```

### Caching Strategy

- **Font Caching**: Cache loaded fonts in memory
- **Template Caching**: Cache frequently used templates
- **Result Caching**: Cache rendered outputs for identical designs
- **CDN Caching**: Long-term caching for static outputs

The Mockup Preview Rendering system provides a robust foundation for generating professional product previews at scale, with comprehensive error handling, monitoring, and optimization features.