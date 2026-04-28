/**
 * TruthBridge — Image Validator
 * 
 * Flow:
 * 1. Upload image to Supabase Storage (public bucket)
 * 2. Send public URL to Hive API
 * 3. Reject if AI-generated
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

const HIVE_API_URL = 'https://api.hivemoderation.com/api/v1/task/sync';
const HIVE_API_KEY = 'MaOwSJRudzFJPzGZdveRGg==';
const CONFIDENCE_THRESHOLD = 0.75;

export async function validateImage(file) {
  if (!file) {
    return { valid: true, message: 'No file to validate' };
  }

  try {
    // Step 1: Upload to Supabase Storage
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
    const filePath = `temp/${fileName}`;

    const { error: uploadError } = await fetch(`${SUPABASE_URL}/storage/v1/object/report-photos/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'x-upsert': 'true',
        'Content-Type': file.type,
      },
      body: file,
    });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { valid: true, message: 'Validation skipped - upload failed' };
    }

    // Step 2: Get public URL
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/report-photos/${filePath}`;

    // Step 3: Send to Hive API
    const response = await fetch(HIVE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${HIVE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: imageUrl,
        models: ['ai_generated_media'],
      }),
    });

    if (!response.ok) {
      console.error('Hive API error:', response.status);
      return { valid: true, message: 'Validation skipped - service unavailable' };
    }

    const data = await response.json();
    console.log('[Validate] Hive result:', data);

    const result = data?.result;

    if (!result) {
      return { valid: true, message: 'Could not analyze image' };
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
          generator: result.generator,
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