import os
import re
import argparse
import logging
from bs4 import BeautifulSoup, NavigableString, Tag


# --- Helper Functions ---
def normalize_text(text_string):
    if not text_string: return ""
    return re.sub(r'\s+', ' ', str(text_string)).strip()


def get_text_or_empty(element, strip=True):
    if not element: return ""
    if hasattr(element, 'get_text') and callable(element.get_text):
        text = element.get_text()
        return text.strip() if strip else text
    elif isinstance(element, NavigableString):
        text = str(element)
        return text.strip() if strip else text
    return ""


def get_decode_contents_or_empty(element):
    return element.decode_contents() if element and hasattr(element, 'decode_contents') else ""


def process_html_fragment_for_mdx(html_fragment_str, logger, html_filename, is_for_seealso_context=False):
    if not html_fragment_str or not html_fragment_str.strip(): return ""
    frag_soup = BeautifulSoup(f"<body>{html_fragment_str}</body>", 'html.parser').body
    if not frag_soup:
        logger.warning(
            f"{html_filename}: Failed to parse HTML fragment for internal processing: {html_fragment_str[:100]}")
        return normalize_text(html_fragment_str)

    new_parts = []
    for item in frag_soup.contents:
        if isinstance(item, NavigableString):
            new_parts.append(str(item))
        elif isinstance(item, Tag):
            if item.name == 'a' and \
                    ('linkInline' in item.get('class', []) or \
                     (is_for_seealso_context and 'linkMenuElement' in item.get('class', []))):
                link_text = get_text_or_empty(item)
                link_href_raw = item.get('href', '').replace('/ISBDM/docs/', '/docs/', 1).replace('.html', '')
                link_href_for_inlink = link_href_raw[1:] if link_href_raw.startswith('/docs/') else link_href_raw
                new_parts.append(f'<InLink href="{link_href_for_inlink}">{normalize_text(link_text)}</InLink>')
            elif item.name == 'span' and ('bolded' in item.get('class', []) or 'bolder' in item.get('class', [])):
                new_parts.append(f"**{normalize_text(get_text_or_empty(item))}**")
            elif item.name == 'i' or item.name == 'em':
                inner_italic_content = item.decode_contents() if item else ""
                processed_inner_italic = process_html_fragment_for_mdx(inner_italic_content, logger, html_filename,
                                                                       is_for_seealso_context)
                new_parts.append(
                    f"*{processed_inner_italic}*")  # Normalization of processed_inner_italic happens when its final string is normalized
            elif item.name == 'br':
                new_parts.append(" ")
            else:
                new_parts.append(str(item))
                if item.name not in ['strong', 'b', 'sub', 'sup', 'p', 'a', 'small']:  # allow common inline
                    logger.debug(
                        f"{html_filename}: Kept/passed-through tag '{item.name}' in HTML fragment: {str(item)[:50]}")

    processed_string = "".join(new_parts)
    processed_string = processed_string.replace('&ldquo;', '“').replace('&rdquo;', '”').replace('&hellip;', '…')
    # Final outer normalization will be done by the caller using normalize_text()
    return processed_string


def format_rdf_sub_elements(element_divs, base_url_prefix):
    sub_elements = []
    if element_divs:
        links = element_divs.find_all('a', class_='linkMenuElement')
        if not links and element_divs.find('div', class_='navISBDMRef'):
            links = element_divs.find('div', class_='navISBDMRef').find_all('a', class_='linkMenuElement')
        for a_tag in links:
            label = normalize_text(get_text_or_empty(a_tag))
            raw_href = a_tag.get('href', '');
            url = raw_href
            if raw_href.startswith('/ISBDM/docs/'):
                url = raw_href.replace('/ISBDM/docs/', '/docs/', 1).replace(".html", "")
            elif base_url_prefix and raw_href.startswith(base_url_prefix):
                url = raw_href.replace(base_url_prefix, "/docs", 1).replace(".html", "")
            elif ".html" in raw_href:
                url = raw_href.replace(".html", "")
            uri_base = "http://iflastandards.info/ns/isbdm/elements/";
            element_id_from_url = url.split('/')[-1]
            uri_prefix = "P" if element_id_from_url.isdigit() else "C";
            uri = f"{uri_base}{uri_prefix}{element_id_from_url}"
            sub_elements.append({"uri": uri, "url": url, "label": label})
    return sub_elements


