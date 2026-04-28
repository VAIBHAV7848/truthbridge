/**
 * TruthBridge — Bridge Data Service
 *
 * All bridge-related database operations via Supabase.
 */
import { supabase } from './supabase';

/**
 * Fetch all bridges, optionally filtered.
 * @param {Object} filters - { state, status, limit, page }
 */
export async function getBridges(filters = {}) {
  let query = supabase
    .from('bridges')
    .select('*')
    .order('risk_score', { ascending: false });

  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.district) {
    query = query.eq('district', filters.district);
  }

  const limit = filters.limit || 50;
  const page = filters.page || 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data, count };
}

/**
 * Fetch a single bridge by ID, including its reports.
 */
export async function getBridgeById(id) {
  const { data: bridge, error } = await supabase
    .from('bridges')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Fetch related reports
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .eq('bridge_id', id)
    .order('created_at', { ascending: false });

  if (reportsError) throw reportsError;

  // Fetch related inspections
  const { data: inspections, error: inspectionsError } = await supabase
    .from('inspections')
    .select('*')
    .eq('bridge_id', id)
    .order('inspection_date', { ascending: false });

  if (inspectionsError) throw inspectionsError;

  return { ...bridge, reports, inspections };
}

/**
 * Create a new bridge (admin only).
 */
export async function createBridge(bridgeData) {
  const { data, error } = await supabase
    .from('bridges')
    .insert(bridgeData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a bridge (admin only).
 */
export async function updateBridge(id, updates) {
  const { data, error } = await supabase
    .from('bridges')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
