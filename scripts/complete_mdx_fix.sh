#!/bin/bash

# Path to the index.mdx file
index_file="/Users/jonphipps/Code/ISBDM/docs/about/index.mdx"

# Create a temporary file
temp_file=$(mktemp)

# Create front matter and imports at the beginning of the temp file
cat > "$temp_file" << EOL
---
sidebar_position: 1
---

import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

# About ISBD for Manifestation

EOL

# Process the file to fix remaining issues
sed '1,8d' "$index_file" | # Skip the existing front matter and imports
  sed '1d' | # Remove the duplicate title
  sed 's/<a class="linkOutline" href="\([^"]*\)" target="_blank">\([^<]*\)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' |
  sed 's/<a class="linkInline" href="\([^"]*\)">\([^<]*\)<\/a>/<InLink href="\1">\2<\/InLink>/g' |
  sed '/^$/N;/^\n$/D' >> "$temp_file"

# Replace the original file with the fixed version
mv "$temp_file" "$index_file"

echo "Complete MDX fix applied: $index_file"