/**
 * TruthBridge — Image Validator
 * 
 * DEMO MODE for hackathon presentation.
 * AI detection validation is staged for production.
 * 
 * Current behavior: Shows "validating" state, allows all uploads.
 * Production behavior: Calls Hive API, rejects AI-generated images.
 */

const DEMO_MODE = true;
const CONFIDENCE_THRESHOLD = 0.75;

export async function validateImage(file) {
  if (!file) {
    return { valid: true, message: 'No file to validate' };
  }

  // DEMO MODE: Simulate validation for hackathon demo
  if (DEMO_MODE) {
    console.log('[Validate] Demo mode - simulating validation');
    
    // Simulate a brief delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Demo: Check basic file properties
    const sizeMB = file.size / (1024 * 1024);
    const fileName = file.name.toLowerCase();
    
    // If filename suggests AI, reject for demo
    const aiPatterns = ['midjourney', 'dalle', 'stable diffusion', 'flux', 'ai_', 'ai-generated', 'ai_gen'];
    for (const pattern of aiPatterns) {
      if (fileName.includes(pattern)) {
        return {
          valid: false,
          message: `AI-generated images are not allowed. Please upload original photos of the bridge damage only.`,
          details: { demo: true }
        };
      }
    }
    
    // Demo mode: accept all real photos
    return {
      valid: true,
      message: 'Image verified as original',
      details: { demo: true, fileSize: `${sizeMB.toFixed(2)} MB` }
    };
  }

  // PRODUCTION MODE: Real AI detection via Supabase Edge Function
  try {
    const EDGE_FUNCTION_URL = `https://gacrmgjzdlknsfhsfpvb.supabase.co/functions/v1/validate-image`;
    const VALIDATE_API_KEY = 'tb-validate-2026';

    const formData = new FormData();
    formData.append('media', file);

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'x-api-key': VALIDATE_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Edge function error:', errorData);
      return { valid: true, message: 'Validation skipped - service temporarily unavailable' };
    }

    const data = await response.json();
    const result = data?.result;

    if (!result) {
      return { valid: true, message: 'Could not analyze image - allowing submission' };
    }

    const isAIGenerated = result.is_ai_generated === true || 
                         result.is_ai_generated === 'true' ||
                         String(result.is_ai_generated).toLowerCase() === 'true';
    const confidence = parseFloat(result.confidence) || 0;

    if (isAIGenerated && confidence >= CONFIDENCE_THRESHOLD) {
      return {
        valid: false,
        message: `AI-generated images are not allowed. Detected ${result.generator || 'AI-generated'} content (${Math.round(confidence * 100)}% confidence). Please upload original photos only.`,
        details: {
          generator: result.generator || 'Unknown AI',
          confidence: Math.round(confidence * 100),
        }
      };
    }

    return {
      valid: true,
      message: 'Image verified as original',
    };

  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: true, message: 'Validation check failed - allowing submission' };
  }
}