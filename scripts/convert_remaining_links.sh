#!/bin/bash

# Script to convert remaining HTML links to React components
# This script specifically targets files in the intro section

TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# Process each file for link conversion
for file in "$TARGET_DIR"/*.mdx; do
    # Skip index.mdx and i026.mdx which were manually modified
    if [[ $(basename "$file") == "index.mdx" || $(basename "$file") == "i026.mdx" ]]; then
        continue
    fi
    
    echo "Converting links in $(basename "$file")"
    
    # Convert OutLink links (external links)
    sed -i '' -E 's/<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' "$file"
    
    # Convert InLink links (internal links)
    sed -i '' -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/<InLink href="\1">\2<\/InLink>/g' "$file"
    
    # Fix the Examples section
    sed -i '' -E 's/<a class="linkEx"[^>]*>Examples/<h3>Examples<\/h3>/g' "$file"
    
    # Add headers based on title
    if ! grep -q "^## " "$file"; then
        title=$(grep -o '"[^"]*"' "$file" | head -1 | tr -d '"')
        sed -i '' "5i\\
## $title" "$file"
    fi
done

# Add headers to specific files
for file in i001 i002 i003 i004 i005 i006 i007 i008 i014 i021 i022 i023 i024 i025; do
    # Extract title from frontmatter
    title=$(grep -o 'title: "[^"]*"' "$TARGET_DIR/$file.mdx" | sed 's/title: "\(.*\)"/\1/')
    
    if [[ -n "$title" ]]; then
        # Check if the title is already present as a heading
        if ! grep -q "^## $title" "$TARGET_DIR/$file.mdx"; then
            # Add the title as a heading after the imports
            last_import_line=$(grep -n "import " "$TARGET_DIR/$file.mdx" | tail -1 | cut -d':' -f1)
            if [[ -n "$last_import_line" ]]; then
                awk -v line=$((last_import_line+1)) -v title="$title" 'NR==line{print "\n## " title} {print}' "$TARGET_DIR/$file.mdx" > "$TARGET_DIR/$file.tmp.mdx"
                mv "$TARGET_DIR/$file.tmp.mdx" "$TARGET_DIR/$file.mdx"
            else
                # No imports, add after frontmatter
                awk 'BEGIN{p=0} /^---$/{if(p==1){print; print "\n## '"$title"'"; next} p=1} {print}' "$TARGET_DIR/$file.mdx" > "$TARGET_DIR/$file.tmp.mdx"
                mv "$TARGET_DIR/$file.tmp.mdx" "$TARGET_DIR/$file.mdx"
            fi
        fi
    fi
done

echo "Link conversion and header addition complete!"