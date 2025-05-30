#!/bin/bash

# Unified Element Conversion Script
# This script provides a streamlined interface to the unified HTML-to-MDX conversion tool

# Function to display usage information
function show_usage {
  echo "Usage: $0 <input-html-file> <output-mdx-file> [--force]"
  echo "   or: $0 --batch <input-dir> <output-dir> [options]"
  echo ""
  echo "Options:"
  echo "  --force           Force overwrite existing files"
  echo "  --verbose         Show detailed output"
  echo "  --exclude <regex> Files to exclude (default: general.html|transcription.html|index.html)"
  echo "  --pattern <glob>  File pattern to match (default: *.html)"
  echo "  --help            Show this help message"
  exit 1
}

# Check if arguments are provided
if [ $# -lt 1 ]; then
  show_usage
fi

# Parse command-line arguments
if [ "$1" == "--batch" ]; then
  # Batch mode
  if [ $# -lt 3 ]; then
    echo "Error: Input and output directories required for batch mode"
    show_usage
  fi
  
  INPUT_DIR="$2"
  OUTPUT_DIR="$3"
  shift 3
  
  # Check if input directory exists
  if [ ! -d "$INPUT_DIR" ]; then
    echo "Error: Input directory $INPUT_DIR does not exist"
    exit 1
  fi
  
  # Prepare options
  OPTIONS=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --force)
        OPTIONS="$OPTIONS --force"
        ;;
      --verbose)
        OPTIONS="$OPTIONS --verbose"
        ;;
      --exclude)
        if [ -z "$2" ]; then
          echo "Error: --exclude requires a regex pattern"
          exit 1
        fi
        OPTIONS="$OPTIONS --exclude \"$2\""
        shift
        ;;
      --pattern)
        if [ -z "$2" ]; then
          echo "Error: --pattern requires a glob pattern"
          exit 1
        fi
        OPTIONS="$OPTIONS --pattern \"$2\""
        shift
        ;;
      --help)
        show_usage
        ;;
      *)
        echo "Error: Unknown option $1"
        show_usage
        ;;
    esac
    shift
  done
  
  # Run batch conversion
  echo "Starting batch conversion from $INPUT_DIR to $OUTPUT_DIR..."
  eval "node /Users/jonphipps/Code/ISBDM/scripts/convert-html-element-to-mdx-unified.mjs --dir \"$INPUT_DIR\" \"$OUTPUT_DIR\" $OPTIONS"
  
else
  # Single file mode
  if [ $# -lt 2 ]; then
    echo "Error: Input and output files required for single file conversion"
    show_usage
  fi
  
  INPUT_FILE="$1"
  OUTPUT_FILE="$2"
  FORCE_OPTION=""
  
  # Check for force flag
  if [ "$3" == "--force" ]; then
    FORCE_OPTION="--force"
  fi
  
  # Check if input file exists
  if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file $INPUT_FILE does not exist"
    exit 1
  fi
  
  # Check if output file already exists and we're not forcing overwrite
  if [ -f "$OUTPUT_FILE" ] && [ "$FORCE_OPTION" != "--force" ]; then
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
  
  # Run conversion
  echo "Converting $INPUT_FILE to $OUTPUT_FILE..."
  node /Users/jonphipps/Code/ISBDM/scripts/convert-html-element-to-mdx-unified.mjs "$INPUT_FILE" "$OUTPUT_FILE"
  
  # Show completion message
  if [ $? -eq 0 ]; then
    echo "Conversion completed successfully!"
    echo "Input: $INPUT_FILE"
    echo "Output: $OUTPUT_FILE"
    
    # Show preview of the generated MDX file
    echo "==== Preview of MDX file (first 10 lines) ===="
    head -n 10 "$OUTPUT_FILE"
    echo "..."
  else
    echo "Conversion failed."
    exit 1
  fi
fi