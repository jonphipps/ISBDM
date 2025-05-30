const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * Converts an HTML element page to MDX format
 * @param {string} htmlFilePath - Path to the source HTML file
 * @param {string} outputPath - Path to write the MDX output
 */
function convertElementToMdx(htmlFilePath, outputPath) {
    console.log("Starting conversion of:", htmlFilePath);

    // Read source HTML
    const html = fs.readFileSync(htmlFilePath, 'utf8');
    const dom = new JSDOM(html);
    const { document } = dom.window;

    // Extract element ID from filename
    const elementId = path.basename(htmlFilePath, '.html');
    console.log("Element ID:", elementId);

    // Extract main content
    const mainContent = document.querySelector('.col-md-7.border.rounded');
    if (!mainContent) {
        console.error('Could not find main content element');
        return;
    }

    // Extract element title
    const elementTitle = mainContent.querySelector('h3').textContent.trim();
    console.log("Element title:", elementTitle);

    // Extract element reference data
    const elementRefDiv = mainContent.querySelector('h4:nth-of-type(1) + div.px-4');
    if (!elementRefDiv) {
        console.error('Could not find element reference div');
        return;
    }

    // Extract all rows from the element reference section
    const refRows = elementRefDiv.querySelectorAll('.row');
    let definition = '';
    let scopeNote = '';
    let domain = '';
    let range = '';
    let elementSubType = [];
    let elementSuperType = [];

    refRows.forEach(row => {
        const labelEl = row.querySelector('.elref');
        const valueEl = row.querySelector('.eltext');

        if (!labelEl || !valueEl) return;

        const label = labelEl.textContent.trim();

        switch (label) {
            case 'Definition':
                definition = valueEl.textContent.trim();
                break;
            case 'Scope note':
                scopeNote = valueEl.textContent.trim();
                break;
            case 'Domain':
                domain = valueEl.textContent.trim();
                break;
            case 'Range':
                range = valueEl.textContent.trim();
                break;
            case 'Element sub-type':
                const subTypeLinks = valueEl.querySelectorAll('.linkMenuElement');
                subTypeLinks.forEach(link => {
                    const url = link.getAttribute('href').replace('/ISBDM/docs', '/docs').replace('.html', '');
                    const uri = "http://iflastandards.info/ns/isbd/isbdm/elements/" + path.basename(url);
                    elementSubType.push({
                        uri,
                        url,
                        label: link.textContent.trim()
                    });
                });
                break;
            case 'Element super-type':
                const superTypeLinks = valueEl.querySelectorAll('.linkMenuElement');
                superTypeLinks.forEach(link => {
                    if (link) {
                        const url = link.getAttribute('href').replace('/ISBDM/docs', '/docs').replace('.html', '');
                        const uri = "http://iflastandards.info/ns/isbd/isbdm/elements/" + path.basename(url);
                        elementSuperType.push({
                            uri,
                            url,
                            label: link.textContent.trim()
                        });
                    }
                });
                break;
        }
    });

    // Determine sidebar position and level from the navigation
    const navSection = document.querySelector('.navISBDMSection');
    let sidebarPosition = 1;
    let sidebarLevel = 2;

    if (navSection) {
        const links = Array.from(navSection.querySelectorAll('.linkMenuElement, .linkMenuEntry'));
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            if (link.getAttribute('href')?.includes(elementId)) {
                sidebarPosition = i + 1;

                // Count arrow-return-right icons before this link
                const parentNode = link.parentNode;
                const arrowIcons = parentNode.querySelectorAll('.bi-arrow-return-right');
                sidebarLevel = arrowIcons.length + 1;
                break;
            }
        }
    }

    // Create aliases
    const aliases = [
        `/elements/P${elementId}`,
        `/statements/${convertToKebabCase(elementTitle)}`
    ];

    // Create front matter YAML
    let mdxContent = '---\n';
    mdxContent += `id: "${elementId}"\n`;
    mdxContent += `slug: /docs/statements/${elementId}\n`;
    mdxContent += `aliases:\n`;
    mdxContent += `  - /elements/P${elementId}\n`;
    mdxContent += `  - /statements/${convertToKebabCase(elementTitle)}\n`;
    mdxContent += `sidebar_label: ${elementTitle}\n`;
    mdxContent += `sidebar_position: ${sidebarPosition}\n`;
    mdxContent += `sidebar_level: ${sidebarLevel}\n`;
    mdxContent += `RDF:\n`;
    mdxContent += `  label: "${elementTitle}"\n`;
    mdxContent += `  definition: "${escapeYamlString(definition)}"\n`;
    mdxContent += `  scopeNote: "${escapeYamlString(scopeNote)}"\n`;
    mdxContent += `  domain: "${domain}"\n`;
    mdxContent += `  range: "${range}"\n`;

    if (elementSubType.length > 0) {
        mdxContent += `  elementSubType:\n`;
        elementSubType.forEach(subType => {
            mdxContent += `    - uri: "${subType.uri}"\n`;
            mdxContent += `      url: "${subType.url}"\n`;
            mdxContent += `      label: "${escapeYamlString(subType.label)}"\n`;
        });
    } else {
        mdxContent += `  elementSubType: []\n`;
    }

    if (elementSuperType.length > 0) {
        mdxContent += `  elementSuperType:\n`;
        elementSuperType.forEach(superType => {
            mdxContent += `    - uri: "${superType.uri}"\n`;
            mdxContent += `      url: "${superType.url}"\n`;
            mdxContent += `      label: "${escapeYamlString(superType.label)}"\n`;
        });
    } else {
        mdxContent += `  elementSuperType: []\n`;
    }

    mdxContent += `  uri: "http://iflastandards.info/ns/isbd/isbdm/elements/${elementId}"\n`;
    mdxContent += `  type: "${determinePropertyType(range)}"\n`;
    mdxContent += `---\n\n`;

    // Basic heading and ElementReference
    mdxContent += `# ${elementTitle}\n\n`;
    mdxContent += `## Element Reference\n\n`;
    mdxContent += `<ElementReference frontMatter={frontMatter} />\n\n`;

    // Process each h4 section after the element reference div
    const h4Elements = mainContent.querySelectorAll('h4');

    for (let i = 1; i < h4Elements.length; i++) {
        const h4 = h4Elements[i];
        const sectionTitle = h4.textContent.trim();
        mdxContent += `## ${sectionTitle}\n\n`;

        // Get all content nodes between this h4 and the next h4 (or end)
        let currentNode = h4.nextElementSibling;
        const nextH4 = h4Elements[i + 1];

        while (currentNode && (!nextH4 || currentNode !== nextH4)) {
            if (currentNode.classList.contains('guid')) {
                mdxContent += `<div className="guid">${processHtmlContent(currentNode)}</div>\n\n`;
            } else if (currentNode.classList.contains('seeAlsoAdd') || currentNode.classList.contains('seeAlso')) {
                const seeAlsoLink = currentNode.querySelector('a');
                if (seeAlsoLink) {
                    const href = seeAlsoLink.getAttribute('href')
                        .replace('/ISBDM/docs', '/docs')
                        .replace('.html', '');
                    const text = seeAlsoLink.textContent.trim();
                    mdxContent += `<SeeAlso>[${text}](${href})</SeeAlso>\n\n`;
                }
            } else if (currentNode.classList.contains('stip')) {
                mdxContent += `<div className="stip">\n${processStipulation(currentNode)}\n</div>\n\n`;
            }

            currentNode = currentNode.nextElementSibling;
        }
    }

    // Write output
    fs.writeFileSync(outputPath, mdxContent);
    console.log(`Successfully converted ${htmlFilePath} to ${outputPath}`);
}

