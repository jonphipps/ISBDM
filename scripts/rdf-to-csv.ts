#!/usr/bin/env node

import { Command } from 'commander';
import { Parser, Store, DataFactory, Quad, Writer } from 'n3';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as jsonld from 'jsonld';
import { RdfXmlParser } from 'rdfxml-streaming-parser';

const { namedNode, literal, quad } = DataFactory;

interface DctapProperty {
  propertyID: string;
  repeatable?: string;
}

interface PropertyValue {
  value: string;
  language?: string;
}

interface ResourceData {
  uri: string;
  properties: Map<string, PropertyValue[]>;
}

// Default namespace prefixes (will be overridden by prefixes from the RDF file)
const DEFAULT_PREFIXES: Record<string, string> = {
  skos: 'http://www.w3.org/2004/02/skos/core#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dcterms: 'http://purl.org/dc/terms/',
  owl: 'http://www.w3.org/2002/07/owl#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
};

// This will be populated with prefixes from the parsed RDF file
let PREFIXES: Record<string, string> = { ...DEFAULT_PREFIXES };

function expandCurie(curie: string): string {
  const colonIndex = curie.indexOf(':');
  if (colonIndex === -1) {
    return curie; // Not a CURIE
  }
  
  const prefix = curie.substring(0, colonIndex);
  const localName = curie.substring(colonIndex + 1);
  
  if (PREFIXES[prefix]) {
    return PREFIXES[prefix] + localName;
  }
  return curie;
}

function toCurie(uri: string): string {
  // Sort prefixes by length (longest first) to ensure more specific matches
  const sortedPrefixes = Object.entries(PREFIXES).sort(
    ([, a], [, b]) => b.length - a.length
  );
  
  for (const [prefix, namespace] of sortedPrefixes) {
    if (uri.startsWith(namespace)) {
      return `${prefix}:${uri.substring(namespace.length)}`;
    }
  }
  return uri;
}

