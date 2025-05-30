#!/usr/bin/env python3
import os
import re
import yaml # PyYAML
from bs4 import BeautifulSoup
import argparse
import logging
import shutil

# --- Configuration Constants ---
DEFAULT_SOURCE_HTML_ROOT = "ISBDM/docs/"
DEFAULT_TARGET_MDX_ROOT = "docs/"
SES_HTML_SOURCE_DIR_FROM_ROOT = "ves"
SES_HTML_INDEX_FILENAME = "ISBDMSES.html"
SES_TARGET_MDX_SECTION_KEY = "ses" # MDX section for SES items

# CSS class for styling locally top-level items (e.g., level 1 within an HTML nav block)
CLASS_LOCAL_LEVEL_1_ITEM = "menu-item-html-level-1" # For making them bolder

# Relationship section configuration
RELATIONSHIPS_SOURCE_DIR_FROM_ROOT = "relationships"
RELATIONSHIPS_TARGET_MDX_DIR_KEY = "relationships"
# Filenames (without .html) that define relationship categories
RELATIONSHIP_CATEGORY_FILES = ["agents", "nomens", "resources", "placetimes", "general", "index"]


# --- Data Structures ---
class NavItem:
    def __init__(self, original_href, normalized_key, label,
                 relative_html_level, # Relative to its specific HTML nav block, 1-based
                 position_in_html_block,
                 source_html_file_path,
                 relationship_category=None): # Added for relationships
        self.original_href = original_href
        self.normalized_key = normalized_key # e.g., "attributes/1022"
        self.label = label
        self.relative_html_level = relative_html_level
        self.position_in_html_block = position_in_html_block
        self.source_html_file_path = source_html_file_path
        self.relationship_category = relationship_category # e.g., "agents"

        # For prefix generation (relative to its HTML block)
        self.is_last_sibling_in_block = False
        self.ancestor_is_last_flags_in_block = []
        self.has_children_in_block = False


    def __repr__(self):
        return (f"NavItem(key='{self.normalized_key}', lbl='{self.label}', "
                f"rel_lvl={self.relative_html_level}, pos={self.position_in_html_block}, "
                f"last_sib={self.is_last_sibling_in_block}, "
                f"cat='{self.relationship_category}')")

# --- Utility Functions ---
def setup_logging(log_level_str="INFO", log_file="generate_sidebar_frontmatter.log"):
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)
    logging.basicConfig(level=log_level, format="%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s",
                        handlers=[logging.FileHandler(log_file, mode='w', encoding='utf-8'), logging.StreamHandler()])
    logging.info(f"Logging setup at level {log_level_str} to {log_file}")

def normalize_text(text_string):
    if not text_string: return ""
    text = str(text_string); text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_mdx_path_to_key(mdx_file_path, base_dir):
    relative_path = os.path.relpath(mdx_file_path, base_dir)
    path_no_ext, _ = os.path.splitext(relative_path)
    return os.path.normpath(path_no_ext).replace(os.sep, '/')

def normalize_html_href_to_key(href, source_html_section_key, source_html_root_abs):
    if not href: return None

    # Special handling for relationship files linked from their own category HTMLs
    # e.g. href="1005.html" from "relationships/agents.html" -> key "relationships/1005"
    # source_html_section_key here will be "relationships"
    is_relationship_sub_file = source_html_section_key == RELATIONSHIPS_TARGET_MDX_DIR_KEY and \
                               not href.endswith("index.html") and \
                               not any(cat_file + ".html" == href for cat_file in RELATIONSHIP_CATEGORY_FILES)


    path_part = ""
    if href.startswith(source_html_root_abs):
        path_part = href[len(source_html_root_abs):].lstrip("/")
    elif href.startswith("/ISBDM/docs/"):
         path_part = href[len("/ISBDM/docs/"):].lstrip("/")
    elif href.startswith("/"):
        logging.warning(f"Found absolute href '{href}' not matching known root in section '{source_html_section_key}'.")
        path_part = href.lstrip("/")
    else: # Relative path like "1022.html" or "sub/file.html"
        # For relationship sub-files, section_key is 'relationships', href is '1005.html'
        path_part = os.path.join(source_html_section_key, href)

    path_no_ext, _ = os.path.splitext(path_part)
    normalized = os.path.normpath(path_no_ext).replace(os.sep, '/')
    return normalized

