# Zazzle Design Draft System

A comprehensive system for customers to create and manage design drafts for print-on-demand products with secure S3 file upload capabilities.

## Overview

The Design Draft system allows customers to create work-in-progress designs for specific product variants. It supports:
- **Secure file uploads** via S3 presigned URLs
- **Text layer management** with positioning and styling
- **Editor state persistence** for design tools
- **Multi-status workflow** from draft to preview-ready
- **Asset organization** with z-index layering
- **Ownership-based security** ensuring customers only access their drafts

## Core Models

### Draft
The main model representing a customer's design-in-progress for a specific product variant.

```python
class Draft(models.Model):
    uuid = models.UUIDField()  # Public identifier
    customer = models.ForeignKey(User)  # Owner
    product_type = models.ForeignKey(ProductType)  # Base product
    product_variant = models.ForeignKey(ProductVariant)  # Specific variant
    
    # Design content
    name = models.CharField()  # Optional name
    text_layers = models.JSONField()  # Text elements
    editor_state = models.JSONField()  # Complete editor state
    
    # Status tracking
    status = models.CharField()  # DRAFT, PREVIEW_RENDERING, PREVIEW_READY, ARCHIVED
    preview_image_s3_key = models.CharField()  # Generated preview
```

**Status Flow:**
- `DRAFT` → `PREVIEW_RENDERING` → `PREVIEW_READY`
- `ARCHIVED` (can be restored to DRAFT)

### DraftAsset
Individual uploaded files within a draft (images, graphics, etc.)

```python
class DraftAsset(models.Model):
    uuid = models.UUIDField()  # Public identifier
    draft = models.ForeignKey(Draft)  # Parent draft
    
    # File information
    original_filename = models.CharField()  # Sanitized filename
    s3_key = models.CharField()  # S3 location
    content_type = models.CharField()  # MIME type
    file_size = models.PositiveIntegerField()  # Bytes
    
    # Image metadata
    width = models.PositiveIntegerField()  # Pixels
    height = models.PositiveIntegerField()  # Pixels
    
    # Editor properties
    asset_type = models.CharField()  # IMAGE, GRAPHIC, LOGO, BACKGROUND
    transform = models.JSONField()  # Position, scale, rotation
    z_index = models.IntegerField()  # Layer order
```

### UploadSession
Temporary session for tracking S3 presigned uploads.

```python
class UploadSession(models.Model):
    session_id = models.UUIDField()  # Unique session identifier
    user = models.ForeignKey(User)  # Uploader
    draft = models.ForeignKey(Draft, null=True)  # Optional draft association
    
    # Upload details
    s3_key = models.CharField()  # Target S3 location
    original_filename = models.CharField()  # Sanitized name
    expected_size = models.PositiveIntegerField()  # Expected bytes
    content_type = models.CharField()  # Expected MIME type
    
    # Session management
    is_confirmed = models.BooleanField()  # Upload completed
    expires_at = models.DateTimeField()  # Session expiry
```

## API Endpoints

### Draft Management

#### Create Draft
```http
POST /api/designs/drafts/
Content-Type: application/json
Authorization: Bearer <token>

{
  "product_type": 1,
  "product_variant": 15,
  "name": "My Custom Design",
  "text_layers": [
    {
      "id": "text1",
      "text": "Hello World",
      "x": 100,
      "y": 50,
      "font_size": 24,
      "color": "#000000",
      "font_family": "Arial"
    }
  ],
  "editor_state": {
    "zoom": 1.0,
    "pan_x": 0,
    "pan_y": 0,
    "selected_layer": "text1"
  }
}
```

**Response:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Custom Design",
  "product_type": {
    "id": 1,
    "name": "Classic T-Shirt",
    "category": "tshirt"
  },
  "product_variant": {
    "id": 15,
    "size": "M",
    "color": "White",
    "sale_price": 85000.00
  },
  "text_layers": [...],
  "editor_state": {...},
  "status": "draft",
  "created_at": "2026-02-23T10:00:00Z"
}
```

#### List User's Drafts
```http
GET /api/designs/drafts/
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (draft, preview_rendering, etc.)
- `product_type` - Filter by product type ID
- `search` - Search draft names
- `ordering` - Sort by name, created_at, updated_at

#### Get Draft Detail
```http
GET /api/designs/drafts/{uuid}/
Authorization: Bearer <token>
```

#### Update Draft
```http
PATCH /api/designs/drafts/{uuid}/
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Design Name",
  "text_layers": [...],
  "editor_state": {...},
  "status": "preview_rendering"
}
```

