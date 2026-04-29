/**
 * TruthBridge — Engineers Service
 *
 * Helpers for fetching engineer profiles (for admin assignment dropdowns).
 */
import { supabase } from './supabase';

/**
 * Fetch all active engineers (for authority assignment dropdowns).
 * Returns array of { id, name, email, specialization, department }.
 */
export async function getActiveEngineers() {
  const { data, error } = await supabase
    .from('engineers')
    .select('id, name, email, specialization, department')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}
