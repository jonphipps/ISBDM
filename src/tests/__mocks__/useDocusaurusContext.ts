export default function useDocusaurusContext() {
  return {
    siteConfig: {
      title: 'Mock Site',
      tagline: 'Mock Tagline',
      customFields: {
        elementDefaults: {
          uri: "https://www.iflastandards.info/ISBDM/elements",
          prefix: "isbdm",
          classPrefix: "C", 
          propertyPrefix: "P",
        },
        vocabularyDefaults: {
          prefix: 'isbdm',
          startCounter: 1000,
          uriStyle: 'numeric',
          caseStyle: 'kebab-case',
          showFilter: true,
          filterPlaceholder: 'Filter values...',
          showTitle: false,
          showURIs: true
        }
      }
    },
  };
} 