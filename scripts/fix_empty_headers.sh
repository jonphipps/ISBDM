#!/bin/bash

# Script to fix empty headers and convert remaining HTML links
# to proper components in the intro section MDX files

TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# Process each file
for file in "$TARGET_DIR"/*.mdx; do
    # Skip index.mdx and i026.mdx which were manually modified
    if [[ $(basename "$file") == "index.mdx" || $(basename "$file") == "i026.mdx" ]]; then
        continue
    fi
    
    echo "Fixing headers in $(basename "$file")"
    
    # First, remove empty headers
    sed -i '' -E '/^## $/d' "$file"
    
    # Convert headers that are just markup to proper text
    sed -i '' -E 's/^## Library/Library/g' "$file"
    sed -i '' -E 's/^## Agent,/Agent,/g' "$file"
    sed -i '' -E 's/^## The label/The label/g' "$file"
    sed -i '' -E 's/^## Sources/Sources/g' "$file"
    sed -i '' -E 's/^## The manifestation/The manifestation/g' "$file"
    sed -i '' -E 's/^## An external/An external/g' "$file"
    sed -i '' -E 's/^## The value/The value/g' "$file"
    sed -i '' -E 's/^## The language/The language/g' "$file"
    sed -i '' -E 's/^## Consider/Consider/g' "$file"
    sed -i '' -E 's/^## Manifestation/Manifestation/g' "$file"
    sed -i '' -E 's/^## The set/The set/g' "$file"
    
    # Convert any remaining HTML links to React components
    sed -i '' -E 's/<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' "$file"
    sed -i '' -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/<InLink href="\1">\2<\/InLink>/g' "$file"
    
    # Convert Examples section to proper header
    sed -i '' -E 's/<a class="linkEx" [^>]+>Examples/<h3>Examples<\/h3>/g' "$file"
    
    # Add closing tags for SeeAlso if missing
    sed -i '' -E 's/<SeeAlso>([^<]+)$/<SeeAlso>\1<\/SeeAlso>/g' "$file"
    
    # Add proper headers where needed
    if ! grep -q "^##\|^###" "$file"; then
        sed -i '' -E '/^import.*$/a\\n## '"$(basename "$file" .mdx)"'' "$file"
    fi
done

# Apply special fixes for specific files
if [ -f "$TARGET_DIR/i001.mdx" ]; then
    echo "Applying special fixes to i001.mdx"
    # Fix broken IFLA link
    sed -i '' 's/IFLA\nLibrary Reference Model/IFLA Library Reference Model/g' "$TARGET_DIR/i001.mdx"
fi

if [ -f "$TARGET_DIR/i002.mdx" ]; then
    echo "Applying special fixes to i002.mdx"
    # Fix examples section
    sed -i '' 's/<a class="linkEx".*Examples/<h3>Examples<\/h3>/g' "$TARGET_DIR/i002.mdx"
fi

echo "All header fixes applied!"