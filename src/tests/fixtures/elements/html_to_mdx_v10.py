#!/usr/bin/env python3
import os
import re
import yaml # PyYAML
from bs4 import BeautifulSoup
import argparse
import logging
from collections import defaultdict # Not strictly used in this version, but good for complex grouping
import shutil

# --- Configuration Constants ---
DEFAULT_SOURCE_HTML_ROOT = "ISBDM/docs/"
DEFAULT_TARGET_MDX_ROOT = "docs/"

# MDX file paths (relative to TARGET_MDX_ROOT) that are main category pages.
# These get CLASS_MAIN_CATEGORY_PAGE. Their children's absolute level starts from their level + 1.
# Format: 'path/to/index.mdx' or 'path/to/doc.mdx'
MAIN_CATEGORY_INDEX_FILES_CONFIG = [
    "index.mdx", # Site root index, if it has its own sidebar structure defined in HTML
    "intro/index.mdx",
    "assess/index.mdx",
    "elements/index.mdx",
    "values/index.mdx",
    "fullex/index.mdx", # User confirmed this is an expandable category
    "glossary/index.mdx",
    "about/index.mdx",
]

# CSS class names
CLASS_MAIN_CATEGORY_PAGE = "menu-item--sidebar-category-page"
# CLASS_FILE_SECTION_START is removed from Python generation for now,
# TS script will determine categories more dynamically or rely on user's manual FM edits for these.

# Special handling for 'relationships' section sidebar source HTMLs
RELATIONSHIPS_HTML_CONFIG_PATHS = [ # Relative to SOURCE_HTML_ROOT
    "relationships/index.html", "relationships/general.html", "relationships/agents.html",
    "relationships/resources.html", "relationships/placetimes.html", "relationships/nomens.html",
]

# SES (String Encoding Schemes) specific configuration
SES_HTML_SOURCE_DIR_FROM_ROOT = "ves" # Source HTMLs are in ISBDM/docs/ves/
SES_HTML_INDEX_FILENAME = "ISBDMSES.html" # This HTML in .../ves/ provides SES hierarchy
SES_TARGET_MDX_SECTION_KEY = "ses"    # Target MDX dir (docs/ses/) uses this key

# SECTION_CONFIG: Defines how HTML source dirs/files map to MDX sections and their base absolute levels.
# 'mdx_section_key': Key for cached_structures and how MDX files in docs/<mdx_section_key>/ map.
# 'source_html_dir': Directory under SOURCE_HTML_ROOT where HTMLs are.
# 'source_html_file': Specific HTML file in source_html_dir to parse for this section's nav.
# 'index_doc_absolute_level': The absolute sidebar_level for this section's *index.mdx* page.
# 'children_absolute_base_level': The absolute sidebar_level for the *first level of children* parsed from source_html_file.
SECTION_CONFIG = {
    "root_index": {"source_html_dir": "", "source_html_file": "index.html", "index_doc_absolute_level": 1, "children_absolute_base_level": 1}, # For docs/index.mdx items
    "intro":    {"source_html_dir": "intro", "source_html_file": "index.html", "index_doc_absolute_level": 1, "children_absolute_base_level": 2},
    "assess":   {"source_html_dir": "assess", "source_html_file": "index.html", "index_doc_absolute_level": 1, "children_absolute_base_level": 2},
    "elements": {"source_html_dir": "elements", "source_html_file": "index.html", "index_doc_absolute_level": 1, "children_absolute_base_level": 2},
    "statements": {"source_html_dir": "statements", "source_html_file": "index.html", "index_doc_absolute_level": 2, "children_absolute_base_level": 3},
    "notes":    {"source_html_dir": "notes", "source_html_file": "index.html", "index_doc_absolute_level": 2, "children_absolute_base_level": 3},
    "attributes": {"source_html_dir": "attributes", "source_html_file": "index.html", "index_doc_absolute_level": 2, "children_absolute_base_level": 3}, # Or 1022.html
    "relationships": { # Children of 'elements' main category
        "source_html_dir": "relationships", 
        "source_html_files": RELATIONSHIPS_HTML_CONFIG_PATHS, # List of HTMLs to combine
        "index_doc_absolute_level": 2, # For docs/relationships/index.mdx
        "children_absolute_base_level": 3 # For items like agents.mdx, or items within agents.mdx's own list
    },
    "values":   {"source_html_dir": "values", "source_html_file": "index.html", "index_doc_absolute_level": 1, "children_absolute_base_level": 2},
    "ves":      {"source_html_dir": "ves", "source_html_file": "index.html", "index_doc_absolute_level": 2, "children_absolute_base_level": 3}, # Vocabularies
    "ses": { # String Encoding Schemes - special source
        "source_html_dir": SES_HTML_SOURCE_DIR_FROM_ROOT, # HTMLs are in "ves"
        "source_html_file": SES_HTML_INDEX_FILENAME,    # ISBDMSES.html
        "index_doc_absolute_level": 2, # For docs/ses/index.mdx
        "children_absolute_base_level": 3 # For items in ISBDMSES.html list
    },
    "fullex":   {"source_html_dir": "fullex", "source_html_file": "index.html", "index_doc_absolute_level": 1, "children_absolute_base_level": 2},
    "glossary": {"source_html_dir": "glossary", "source_html_file": "index.html", "index_doc_absolute_level": 1, "children_absolute_base_level": 2},
    "about":    {"source_html_dir": "about", "source_html_file": "index.html", "index_doc_absolute_level": 1, "children_absolute_base_level": 2},
}


