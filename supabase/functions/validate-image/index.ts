/**
 * TruthBridge — Validate Image Edge Function
 * 
 * Proxies to Hive API without JWT requirement.
 * Uses custom x-api-key header for auth.
 */

const HIVE_API_URL = 'https://api.thehive.ai/api/v1/task/sync';
const HIVE_API_KEY = Deno.env.get('HIVE_API_KEY');
const VALIDATE_API_KEY = Deno.env.get('VALIDATE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify custom API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== VALIDATE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!HIVE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Hive API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const image = formData.get('media');

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hiveFormData = new FormData();
    hiveFormData.append('media', image);
    hiveFormData.append('models', JSON.stringify(['ai_generated_media']));

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