# --- Core Parsing and Hierarchy Logic (for Prefixes within each HTML block) ---
def parse_html_nav_block(html_file_path,
                         source_html_section_key_for_norm, # e.g. "attributes", "relationships"
                         source_html_root_abs,
                         relationship_category_name=None): # e.g. "agents"
    nav_items = []
    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
    except FileNotFoundError:
        logging.error(f"HTML file not found: {html_file_path}")
        return nav_items

    nav_container_candidates = soup.select('div.col-md-5 nav.navISBDMSection, div.col-md-6 nav.navISBDMSection, div.col-md-12 nav.navISBDMSection, nav.navISBDMSection')

    item_position_counter = 0
    for nav_container in nav_container_candidates:
        link_divs = nav_container.find_all('div', class_='d-flex', recursive=False)
        for div_idx, div in enumerate(link_divs):
            link_tag = div.find('a', href=True)
            if link_tag:
                item_position_counter += 1
                href = link_tag.get('href', '').strip()
                label = normalize_text(link_tag.get_text())

                indent_icons = div.find_all('i', class_='bi-arrow-return-right')
                # Relative level: 1 for no icons, 2 for one icon, etc.
                relative_html_level = 1 + len(indent_icons)

                normalized_key = normalize_html_href_to_key(href, source_html_section_key_for_norm, source_html_root_abs)
                if not normalized_key:
                    logging.warning(f"Could not normalize href '{href}' in {html_file_path} for section key '{source_html_section_key_for_norm}'. Skipping item '{label}'.")
                    continue

                nav_items.append(NavItem(
                    original_href=href, normalized_key=normalized_key, label=label,
                    relative_html_level=relative_html_level,
                    position_in_html_block=item_position_counter,
                    source_html_file_path=html_file_path,
                    relationship_category=relationship_category_name
                ))

    # Determine is_last_sibling_in_block and ancestor_is_last_flags_in_block for this list
    if nav_items:
        # is_last_sibling_in_block
        for i, current_item in enumerate(nav_items):
            current_item.is_last_sibling_in_block = True
            for j in range(i + 1, len(nav_items)):
                next_item = nav_items[j]
                if next_item.relative_html_level == current_item.relative_html_level:
                    current_item.is_last_sibling_in_block = False; break
                if next_item.relative_html_level < current_item.relative_html_level:
                    break

        # ancestor_is_last_flags_in_block & has_children_in_block
        parent_is_last_at_level_stack = []
        for i, item in enumerate(nav_items):
            while len(parent_is_last_at_level_stack) >= item.relative_html_level:
                parent_is_last_at_level_stack.pop()
            item.ancestor_is_last_flags_in_block = list(parent_is_last_at_level_stack)
            if len(parent_is_last_at_level_stack) < item.relative_html_level :
                 parent_is_last_at_level_stack.append(item.is_last_sibling_in_block)
            elif parent_is_last_at_level_stack : # Should have item.relative_html_level elements if stack is full
                 parent_is_last_at_level_stack[item.relative_html_level -1] = item.is_last_sibling_in_block

            if i + 1 < len(nav_items) and nav_items[i+1].relative_html_level > item.relative_html_level:
                item.has_children_in_block = True
    return nav_items


