/**
 * TruthBridge — Image Validation Proxy
 * 
 * Vercel Serverless Function to proxy Hugging Face API calls.
 * Avoids CORS issues by calling from server-side and keeps token secure.
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const HUGGING_FACE_API_URL = 'https://router.huggingface.co/hf-inference/models/dima806/ai_vs_real_image_detection';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
  
  if (!HUGGING_FACE_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert base64 back to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Hugging Face API Error:', errText);
      return res.status(502).json({ error: 'Hugging Face API failed', details: errText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Validation failed', message: error.message });
  }
}