#### Delete Draft (Soft Delete)
```http
DELETE /api/designs/drafts/{uuid}/
Authorization: Bearer <token>
```

### File Upload Flow

#### 1. Request Presigned Upload URL
```http
POST /api/designs/uploads/presign/
Content-Type: application/json
Authorization: Bearer <token>

{
  "filename": "my-design.png",
  "content_type": "image/png",
  "file_size": 1234567,
  "draft_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "s3_key": "drafts/42/uuid/my-design.png",
  "presigned_upload": {
    "url": "https://bucket.s3.amazonaws.com/",
    "fields": {
      "key": "drafts/42/uuid/my-design.png",
      "Content-Type": "image/png",
      "policy": "...",
      "signature": "..."
    }
  },
  "expires_at": "2026-02-23T11:00:00Z"
}
```

#### 2. Upload File to S3
Use the presigned upload data to upload directly to S3:

```javascript
// Frontend example
const formData = new FormData();
const fields = response.presigned_upload.fields;

// Add all fields from presigned response
Object.keys(fields).forEach(key => {
  formData.append(key, fields[key]);
});

// Add the file last
formData.append('file', fileBlob);

// Upload to S3
const uploadResponse = await fetch(response.presigned_upload.url, {
  method: 'POST',
  body: formData
});
```

#### 3. Confirm Upload
```http
POST /api/designs/uploads/confirm/
Content-Type: application/json
Authorization: Bearer <token>

{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "metadata": {
    "width": 1920,
    "height": 1080
  }
}
```

**Response:**
```json
{
  "message": "Upload confirmed successfully",
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "s3_key": "drafts/42/uuid/my-design.png",
  "asset": {
    "uuid": "asset-uuid",
    "original_filename": "my-design.png",
    "file_url": "https://bucket.s3.amazonaws.com/drafts/42/uuid/my-design.png",
    "width": 1920,
    "height": 1080,
    "asset_type": "image"
  }
}
```

#### List Draft Assets
```http
GET /api/designs/drafts/{uuid}/assets/
Authorization: Bearer <token>
```

### Statistics

#### Draft Statistics
```http
GET /api/designs/drafts/stats/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_drafts": 15,
  "draft_status_counts": {
    "draft": 10,
    "preview_rendering": 2,
    "preview_ready": 3,
    "archived": 0
  },
  "total_assets": 42,
  "total_storage_used": 52428800
}
```

## File Validation & Security

### Supported File Types
- **PNG**: `image/png`, `.png`
- **JPEG**: `image/jpeg`, `.jpg`, `.jpeg`  
- **WebP**: `image/webp`, `.webp`

### File Size Limits
- **Maximum file size**: 50MB per file
- **Total storage**: Unlimited (can be configured per user)

### Filename Sanitization
- Path components removed (`../../../hack.png` → `hack.png`)
- Special characters replaced with underscores
- Spaces converted to underscores
- Original extension preserved

### Security Features
- **Ownership isolation**: Users can only access their own drafts
- **S3 presigned URLs**: Secure direct upload without backend processing
- **Session validation**: Upload sessions expire in 1 hour
- **File verification**: Server verifies upload completion and file size
- **Content-type validation**: MIME type checked against allowed types

## Frontend Integration Examples

