#!/bin/bash

# Script to manually edit individual files with detailed conversions
# This addresses specific HTML links and formatting issues in each file

TARGET_DIR="/Users/jonphipps/Code/ISBDM/docs/intro"

# i001.mdx - Convert IFLA link
echo "Editing i001.mdx - IFLA link"
cat > "$TARGET_DIR/i001.mdx.new" << 'EOF'
---
id: i001
title: "Entities related to manifestation"
slug: "/intro/i001"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Entities related to manifestation

<div className="guid">
**ISBD for Manifestation** provides partial accommodation for information about other <OutLink href="https://repository.ifla.org/handle/20.500.14598/40.2">IFLA Library Reference Model</OutLink> entities Work, Expression, Item, Agent, Collective Agent, Person, Place, Time-span, and Nomen that are associated within the description of a manifestation.

Specific utilities include:

- The broad relationship elements that associate the other entities with the manifestation; for example the <InLink href="/ISBDM/docs/relationships/1005.html">has agent associated with manifestation</InLink> and <InLink href="/ISBDM/docs/relationships/1009.html">has place associated with manifestation</InLink> elements.
- The <InLink href="/ISBDM/docs/relationships/1220.html">has work embodied in manifestation</InLink> element that allows a work to be related to the manifestation without describing the intermediary expression.
- The <InLink href="/ISBDM/docs/attributes/1264.html">has category of embodied content</InLink> element that allows Expression categories to be attached to the description of the manifestation.
- The <InLink href="/ISBDM/docs/notes/1265.html">has note on entity associated with manifestation</InLink> element and element sub-types that accommodate brief descriptions of related entities.
- The labels of elements that include "manifestation" when similar elements are likely to be assigned to other entities in the future.
- The stipulations for manifestations that embody diachronic works that allow the manifestation to be described as standalone or as a sub-unit of the "whole", or both, without the complexity of describing diachronic works and their issues.

<SeeAlso><InLink href="/ISBDM/docs/intro/i024.html">Manifestation entity</InLink></SeeAlso>

Broad and partial descriptions of related entities may be refined in due course when ISBD stipulations for the other <OutLink href="https://repository.ifla.org/handle/20.500.14598/40.2">IFLA Library Reference Model</OutLink> entities are developed. This will not make the ISBDM data incorrect or inconsistent.
</div>
EOF
mv "$TARGET_DIR/i001.mdx.new" "$TARGET_DIR/i001.mdx"

# i002.mdx - Convert Example section
echo "Editing i002.mdx - Example section"
cat > "$TARGET_DIR/i002.mdx.new" << 'EOF'
---
id: i002
title: "Terminology"
slug: "/intro/i002"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Terminology

<div className="guid">
The label of a manifestation element may include the qualifier **manifestation** to distinguish it from similar elements and labels that will be developed for the other <OutLink href="https://repository.ifla.org/handle/20.500.14598/40.2">IFLA Library Reference Model</OutLink> entities in the future.

### Examples

The label "has identifier for manifestation" distinguishes the element from "has identifier for work", a possible future element for the Work entity. Every entity requires a similar identifier element to support entity-based cataloguing, except for Nomen which accommodates identifiers and other appellations as instances of the entity.

The label of an entity has an initial upper-case letter when it refers to the entity as a whole.

The label of an entity has an initial lower-case letter when it refers to an instance of the entity. The explicit phrase "instance of …" is used when clarification is required.

The manifestation that is being described is referenced in stipulations as "the manifestation".

Guidance that begins "Consider …" must be followed for effective application of stipulations.

The phrase "if it is considered to be useful for users of the metadata" indicates that a stipulation is optional; if the phrase is not included, the stipulation is mandatory.

A stipulation that begins "For a manifestation that …" applies only to a manifestation that meets the condition.

A stipulation that includes "If …" applies only to an entity or element that meets the condition.

The term "value" refers to the content that is recorded for an ISBDM element.

Values in examples that are strings are enclosed in or delimited by double quote marks ("string"). A local application of ISBDM may use a different method of delimiting a string, or may not require delimiters to be recorded. Values that are linked data internationalised resource identifiers (IRIs) for things are not enclosed in double quote marks.

### Diagrams

An oval in an entity-relationship diagram represents an entity or an instance of an entity.

A rectangle in an entity-relationship diagram represents a string value.

A line that connects two ovals represents a relationship between entities or instances of entities.

A line that connects an oval with a rectangle represents a relationship or attribute that has a string value.

An arrow that terminates a line represents the direction of the relationship. An arrow at either end of a line represents a combination of a relationship and its inverse.
</div>
EOF
mv "$TARGET_DIR/i002.mdx.new" "$TARGET_DIR/i002.mdx"

# i007.mdx - Fix statement link
echo "Editing i007.mdx - statement link"
cat > "$TARGET_DIR/i007.mdx.new" << 'EOF'
---
id: i007
title: "Language and script"
slug: "/intro/i007"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Language and script

<div className="guid">
The language and script of the value of <InLink href="/ISBDM/docs/statements/">statement elements</InLink> should be preserved in the context of the transcription rules as much as possible with the technology that is available to the cataloguing agency.

Language and script of the values of note elements, attribute elements, and relationship elements should be applied according to local needs.
</div>
EOF
mv "$TARGET_DIR/i007.mdx.new" "$TARGET_DIR/i007.mdx"

