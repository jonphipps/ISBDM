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
  # Skip the front matter/imports that we just added
  sed '1,7d' |
  # Remove HTML tags
  grep -v "<footer" | 
  grep -v "<\/footer>" | 
  grep -v "<\/main>" | 
  grep -v "<\/body>" | 
  grep -v "<script" | 
  grep -v "map</a>" |
  # Fix HTML link tags that weren't properly converted
  sed 's/<a class="linkOutline" href="\([^"]*\)" target="_blank">\([^<]*\)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' |
  sed 's/<a class="linkInline" href="\([^"]*\)">\([^<]*\)<\/a>/<InLink href="\1">\2<\/InLink>/g' |
  sed 's/<a class="me-1" href="\([^"]*\)">[^<]*<\/a>//g' |
  # Remove image tags
  sed 's/<img[^>]*>//g' |
  # Remove extra whitespace and blank lines
  sed 's/^[ \t]*//g' |
  sed '/^$/N;/^\n$/D' |
  # Fix section IDs
  sed 's/##  {#\([a-zA-Z]*\)}\(.*\)/## \2 {#\1}/g' |
  # Format the lists properly
  sed 's/<ul[^>]*>//g' |
  sed 's/<\/ul>//g' |
  # Fix any remnants of div tags
  sed 's/<div[^>]*>//g' |
  sed 's/<\/div>//g' >> "$temp_file"

# Replace the original file with the fixed version
mv "$temp_file" "$index_file"

echo "Fixed MDX file at: $index_file"