# --- Data Structures ---
class NavItem:
    def __init__(self, original_href, normalized_key, label, html_level, # html_level is NOW ABSOLUTE
                 html_position_in_section, source_html_file_path, mdx_path=None):
        self.original_href = original_href
        self.normalized_key = normalized_key
        self.label = label
        self.html_level = html_level # This will be the absolute level
        self.html_position_in_section = html_position_in_section
        self.source_html_file_path = source_html_file_path
        self.mdx_path = mdx_path
        self.is_last_sibling = False
        self.ancestor_is_last_flags = []
        self.has_children_in_html = False # New flag

    def __repr__(self):
        return (f"NavItem(key='{self.normalized_key}', lbl='{self.label}', abs_lvl={self.html_level}, "
                f"pos={self.html_position_in_section}, last_sib={self.is_last_sibling}, "
                f"ancestors={self.ancestor_is_last_flags}, mdx='{self.mdx_path}')")

# --- Utility Functions ---
def setup_logging(log_level_str="INFO", log_file="generate_sidebar_frontmatter.log"):
    # ... (same as before)
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)
    logging.basicConfig(level=log_level, format="%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s",
                        handlers=[logging.FileHandler(log_file, mode='w', encoding='utf-8'), logging.StreamHandler()])
    logging.info(f"Logging setup at level {log_level_str} to {log_file}")


def normalize_text(text_string):
    # ... (same as before)
    if not text_string: return ""
    text = str(text_string)
    text = text.replace('\xa0', ' ') 
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_mdx_path_to_key(mdx_file_path, base_dir):
    # ... (same as before)
    relative_path = os.path.relpath(mdx_file_path, base_dir)
    path_no_ext, _ = os.path.splitext(relative_path)
    return os.path.normpath(path_no_ext).replace(os.sep, '/')


