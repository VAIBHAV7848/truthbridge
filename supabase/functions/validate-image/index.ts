/**
 * TruthBridge — Validate Image Edge Function
 * 
 * Proxies to Hive API for AI-generated content detection.
 * Uses custom x-api-key header for auth.
 */

const HIVE_API_URL = 'https://api.thehive.ai/api/v1/task/sync';
const HIVE_API_KEY = Deno.env.get('HIVE_API_KEY');
const VALIDATE_API_KEY = Deno.env.get('VALIDATE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  console.log('Validate-image function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    console.log('API Key present:', !!apiKey);
    
    if (!apiKey || apiKey !== VALIDATE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid API key', received: !!apiKey }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Hive API Key present:', !!HIVE_API_KEY);

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

    console.log('Image received:', image.name, image.size);

    // Read image as blob
    const imageBuffer = await image.arrayBuffer();
    const blob = new Blob([imageBuffer], { type: image.type });
    
    console.log('Image blob created:', blob.size, blob.type);

    const hiveFormData = new FormData();
    hiveFormData.append('media', blob, image.name);
    hiveFormData.append('models', JSON.stringify(['ai_generated_media']));

    console.log('Calling Hive API...');

    const response = await fetch(HIVE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HIVE_API_KEY}`,
      },
      body: hiveFormData,
    });

    console.log('Hive API response:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hive API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Validation service error', details: errorText }),
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
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});