def process_example_content_row(ex_part_row_tag, current_table_header_needed_state, logger, html_filename):
    lines_to_add = [];
    new_table_header_needed_state = current_table_header_needed_state
    unrecognized_elements_found = False
    label_tag = ex_part_row_tag.find(class_='xampleLabel');
    value_tag = ex_part_row_tag.find(class_='xampleValue')
    comment_div_tag = ex_part_row_tag.find(class_='editComment')
    if label_tag and value_tag:
        if new_table_header_needed_state: lines_to_add.extend(["    | Property | Value |", "    |:---------|:------|"])
        prop = normalize_text(get_text_or_empty(label_tag));
        val = normalize_text(get_text_or_empty(value_tag))
        lines_to_add.append(f"    | {prop} | {val} |");
        new_table_header_needed_state = False
    elif comment_div_tag:
        comment_text_parts = []
        for c_item in comment_div_tag.contents:
            if isinstance(c_item, NavigableString):
                comment_text_parts.append(str(c_item))
            elif isinstance(c_item, Tag):
                if c_item.name == 'a' and 'linkInline' in c_item.get('class', []):
                    lc_text = get_text_or_empty(c_item);
                    lc_href_raw = c_item.get('href', '').replace('/ISBDM/docs/', '/docs/', 1).replace('.html', '')
                    lc_href_for_inlink = lc_href_raw[1:] if lc_href_raw.startswith('/docs/') else lc_href_raw
                    comment_text_parts.append(f'<InLink href="{lc_href_for_inlink}">{normalize_text(lc_text)}</InLink>')
                elif c_item.name == 'span' and (
                        'bolded' in c_item.get('class', []) or 'bolder' in c_item.get('class', [])):
                    comment_text_parts.append(f"**{normalize_text(get_text_or_empty(c_item))}**")
                else:
                    comment_text_parts.append(str(c_item))
        raw_comment_text_from_parts = "".join(comment_text_parts).strip()
        raw_comment_text_from_parts = raw_comment_text_from_parts.replace('&ldquo;', '“').replace('&rdquo;',
                                                                                                  '”').replace(
            '&hellip;', '…')
        originally_bracketed = raw_comment_text_from_parts.startswith('[') and raw_comment_text_from_parts.endswith(']')
        text_for_normalization = raw_comment_text_from_parts
        if originally_bracketed: text_for_normalization = raw_comment_text_from_parts[1:-1]
        normalized_content = normalize_text(text_for_normalization)
        final_comment_line = f"*[{normalized_content}]*" if originally_bracketed else (
            f"*{normalized_content}*" if normalized_content else "")
        if final_comment_line: lines_to_add.append(f"    {final_comment_line}")
        new_table_header_needed_state = True
    else:
        logger.warning(
            f"{html_filename}: Unrecognized row structure inside example (div.row.px-2): {str(ex_part_row_tag)[:200]}")
        unrecognized_elements_found = True
    return lines_to_add, new_table_header_needed_state, unrecognized_elements_found


