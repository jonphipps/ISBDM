#!/bin/bash

# Convert intro HTML files to MDX (macOS compatible version)
# This script converts all HTML files in the ISBDM/docs/intro folder to MDX
# with special attention to nested numbered lists and component references

# Set source and target directories
SOURCE_DIR="/Users/jonphipps/Code/ISBDM/ISBDM/docs/intro"
TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Process each HTML file (except index.html)
for file in "$SOURCE_DIR"/*.html; do
    # Skip index.html, we'll handle it separately
    if [[ $(basename "$file") == "index.html" ]]; then
        continue
    fi
    
    # Get file ID and create target filename
    id=$(basename "$file" .html)
    target_file="$TARGET_DIR/${id}.mdx"
    
    # Extract title from h3 tag
    title=$(grep '<h3>' "$file" | sed -E 's/.*<h3>([^<]+)<\/h3>.*/\1/' | head -1)
    
    echo "Converting $file to $target_file (ID: $id, Title: $title)"
    
    # Create MDX frontmatter
    echo "---" > "$target_file"
    echo "id: $id" >> "$target_file"
    echo "title: \"$title\"" >> "$target_file"
    echo "slug: \"/intro/$id\"" >> "$target_file"
    echo "---" >> "$target_file"
    echo "" >> "$target_file"
    
    # Add import statements for components
    if grep -q 'class="seeAlso"' "$file"; then
        echo "import SeeAlso from '@site/src/components/global/SeeAlso';" >> "$target_file"
        echo "" >> "$target_file"
    fi

    if grep -q 'class="linkOutline"' "$file"; then
        echo "import OutLink from '@site/src/components/global/OutLink';" >> "$target_file"
        echo "" >> "$target_file"
    fi

    if grep -q 'class="linkInline"' "$file"; then
        echo "import InLink from '@site/src/components/global/InLink';" >> "$target_file"
        echo "" >> "$target_file"
    fi
    
    # Extract content from the main div
    sed -n '/<div class="col-md-7 border rounded">/,/<\/footer>/p' "$file" |
    sed -n '/<div class="row m-1">/,/<\/div>/p' |
    # Skip the first line containing the div class="row" tag
    tail -n +1 |
    # Remove the title that we extracted separately
    sed '/<h3>/d' |
    # Process each line
    while IFS= read -r line; do
        # Convert div class="guid" to div className="guid"
        if [[ "$line" == *'<div class="guid">'* ]]; then
            echo "<div className=\"guid\">" >> "$target_file"
        
        # Convert div class="seeAlso" to SeeAlso component
        elif [[ "$line" == *'<div class="seeAlso">'* ]]; then
            # Skip this line - SeeAlso component will be added when we find the See also link
            continue
        
        # Handle See also links with SeeAlso component
        elif [[ "$line" == *'<p><i>See also</i>'* ]]; then
            # Extract the links
            links=$(echo "$line" | sed -E 's/.*<p><i>See also<\/i>: (.*)<\/p>.*/\1/')
            # Process each link
            echo "<SeeAlso>" >> "$target_file"
            echo "$links" | sed -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/[\2](\1)/g' >> "$target_file"
            echo "</SeeAlso>" >> "$target_file"
        
        # Convert unordered lists
        elif [[ "$line" == *'<ul class="bull">'* ]]; then
            echo "" >> "$target_file"
        
        # Handle list items for unordered lists
        elif [[ "$line" == *'<li>'* && "$line" != *'<ol>'* ]]; then
            item=$(echo "$line" | sed -E 's/<li>(.*)<\/li>/- \1/g')
            echo "$item" >> "$target_file"
        
        # Handle numbered list items and nested items
        elif [[ "$line" == *'<ol>'* ]]; then
            echo "" >> "$target_file"
        
        # Handle list items for ordered lists
        elif [[ "$line" == *'</ol>'* ]]; then
            echo "" >> "$target_file"
        
        # Convert paragraphs but preserve content
        elif [[ "$line" == *'<p>'* && "$line" != *'<i>See also</i>'* ]]; then
            # Clean paragraph content but preserve internal links
            cleaned=$(echo "$line" | sed -E 's/<p>(.*)<\/p>/\1/g')
            
            # Convert internal links to Markdown format
            cleaned=$(echo "$cleaned" | sed -E 's/<a class="linkInline" href="([^"]+)">([^<]+)<\/a>/[\2](\1)/g')
            
            # Convert external links to Markdown format
            cleaned=$(echo "$cleaned" | sed -E 's/<a class="linkOutline" href="([^"]+)" target="_blank">([^<]+)<\/a>/[\2](\1)/g')
            
            # Convert special spans
            cleaned=$(echo "$cleaned" | sed -E 's/<span class="thisem">([^<]+)<\/span>/**\1**/g')
            
            echo "$cleaned" >> "$target_file"
            echo "" >> "$target_file"
        
        # Skip closing divs
        elif [[ "$line" == '</div>'* ]]; then
            continue
        
        # Default pass-through with HTML tag removal
        else
            # Remove HTML tags but preserve content
            cleaned=$(echo "$line" | sed -E 's/<[^>]+>//g')
            if [[ -n "$cleaned" ]]; then
                echo "$cleaned" >> "$target_file"
            fi
        fi
    done
    
    # Clean up the file:
    # 1. Remove empty lines
    # 2. Fix quotes and special characters
    # 3. Ensure proper Markdown formatting
    sed -i '' -e '/^[[:space:]]*$/d' \
        -e 's/&quot;/"/g' \
        -e 's/&lt;/</g' \
        -e 's/&gt;/>/g' \
        -e 's/&amp;/\&/g' \
        "$target_file"
    
    echo "Completed conversion for $id"
done

echo "All files converted. Any remaining issues can be fixed manually."