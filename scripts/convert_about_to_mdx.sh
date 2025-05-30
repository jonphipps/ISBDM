#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p /Users/jonphipps/Code/ISBDM/docs/about/temp

# Function to convert an HTML file to MDX format
convert_to_mdx() {
  input_file=$1
  output_file=$2
  id=$(basename "$input_file" .html)
  
  # Extract the main content and convert to MDX
  content=$(grep -A 10000 '<div class="col-md-7 border rounded">' "$input_file" | 
            sed -n '/<div class="row m-1">/,/<\/div><\/div><\/div>/p' |
            sed '1d' | sed '$d' |
            sed 's/<h3>/## /g' |
            sed 's/<\/h3>//g' |
            sed 's/<h4>/### /g' |
            sed 's/<\/h4>//g' |
            sed 's/<h5>/#### /g' |
            sed 's/<\/h5>//g' |
            sed 's/<div class="guid">//g' |
            sed 's/<div class="guid seeAlso">//g' |
            sed 's/<\/div>//g' |
            sed 's/<i>See also<\/i>:/***See also***:/g' |
            sed 's/<p>//g' |
            sed 's/<\/p>//g' |
            sed 's/&quot;/"/g' |
            sed 's/<span class="thisem">/\*\*/g' |
            sed 's/<\/span>/\*\*/g' |
            sed 's/<ul class="bull">/\n/g' |
            sed 's/<\/ul>//g' |
            sed 's/<ol class="num">/\n/g' |
            sed 's/<\/ol>//g' |
            sed 's/<li>/- /g' |
            sed 's/<\/li>//g' |
            sed 's/<a class="linkOutline" href="\([^"]*\)" target="_blank">\([^<]*\)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' |
            sed 's/<a class="linkInline" href="\([^"]*\)">\([^<]*\)<\/a>/<InLink href="\1">\2<\/InLink>/g' |
            sed 's/<div class="[^"]*">//g' |
            sed 's/<div class="row border">//g' |
            sed 's/<div class="col-md-[0-9]* [^"]*">//g' |
            sed 's/<div class="px-4">//g')
    
  # Remove HTML tags and scripts
  content=$(echo "$content" | grep -v "</main>" | grep -v "</footer>" | grep -v "</body>" | grep -v "</script>" | grep -v "<script")
  
  # Add blank line between paragraphs
  content=$(echo "$content" | sed 's/$/<NEWLINE>/' | tr -d '\n' | sed 's/<NEWLINE>/\n\n/g')
  
  # Clean up multiple blank lines
  content=$(echo "$content" | sed -e '/^$/N;/^\n$/D')
  
  # Add ID to the file if not index
  if [ "$id" != "index" ]; then
    heading=$(echo "$content" | grep -m 1 "^##" | sed 's/^## //')
    content=$(echo "$content" | sed "1s/## $heading/## $heading {#$id}/")
  fi
  
  # Write content to file
  echo "$content" > "$output_file"
}

# Convert each file with proper heading levels
convert_to_mdx "/Users/jonphipps/Code/ISBDM/ISBDM/docs/about/index.html" "/Users/jonphipps/Code/ISBDM/docs/about/temp/01_index.mdx"
convert_to_mdx "/Users/jonphipps/Code/ISBDM/ISBDM/docs/about/abUse.html" "/Users/jonphipps/Code/ISBDM/docs/about/temp/02_abUse.mdx"
convert_to_mdx "/Users/jonphipps/Code/ISBDM/ISBDM/docs/about/abApp.html" "/Users/jonphipps/Code/ISBDM/docs/about/temp/03_abApp.mdx"
convert_to_mdx "/Users/jonphipps/Code/ISBDM/ISBDM/docs/about/abStan.html" "/Users/jonphipps/Code/ISBDM/docs/about/temp/04_abStan.mdx"
convert_to_mdx "/Users/jonphipps/Code/ISBDM/ISBDM/docs/about/abBack.html" "/Users/jonphipps/Code/ISBDM/docs/about/temp/05_abBack.mdx"
convert_to_mdx "/Users/jonphipps/Code/ISBDM/ISBDM/docs/about/abCred.html" "/Users/jonphipps/Code/ISBDM/docs/about/temp/06_abCred.mdx"
convert_to_mdx "/Users/jonphipps/Code/ISBDM/ISBDM/docs/about/abStat.html" "/Users/jonphipps/Code/ISBDM/docs/about/temp/07_abStat.mdx"
convert_to_mdx "/Users/jonphipps/Code/ISBDM/ISBDM/docs/about/abFeed.html" "/Users/jonphipps/Code/ISBDM/docs/about/temp/08_abFeed.mdx"

# Create the index.mdx file with front matter
cat > /Users/jonphipps/Code/ISBDM/docs/about/index.mdx << EOL
---
sidebar_position: 1
---

import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

# About ISBD for Manifestation

EOL

# Concatenate all the converted files in order
for file in /Users/jonphipps/Code/ISBDM/docs/about/temp/*.mdx; do
  cat "$file" >> /Users/jonphipps/Code/ISBDM/docs/about/index.mdx
  echo -e "\n\n" >> /Users/jonphipps/Code/ISBDM/docs/about/index.mdx
done

# Clean up temporary files
rm -rf /Users/jonphipps/Code/ISBDM/docs/about/temp

echo "Conversion complete. Output file: /Users/jonphipps/Code/ISBDM/docs/about/index.mdx"