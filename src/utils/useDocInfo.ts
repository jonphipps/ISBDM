/**
 * Utility hook for accessing document information in a Docusaurus v3 compatible way
 */
import { useMemo } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function useDocInfo() {
  // Access global Docusaurus context
  const { siteConfig } = useDocusaurusContext();
  
  // Check if we're in a browser context
  const isBrowser = typeof window !== 'undefined';
  
  // Access the current page's metadata
  const frontMatter = useMemo(() => {
    // Try to get frontmatter from various potential sources
    if (isBrowser) {
      // Try Docusaurus v3 context format
      if (window.__DOCUSAURUS__?.renderReactComponent) {
        const currentDoc = window.__DOCUSAURUS__.routeState?.doc;
        if (currentDoc) {
          return currentDoc.frontMatter || {};
        }
      }
      
      // Try legacy context format
      if (window.__DOCUSAURUS_CONTEXT__) {
        return window.__DOCUSAURUS_CONTEXT__.frontMatter || {};
      }
    }
    
    // Fallback for SSR or when context is not available
    return {};
  }, [isBrowser]);
  
  return {
    frontMatter,
  };
}