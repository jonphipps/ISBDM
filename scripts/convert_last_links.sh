#!/bin/bash

# Script to convert any remaining HTML links to React components
# This is the final conversion pass for links

TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# Process each file
for file in "$TARGET_DIR"/*.mdx; do
    # Skip index.mdx and i026.mdx which are already manually edited
    if [[ $(basename "$file") == "index.mdx" || $(basename "$file") == "i026.mdx" ]]; then
        continue
    fi
    
    echo "Processing file: $(basename "$file")"
    
    # Convert any remaining external links
    sed -i '' -E 's#<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)</a>#<OutLink href="\1">\2</OutLink>#g' "$file"
    
    # Convert any remaining internal links
    sed -i '' -E 's#<a class="linkInline" href="([^"]+)">([^<]+)</a>#<InLink href="\1">\2</InLink>#g' "$file"
    
    # Convert examples section to proper heading
    sed -i '' -E 's#<a class="linkEx" [^>]+>Examples.*</a>#<h3>Examples</h3>#g' "$file"
    
    # Fix special character escaping for quotes
    sed -i '' 's/&quot;/"/g' "$file"
    
    # Clean up empty lines
    sed -i '' '/^[[:space:]]*$/d' "$file"
done

# Manual fixes for specific files

# Fix i001.mdx - IFLA link
if [[ -f "$TARGET_DIR/i001.mdx" ]]; then
    sed -i '' 's#<a class="linkOutline".*IFLA#<OutLink href="https://repository.ifla.org/handle/20.500.14598/40.2">IFLA#g' "$TARGET_DIR/i001.mdx"
    sed -i '' 's#target="_blank">IFLA.*manifestation\.#>IFLA Library Reference Model</OutLink> entities Work, Expression, Item, Agent, Collective Agent, Person, Place, Time-span, and Nomen that are associated within the description of a manifestation.#g' "$TARGET_DIR/i001.mdx"
fi

# Fix i002.mdx - IFLA link
if [[ -f "$TARGET_DIR/i002.mdx" ]]; then
    sed -i '' 's#<a class="linkOutline".*IFLA.*future\.#<OutLink href="https://repository.ifla.org/handle/20.500.14598/40.2">IFLA Library Reference Model</OutLink> entities in the future.#g' "$TARGET_DIR/i002.mdx"
    sed -i '' 's#<a class="linkEx" [^>]*>Examples#<h3>Examples</h3>#g' "$TARGET_DIR/i002.mdx"
fi

# Fix i007.mdx - statement link
if [[ -f "$TARGET_DIR/i007.mdx" ]]; then
    sed -i '' 's#<a class="linkInline".*statement#<InLink href="/ISBDM/docs/statements/">statement#g' "$TARGET_DIR/i007.mdx"
    sed -i '' 's#transcription rules.*agency\.#transcription rules</InLink> as much as possible with the technology that is available to the cataloguing agency.#g' "$TARGET_DIR/i007.mdx"
fi

# Fix i024.mdx - IFLA link
if [[ -f "$TARGET_DIR/i024.mdx" ]]; then
    sed -i '' 's#<a class="linkOutline".*IFLA.*resource\.#<OutLink href="https://repository.ifla.org/handle/20.500.14598/40.2">IFLA Library Reference Model (LRM)</OutLink> that represent distinct aspects of an information resource.#g' "$TARGET_DIR/i024.mdx"
fi

echo "Final link conversion complete!"