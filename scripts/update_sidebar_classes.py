import os
import re
from pathlib import Path
import yaml
from collections import OrderedDict

# --- Configuration ---
DOCS_PATH = Path("docs")
RELATIONSHIPS_SUBDIR = "relationships"

LEVEL_TO_CLASS_PREFIX_MAP = {
    1: "sidebar-level-",
    2: "sidebar-level-",  # Please ensure this is correct in your local script
    3: "sidebar-level-",
}

PRIORITY_KEYS = ['slug', 'sidebar_class_name']


# --- PyYAML Representer for OrderedDict ---
def represent_ordereddict(dumper, data):
    """Ensures OrderedDict is represented as a standard YAML map, preserving order."""
    return dumper.represent_mapping('tag:yaml.org,2002:map', data.items())


yaml.add_representer(OrderedDict, represent_ordereddict, Dumper=yaml.SafeDumper)


# --- Helper Functions ---
def read_frontmatter_and_content(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        print(f"Error reading file {filepath}: {e}")
        return None, None, None

    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)', text, re.DOTALL | re.MULTILINE)
    if not match:
        match_only_fm = re.match(r'^---\s*\n(.*?)\n---\s*$', text, re.DOTALL | re.MULTILINE)
        if match_only_fm:
            frontmatter_str = match_only_fm.group(1)
            content_str = ""
        else:
            print(f"Warning: No valid frontmatter block found in {filepath}. Skipping.")
            return None, None, None
    else:
        frontmatter_str = match.group(1)
        content_str = match.group(2)

    try:
        # SafeLoader loads into standard dicts, not OrderedDicts by default
        frontmatter_dict = yaml.load(frontmatter_str, Loader=yaml.SafeLoader)
        if not isinstance(frontmatter_dict, dict):
            print(
                f"Warning: Frontmatter in {filepath} is not a valid YAML mapping. Content: {frontmatter_str[:100]}... Skipping.")
            return None, None, None
        return frontmatter_dict, content_str, text
    except yaml.YAMLError as e:
        print(f"Error parsing YAML frontmatter in {filepath}: {e}")
        return None, None, None
    except Exception as e:
        print(f"Unexpected error processing frontmatter in {filepath}: {e}")
        return None, None, None


