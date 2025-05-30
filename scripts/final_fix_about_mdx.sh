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

# Process the file to remove HTML elements and fix formatting issues
cat "$index_file" | 
  # Skip the first 8 lines (front matter and title) which we've already added
  sed '1,8d' |
  # Remove footer elements
  sed '/^<p class="m-[0-9]/d' |
  sed '/^<a class="me-1"/d' |
  # Convert remaining HTML links
  sed 's/<a class="linkOutline" href="\([^"]*\)" target="_blank">\([^<]*\)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' |
  sed 's/<a class="linkInline" href="\([^"]*\)">\([^<]*\)<\/a>/<InLink href="\1">\2<\/InLink>/g' |
  # Remove <img> tags
  sed 's/<img[^>]*>//g' |
  # Convert header IDs to proper format
  sed 's/^\(## [^{]*\) {#\([a-zA-Z]*\)}/\1 {#\2}/g' |
  # Fix any typos in the text due to line breaks (look for common letter combinations)
  sed 's/hroughout/throughout/g' |
  sed 's/he /the /g' |
  sed 's/o /to /g' |
  sed 's/asks /tasks /g' |
  sed 's/arget/target/g' |
  # Clean up blank lines (keep only one blank line between paragraphs)
  sed '/^$/N;/^\n$/D' >> "$temp_file"

# Replace the original file with the fixed version
mv "$temp_file" "$index_file"

echo "Final MDX cleanup complete: $index_file"