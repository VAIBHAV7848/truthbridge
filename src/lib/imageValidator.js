/**
 * TruthBridge — Image Validator
 * 
 * Flow:
 * 1. Convert file to Base64
 * 2. Send Base64 to our Vercel Serverless proxy (/api/validate-image)
 * 3. Proxy checks Hugging Face AI detection model securely
 * 4. Reject if AI-generated
 */

const CONFIDENCE_THRESHOLD = 0.75;

// Helper to convert file to base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

export async function validateImage(file) {
  if (!file) {
    return { valid: true, message: 'No file to validate' };
  }

  try {
    const base64String = await fileToBase64(file);

    const response = await fetch('/api/validate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64String }),
    });

    if (!response.ok) {
      console.error('API Proxy error:', response.status);
      return { valid: true, message: 'Validation skipped - service unavailable' };
    }

    const data = await response.json();
    console.log('[Validate] Hugging Face result:', data);

    // Hugging face returns an array: [{ label: 'AI', score: 0.99 }, { label: 'Real', score: 0.01 }]
    if (!Array.isArray(data) || data.length === 0) {
      // In case of rate limits or Hugging Face errors, data might not be an array
      if (data.error && data.error.includes("loading")) {
          // Model is loading on Hugging Face, let it pass or wait
          return { valid: true, message: 'Model loading, allowing submission' };
      }
      return { valid: true, message: 'Could not analyze image' };
    }

    // Sort by highest score first
    const topResult = data.sort((a, b) => b.score - a.score)[0];

    // Check if the top guess implies AI or Fake
    const label = topResult.label.toLowerCase();
    const isAIGenerated = label.includes('ai') || label.includes('fake') || label.includes('generated');

    if (isAIGenerated && topResult.score >= CONFIDENCE_THRESHOLD) {
      return {
        valid: false,
        message: `AI-generated images are not allowed (${Math.round(topResult.score * 100)}% confidence). Please upload original photos only.`,
        details: {
          generator: 'AI Model',
          confidence: Math.round(topResult.score * 100),
        }
      };
    }

    return {
      valid: true,
      message: 'Image verified as original',
    };

  } catch (error) {
    console.error('Image validation error:', error);
    // If it fails, let the user upload anyway so we don't block legitimate users
    return { valid: true, message: 'Validation check failed - allowing submission' };
  }
}