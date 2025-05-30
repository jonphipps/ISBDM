#!/bin/bash

# Final conversion script to fix any remaining issues
# Focuses on converting remaining HTML links to React components
# and ensuring proper MDX formatting

TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# Process each file
for file in "$TARGET_DIR"/*.mdx; do
    # Skip index.mdx and i026.mdx
    if [[ $(basename "$file") == "index.mdx" || $(basename "$file") == "i026.mdx" ]]; then
        continue
    fi
    
    echo "Finalizing $(basename "$file")"
    
    # Convert remaining OutLink links
    sed -i '' -E 's/<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' "$file"
    
    # Convert remaining InLink links
    sed -i '' -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/<InLink href="\1">\2<\/InLink>/g' "$file"
    
    # Fix Examples section
    sed -i '' -E 's/<a class="linkEx"[^>]*>Examples/<h3>Examples<\/h3>/g' "$file"
    
    # Fix paragraphs for readability
    sed -i '' -E 's/([^\.])$/\1\n/g' "$file"
    
    # Fix line spacing around list items
    sed -i '' -E 's/^- /\n- /g' "$file"
    
    # Fix spacing issues with paragraphs
    sed -i '' -E 's/([^\s])The set/\1\n\nThe set/g' "$file"
    
    # Remove any trailing whitespace
    sed -i '' -E 's/[[:space:]]+$//g' "$file"
    
    # Remove duplicate blank lines
    sed -i '' -E '/^$/N;/^\n$/D' "$file"
done

# Special fixes for specific files
if [ -f "$TARGET_DIR/i001.mdx" ]; then
    echo "Applying special fixes to i001.mdx"
    sed -i '' 's/Library Reference Model/Library Reference Model/g' "$TARGET_DIR/i001.mdx"
fi

if [ -f "$TARGET_DIR/i004.mdx" ]; then
    echo "Applying special fixes to i004.mdx"
    # Add subheading
    sed -i '' '12i\\n### The manifestation\n' "$TARGET_DIR/i004.mdx"
fi

if [ -f "$TARGET_DIR/i005.mdx" ]; then
    echo "Applying special fixes to i005.mdx"
    # Add subheading
    sed -i '' '12i\\n### External sources\n' "$TARGET_DIR/i005.mdx"
fi

echo "All finalizations complete!"