def generate_sidebar_prefix(nav_item: NavItem): # Operates on relative levels
    if nav_item.relative_html_level < 2: return None # Prefixes start for items indented at least once
    prefix_parts = []
    # ancestor_is_last_flags is for relative levels 1 up to (current_item.relative_html_level - 1)
    for i in range(nav_item.relative_html_level - 1):
        is_ancestor_last = nav_item.ancestor_is_last_flags_in_block[i] if i < len(nav_item.ancestor_is_last_flags_in_block) else True
        prefix_parts.append("   " if is_ancestor_last else "│  ")
    prefix_parts.append("└─ " if nav_item.is_last_sibling_in_block else "├─ ")
    return "".join(prefix_parts)


def cache_all_html_sidebar_maps(source_html_root_abs):
    # Key: normalized_key (e.g., "attributes/1022"), Value: NavItem object
    # This provides a flat lookup for any NavItem based on its final MDX-like key.
    master_nav_item_map = {}

    for source_dir_name in os.listdir(source_html_root_abs):
        current_source_dir_abs = os.path.join(source_html_root_abs, source_dir_name)
        if os.path.isdir(current_source_dir_abs):
            # For most sections, parse their index.html (or a specific master HTML)
            # For relationships, parse each category HTML (agents.html, etc.)

            if source_dir_name == RELATIONSHIPS_SOURCE_DIR_FROM_ROOT:
                for rel_cat_file_base in RELATIONSHIP_CATEGORY_FILES:
                    html_file_to_parse = os.path.join(current_source_dir_abs, f"{rel_cat_file_base}.html")
                    if os.path.exists(html_file_to_parse):
                        logging.info(f"Parsing relationships HTML: {html_file_to_parse} for category '{rel_cat_file_base}'")
                        # The section key for normalization is "relationships" for all these
                        # The relationship_category_name is the file base itself.
                        nav_items = parse_html_nav_block(html_file_to_parse,
                                                         RELATIONSHIPS_TARGET_MDX_DIR_KEY,
                                                         source_html_root_abs,
                                                         relationship_category_name=rel_cat_file_base if rel_cat_file_base not in ["index", "general"] else None)
                        for item in nav_items:
                            if item.normalized_key in master_nav_item_map:
                                logging.warning(f"Duplicate normalized key '{item.normalized_key}' found. Overwriting with item from {html_file_to_parse}")
                            master_nav_item_map[item.normalized_key] = item
                    else:
                        logging.debug(f"Relationships HTML {html_file_to_parse} not found.")
            elif source_dir_name == SES_HTML_SOURCE_DIR_FROM_ROOT: # "ves" directory, containing SES source
                ses_html_abs_path = os.path.join(current_source_dir_abs, SES_HTML_INDEX_FILENAME) # .../ves/ISBDMSES.html
                if os.path.exists(ses_html_abs_path):
                    logging.info(f"Parsing SES HTML: {ses_html_abs_path}")
                    # Items parsed from ISBDMSES.html belong to the "ses" MDX section for key normalization
                    # and will have relationship_category=None (unless explicitly set if needed)
                    nav_items = parse_html_nav_block(ses_html_abs_path,
                                                     SES_TARGET_MDX_SECTION_KEY, # Normalize hrefs to "ses/..."
                                                     source_html_root_abs)
                    for item in nav_items:
                        master_nav_item_map[item.normalized_key] = item

                # Also parse actual "ves" items from "ves/index.html" if it exists
                # and isn't ISBDMSES.html
                ves_index_html_abs_path = os.path.join(current_source_dir_abs, "index.html")
                if os.path.exists(ves_index_html_abs_path) and SES_HTML_INDEX_FILENAME != "index.html":
                    logging.info(f"Parsing VES HTML: {ves_index_html_abs_path}")
                    nav_items_ves = parse_html_nav_block(ves_index_html_abs_path,
                                                         source_dir_name, # Normalize hrefs to "ves/..."
                                                         source_html_root_abs)
                    for item in nav_items_ves:
                         # Avoid overwriting if SES items were keyed under "ves/..." by mistake in normalize_html_href_to_key
                        if not item.normalized_key.startswith(SES_TARGET_MDX_SECTION_KEY + "/"):
                            if item.normalized_key in master_nav_item_map:
                                logging.warning(f"Duplicate normalized key '{item.normalized_key}' from ves/index.html. Check parsing.")
                            master_nav_item_map[item.normalized_key] = item
            else: # General section (attributes, intro, fullex, etc.)
                # Assume index.html is the primary source for the section's sidebar items
                html_file_to_parse = os.path.join(current_source_dir_abs, "index.html")
                if os.path.exists(html_file_to_parse):
                    logging.info(f"Parsing general HTML: {html_file_to_parse} for section '{source_dir_name}'")
                    nav_items = parse_html_nav_block(html_file_to_parse,
                                                     source_dir_name, # Normalize hrefs to "section_name/..."
                                                     source_html_root_abs)
                    for item in nav_items:
                        if item.normalized_key in master_nav_item_map:
                             logging.warning(f"Duplicate normalized key '{item.normalized_key}' found. Overwriting with item from {html_file_to_parse}")
                        master_nav_item_map[item.normalized_key] = item
                else:
                    logging.debug(f"No index.html in {current_source_dir_abs} to parse for NavItems.")

    logging.info(f"Cached {len(master_nav_item_map)} NavItems in total.")
    return master_nav_item_map


