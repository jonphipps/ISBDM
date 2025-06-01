# DCTAP Profile Comparison

## Properties in Hard-coded CONCEPT_PROFILE vs Actual DCTAP File

### Properties in Both (comparing mandatory/repeatable status):

| Property | Hard-coded Mandatory | DCTAP Mandatory | Hard-coded Repeatable | DCTAP Repeatable | Match? |
|----------|---------------------|-----------------|----------------------|------------------|---------|
| skos:inScheme | TRUE | TRUE | FALSE | FALSE | ✅ |
| rdf:type | TRUE | TRUE | FALSE | FALSE | ✅ |
| skos:prefLabel | TRUE | TRUE | TRUE | TRUE | ✅ |
| skos:altLabel | FALSE | FALSE | TRUE | TRUE | ✅ |
| skos:definition | FALSE | FALSE | TRUE | TRUE | ✅ |
| skos:scopeNote | FALSE | FALSE | TRUE | TRUE | ✅ |
| skos:notation | FALSE | FALSE | TRUE | TRUE | ✅ |
| skos:example | FALSE | FALSE | TRUE | TRUE | ✅ |
| skos:changeNote | FALSE | FALSE | TRUE | TRUE | ✅ |
| skos:historyNote | FALSE | FALSE | TRUE | TRUE | ✅ |
| skos:editorialNote | FALSE | FALSE | TRUE | TRUE | ✅ |
| skos:topConceptOf | TRUE | TRUE | FALSE | FALSE | ✅ |

### Additional Details:

#### Hard-coded valueConstraint differences:
- rdf:type: Hard-coded has valueConstraint='skos:Concept', DCTAP has the same
- skos:prefLabel: DCTAP has valueConstraint='Unique lang tags per item', hard-coded mentions it in note

#### valueDataType comparison:
- Hard-coded uses 'langString' for language-tagged properties
- DCTAP CSV also uses 'langString' for the same properties
- skos:notation: Both use 'string' (not langString)

### Properties that exist in DCTAP but might be handled differently:
- The DCTAP file includes 'uri' property handling (implicit in the system)
- The DCTAP includes references to parent shapes (ConceptScheme)

### Conclusion:
The hard-coded CONCEPT_PROFILE appears to accurately reflect the DCTAP file structure for the Concept shape. All properties, mandatory/repeatable flags, and data types match correctly.