interface ElementSubType {
  uri: string;
  url: string;
  label: string;
}

interface ElementSuperType {
  uri: string;
  url: string;
  label: string;
}

export function adaptElementFrontMatter(frontMatter: any) {
  // Create a deep copy to avoid modifying the original
  const adaptedFrontMatter = {
    RDF: {
      ...frontMatter.RDF,
      // Handle attributes that are expected inside RDF but are at root level
      deprecated: frontMatter.deprecated || false,
      deprecatedInVersion: frontMatter.deprecatedInVersion || "",
      willBeRemovedInVersion: frontMatter.willBeRemovedInVersion || "",
    }
  };
  
  // Handle assembled URI if needed
  if (!adaptedFrontMatter.RDF.uri) {
    // Construct URI based on configuration and ID
    // This is a simplified version - in production this would use config values
    const prefix = "http://iflastandards.info/ns/isbdm/elements/P";
    adaptedFrontMatter.RDF.uri = `${prefix}${frontMatter.id}`;
  }
  
  // Ensure language is present
  if (!adaptedFrontMatter.RDF.language) {
    adaptedFrontMatter.RDF.language = "en"; // Default language
  }
  
  // Ensure status is present
  if (!adaptedFrontMatter.RDF.status) {
    adaptedFrontMatter.RDF.status = "Published"; // Default status
  }
  
  // Ensure isDefinedBy is present
  if (!adaptedFrontMatter.RDF.isDefinedBy) {
    adaptedFrontMatter.RDF.isDefinedBy = "http://iflastandards.info/ns/isbdm/elements/";
  }
  
  // Handle elementSuperType conversion to subPropertyOf if needed
  if (adaptedFrontMatter.RDF.elementSuperType && 
      adaptedFrontMatter.RDF.elementSuperType.length > 0 && 
      (!adaptedFrontMatter.RDF.subPropertyOf || adaptedFrontMatter.RDF.subPropertyOf.length === 0)) {
    adaptedFrontMatter.RDF.subPropertyOf = adaptedFrontMatter.RDF.elementSuperType.map(
      (superType: ElementSuperType) => superType.uri
    );
  }
  
  // Ensure required arrays exist
  if (!adaptedFrontMatter.RDF.equivalentProperty) {
    adaptedFrontMatter.RDF.equivalentProperty = [];
  }
  
  if (!adaptedFrontMatter.RDF.inverseOf) {
    adaptedFrontMatter.RDF.inverseOf = [];
  }
  
  if (!adaptedFrontMatter.RDF.elementSubType) {
    adaptedFrontMatter.RDF.elementSubType = [];
  }
  
  if (!adaptedFrontMatter.RDF.elementSuperType) {
    adaptedFrontMatter.RDF.elementSuperType = [];
  }
  
  if (!adaptedFrontMatter.RDF.subPropertyOf) {
    adaptedFrontMatter.RDF.subPropertyOf = [];
  }
  
  return adaptedFrontMatter;
}