def normalize_html_href_to_key(href, source_html_section_key, source_html_root_abs):
    # source_html_section_key is like "attributes", "ves", or for SES it could be "ses" if we map it early
    if not href: return None

    # Handle SES specific mapping: if source_html_section_key indicates SES context
    if source_html_section_key == SES_TARGET_MDX_SECTION_KEY: # If we know this href is for an SES doc
        filename_no_ext, _ = os.path.splitext(os.path.basename(href))
        if filename_no_ext.upper() == "ISBDMSES": # from ISBDM/docs/ves/ISBDMSES.html
             return f"{SES_TARGET_MDX_SECTION_KEY}/index"
        # Assumes hrefs like "ISBDMSES1023.html" come from ISBDMSES.html within .../ves/
        if "ISBDMSES" in filename_no_ext.upper():
            return f"{SES_TARGET_MDX_SECTION_KEY}/{filename_no_ext}"
        # If other files from ves/ISBDMSES.html are linked but not ISBDMSES*, they need careful handling
        # For now, assume ISBDMSES.html only links to ISBDMSES*.html files for the SES section.

    path_part = ""
    # Check for full local paths if script is run from a deep directory (less likely)
    # More likely are /ISBDM/docs/... or relative paths from within a section's HTML
    # source_html_root_abs is like /abs/path/to/ISBDM/docs
    # source_html_section_key is like 'attributes' or 'intro'

    if href.startswith(source_html_root_abs):
        path_part = href[len(source_html_root_abs):].lstrip("/")
    elif href.startswith("/ISBDM/docs/"):
         path_part = href[len("/ISBDM/docs/"):].lstrip("/")
    elif href.startswith("/"):
        logging.warning(f"Found absolute href '{href}' not matching known root structure in section '{source_html_section_key}'.")
        path_part = href.lstrip("/") # May lead to incorrect key
    else: # Relative path like "1022.html" or "sub/file.html" from within source_html_section_key directory
        path_part = os.path.join(source_html_section_key, href) # Assumes source_html_section_key is the dir name

    path_no_ext, _ = os.path.splitext(path_part)
    normalized = os.path.normpath(path_no_ext).replace(os.sep, '/')
    
    # Special case for "root_index" section key, whose files are directly under docs/
    # e.g. href="intro/index.html" found in ISBDM/docs/index.html for root_index
    # path_part would be "intro/index.html". Normalized: "intro/index"
    # If href="index.html" in root for root, normalized "index" (correct for docs/index.mdx)
    if source_html_section_key == "root_index" and not "/" in normalized and normalized != "index":
        # This implies a file like "somefile.html" was linked from root index.html,
        # but it should probably be "somefile/index.html" or belong to a section.
        # This logic might need refinement based on ISBDM/docs/index.html structure.
        pass

    return normalized


# --- Core Parsing and Hierarchy Logic ---
def parse_html_sidebar_nav(html_file_path, 
                           source_html_section_key_for_norm, # e.g. "attributes", "ves" (for SES items), "intro"
                           source_html_root_abs,
                           children_absolute_base_level): # The absolute level for 0-indent items in this HTML
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
        for div in link_divs:
            link_tag = div.find('a', href=True)
            if link_tag:
                item_position_counter += 1
                href = link_tag.get('href', '').strip()
                label = normalize_text(link_tag.get_text())
                
                indent_icons = div.find_all('i', class_='bi-arrow-return-right')
                local_indent_depth = len(indent_icons) # 0 for no icons, 1 for one icon...
                
                # Absolute level combines base for this HTML's children + local indent
                absolute_level = children_absolute_base_level + local_indent_depth

                # If parsing ISBDM/docs/ves/ISBDMSES.html, the normalized key needs to point to "ses/..."
                current_section_key_for_norm = SES_TARGET_MDX_SECTION_KEY if source_html_section_key_for_norm == SES_HTML_SOURCE_DIR_FROM_ROOT and "ISBDMSES" in html_file_path else source_html_section_key_for_norm
                
                normalized_key = normalize_html_href_to_key(href, current_section_key_for_norm, source_html_root_abs)
                if not normalized_key:
                    logging.warning(f"Could not normalize href '{href}' in {html_file_path} for section key '{current_section_key_for_norm}'. Skipping item '{label}'.")
                    continue
                
                nav_items.append(NavItem(
                    original_href=href, normalized_key=normalized_key, label=label,
                    html_level=absolute_level, # Store ABSOLUTE level
                    html_position_in_section=item_position_counter,
                    source_html_file_path=html_file_path
                ))
    return nav_items

def determine_hierarchy_properties(section_nav_items: list[NavItem]):
    # ... (This function remains largely the same as in the previous complete Python script)
    # It operates on the .html_level which is now absolute.
    if not section_nav_items: return

    # Pass 1: Determine is_last_sibling for all items
    for i, current_item in enumerate(section_nav_items):
        current_item.is_last_sibling = True 
        for j in range(i + 1, len(section_nav_items)):
            next_item = section_nav_items[j]
            if next_item.html_level == current_item.html_level:
                current_item.is_last_sibling = False; break
            if next_item.html_level < current_item.html_level:
                break
    
    # Pass 2: Determine ancestor_is_last_flags and has_children_in_html
    parent_is_last_at_level_stack = [] 
    for i, item in enumerate(section_nav_items):
        while len(parent_is_last_at_level_stack) >= item.html_level:
            parent_is_last_at_level_stack.pop()
        item.ancestor_is_last_flags = list(parent_is_last_at_level_stack)
        if len(parent_is_last_at_level_stack) < item.html_level :
             parent_is_last_at_level_stack.append(item.is_last_sibling)
        else: 
             parent_is_last_at_level_stack[item.html_level -1] = item.is_last_sibling
        
        # Determine if item has children in this HTML structure
        if i + 1 < len(section_nav_items) and section_nav_items[i+1].html_level > item.html_level:
            item.has_children_in_html = True

