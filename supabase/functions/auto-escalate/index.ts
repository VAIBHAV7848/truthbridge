/**
 * TruthBridge — Edge Function: Auto-Escalate Reports
 *
 * Cron job that runs daily. Marks reports as IGNORED after 30 days
 * with no authority response. Sends escalation alerts.
 *
 * Deploy: supabase functions deploy auto-escalate
 * Schedule via Supabase Dashboard → Database → pg_cron
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async () => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Auto-escalate to IGNORED after 30 days
    const { data: ignoredReports, error: e1 } = await supabase
      .from('reports')
      .update({
        status: 'IGNORED',
        auto_escalated_at: now.toISOString(),
      })
      .eq('status', 'PENDING')
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id, bridge_id, bridge_name');

    if (e1) throw e1;

    // Create alerts for auto-escalated reports
    for (const report of (ignoredReports || [])) {
      const { data: bridge } = await supabase
        .from('bridges').select('authority_id').eq('id', report.bridge_id).single();

      if (bridge?.authority_id) {
        await supabase.from('alerts').insert({
          bridge_id: report.bridge_id,
          bridge_name: report.bridge_name,
          authority_id: bridge.authority_id,
          alert_type: 'AUTO_ESCALATED',
          message: `Report on "${report.bridge_name}" auto-escalated to IGNORED after 30 days of no action.`,
          data: { report_id: report.id },
        });
      }
    }

    // 2. Update days_unaddressed for all pending reports
    const { data: pendingReports } = await supabase
      .from('reports')
      .select('id, created_at')
      .in('status', ['PENDING', 'UNDER_REVIEW']);

    for (const report of (pendingReports || [])) {
      const daysOld = Math.floor((now - new Date(report.created_at)) / (24 * 60 * 60 * 1000));
      await supabase.from('reports').update({ days_unaddressed: daysOld }).eq('id', report.id);
    }

    return new Response(JSON.stringify({
      success: true,
      escalated: (ignoredReports || []).length,
      updated: (pendingReports || []).length,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
