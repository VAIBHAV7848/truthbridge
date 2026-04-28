/**
 * TruthBridge — Image Validator
 * 
 * Uses Hive Moderation API to detect AI-generated images.
 * If AI-generated content is detected, report submission is rejected.
 * 
 * Docs: https://docs.thehive.ai/docs/ai-generated-image-and-video-detection-1
 */

const HIVE_API_URL = 'https://api.thehive.ai/api/v1/task/sync';
const HIVE_API_KEY = import.meta.env.VITE_HIVE_API_KEY;

/**
 * Validate an image using Hive API.
 * 
 * @param {File} file - The image file to validate
 * @param {number} confidenceThreshold - Min confidence to consider AI-generated (0-1)
 * @returns {Promise<{valid: boolean, message: string, details?: object}>}
 */
export async function validateImage(file, confidenceThreshold = 0.8) {
  // If no API key configured, skip validation (allow for demo/dev)
  if (!HIVE_API_KEY || HIVE_API_KEY === 'your_hive_api_key_here') {
    console.warn('Hive API key not configured - skipping image validation');
    return { valid: true, message: 'Validation skipped (no API key)' };
  }

  // If no file, skip
  if (!file) {
    return { valid: true, message: 'No file to validate' };
  }

  try {
    // Create form data with the image
    const formData = new FormData();
    formData.append('media', file);
    formData.append('models', JSON.stringify(['ai_generated_media']));

    const response = await fetch(HIVE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HIVE_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Hive API error:', response.status);
      // Allow upload if API is down (fail-open for demo)
      return { valid: true, message: 'Validation service unavailable' };
    }

    const data = await response.json();
    
    // Parse response
    // Hive returns: { status: "complete", result: { is_ai_generated: boolean, generator: string, confidence: number } }
    const result = data?.result;
    
    if (!result) {
      console.warn('No result from Hive API');
      return { valid: true, message: 'Could not analyze image' };
    }

    // Check if AI-generated with sufficient confidence
    const isAIGenerated = result.is_ai_generated === true || result.is_ai_generated === 'true';
    const confidence = result.confidence || 0;

    if (isAIGenerated && confidence >= confidenceThreshold) {
      return {
        valid: false,
        message: 'AI-generated images are not allowed. Please upload original photos of the bridge damage only.',
        details: {
          confidence: Math.round(confidence * 100) + '%',
          generator: result.generator || 'Unknown AI',
        }
      };
    }

    // Image is clean
    return {
      valid: true,
      message: 'Image verified as original',
      details: { confidence: Math.round((1 - confidence) * 100) + '%' }
    };

  } catch (error) {
    console.error('Image validation error:', error);
    // Allow upload on error (fail-open for demo)
    return { valid: true, message: 'Validation check failed - allowing upload' };
  }
}

/**
 * Simple EXIF metadata check as fallback/quick validation
 * AI-generated images often lack EXIF data or have specific patterns
 * 
 * @param {File} file
 * @returns {Promise<{valid: boolean, reason: string}>}
 */
export async function checkEXIFMetadata(file) {
  return new Promise((resolve) => {
    // Quick file analysis without parsing EXIF (keeping it simple for hackathon)
    // AI images typically have specific file patterns
    const fileName = file.name.toLowerCase();
    
    // Check for common AI image file naming patterns
    if (fileName.includes('ai_') || fileName.includes('generated') || fileName.includes('fake')) {
      resolve({ valid: false, reason: 'Suspicious filename detected' });
      return;
    }
    
    // Check file size patterns (AI images often have specific sizes)
    // Very small or very round file sizes can indicate AI generation
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB < 0.01) {
      resolve({ valid: false, reason: 'File too small to be a real photo' });
      return;
    }
    
    resolve({ valid: true, reason: 'Basic checks passed' });
  });
}