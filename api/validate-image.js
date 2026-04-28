/**
 * TruthBridge — Image Validation Proxy
 * 
 * Vercel Serverless Function to proxy Hive API calls.
 * Avoids CORS issues by calling from server-side.
 */

const HIVE_API_URL = 'https://api.thehive.ai/api/v1/task/sync';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const HIVE_API_KEY = process.env.HIVE_API_KEY;
  
  if (!HIVE_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const formData = await req.formData();
    const image = formData.get('media');

    if (!image) {
      return res.status(400).json({ error: 'No image' });
    }

    // Forward to Hive
    const proxyFormData = new FormData();
    proxyFormData.append('media', image);
    proxyFormData.append('models', JSON.stringify(['ai_generated_media']));

    const response = await fetch(HIVE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HIVE_API_KEY}`,
      },
      body: proxyFormData,
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Validation failed' });
  }
}