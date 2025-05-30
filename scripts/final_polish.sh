#!/bin/bash

# Path to the index.mdx file
index_file="/Users/jonphipps/Code/ISBDM/docs/about/index.mdx"

# Create a temporary file
temp_file=$(mktemp)

# Create content for the temp file with proper imports
cat > "$temp_file" << EOL
---
sidebar_position: 1
---

import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

# About ISBD for Manifestation
EOL

# Process the file to fix issues
# 1. Skip the existing front matter and duplicate title
# 2. Convert HTML links to React components
# 3. Add proper spacing between paragraphs
sed -n '9,$p' "$index_file" | # Skip the front matter and imports
  sed '1d' | # Remove the duplicate title
  sed 's/<a class="linkOutline" href="\([^"]*\)" target="_blank">\([^<]*\)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' |
  sed 's/<a class="linkInline" href="\([^"]*\)">\([^<]*\)<\/a>/<InLink href="\1">\2<\/InLink>/g' |
  sed '/^$/N;/^\n$/D' >> "$temp_file"

# Replace the original file with the fixed version
mv "$temp_file" "$index_file"

echo "Final polish applied: $index_file"