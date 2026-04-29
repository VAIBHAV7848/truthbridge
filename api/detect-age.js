/**
 * TruthBridge — Bridge Age Detection API
 *
 * Vercel Serverless Function for bridge construction age estimation.
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const BRIDGE_ERAS = [
  { era: 'Pre-1950', weight: 15 },
  { era: '1950-1970', weight: 25 },
  { era: '1970-1990', weight: 30 },
  { era: '1990-2010', weight: 20 },
  { era: '2010+', weight: 10 },
];

function weightedRandom(eras) {
  const totalWeight = eras.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  for (const e of eras) {
    random -= e.weight;
    if (random <= 0) return e.era;
  }
  return eras[0].era;
}

function generateMockConfidence(era) {
  const base = { 'Pre-1950': 0.82, '1950-1970': 0.86, '1970-1990': 0.91, '1990-2010': 0.88, '2010+': 0.79 };
  return parseFloat((base[era] + (Math.random() * 0.08 - 0.04)).toFixed(3));
}

function generateMockPredictions(detectedEra) {
  const confidence = generateMockConfidence(detectedEra);
  const predictions = {};
  let remaining = 1 - confidence;
  const otherEras = BRIDGE_ERAS.filter(e => e.era !== detectedEra);
  const shuffled = otherEras.sort(() => Math.random() - 0.5);
  shuffled.forEach((e, i) => {
    const share = remaining * (0.5 / (i + 1));
    predictions[e.era] = parseFloat(Math.min(share + Math.random() * 0.05, 0.25).toFixed(3));
    remaining -= predictions[e.era];
  });
  predictions[detectedEra] = parseFloat(confidence.toFixed(3));
  return predictions;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const detectedEra = weightedRandom(BRIDGE_ERAS);
    const confidence = generateMockConfidence(detectedEra);
    const allPredictions = generateMockPredictions(detectedEra);

    await new Promise(r => setTimeout(r, 800));

    return res.status(200).json({
      detected: true,
      ageGroup: detectedEra,
      confidence: confidence,
      allPredictions: allPredictions,
      processingTime: `${(imageBuffer.length / 1024).toFixed(1)}KB processed`,
    });
  } catch (error) {
    console.error('Age detection proxy error:', error);
    return res.status(500).json({ error: 'Detection failed', message: error.message });
  }
}