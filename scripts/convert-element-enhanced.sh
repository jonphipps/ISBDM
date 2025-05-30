#!/bin/bash

# Enhanced Element Conversion Script
# This script provides a streamlined interface to the enhanced HTML-to-MDX conversion tool

# Function to display usage information
function show_usage {
  echo "Enhanced Element Conversion Script"
  echo "Automatically detects element content and chooses appropriate converter"
  echo ""
  echo "Usage: $0 <input-html-file> <output-mdx-file> [--force]"
  echo "   or: $0 --batch <input-dir> <output-dir> [options]"
  echo ""
  echo "Features:"
  echo "  • Automatically detects content type: element, vocabulary, or general"
  echo "  • Uses enhanced converter with RDF generation for element files"
  echo "  • Uses vocabulary converter for value vocabulary files"
  echo "  • Uses appropriate converter for general content files"
  echo "  • Validates output structure based on file type"
  echo ""
  echo "Options:"
  echo "  --force           Force overwrite existing files"
  echo "  --verbose         Show detailed output"
  echo "  --exclude <regex> Files to exclude (default: general.html|transcription.html|index.html)"
  echo "  --pattern <glob>  File pattern to match (default: *.html)"
  echo "  --help            Show this help message"
  exit 1
}

# Function to validate MDX structure
function validate_mdx_structure {
  local mdx_file="$1"
  
  # Check for required sections
  if ! grep -q "^# " "$mdx_file"; then
    report_validation_failure "$mdx_file" "Missing title (first-level heading)"
    return 1
  fi
  
  # Only check for Element Reference section if it should exist
  # Skip this check for files without element content (like index files)
  local basename=$(basename "$mdx_file" .mdx)
  if [[ ! "$basename" =~ ^(index|general|transcription)$ ]]; then
    if ! grep -q "^## Element Reference" "$mdx_file"; then
      report_validation_failure "$mdx_file" "Missing Element Reference section"
      return 1
    fi
  fi
  
  # Only require Stipulations section for element files
  if [[ ! "$basename" =~ ^(index|general|transcription)$ ]]; then
    if ! grep -q "^## Stipulations" "$mdx_file"; then
      report_validation_failure "$mdx_file" "Missing Stipulations section"
      return 1
    fi
  fi
  
  # Check for proper frontmatter
  if ! grep -q "^---" "$mdx_file" || ! grep -q "^---" "$mdx_file" | tail -n 1; then
    report_validation_failure "$mdx_file" "Invalid or missing frontmatter"
    return 1
  fi
  
  return 0
}

# Function to validate example formatting
function validate_example_formatting {
  local mdx_file="$1"
  
  # Skip example validation for vocabulary files
  if grep -q "VocabularyTable" "$mdx_file"; then
    return 0  # Vocabulary files don't need example tables
  fi
  
  # Skip example validation for non-element files  
  local basename=$(basename "$mdx_file" .mdx)
  if [[ "$basename" =~ ^(index|general|transcription)$ ]]; then
    return 0  # These files don't typically have examples
  fi
  
  # Check for proper table structure in examples for element files
  if ! grep -q "| Property | Value |" "$mdx_file"; then
    report_validation_failure "$mdx_file" "Example tables may not be properly formatted"
    return 1
  fi
  
  return 0
}

# Enhanced error reporting for validation failures
function report_validation_failure {
  local file="$1"
  local message="$2"
  echo "[VALIDATION ERROR] $file: $message"
}

