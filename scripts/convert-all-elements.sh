#!/bin/bash

# Comprehensive Element Batch Conversion Script
# This script processes all ISBDM element HTML files and converts them to MDX format
# using the final converter that matches the exact format of converted-1025.mdx

# Set defaults
INPUT_DIR="/Users/jonphipps/Code/ISBDM/ISBDM/docs/statements"
OUTPUT_DIR="/Users/jonphipps/Code/ISBDM/docs/statements"
EXCLUDE_PATTERN="general.html|transcription.html|index.html"
FORCE=false
VERBOSE=false
VALIDATE=true

# Function to display usage information
function show_usage {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --input <dir>        Input directory containing HTML files (default: $INPUT_DIR)"
  echo "  --output <dir>       Output directory for MDX files (default: $OUTPUT_DIR)"
  echo "  --exclude <regex>    Files to exclude (default: $EXCLUDE_PATTERN)"
  echo "  --force              Force overwrite existing files"
  echo "  --verbose            Show detailed output"
  echo "  --no-validate        Skip validation of converted files"
  echo "  --help               Show this help message"
  exit 1
}

# Parse command-line arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --input)
      if [ -z "$2" ]; then
        echo "Error: --input requires a directory path"
        exit 1
      fi
      INPUT_DIR="$2"
      shift 2
      ;;
    --output)
      if [ -z "$2" ]; then
        echo "Error: --output requires a directory path"
        exit 1
      fi
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --exclude)
      if [ -z "$2" ]; then
        echo "Error: --exclude requires a regex pattern"
        exit 1
      fi
      EXCLUDE_PATTERN="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --no-validate)
      VALIDATE=false
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
done

# Check if input directory exists
if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: Input directory $INPUT_DIR does not exist"
  exit 1
fi

# Create output directory if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
  mkdir -p "$OUTPUT_DIR"
  echo "Created output directory: $OUTPUT_DIR"
fi

# Reference file for validation
REFERENCE_FILE="/Users/jonphipps/Code/ISBDM/docs/statements/converted-1025.mdx"

# Prepare options for the conversion
CONVERTER_OPTIONS=""
if [ "$FORCE" = true ]; then
  CONVERTER_OPTIONS="$CONVERTER_OPTIONS --force"
fi
if [ "$VERBOSE" = true ]; then
  CONVERTER_OPTIONS="$CONVERTER_OPTIONS --verbose"
fi
if [ -n "$EXCLUDE_PATTERN" ]; then
  CONVERTER_OPTIONS="$CONVERTER_OPTIONS --exclude \"$EXCLUDE_PATTERN\""
fi

# Set up log file
LOG_DIR="/Users/jonphipps/Code/ISBDM/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/element_conversion_$TIMESTAMP.log"

# Create report files
SUCCESS_REPORT="$LOG_DIR/successful_conversions_$TIMESTAMP.txt"
ERROR_REPORT="$LOG_DIR/failed_conversions_$TIMESTAMP.txt"
VALIDATION_REPORT="$LOG_DIR/validation_report_$TIMESTAMP.txt"

# Header for the log file
echo "ISBDM Element HTML to MDX Conversion" > "$LOG_FILE"
echo "==================================" >> "$LOG_FILE"
echo "Timestamp: $(date)" >> "$LOG_FILE"
echo "Input Directory: $INPUT_DIR" >> "$LOG_FILE"
echo "Output Directory: $OUTPUT_DIR" >> "$LOG_FILE"
echo "Exclude Pattern: $EXCLUDE_PATTERN" >> "$LOG_FILE"
echo "Force Overwrite: $FORCE" >> "$LOG_FILE"
echo "Verbose Output: $VERBOSE" >> "$LOG_FILE"
echo "Validation Enabled: $VALIDATE" >> "$LOG_FILE"
echo "==================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Headers for report files
echo "Successful Conversions:" > "$SUCCESS_REPORT"
echo "Failed Conversions:" > "$ERROR_REPORT"
echo "MDX Validation Report:" > "$VALIDATION_REPORT"

# Start message
echo "Starting batch conversion of all ISBDM element HTML files..."
echo "Input Directory: $INPUT_DIR"
echo "Output Directory: $OUTPUT_DIR"
echo "Log File: $LOG_FILE"
echo ""

# Find all HTML files in the input directory that don't match the exclude pattern
HTML_FILES=$(find "$INPUT_DIR" -name "*.html" | grep -v -E "$EXCLUDE_PATTERN" | sort)
TOTAL_FILES=$(echo "$HTML_FILES" | wc -l)
TOTAL_FILES=$(echo "$TOTAL_FILES" | tr -d '[:space:]')

echo "Found $TOTAL_FILES HTML files to process"
echo "Found $TOTAL_FILES HTML files to process" >> "$LOG_FILE"