/**
 * Processes HTML content to MDX format
 */
function processHtmlContent(node) {
    if (!node) return '';

    // Get all paragraphs
    const paragraphs = node.querySelectorAll('p');
    let content = '';

    if (paragraphs.length > 0) {
        // Process each paragraph
        paragraphs.forEach(p => {
            let paragraphContent = p.innerHTML;

            // Convert internal links
            paragraphContent = paragraphContent.replace(/<a\s+class="linkInline"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
                const mdxUrl = url.replace('/ISBDM/docs', '/docs').replace('.html', '');
                return `<InLink to="${mdxUrl}">${text}</InLink>`;
            });

            // Convert external links
            paragraphContent = paragraphContent.replace(/<a\s+class="linkOutline"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
                return `<OutLink href="${url}">${text}</OutLink>`;
            });

            // Convert bolded text
            paragraphContent = paragraphContent.replace(/<span\s+class="bolded">([^<]+)<\/span>/g, '**$1**');

            content += paragraphContent;
        });
    } else {
        // Process direct HTML content
        content = node.innerHTML;

        // Convert internal links
        content = content.replace(/<a\s+class="linkInline"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
            const mdxUrl = url.replace('/ISBDM/docs', '/docs').replace('.html', '');
            return `<InLink to="${mdxUrl}">${text}</InLink>`;
        });

        // Convert external links
        content = content.replace(/<a\s+class="linkOutline"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
            return `<OutLink href="${url}">${text}</OutLink>`;
        });

        // Convert bolded text
        content = content.replace(/<span\s+class="bolded">([^<]+)<\/span>/g, '**$1**');

        // Remove paragraph tags
        content = content.replace(/<\/?p>/g, '');
    }

    return content;
}

/**
 * Process a stipulation div
 */
