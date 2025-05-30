#!/bin/bash

# Simplified element conversion script without external linters
# This script focuses just on reliable conversion and basic formatting

# Display help information
function show_help {
  echo "Usage: $0 <input-html-file> <output-mdx-file>"
  echo ""
  echo "Converts an HTML element file to MDX format with basic formatting."
  echo "This version avoids external linters that may cause errors."
  echo ""
  echo "Options:"
  echo "  -h, --help     Show this help message"
  echo "  -v, --verbose  Run in verbose mode with detailed output"
  echo ""
  echo "Example:"
  echo "  $0 /path/to/element.html /path/to/output.mdx"
  exit 0
}

# Set default options
VERBOSE=0

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      ;;
    -v|--verbose)
      VERBOSE=1
      shift
      ;;
    *)
      if [[ -z "$INPUT_FILE" ]]; then
        INPUT_FILE="$1"
      elif [[ -z "$OUTPUT_FILE" ]]; then
        OUTPUT_FILE="$1"
      else
        echo "Error: Too many arguments provided"
        show_help
      fi
      shift
      ;;
  esac
done

# Check if we have the required arguments
if [ -z "$INPUT_FILE" ] || [ -z "$OUTPUT_FILE" ]; then
  echo "Error: Both input and output files must be specified"
  show_help
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: Input file $INPUT_FILE does not exist"
  exit 1
fi

# Function to log verbose messages
function verbose_log {
  if [ $VERBOSE -eq 1 ]; then
    echo "$1"
  fi
}

echo "Converting $INPUT_FILE to $OUTPUT_FILE"

# Step 1: Basic conversion
echo "Step 1: Converting HTML to MDX..."
yarn convert-element:improved "$INPUT_FILE" "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
  echo "Error: Initial conversion failed"
  exit 1
fi
verbose_log "Initial conversion completed"

# Step 2: Basic formatting
echo "Step 2: Applying basic formatting..."
yarn format-mdx "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
  echo "Warning: Formatting encountered issues, but continuing..."
fi
verbose_log "Basic formatting completed"

# Step 3: Fix table formatting
echo "Step 3: Fixing table formatting..."
yarn fix-table-format "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
  echo "Warning: Table formatting encountered issues, but continuing..."
fi
verbose_log "Table formatting completed"

echo "Done! File converted with basic formatting: $OUTPUT_FILE"
echo "Note: Manual review is recommended for optimal results."
exit 0