async function loadDctapProfile(dctapPath: string): Promise<Map<string, boolean>> {
  const repeatableProperties = new Map<string, boolean>();
  
  try {
    const csvContent = fs.readFileSync(dctapPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as DctapProperty[];
    
    for (const record of records) {
      if (record.propertyID) {
        const isRepeatable = record.repeatable?.toLowerCase() === 'true' || 
                           record.repeatable?.toLowerCase() === 'yes' ||
                           record.repeatable === '1';
        const expandedUri = expandCurie(record.propertyID);
        repeatableProperties.set(expandedUri, isRepeatable);
      }
    }
  } catch (error) {
    console.error(`Warning: Could not load DCTAP profile from ${dctapPath}:`, error);
    // Set defaults for known repeatable properties (from context files with @container: @language)
    // Note: skos:prefLabel is excluded as it's unique per language (not repeatable within language)
    repeatableProperties.set(expandCurie('skos:definition'), true);
    repeatableProperties.set(expandCurie('skos:scopeNote'), true);
    repeatableProperties.set(expandCurie('rdfs:label'), true);
    repeatableProperties.set(expandCurie('skos:altLabel'), true);
    repeatableProperties.set(expandCurie('skos:changeNote'), true);
    repeatableProperties.set(expandCurie('skos:editorialNote'), true);
    repeatableProperties.set(expandCurie('skos:historyNote'), true);
    repeatableProperties.set(expandCurie('skos:example'), true);
    repeatableProperties.set(expandCurie('skos:notation'), true);
  }
  
  return repeatableProperties;
}

function inferNamespaceFromURIs(uris: string[]): void {
  // Build a tree structure of URI segments and their frequencies
  const segmentTree = new Map<string, { count: number; children: Map<string, any> }>();
  
  for (const uri of uris) {
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) continue;
    
    const parts = uri.split('/').filter(p => p);
    let currentLevel = segmentTree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!currentLevel.has(part)) {
        currentLevel.set(part, { count: 0, children: new Map() });
      }
      const node = currentLevel.get(part)!;
      node.count++;
      currentLevel = node.children;
    }
  }
  
  // Find common namespace patterns by analyzing the tree
  const findNamespaceCandidates = (
    tree: Map<string, any>, 
    path: string[] = [], 
    candidates: Array<{ namespace: string; count: number; depth: number }> = []
  ): Array<{ namespace: string; count: number; depth: number }> => {
    
    for (const [segment, node] of tree) {
      const newPath = [...path, segment];
      // Reconstruct the namespace URL properly
      let namespace = '';
      if (newPath.length >= 2) {
        if (path.length === 0 && (segment === 'http:' || segment === 'https:')) {
          namespace = segment + '//';
        } else if (path.length === 1 && (path[0] === 'http:' || path[0] === 'https:')) {
          namespace = path[0] + '//' + segment + '/';
        } else if (path.length > 1) {
          const protocol = path[0] === 'http:' ? 'http://' : 'https://';
          const pathParts = newPath.slice(1);
          namespace = protocol + pathParts.join('/') + '/';
        }
      }
      
      // Consider this level as a namespace candidate if:
      // 1. It has multiple children (suggesting it's a branching point)
      // 2. It appears frequently
      // 3. It's at a reasonable depth (usually 2-5 segments after protocol)
      if (namespace && node.children.size > 1 && node.count > 5 && newPath.length >= 2 && newPath.length <= 5) {
        candidates.push({ 
          namespace, 
          count: node.count, 
          depth: newPath.length 
        });
      }
      
      // Also consider namespace candidates based on common path patterns
      // Look for segments that suggest namespace boundaries (ns, vocab, onto, etc.)
      if (namespace && node.count > 10 && newPath.length >= 3) {
        const currentSegment = segment.toLowerCase();
        const parentSegment = path.length > 0 ? path[path.length - 1].toLowerCase() : '';
        
        // Check if this or parent segment suggests a namespace boundary
        const namespaceIndicators = ['ns', 'vocab', 'onto', 'ontology', 'schema', 'vocabulary'];
        if (namespaceIndicators.some(indicator => 
          currentSegment.includes(indicator) || parentSegment.includes(indicator)
        )) {
          candidates.push({ 
            namespace, 
            count: node.count * 2, // Boost score for namespace indicators
            depth: newPath.length 
          });
        }
      }
      
      // Recurse into children
      if (node.children.size > 0) {
        findNamespaceCandidates(node.children, newPath, candidates);
      }
    }
    
    return candidates;
  };
  
  const candidates = findNamespaceCandidates(segmentTree);
  
  // Sort candidates by a score that considers both frequency and depth
  // Prefer deeper namespaces with high frequency
  candidates.sort((a, b) => {
    const scoreA = a.count * Math.log(a.depth + 1);
    const scoreB = b.count * Math.log(b.depth + 1);
    return scoreB - scoreA;
  });
  
  // Add prefixes for the best candidates
  const addedNamespaces = new Set<string>();
  
  for (const candidate of candidates) {
    // Skip if this namespace is already covered by a shorter one
    let covered = false;
    for (const existing of addedNamespaces) {
      if (candidate.namespace.startsWith(existing) || existing.startsWith(candidate.namespace)) {
        covered = true;
        break;
      }
    }
    
    if (!covered && !Object.values(PREFIXES).includes(candidate.namespace)) {
      // Generate a prefix from the last meaningful segment
      const parts = candidate.namespace.split('/').filter(p => p && p !== 'http:' && p !== 'https:');
      const lastPart = parts[parts.length - 1];
      
      if (lastPart && !PREFIXES[lastPart]) {
        PREFIXES[lastPart] = candidate.namespace;
        addedNamespaces.add(candidate.namespace);
        console.error(`Inferred prefix '${lastPart}' for namespace: ${candidate.namespace}`);
      }
    }
  }
  
  // Also add prefixes for leaf namespaces (with # or last segment)
  const leafNamespaces = new Map<string, number>();
  
  for (const uri of uris) {
    const hashIndex = uri.lastIndexOf('#');
    const slashIndex = uri.lastIndexOf('/');
    const splitIndex = hashIndex > slashIndex ? hashIndex : slashIndex;
    
    if (splitIndex > 0) {
      const namespace = uri.substring(0, splitIndex + 1);
      leafNamespaces.set(namespace, (leafNamespaces.get(namespace) || 0) + 1);
    }
  }
  
  // Add the most common leaf namespaces that aren't covered
  const sortedLeafNamespaces = Array.from(leafNamespaces.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  for (const [namespace, count] of sortedLeafNamespaces) {
    if (count < 3) continue; // Skip rare namespaces
    
    let covered = false;
    for (const [prefix, ns] of Object.entries(PREFIXES)) {
      if (namespace.startsWith(ns)) {
        covered = true;
        break;
      }
    }
    
    if (!covered && !Object.values(PREFIXES).includes(namespace)) {
      const parts = namespace.split('/').filter(p => p);
      const lastPart = parts[parts.length - 1].replace(/#$/, '');
      
      if (lastPart && !PREFIXES[lastPart]) {
        PREFIXES[lastPart] = namespace;
        console.error(`Inferred prefix '${lastPart}' for namespace: ${namespace}`);
      }
    }
  }
}

function detectRdfFormat(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const formatMap: Record<string, string> = {
    '.ttl': 'text/turtle',
    '.turtle': 'text/turtle',
    '.n3': 'text/n3',
    '.nt': 'application/n-triples',
    '.ntriples': 'application/n-triples',
    '.jsonld': 'application/ld+json',
    '.json': 'application/ld+json',
    '.rdf': 'application/rdf+xml',
    '.xml': 'application/rdf+xml',
    '.owl': 'application/rdf+xml',
  };
  
  const format = formatMap[ext];
  if (!format) {
    console.error(`Warning: Unknown file extension '${ext}', assuming Turtle format`);
    return 'text/turtle';
  }
  
  return format;
}

async function parseJsonLdToNQuads(filePath: string): Promise<string> {
  const jsonldData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Determine which local context to use
  const scriptDir = __dirname;
  const projectRoot = path.join(scriptDir, '..');
  const localContextPath = path.join(projectRoot, 'static', 'data', 'contexts', 'elements_langmap.jsonld');
  
  try {
    // Create document loader that uses local context
    const documentLoader = async (url: string) => {
      // Map remote context URLs to local files
      const contextMappings: Record<string, string> = {
        'http://metadataregistry.org/uri/schema/Contexts/elements_langmap.jsonld': 'elements_langmap.jsonld',
        'http://metadataregistry.org/uri/schema/Contexts/concepts_langmap.jsonld': 'concepts_langmap.jsonld',
        'http://iflastandards.info/ns/isbd/terms/Contexts/concepts_langmap.jsonld': 'concepts_langmap.jsonld'
      };
      
      if (contextMappings[url]) {
        console.error(`Using local context file for: ${url}`);
        const contextFile = contextMappings[url];
        const contextPath = path.join(projectRoot, 'static', 'data', 'contexts', contextFile);
        
        if (fs.existsSync(contextPath)) {
          const localContext = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
          return {
            contextUrl: null,
            document: localContext,
            documentUrl: url
          };
        }
      }
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        console.error(`Warning: Unknown remote context: ${url}`);
        // Return empty context for other URLs
        return {
          contextUrl: null,
          document: { "@context": {} },
          documentUrl: url
        };
      }
      
      return jsonld.documentLoaders.node()(url);
    };
    
    // Convert to N-Quads
    const nquads = await jsonld.toRDF(jsonldData, { 
      format: 'application/n-quads',
      documentLoader
    });
    
    const nquadsStr = nquads as string;
    const lines = nquadsStr.split('\n').filter(line => line.trim());
    console.error(`Generated ${lines.length} N-Quad statements`);
    
    return nquadsStr;
  } catch (error) {
    console.error('JSON-LD parsing failed:', error);
    throw error;
  }
}

