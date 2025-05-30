#!/bin/bash

# Script to fix the remaining files with HTML links
# This will convert any remaining HTML links to React components

TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# i003.mdx
echo "Fixing i003.mdx"
cat > "$TARGET_DIR/i003.mdx.new" << 'EOF'
---
id: i003
title: "Sources of information"
slug: "/intro/i003"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Sources of information

<div className="guid">
Sources of information for the value of a manifestation element are presented in the manifestation, or are embodied in other manifestations.

ISBD for Manifestation provides elements and stipulations that distinguish two categories of source of information for a description of a manifestation:

<InLink href="/ISBDM/docs/intro/i004.html">The manifestation</InLink> itself.

<InLink href="/ISBDM/docs/intro/i005.html">External sources</InLink> that are found in other manifestations.
</div>
EOF
mv "$TARGET_DIR/i003.mdx.new" "$TARGET_DIR/i003.mdx"

# i004.mdx
echo "Fixing i004.mdx"
cat > "$TARGET_DIR/i004.mdx.new" << 'EOF'
---
id: i004
title: "Sources of information"
slug: "/intro/i004"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Sources of information

### The manifestation

<div className="guid">
The manifestation itself is a unique source of information that requires special consideration.

The manifestation may describe itself and may be a source of information for the value of an element. This conforms with principle 2.3 "Representation" in <OutLink href="https://www.ifla.org/wp-content/uploads/2019/05/assets/cataloguing/icp/icp_2016-en.pdf">Statement of international cataloguing principles (ICP)</OutLink>.

A manifestation describes itself with spoken word, tactile text, or text content that is embedded in the manifestation, including packaging in the form of wrappers and inserts. This content is "about" the manifestation, not "of" the manifestation, and is not treated as an expression that is embodied in the manifestation. This content includes a title or caption, a statement of responsibility, publication or production information, a table of contents, and a list of illustrations. This content excludes a preface, an afterword, or an index; these are treated as expressions.

Content about the manifestation is presented separately from the expressions that are embodied in the manifestation. It may appear before or after the expressions, between expressions, or in a border such as a header or footer that is included in the layout of the expressions.

Consider a manifestation that is reproduced in the manifestation to be an external source of information. A descriptive statement in the original manifestation pertains to the original irrespective of its presence in the reproduction.

A value taken from a statement that is presented in the manifestation must be recorded as it appears in order to conform with the principle of representation. The value must therefore appear as spoken word, tactile text, or text so that it can be transcribed and recorded. The value is transcribed as it appears even if it is known to be false as a result of error or intention.

The manifestation itself may provide differing values for an element, including multiple statements that are wholly or partially covered by the scope of the element.

The manifestation may provide the same statement in multiple languages.

The manifestation itself may emphasise one or more values over others in multiple statements for the same element. Devices for emphasis include larger font size, different font colour, and text decoration such as bold, italics, or underline. Consider such emphasis and prominence as an indication of preference within the principle of representation.

The general order of preference for selecting from multiple values within the manifestation is:

1. The value that is the most prominent.
2. The value that is the fullest within the scope of the element.
3. The value that is considered to have the most utility for users of the metadata.
4. A value that is in a language or script preferred by the cataloguing agency.
5. The value that appears first.

The manifestation itself may not provide a value for an element.

ISBDM provides a <InLink href="/ISBDM/docs/statements/1025.html">has manifestation statement</InLink> element and element sub-types to record a value that appears in the manifestation. The stipulations for these elements focus on the transcription and choice of values to support the user task to identify the manifestation as it identifies itself. ISBDM provides a <InLink href="/ISBDM/docs/notes/general.html">has note on manifestation statement</InLink> element and element sub-types to record uncontrolled or controlled values that complement the uncontrolled values of manifestation statements in the description.

Consider the main utility of these elements as supporting the display of the description of the manifestation. The values of these elements may be incomplete or contradictory and are suitable only for uncontrolled keyword indexing.

ISBDM provides other attribute and relationship elements and element sub-types to record appropriate values from any source of information, including statements that appear in the manifestation itself, other aspects of the manifestation that can be observed, and external sources of information. The stipulations for these elements focus on accuracy and completeness in the context of the application of the metadata.
</div>
EOF
mv "$TARGET_DIR/i004.mdx.new" "$TARGET_DIR/i004.mdx"

