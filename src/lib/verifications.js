/**
 * TruthBridge — Report Verification Service
 * 
 * Citizens can confirm/validate reports filed by other users.
 */
import { supabase } from './supabase';

/**
 * Get verification count and whether current user has verified a report
 */
export async function getVerificationStatus(reportId, citizenId) {
  const { data: count, error: countError } = await supabase
    .from('report_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId);

  if (countError) throw countError;

  let hasVerified = false;
  if (citizenId) {
    const { data: myVerification, error: verifyError } = await supabase
      .from('report_verifications')
      .select('id')
      .eq('report_id', reportId)
      .eq('citizen_id', citizenId)
      .maybeSingle();

    if (verifyError) throw verifyError;
    hasVerified = !!myVerification;
  }

  return {
    count: count || 0,
    hasVerified,
  };
}

/**
 * Verify a report (confirm the issue exists)
 */
export async function verifyReport(reportId, bridgeId, citizenId, notes = '') {
  if (!citizenId) throw new Error('You must be logged in to verify reports');
  if (!reportId) throw new Error('Report ID is required');
  if (!bridgeId) throw new Error('Bridge ID is required');

  const { data, error } = await supabase
    .from('report_verifications')
    .insert({
      report_id: reportId,
      citizen_id: citizenId,
      bridge_id: bridgeId,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    if (error.message?.includes('unique constraint')) {
      throw new Error('You have already verified this report');
    }
    if (error.message?.includes('citizen_id')) {
      throw new Error('You cannot verify your own report');
    }
    throw error;
  }

  return data;
}

/**
 * Remove a verification (un-verify)
 */
export async function unverifyReport(reportId, citizenId) {
  if (!citizenId) throw new Error('You must be logged in');

  const { error } = await supabase
    .from('report_verifications')
    .delete()
    .eq('report_id', reportId)
    .eq('citizen_id', citizenId);

  if (error) throw error;
  return true;
}

/**
 * Get all verifications for a report (with citizen info)
 */
export async function getVerificationsForReport(reportId) {
  const { data, error } = await supabase
    .from('report_verifications')
    .select(`
      id,
      verified_at,
      notes,
      citizen:auth.users(id, email)
    `)
    .eq('report_id', reportId)
    .order('verified_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