def generate_sidebar_prefix(nav_item: NavItem):
    # ... (This function remains the same, uses absolute nav_item.html_level)
    if nav_item.html_level < 2: return None
    prefix_parts = []
    for i in range(nav_item.html_level - 1):
        is_ancestor_last = nav_item.ancestor_is_last_flags[i] if i < len(nav_item.ancestor_is_last_flags) else True
        prefix_parts.append("   " if is_ancestor_last else "│  ")
    prefix_parts.append("└─ " if nav_item.is_last_sibling else "├─ ")
    return "".join(prefix_parts)

def cache_all_html_sidebar_structures(source_html_root_abs):
    cached_structures = {} # Key: target_mdx_section_key (e.g., "attributes", "ses"), Value: list[NavItem]

    for mdx_section_key_target, config in SECTION_CONFIG.items():
        logging.info(f"Configuring section: {mdx_section_key_target}")
        
        children_base_abs_level = config["children_absolute_base_level"]
        source_html_dir_rel = config["source_html_dir"] # Relative to source_html_root_abs

        current_section_items = []

        if "source_html_files" in config: # Special case like 'relationships'
            logging.info(f"Parsing combined HTMLs for: {mdx_section_key_target}")
            pos_counter = 0
            temp_items_combined = []
            for html_file_rel_to_source_root in config["source_html_files"]:
                html_file_abs_path = os.path.join(source_html_root_abs, html_file_rel_to_source_root)
                # The section key for normalization is the directory of these files (e.g. "relationships")
                section_key_for_norm = os.path.dirname(html_file_rel_to_source_root)
                
                items_from_html = parse_html_sidebar_nav(html_file_abs_path, 
                                                         section_key_for_norm, 
                                                         source_html_root_abs, 
                                                         children_base_abs_level)
                for item in items_from_html:
                    pos_counter += 1
                    item.html_position_in_section = pos_counter
                temp_items_combined.extend(items_from_html)
            
            unique_items_dict = {} # Deduplicate based on normalized_key
            for item in temp_items_combined:
                if item.normalized_key not in unique_items_dict:
                    unique_items_dict[item.normalized_key] = item
            current_section_items = list(unique_items_dict.values())

        else: # General case for single source_html_file
            html_file_abs_path = os.path.join(source_html_root_abs, source_html_dir_rel, config["source_html_file"])
            # The section key for normalization within parse_html_sidebar_nav should be the target mdx section key
            # especially for SES where source dir is 'ves' but target is 'ses'.
            norm_key_context = mdx_section_key_target 
            if os.path.exists(html_file_abs_path):
                logging.info(f"Parsing HTML: {html_file_abs_path} for MDX section '{mdx_section_key_target}' with children_base_abs_level {children_base_abs_level}")
                current_section_items = parse_html_sidebar_nav(
                   html_file_abs_path, 
                   norm_key_context, # Use target section key for context, esp. for SES mapping
                   source_html_root_abs,
                   children_base_abs_level
                )
            else:
                logging.warning(f"HTML source {html_file_abs_path} not found for section {mdx_section_key_target}")
        
        if current_section_items:
            current_section_items.sort(key=lambda x: x.html_position_in_section)
            determine_hierarchy_properties(current_section_items)
            cached_structures[mdx_section_key_target] = current_section_items
            logging.debug(f"Cached {len(current_section_items)} items for section '{mdx_section_key_target}'. First: {current_section_items[0] if current_section_items else 'N/A'}")
        else:
            logging.info(f"No items parsed for section '{mdx_section_key_target}'.")

    return cached_structures

