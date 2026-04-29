/**
 * TruthBridge — Age Detection Proxy
 *
 * Vercel Serverless Function to proxy Hugging Face API calls for age detection.
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const HUGGING_FACE_API_URL = 'https://router.huggingface.co/hf-inference/models/prithivMLmods/open-age-detection';

const ID2LABEL = {
  '0': 'Child 0-12',
  '1': 'Teenager 13-20',
  '2': 'Adult 21-44',
  '3': 'Middle Age 45-64',
  '4': 'Aged 65+',
};

export default async function handler(req, res) {
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

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
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

    if (data.error) {
      return res.status(200).json({
        detected: false,
        error: data.error,
      });
    }

    const logits = data.logits || data.scores;
    if (!logits || !Array.isArray(logits)) {
      return res.status(200).json({
        detected: false,
        error: 'Invalid model response',
      });
    }

    const values = logits.map((v) => (Array.isArray(v) ? v[0] : v));

    const maxLogit = Math.max(...values);
    const exps = values.map((v) => Math.exp(v - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map((e) => e / sumExps);

    const maxIdx = probs.indexOf(Math.max(...probs));
    const maxProb = probs[maxIdx];

    const result = {
      detected: true,
      ageGroup: ID2LABEL[maxIdx.toString()] || `Class ${maxIdx}`,
      confidence: parseFloat(maxProb.toFixed(3)),
      allPredictions: Object.fromEntries(
        Object.entries(ID2LABEL).map(([id, label]) => [label, parseFloat(probs[parseInt(id)].toFixed(3))])
      ),
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Age detection proxy error:', error);
    return res.status(500).json({ error: 'Detection failed', message: error.message });
  }
}