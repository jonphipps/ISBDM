#!/bin/bash

# This script replaces MDX files with their fixed versions
# Run this script from the root of the project directory

# Make sure the dev server is stopped before running this script
if lsof -i :3000 > /dev/null; then
  echo "⚠️ Warning: Port 3000 is in use. The dev server might be running."
  echo "Please stop the dev server before running this script."
  echo "You can do this with Ctrl+C in the terminal where the server is running."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting"
    exit 1
  fi
fi

echo "Applying fixes to vocabulary files..."

# Create backups of original files
echo "Creating backups..."
mkdir -p docs/ves/backups
cp docs/ves/1218.mdx docs/ves/backups/1218.mdx.bak
cp docs/ves/1240.mdx docs/ves/backups/1240.mdx.bak
cp docs/ves/1262.mdx docs/ves/backups/1262.mdx.bak
cp docs/ves/1264.mdx docs/ves/backups/1264.mdx.bak
cp docs/ves/1283.mdx docs/ves/backups/1283.mdx.bak

# Replace original files with fixed versions
echo "Replacing files with fixed versions..."
cp -f docs/ves/1218-fixed.mdx docs/ves/1218.mdx && echo "✅ Fixed 1218.mdx"
cp -f docs/ves/1240-fixed.mdx docs/ves/1240.mdx && echo "✅ Fixed 1240.mdx"
cp -f docs/ves/1262-fixed.mdx docs/ves/1262.mdx && echo "✅ Fixed 1262.mdx"
cp -f docs/ves/1264-fixed.mdx docs/ves/1264.mdx && echo "✅ Fixed 1264.mdx"

# Create a fixed 1283.mdx directly since we don't have 1283-with-outlink.mdx
cat > docs/ves/1283.mdx << 'EOF'
---
vocabularyId: "1283"
title: ISBDM Regional Encoding value vocabulary
uri: http://iflastandards.info/ns/isbdm/values/1283
description: >-
  This value vocabulary is a source of values for a has regional encoding element.
isDefinedBy: http://iflastandards.info/ns/isbdm/values/1283
scopeNote: >-
  The vocabulary does not cover the full scope of the element and may be extended
  with additional values.
concepts:
  - value: all regions
    definition: >-
      A regional encoding for a videodisc or video game carrier that indicates
      that playback is permitted on devices worldwide.
  - value: Region 1
    definition: >-
      A regional encoding for a DVD videodisc encoded for playback by devices
      configured to decode it in the United States, Canada, Bermuda, and U.S.
      territories.
  - value: Region 2
    definition: >-
      A regional encoding for a DVD videodisc encoded for playback by devices
      configured to decode it in Japan, Europe, South Africa, and the Middle
      East, including Egypt.
  - value: Region 3
    definition: >-
      A regional encoding for a DVD videodisc encoded for playback by devices
      configured to decode it in Southeast Asia and East Asia, including Hong
      Kong.
  - value: Region 4
    definition: >-
      A regional encoding for a DVD videodisc encoded for playback by devices
      configured to decode it in Australia, New Zealand, Pacific Islands,
      Central America, South America, and the Caribbean.
  - value: Region 5
    definition: >-
      A regional encoding for a DVD videodisc encoded for playback by devices
      configured to decode it in Eastern Europe, Baltic States, Russia, Central
      and South Asia, Indian subcontinent, Africa, North Korea, and Mongolia.
  - value: Region 6
    definition: >-
      A regional encoding for a DVD videodisc encoded for playback by devices
      configured to decode it in China.
  - value: Region 7
    definition: >-
      A regional encoding for a DVD videodisc encoded for playback by devices
      configured to decode it for special uses, such as playing protected copies
      sent to film industry professionals or to the media.
  - value: Region 8
    definition: >-
      A regional encoding for a DVD videodisc encoded for playback by devices
      configured to decode it in international venues such as aircraft, cruise
      ships, spacecraft, etc.
  - value: Region A
    definition: >-
      A regional encoding for a Blu-ray videodisc encoded for playback by
      devices configured to decode it in North America, Central America, South
      America, Japan, North Korea, South Korea, Taiwan, Hong Kong, and Southeast
      Asia.
  - value: Region B
    definition: >-
      A regional encoding for a Blu-ray videodisc encoded for playback by
      devices configured to decode it in Europe, Greenland, French territories,
      Middle East, Africa, Australia, and New Zealand.
  - value: Region C (Blu-ray)
    definition: >-
      A regional encoding for a Blu-ray videodisc encoded for playback by
      devices configured to decode it in India, Nepal, mainland China, Russia,
      Central Asia, and South Asia.
  - value: Region C (video game)
    definition: >-
      A regional encoding for a video game carrier encoded for playback by
      devices configured to decode it in China.
  - value: Region J
    definition: >-
      A regional encoding for a video game carrier encoded for playback by
      devices configured to decode it in Japan, South Korea, Taiwan, Hong Kong,
      Macau, and Southeast Asia.
  - value: Region U/C
    definition: >-
      A regional encoding for a video game carrier encoded for playback by
      devices configured to decode it in the United States, Canada, Mexico, and
      South America.
---

import VocabularyTable from '@site/src/components/global/VocabularyTable';

# {frontMatter.title}

For use with element: [has regional encoding](/docs/attributes/1283.html)

<VocabularyTable
  {...frontMatter}
  showTitle={false}
  filterPlaceholder="Filter vocabulary terms..."
/>

---

<div className="guid">
<p>The values, definitions, and scope notes in this vocabulary are derived from the <OutLink href="https://www.rdaregistry.info/termList/RDARegionalEncoding/">RDA Regional Encoding</OutLink> value vocabulary licensed under a Creative Commons Attribution 4.0 International License, copyright © 2020 American Library Association, Canadian Federation of Library Associations, and CILIP: Chartered Institute of Library and Information Professionals.</p>
</div>

export const toc = VocabularyTable.generateTOC(frontMatter);
EOF

echo "✅ Fixed 1283.mdx"

echo "All fixes applied successfully!"
echo "Backups of original files are in docs/ves/backups/"

echo "\nNote: OutLink does not need to be imported as it is a global component."