def convert_html_to_mdx(html_content, html_filename, logger, html_subdirectory=None):
    soup = BeautifulSoup(html_content, 'html.parser')
    mdx_parts = [];
    unrecognized_elements_log = []

    if html_subdirectory and html_subdirectory != '.':
        target_href_in_html = f"/ISBDM/docs/{html_subdirectory}/{html_filename}"
    else:
        target_href_in_html = f"/ISBDM/docs/{html_filename}"

    sidebar_nav = soup.find('nav', class_='navISBDMSection')
    calculated_sidebar_position = 1;
    calculated_sidebar_level = 1
    if sidebar_nav:
        sidebar_items = sidebar_nav.find_all('div', class_='d-flex', recursive=False);
        item_found_in_sidebar = False
        for idx, item_row in enumerate(sidebar_items):
            link_tag = item_row.find('a', href=True)
            if link_tag and link_tag.get('href',
                                         '').strip() == target_href_in_html.strip():  # Ensure comparison is stripped
                calculated_sidebar_position = idx + 1;
                arrow_icons_count = len(item_row.find_all('i', class_='bi-arrow-return-right'))
                calculated_sidebar_level = arrow_icons_count + 1;
                item_found_in_sidebar = True;
                break
        if not item_found_in_sidebar: unrecognized_elements_log.append(
            f"Warning: Active link '{target_href_in_html}' for {html_filename} not found in sidebar.")

    element_ref_section_h4 = soup.select_one('div.col-md-7 h4:-soup-contains("Element reference")')
    has_element_reference = bool(element_ref_section_h4)
    main_title_tag = soup.select_one('div.col-md-7 > div.row.m-1 > h3')
    if not main_title_tag: main_title_tag = soup.select_one('main.container div.row.m-1 > h3')
    if not main_title_tag: main_title_tag = soup.select_one('main.container h1, div.col-md-7 h1')
    main_page_title = normalize_text(
        get_text_or_empty(main_title_tag if main_title_tag else soup.find('title', recursive=False)))

    if has_element_reference:  # (Frontmatter population and serialization)
        file_id_match = re.search(r'(\d+)\.html$', html_filename);
        element_id_str = file_id_match.group(1) if file_id_match else "UNKNOWN_ID"
        frontmatter = {"id": element_id_str, "title": main_page_title, "sidebar_position": calculated_sidebar_position,
                       "sidebar_level": calculated_sidebar_level, "aliases": [f"/elements/P{element_id_str}"],
                       "RDF": {"id": element_id_str, "definition": "", "domain": "", "range": "",
                               "type": "DatatypeProperty", "scopeNote": "", "elementSubType": [],
                               "elementSuperType": None, "equivalentProperty": [], "inverseOf": []},
                       "deprecated_prospective": "true", "deprecatedInVersion_prospective": "1.2.0",
                       "willBeRemovedInVersion_prospective": "2.0.0"}
        el_ref_container = element_ref_section_h4.find_next_sibling('div', class_='px-4')
        if el_ref_container:
            rows = el_ref_container.find_all('div', class_='row', recursive=False)
            for row in rows:
                ref_label_div = row.find('div', class_='elref');
                text_div = row.find('div', class_='eltext')
                if ref_label_div and text_div:
                    label_text = get_text_or_empty(ref_label_div).lower().replace(" ", "").replace("-", "");
                    rdf_text_content = normalize_text(get_text_or_empty(text_div))
                    if label_text == 'definition':
                        frontmatter["RDF"]["definition"] = rdf_text_content
                    elif label_text == 'scopenote':
                        frontmatter["RDF"]["scopeNote"] = rdf_text_content
                    elif label_text == 'domain':
                        frontmatter["RDF"]["domain"] = rdf_text_content
                    elif label_text == 'range':
                        frontmatter["RDF"]["range"] = rdf_text_content
                    elif label_text == 'elementsubtype':
                        frontmatter["RDF"]["elementSubType"] = format_rdf_sub_elements(text_div, "/ISBDM")
                    elif label_text == 'elementsupertype':
                        super_type_links = format_rdf_sub_elements(text_div, "/ISBDM"); frontmatter["RDF"][
                            "elementSuperType"] = super_type_links[0] if super_type_links else None
                else:
                    unrecognized_elements_log.append(
                        f"{html_filename}: Warning: Unexpected structure in Element Reference row: {str(row)[:100]}")
        elif element_ref_section_h4:
            unrecognized_elements_log.append(
                f"{html_filename}: Warning: 'Element reference' h4 found, but not its 'div.px-4' container.")
        mdx_parts.extend(
            ["---", "# Docusaurus-specific fields", f"id: {frontmatter['id']}", f"title: {frontmatter['title']}",
             f"sidebar_position: {frontmatter['sidebar_position']}  # ...",
             f"sidebar_level: {frontmatter['sidebar_level']}  # ...", "aliases:"] + [f"  - {alias} # ..." for alias in
                                                                                     frontmatter['aliases']] + [
                "\n# Docusaurus defaults ...", "# slug: ...", "# sidebar_label: ...", "\n# Core element metadata",
                "RDF:", "  # Required properties", f"  id: {frontmatter['RDF']['id']}", "  # uri: ...",
                "  # label: ...", f"  definition: {frontmatter['RDF']['definition']}",
                f"  domain: {frontmatter['RDF']['domain']}", f"  range: {frontmatter['RDF']['range']}",
                f"  type: {frontmatter['RDF']['type']}", "  # Optional properties",
                f"  scopeNote: \"{frontmatter['RDF']['scopeNote']}\"", "  \n  # Relationships ...",
                "  elementSubType:  # ..."] + (
                [f"    - uri: {st['uri']}\n      url: {st['url']}\n      label: {st['label']}" for st in
                 frontmatter["RDF"]["elementSubType"]] if frontmatter["RDF"]["elementSubType"] else ["    []"]) + [
                f"  elementSuperType: # ..."] + (
                [f"    uri: {frontmatter['RDF']['elementSuperType']['uri']}\n    url: {frontmatter['RDF']['elementSuperType']['url']}\n    label: {frontmatter['RDF']['elementSuperType']['label']}"] if
                frontmatter["RDF"]["elementSuperType"] else ["  "]) + ["  equivalentProperty: []", "  inverseOf: []",
                                                                       "\n# Status and provenance", "#  status: ...",
                                                                       "#  isDefinedBy: ...",
                                                                       "  \n# Deprecation information ...",
                                                                       f"deprecated: \"\" # ...",
                                                                       f"deprecatedInVersion: \"\" # ...",
                                                                       f"willBeRemovedInVersion: \"\" # ...", "---",
                                                                       ""])

    mdx_parts.append(f"# {main_page_title}");
    if mdx_parts[-1].strip(): mdx_parts.append("")  # Ensure blank line after title

    if has_element_reference: mdx_parts.append("## Element Reference"); mdx_parts.append(
        "<ElementReference frontMatter={frontMatter} />"); mdx_parts.append("")

    # --- Main Content Iteration - REVISED ---
    content_nodes_to_iterate = []
    main_content_column = soup.select_one('div.col-md-7.border.rounded')

    if main_content_column:
        start_node_for_body_content = None
        if has_element_reference and element_ref_section_h4:
            element_ref_wrapper = element_ref_section_h4.find_parent('div', class_='row')
            if element_ref_wrapper: start_node_for_body_content = element_ref_wrapper.find_next_sibling()
        elif main_title_tag:
            title_wrapper = main_title_tag.find_parent('div', class_='row')
            if title_wrapper:
                collect_after_title = False
                for child in title_wrapper.children:
                    if child == main_title_tag: collect_after_title = True; continue
                    if collect_after_title and isinstance(child, Tag): content_nodes_to_iterate.append(child)
                start_node_for_body_content = title_wrapper.find_next_sibling()
            else:
                start_node_for_body_content = main_title_tag.find_next_sibling()
        else:
            start_node_for_body_content = main_content_column.findChild(
                recursive=False) if main_content_column else None
            if start_node_for_body_content:
                unrecognized_elements_log.append(
                    f"{html_filename}: Warning: Using broad fallback for main content start node.")
            else:
                unrecognized_elements_log.append(
                    f"{html_filename}: Warning: Could not find any starting node for main content iteration.")

        current_node_for_collection = start_node_for_body_content
        while current_node_for_collection:
            if isinstance(current_node_for_collection, Tag): content_nodes_to_iterate.append(
                current_node_for_collection)
            current_node_for_collection = current_node_for_collection.find_next_sibling()

    if not content_nodes_to_iterate and main_content_column and \
            not (not has_element_reference and main_title_tag and not list(
                main_title_tag.find_next_siblings(Tag))):  # Check if it was truly an empty page after title
        unrecognized_elements_log.append(
            f"{html_filename}: Warning: No top-level content blocks identified for iteration.")

    for content_block_node_idx, content_block_node in enumerate(content_nodes_to_iterate):
        elements_to_process_this_block = []
        is_direct_block = False
        if content_block_node.name == 'div' and 'row' in content_block_node.get('class',
                                                                                []) and 'm-1' in content_block_node.get(
                'class', []):
            elements_to_process_this_block = [child for child in content_block_node.children if isinstance(child, Tag)]
        elif content_block_node.name:
            elements_to_process_this_block = [content_block_node];
            is_direct_block = True

        if not elements_to_process_this_block and content_block_node.get_text(strip=True) and not is_direct_block:
            unrecognized_elements_log.append(
                f"{html_filename}: Info: Content block node '{content_block_node.name}' had text but no processable child tags: '{content_block_node.get_text(strip=True)[:50]}'")
        elif not elements_to_process_this_block and is_direct_block and not content_block_node.get_text(strip=True):
            unrecognized_elements_log.append(
                f"{html_filename}: Info: Direct content block node '{content_block_node.name}' was empty.")

        for element_idx, element in enumerate(elements_to_process_this_block):
            processed_element_in_section = False
            # Skip main title h3 if it's part of the elements_to_process_this_block
            if element == main_title_tag and main_page_title == normalize_text(get_text_or_empty(element)):
                processed_element_in_section = True;
                continue

            if element.name == 'h4':
                mdx_parts.append(f"## {normalize_text(get_text_or_empty(element))}");
                if mdx_parts[-1].strip(): mdx_parts.append("")
                processed_element_in_section = True
            elif element.name == 'p' and not (element.parent and element.parent.has_attr('class') and \
                                              ('guid' in element.parent.get('class', []) or \
                                               'seeAlsoAdd' in element.parent.get('class', []) or \
                                               'seeAlso' in element.parent.get('class',
                                                                               []))):  # Handle direct <p> not in specific divs
                raw_p_content = element.decode_contents() if element else ""
                processed_p_text = process_html_fragment_for_mdx(raw_p_content, logger, html_filename)
                normalized_p_text = normalize_text(processed_p_text)
                if normalized_p_text: mdx_parts.append(normalized_p_text)
                if mdx_parts and mdx_parts[-1].strip(): mdx_parts.append("")
                processed_element_in_section = True
            elif element.has_attr('class') and 'guid' in element.get('class', []):
                p_tag_guid = element.find('p');
                content_source_guid = p_tag_guid if p_tag_guid else element
                raw_html_guid = get_decode_contents_or_empty(content_source_guid) if content_source_guid else ""
                if p_tag_guid and content_source_guid == p_tag_guid:
                    raw_html_guid = p_tag_guid.decode_contents() if p_tag_guid else ""
                else:
                    raw_html_guid = element.decode_contents() if element else ""
                processed_guid_content = process_html_fragment_for_mdx(raw_html_guid, logger, html_filename)
                normalized_content = normalize_text(processed_guid_content)
                mdx_parts.append(f'<div className="guid">{normalized_content}</div>');
                if mdx_parts[-1].strip(): mdx_parts.append("")
                processed_element_in_section = True
            elif element.has_attr('class') and 'seeAlsoAdd' in element.get('class', []):
                p_tag_seealsoadd = element.find('p')
                if p_tag_seealsoadd:
                    raw_seealsoadd_content = p_tag_seealsoadd.decode_contents() if p_tag_seealsoadd else ""
                    processed_seealsoadd_content = process_html_fragment_for_mdx(raw_seealsoadd_content, logger,
                                                                                 html_filename,
                                                                                 is_for_seealso_context=True)
                    final_text = normalize_text(processed_seealsoadd_content)
                    if final_text: mdx_parts.append(f"<SeeAlso>{final_text}</SeeAlso>")
                else:
                    unrecognized_elements_log.append(
                        f"{html_filename}: Warning: div.seeAlsoAdd '{str(element)[:50]}' found without a <p> tag.")
                if mdx_parts and mdx_parts[-1].strip(): mdx_parts.append("")
                processed_element_in_section = True
            elif element.has_attr('class') and 'seeAlso' in element.get('class',
                                                                        []) and 'seeAlsoAdd' not in element.get('class',
                                                                                                                []):
                all_see_also_p_tags = element.find_all('p')
                if all_see_also_p_tags:
                    if mdx_parts and mdx_parts[-1].strip() != "": mdx_parts.append("")
                    for idx_sa, p_sa in enumerate(all_see_also_p_tags):
                        raw_sa_content = p_sa.decode_contents() if p_sa else ""
                        processed_sa_content = process_html_fragment_for_mdx(raw_sa_content, logger, html_filename,
                                                                             is_for_seealso_context=True)
                        final_text = normalize_text(processed_sa_content)
                        if final_text: mdx_parts.append(f"<SeeAlso>{final_text}</SeeAlso>")
                        if idx_sa < len(all_see_also_p_tags) - 1 and final_text and mdx_parts and mdx_parts[
                            -1].strip() != "": mdx_parts.append("")
                    if mdx_parts and mdx_parts[-1].strip() != "": mdx_parts.append("")
                else:
                    unrecognized_elements_log.append(
                        f"{html_filename}: Warning: div.seeAlso '{str(element)[:50]}' found without any <p> tags.")
                processed_element_in_section = True
            elif element.name == 'hr':
                mdx_parts.append("---"); mdx_parts.append(""); processed_element_in_section = True
            elif element.has_attr('class') and 'stip' in element.get('class', []):  # div.stip
                mdx_stip_lines = [];
                if element.find('div', class_='mandatory'): mdx_stip_lines.append(
                    "<Mandatory />"); mdx_stip_lines.append("")
                last_block_type_in_stip = None;
                stip_children_tags = [child for child in element.children if isinstance(child, (NavigableString, Tag))]
                for idx_stip_child, stip_child in enumerate(stip_children_tags):
                    current_block_type_in_stip = None;
                    if mdx_stip_lines and mdx_stip_lines[-1].strip() != "":
                        is_new_block_type = False;
                        if isinstance(stip_child, Tag):
                            if stip_child.name == 'p' and last_block_type_in_stip not in [None, 'p']:
                                is_new_block_type = True
                            elif stip_child.name in ['ol', 'ul'] and last_block_type_in_stip != 'list':
                                is_new_block_type = True
                            elif stip_child.has_attr('class') and 'xampleBlockStip' in stip_child.get('class', []):
                                is_new_block_type = True
                            elif stip_child.has_attr('class') and 'seeAlso' in stip_child.get('class', []):
                                is_new_block_type = True
                        elif isinstance(stip_child,
                                        NavigableString) and stip_child.strip() and last_block_type_in_stip not in [
                            None, 'p']:
                            is_new_block_type = True
                        if is_new_block_type: mdx_stip_lines.append("")
                    processed_stip_child_flag = False
                    if isinstance(stip_child, NavigableString):
                        text = normalize_text(str(stip_child))  # Process it
                        if text:  # Check if there's any text left after normalization
                            mdx_stip_lines.append(text)
                            current_block_type_in_stip = 'p'  # Assuming any significant floating text starts a paragraph block
                            processed_stip_child_flag = True
                    elif isinstance(stip_child, Tag):
                if stip_child.name == 'p':
                    current_block_type_in_stip = 'p'; raw_p_html_content = stip_child.decode_contents() if stip_child else ""; processed_p_content = process_html_fragment_for_mdx(
                        raw_p_html_content, logger, html_filename); mdx_stip_lines.append(
                        normalize_text(processed_p_content)); processed_stip_child_flag = True
                elif stip_child.name in ['ol', 'ul']:
                    current_block_type_in_stip = 'list';
                for i, li in enumerate(stip_child.find_all('li', recursive=False),
                                       1): prefix = f"  {i}." if stip_child.name == 'ol' else "  -"; mdx_stip_lines.append(
                    f"{prefix} {normalize_text(get_text_or_empty(li))}"); processed_stip_child_flag = True
            elif stip_child.has_attr('class') and 'seeAlso' in stip_child.get('class',
                                                                              []) and 'seeAlsoAdd' not in stip_child.get(
                    'class', []):  # FIX: div.seeAlso in stip
                current_block_type_in_stip = 'seeAlso_in_stip'
                all_see_also_p_tags_stip = stip_child.find_all('p')
                if all_see_also_p_tags_stip:
                    for idx_sa_stip, p_sa_stip in enumerate(all_see_also_p_tags_stip):
                        raw_sa_stip_content = p_sa_stip.decode_contents() if p_sa_stip else ""
                        processed_sa_stip_content = process_html_fragment_for_mdx(raw_sa_stip_content, logger,
                                                                                  html_filename,
                                                                                  is_for_seealso_context=True)
                        mdx_stip_lines.append(f"<SeeAlso>{normalize_text(processed_sa_stip_content)}</SeeAlso>")
                        if idx_sa_stip < len(all_see_also_p_tags_stip) - 1 and mdx_stip_lines[
                            -1].strip() != "": mdx_stip_lines.append("")
                else:
                    unrecognized_elements_log.append(
                        f"{html_filename}: Warning: div.seeAlso in stip '{str(stip_child)[:50]}' found no <p> tags.")
                processed_stip_child_flag = True
            elif stip_child.has_attr('class') and 'xampleBlockStip' in stip_child.get('class', []):  # <details>
                current_block_type_in_stip = 'details';
                mdx_stip_lines.append("<details>");
                mdx_stip_lines.append("  <summary>Examples</summary>");
                mdx_stip_lines.append("  ")
                examples_div = stip_child.find('div', class_='xamples')
                if examples_div:
                    details_content_lines = [];
                    example_elements = [node for node in examples_div.children if isinstance(node, Tag)];
                    table_header_needed = True
                    for element_node_idx, element_node in enumerate(example_elements):
                        is_direct_content_row_block = element_node.name == 'div' and 'row' in element_node.get('class',
                                                                                                               []) and 'px-2' in element_node.get(
                            'class', [])
                        if element_node.name == 'hr': details_content_lines.append(
                            "    <hr />"); table_header_needed = True
                        if element_node_idx < len(example_elements) - 1 and example_elements[
                            element_node_idx + 1].name != 'hr': details_content_lines.append("    ")
                    elif element_node.name == 'div':
                    rows_to_process_this_pass = [element_node] if is_direct_content_row_block else \
                        [r for r in element_node.find_all('div', class_='row', recursive=True) if
                         r.find_parent('div', class_='xamples') == examples_div]
                    if not rows_to_process_this_pass: continue
                    if any(r.find(class_='xampleLabel') for r in rows_to_process_this_pass) and table_header_needed:
                        if details_content_lines and details_content_lines[-1].strip() != "" and not \
                        details_content_lines[-1].strip().endswith(
                            "|:---------|:------|"): details_content_lines.append("    ")
                        details_content_lines.append("    | Property | Value |");
                        details_content_lines.append("    |:---------|:------|");
                        table_header_needed = False
                    for ex_part_row in rows_to_process_this_pass:
                        is_comment_row = bool(ex_part_row.find(class_='editComment'))
                        is_full_example_comment = False
                        if is_comment_row:
                            comment_text_check = ex_part_row.find(class_='editComment').get_text(strip=True)
                            if "[Full example:" in comment_text_check: is_full_example_comment = True

                        if is_comment_row and is_full_example_comment and details_content_lines and \
                                details_content_lines[-1].strip().endswith("|"):
                            details_content_lines.append(
                                "    ")  # Add blank line before Full Example comment if after table

                        new_lines, table_header_needed, unrec_ex = process_example_content_row(ex_part_row,
                                                                                               table_header_needed,
                                                                                               logger, html_filename)
                        if unrec_ex: unrecognized_elements_log.append(
                            f"{html_filename}: Warning: Unrecognized structure in example row.")
                        details_content_lines.extend(new_lines)
                    if details_content_lines and details_content_lines[-1].strip() != "":
                        if element_node_idx < len(example_elements) - 1 and example_elements[
                            element_node_idx + 1].name != 'hr':
                            details_content_lines.append("    ")
                        elif element_node_idx == len(example_elements) - 1:
                            details_content_lines.append("    ")
                else:
                    unrecognized_elements_log.append(
                        f"{html_filename}: Warning: Unrecognized tag '{element_node.name}' directly inside div.xamples: {str(element_node)[:100]}")
            mdx_stip_lines.extend(details_content_lines)
        mdx_stip_lines.append("</details>");
        processed_stip_child_flag = True
    elif stip_child.name == 'div' and 'd-flex' in stip_child.get('class', []) and 'flexrow' in stip_child.get('class',
                                                                                                              []):
    if stip_child.find('div', class_='mandatory'): processed_stip_child_flag = True


