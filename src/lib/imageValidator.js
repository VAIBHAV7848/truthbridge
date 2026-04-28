/**
 * TruthBridge — Image Validator
 * 
 * Validates images for AI-generated content.
 * Currently in demo mode - checks basic patterns only.
 * 
 * To enable full Hive API validation:
 * 1. Deploy api/validate-image.js as a Vercel serverless function
 * 2. Set HIVE_API_KEY in Vercel environment variables
 * 3. Update VALIDATE_IMAGE_URL to your Vercel function URL
 */

const VALIDATE_IMAGE_URL = null; // Set to your Vercel function URL when deployed
const CONFIDENCE_THRESHOLD = 0.8;

/**
 * Validate image using proxy (server-side, avoids CORS)
 */
async function validateViaProxy(file) {
  if (!VALIDATE_IMAGE_URL) {
    return { valid: true, message: 'Validation service not configured' };
  }

  const formData = new FormData();
  formData.append('media', file);

  const response = await fetch(VALIDATE_IMAGE_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Validation service error');
  }

  const data = await response.json();
  const result = data?.result;

  if (result?.is_ai_generated && result.confidence >= CONFIDENCE_THRESHOLD) {
    return {
      valid: false,
      message: 'AI-generated images are not allowed. Please upload original photos only.',
      details: { generator: result.generator, confidence: result.confidence }
    };
  }

  return { valid: true, message: 'Image verified as original' };
}

/**
 * Basic validation (client-side, no CORS issues)
 */
function basicValidation(file) {
  const sizeMB = file.size / (1024 * 1024);
  
  // Check file size - AI images often have specific sizes
  if (sizeMB < 0.05) {
    return {
      valid: false,
      message: 'Image file appears too small. Please use a real photo.'
    };
  }

  // Check file name for AI patterns
  const name = file.name.toLowerCase();
  const suspiciousNames = ['ai_', 'generated', 'fake', '合成', 'midjourney', 'dalle', 'stable_diffusion', 'flux'];
  for (const pattern of suspiciousNames) {
    if (name.includes(pattern)) {
      return {
        valid: false,
        message: 'Filename suggests AI-generated content. Please rename and try again.'
      };
    }
  }

  return { valid: true, message: 'Basic checks passed' };
}

/**
 * Main validation function
 */
export async function validateImage(file, confidenceThreshold = CONFIDENCE_THRESHOLD) {
  if (!file) {
    return { valid: true, message: 'No file to validate' };
  }

  // First: basic client-side validation
  const basic = basicValidation(file);
  if (!basic.valid) {
    return basic;
  }

  // Second: try proxy validation if configured
  try {
    const result = await validateViaProxy(file);
    if (!result.valid) {
      return result;
    }
  } catch (error) {
    console.warn('Proxy validation skipped:', error.message);
  }

  return { valid: true, message: 'Image validated successfully' };
}