# --- Front Matter Read/Write (same as previous good version) ---
def read_front_matter(mdx_file_path):
    try:
        with open(mdx_file_path, 'r', encoding='utf-8') as f: content = f.read()
    except FileNotFoundError: return {}, ""
    fm_match = re.match(r'^---\s*?\n(.*?\n)---\s*?\n?(.*)', content, re.DOTALL)
    if fm_match:
        fm_str, body_content = fm_match.group(1), fm_match.group(2) if fm_match.group(2) is not None else ""
        try:
            fm_dict = yaml.safe_load(fm_str); return (fm_dict if isinstance(fm_dict, dict) else {}), body_content
        except yaml.YAMLError as e: logging.error(f"YAML err in {mdx_file_path}: {e}"); return {}, content
    return {}, content

def write_front_matter(mdx_file_path, front_matter_dict, body_content, dry_run=False, dry_run_output_dir=None, target_mdx_root_abs=None):
    # Clean up empty customProps before dumping
    if "customProps" in front_matter_dict and not front_matter_dict["customProps"]:
        del front_matter_dict["customProps"]

    # Ensure our specific keys are ordered after sidebar_label if possible, or create new FM
    ordered_fm = {}
    if "sidebar_label" in front_matter_dict: # Ensure label is first of our keys
        ordered_fm["sidebar_label"] = front_matter_dict.pop("sidebar_label")

    # Add our specific keys if they exist in the input dict
    for key in ["sidebar_level", "sidebar_position", "sidebar_class_name", "sidebar_category", "customProps"]:
        if key in front_matter_dict:
            ordered_fm[key] = front_matter_dict.pop(key)

    # Add back any other keys that were in original or added by other means
    for key, value in front_matter_dict.items():
        ordered_fm[key] = value

    final_fm_to_write = ordered_fm

    final_content = body_content.lstrip() if not final_fm_to_write else f"---\n{yaml.dump(final_fm_to_write, sort_keys=False, allow_unicode=True, default_flow_style=False, width=1000)}---\n{body_content}"

    if dry_run:
        logging.info(f"[DRY RUN] Would write to {mdx_file_path} (FM keys: {list(final_fm_to_write.keys())})")
        if dry_run_output_dir and target_mdx_root_abs:
            try:
                # Construct relative path from target_mdx_root_abs, not its parent
                rel_path = os.path.relpath(mdx_file_path, target_mdx_root_abs)
                dry_run_file_path = os.path.join(dry_run_output_dir, rel_path)
                os.makedirs(os.path.dirname(dry_run_file_path), exist_ok=True)
                with open(dry_run_file_path, 'w', encoding='utf-8') as f_dry: f_dry.write(final_content)
            except Exception as e:
                logging.error(f"Error writing dry run output for {mdx_file_path}: {e}")
        return
    try:
        with open(mdx_file_path, 'w', encoding='utf-8') as f: f.write(final_content)
    except Exception as e: logging.error(f"Error writing FM to {mdx_file_path}: {e}")