def get_mdx_nav_item_from_cache(mdx_file_path_abs, target_mdx_root_abs, cached_structures):
    # ... (same as before, but ensure mdx_key_full correctly identifies section for lookup)
    mdx_key_full = normalize_mdx_path_to_key(mdx_file_path_abs, target_mdx_root_abs)
    parts = mdx_key_full.split('/')
    
    # Determine section_key from mdx_key_full
    # If mdx_key_full is "elements/statements/index", section_key should be "statements"
    # If mdx_key_full is "elements/index", section_key should be "elements"
    # If mdx_key_full is "intro/index", section_key should be "intro"
    # If mdx_key_full is "index", section_key should be "root_index" (as defined in SECTION_CONFIG)

    section_key_from_mdx = ""
    if mdx_key_full == "index":
        section_key_from_mdx = "root_index"
    elif len(parts) == 1: # e.g. "somefile" (if docs/somefile.mdx exists, unlikely for sections)
        section_key_from_mdx = parts[0] # This would need its own SECTION_CONFIG entry
    elif len(parts) > 1:
        # Is docs/elements/index.mdx (key "elements/index") part of "elements" section NavItems
        # or is docs/elements/statements/index.mdx (key "elements/statements/index") part of "statements"?
        # The NavItems are cached under their final MDX section key.
        # So, if MDX is docs/attributes/1022.mdx -> key "attributes/1022" -> lookup in cached_structures["attributes"]
        # If MDX is docs/ses/index.mdx -> key "ses/index" -> lookup in cached_structures["ses"]
        section_key_from_mdx = parts[0] # General assumption, might need refinement if sub-sub-sections exist as keys
        if section_key_from_mdx in cached_structures:
            pass # Good
        elif len(parts) > 1 and "/".join(parts[:2]) in cached_structures: # e.g. "elements/statements"
            section_key_from_mdx = "/".join(parts[:2])
        # This needs to be robust: map MDX path to the key used in SECTION_CONFIG and thus cached_structures.
        # For now, assume simple top-level directory name matches section_key
        if section_key_from_mdx == "docs": # should not happen with relpath
             section_key_from_mdx = "root_index"


    nav_item_list = cached_structures.get(section_key_from_mdx)
    if not nav_item_list:
        logging.debug(f"No cached HTML structure for inferred section key '{section_key_from_mdx}' (from MDX: {mdx_file_path_abs}). Keys available: {list(cached_structures.keys())}")
        return None

    for nav_item in nav_item_list:
        if nav_item.normalized_key == mdx_key_full:
            nav_item.mdx_path = mdx_file_path_abs 
            return nav_item
            
    logging.debug(f"No NavItem for MDX key '{mdx_key_full}' in section '{section_key_from_mdx}' structure after checking {len(nav_item_list)} items.")
    return None

# --- Front Matter Read/Write (same as before) ---
def read_front_matter(mdx_file_path): # ... (same)
    try:
        with open(mdx_file_path, 'r', encoding='utf-8') as f: content = f.read()
    except FileNotFoundError: return {}, ""
    fm_match = re.match(r'^---\s*?\n(.*?\n)---\s*?\n?(.*)', content, re.DOTALL)
    if fm_match:
        fm_str, body_content = fm_match.group(1), fm_match.group(2) if fm_match.group(2) is not None else ""
        try:
            fm_dict = yaml.safe_load(fm_str)
            return (fm_dict if isinstance(fm_dict, dict) else {}), body_content
        except yaml.YAMLError as e: logging.error(f"YAML err in {mdx_file_path}: {e}"); return {}, content
    return {}, content

def write_front_matter(mdx_file_path, front_matter_dict, body_content, dry_run=False, dry_run_output_dir=None, target_mdx_root_abs=None): # ... (same, but added target_mdx_root_abs for dry_run pathing)
    if "customProps" in front_matter_dict and not front_matter_dict["customProps"]: del front_matter_dict["customProps"]
    final_content = body_content.lstrip() if not front_matter_dict else f"---\n{yaml.dump(front_matter_dict, sort_keys=False, allow_unicode=True, default_flow_style=False, width=1000)}---\n{body_content}"
    if dry_run:
        logging.info(f"[DRY RUN] Would write to {mdx_file_path} (FM keys: {list(front_matter_dict.keys())})")
        if dry_run_output_dir and target_mdx_root_abs: # Ensure target_mdx_root_abs is available
            rel_path = os.path.relpath(mdx_file_path, target_mdx_root_abs)
            dry_run_file_path = os.path.join(dry_run_output_dir, rel_path)
            os.makedirs(os.path.dirname(dry_run_file_path), exist_ok=True)
            with open(dry_run_file_path, 'w', encoding='utf-8') as f_dry: f_dry.write(final_content)
        return
    try:
        with open(mdx_file_path, 'w', encoding='utf-8') as f: f.write(final_content)
    except Exception as e: logging.error(f"Error writing FM to {mdx_file_path}: {e}")