### React Draft Editor
```javascript
import { useState, useEffect } from 'react';

const DraftEditor = ({ draftUuid }) => {
  const [draft, setDraft] = useState(null);
  const [editorState, setEditorState] = useState({});
  
  // Load draft
  useEffect(() => {
    const loadDraft = async () => {
      const response = await fetch(`/api/designs/drafts/${draftUuid}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const draftData = await response.json();
      setDraft(draftData);
      setEditorState(draftData.editor_state);
    };
    
    loadDraft();
  }, [draftUuid]);
  
  // Auto-save function
  const saveDraft = async () => {
    await fetch(`/api/designs/drafts/${draftUuid}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        editor_state: editorState,
        text_layers: draft.text_layers
      })
    });
  };
  
  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveDraft, 30000);
    return () => clearInterval(interval);
  }, [editorState]);
  
  return <div>/* Editor UI */</div>;
};
```

### File Upload Component
```javascript
const FileUploader = ({ draftUuid, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleFileUpload = async (file) => {
    setUploading(true);
    
    try {
      // 1. Request presigned URL
      const presignResponse = await fetch('/api/designs/uploads/presign/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
          draft_uuid: draftUuid
        })
      });
      
      const { session_id, presigned_upload } = await presignResponse.json();
      
      // 2. Upload to S3
      const formData = new FormData();
      Object.keys(presigned_upload.fields).forEach(key => {
        formData.append(key, presigned_upload.fields[key]);
      });
      formData.append('file', file);
      
      await fetch(presigned_upload.url, {
        method: 'POST',
        body: formData
      });
      
      // 3. Confirm upload
      const confirmResponse = await fetch('/api/designs/uploads/confirm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id,
          metadata: {
            width: 1920,  // From image processing
            height: 1080
          }
        })
      });
      
      const { asset } = await confirmResponse.json();
      onUploadComplete(asset);
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <input 
      type="file" 
      accept=".png,.jpg,.jpeg,.webp"
      onChange={(e) => handleFileUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
};
```

## Configuration

### Required Django Settings

```python
# S3 Configuration
AWS_ACCESS_KEY_ID = 'your-access-key'
AWS_SECRET_ACCESS_KEY = 'your-secret-key'
AWS_STORAGE_BUCKET_NAME = 'your-bucket-name'
AWS_S3_REGION_NAME = 'us-east-1'
AWS_S3_CUSTOM_DOMAIN = 'your-custom-domain.com'  # Optional

# File Upload Limits
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50MB

# Required for draft UUID lookup
INSTALLED_APPS = [
    # ... other apps
    'apps.designs',
    'apps.products',
]
```

### Required Python Packages

```bash
pip install boto3 botocore
```

## Admin Interface Features

### Enhanced Django Admin
- **Color-coded status badges** for drafts and upload sessions
- **Bulk actions** for archiving/restoring drafts
- **File size display** in human-readable format (KB/MB)
- **Asset inline editing** within draft admin
- **Upload session cleanup** for expired sessions
- **Search functionality** across drafts, assets, and sessions
- **Ownership filtering** to find specific user drafts

### Admin Actions
- **Archive Drafts**: Bulk archive selected drafts
- **Restore Drafts**: Restore soft-deleted drafts
- **Cleanup Expired Sessions**: Remove expired upload sessions
- **Permanently Delete**: Hard delete drafts (use carefully)

## Testing

### Running Tests
```bash
# Run all draft system tests
python manage.py test apps.designs.tests

# Run specific test classes
python manage.py test apps.designs.tests.DraftAPITestCase
python manage.py test apps.designs.tests.UploadAPITestCase

# Test with coverage
coverage run --source='.' manage.py test apps.designs
coverage report
```

### Test Coverage Areas
- **Model validation** - Draft/asset creation and relationships
- **API ownership** - Security and access control
- **File upload flow** - Presigned URL → upload → confirmation
- **File validation** - Type, size, and filename sanitization
- **Status transitions** - Draft workflow validation
- **Error handling** - Invalid sessions, expired uploads, etc.

## Performance Considerations

### Database Optimizations
- **Indexes** on frequently queried fields (uuid, customer, status)
- **Select/prefetch related** for draft lists and details
- **Soft deletion** to avoid cascade deletes
- **UUID lookup** for public draft access

### S3 Optimizations
- **Presigned URLs** eliminate server upload processing
- **Direct uploads** reduce server bandwidth and processing
- **CDN integration** via AWS_S3_CUSTOM_DOMAIN setting
- **Organized key structure** for efficient storage management

### Frontend Optimizations
- **Auto-save functionality** to prevent data loss
- **Asset lazy loading** for large draft with many images
- **Upload progress tracking** for better user experience
- **Error retry logic** for failed uploads

## Troubleshooting

### Common Issues

#### Upload Session Not Found
```
Error: Upload session not found or already confirmed
```
- **Cause**: Session expired (>1 hour) or already used
- **Solution**: Request new presigned URL

#### File Size Mismatch
```
Error: File size mismatch
```
- **Cause**: Actual uploaded file size differs from expected
- **Solution**: Ensure file size is calculated correctly on frontend

#### Invalid MIME Type
```
Error: Content type not allowed
```
- **Cause**: File type not in allowed list (png/jpg/webp)
- **Solution**: Convert file or validate file type before upload

#### S3 Access Denied
```
Error: S3 error: Access Denied
```
- **Cause**: Incorrect AWS credentials or bucket permissions
- **Solution**: Verify AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and bucket policy

### Debug Mode

Enable debug logging for upload issues:

```python
# settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'apps.designs.views': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

The Draft system provides a robust foundation for customer design creation with enterprise-grade security, performance, and scalability features.