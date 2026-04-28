/**
 * TruthBridge — Alerts Service
 *
 * Alert retrieval and management via Supabase.
 */
import { supabase } from './supabase';

/**
 * Get alerts for the current authority.
 * @param {string} authorityId
 * @param {boolean} unreadOnly
 */
export async function getAlerts(authorityId, unreadOnly = false) {
  let query = supabase
    .from('alerts')
    .select('*')
    .eq('authority_id', authorityId)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Mark an alert as read.
 */
export async function markAlertRead(alertId) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get unread alert count for an authority.
 */
export async function getUnreadAlertCount(authorityId) {
  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('authority_id', authorityId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}
