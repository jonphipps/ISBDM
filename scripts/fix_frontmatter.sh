#!/bin/bash

# Fix the frontmatter by ensuring proper separator between frontmatter and content
# Also fixes the remaining HTML links to React components

TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

for file in "$TARGET_DIR"/*.mdx; do
    # Skip i026.mdx which was manually modified
    if [[ $(basename "$file") == "index.mdx" || $(basename "$file") == "i026.mdx" ]]; then
        continue
    fi
    
    echo "Fixing frontmatter in $(basename "$file")"
    
    # Get the file ID
    file_id=$(basename "$file" .mdx)
    
    # Extract title from frontmatter
    title=$(grep 'title:' "$file" | sed -E 's/title: "([^"]+)"/\1/g')
    
    # Create a temporary file with corrected frontmatter
    cat > "$file.tmp" << EOF
---
id: $file_id
title: "$title"
slug: "/intro/$file_id"
---

import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## $title

EOF
    
    # Extract content after imports (skip frontmatter and any existing imports)
    sed -n '/^<div className="guid"/,$p' "$file" >> "$file.tmp"
    
    # Convert any remaining HTML links
    sed -i '' -E 's/<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' "$file.tmp"
    sed -i '' -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/<InLink href="\1">\2<\/InLink>/g' "$file.tmp"
    
    # Fix Examples section
    sed -i '' -E 's/<a class="linkEx"[^>]*>Examples/<h3>Examples<\/h3>/g' "$file.tmp"
    
    # Move the temporary file back to original
    mv "$file.tmp" "$file"
done

echo "Frontmatter fixes complete!"