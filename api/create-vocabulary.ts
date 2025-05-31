// api/create-vocabulary.ts
// Serverless function for Vercel/Netlify to trigger GitHub Actions

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileType, vocabularyName, title, description, languages } = req.body;

    // Validate input
    if (!profileType || !vocabularyName || !title || !description || !languages || languages.length === 0) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate vocabulary name format
    if (!/^[a-z0-9-]+$/.test(vocabularyName)) {
      return res.status(400).json({ error: 'Vocabulary name must contain only lowercase letters, numbers, and hyphens' });
    }

    // GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return res.status(500).json({ error: 'GitHub token not configured' });
    }

    // Repository info
    const owner = process.env.GITHUB_OWNER || 'your-org';
    const repo = process.env.GITHUB_REPO || 'ISBDM';

    // Trigger GitHub Actions workflow via repository dispatch
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        event_type: 'create-vocabulary',
        client_payload: {
          profileType,
          vocabularyName,
          title,
          description,
          languages
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error:', error);
      return res.status(500).json({ error: 'Failed to trigger workflow' });
    }

    // Return success
    // Note: The actual spreadsheet URL will be posted as a comment on an issue or available in the workflow run
    return res.status(200).json({ 
      success: true, 
      message: 'Vocabulary creation initiated. Check GitHub Actions for progress.',
      workflowUrl: `https://github.com/${owner}/${repo}/actions`
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}