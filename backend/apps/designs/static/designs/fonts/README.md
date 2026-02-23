# Fonts for Text Rendering

This directory contains fonts used for rendering text layers in design previews.

## Font Requirements

- **Format**: TrueType (.ttf) or OpenType (.otf) fonts
- **License**: Only use fonts with appropriate licensing for commercial use
- **File size**: Keep individual font files under 1MB when possible

## Included Fonts

### Sans-Serif Fonts
- `open-sans-regular.ttf` - Open Sans Regular (Google Fonts, SIL OFL)
- `open-sans-bold.ttf` - Open Sans Bold
- `roboto-regular.ttf` - Roboto Regular (Google Fonts, Apache License)
- `roboto-bold.ttf` - Roboto Bold

### Serif Fonts
- `source-serif-regular.ttf` - Source Serif Pro Regular (Adobe, SIL OFL)
- `source-serif-bold.ttf` - Source Serif Pro Bold
- `playfair-regular.ttf` - Playfair Display Regular (Google Fonts, SIL OFL)

### Monospace Fonts
- `source-code-regular.ttf` - Source Code Pro Regular (Adobe, SIL OFL)
- `jetbrains-mono-regular.ttf` - JetBrains Mono Regular (JetBrains, SIL OFL)

## Font Configuration

Fonts are configured in Django settings with fallback chains:

```python
RENDERING_FONTS = {
    'sans-serif': {
        'regular': 'fonts/open-sans-regular.ttf',
        'bold': 'fonts/open-sans-bold.ttf',
        'fallback': ['roboto-regular.ttf', 'system-default']
    },
    'serif': {
        'regular': 'fonts/source-serif-regular.ttf', 
        'bold': 'fonts/source-serif-bold.ttf',
        'fallback': ['playfair-regular.ttf', 'system-default']
    },
    'monospace': {
        'regular': 'fonts/source-code-regular.ttf',
        'bold': 'fonts/jetbrains-mono-regular.ttf',
        'fallback': ['system-default']
    }
}
```

## Adding New Fonts

1. **Choose appropriate fonts**:
   - Verify licensing allows commercial use
   - Test readability at different sizes
   - Ensure good character set coverage

2. **Add font files**:
   - Place .ttf/.otf files in this directory
   - Use descriptive filenames (e.g., `font-family-weight.ttf`)

3. **Update font configuration**:
   - Add to the font mapping in Django settings
   - Define fallback chains for reliability

4. **Test rendering**:
   ```python
   python manage.py test_font_rendering --font-family "New Font"
   ```

## Font Licensing

All fonts must have appropriate licenses for:
- Commercial use
- Modification (if needed)
- Distribution in rendered images

Common acceptable licenses:
- SIL Open Font License (OFL)
- Apache License 2.0
- MIT License
- Google Fonts (various open licenses)

**Do not include fonts with restrictive licenses!**

## Font Fallback System

The rendering system uses fallback chains to ensure text always renders:

1. **Requested font**: The font specified in the text layer
2. **Family fallback**: Other fonts in the same family (sans-serif, serif, etc.)
3. **System fonts**: Platform-specific defaults
4. **Default font**: PIL's built-in font as last resort

This ensures text renders even if specific fonts are missing.

## Optimization Tips

- **Font subsetting**: Include only needed character ranges
- **Format conversion**: Convert to WOFF2 for web delivery (if needed)
- **Preloading**: Cache frequently used fonts in memory
- **Size limits**: Set maximum font size to prevent memory issues

## Management Commands

- `install_fonts`: Download and install Google Fonts
- `test_font_rendering`: Test font rendering with sample text  
- `optimize_fonts`: Subset fonts to reduce file sizes

For detailed options: `python manage.py <command> --help`