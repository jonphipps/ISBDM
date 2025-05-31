// scripts/sheets-utils.ts
import { google } from 'googleapis';

export async function getSheet(tabId: string, range: string) {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(Buffer.from(process.env.GSHEETS_SA_KEY!, 'base64').toString('utf8')),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: tabId, range });
    return data.values ?? [];
}

export async function putSheet(tabId: string, range: string, rows: any[][]) {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(Buffer.from(process.env.GSHEETS_SA_KEY!, 'base64').toString('utf8')),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
        spreadsheetId: tabId,
        range,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
    });
}