# i005.mdx
echo "Fixing i005.mdx"
cat > "$TARGET_DIR/i005.mdx.new" << 'EOF'
---
id: i005
title: "Sources of information"
slug: "/intro/i005"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Sources of information

### External sources

<div className="guid">
An external source of information is a manifestation that embodies expressions and works that describe some aspect of the manifestation that is sufficient to indicate a value for the element. Such works include catalogues, encyclopaedias, and other structured metadata as well as non-fiction works that contain unstructured descriptions.

The same information may be found in multiple external sources. Select one of the sources to provide the most accurate and consensual value that is available to the cataloguer.

The general order of preference for selecting from values in multiple external sources is:

1. The value that is the most common.
2. The value that is the fullest within the scope of the element.
3. The value that is considered to have the most utility for users of the metadata.
4. A value that is in a language or script preferred by the cataloguing agency.
5. The value that appears first in the first external source.

Information found in multiple external sources may be contradictory. Select one of the sources. Use the following order of preference:

1. Structured metadata
   - Created by the publisher or producer of the manifestation
   - Created by a cataloguing agency
   - Created by a trusted agent
2. Created by the publisher or producer of the manifestation
3. Created by a cataloguing agency
4. Created by a trusted agent
5. Unstructured metadata and descriptions
</div>
EOF
mv "$TARGET_DIR/i005.mdx.new" "$TARGET_DIR/i005.mdx"

# i006.mdx
echo "Fixing i006.mdx"
cat > "$TARGET_DIR/i006.mdx.new" << 'EOF'
---
id: i006
title: "Metadata utility and processing"
slug: "/intro/i006"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Metadata utility and processing

<div className="guid">
The value of an ISBDM element is intended for use as metadata in an information retrieval application. ISBDM metadata supports linked open data and relational database applications.

The utility of the value of an ISBDM element is reflected in its source of information and how the value can be processed to support basic methods of retrieval and display.

A value that is a text string or an identifier string can be processed for direct display in the description of the manifestation. A value that is an IRI can be dereferenced, usually, to obtain text strings for display in the description.

ISBDM supports the following basic retrieval methods:

- keyword index
  - controlled keyword index
  - uncontrolled keyword index
- browse index
  - access point index
  - identifier index
- contextual link

The categories of Manifestation elements indicate which retrieval methods are applicable to an element value.

A value that is an uncontrolled text string can be processed to extract words and phrases for an uncontrolled keyword index. This is applicable to the value of a manifestation statement element, and to a free-text value of a note or attribute element.

A value that is a controlled text string can be processed to extract words and phrases for a controlled keyword index. This is applicable to a controlled value of a note or attribute element, and to a value of a relationship element that is an authorized access point.

A value that is an access point can be included in an access point browse index. This is applicable to a value of a relationship element that is an authorized access point or an access point that is constructed by applying a string encoding scheme.

A value that is an identifier string can be included in an identifier browse index. This is applicable to a value of a relationship element that is an authorized access point or an access point that is constructed by applying a string encoding scheme.

A value that is an authorized access point or an identifier string can be used to link two entities in a relational database application. This is applicable to a string value of a relationship element.

A value that is an IRI can be used to link two entities in a linked open data application. This is applicable to a value of an element that is an IRI.

| Retrieval method | Statement | Note | Attribute | Relationship |
| :--- | :---: | :---: | :---: | :---: |
| Uncontrolled keyword | ✓ | ✓ | ✓ |  |
| Controlled keyword |  | ✓ | ✓ | ✓ |
| Browse value |  |  | ✓ | ✓ |
| Link value |  |  |  | ✓ |

Table 1: Data retrieval processes for categories of ISBDM elements.

Table 1 summarises the applicability of the ISBDM element categories to basic information retrieval methods.

A value of an element is inferred to be a value of all of its element super-types. This is a consequence of the semantic hierarchy of elements.

### Examples

has person associated with manifestation

"Shakespeare, William, 1564-1616"

also states

has agent associated with manifestation

"Shakespeare, William, 1564-1616"

[Inferred.]

has publisher collective agent

"HarperCollinsPublishers"

also states

has creator collective agent of manifestation

"HarperCollinsPublishers"

[Inferred.]

has collective agent associated with manifestation