if not processed_stip_child_flag: unrecognized_elements_log.append(
    f"{html_filename}: Warning: Unrecognized tag '{stip_child.name}' inside div.stip: {str(stip_child)[:100]}")
if current_block_type_in_stip: last_block_type_in_stip = current_block_type_in_stip
if idx_stip_child < len(stip_children_tags) - 1 and current_block_type_in_stip:
    if mdx_stip_lines and mdx_stip_lines[-1].strip() != "": mdx_stip_lines.append("")
clean_stip_lines = [];
if mdx_stip_lines:  # ... (stip body assembly) ...
    first_line_idx = 0
    while first_line_idx < len(mdx_stip_lines) and mdx_stip_lines[first_line_idx].strip() == "": first_line_idx += 1
    if first_line_idx < len(mdx_stip_lines): clean_stip_lines.append(mdx_stip_lines[first_line_idx])
    for i_line in range(first_line_idx + 1, len(mdx_stip_lines)):
        if not (mdx_stip_lines[i_line].strip() == "" and clean_stip_lines and clean_stip_lines[-1].strip() == ""):
            clean_stip_lines.append(mdx_stip_lines[i_line])
        elif mdx_stip_lines[i_line].strip() == "" and clean_stip_lines and clean_stip_lines[-1].strip() != "":
            clean_stip_lines.append(mdx_stip_lines[i_line])
