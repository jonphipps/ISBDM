#!/bin/bash

# Fix common issues in converted intro MDX files
# This script addresses formatting issues, particularly with nested numbered lists

# Set target directory
TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# Process each MDX file (except index.mdx and i026.mdx)
for file in "$TARGET_DIR"/*.mdx; do
    # Skip index.mdx and i026.mdx as they've been manually modified
    if [[ $(basename "$file") == "index.mdx" || $(basename "$file") == "i026.mdx" ]]; then
        continue
    fi
    
    file_id=$(basename "$file" .mdx)
    echo "Fixing $file"
    
    # Preserve the existing frontmatter and imports
    frontmatter=$(sed -n '1,/^---$/p' "$file" | head -n -1)
    imports=""
    if grep -q "import " "$file"; then
        imports=$(grep "import " "$file")
    fi
    
    # Fix outer div tags - convert class to className
    sed -i '' 's/<div class="guid">/<div className="guid">/g' "$file"
    sed -i '' 's/<div class="seeAlso">/<div className="seeAlso">/g' "$file"
    
    # Convert ISBD for Manifestation to bold 
    sed -i '' 's/ISBD for Manifestation/**ISBD for Manifestation**/g' "$file"
    
    # Convert external links to OutLink components
    sed -i '' -E 's/<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' "$file"
    
    # Convert internal links to InLink components
    sed -i '' -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/<InLink href="\1">\2<\/InLink>/g' "$file"
    
    # Fix ordered lists (convert HTML numbers to Markdown numbers)
    sed -i '' -E 's/<ol>/\n/g' "$file"
    sed -i '' -E 's/<\/ol>/\n/g' "$file"
    sed -i '' -E 's/<li>([^<]+)<\/li>/1. \1/g' "$file"
    
    # Fix nested ordered lists - add proper indentation
    sed -i '' -E 's/1\. [0-9]+\. /1. /g' "$file"
    sed -i '' -E 's/^ +1\. /   1. /g' "$file"
    
    # Add proper spacing between list items
    sed -i '' -E 's/1\. (.+)$/1. \1\n/g' "$file"
    
    # Fix bullet lists
    sed -i '' -E 's/<ul class="bull">/\n/g' "$file"
    sed -i '' -E 's/<\/ul>/\n/g' "$file"
    sed -i '' -E 's/<li>([^<]+)<\/li>/- \1/g' "$file"
    
    # Fix examples
    sed -i '' -E 's/<a class="linkEx"[^>]+>Examples/### Examples/g' "$file"
    
    # Remove unnecessary HTML tags
    sed -i '' -E 's/<\/?p>//g' "$file"
    sed -i '' -E 's/<\/?span[^>]*>//g' "$file"
    sed -i '' -E 's/<\/?i>//g' "$file"
    
    # Clean up extra blank lines
    sed -i '' -E '/^[[:space:]]*$/N;/^\n[[:space:]]*$/D' "$file"
    
    # Ensure SeeAlso component is properly formatted
    sed -i '' -E 's/See also: /<SeeAlso>/g' "$file"
    sed -i '' -E 's/See also /<SeeAlso>/g' "$file"
    
    # Fix empty div tags
    sed -i '' -E '/^<div className="guid">$/{N;/^<div className="guid">\n*$/d;}' "$file"
    
    # Add proper imports if they don't exist
    if grep -q "OutLink" "$file" && ! grep -q "import OutLink" "$file"; then
        imports="${imports}\nimport OutLink from '@site/src/components/global/OutLink';"
    fi
    
    if grep -q "InLink" "$file" && ! grep -q "import InLink" "$file"; then
        imports="${imports}\nimport InLink from '@site/src/components/global/InLink';"
    fi
    
    if grep -q "SeeAlso" "$file" && ! grep -q "import SeeAlso" "$file"; then
        imports="${imports}\nimport SeeAlso from '@site/src/components/global/SeeAlso';"
    fi
    
    echo "Fixes applied to $file"
done

echo "All formatting fixes completed!"