#!/bin/bash

# Batch conversion script for HTML to MDX element files
# Converts all HTML files in a directory to MDX files

# Display help information
function show_help {
  echo "Usage: $0 <input-directory> <output-directory>"
  echo ""
  echo "Converts all HTML element files in a directory to MDX format."
  echo ""
  echo "Options:"
  echo "  -h, --help     Show this help message"
  echo "  -v, --verbose  Run in verbose mode with detailed output"
  echo "  -f, --force    Overwrite existing files without asking"
  echo ""
  echo "Example:"
  echo "  $0 /path/to/html/dir /path/to/mdx/dir"
  exit 0
}

# Set default options
VERBOSE=0
FORCE=0

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
    -f|--force)
      FORCE=1
      shift
      ;;
    *)
      if [[ -z "$INPUT_DIR" ]]; then
        INPUT_DIR="$1"
      elif [[ -z "$OUTPUT_DIR" ]]; then
        OUTPUT_DIR="$1"
      else
        echo "Error: Too many arguments provided"
        show_help
      fi
      shift
      ;;
  esac
done

# Check if we have the required arguments
if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT_DIR" ]; then
  echo "Error: Both input and output directories must be specified"
  show_help
fi

# Check if input directory exists
if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: Input directory $INPUT_DIR does not exist"
  exit 1
fi

# Create output directory if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Creating output directory $OUTPUT_DIR"
  mkdir -p "$OUTPUT_DIR"
fi

# Function to log verbose messages
function verbose_log {
  if [ $VERBOSE -eq 1 ]; then
    echo "$1"
  fi
}

# Get a list of HTML files to convert
HTML_FILES=$(find "$INPUT_DIR" -name "*.html" -type f | grep -v "general\|transcription\|index.html")
FILE_COUNT=$(echo "$HTML_FILES" | wc -l)

if [ $FILE_COUNT -eq 0 ]; then
  echo "No HTML files found in $INPUT_DIR"
  exit 0
fi

echo "Found $FILE_COUNT HTML files to convert"

# Process each file
CONVERTED=0
SKIPPED=0
FAILED=0

for HTML_FILE in $HTML_FILES; do
  # Get the basename of the file without extension
  BASENAME=$(basename "$HTML_FILE" .html)
  
  # Skip files with certain names
  if [[ "$BASENAME" == "index" || "$BASENAME" == "general" || "$BASENAME" == "transcription" ]]; then
    verbose_log "Skipping file $HTML_FILE (excluded name)"
    ((SKIPPED++))
    continue
  fi
  
  # Create the output file path
  MDX_FILE="$OUTPUT_DIR/$BASENAME.mdx"
  
  # Check if output file already exists
  if [ -f "$MDX_FILE" ] && [ $FORCE -eq 0 ]; then
    read -p "File $MDX_FILE already exists. Overwrite? (y/N) " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
      echo "Skipping file $HTML_FILE"
      ((SKIPPED++))
      continue
    fi
  fi
  
  # Convert the file
  echo "Converting $HTML_FILE to $MDX_FILE"
  yarn convert-element-simple "$HTML_FILE" "$MDX_FILE"
  
  if [ $? -eq 0 ]; then
    verbose_log "Successfully converted $HTML_FILE"
    ((CONVERTED++))
  else
    echo "Error converting $HTML_FILE"
    ((FAILED++))
  fi
done

# Print summary
echo ""
echo "Conversion Summary:"
echo "  Total files: $FILE_COUNT"
echo "  Successfully converted: $CONVERTED"
echo "  Skipped: $SKIPPED"
echo "  Failed: $FAILED"
echo ""
echo "Files converted to $OUTPUT_DIR"
echo "Note: Manual review is recommended for optimal results."
exit 0