async function parseRdfFile(filePath: string, forcedFormat?: string): Promise<Store> {
  const store = new Store();
  const format = forcedFormat || detectRdfFormat(filePath);
  const baseIRI = `file://${path.resolve(filePath)}`;
  
  // Reset prefixes to defaults before parsing
  PREFIXES = { ...DEFAULT_PREFIXES };
  
  // Special handling for RDF/XML
  if (format === 'application/rdf+xml') {
    console.error(`Parsing RDF/XML file: ${filePath}`);
    
    return new Promise((resolve, reject) => {
      const rdfXmlParser = new RdfXmlParser({ baseIRI });
      const fileStream = fs.createReadStream(filePath);
      
      rdfXmlParser.on('data', (quad: Quad) => {
        store.add(quad);
      });
      
      rdfXmlParser.on('error', (error: Error) => {
        reject(error);
      });
      
      rdfXmlParser.on('end', () => {
        // Extract prefixes if available
        const prefixes = (rdfXmlParser as any).prefixes;
        if (prefixes) {
          for (const [prefix, iri] of Object.entries(prefixes)) {
            if (typeof iri === 'string') {
              PREFIXES[prefix] = iri;
            }
          }
        }
        
        console.error('Extracted prefixes from RDF file:', Object.keys(PREFIXES).join(', '));
        resolve(store);
      });
      
      fileStream.pipe(rdfXmlParser);
    });
  }
  
  let rdfData: string;
  let actualFormat = format;
  
  // Special handling for JSON-LD
  if (format === 'application/ld+json') {
    try {
      console.error(`Converting JSON-LD to N-Quads: ${filePath}`);
      rdfData = await parseJsonLdToNQuads(filePath);
      actualFormat = 'application/n-quads';
    } catch (error) {
      throw new Error(`Failed to parse JSON-LD: ${error}`);
    }
  } else {
    rdfData = fs.readFileSync(filePath, 'utf-8');
  }
  
  const parser = new Parser({ 
    baseIRI, 
    format: actualFormat,
    // For RDF/XML, we need to enable blank node parsing
    blankNodePrefix: '_:b'
  });
  
  return new Promise((resolve, reject) => {
    parser.parse(rdfData, (error, quad, prefixes) => {
      if (error) {
        reject(error);
      } else if (quad) {
        store.add(quad);
      } else {
        // When parsing is complete, prefixes are provided in the third parameter
        if (prefixes) {
          // Merge parsed prefixes with existing ones
          for (const [prefix, iri] of Object.entries(prefixes)) {
            if (iri && typeof iri === 'object' && 'value' in iri) {
              // N3.js returns IRIs as objects with a 'value' property
              PREFIXES[prefix] = (iri as any).value;
            } else if (typeof iri === 'string') {
              PREFIXES[prefix] = iri;
            }
          }
        }
        console.error(`Parsing ${format} file: ${filePath}`);
        console.error('Extracted prefixes from RDF file:', Object.keys(PREFIXES).join(', '));
        resolve(store);
      }
    });
  });
}