def process_single_mdx_file(mdx_file_path_abs, target_mdx_root_abs, master_nav_item_map, dry_run, dry_run_output_dir):
    logging.info(f"Processing MDX: {mdx_file_path_abs}")

    # Get normalized key for this MDX file to look up in master_nav_item_map
    mdx_key = normalize_mdx_path_to_key(mdx_file_path_abs, target_mdx_root_abs)
    nav_item = master_nav_item_map.get(mdx_key)

    existing_fm, body_content = read_front_matter(mdx_file_path_abs)
    updated_fm = dict(existing_fm) # Operate on a copy

    if not nav_item:
        logging.debug(f"No NavItem found for MDX key '{mdx_key}' ({mdx_file_path_abs}). Cleaning potentially stale sidebar FM.")
        for key_to_remove in ["sidebar_label", "sidebar_level", "sidebar_position", "sidebar_class_name", "sidebar_category"]:
            if key_to_remove in updated_fm: del updated_fm[key_to_remove]
        if "customProps" in updated_fm and isinstance(updated_fm.get("customProps"), dict) and "sidebar_prefix" in updated_fm["customProps"]:
            del updated_fm["customProps"]["sidebar_prefix"]
        # Fall through to write_front_matter to save cleaned FM or original if no changes
    else:
        # 1. Set sidebar_label (normalized text already in nav_item.label)
        updated_fm["sidebar_label"] = nav_item.label

        # 2. Set relative sidebar_level and sidebar_position
        updated_fm["sidebar_level"] = nav_item.relative_html_level
        updated_fm["sidebar_position"] = nav_item.position_in_html_block

        # 3. Assign sidebar_class_name for relative_html_level: 1 items
        if nav_item.relative_html_level == 1:
            updated_fm["sidebar_class_name"] = CLASS_LOCAL_LEVEL_1_ITEM
        elif "sidebar_class_name" in updated_fm and updated_fm["sidebar_class_name"] == CLASS_LOCAL_LEVEL_1_ITEM:
            # Remove it if level is no longer 1
            del updated_fm["sidebar_class_name"]

        # 4. Assign sidebar_category for relationship files
        if nav_item.relationship_category:
            updated_fm["sidebar_category"] = nav_item.relationship_category
        elif "sidebar_category" in updated_fm and mdx_key.startswith(RELATIONSHIPS_TARGET_MDX_DIR_KEY + "/"):
            # Remove if it's a relationship file but no longer has a category from HTML parsing
             del updated_fm["sidebar_category"]


        # 5. Generate and assign sidebar_prefix (based on relative hierarchy)
        prefix = generate_sidebar_prefix(nav_item)

        # Ensure customProps exists if we need to add/remove prefix
        if "customProps" not in updated_fm or not isinstance(updated_fm.get("customProps"), dict):
            # If prefix is being added, initialize customProps. Otherwise, only if it existed.
            if prefix or ("customProps" in updated_fm and updated_fm.get("customProps") is not None): # Handle if customProps was scalar/list
                 updated_fm["customProps"] = {} if not isinstance(updated_fm.get("customProps"), dict) else updated_fm.get("customProps")


        if prefix:
            if "customProps" not in updated_fm: updated_fm["customProps"] = {} # Should be caught above
            updated_fm["customProps"]["sidebar_prefix"] = prefix
        elif "customProps" in updated_fm and isinstance(updated_fm.get("customProps"), dict) and "sidebar_prefix" in updated_fm["customProps"]:
            del updated_fm["customProps"]["sidebar_prefix"]

    write_front_matter(mdx_file_path_abs, updated_fm, body_content, dry_run, dry_run_output_dir, target_mdx_root_abs)
    return True

