#!/bin/bash

# Batch Element Conversion Tool
# This script converts multiple HTML element files to MDX format in one operation

# Default values
INPUT_DIR=""
OUTPUT_DIR=""
FILE_PATTERN="*.html"
FORCE_OVERWRITE=false
VERBOSE=false
EXCLUDE_PATTERN="general.html|transcription.html|index.html"

# Display help
show_help() {
  echo "Batch HTML Element to MDX Conversion Tool"
  echo "Usage: $0 -i <input-dir> -o <output-dir> [options]"
  echo
  echo "Options:"
  echo "  -i, --input-dir DIR    Input directory containing HTML files"
  echo "  -o, --output-dir DIR   Output directory for MDX files"
  echo "  -p, --pattern GLOB     File pattern to match (default: *.html)"
  echo "  -e, --exclude REGEX    Files to exclude (default: general.html|transcription.html|index.html)"
  echo "  -f, --force            Force overwrite existing files"
  echo "  -v, --verbose          Verbose output"
  echo "  -h, --help             Show this help message"
  echo
  echo "Example:"
  echo "  $0 -i /path/to/html/files -o /path/to/mdx/output -f"
}

# Parse command line arguments
while (( "$#" )); do
  case "$1" in
    -i|--input-dir)
      INPUT_DIR="$2"
      shift 2
      ;;
    -o|--output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -p|--pattern)
      FILE_PATTERN="$2"
      shift 2
      ;;
    -e|--exclude)
      EXCLUDE_PATTERN="$2"
      shift 2
      ;;
    -f|--force)
      FORCE_OVERWRITE=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    -*|--*=)
      echo "Error: Unsupported flag $1" >&2
      show_help
      exit 1
      ;;
    *)
      echo "Error: Unexpected positional argument $1" >&2
      show_help
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT_DIR" ]; then
  echo "Error: Input and output directories are required" >&2
  show_help
  exit 1
fi

# Ensure directories exist
if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: Input directory $INPUT_DIR does not exist" >&2
  exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Find HTML files to convert
HTML_FILES=$(find "$INPUT_DIR" -type f -name "$FILE_PATTERN" | grep -v -E "$EXCLUDE_PATTERN")
FILE_COUNT=$(echo "$HTML_FILES" | wc -l)

if [ -z "$HTML_FILES" ]; then
  echo "No HTML files found matching pattern '$FILE_PATTERN' in $INPUT_DIR"
  exit 0
fi

echo "Found $FILE_COUNT HTML files to convert"
if [ "$VERBOSE" = true ]; then
  echo "Files to convert:"
  echo "$HTML_FILES"
  echo "--------------------"
fi

# Process each file
CONVERTED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

for HTML_FILE in $HTML_FILES; do
  # Get the basename of the file without extension
  BASENAME=$(basename "$HTML_FILE" .html)
  
  # Create the output file path
  MDX_FILE="$OUTPUT_DIR/$BASENAME.mdx"
  
  # Check if output file exists and we're not forcing overwrite
  if [ -f "$MDX_FILE" ] && [ "$FORCE_OVERWRITE" != true ]; then
    echo "Skipping $HTML_FILE (output file $MDX_FILE already exists)"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi
  
  # Convert the file
  echo "Converting $HTML_FILE to $MDX_FILE"
  
  if [ "$VERBOSE" = true ]; then
    /Users/jonphipps/Code/ISBDM/scripts/convert-element-improved.sh "$HTML_FILE" "$MDX_FILE" "$FORCE_OVERWRITE"
  else
    /Users/jonphipps/Code/ISBDM/scripts/convert-element-improved.sh "$HTML_FILE" "$MDX_FILE" "$FORCE_OVERWRITE" > /dev/null
  fi
  
  # Fix repeated examples separately (in case the main script failed but created a file)
  if [ -f "$MDX_FILE" ]; then
    node /Users/jonphipps/Code/ISBDM/scripts/fix-all-repeated-examples-enhanced.js "$MDX_FILE" > /dev/null 2>&1 || true
  fi
  
  # Check if conversion was successful
  if [ $? -eq 0 ] && [ -f "$MDX_FILE" ]; then
    CONVERTED_COUNT=$((CONVERTED_COUNT + 1))
    echo "✓ Successfully converted $BASENAME"
  else
    FAILED_COUNT=$((FAILED_COUNT + 1))
    echo "✗ Failed to convert $BASENAME"
  fi
done

# Summary
echo "--------------------"
echo "Conversion Summary:"
echo "Total files: $FILE_COUNT"
echo "Converted: $CONVERTED_COUNT"
echo "Skipped: $SKIPPED_COUNT"
echo "Failed: $FAILED_COUNT"
echo "--------------------"

if [ "$FAILED_COUNT" -gt 0 ]; then
  exit 1
else
  exit 0
fi