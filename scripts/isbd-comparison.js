/**
 * ISBD Vocabulary Comparison Tool
 * Compares Google Sheets SKOS concepts with published ISBD RDF vocabularies
 *
 * Setup for Node.js 18+:
 * npm init -y
 * npm install dotenv
 *
 * Create .env file with:
 * GOOGLE_SHEETS_API_KEY=your_api_key_here
 * SPREADSHEET_ID=1_QI2DqNomn0jCqSdjOxCZVF6wxz6FuRuIKBMweaGmfQ
 */

require('dotenv').config();

// Use native fetch (Node.js 18+)
const fetch = globalThis.fetch;

class ISBDComparisonTool {
    constructor(apiKey, spreadsheetId) {
        this.apiKey = apiKey;
        this.spreadsheetId = spreadsheetId;
        this.baseGoogleSheetsUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
        this.conceptSchemes = [];
        this.results = {
            matches: [],
            mismatches: [],
            missing: [],
            errors: []
        };
    }

    /**
     * Main method to run the complete comparison
     */
    async runComparison() {
        try {
            console.log('🚀 Starting ISBD vocabulary comparison...');

            // Step 1: Read the index sheet to get concept schemes
            await this.loadConceptSchemes();

            // Step 2: Process each concept scheme (excluding new ones without RDF)
            for (const scheme of this.conceptSchemes) {
                if (scheme.hasRdf) {
                    console.log(`\n📋 Processing: ${scheme.token}`);
                    await this.compareConceptScheme(scheme);
                } else {
                    console.log(`\n⏳ Skipping ${scheme.token} (new, no RDF yet)`);
                }
            }

            // Step 3: Generate report
            this.generateReport();

        } catch (error) {
            console.error('❌ Comparison failed:', error);
            this.results.errors.push({
                message: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Load concept schemes from the index sheet
     */
    async loadConceptSchemes() {
        console.log('📖 Loading concept schemes from index sheet...');

        const indexData = await this.fetchSheetData('index');
        const headers = indexData[0];
        const tokenCol = headers.indexOf('token');
        const titleCol = headers.indexOf('title');
        const idCol = headers.indexOf('id');

        // Skip header row
        for (let i = 1; i < indexData.length; i++) {
            const row = indexData[i];
            if (row[tokenCol]) {
                const token = row[tokenCol];
                const uri = row[idCol] || '';
                
                // Skip instruction rows (they don't have valid URIs)
                if (!uri || !uri.startsWith('http')) {
                    continue;
                }
                
                // Skip rows that are clearly instructions (contain colons or long text)
                if (token.includes(':') || token.length > 50) {
                    continue;
                }
                
                this.conceptSchemes.push({
                    token: token,
                    title: row[titleCol] || '',
                    uri: uri,
                    hasRdf: !['qualiprocess', 'process'].includes(token) // New ones don't have RDF
                });
            }
        }

        console.log(`✅ Loaded ${this.conceptSchemes.length} concept schemes`);
    }

    /**
     * Compare a single concept scheme
     */
    async compareConceptScheme(scheme) {
        try {
            // Fetch concepts from Google Sheet
            const sheetConcepts = await this.fetchSheetConcepts(scheme.token);

            // Fetch RDF concepts
            const rdfConcepts = await this.fetchRdfConcepts(scheme.uri);

            // Compare concepts
            const comparison = this.compareConcepts(scheme, sheetConcepts, rdfConcepts);

            // Store results
            this.results.matches.push(...comparison.matches);
            this.results.mismatches.push(...comparison.mismatches);
            this.results.missing.push(...comparison.missing);

            console.log(`   ✅ ${comparison.matches.length} matches`);
            console.log(`   ⚠️  ${comparison.mismatches.length} mismatches`);
            console.log(`   ❌ ${comparison.missing.length} missing`);

        } catch (error) {
            console.error(`   ❌ Error processing ${scheme.token}:`, error.message);
            this.results.errors.push({
                scheme: scheme.token,
                message: error.message
            });
        }
    }

    /**
     * Fetch data from a specific Google Sheet
     */
    async fetchSheetData(sheetName) {
        const url = `${this.baseGoogleSheetsUrl}/${this.spreadsheetId}/values/${sheetName}?key=${this.apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet ${sheetName}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.values || [];
    }

    /**
     * Parse column header using the specific algorithm:
     * 'skos:definition@es[0]' maps to:
     * - property: 'skos:definition'
     * - language: 'es'
     * - index: 0 (for repeatable values)
     */
    parseColumnHeader(header) {
        if (!header) return null;

        // Extract array index [n] if present
        const arrayMatch = header.match(/\[(\d+)\]$/);
        const index = arrayMatch ? parseInt(arrayMatch[1]) : 0;
        const baseHeader = arrayMatch ? header.replace(/\[\d+\]$/, '') : header;

        // Extract language @lang if present
        const langMatch = baseHeader.match(/^(.+)@([a-z]{2}(?:-[A-Z]{2})?)$/);
        const property = langMatch ? langMatch[1] : baseHeader;
        const language = langMatch ? langMatch[2] : null;

        return {
            property: property,
            language: language,
            index: index,
            original: header
        };
    }

    /**
     * Group columns by property and organize by language/index
     */
    organizeColumns(headers) {
        const columnMap = new Map();

        headers.forEach((header, colIndex) => {
            const parsed = this.parseColumnHeader(header);
            if (!parsed) return;

            if (!columnMap.has(parsed.property)) {
                columnMap.set(parsed.property, new Map());
            }

            const propertyMap = columnMap.get(parsed.property);
            const key = parsed.language || 'default';

            if (!propertyMap.has(key)) {
                propertyMap.set(key, []);
            }

            propertyMap.get(key)[parsed.index] = colIndex;
        });

        return columnMap;
    }

    /**
     * Extract values for a property considering language and repeatability
     */
    extractPropertyValues(row, propertyMap, language = null) {
        const values = [];

        // Determine which language/variant to use
        const targetKey = language || 'en' || 'default';
        let selectedArray = propertyMap.get(targetKey) || propertyMap.get('en') || propertyMap.get('default');

        // If no specific language found, try first available
        if (!selectedArray && propertyMap.size > 0) {
            selectedArray = propertyMap.values().next().value;
        }

        if (selectedArray) {
            for (let i = 0; i < selectedArray.length; i++) {
                const colIndex = selectedArray[i];
                if (colIndex !== undefined && row[colIndex]) {
                    values.push(row[colIndex].trim());
                }
            }
        }

        return values;
    }

    /**
     * Expand prefixed URI to full URI
     */
    expandUri(prefixedUri, scheme) {
        if (!prefixedUri) return prefixedUri;
        
        // If it's already a full URI, return as is
        if (prefixedUri.startsWith('http://') || prefixedUri.startsWith('https://')) {
            return prefixedUri;
        }
        
        // Check if it matches the pattern prefix:localname
        const match = prefixedUri.match(/^([^:]+):(.+)$/);
        if (match) {
            const prefix = match[1];
            const localName = match[2];
            
            // Use the scheme URI as the base namespace
            // For ISBD vocabularies, the pattern is http://iflastandards.info/ns/isbd/terms/{vocabulary}/{localname}
            if (scheme.uri && scheme.uri.includes('/ns/isbd/terms/')) {
                return `${scheme.uri}/${localName}`;
            }
        }
        
        return prefixedUri;
    }

    /**
     * Fetch concepts from a Google Sheet and parse SKOS structure
     */
    async fetchSheetConcepts(sheetName) {
        const data = await this.fetchSheetData(sheetName);
        if (data.length === 0) return [];

        const headers = data[0];
        const columnMap = this.organizeColumns(headers);
        const concepts = [];
        
        // Find the scheme for this sheet
        const scheme = this.conceptSchemes.find(s => s.token === sheetName);

        console.log(`   📊 Found columns for ${sheetName}:`, Array.from(columnMap.keys()));

        // Process each row (skip header)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];

            // Get URI (required)
            const uriValues = this.extractPropertyValues(row, columnMap.get('uri') || columnMap.get('@id') || new Map());
            if (uriValues.length === 0) continue;

            // Extract other properties
            const prefLabelValues = this.extractPropertyValues(row, columnMap.get('skos:prefLabel') || new Map(), 'en');
            const definitionValues = this.extractPropertyValues(row, columnMap.get('skos:definition') || new Map(), 'en');
            const notationValues = this.extractPropertyValues(row, columnMap.get('skos:notation') || new Map());
            const altLabelValues = this.extractPropertyValues(row, columnMap.get('skos:altLabel') || new Map(), 'en');

            // Create concept object with expanded URI
            const concept = {
                uri: this.expandUri(uriValues[0], scheme),
                prefLabel: prefLabelValues[0] || '',
                definition: definitionValues[0] || '',
                notation: notationValues[0] || '',
                altLabels: altLabelValues,
                source: 'sheet',
                rowIndex: i
            };

            // Add additional languages if available
            concept.labels = {};
            const prefLabelMap = columnMap.get('skos:prefLabel');
            if (prefLabelMap) {
                for (const [lang, colIndices] of prefLabelMap) {
                    if (lang !== 'default' && colIndices[0] !== undefined && row[colIndices[0]]) {
                        concept.labels[lang] = row[colIndices[0]].trim();
                    }
                }
            }

            concepts.push(concept);
        }

        console.log(`   📝 Parsed ${concepts.length} concepts from ${sheetName}`);
        return concepts;
    }

    /**
     * Fetch and parse RDF concepts from ISBD vocabulary
     */
    async fetchRdfConcepts(vocabUri) {
        // Try different RDF endpoint patterns
        const possibleEndpoints = [
            `${vocabUri}.rdf`,
            `${vocabUri}/rdf`,
            `${vocabUri}.xml`,
            vocabUri,
            `${vocabUri}/export.rdf`
        ];

        for (const endpoint of possibleEndpoints) {
            try {
                console.log(`   🔍 Trying RDF endpoint: ${endpoint}`);
                const response = await fetch(endpoint, {
                    headers: {
                        'Accept': 'application/rdf+xml, text/rdf+n3, application/xml, text/xml',
                        'User-Agent': 'ISBD-Comparison-Tool/1.0'
                    }
                });

                if (response.ok) {
                    const rdfText = await response.text();
                    console.log(`   ✅ Successfully fetched RDF (${rdfText.length} chars)`);
                    return this.parseRdfConcepts(rdfText, vocabUri);
                }
            } catch (error) {
                console.log(`   ⚠️  Failed to fetch from ${endpoint}: ${error.message}`);
            }
        }

        throw new Error(`Could not fetch RDF from any endpoint for ${vocabUri}`);
    }

    /**
     * Parse RDF/XML to extract SKOS concepts
     * Using basic string parsing since we're in Node.js
     */
    parseRdfConcepts(rdfText, vocabUri) {
        const concepts = [];

        // First, let's remove the ConceptScheme block to avoid confusion
        const schemeRegex = /<(?:skos:)?ConceptScheme[^>]*>.*?<\/(?:skos:)?ConceptScheme>/gs;
        const rdfWithoutScheme = rdfText.replace(schemeRegex, '');

        // Simple regex-based parsing for SKOS concepts
        // This is basic but should work for well-formed ISBD RDF
        const conceptRegex = /<(?:skos:)?Concept[^>]*(?:rdf:about|about)=["']([^"']+)["'][^>]*>(.*?)<\/(?:skos:)?Concept>/gs;

        let match;
        while ((match = conceptRegex.exec(rdfWithoutScheme)) !== null) {
            const uri = match[1];
            const conceptContent = match[2];

            const concept = {
                uri: uri,
                prefLabel: this.extractRdfProperty(conceptContent, 'prefLabel', 'en'),
                definition: this.extractRdfProperty(conceptContent, 'definition', 'en'),
                notation: this.extractRdfProperty(conceptContent, 'notation'),
                source: 'rdf'
            };

            // Extract alt labels
            concept.altLabels = this.extractRdfPropertyArray(conceptContent, 'altLabel', 'en');

            // Extract labels in other languages
            concept.labels = {};
            const langRegex = /xml:lang=["']([^"']+)["']/g;
            let langMatch;
            while ((langMatch = langRegex.exec(conceptContent)) !== null) {
                const lang = langMatch[1];
                if (lang !== 'en') {
                    const label = this.extractRdfProperty(conceptContent, 'prefLabel', lang);
                    if (label) concept.labels[lang] = label;
                }
            }

            concepts.push(concept);
        }

        console.log(`   📝 Parsed ${concepts.length} concepts from RDF`);
        return concepts;
    }

    /**
     * Extract a single property value from RDF content
     */
    extractRdfProperty(content, property, language = null) {
        let pattern;
        if (language) {
            pattern = new RegExp(`<(?:skos:)?${property}[^>]*xml:lang=["']${language}["'][^>]*>([^<]+)<`, 'i');
        } else {
            pattern = new RegExp(`<(?:skos:)?${property}[^>]*>([^<]+)<`, 'i');
        }

        const match = content.match(pattern);
        return match ? match[1].trim() : '';
    }

    /**
     * Extract array of property values from RDF content
     */
    extractRdfPropertyArray(content, property, language = null) {
        const values = [];
        let pattern;
        if (language) {
            pattern = new RegExp(`<(?:skos:)?${property}[^>]*xml:lang=["']${language}["'][^>]*>([^<]+)<`, 'gi');
        } else {
            pattern = new RegExp(`<(?:skos:)?${property}[^>]*>([^<]+)<`, 'gi');
        }

        let match;
        while ((match = pattern.exec(content)) !== null) {
            values.push(match[1].trim());
        }

        return values;
    }

    /**
     * Compare concepts from sheet vs RDF
     */
    compareConcepts(scheme, sheetConcepts, rdfConcepts) {
        const matches = [];
        const mismatches = [];
        const missing = [];

        // Create lookup map for RDF concepts
        const rdfMap = new Map();
        rdfConcepts.forEach(concept => {
            rdfMap.set(concept.uri, concept);
        });

        // Compare each sheet concept
        sheetConcepts.forEach(sheetConcept => {
            const rdfConcept = rdfMap.get(sheetConcept.uri);

            if (!rdfConcept) {
                missing.push({
                    scheme: scheme.token,
                    uri: sheetConcept.uri,
                    prefLabel: sheetConcept.prefLabel,
                    issue: 'Not found in RDF',
                    rowIndex: sheetConcept.rowIndex,
                    debug: `Looking for: ${sheetConcept.uri}`
                });
                return;
            }

            // Compare properties
            const comparison = {
                scheme: scheme.token,
                uri: sheetConcept.uri,
                rowIndex: sheetConcept.rowIndex,
                prefLabelMatch: this.normalizeText(sheetConcept.prefLabel) === this.normalizeText(rdfConcept.prefLabel),
                definitionMatch: this.normalizeText(sheetConcept.definition) === this.normalizeText(rdfConcept.definition),
                notationMatch: sheetConcept.notation === rdfConcept.notation,
                sheetValues: {
                    prefLabel: sheetConcept.prefLabel,
                    definition: sheetConcept.definition,
                    notation: sheetConcept.notation,
                    labels: sheetConcept.labels || {}
                },
                rdfValues: {
                    prefLabel: rdfConcept.prefLabel,
                    definition: rdfConcept.definition,
                    notation: rdfConcept.notation,
                    labels: rdfConcept.labels || {}
                }
            };

            if (comparison.prefLabelMatch && comparison.definitionMatch && comparison.notationMatch) {
                matches.push(comparison);
            } else {
                mismatches.push(comparison);
            }

            // Remove from RDF map to track what's left
            rdfMap.delete(sheetConcept.uri);
        });

        // Any remaining RDF concepts are missing from sheet
        rdfMap.forEach(rdfConcept => {
            missing.push({
                scheme: scheme.token,
                uri: rdfConcept.uri,
                prefLabel: rdfConcept.prefLabel,
                issue: 'Not found in sheet'
            });
        });

        return { matches, mismatches, missing };
    }

    /**
     * Normalize text for comparison (trim, lowercase, normalize whitespace)
     */
    normalizeText(text) {
        if (!text) return '';
        return text.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    /**
     * Generate comprehensive comparison report
     */
    generateReport() {
        console.log('\n📊 COMPARISON REPORT');
        console.log('='.repeat(50));

        const totalSchemes = this.conceptSchemes.filter(s => s.hasRdf).length;
        const totalMatches = this.results.matches.length;
        const totalMismatches = this.results.mismatches.length;
        const totalMissing = this.results.missing.length;
        const totalErrors = this.results.errors.length;

        console.log(`📋 Concept Schemes Processed: ${totalSchemes}`);
        console.log(`✅ Perfect Matches: ${totalMatches}`);
        console.log(`⚠️  Mismatches: ${totalMismatches}`);
        console.log(`❌ Missing: ${totalMissing}`);
        console.log(`🚨 Errors: ${totalErrors}`);

        // Detailed mismatch report
        if (totalMismatches > 0) {
            console.log('\n⚠️  DETAILED MISMATCHES:');
            this.results.mismatches.forEach(mismatch => {
                console.log(`\n${mismatch.scheme} - Row ${mismatch.rowIndex} - ${mismatch.uri}`);
                if (!mismatch.prefLabelMatch) {
                    console.log(`  📝 Label: "${mismatch.sheetValues.prefLabel}" vs "${mismatch.rdfValues.prefLabel}"`);
                }
                if (!mismatch.definitionMatch) {
                    console.log(`  📖 Definition mismatch (lengths: ${mismatch.sheetValues.definition.length} vs ${mismatch.rdfValues.definition.length})`);
                }
                if (!mismatch.notationMatch) {
                    console.log(`  🔢 Notation: "${mismatch.sheetValues.notation}" vs "${mismatch.rdfValues.notation}"`);
                }
            });
        }

        // Missing concepts report
        if (totalMissing > 0) {
            console.log('\n❌ MISSING CONCEPTS:');
            this.results.missing.forEach(missing => {
                const rowInfo = missing.rowIndex ? ` (Row ${missing.rowIndex})` : '';
                console.log(`  ${missing.scheme}${rowInfo}: ${missing.prefLabel} - ${missing.issue}`);
            });
        }

        // Error report
        if (totalErrors > 0) {
            console.log('\n🚨 ERRORS:');
            this.results.errors.forEach(error => {
                console.log(`  ${error.scheme || 'General'}: ${error.message}`);
            });
        }

        return this.results;
    }
}

// Main execution function
async function runISBDComparison() {
    // Load configuration from environment
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.SPREADSHEET_ID || '1_QI2DqNomn0jCqSdjOxCZVF6wxz6FuRuIKBMweaGmfQ';

    if (!apiKey) {
        console.error('❌ GOOGLE_SHEETS_API_KEY not found in .env file');
        process.exit(1);
    }

    // Create and run comparison
    const tool = new ISBDComparisonTool(apiKey, spreadsheetId);
    const results = await tool.runComparison();

    return results;
}

// Run if this file is executed directly
if (require.main === module) {
    runISBDComparison()
        .then(results => {
            console.log('\n🎉 Comparison completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { ISBDComparisonTool, runISBDComparison };