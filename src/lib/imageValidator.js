/**
 * TruthBridge — Image Validator
 * 
 * Validates images using Hive API via Supabase Edge Function.
 * Detects AI-generated content and rejects it.
 * 
 * Flow:
 * 1. Upload image to Supabase Edge Function
 * 2. Edge Function calls Hive API (server-side, no CORS)
 * 3. Returns detection result
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/validate-image`;
const VALIDATE_API_KEY = 'tb-validate-2026'; // Simple API key for validation
const CONFIDENCE_THRESHOLD = 0.75;

/**
 * Validate image via Supabase Edge Function
 * @param {File} file - The image file to validate
 * @returns {Promise<{valid: boolean, message: string, details?: object}>}
 */
export async function validateImage(file) {
  if (!file) {
    return { valid: true, message: 'No file to validate' };
  }

  try {
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
    console.log('Validation result:', data);

    const result = data?.result;

    if (!result) {
      console.warn('No result from Hive API');
      return { valid: true, message: 'Could not analyze image - allowing submission' };
    }

    const isAIGenerated = result.is_ai_generated === true || 
                         result.is_ai_generated === 'true' ||
                         String(result.is_ai_generated).toLowerCase() === 'true';
    const confidence = parseFloat(result.confidence) || 0;

    if (isAIGenerated && confidence >= CONFIDENCE_THRESHOLD) {
      return {
        valid: false,
        message: `AI-generated images are not allowed. Detected ${result.generator || 'AI-generated'} content (${Math.round(confidence * 100)}% confidence). Please upload original photos of the bridge damage only.`,
        details: {
          generator: result.generator || 'Unknown AI',
          confidence: Math.round(confidence * 100),
        }
      };
    }

    return {
      valid: true,
      message: 'Image verified as original',
      details: {
        confidence: Math.round((1 - confidence) * 100) + '%',
      }
    };

  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: true, message: 'Validation check failed - allowing submission' };
  }
}