"HarperCollinsPublishers"

[Inferred.]

has agent associated with manifestation

"HarperCollinsPublishers"

[Inferred.]

The interoperability of ISBDM metadata is maximised when the finest element sub-type that is applicable is used to record a value, to allow the greatest number of inferences to be made.

<SeeAlso><InLink href="/ISBDM/docs/intro/i026.html">Granularity</InLink></SeeAlso>

ISBDM makes the "Open World Assumption" for linked open data. The absence of an element value in a description of a manifestation implies neither that the element is not applicable to the manifestation nor that the value is unknowable. An element value may be added to the description in due course.

Use a <InLink href="/ISBDM/docs/notes/general.html">has note on manifestation</InLink> element or element sub-type to indicate the reason for the absence of an element value, if it is considered to be useful for users of the metadata.
</div>
EOF
mv "$TARGET_DIR/i006.mdx.new" "$TARGET_DIR/i006.mdx"

# i008.mdx
echo "Fixing i008.mdx"
cat > "$TARGET_DIR/i008.mdx.new" << 'EOF'
---
id: i008
title: "Element values"
slug: "/intro/i008"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Element values

<div className="guid">
Record only a single value for each element. Do not record multiple values in a single element unless indicated otherwise by a stipulation.

Repeat the element to record more than one value.

If more than one value is applicable to the manifestation, select which values to record. Use the following order of preference, unless indicated otherwise:

1. Record the value that is the best to distinguish the manifestation.
2. Record the values that are most useful for users of the metadata.
3. Record all of the values that are applicable.
</div>
EOF
mv "$TARGET_DIR/i008.mdx.new" "$TARGET_DIR/i008.mdx"

# i014.mdx
echo "Fixing i014.mdx"
cat > "$TARGET_DIR/i014.mdx.new" << 'EOF'
---
id: i014
title: "Reproductions"
slug: "/intro/i014"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Reproductions

<div className="guid">
Consider a manifestation that is produced by copying or reproducing another manifestation to be a distinct manifestation. This includes copying by hand, digitisation, photographic reproduction, audio and video copying, and the re-use of components that were used to create an original published manifestation such as printing plates, woodcuts, and dies.

Consider a manifestation that is a "web archive" of a manifestation that is an online resource to be a distinct manifestation.

Consider a distinct state of an older printed volume or sheet to be a distinct manifestation.

A manifestation may reproduce a manifestation that is previously published or produced, or may reproduce an item that is modified after it is created as an exemplar of a manifestation that is previously published.

A manifestation may reproduce only the content as it is embodied in a manifestation or it may also reproduce the carrier.

A manifestation may reproduce a manifestation with or without its manifestation statements, and may add its own manifestation statements.

Consider marks of ownership, item identifiers, local annotations, and visible wear and damage to be modifications of an item.

Record a <InLink href="/ISBDM/docs/relationships/1210.html">has manifestation reproduced by manifestation</InLink> element to relate a manifestation that is a copy to the manifestation that it copies. Use this element if an item that is copied by the manifestation does not include modifications.

Record a <InLink href="/ISBDM/docs/relationships/1215.html">has item reproduced by manifestation</InLink> element to relate a manifestation that is a copy to the item that it copies. Use this element if an item that is copied by the manifestation includes modifications.
</div>
EOF
mv "$TARGET_DIR/i014.mdx.new" "$TARGET_DIR/i014.mdx"

# i021.mdx
echo "Fixing i021.mdx"
cat > "$TARGET_DIR/i021.mdx.new" << 'EOF'
---
id: i021
title: "Manifestation elements"
slug: "/intro/i021"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Manifestation elements

<div className="guid">
**ISBD for Manifestation** provides elements for the description of a manifestation and its relationships to other entities.

The elements are grouped in four categories:

- Statements: <InLink href="/ISBDM/docs/statements/">Manifestation statement elements</InLink>
- Notes: <InLink href="/ISBDM/docs/notes/">Note elements</InLink>
- Attributes: <InLink href="/ISBDM/docs/attributes/">Attribute elements</InLink>
- Relationships: <InLink href="/ISBDM/docs/relationships/">Relationship elements</InLink>

Each category is distinguished by the sources of information for values of the element and the utility of values for information retrieval.