function processStipulation(stipNode) {
    if (!stipNode) return '';

    let content = '';

    // Check for mandatory indicator
    const mandatoryIndicator = stipNode.querySelector('.mandatory');
    if (mandatoryIndicator) {
        content += '  <Mandatory />\n  \n';
    }

    // Process paragraphs (excluding those with mandatory indicators)
    const paragraphs = Array.from(stipNode.querySelectorAll('p')).filter(p => !p.querySelector('.mandatory'));
    paragraphs.forEach(p => {
        // Process paragraph content
        let paragraphContent = p.innerHTML;

        // Convert internal links
        paragraphContent = paragraphContent.replace(/<a\s+class="linkInline"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
            const mdxUrl = url.replace('/ISBDM/docs', '/docs').replace('.html', '');
            return `<InLink to="${mdxUrl}">${text}</InLink>`;
        });

        // Convert bolded text
        paragraphContent = paragraphContent.replace(/<span\s+class="bolded">([^<]+)<\/span>/g, '**$1**');

        content += `  ${paragraphContent}\n  \n`;
    });

    // Process ordered lists
    const orderedLists = stipNode.querySelectorAll('ol.num');
    orderedLists.forEach(ol => {
        const items = ol.querySelectorAll('li');
        items.forEach((item, index) => {
            let itemContent = item.innerHTML;

            // Convert links in list items
            itemContent = itemContent.replace(/<a\s+class="linkInline"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
                const mdxUrl = url.replace('/ISBDM/docs', '/docs').replace('.html', '');
                return `<InLink to="${mdxUrl}">${text}</InLink>`;
            });

            content += `  ${index + 1}. ${itemContent}\n`;
        });
        content += '  \n';
    });

    // Process unordered lists
    const unorderedLists = stipNode.querySelectorAll('ul.bull');
    unorderedLists.forEach(ul => {
        const items = ul.querySelectorAll('li');
        items.forEach(item => {
            let itemContent = item.innerHTML;

            // Convert links in list items
            itemContent = itemContent.replace(/<a\s+class="linkInline"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
                const mdxUrl = url.replace('/ISBDM/docs', '/docs').replace('.html', '');
                return `<InLink to="${mdxUrl}">${text}</InLink>`;
            });

            content += `  - ${itemContent}\n`;
        });
        content += '  \n';
    });

    // Process examples
    const exampleBlock = stipNode.querySelector('.xampleBlockStip');
    if (exampleBlock) {
        content += '  <details>\n    <summary>Examples</summary>\n    \n';

        const collapseDiv = exampleBlock.querySelector('.collapse.xamples');
        if (collapseDiv) {
            const exampleGroups = [];
            let currentGroup = { rows: [], comment: '' };

            // Process each direct child that's a div or hr
            Array.from(collapseDiv.children).forEach(child => {
                if (child.tagName === 'HR') {
                    // End of a group
                    if (currentGroup.rows.length > 0 || currentGroup.comment) {
                        exampleGroups.push({...currentGroup});
                        currentGroup = { rows: [], comment: '' };
                    }
                } else if (child.tagName === 'DIV') {
                    // Process rows within this div
                    const rowElements = child.querySelectorAll('.row');
                    rowElements.forEach(row => {
                        const labelCol = row.querySelector('.xampleLabel');
                        const valueCol = row.querySelector('.xampleValue');
                        const commentCol = row.querySelector('.editComment');

                        if (labelCol && valueCol) {
                            currentGroup.rows.push({
                                property: labelCol.textContent.trim(),
                                value: valueCol.textContent.trim()
                            });
                        } else if (commentCol) {
                            // Process comment - extract links and text
                            let commentHtml = commentCol.innerHTML;

                            // Convert links to MDX format
                            commentHtml = commentHtml.replace(/<a\s+class="linkInline"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
                                const mdxUrl = url.replace('/ISBDM/docs', '/docs').replace('.html', '');
                                return `[${text}](${mdxUrl})`;
                            });

                            // Clean up HTML
                            commentHtml = commentHtml.replace(/\[Full example: /g, '[Full example: ');
                            commentHtml = commentHtml.replace(/\.<\/div>/g, '.');
                            commentHtml = commentHtml.replace(/<div[^>]*>/g, '');
                            commentHtml = commentHtml.replace(/<\/div>/g, '');

                            currentGroup.comment = commentHtml.trim();
                        }
                    });
                }
            });

            // Add the last group
            if (currentGroup.rows.length > 0 || currentGroup.comment) {
                exampleGroups.push({...currentGroup});
            }

            // Format examples
            exampleGroups.forEach((group, index) => {
                if (group.rows.length > 0) {
                    content += '    | Property | Value |\n    |:---------|:------|\n';
                    group.rows.forEach(row => {
                        content += `    | ${row.property} | ${row.value} |\n`;
                    });

                    if (group.comment) {
                        content += `\n    *${group.comment}*\n`;
                    }

                    // Add separator between examples
                    if (index < exampleGroups.length - 1) {
                        content += '\n    <hr />\n\n';
                    }
                }
            });
        }

        content += '  </details>\n';
    }

    return content;
}

/**
 * Convert a string to kebab-case
 */
function convertToKebabCase(str) {
    return str
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

/**
 * Escape a string for YAML
 */
function escapeYamlString(str) {
    if (!str) return '';
    return str
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' ');
}

/**
 * Determine the property type based on the range
 */
function determinePropertyType(range) {
    if (range === 'Literal') {
        return 'DatatypeProperty';
    } else {
        return 'ObjectProperty';
    }
}

// Example usage
const sourceFile = process.argv[2] || '1025.html';
const outputFile = process.argv[3] || 'converted-1025.mdx';
convertElementToMdx(sourceFile, outputFile);