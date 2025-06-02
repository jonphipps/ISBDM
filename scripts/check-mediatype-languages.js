import dotenv from 'dotenv';
import langdetect from 'langdetect';

dotenv.config();

async function checkAllSheets() {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = '1_QI2DqNomn0jCqSdjOxCZVF6wxz6FuRuIKBMweaGmfQ';
    
    // First get the list of sheets from index
    const indexUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/index?key=${apiKey}`;
    const indexResponse = await fetch(indexUrl);
    const indexData = await indexResponse.json();
    
    const sheets = [];
    for (let i = 1; i < indexData.values.length; i++) {
        const row = indexData.values[i];
        const token = row[0];
        const uri = row[3];
        if (token && uri && uri.startsWith('http') && !token.includes(':')) {
            sheets.push(token);
        }
    }
    
    console.log('Checking sheets:', sheets.join(', '));
    console.log('\n=== LANGUAGE MISMATCHES FOUND ===\n');
    
    let totalMismatches = 0;
    
    for (const sheetName of sheets) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.values || data.values.length < 2) continue;
            
            const headers = data.values[0];
            const mismatches = [];
            
            // Process each row
            for (let rowIdx = 1; rowIdx < data.values.length; rowIdx++) {
                const row = data.values[rowIdx];
                const uri = row[0];
                
                // Check each column
                for (let colIdx = 0; colIdx < headers.length; colIdx++) {
                    const header = headers[colIdx];
                    const value = row[colIdx];
                    
                    if (!header || !value || !value.trim()) continue;
                    
                    // Extract language from header
                    const langMatch = header.match(/@([a-z]{2}(?:-[A-Z]{2})?)/);
                    if (!langMatch) continue;
                    
                    const declaredLang = langMatch[1];
                    const text = value.trim();
                    
                    // Skip short text
                    if (text.length < 10) continue;
                    
                    // Detect language
                    try {
                        const detected = langdetect.detect(text);
                        if (detected && detected.length > 0) {
                            const detectedLang = detected[0].lang;
                            const confidence = detected[0].prob;
                            
                            // Check for mismatches with high confidence
                            if (confidence > 0.9) {
                                // Special check for Chinese
                                const isChinese = /[\u4e00-\u9fa5]/.test(text);
                                
                                // Only report if there's a mismatch
                                if ((isChinese && declaredLang !== 'zh') || 
                                    (!isChinese && detectedLang !== declaredLang && 
                                     !(declaredLang === 'zh' && detectedLang.startsWith('zh')))) {
                                    mismatches.push({
                                        row: rowIdx + 1,
                                        uri: uri,
                                        column: header,
                                        declared: declaredLang,
                                        detected: isChinese ? 'zh' : detectedLang,
                                        confidence: confidence,
                                        text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        // Ignore detection errors
                    }
                }
            }
            
            if (mismatches.length > 0) {
                console.log(`\n${sheetName.toUpperCase()} (${mismatches.length} mismatches):`);
                console.log('-'.repeat(80));
                
                mismatches.forEach(m => {
                    console.log(`Row ${m.row} (${m.uri})`);
                    console.log(`  Column: ${m.column}`);
                    console.log(`  Declared: ${m.declared}, Detected: ${m.detected} (${(m.confidence * 100).toFixed(1)}%)`);
                    console.log(`  Text: "${m.text}"`);
                    console.log('');
                });
                
                totalMismatches += mismatches.length;
            }
            
        } catch (error) {
            console.error(`Error processing ${sheetName}:`, error.message);
        }
    }
    
    console.log(`\n=== TOTAL: ${totalMismatches} language mismatches found ===`);
}

checkAllSheets().catch(console.error);