stip_body_parts = []
for line_idx, line_content in enumerate(clean_stip_lines):
    if line_content.startswith("  ") or line_content.startswith("<details>") or line_content.startswith(
        "</details>") or line_content.startswith("<Mandatory />") or line_content.strip().startswith(
        "|") or line_content.strip().startswith("*") or line_content.startswith("<SeeAlso"):
        stip_body_parts.append(line_content)
    elif line_content == "":
        stip_body_parts.append("")
    else:
        stip_body_parts.append(line_content)
stip_body = "\n  ".join(stip_body_parts).rstrip()
mdx_parts.append(f'<div className="stip">\n  {stip_body}\n</div>');
if not (content_block_node_idx == len(content_nodes_to_iterate) - 1 and element_idx == len(
    elements_to_process_this_block) - 1) and mdx_parts[-1].strip() != "": mdx_parts.append("")
processed_element_in_section = True
if not processed_element_in_section and isinstance(element, Tag) and element.name not in ['script', 'style', 'meta',
                                                                                          'link', 'title', 'h3']:
    unrecognized_elements_log.append(
        f"{html_filename}: Warning: Unrecognized element type '{element.name}' in main content: {str(element)[:100]}")

for log_msg in set(unrecognized_elements_log): logger.warning(f"{log_msg}")
final_mdx_output_lines = []
if mdx_parts:  # ... (final output filter) ...
    if mdx_parts[0].strip() != "" or (len(mdx_parts) > 1 and mdx_parts[1].strip() != ""): final_mdx_output_lines.append(
        mdx_parts[0])
    for i in range(1, len(mdx_parts)):
        if mdx_parts[i].strip() != "" or (
                mdx_parts[i].strip() == "" and final_mdx_output_lines and final_mdx_output_lines[
            -1].strip() != ""): final_mdx_output_lines.append(mdx_parts[i])