Elements are arranged in a semantic hierarchy within a category. The hierarchy reflects the granularity of element definitions and scope notes.

The elements support the general principles of <OutLink href="https://www.ifla.org/wp-content/uploads/2019/05/assets/cataloguing/icp/icp_2016-en.pdf">Statement of international cataloguing principles (ICP)</OutLink>.

Manifestation statement elements support the ICP principle of "representation".

Other categories of element support the ICP principles of "accuracy", "consistency and standardization", "integration", "interoperability", "openness", "accessibility", and "rationality".

Manifestation elements also support local decisions by a cataloguing agency for compliance with the principles of "convenience of the user", "common usage", "sufficiency and necessity", "significance", and "economy".
</div>
EOF
mv "$TARGET_DIR/i021.mdx.new" "$TARGET_DIR/i021.mdx"

# i022.mdx
echo "Fixing i022.mdx"
cat > "$TARGET_DIR/i022.mdx.new" << 'EOF'
---
id: i022
title: "Mandatory elements"
slug: "/intro/i022"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Mandatory elements

<div className="guid">
A manifestation element is either mandatory or optional. A cataloguing agency must record at least one occurrence of a mandatory element. A cataloguing agency may choose not to record any occurrence for an optional element.

The mandatory requirement of an element is satisfied if a cataloguing agency records an occurrence of one of its element sub-types. This is a consequence of the semantic hierarchy of elements.

<SeeAlso><InLink href="/ISBDM/docs/intro/i006.html">Metadata utility and processing</InLink></SeeAlso>

A mandatory element is indicated in ISBDM by the symbol ✽ before the reference information for the element.

The mandatory elements are:

<InLink href="/ISBDM/docs/attributes/1022.html">has category of carrier</InLink>

<InLink href="/ISBDM/docs/attributes/1264.html">has category of embodied content</InLink>

<InLink href="/ISBDM/docs/attributes/1218.html">has media type</InLink>

<InLink href="/ISBDM/docs/attributes/1262.html">has unitary structure</InLink>

<InLink href="/ISBDM/docs/relationships/1274.html">has appellation of manifestation</InLink>

An element may be mandatory if a condition is satisified; for example that there is a value that is applicable and available. A conditional mandatory stipulation is indicated in ISBDM by the symbol ✽ before the condition.

The elements that have a conditional mandatory stipulation are:

<InLink href="/ISBDM/docs/statements/1025.html">has manifestation statement</InLink>

<InLink href="/ISBDM/docs/statements/1028.html">has manifestation statement of title and responsibility</InLink>

<InLink href="/ISBDM/docs/relationships/1012.html">has expression embodied in manifestation</InLink> or <InLink href="/ISBDM/docs/relationships/1220.html">has work embodied in manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1005.html">has agent associated with manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1019.html">has creator agent of manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1251.html">has creator collective agent of manifestation</InLink> or <InLink href="/ISBDM/docs/relationships/1246.html">has creator person of manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1009.html">has place associated with manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1236.html">has place of creation of manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1010.html">has time-span associated with manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1235.html">has date of creation of manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1257.html">has authorized access point of manifestation</InLink>

Record an element that is applicable and available at the finest level of granularity in a semantic hierarchy, including a sub-type of an element that is marked as mandatory.

All other elements are optional.
</div>
EOF
mv "$TARGET_DIR/i022.mdx.new" "$TARGET_DIR/i022.mdx"

# i023.mdx
echo "Fixing i023.mdx"
cat > "$TARGET_DIR/i023.mdx.new" << 'EOF'
---
id: i023
title: "Repeatable elements"
slug: "/intro/i023"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Repeatable elements

<div className="guid">
A manifestation element is either unique or repeatable. A cataloguing agency may record only one occurrence of a unique element. A cataloguing agency may record many occurrences of a repeatable element by recording each value in a separate occurrence of the element.

A unique, non-repeatable element is indicated in ISBDM by the symbol 1 after the element's label.

The unique elements are:

<InLink href="/ISBDM/docs/attributes/1262.html">has unitary structure</InLink>

All other elements are repeatable.

ISBDM does not specify a maximum number of occurrences of a repeatable element in the description of a manifestation.
</div>
EOF
mv "$TARGET_DIR/i023.mdx.new" "$TARGET_DIR/i023.mdx"

echo "All remaining files fixed!"