# --- Main Execution ---
def main():
    parser = argparse.ArgumentParser(description="Generate Docusaurus sidebar front matter (labels, relative levels/positions, prefixes, relationship categories).")
    parser.add_argument("--source_html_root", default=DEFAULT_SOURCE_HTML_ROOT)
    parser.add_argument("--target_mdx_root", default=DEFAULT_TARGET_MDX_ROOT)
    parser.add_argument("--single_dir", help="Process only MDX files in this subdirectory of target_mdx_root (e.g., 'attributes').")
    parser.add_argument("--log_file", default="generate_sidebar_frontmatter.log")
    parser.add_argument("--log_level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"])
    parser.add_argument("--dry_run", action="store_true")
    parser.add_argument("--dry_run_output", help="Directory to write modified files during a dry run.")
    args = parser.parse_args()

    setup_logging(args.log_level, args.log_file)

    abs_source_html_root = os.path.abspath(args.source_html_root)
    abs_target_mdx_root = os.path.abspath(args.target_mdx_root)

    dry_run_output_abs = None
    if args.dry_run and args.dry_run_output:
        dry_run_output_abs = os.path.abspath(args.dry_run_output)
        if os.path.exists(dry_run_output_abs): shutil.rmtree(dry_run_output_abs)
        os.makedirs(dry_run_output_abs, exist_ok=True)
        logging.info(f"DRY RUN: Outputting modified files to {dry_run_output_abs}")

    logging.info(f"Source HTML Root: {abs_source_html_root}")
    logging.info(f"Target MDX Root: {abs_target_mdx_root}")

    master_nav_item_map = cache_all_html_sidebar_maps(abs_source_html_root)
    if not master_nav_item_map:
        logging.error("No NavItems could be cached from HTML sources. Exiting.")
        return

    num_processed, num_skipped = 0, 0

    paths_to_scan_for_mdx = []
    if args.single_dir:
        single_dir_path = os.path.join(abs_target_mdx_root, args.single_dir)
        if not os.path.isdir(single_dir_path):
            logging.error(f"Single directory specified but not found: {single_dir_path}")
            return
        paths_to_scan_for_mdx.append(single_dir_path)
        logging.info(f"Processing single target directory: {args.single_dir}")
    else:
        paths_to_scan_for_mdx.append(abs_target_mdx_root) # For root files
        for entry in os.listdir(abs_target_mdx_root):
            item_path = os.path.join(abs_target_mdx_root, entry)
            if os.path.isdir(item_path): # And all top-level subdirs
                paths_to_scan_for_mdx.append(item_path)
        logging.info(f"Processing all MDX files under {abs_target_mdx_root} (and its top-level subdirs)")

    for path_to_walk in paths_to_scan_for_mdx:
        for dirpath, _, filenames in os.walk(path_to_walk):
            for filename in filenames:
                if filename.endswith(".mdx"):
                    mdx_file_path = os.path.join(dirpath, filename)
                    if args.dry_run and dry_run_output_abs is None:
                        logging.info(f"[DRY RUN] Would process: {mdx_file_path}")
                        num_processed +=1; continue
                    try:
                        if process_single_mdx_file(mdx_file_path, abs_target_mdx_root, master_nav_item_map, args.dry_run, dry_run_output_abs):
                            num_processed += 1
                    except Exception as e:
                        logging.error(f"Unhandled error processing {mdx_file_path}: {e}", exc_info=True)
                        num_skipped += 1

    logging.info(f"Processing complete. MDX files processed/attempted: {num_processed}. Errors/Skipped: {num_skipped}")

if __name__ == "__main__":
    main()