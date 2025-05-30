#!/bin/bash

# Final fixes for intro MDX files
# This script performs final formatting fixes for specific issues in the MDX files

# Set target directory
TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# Process each file
for file in "$TARGET_DIR"/*.mdx; do
    # Skip the existing modified files
    if [[ $(basename "$file") == "index.mdx" || $(basename "$file") == "i026.mdx" ]]; then
        continue
    fi
    
    echo "Applying final fixes to $(basename "$file")"
    
    # Convert HTML links to components
    sed -i '' -E 's/<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' "$file"
    sed -i '' -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/<InLink href="\1">\2<\/InLink>/g' "$file"
    
    # Convert <li> tags to Markdown lists
    sed -i '' -E 's/<li>([^<]+)<\/li>/- \1/g' "$file"
    
    # Fix ISBD for Manifestation formatting (ensure proper bold)
    sed -i '' -E 's/\*\*\*\*ISBD for Manifestation\*\*\*\*/\*\*ISBD for Manifestation\*\*/g' "$file"
    
    # Fix examples section
    sed -i '' -E 's/<a class="linkEx"[^>]+>Examples/<h3>Examples<\/h3>/g' "$file"
    
    # Fix multiple consecutive empty lines
    sed -i '' -E '/^[[:space:]]*$/N;/^\n[[:space:]]*$/D' "$file"
done

# Special fix for i025.mdx - bullet lists
if [ -f "$TARGET_DIR/i025.mdx" ]; then
    echo "Applying special fixes to i025.mdx"
    
    # Replace li tags with proper Markdown lists
    sed -i '' -E 's/<li>/\n- /g' "$TARGET_DIR/i025.mdx"
    
    # Fix spacing around paragraphs
    sed -i '' -E 's/([^>])\n- /\1\n\n- /g' "$TARGET_DIR/i025.mdx"
fi

echo "Final fixes applied!"