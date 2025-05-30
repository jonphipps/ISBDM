#!/bin/bash

# Script to convert HTML links to React components in MDX files
# This script specifically targets remaining HTML links in the intro MDX files

TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

for file in "$TARGET_DIR"/*.mdx; do
    # Skip index.mdx and files manually modified
    if [[ $(basename "$file") == "index.mdx" || $(basename "$file") == "i026.mdx" ]]; then
        continue
    fi
    
    echo "Converting links in $(basename "$file")"
    
    # Convert OutLink (external links)
    sed -i '' -E 's/<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' "$file"
    
    # Convert InLink (internal links)
    sed -i '' -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/<InLink href="\1">\2<\/InLink>/g' "$file"
    
    # Fix Examples section
    sed -i '' -E 's/<a class="linkEx"[^>]*>Examples/<h3>Examples<\/h3>/g' "$file"
    
    # Add headers for sections (add h2 before guid div if none exists)
    sed -i '' -E '/^<div className="guid">/{x;s/^$/\n## /;G;}' "$file"
    
    # Update imports if needed
    if grep -q "OutLink" "$file" && ! grep -q "import OutLink" "$file"; then
        sed -i '' '5i\\nimport OutLink from "@site/src/components/global/OutLink";' "$file"
    fi
    
    if grep -q "InLink" "$file" && ! grep -q "import InLink" "$file"; then
        sed -i '' '5i\\nimport InLink from "@site/src/components/global/InLink";' "$file"
    fi
    
    if grep -q "SeeAlso" "$file" && ! grep -q "import SeeAlso" "$file"; then
        sed -i '' '5i\\nimport SeeAlso from "@site/src/components/global/SeeAlso";' "$file"
    fi
    
    # Fix text styling
    sed -i '' 's/"manifestation"/**manifestation**/g' "$file"
    
    # Handle tables with proper Markdown
    if grep -q "Table" "$file"; then
        # Convert simple HTML tables to Markdown format
        sed -i '' -E 's/<table[^>]*>/\n/g' "$file"
        sed -i '' -E 's/<\/table>/\n/g' "$file"
        sed -i '' -E 's/<tr[^>]*>//g' "$file"
        sed -i '' -E 's/<\/tr>//g' "$file"
        sed -i '' -E 's/<td[^>]*>/| /g' "$file"
        sed -i '' -E 's/<\/td>/|/g' "$file"
        
        # Add header rows for tables
        sed -i '' -E 's/^| ([^|]+)\|$/| \1 |\n| --- |/g' "$file"
    fi
    
    # Fix SeeAlso components
    sed -i '' -E 's/See also: (.*)<\/p>/<SeeAlso>\1<\/SeeAlso>/g' "$file"
    
    # Clean any extra blank lines
    sed -i '' -E '/^$/N;/^\n$/D' "$file"
    
    # Fix headings for subsections
    sed -i '' -E 's/^[[:space:]]*([A-Z][^\.]+)$/## \1/g' "$file"
done

echo "Link conversion complete!"