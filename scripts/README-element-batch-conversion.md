# Element HTML to MDX Batch Conversion

This directory contains scripts for converting ISBDM Element HTML files to MDX format for the Docusaurus documentation.

## Main Batch Conversion Script

The `convert-all-elements.sh` script provides a comprehensive batch conversion tool for converting all ISBDM element HTML files from the ISBDM/docs/attributes directory to MDX format in the docs/attributes directory.

### Features

- Processes all HTML files in the ISBDM/docs/attributes directory
- Excludes special files like general.html and index.html
- Creates detailed logs and reports of the conversion process
- Handles errors gracefully and provides a summary of successful/failed conversions
- Option to force overwrite existing MDX files
- Verbose output mode for detailed conversion information

### Usage

```bash
# Basic usage
yarn convert-all-elements

# Force overwrite of existing MDX files
yarn convert-all-elements:force

# Show detailed output
yarn convert-all-elements:verbose

# Use both force and verbose options
yarn convert-all-elements --force --verbose

# Show help
yarn convert-all-elements --help
```

### Logs and Reports

The script generates two types of files in the `scripts/logs` directory:

1. **Log file**: Contains detailed information about each conversion attempt, including any errors
2. **Report file**: Provides a summary of the conversion process, including statistics and lists of successful, failed, and skipped files

### Customization

If you need to customize the script, you can modify the following variables:

- `INPUT_ROOT`: Path to the directory containing HTML files
- `OUTPUT_ROOT`: Path to the directory where MDX files will be saved
- `EXCLUDE_PATTERN`: Files to exclude from conversion

## Individual Conversion Scripts

In addition to the batch script, several individual conversion scripts are available:

- `convert-element-final.sh`: Converts a single element file using the final converter
- `convert-html-element-to-mdx-final.mjs`: The core conversion logic

To convert a single file:

```bash
yarn convert-element:final /path/to/input.html /path/to/output.mdx
```

## Development

When developing or modifying the conversion scripts, you can use the raw converter directly:

```bash
yarn convert-element:final:raw /path/to/input.html /path/to/output.mdx
```

This bypasses the shell wrapper and provides direct access to the Node.js script.