# Function to check if HTML file has element content
function has_element_content {
  local html_file="$1"
  
  # Check if the file contains element-specific structural indicators
  # These patterns indicate the file describes a formal element with RDF data
  if grep -q -i "elementreference\|<div id=\"ontology\">\|<div id=\"definition\">\|<div id=\"label\">\|<div id=\"domain\">\|<div id=\"range\">" "$html_file"; then
    return 0  # Has element content
  fi
  
  # Check for element section headers (as h2, h3, or strong headers, not inline text)
  if grep -q -i "<h[2-6][^>]*>.*Element Reference\|<h[2-6][^>]*>.*Additional information\|<h[2-6][^>]*>.*Stipulations" "$html_file"; then
    return 0  # Has element content
  fi
  
  # Check for strong/bold element headers
  if grep -q -i "<strong>.*Element Reference\|<strong>.*Additional information\|<strong>.*Stipulations" "$html_file"; then
    return 0  # Has element content
  fi
  
  # Check filename patterns - typically numbered elements have RDF data
  local basename=$(basename "$html_file" .html)
  if [[ "$basename" =~ ^[0-9]{4}$ ]]; then
    return 0  # Numbered files typically have element content
  fi
  
  return 1  # No element content detected
}

# Function to check if HTML file is a vocabulary file
function is_vocabulary_file {
  local html_file="$1"
  
  # Check for vocabulary-specific content with table structure
  if grep -q -i "vesValue\|concept.*definition\|\.row.*\.vesValue" "$html_file"; then
    return 0  # Is vocabulary file with table structure
  fi
  
  return 1  # Not a vocabulary file
}

