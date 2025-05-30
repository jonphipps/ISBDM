#!/bin/bash

# MDX Element Conversion Validation Script
# This script validates MDX files after conversion to ensure they match the expected format
# and contain all required elements

# Function to display usage information
function show_usage {
  echo "Usage: $0 <mdx-file> [options]"
  echo "   or: $0 --dir <directory> [options]"
  echo ""
  echo "Options:"
  echo "  --reference <file>   Reference file to use as comparison (default: /Users/jonphipps/Code/ISBDM/docs/statements/converted-1025.mdx)"
  echo "  --verbose            Show detailed information about issues"
  echo "  --exclude <regex>    Exclude files matching pattern (for directories)"
  echo "  --help               Show this help message"
  exit 1
}

# Default reference file
REFERENCE_FILE="/Users/jonphipps/Code/ISBDM/docs/statements/converted-1025.mdx"

# Check if arguments are provided
if [ $# -lt 1 ]; then
  show_usage
fi

# Parse command-line arguments
VERBOSE=""
EXCLUDE=""
TARGET=""

if [ "$1" == "--dir" ]; then
  # Directory mode
  if [ $# -lt 2 ]; then
    echo "Error: Directory path required for directory mode"
    show_usage
  fi
  
  TARGET="$2"
  shift 2
  
  # Check if directory exists
  if [ ! -d "$TARGET" ]; then
    echo "Error: Directory $TARGET does not exist"
    exit 1
  fi
else
  # Single file mode
  TARGET="$1"
  shift
  
  # Check if file exists
  if [ ! -f "$TARGET" ]; then
    echo "Error: File $TARGET does not exist"
    exit 1
  fi
fi

# Parse remaining options
while [ $# -gt 0 ]; do
  case "$1" in
    --reference)
      if [ -z "$2" ]; then
        echo "Error: --reference requires a file path"
        exit 1
      fi
      REFERENCE_FILE="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE="--verbose"
      shift
      ;;
    --exclude)
      if [ -z "$2" ]; then
        echo "Error: --exclude requires a regex pattern"
        exit 1
      fi
      EXCLUDE="--exclude \"$2\""
      shift 2
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

# Check if reference file exists
if [ ! -f "$REFERENCE_FILE" ]; then
  echo "Error: Reference file $REFERENCE_FILE does not exist"
  exit 1
fi

# Build the validation command
CMD="node /Users/jonphipps/Code/ISBDM/scripts/validate-element-mdx.js \"$TARGET\" --reference \"$REFERENCE_FILE\" $VERBOSE $EXCLUDE"

# Run validation
echo "Running MDX validation..."
echo "Target: $TARGET"
echo "Reference: $REFERENCE_FILE"
echo ""

eval "$CMD"

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Validation successful!"
  exit 0
else
  echo ""
  echo "❌ Validation found issues. Please review the output above."
  exit 1
fi