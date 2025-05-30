#!/bin/bash

# Enhanced Element Conversion Pipeline
# This script combines our improved HTML-to-MDX conversion tools into a complete pipeline

# Check if arguments are provided
if [ $# -lt 2 ]; then
  echo "Usage: $0 <input-html-file> <output-mdx-file>"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"
FORCE_OVERWRITE=${3:-false}

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: Input file $INPUT_FILE does not exist"
  exit 1
fi

# Check if output file already exists and we're not forcing overwrite
if [ -f "$OUTPUT_FILE" ] && [ "$FORCE_OVERWRITE" != "true" ]; then
  read -p "Output file $OUTPUT_FILE already exists. Overwrite? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Conversion cancelled."
    exit 0
  fi
fi

# Ensure parent directory for output file exists
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
mkdir -p "$OUTPUT_DIR"

# Step 1: Initial conversion from HTML to MDX
echo "Step 1: Converting HTML to MDX..."
node /Users/jonphipps/Code/ISBDM/scripts/convert-html-element-to-mdx-improved.mjs "$INPUT_FILE" "$OUTPUT_FILE"

if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: Conversion failed. Output file $OUTPUT_FILE was not created."
  exit 1
fi

# Step 2: Fix table formatting
echo "Step 2: Fixing table formatting..."
node /Users/jonphipps/Code/ISBDM/scripts/fix-table-format.js "$OUTPUT_FILE"

# Step 3: Fix repeated examples
echo "Step 3: Fixing repeated examples..."
node /Users/jonphipps/Code/ISBDM/scripts/fix-all-repeated-examples-enhanced.js "$OUTPUT_FILE"

echo "Conversion completed successfully!"
echo "Input: $INPUT_FILE"
echo "Output: $OUTPUT_FILE"

# Show a preview of the generated MDX file
echo "==== Preview of MDX file (first 10 lines) ===="
head -n 10 "$OUTPUT_FILE"
echo "..."