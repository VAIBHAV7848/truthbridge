/**
 * TruthBridge — Validate Image Edge Function
 * 
 * Receives image from frontend, validates via Hive API server-side.
 * Returns AI-generated detection results.
 * 
 * Deploy: supabase functions deploy validate-image
 * Note: Set HIVE_API_KEY in Supabase Edge Functions secrets
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HIVE_API_URL = 'https://api.thehive.ai/api/v1/task/sync';
const HIVE_API_KEY = Deno.env.get('HIVE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key is configured
    if (!HIVE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Hive API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the form data
    const formData = await req.formData();
    const image = formData.get('media');

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create form data for Hive API
    const hiveFormData = new FormData();
    hiveFormData.append('media', image);
    hiveFormData.append('models', JSON.stringify(['ai_generated_media']));

    // Call Hive API server-side (no CORS issues)
    const response = await fetch(HIVE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HIVE_API_KEY}`,
      },
      body: hiveFormData,
    });

    if (!response.ok) {
      console.error('Hive API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Validation service error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    console.log('Hive result:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});