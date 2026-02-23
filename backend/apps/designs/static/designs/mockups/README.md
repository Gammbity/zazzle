# Mockup Templates

This directory contains the base mockup template images and configuration for the Zazzle platform.

## Directory Structure

```
mockups/
├── templates.json          # Configuration file defining all mockup templates
├── tshirt_front.png       # T-shirt front view mockup
├── tshirt_back.png        # T-shirt back view mockup  
├── mug_standard.png       # Coffee mug standard view mockup
├── business_card_front.png # Business card front layout mockup
├── calendar_monthly.png   # Desk calendar monthly view mockup
└── README.md              # This file
```

## Template Requirements

### Image Specifications
- **Format**: PNG with transparency support
- **Resolution**: Minimum 1200x1200px, recommended 2000x2000px or higher
- **Color space**: sRGB
- **File size**: Keep under 5MB for faster rendering

### Design Area Guidelines
- The design area should be clearly defined where customer artwork will be placed
- Use guides or light overlays in your template to mark the design boundaries
- Ensure sufficient padding around the design area for realistic product representation

## Configuration Format

Each template is defined in `templates.json` with the following structure:

```json
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
  "is_active": true,
  "perspective_matrix": [1.0, 0.1, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0]
}
```

### Field Descriptions

- **name**: Display name for the mockup (e.g., "Front View", "Angled View")
- **product_type**: Must match exactly with a ProductType name in the database
- **image_file**: Filename of the template image in this directory
- **design_area**: Rectangle defining where customer designs will be placed
  - **x, y**: Top-left corner coordinates in pixels
  - **width, height**: Dimensions in pixels
- **design_rotation**: Rotation angle in degrees (optional, default: 0.0)
- **design_opacity**: Opacity for the design overlay 0.0-1.0 (optional, default: 1.0)
- **sort_order**: Display order for multiple templates (optional, default: 0)
- **is_active**: Whether this template is available for use (optional, default: true)
- **perspective_matrix**: 8-value transformation matrix for perspective correction (optional)

## Adding New Templates

1. **Create the mockup image**:
   - Design a realistic product mockup in your preferred graphics software
   - Export as PNG with transparency
   - Name the file descriptively (e.g., `hoodie_front_flat.png`)

2. **Determine the design area**:
   - Open the image in an image editor
   - Note the pixel coordinates where customer designs should be placed
   - Measure the width and height of this area

3. **Add to configuration**:
   ```json
   {
     "name": "Front Flat Lay",
     "product_type": "Premium Hoodie",
     "image_file": "hoodie_front_flat.png",
     "design_area": {
       "x": 200,
       "y": 150,
       "width": 250,
       "height": 300
     }
   }
   ```

4. **Upload to S3**:
   ```bash
   python manage.py upload_mockup_templates
   ```

## Advanced Features

### Perspective Transformation

For curved surfaces (mugs, bottles), you can define a perspective transformation matrix:

```json
"perspective_matrix": [1.0, 0.1, 0.0, 0.0, 1.2, 0.0, 0.0, 0.0]
```

This 8-value array defines how the flat design should be warped to fit the product surface.

### Multiple Views

You can have multiple mockup templates for the same product:

```json
[
  {
    "name": "Front View",
    "product_type": "Classic T-Shirt",
    "image_file": "tshirt_front.png",
    "sort_order": 1
  },
  {
    "name": "Back View", 
    "product_type": "Classic T-Shirt",
    "image_file": "tshirt_back.png",
    "sort_order": 2
  },
  {
    "name": "Flat Lay",
    "product_type": "Classic T-Shirt", 
    "image_file": "tshirt_flat.png",
    "sort_order": 3
  }
]
```

## Testing Templates

After uploading new templates, test them using the API:

1. Create a draft with some text/images
2. Request a preview render: `POST /api/designs/drafts/{uuid}/render-preview`
3. Check the rendered output for proper alignment and quality

## Troubleshooting

### Design Area Alignment Issues
- Double-check the x, y coordinates in your configuration
- Ensure coordinates are measured from the top-left corner of the image
- Test with simple text first before complex designs

### Perspective Issues
- Start with identity matrix: `[1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0]`
- Make small adjustments to individual values
- Test frequently with preview renders

### Quality Issues
- Use higher resolution source images
- Ensure design area is appropriately sized for the template resolution
- Adjust JPEG quality settings in Django settings

## Management Commands

- `upload_mockup_templates`: Upload templates to S3 and create database records
- `upload_mockup_templates --dry-run`: Preview what would be uploaded
- `upload_mockup_templates --force`: Overwrite existing templates

For detailed command options: `python manage.py upload_mockup_templates --help`