function extractResourceData(store: Store): Map<string, ResourceData> {
  const resources = new Map<string, ResourceData>();
  
  // Get all unique subjects (resources)
  const subjects = new Set<string>();
  const allURIs: string[] = [];
  
  for (const quad of store) {
    if (quad.subject.termType === 'NamedNode') {
      subjects.add(quad.subject.value);
      allURIs.push(quad.subject.value);
    }
    if (quad.object.termType === 'NamedNode') {
      allURIs.push(quad.object.value);
    }
  }
  
  // Infer prefixes from the URIs found in the data
  inferNamespaceFromURIs(allURIs);
  
  // Extract properties for each resource
  for (const subjectUri of subjects) {
    const resourceData: ResourceData = {
      uri: subjectUri,
      properties: new Map(),
    };
    
    const quads = store.getQuads(namedNode(subjectUri), null, null, null);
    
    for (const quad of quads) {
      const predicate = quad.predicate.value;
      const object = quad.object;
      
      if (!resourceData.properties.has(predicate)) {
        resourceData.properties.set(predicate, []);
      }
      
      const values = resourceData.properties.get(predicate)!;
      
      if (object.termType === 'Literal') {
        values.push({
          value: object.value,
          language: object.language || undefined,
        });
      } else if (object.termType === 'NamedNode') {
        // Convert URI to CURIE if possible
        values.push({
          value: toCurie(object.value),
        });
      }
    }
    
    resources.set(subjectUri, resourceData);
  }
  
  return resources;
}

function generateCsvHeaders(
  resources: Map<string, ResourceData>,
  repeatableProperties: Map<string, boolean>
): string[] {
  const headers: string[] = ['uri'];
  const propertyLanguageCounts = new Map<string, Map<string, number>>();
  
  // First pass: count occurrences of each property-language combination
  for (const resource of resources.values()) {
    for (const [property, values] of resource.properties) {
      if (!propertyLanguageCounts.has(property)) {
        propertyLanguageCounts.set(property, new Map());
      }
      
      const langCounts = propertyLanguageCounts.get(property)!;
      const langOccurrences = new Map<string, number>();
      
      for (const value of values) {
        const lang = value.language || '';
        langOccurrences.set(lang, (langOccurrences.get(lang) || 0) + 1);
      }
      
      for (const [lang, count] of langOccurrences) {
        langCounts.set(lang, Math.max(langCounts.get(lang) || 0, count));
      }
    }
  }
  
  // Second pass: generate headers
  const sortedProperties = Array.from(propertyLanguageCounts.keys()).sort();
  
  for (const property of sortedProperties) {
    const curie = toCurie(property);
    const langCounts = propertyLanguageCounts.get(property)!;
    const isRepeatable = repeatableProperties.get(property) || false;
    
    const sortedLangs = Array.from(langCounts.keys()).sort();
    
    for (const lang of sortedLangs) {
      const maxCount = langCounts.get(lang)!;
      
      if (isRepeatable) {
        // Always add [0] index for repeatable properties, even with single values
        const actualMaxCount = Math.max(maxCount, 1);
        for (let i = 0; i < actualMaxCount; i++) {
          const header = lang ? `${curie}@${lang}[${i}]` : `${curie}[${i}]`;
          headers.push(header);
        }
      } else {
        const header = lang ? `${curie}@${lang}` : curie;
        headers.push(header);
      }
    }
  }
  
  return headers;
}

