#!/bin/bash

# Convert intro HTML files to MDX
# This script converts all HTML files in the ISBDM/docs/intro folder to MDX
# with special attention to nested numbered lists and component references

# Set source and target directories
SOURCE_DIR="/Users/jonphipps/Code/ISBDM/ISBDM/docs/intro"
TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Function to convert a file
convert_file() {
    local source_file="$1"
    local target_file="$2"
    local id=$(basename "$source_file" .html)
    local title=$(grep -oP '<h3>\K[^<]+' "$source_file" | head -1)
    
    echo "Converting $source_file to $target_file (ID: $id, Title: $title)"
    
    # Extract main content
    content=$(grep -A 1000 '<div class="col-md-7 border rounded">' "$source_file" | sed -n '/<div class="row m-1">/,/<\/div>$/p' | head -n -3)
    
    # Remove the h3 heading and enclosing div tags
    content=$(echo "$content" | sed 's/<div class="row m-1">//g' | sed 's/<h3>.*<\/h3>//g')
    
    # Create MDX frontmatter
    echo "---" > "$target_file"
    echo "id: $id" >> "$target_file"
    echo "title: \"$title\"" >> "$target_file"
    echo "slug: \"/intro/$id\"" >> "$target_file"
    echo "---" >> "$target_file"
    echo "" >> "$target_file"
    
    # Extract and process content divs, removing leading/trailing divs
    echo "$content" | grep -v "</div>$" | while IFS= read -r line; do
        # Convert div class="guid" to MDX div className
        if [[ "$line" == *'<div class="guid">'* ]]; then
            echo '<div className="guid">' >> "$target_file"
        
        # Convert div class="seeAlso" to SeeAlso component
        elif [[ "$line" == *'<div class="seeAlso">'* ]]; then
            # Skip this line and process <p><i>See also</i>: in the next iteration
            continue
        
        # Handle See also links with SeeAlso component
        elif [[ "$line" == *'<p><i>See also</i>'* ]]; then
            # Extract the link and text
            link=$(echo "$line" | grep -oP 'href="\K[^"]+')
            text=$(echo "$line" | grep -oP '">([^<]+)' | sed 's/">//g')
            echo "<SeeAlso>[$text]($link)</SeeAlso>" >> "$target_file"
        
        # Convert internal links
        elif [[ "$line" == *'<a class="linkInline"'* ]]; then
            # Extract href and text
            href=$(echo "$line" | grep -oP 'href="\K[^"]+')
            text=$(echo "$line" | grep -oP '">([^<]+)' | sed 's/">//g')
            line=$(echo "$line" | sed "s|<a class=\"linkInline\" href=\"[^\"]*\">[^<]*</a>|[$text]($href)|g")
            echo "$line" >> "$target_file"
        
        # Convert external links
        elif [[ "$line" == *'<a class="linkOutline"'* ]]; then
            # Extract href and text
            href=$(echo "$line" | grep -oP 'href="\K[^"]+')
            text=$(echo "$line" | grep -oP '">([^<]+)' | sed 's/">//g')
            line=$(echo "$line" | sed "s|<a class=\"linkOutline\" href=\"[^\"]*\" target=\"_blank\">[^<]*</a>|[$text]($href)|g")
            echo "$line" >> "$target_file"
        
        # Handle special class="thisem"
        elif [[ "$line" == *'<span class="thisem">'* ]]; then
            line=$(echo "$line" | sed 's/<span class="thisem">/***/'g | sed 's/<\/span>/***/'g)
            echo "$line" >> "$target_file"
        
        # Convert unordered lists
        elif [[ "$line" == *'<ul class="bull">'* ]]; then
            echo "" >> "$target_file"
        
        # Convert list items
        elif [[ "$line" == *'<li>'* ]]; then
            item=$(echo "$line" | sed 's/<li>/- /'g | sed 's/<\/li>//'g)
            echo "$item" >> "$target_file"
        
        # End of list
        elif [[ "$line" == *'</ul>'* ]]; then
            echo "" >> "$target_file"
        
        # Handle nested numbered lists - special attention for this section
        elif [[ "$line" == *'<ol>'* ]]; then
            echo "" >> "$target_file"
            # We'll handle the numbering in the next iterations
        
        # Closing ordered list
        elif [[ "$line" == *'</ol>'* ]]; then
            echo "" >> "$target_file"
        
        # Handle paragraphs
        elif [[ "$line" == *'<p>'* ]]; then
            line=$(echo "$line" | sed 's/<p>//g' | sed 's/<\/p>//g')
            echo "$line" >> "$target_file"
            echo "" >> "$target_file"
        
        # Skip closing divs or empty lines
        elif [[ "$line" == *'</div>'* || -z "$line" ]]; then
            continue
        
        # Default: pass through line
        else
            echo "$line" >> "$target_file"
        fi
    done
    
    # Add import for SeeAlso component if needed
    if grep -q "<SeeAlso>" "$target_file"; then
        sed -i '' '5i\\nimport SeeAlso from "@site/src/components/global/SeeAlso";' "$target_file"
    fi
    
    # Add import for other components if needed
    if grep -q "<OutLink>" "$target_file"; then
        sed -i '' '5i\\nimport OutLink from "@site/src/components/global/OutLink";' "$target_file"
    fi
    
    if grep -q "<InLink>" "$target_file"; then
        sed -i '' '5i\\nimport InLink from "@site/src/components/global/InLink";' "$target_file"
    fi
    
    # Clean up any remaining HTML tags
    sed -i '' 's/<[^>]*>//g' "$target_file"
    
    # Fix double quotes in frontmatter
    sed -i '' 's/title: \"\"/title: \"'"$title"'\"/g' "$target_file"
    
    echo "Conversion completed for $id"
}

# Process all HTML files in source directory
for file in "$SOURCE_DIR"/*.html; do
    # Skip index.html, we'll handle it separately
    if [[ $(basename "$file") == "index.html" ]]; then
        continue
    fi
    
    # Generate target filename
    target_file="$TARGET_DIR/$(basename "$file" .html).mdx"
    
    # Convert the file
    convert_file "$file" "$target_file"
done

echo "All files converted. Now running post-processing fixes..."

# Post-processing to fix common issues
for mdx_file in "$TARGET_DIR"/*.mdx; do
    # Skip index.mdx
    if [[ $(basename "$mdx_file") == "index.mdx" ]]; then
        continue
    fi
    
    # Fix nested numbered lists
    sed -i '' 's/^[0-9]\. /1. /g' "$mdx_file"  # Convert all numbered list items to start with 1.
    sed -i '' 's/^[0-9]\.[0-9]\. /   1. /g' "$mdx_file"  # Add proper indentation for nested lists
    
    # Fix quotes and special characters
    sed -i '' 's/&quot;/"/g' "$mdx_file"
    sed -i '' 's/&lt;/</g' "$mdx_file"
    sed -i '' 's/&gt;/>/g' "$mdx_file"
    sed -i '' 's/&amp;/\&/g' "$mdx_file"
    
    # Remove extra blank lines
    sed -i '' '/^$/N;/^\n$/D' "$mdx_file"
done

echo "Conversion complete! Please check the MDX files in $TARGET_DIR"