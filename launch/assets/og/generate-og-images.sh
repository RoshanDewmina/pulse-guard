#!/bin/bash
# Generate OG images from SVG templates
# Requires: inkscape or rsvg-convert

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to convert SVG to PNG
convert_svg_to_png() {
    local svg_file="$1"
    local png_file="${svg_file%.svg}.png"
    
    echo "Converting $svg_file -> $png_file..."
    
    # Try inkscape first, fallback to rsvg-convert
    if command -v inkscape &> /dev/null; then
        inkscape "$svg_file" --export-filename="$png_file" --export-width=1200 --export-height=630
    elif command -v rsvg-convert &> /dev/null; then
        rsvg-convert -w 1200 -h 630 "$svg_file" -o "$png_file"
    else
        echo "Error: Neither inkscape nor rsvg-convert found. Install one of them."
        exit 1
    fi
    
    # Optimize PNG (if optipng is available)
    if command -v optipng &> /dev/null; then
        echo "Optimizing $png_file..."
        optipng -o7 "$png_file"
    fi
    
    # Check file size
    local size=$(wc -c < "$png_file")
    local size_kb=$((size / 1024))
    
    if [ $size_kb -gt 300 ]; then
        echo "Warning: $png_file is ${size_kb}KB (>300KB recommended max)"
    else
        echo "✓ $png_file generated (${size_kb}KB)"
    fi
}

# Convert all SVG files in directory
echo "Generating OG images from SVG templates..."
echo

for svg in "$SCRIPT_DIR"/*.svg; do
    if [ -f "$svg" ]; then
        convert_svg_to_png "$svg"
    fi
done

echo
echo "Done! OG images generated in: $SCRIPT_DIR"
echo
echo "Usage:"
echo "  - Place these in /website/static/img/og/"
echo "  - Reference in page frontmatter or meta tags"
echo "  - Test with Facebook Debugger: https://developers.facebook.com/tools/debug/"

