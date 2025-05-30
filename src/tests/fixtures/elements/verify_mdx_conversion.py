import os
import re
from bs4 import BeautifulSoup
import difflib # For showing differences

def normalize_text_flattened(text):
    """
    Converts text to lowercase and removes ALL whitespace.
    """
    if text is None:
        return ""
    text = text.lower()
    text = re.sub(r'\s+', '', text) # Remove all whitespace characters
    return text

def get_text_from_div(html_file_path, div_identifier_type, div_identifier_value):
    """
    Parses an HTML file and extracts flattened, normalized text from a specified div.
    """
    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'lxml') # or 'html.parser'

        target_div = None
        if div_identifier_type == 'id':
            target_div = soup.find('div', id=div_identifier_value)
        elif div_identifier_type == 'class':
            # Finds the first div with this class. If multiple, adjust as needed.
            target_div = soup.find('div', class_=div_identifier_value)
        elif div_identifier_type == 'selector':
            target_div = soup.select_one(div_identifier_value)
        else:
            print(f"Error: Invalid div_identifier_type '{div_identifier_type}' in {html_file_path}")
            return None

        if target_div:
            # Get text, then normalize by flattening
            return normalize_text_flattened(target_div.get_text())
        else:
            print(f"Warning: Div '{div_identifier_value}' not found in {html_file_path}")
            return "" # Return empty string if div not found, to allow comparison
    except FileNotFoundError:
        print(f"Error: HTML file not found at {html_file_path}")
        return None
    except Exception as e:
        print(f"Error processing HTML file {html_file_path}: {e}")
        return None

def get_text_from_mdx(mdx_file_path):
    """
    Reads and returns flattened, normalized text content from an MDX file.
    """
    try:
        with open(mdx_file_path, 'r', encoding='utf-8') as f:
            # For MDX, we might want to be careful about frontmatter or JSX elements
            # if they shouldn't be part of the textual comparison.
            # A simple approach is to read all and normalize.
            # If MDX has non-content elements that HTML doesn't, this might need refinement.
            # For now, assume all text in MDX (after stripping JSX/frontmatter if any) is relevant.
            # This naive version reads everything.
            content = f.read()

            # Basic attempt to strip common frontmatter (--- ... ---)
            if content.startswith("---"):
                end_frontmatter = content.find("---", 3)
                if end_frontmatter != -1:
                    content = content[end_frontmatter + 3:]

            # Basic attempt to strip JSX tags (this is very naive and might break valid text)
            # A more robust solution would involve a proper MDX parser or more sophisticated regex.
            # For example, <Component>text</Component> -> text
            # content = re.sub(r'<[^>]+>', '', content) # This is too aggressive as it removes HTML-like text

            return normalize_text_flattened(content)
    except FileNotFoundError:
        # This will be handled by the main loop, but good to have a local print for debugging
        # print(f"Error: MDX file not found at {mdx_file_path}")
        return None
    except Exception as e:
        print(f"Error reading MDX file {mdx_file_path}: {e}")
        return None