# Function to check if HTML file is an informational page
function is_informational_page {
  local html_file="$1"
  
  # Check for informational content patterns
  if grep -q -i "\.guid\|guidance\|informational\|Display of.*metadata" "$html_file"; then
    return 0  # Is informational page
  fi
  
  # Check for files in ves directory that aren't vocabulary tables
  local filepath=$(dirname "$html_file")
  local basename=$(basename "$html_file" .html)
  if [[ "$filepath" =~ ves$ ]] && [[ "$basename" =~ ^ISBDM ]]; then
    return 0  # ISBDM* files in ves directory are typically informational
  fi
  
  return 1  # Not an informational page
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
  VERBOSE=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --force)
        OPTIONS="$OPTIONS --force"
        ;;
      --verbose)
        OPTIONS="$OPTIONS --verbose"
        VERBOSE="--verbose"
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
  
  # Run batch conversion with file type detection
  echo "Starting smart batch conversion from $INPUT_DIR to $OUTPUT_DIR..."
  
  # Get all HTML files in the input directory
  for html_file in "$INPUT_DIR"/*.html; do
    if [ -f "$html_file" ]; then
      basename=$(basename "$html_file" .html)
      output_file="$OUTPUT_DIR/${basename}.mdx"
      
      # Skip files based on exclude pattern
      if [[ "$basename" =~ general|transcription|index ]]; then
        echo "Skipping $basename (excluded pattern)"
        continue
      fi
      
      # Skip if output exists and not forcing
      if [ -f "$output_file" ] && [[ ! "$OPTIONS" =~ --force ]]; then
        echo "Skipping $basename (output exists)"
        continue
      fi
      
      # Choose converter based on content type
      if has_element_content "$html_file"; then
        echo "✓ $basename: Element content detected - using enhanced converter with RDF"
        node /Users/jonphipps/Code/ISBDM/scripts/convert-html-element-to-mdx-enhanced.mjs "$html_file" "$output_file" $VERBOSE
      elif is_vocabulary_file "$html_file"; then
        echo "📚 $basename: Vocabulary table detected - using vocabulary converter"
        node /Users/jonphipps/Code/ISBDM/scripts/convert-html-vocabulary-to-mdx-enhanced.js "$html_file" "$output_file" $VERBOSE
      elif is_informational_page "$html_file"; then
        echo "📄 $basename: Informational content detected - using general content converter"
        node /Users/jonphipps/Code/ISBDM/scripts/convert-html-general-to-mdx.js "$html_file" "$output_file" $VERBOSE
      else
        echo "ℹ $basename: General content detected - using general content converter as fallback"
        node /Users/jonphipps/Code/ISBDM/scripts/convert-html-general-to-mdx.js "$html_file" "$output_file" $VERBOSE
      fi
    fi
  done
  
  # Validate converted files if verbose mode is enabled
  if [ -n "$VERBOSE" ]; then
    echo "Validating converted files..."
    for mdx_file in "$OUTPUT_DIR"/*.mdx; do
      if [ -f "$mdx_file" ]; then
        echo "Validating $mdx_file..."
        validate_mdx_structure "$mdx_file"
        validate_example_formatting "$mdx_file"
      fi
    done
  fi
  
  # Print a summary of validation results
  echo "Validation summary:"
  for mdx_file in "$OUTPUT_DIR"/*.mdx; do
    if [ -f "$mdx_file" ]; then
      echo "Validating $mdx_file..."
      validate_mdx_structure "$mdx_file"
      validate_example_formatting "$mdx_file"
    fi
  done
  
else
  # Single file mode
  if [ $# -lt 2 ]; then
    echo "Error: Input and output files required for single file conversion"
    show_usage
  fi
  
  INPUT_FILE="$1"
  OUTPUT_FILE="$2"
  FORCE_OPTION=""
  VERBOSE=""
  
  # Check for force flag
  if [ "$3" == "--force" ]; then
    FORCE_OPTION="--force"
  fi
  
  # Check for verbose flag
  if [ "$3" == "--verbose" ] || [ "$4" == "--verbose" ]; then
    VERBOSE="--verbose"
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
  
  # Choose converter based on file content type
  if has_element_content "$INPUT_FILE"; then
    echo "✓ Element content detected - using enhanced element converter with RDF generation"
    echo "Converting $INPUT_FILE to $OUTPUT_FILE with enhanced element converter..."
    node /Users/jonphipps/Code/ISBDM/scripts/convert-html-element-to-mdx-enhanced.mjs "$INPUT_FILE" "$OUTPUT_FILE" $VERBOSE
  elif is_vocabulary_file "$INPUT_FILE"; then
    echo "📚 Vocabulary table detected - using vocabulary converter"
    echo "Converting $INPUT_FILE to $OUTPUT_FILE with vocabulary converter..."
    node /Users/jonphipps/Code/ISBDM/scripts/convert-html-vocabulary-to-mdx-enhanced.js "$INPUT_FILE" "$OUTPUT_FILE" $VERBOSE
  elif is_informational_page "$INPUT_FILE"; then
    echo "📄 Informational content detected - using general content converter"
    echo "Converting $INPUT_FILE to $OUTPUT_FILE with general content converter..."
    node /Users/jonphipps/Code/ISBDM/scripts/convert-html-general-to-mdx.js "$INPUT_FILE" "$OUTPUT_FILE" $VERBOSE
  else
    echo "ℹ General content detected - using general content converter as fallback"
    echo "Converting $INPUT_FILE to $OUTPUT_FILE with general content converter..."
    node /Users/jonphipps/Code/ISBDM/scripts/convert-html-general-to-mdx.js "$INPUT_FILE" "$OUTPUT_FILE" $VERBOSE
  fi
  
  # Check if conversion was successful
  conversion_exit_code=$?
  if [ $conversion_exit_code -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
    echo "Conversion completed successfully!"
    echo "Input: $INPUT_FILE"
    echo "Output: $OUTPUT_FILE"
    
    # Validate the converted file
    echo "Validating converted file..."
    if validate_mdx_structure "$OUTPUT_FILE" && validate_example_formatting "$OUTPUT_FILE"; then
      echo "✓ Validation passed!"
      
      # Show preview of the generated MDX file
      echo "==== Preview of MDX file (first 20 lines) ===="
      head -n 20 "$OUTPUT_FILE"
      echo "..."
    else
      echo "⚠ Warning: The converted file may not meet all requirements. Please review manually."
    fi
  else
    echo "❌ Conversion failed."
    if [ $conversion_exit_code -ne 0 ]; then
      echo "Exit code: $conversion_exit_code"
    fi
    if [ ! -f "$OUTPUT_FILE" ]; then
      echo "Output file was not created: $OUTPUT_FILE"
    fi
    exit 1
  fi
fi