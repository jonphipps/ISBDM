#!/bin/bash

# Path to the index.mdx file
index_file="/Users/jonphipps/Code/ISBDM/docs/about/index.mdx"

# Create a temporary file
temp_file=$(mktemp)

# Fix the remaining double-t typos and convert HTML links to React components
sed -e 's/tthroughout/throughout/g' \
    -e 's/tterminologies/terminologies/g' \
    -e 's/Tto/To/g' \
    -e 's/"tthe /"the /g' \
    -e 's/ ttarget="_blank"/ target="_blank"/g' \
    -e 's/<a class="linkOutline" href="\([^"]*\)" target="_blank">\([^<]*\)<\/a>/<OutLink href="\1">\2<\/OutLink>/g' \
    -e 's/<a class="linkInline" href="\([^"]*\)">\([^<]*\)<\/a>/<InLink href="\1">\2<\/InLink>/g' \
    "$index_file" > "$temp_file"

# Replace the original file with the fixed version
mv "$temp_file" "$index_file"

echo "Final cleanup complete: $index_file"