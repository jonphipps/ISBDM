#!/bin/bash

# Path to the index.mdx file
index_file="/Users/jonphipps/Code/ISBDM/docs/about/index.mdx"

# Create a temporary file with proper content
temp_file=$(mktemp)

# Write the front matter and imports
cat > "$temp_file" << EOL
---
sidebar_position: 1
---

import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

# About ISBD for Manifestation
EOL

# Extract the content starting after the duplicate title line
awk 'BEGIN{start=0} 
     /^# About ISBD for Manifestation$/{if (start==0) {start=1; next}} 
     {if (start==1) print}' "$index_file" > "${temp_file}.content"

# Convert HTML links to React components
sed -i '' -e 's/<a class="linkOutline" href="\([^"]*\)" target="_blank">\([^<]*\)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' \
       -e 's/<a class="linkInline" href="\([^"]*\)">\([^<]*\)<\/a>/<InLink href="\1">\2<\/InLink>/g' "${temp_file}.content"

# Append the processed content to the temp file
cat "${temp_file}.content" >> "$temp_file"

# Replace the original file with the fixed version
mv "$temp_file" "$index_file"

# Clean up
rm -f "${temp_file}.content"

echo "Final fix applied: $index_file"