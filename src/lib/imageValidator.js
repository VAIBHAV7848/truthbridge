/**
 * TruthBridge — Image Validator
 * 
 * Validates images using Hive API via Supabase Edge Function.
 * Uses direct Supabase URL to bypass Vercel JWT rewrite.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

const VALIDATE_API_KEY = 'tb-validate-2026';
const CONFIDENCE_THRESHOLD = 0.75;

// Direct Supabase URL (bypass Vercel rewrite which adds JWT)
const EDGE_FUNCTION_URL = `https://gacrmgjzdlknsfhsfpvb.supabase.co/functions/v1/validate-image`;

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
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
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