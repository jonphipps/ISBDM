// MDXComponents.tsx
import React from 'react';
// Import the original MDX components
import MDXComponents from '@theme-original/MDXComponents';
// Import our custom components
import Figure from '@site/src/components/global/Figure';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';
import Mandatory from '@site/src/components/global/Mandatory';
import Unique from '@site/src/components/global/Unique';
import SeeAlso from '@site/src/components/global/SeeAlso';
import { ExampleTable } from '@site/src/components/global/ExampleTable';
import VocabularyTable from '@site/src/components/global/VocabularyTable';

// Import both the basic ElementReference and the wrapper
import ElementReference from '@site/src/components/global/ElementReference';
import ElementReferenceWrapper from '@site/src/components/global/ElementReferenceWrapper';

// Export the enhanced MDX components
export default {
  // Include all the original components
  ...MDXComponents,
  // Add our custom components
  Figure: Figure,
  OutLink: OutLink,
  InLink: InLink,
  Mandatory: Mandatory,
  Unique: Unique,
  SeeAlso: SeeAlso,
  ExampleTable: ExampleTable,
  ElementReference, // Use direct component - it now handles its own data access
  VocabularyTable: VocabularyTable,
  // Add other components here
};