/**
 * TruthBridge — Age Detector
 *
 * Flow:
 * 1. Convert file to Base64
 * 2. Send Base64 to /api/detect-age
 * 3. Return age group prediction
 */

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export async function detectAge(file) {
  if (!file) {
    return { detected: false, error: 'No file provided' };
  }

  try {
    const base64String = await fileToBase64(file);

    const response = await fetch('/api/detect-age', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64String }),
    });

    if (!response.ok) {
      console.error('Age detection API error:', response.status);
      return { detected: false, error: 'Service unavailable' };
    }

    const data = await response.json();
    console.log('[Age Detection] Result:', data);

    if (!data.detected) {
      return { detected: false, error: data.error || 'Detection failed' };
    }

    return {
      detected: true,
      ageGroup: data.ageGroup,
      confidence: data.confidence,
      allPredictions: data.allPredictions,
    };
  } catch (error) {
    console.error('Age detection error:', error);
    return { detected: false, error: error.message };
  }
}