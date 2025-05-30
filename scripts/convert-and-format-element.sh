#!/bin/bash

# Script to convert an HTML element file to MDX and apply formatting in one step

# Check if we have the required arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 <input-html-file> <output-mdx-file>"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: Input file $INPUT_FILE does not exist"
  exit 1
fi

# Check if input file is an HTML file
if [[ "$INPUT_FILE" != *.html ]]; then
  echo "Warning: Input file $INPUT_FILE doesn't have .html extension"
fi

# Check if output file has .mdx extension
if [[ "$OUTPUT_FILE" != *.mdx ]]; then
  echo "Warning: Output file $OUTPUT_FILE doesn't have .mdx extension"
fi

# Convert the file
echo "Converting $INPUT_FILE to $OUTPUT_FILE..."
yarn convert-element "$INPUT_FILE" "$OUTPUT_FILE" 

if [ $? -ne 0 ]; then
  echo "Error: Conversion failed"
  exit 1
fi

# Fix tables and formatting
echo "Fixing formatting in $OUTPUT_FILE..."
yarn fix-tables "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
  echo "Error: Table formatting failed"
  exit 1
fi

# Fix frontmatter using the robust version
echo "Fixing frontmatter in $OUTPUT_FILE..."
yarn fix-frontmatter:robust "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
  echo "Error: Frontmatter fixing failed"
  exit 1
fi

echo "Done! File successfully converted and formatted."
exit 0