def process_single_mdx_file(mdx_file_path_abs, target_mdx_root_abs, main_category_files_abs_normalized, cached_structures, dry_run, dry_run_output_dir):
    # ... (main logic as before, but use absolute levels from NavItem.html_level for decisions)
    logging.info(f"Processing MDX: {mdx_file_path_abs}")
    nav_item = get_mdx_nav_item_from_cache(mdx_file_path_abs, target_mdx_root_abs, cached_structures)
    existing_fm, body_content = read_front_matter(mdx_file_path_abs)
    
    updated_fm = dict(existing_fm) # Start with existing FM

    if not nav_item:
        logging.debug(f"No HTML NavItem for {mdx_file_path_abs}. Cleaning up potentially stale sidebar FM.")
        # Remove keys this script manages if item is no longer in sidebar map
        for key_to_remove in ["sidebar_label", "sidebar_level", "sidebar_position", "sidebar_class_name"]:
            if key_to_remove in updated_fm: del updated_fm[key_to_remove]
        if "customProps" in updated_fm and isinstance(updated_fm["customProps"], dict) and "sidebar_prefix" in updated_fm["customProps"]:
            del updated_fm["customProps"]["sidebar_prefix"]
        write_front_matter(mdx_file_path_abs, updated_fm, body_content, dry_run, dry_run_output_dir, target_mdx_root_abs)
        return True

    # 1. Core FM fields from NavItem (html_level is now absolute)
    updated_fm["sidebar_label"] = nav_item.label
    updated_fm["sidebar_level"] = nav_item.html_level 
    updated_fm["sidebar_position"] = nav_item.html_position_in_section

    # 2. Assign sidebar_class_name
    assigned_class = None
    mdx_path_relative_norm = normalize_mdx_path_to_key(mdx_file_path_abs, target_mdx_root_abs)

    if mdx_path_relative_norm in main_category_files_abs_normalized: # main_category_files_abs_normalized contains paths like "elements/index"
        assigned_class = CLASS_MAIN_CATEGORY_PAGE
        # Validate if this main category page's absolute level is consistent (e.g., 1 or 2 based on SECTION_CONFIG)
        expected_level = SECTION_CONFIG.get(mdx_path_relative_norm.split('/')[0], {}).get("index_doc_absolute_level")
        if expected_level and nav_item.html_level != expected_level:
             logging.warning(f"Main category {mdx_path_relative_norm} has html_level {nav_item.html_level} but config implies {expected_level}")

    # User will manually remove this class from the 4 childless top-level items.
    # Python script won't try to be too clever about CLASS_FILE_SECTION_START for now.
    # It's applied if html_level=1 LOCALLY and has children LOCALLY.
    # With absolute levels, this logic changes: an item is a "file section start" if it's, e.g., absolute level 2,
    # is not a MAIN_CATEGORY_PAGE, and has children itself (absolute level 3+).
    # For now, let TS generator determine most categories, Python just flags MAIN_CATEGORY_PAGES.
    # This means CLASS_FILE_SECTION_START will not be set by this Python script iteration.
    # User can add it manually or we can refine this if TS generator needs it as a hint.
    
    if assigned_class:
        updated_fm["sidebar_class_name"] = assigned_class
    elif "sidebar_class_name" in updated_fm and updated_fm["sidebar_class_name"] == CLASS_MAIN_CATEGORY_PAGE:
        del updated_fm["sidebar_class_name"] # Remove if no longer a main cat page

    # 3. Generate and assign sidebar_prefix
    prefix = None
    # No prefix if it's a main category page OR if item's absolute level < 2
    if not assigned_class and nav_item.html_level >= 2: 
        prefix = generate_sidebar_prefix(nav_item)
    
    if "customProps" not in updated_fm or not isinstance(updated_fm.get("customProps"), dict):
        updated_fm["customProps"] = {}
    if prefix:
        updated_fm["customProps"]["sidebar_prefix"] = prefix
    elif "sidebar_prefix" in updated_fm["customProps"]:
        del updated_fm["customProps"]["sidebar_prefix"]
            
    write_front_matter(mdx_file_path_abs, updated_fm, body_content, dry_run, dry_run_output_dir, target_mdx_root_abs)
    return True