# i024.mdx - Fix IFLA link
echo "Editing i024.mdx - IFLA link"
cat > "$TARGET_DIR/i024.mdx.new" << 'EOF'
---
id: i024
title: "Manifestation entity"
slug: "/intro/i024"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Manifestation entity

<div className="guid">
Manifestation is one of four entities in the <OutLink href="https://repository.ifla.org/handle/20.500.14598/40.2">IFLA Library Reference Model (LRM)</OutLink> that represent distinct aspects of an information resource. The other resource entities are Work, Expression, and Item. Manifestation and Item describe the carrier components; Expression and Work describe the content components. An information resource is described fully by at least one instance of each resource entity, and may include more than one instance of a manifestation, expression, or work. An aspect of an information resource is described fully by an instance of a resource entity, and is associated with another instance of an entity by recording a relationship element.

ISBDM provides specific relationship elements that associate an instance of a manifestation with instances of other resource entities that are aspects of the same information resource:

<InLink href="/ISBDM/docs/relationships/1011.html">has item that exemplifies manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1013.html">has sub-unit</InLink> and its inverse <InLink href="/ISBDM/docs/relationships/1014.html">has super-unit</InLink>

<InLink href="/ISBDM/docs/relationships/1012.html">has expression embodied in manifestation</InLink>

<InLink href="/ISBDM/docs/relationships/1220.html">has work embodied in manifestation</InLink>

<SeeAlso><InLink href="/ISBDM/docs/intro/i001.html">Entities related to manifestation</InLink></SeeAlso>

An instance of a manifestation describes characteristics that are common to all of the items that exemplify the manifestation.

The number of instances of resource entities in an information resource is constrained by the LRM to ensure the integrity of a full description of an information resource. A manifestation is associated with:

- at least one item that exemplifies the manifestation
- none, or one or more identifiable sub-units of the manifestation
- none, or only one super-unit of the manifestation that embodies a static work
- none, or one or more super-units of the manifestation that embody diachronic works
- at least one expression that is embodied in the manifestation, and therefore at least one work that is embodied in the manifestation

A manifestation is either published or produced, depending on how the items that exemplify the manifestation are created.

The items that exemplify a published manifestation have the typical characteristics:

- There is more than one instance of item. This does not preclude a published manifestation that is exemplified by only one item
- The items are created by using a mechanical process that results in identical copies

The item that exemplifies a produced manifestation has the typical characteristics:

- There is one and only one instance of item
- The item is created by using an artisanal or hand-made process

Consider a produced manifestation to be exemplified by one and only one item.

Consider a manifestation that is created by using an artisanal or hand-made process that is augmented by a process that creates more than one item to be published.
</div>
EOF
mv "$TARGET_DIR/i024.mdx.new" "$TARGET_DIR/i024.mdx"

# i025.mdx - Fix spacing and bullets
echo "Editing i025.mdx - spacing and bullets"
cat > "$TARGET_DIR/i025.mdx.new" << 'EOF'
---
id: i025
title: "Collections"
slug: "/intro/i025"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## Collections

<div className="guid">
A collection is a set of items that are gathered together for some purpose. A collection includes:

- a library or cultural heritage collection that provides easy and contextual access to exemplars of manifestations with characteristics in common (such as category of carrier) or which embody content with similar characteristics or subjects (such as a common language or theme)

- a bound or boxed set of exemplars of more than one manifestation, manufactured by an agent for preservation or circulation of the items

- an exhibition that associates items for education, promotion, or entertainment

The set of collected items may be fixed or it may change as a result of additions and withdrawals.

The set of collected items may include specified sub-sets of items and may be a sub-set of a larger collection.

Consider a collection to be an information resource that is a manifestation with only one exemplifier that embodies only one expression that realises a collecting work.

Consider the expression that realises a collecting work as having no intrinsic characteristics that are useful to describe. The collecting expression does not inherit the characteristics of the expressions that are embodied in the manifestations that are exemplified by the collected items, and the common characteristics of those expressions are included in the description of the collecting work. There is no utility in describing the collecting expression.

Entity-relationship diagram of resource entities and relationships for a collection.

[Expand image]

The diagram shows the resource entities and relationships that may be used to describe a collection manifestation.

Use a <InLink href="/ISBDM/docs/relationships/1233.html">has holding</InLink> element to relate a collection manifestation to an item that is collected.

Use a <InLink href="/ISBDM/docs/relationships/1014.html">has super-unit</InLink> element to relate a collection manifestation to a broader collection manifestation of which it is a part.

Record a <InLink href="/ISBDM/docs/relationships/1237.html">has location of collection</InLink> element to relate a collection manifestation to a place where the collection is located.

### Examples

has location of collection

"Bibliothèque nationale de France, département Cartes et plans (Paris; France)"

[Full example: <InLink href="/ISBDM/docs/fullex/fx078.html">Collection (Bibliothèque nationale de France, département Cartes et plans)</InLink>.]

Record a <InLink href="/ISBDM/docs/relationships/1014.html">has super-unit</InLink> element or a <InLink href="/ISBDM/docs/relationships/1013.html">has sub-unit</InLink> element to relate a collection manifestation to the manifestation of a super-collection or a sub-collection, respectively.
</div>
EOF
mv "$TARGET_DIR/i025.mdx.new" "$TARGET_DIR/i025.mdx"

echo "All individual file edits complete!"