def compare_and_report(html_text_normalized, mdx_text_normalized, html_filename, mdx_filename):
    """
    Compares the normalized HTML div text with normalized MDX text.
    Reports if the MDX is missing any characters from the HTML.
    """
    if html_text_normalized is None or mdx_text_normalized is None:
        # Errors would have been printed by the functions fetching the text
        return

    # The core requirement: "The mdx shouldn't be missing any characters present in the html."
    # This means if we iterate through characters of html_text_normalized,
    # they should effectively be found in mdx_text_normalized in the same order.
    # If both are identical after normalization, then MDX is not missing anything.
    # If MDX has *extra* characters, that's "ok" by the stated rule,
    # but if the goal is a faithful conversion, they should be identical.

    # Let's assume "shouldn't be missing any characters" implies that after normalization,
    # the MDX content should be EQUAL to the HTML content. If MDX can have additional
    # characters (e.g. MDX specific syntax not rendered as text), then a simple
    # string equality after normalization is the most direct test.

    if html_text_normalized == mdx_text_normalized:
        print(f"OK: Content matches for {html_filename} and {mdx_filename}")
    else:
        print(f"\n--- MISMATCH detected between {html_filename} and {mdx_filename} ---")
        print("The normalized MDX content is NOT identical to the normalized HTML div content.")
        print("This means either MDX is missing content from HTML, or has extra/different content.")

        # Using difflib to show differences
        # This can be verbose for very long strings, so we might show snippets or a summary.
        # `ndiff` produces a line-by-line delta. Since we flattened, it's char-by-char.
        # For long strings, this might be too much. Consider context_diff or unified_diff.

        # To make diff more readable for long flattened strings, we can split them into chunks
        # or compare segments. For now, let's show a snippet of where they first differ.

        # Find first differing character
        len_html = len(html_text_normalized)
        len_mdx = len(mdx_text_normalized)
        min_len = min(len_html, len_mdx)
        diff_index = -1
        for i in range(min_len):
            if html_text_normalized[i] != mdx_text_normalized[i]:
                diff_index = i
                break

        if diff_index == -1 and len_html != len_mdx:
            # One is a prefix of the other
            diff_index = min_len
            print(f"One text is a prefix of the other. Different lengths: HTML={len_html}, MDX={len_mdx}")

        if diff_index != -1:
            context = 20  # Number of characters around the difference
            start = max(0, diff_index - context)
            end_html = min(len_html, diff_index + context)
            end_mdx = min(len_mdx, diff_index + context)

            print(f"First difference around character {diff_index}:")
            print(f"  HTML: ...{html_text_normalized[start:diff_index]}[{html_text_normalized[diff_index:end_html]}]...")
            print(f"  MDX:  ...{mdx_text_normalized[start:diff_index]}[{mdx_text_normalized[diff_index:end_mdx]}]...")

        # For a more detailed diff:
        # d = difflib.Differ()
        # diff = list(d.compare(html_text_normalized.splitlines(), mdx_text_normalized.splitlines())) # splitlines won't work well for flattened
        # For character by character (can be very long output):
        # diff = list(difflib.ndiff(html_text_normalized, mdx_text_normalized))
        # print("\nDetailed Character Diff (lines starting with '-' are from HTML only, '+' from MDX only, ' ' are common):")
        # for line in diff:
        #     if line.startswith('- ') or line.startswith('+ '): # Only show actual differences
        #         print(line)
        #     elif not line.startswith('? ') and not line.startswith('  '): # Handle other diff outputs if necessary
        #          # This part might need adjustment depending on what difflib.ndiff actually outputs for changes
        #          print(line) # if there's a change within a 'common' part it uses '?'

        # A simple check if HTML content is "in" MDX (less strict)
        # if html_text_normalized not in mdx_text_normalized:
        # print("  Specifically, some content from the HTML div seems to be entirely missing in the MDX.")
        # else:
        # print("  MDX content contains HTML content, but they are not identical (could be extra chars in MDX or different chars).")


def main():
    html_directory = input("Enter the path to the directory containing HTML files: ").strip()
    mdx_directory = input("Enter the path to the directory containing corresponding MDX files: ").strip()
    div_identifier_type = input("Enter HTML div identifier type ('id', 'class', or 'selector'): ").lower().strip()
    div_identifier_value = input(f"Enter the HTML div {div_identifier_type} value: ").strip()

    if not os.path.isdir(html_directory):
        print(f"Error: HTML directory not found at {html_directory}")
        return
    if not os.path.isdir(mdx_directory):
        print(f"Error: MDX directory not found at {mdx_directory}")
        return

    found_html_files = 0
    processed_pairs = 0
    mismatched_files = 0

    for html_filename_full in os.listdir(html_directory):
        if html_filename_full.lower().endswith(('.html', '.htm')):
            found_html_files += 1
            base_filename, _ = os.path.splitext(html_filename_full)
            mdx_filename_full = base_filename + ".mdx"
            html_file_path = os.path.join(html_directory, html_filename_full)
            mdx_file_path = os.path.join(mdx_directory, mdx_filename_full)

            print(f"\nProcessing HTML: {html_file_path}")
            if not os.path.exists(mdx_file_path):
                print(f"Warning: Corresponding MDX file not found: {mdx_file_path}")
                continue

            print(f"Found MDX:     {mdx_file_path}")
            processed_pairs +=1

            html_div_text_normalized = get_text_from_div(html_file_path, div_identifier_type, div_identifier_value)
            mdx_content_normalized = get_text_from_mdx(mdx_file_path)

            if html_div_text_normalized is None:
                print(f"Skipping comparison for {html_filename_full} due to error reading/parsing HTML.")
                continue
            if mdx_content_normalized is None:
                print(f"Skipping comparison for {html_filename_full} due to error reading/parsing MDX.")
                continue

            # print(f"Norm HTML (len {len(html_div_text_normalized)}): '{html_div_text_normalized[:100]}...'")
            # print(f"Norm MDX  (len {len(mdx_content_normalized)}): '{mdx_content_normalized[:100]}...'")


            if html_div_text_normalized != mdx_content_normalized:
                mismatched_files +=1
            compare_and_report(html_div_text_normalized, mdx_content_normalized, html_filename_full, mdx_filename_full)


    print("\n--- Summary ---")
    print(f"Found {found_html_files} HTML files in '{html_directory}'.")
    print(f"Processed {processed_pairs} HTML/MDX file pairs.")
    print(f"{mismatched_files} pairs had content mismatches after normalization.")
    if found_html_files > processed_pairs:
        print(f"{found_html_files - processed_pairs} HTML files did not have a corresponding MDX file in '{mdx_directory}'.")


if __name__ == "__main__":
    main()