# Initialize counters
SUCCESSFUL=0
FAILED=0
VALIDATED=0
VALIDATION_FAILED=0
SKIPPED=0

# Process each file
COUNT=0
for HTML_FILE in $HTML_FILES; do
  COUNT=$((COUNT + 1))
  BASENAME=$(basename "$HTML_FILE" .html)
  MDX_FILE="$OUTPUT_DIR/$BASENAME.mdx"
  
  # Status message
  echo -n "[$COUNT/$TOTAL_FILES] Processing $BASENAME... "
  
  # Skip if output file exists and force is false
  if [ -f "$MDX_FILE" ] && [ "$FORCE" = false ]; then
    echo "SKIPPED (file exists)"
    echo "[$COUNT/$TOTAL_FILES] $BASENAME: SKIPPED (file exists)" >> "$LOG_FILE"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  
  # Convert the file
  if [ "$VERBOSE" = true ]; then
    echo ""
    echo "Converting $HTML_FILE to $MDX_FILE"
  fi
  
  # Run the conversion using the final converter
  node /Users/jonphipps/Code/ISBDM/scripts/convert-html-element-to-mdx-final.mjs "$HTML_FILE" "$MDX_FILE" 2>> "$LOG_FILE"
  
  # Check if conversion was successful
  if [ $? -eq 0 ] && [ -f "$MDX_FILE" ]; then
    echo "SUCCESS"
    echo "[$COUNT/$TOTAL_FILES] $BASENAME: SUCCESS" >> "$LOG_FILE"
    echo "$BASENAME.mdx" >> "$SUCCESS_REPORT"
    SUCCESSFUL=$((SUCCESSFUL + 1))
    
    # Validate if enabled
    if [ "$VALIDATE" = true ]; then
      if [ "$VERBOSE" = true ]; then
        echo "Validating $MDX_FILE..."
      fi
      
      # Run validation
      VALIDATION_OUTPUT=$(node /Users/jonphipps/Code/ISBDM/scripts/validate-element-mdx.js "$MDX_FILE" --reference "$REFERENCE_FILE" 2>&1)
      VALIDATION_STATUS=$?
      
      if [ $VALIDATION_STATUS -eq 0 ]; then
        if [ "$VERBOSE" = true ]; then
          echo "Validation successful"
        fi
        VALIDATED=$((VALIDATED + 1))
      else
        if [ "$VERBOSE" = true ]; then
          echo "Validation failed"
          echo "$VALIDATION_OUTPUT"
        fi
        
        echo "[$COUNT/$TOTAL_FILES] $BASENAME: VALIDATION FAILED" >> "$LOG_FILE"
        echo "$BASENAME.mdx:" >> "$VALIDATION_REPORT"
        echo "$VALIDATION_OUTPUT" >> "$VALIDATION_REPORT"
        echo "" >> "$VALIDATION_REPORT"
        VALIDATION_FAILED=$((VALIDATION_FAILED + 1))
      fi
    fi
  else
    echo "FAILED"
    echo "[$COUNT/$TOTAL_FILES] $BASENAME: FAILED" >> "$LOG_FILE"
    echo "$BASENAME.html" >> "$ERROR_REPORT"
    FAILED=$((FAILED + 1))
  fi
done

# Summary
echo ""
echo "Conversion completed!"
echo "Total files processed: $TOTAL_FILES"
echo "Successful conversions: $SUCCESSFUL"
echo "Failed conversions: $FAILED"
echo "Skipped (existing files): $SKIPPED"

if [ "$VALIDATE" = true ]; then
  echo "Validated files: $VALIDATED"
  echo "Validation failures: $VALIDATION_FAILED"
fi

echo ""
echo "Reports:"
echo "- Successful conversions: $SUCCESS_REPORT"
echo "- Failed conversions: $ERROR_REPORT"
echo "- Full log: $LOG_FILE"

if [ "$VALIDATE" = true ]; then
  echo "- Validation report: $VALIDATION_REPORT"
fi

# Write summary to log
echo "" >> "$LOG_FILE"
echo "==================================" >> "$LOG_FILE"
echo "Summary" >> "$LOG_FILE"
echo "==================================" >> "$LOG_FILE"
echo "Total files processed: $TOTAL_FILES" >> "$LOG_FILE"
echo "Successful conversions: $SUCCESSFUL" >> "$LOG_FILE"
echo "Failed conversions: $FAILED" >> "$LOG_FILE"
echo "Skipped (existing files): $SKIPPED" >> "$LOG_FILE"

if [ "$VALIDATE" = true ]; then
  echo "Validated files: $VALIDATED" >> "$LOG_FILE"
  echo "Validation failures: $VALIDATION_FAILED" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "Completed at: $(date)" >> "$LOG_FILE"

# Exit with error code if any conversions failed
if [ $FAILED -gt 0 ]; then
  exit 1
fi

exit 0