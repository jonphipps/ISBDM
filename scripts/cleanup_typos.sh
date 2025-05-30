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

# Process the file to fix typos and convert HTML links
cat "$index_file" | 
  # Skip the first 8 lines (front matter and title) which we've already added
  sed '1,8d' |
  # Fix the "t" typos
  sed 's/Tthe /The /g' |
  sed 's/ tto / to /g' |
  sed 's/ ttarget="_blank"/ target="_blank"/g' |
  sed 's/ sto / so /g' |
  sed 's/ alsto / also /g' |
  sed 's/ tthe / the /g' |
  sed 's/ nto / no /g' |
  sed 's/ intto / into /g' |
  sed 's/ undergto / undergo /g' |
  sed 's/Escolanto /Escolano /g' |
  sed 's/Ministerito /Ministerio /g' |
  sed 's/Deutscthe /Deutsche /g' |
  sed 's/Ignacito /Ignacio /g' |
  sed 's/Massimto /Massimo /g' |
  sed 's/Restrepto /Restrepo /g' |
  sed 's/ twto / two /g' |
  sed 's/hroughout/throughout/g' |
  sed 's/erminologies/terminologies/g' |
  # Convert remaining HTML links
  sed 's/<a class="linkOutline" href="\([^"]*\)" t\{1,2\}arget="_blank">\([^<]*\)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' |
  sed 's/<a class="linkInline" href="\([^"]*\)">\([^<]*\)<\/a>/<InLink href="\1">\2<\/InLink>/g' |
  # Remove image tags and extra HTML
  sed '/src="\/ISBDM\/images\/cc0_by.png"/d' |
  sed '/alt="Badge for Creative/d' |
  sed '/\/>.*Gordon Dunsire/d' |
  # Remove double blank lines
  sed '/^$/N;/^\n$/D' >> "$temp_file"

# Replace the original file with the fixed version
mv "$temp_file" "$index_file"

echo "Typo cleanup complete: $index_file"