def main():
    # ... (argparse setup same as before) ...
    parser = argparse.ArgumentParser(description="Generate Docusaurus sidebar front matter from HTML structures.")
    parser.add_argument("--source_html_root", default=DEFAULT_SOURCE_HTML_ROOT, help="Root directory of source HTML files.")
    parser.add_argument("--target_mdx_root", default=DEFAULT_TARGET_MDX_ROOT, help="Root directory of target Docusaurus MDX files.")
    parser.add_argument("--single_dir", help="Process only a single MDX subdirectory (e.g., 'attributes' or 'ses'). Relative to target_mdx_root.")
    parser.add_argument("--log_file", default="generate_sidebar_frontmatter.log", help="Log file name.")
    parser.add_argument("--log_level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], help="Logging level.")
    parser.add_argument("--dry_run", action="store_true", help="Perform a dry run without writing to MDX files.")
    parser.add_argument("--dry_run_output", help="Directory to write modified files during a dry run. (e.g. 'dry_run_output')")
    args = parser.parse_args()
    setup_logging(args.log_level, args.log_file)
    
    abs_source_html_root = os.path.abspath(args.source_html_root)
    abs_target_mdx_root = os.path.abspath(args.target_mdx_root)

    # Normalize MAIN_CATEGORY_INDEX_FILES_CONFIG to match keys generated by normalize_mdx_path_to_key
    # e.g., "intro/index.mdx" -> "intro/index"
    main_category_files_abs_normalized = {
        normalize_mdx_path_to_key(os.path.join(abs_target_mdx_root, p), abs_target_mdx_root): True 
        for p in MAIN_CATEGORY_INDEX_FILES_CONFIG
    }
    
    dry_run_output_abs = None
    if args.dry_run and args.dry_run_output:
        dry_run_output_abs = os.path.abspath(args.dry_run_output)
        if os.path.exists(dry_run_output_abs): shutil.rmtree(dry_run_output_abs)
        os.makedirs(dry_run_output_abs, exist_ok=True)
        logging.info(f"DRY RUN: Outputting modified files to {dry_run_output_abs}")

    logging.info(f"Source HTML Root: {abs_source_html_root}")
    logging.info(f"Target MDX Root: {abs_target_mdx_root}")

    # Pass abs_source_html_root to cache_all_html_sidebar_structures for its internal path joining
    cached_sidebar_data = cache_all_html_sidebar_structures(abs_source_html_root)
    # ... (rest of main loop processing MDX files, same as before, passing target_mdx_root_abs to write_front_matter for dry_run) ...
    num_processed, num_skipped = 0, 0
    paths_to_walk = []
    if args.single_dir:
        single_dir_path = os.path.join(abs_target_mdx_root, args.single_dir)
        if not os.path.isdir(single_dir_path):
            logging.error(f"Single directory specified but not found: {single_dir_path}")
            return
        paths_to_walk.append(single_dir_path)
        logging.info(f"Processing single target directory: {args.single_dir}")
    else:
        paths_to_walk.append(abs_target_mdx_root) # For root files like index.mdx
        for entry in os.listdir(abs_target_mdx_root): # And all top-level subdirs
            full_path = os.path.join(abs_target_mdx_root, entry)
            if os.path.isdir(full_path):
                paths_to_walk.append(full_path)
        logging.info(f"Processing all MDX files under {abs_target_mdx_root}")

    for path_to_process in paths_to_walk:
        for dirpath, _, filenames in os.walk(path_to_process):
            for filename in filenames:
                if filename.endswith(".mdx"):
                    mdx_file_path = os.path.join(dirpath, filename)
                    if args.dry_run and dry_run_output_abs is None: # Minimal dry run if no output dir
                        logging.info(f"[DRY RUN] Would process: {mdx_file_path}")
                        num_processed +=1
                        continue
                    try:
                        if process_single_mdx_file(mdx_file_path, abs_target_mdx_root, main_category_files_abs_normalized, cached_sidebar_data, args.dry_run, dry_run_output_abs):
                            num_processed += 1
                    except Exception as e:
                        logging.error(f"Unhandled error processing {mdx_file_path}: {e}", exc_info=True)
                        num_skipped += 1
    logging.info(f"Processing complete. MDX files processed/attempted: {num_processed}. Errors/Skipped: {num_skipped}")


if __name__ == "__main__":
    main()