function generateCsvRows(
  resources: Map<string, ResourceData>,
  headers: string[],
  repeatableProperties: Map<string, boolean>
): string[][] {
  const rows: string[][] = [];
  
  for (const resource of resources.values()) {
    // Convert resource URI to CURIE if possible
    const resourceId = toCurie(resource.uri);
    const row: string[] = [resourceId];
    
    // Track how many values we've added for each property-language combination
    const propertyLangIndices = new Map<string, number>();
    
    for (let i = 1; i < headers.length; i++) {
      const header = headers[i];
      let value = '';
      
      // Parse header to extract property and language
      const match = header.match(/^(.+?)(?:@([^[]+))?(?:\[(\d+)\])?$/);
      if (match) {
        const [, curie, lang, indexStr] = match;
        const property = expandCurie(curie);
        const targetLang = lang || '';
        const targetIndex = indexStr ? parseInt(indexStr) : 0;
        
        if (resource.properties.has(property)) {
          const values = resource.properties.get(property)!;
          const filteredValues = values.filter(v => (v.language || '') === targetLang);
          
          if (filteredValues.length > targetIndex) {
            const val = filteredValues[targetIndex].value;
            // Convert URI values to CURIEs if possible
            if (val.startsWith('http://') || val.startsWith('https://')) {
              value = toCurie(val);
            } else {
              value = val;
            }
          }
        }
      }
      
      row.push(value);
    }
    
    rows.push(row);
  }
  
  return rows;
}

const program = new Command();

program
  .name('rdf-to-csv')
  .description('Convert RDF files to CSV format using DCTAP profile')
  .version('1.0.0')
  .argument('<rdf-file>', 'Path to the RDF file (supports .ttl, .nt, .jsonld, .rdf, .xml)')
  .option('-p, --profile <dctap-file>', 'Path to DCTAP profile CSV file')
  .option('-o, --output <output-file>', 'Output CSV file (default: stdout)')
  .option('-f, --format <format>', 'Force RDF format (auto-detected by default)')
  .action(async (rdfFile: string, options) => {
    try {
      // Load DCTAP profile if provided
      const repeatableProperties = options.profile 
        ? await loadDctapProfile(options.profile)
        : new Map([
            [expandCurie('skos:definition'), true],
            [expandCurie('skos:scopeNote'), true],
            [expandCurie('rdfs:label'), true],
            // Note: skos:prefLabel excluded - unique per language (not repeatable within language)
            [expandCurie('skos:altLabel'), true],
            [expandCurie('skos:changeNote'), true],
            [expandCurie('skos:editorialNote'), true],
            [expandCurie('skos:historyNote'), true],
            [expandCurie('skos:example'), true],
            [expandCurie('skos:notation'), true],
          ]);
      
      // Parse RDF file
      const store = await parseRdfFile(rdfFile, options.format);
      
      // Extract resource data
      const resources = extractResourceData(store);
      console.error(`Found ${resources.size} resources`);
      
      // Generate CSV
      const headers = generateCsvHeaders(resources, repeatableProperties);
      const rows = generateCsvRows(resources, headers, repeatableProperties);
      
      // Create CSV output
      const csvData = [headers, ...rows];
      const csvString = stringify(csvData);
      
      // Write output
      if (options.output) {
        fs.writeFileSync(options.output, csvString);
        console.error(`CSV written to: ${options.output}`);
      } else {
        console.log(csvString);
      }
      
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();