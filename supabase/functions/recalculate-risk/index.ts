/**
 * TruthBridge — Edge Function: Recalculate Risk Score
 *
 * Called by a cron job or after a new report is submitted.
 * Uses the service role key (server-side only) to bypass RLS.
 *
 * Deploy: supabase functions deploy recalculate-risk
 * Invoke: POST /functions/v1/recalculate-risk { bridge_id }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

function monthsSince(dateStr) {
  if (!dateStr) return 999;
  const then = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

function calculateRiskScore(bridge, reports, rainfallMm = 0) {
  const age = bridge.year_built ? new Date().getFullYear() - bridge.year_built : 0;
  let ageFactor = 3;
  if (age >= 75) ageFactor = 25;
  else if (age >= 50) ageFactor = 22;
  else if (age >= 30) ageFactor = 15;
  else if (age >= 15) ageFactor = 8;

  const dangerousCount = reports.filter(r => r.severity === 'DANGEROUS').length;
  const seriousCount = reports.filter(r => r.severity === 'SERIOUS').length;
  const reportFactor = Math.min(25, (dangerousCount * 7) + (seriousCount * 4));

  const gap = monthsSince(bridge.last_inspection_date);
  let inspectionFactor = 0;
  if (gap >= 36) inspectionFactor = 20;
  else if (gap >= 24) inspectionFactor = 18;
  else if (gap >= 12) inspectionFactor = 12;
  else if (gap >= 6) inspectionFactor = 5;

  let monsoonFactor = 2;
  if (rainfallMm >= 200) monsoonFactor = 20;
  else if (rainfallMm >= 150) monsoonFactor = 17;
  else if (rainfallMm >= 100) monsoonFactor = 13;
  else if (rainfallMm >= 50) monsoonFactor = 7;

  const seismicMap = { 'VI': 10, 'V': 9, 'IV': 7, 'III': 5, 'II': 2 };
  const seismicFactor = seismicMap[bridge.seismic_zone] || 5;

  const score = Math.min(100, ageFactor + reportFactor + inspectionFactor + monsoonFactor + seismicFactor);

  let status = 'SAFE';
  if (score >= 81) status = 'CRITICAL';
  else if (score >= 61) status = 'WARNING';
  else if (score >= 31) status = 'MONITOR';

  return {
    score, status,
    breakdown: {
      age_factor: ageFactor, citizen_reports: reportFactor,
      inspection_gap: inspectionFactor, monsoon_risk: monsoonFactor,
      seismic_zone: seismicFactor,
    },
  };
}

Deno.serve(async (req) => {
  try {
    const { bridge_id } = await req.json();
    if (!bridge_id) {
      return new Response(JSON.stringify({ error: 'bridge_id required' }), { status: 400 });
    }

    // Fetch bridge
    const { data: bridge, error: bErr } = await supabase
      .from('bridges').select('*').eq('id', bridge_id).single();
    if (bErr) throw bErr;

    // Fetch reports for this bridge
    const { data: reports, error: rErr } = await supabase
      .from('reports').select('severity').eq('bridge_id', bridge_id);
    if (rErr) throw rErr;

    // Calculate score
    const result = calculateRiskScore(bridge, reports || []);

    // Update bridge
    const { error: uErr } = await supabase
      .from('bridges')
      .update({
        risk_score: result.score,
        status: result.status,
        risk_breakdown: result.breakdown,
        total_reports: (reports || []).length,
      })
      .eq('id', bridge_id);
    if (uErr) throw uErr;

    // Create alert if CRITICAL
    if (result.score >= 80) {
      await supabase.from('alerts').insert({
        bridge_id,
        bridge_name: bridge.name,
        authority_id: bridge.authority_id,
        alert_type: 'RISK_SCORE_HIGH',
        message: `Bridge "${bridge.name}" risk score = ${result.score}. Immediate inspection required.`,
        data: { risk_score: result.score, trigger: 'risk_recalculation' },
      });
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