# Remove multiple trailing blank lines, but keep one if content ends with an intentional blank
while len(final_mdx_output_lines) > 1 and final_mdx_output_lines[-1].strip() == "" and final_mdx_output_lines[
    -2].strip() == "": final_mdx_output_lines.pop()
if not final_mdx_output_lines or (len(final_mdx_output_lines) == 1 and final_mdx_output_lines[
    0].strip() == ""): return ""  # Return empty string for empty/whitespace-only output
return "\n".join(final_mdx_output_lines) + "\n"


# --- Main Execution Logic ---
def main():
    parser = argparse.ArgumentParser(description="Convert HTML files from ISBDM structure to Docusaurus MDX.")
    parser.add_argument("source_dir", help="Source directory containing HTML files.")
    parser.add_argument("dest_dir", help="Destination directory for converted MDX files.")
    parser.add_argument("--log_file", default="conversion_log.txt", help="File to store conversion logs.")
    parser.add_argument("--recursive", action="store_true", help="Process HTML files in subdirectories recursively.")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s",
                        handlers=[logging.FileHandler(args.log_file, mode='w', encoding='utf-8'),
                                  logging.StreamHandler()])
    logger = logging.getLogger(__name__)
    logger.info(f"Starting conversion from '{os.path.abspath(args.source_dir)}' to '{os.path.abspath(args.dest_dir)}'");
    logger.info(f"Logging to: {os.path.abspath(args.log_file)}")
    os.makedirs(args.dest_dir, exist_ok=True)
    files_processed_count = 0;
    conversion_errors = 0
    items_to_scan = []
    abs_source_dir_for_main = os.path.abspath(args.source_dir)

    if args.recursive:
        for root, _, files in os.walk(abs_source_dir_for_main):
            for filename in files:
                if filename.lower().endswith(".html"): items_to_scan.append(os.path.join(root, filename))
    else:
        for filename in os.listdir(abs_source_dir_for_main):
            if filename.lower().endswith(".html"):
                html_file_path = os.path.join(abs_source_dir_for_main, filename)
                if os.path.isfile(html_file_path): items_to_scan.append(html_file_path)

    for html_file_path in items_to_scan:
        try:
            logger.info(f"Processing: {html_file_path}")
            abs_html_file_dir = os.path.abspath(os.path.dirname(html_file_path))
            html_subdirectory = ""
            # Ensure relpath is calculated from the true root of the docs content passed in source_dir
            if abs_html_file_dir.startswith(abs_source_dir_for_main) and abs_html_file_dir != abs_source_dir_for_main:
                html_subdirectory = os.path.relpath(abs_html_file_dir, abs_source_dir_for_main)
                if html_subdirectory == '.': html_subdirectory = ""
                html_subdirectory = html_subdirectory.replace(os.sep, '/')

            relative_path_for_output = os.path.relpath(html_file_path, abs_source_dir_for_main)
            mdx_filename_part = os.path.splitext(relative_path_for_output)[0] + ".mdx"
            mdx_file_path = os.path.join(args.dest_dir, mdx_filename_part)
            mdx_file_dir = os.path.dirname(mdx_file_path)
            if not os.path.exists(mdx_file_dir): os.makedirs(mdx_file_dir, exist_ok=True)
            with open(html_file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            mdx_output = convert_html_to_mdx(html_content, os.path.basename(html_file_path), logger, html_subdirectory)
            with open(mdx_file_path, 'w', encoding='utf-8') as f:
                f.write(mdx_output)
            logger.info(f"Successfully converted: {html_file_path} -> {mdx_file_path}")
            files_processed_count += 1
        except Exception as e:
            logger.error(f"Failed to convert {html_file_path}: {e}", exc_info=True)
            conversion_errors += 1

    logger.info(f"Conversion process finished. {files_processed_count} file(s) processed.")
    if conversion_errors > 0: logger.warning(f"{conversion_errors} file(s) encountered errors during conversion.")


if __name__ == '__main__':
    main()