def update_markdown_file(filepath, base_docs_path, relationships_subdir_name):
    print(f"Processing: {filepath}")
    # frontmatter_dict will be a standard dict from SafeLoader
    original_frontmatter_dict, content_str, original_text = read_frontmatter_and_content(filepath)

    if original_frontmatter_dict is None:
        return False

    modified_frontmatter = dict(original_frontmatter_dict)
    any_logical_change_made = False

    # 1. Logic for sidebar_class_name
    if 'sidebar_level' in modified_frontmatter:
        try:
            level = int(modified_frontmatter['sidebar_level'])
            new_class_name = None
            # Check your LEVEL_TO_CLASS_PREFIX_MAP here if class names are unexpected
            if level in LEVEL_TO_CLASS_PREFIX_MAP:
                new_class_name = f"{LEVEL_TO_CLASS_PREFIX_MAP[level]}{level}"

            if new_class_name:
                current_sidebar_class = modified_frontmatter.get('sidebar_class_name', '')
                if not isinstance(current_sidebar_class, str):
                    current_sidebar_class = ''

                existing_classes = set(c.strip() for c in current_sidebar_class.split(' ') if c.strip())

                if new_class_name not in existing_classes:
                    existing_classes.add(new_class_name)
                    modified_frontmatter['sidebar_class_name'] = " ".join(sorted(list(existing_classes)))
                    print(f"  Updated 'sidebar_class_name' to: \"{modified_frontmatter['sidebar_class_name']}\"")
                    any_logical_change_made = True
                # else:
                #     print(f"  Info: Class '{new_class_name}' already in 'sidebar_class_name'.")
        except (ValueError, TypeError):
            print(
                f"  Warning: 'sidebar_level' in {filepath} is not a valid integer: '{modified_frontmatter['sidebar_level']}'.")

    # 2. Logic for slug
    relationships_base_path = base_docs_path / relationships_subdir_name
    try:
        is_in_relationships_dir = filepath.is_relative_to(relationships_base_path)
    except AttributeError:
        is_in_relationships_dir = str(filepath).startswith(str(relationships_base_path) + os.sep)

    if is_in_relationships_dir:
        filename_stem = filepath.stem
        expected_slug = f"/{relationships_subdir_name}/{filename_stem}"
        if modified_frontmatter.get('slug') != expected_slug:
            modified_frontmatter['slug'] = expected_slug
            print(f"  Updated 'slug' to: \"{expected_slug}\"")
            any_logical_change_made = True
        # else:
        #     print(f"  Info: 'slug' is already correct: \"{expected_slug}\".")

    if not any_logical_change_made:
        # print(f"  Info: No logical changes to frontmatter values for {filepath}.")
        return False

    final_ordered_frontmatter = OrderedDict()
    temp_modified_copy = modified_frontmatter.copy()

    for key in PRIORITY_KEYS:
        if key in temp_modified_copy:
            final_ordered_frontmatter[key] = temp_modified_copy.pop(key)

    # Add remaining keys, trying to respect original order for non-priority keys
    # by iterating through the original dict's keys first
    for key in original_frontmatter_dict:  # Iterate original to keep its order
        if key in temp_modified_copy:
            final_ordered_frontmatter[key] = temp_modified_copy.pop(key)

    for key, value in temp_modified_copy.items():  # Add any new keys not in original & not priority
        final_ordered_frontmatter[key] = value

    try:
        new_frontmatter_str = yaml.dump(
            final_ordered_frontmatter,
            Dumper=yaml.SafeDumper,
            sort_keys=False,
            allow_unicode=True,
            default_flow_style=False,
            width=9999
        )
        if not new_frontmatter_str.endswith('\n'):
            new_frontmatter_str += '\n'
    except yaml.YAMLError as e:  # Catching general YAMLError which includes RepresenterError
        print(f"  Error formatting YAML for {filepath}: {e}")
        print(f"  Problematic data (first few items): {list(final_ordered_frontmatter.items())[:5]}")
        return False

    new_file_content = f"---\n{new_frontmatter_str}---\n{content_str}"

    if new_file_content == original_text:
        # print(f"  Info: No textual change to file {filepath} after YAML processing.")
        return False

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_file_content)
        print(f"  Successfully updated {filepath}")
        return True
    except Exception as e:
        print(f"  Error writing updated file {filepath}: {e}")
        return False


# --- Main Execution ---
if __name__ == "__main__":
    try:
        yaml.safe_load
    except (AttributeError, NameError):
        print("Error: The PyYAML library is required but not found.")
        print("Please install it using: pip install PyYAML")
        exit(1)

    if not DOCS_PATH.is_dir():
        print(f"Error: Docs path '{DOCS_PATH}' not found or is not a directory.")
        exit(1)

    relationships_full_path = DOCS_PATH / RELATIONSHIPS_SUBDIR
    if not relationships_full_path.is_dir():
        print(f"Warning: Relationships subdirectory '{relationships_full_path}' not found.")

    updated_files_count = 0
    processed_files_count = 0

    for ext in ["*.md", "*.mdx"]:
        for doc_file in DOCS_PATH.rglob(ext):
            processed_files_count += 1
            if update_markdown_file(doc_file, DOCS_PATH, RELATIONSHIPS_SUBDIR):
                updated_files_count += 1

    print(f"\n--- Summary ---")
    print(f"Processed {processed_files_count} files.")
    print(f"Updated {updated_files_count} files.")
    if updated_files_count > 0:
        print("Please review the changes and commit them to your version control system.")
    print("Script finished.")

