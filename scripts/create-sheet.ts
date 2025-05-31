// scripts/create-sheet.ts
import { google } from 'googleapis';

const creds = JSON.parse(
    Buffer.from(process.env.GSHEETS_SA_KEY!, 'base64').toString('utf8')
);

const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file' // <- this is key
    ]
});

const drive = google.drive({ version: 'v3', auth });

const res = await drive.files.create({
    requestBody: {
        name: 'New RDF Element Sheet',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        // Optional: link it to a shared folder
        parents: ['SHARED_FOLDER_ID'],
    },
    fields: 'id, webViewLink',
});

console.log('Spreadsheet created:', res.data.webViewLink);
