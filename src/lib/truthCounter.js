/**
 * TruthBridge — Truth Counter Service
 *
 * Fetches the single-row truth counter data.
 */
import { supabase } from './supabase';

/**
 * Get the truth counter data.
 * Returns the single-row truth counter with official vs reality figures.
 */
export async function getTruthCounter() {
  const { data, error } = await supabase
    .from('truth_counter')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;

  return {
    officialCollapses: data.official_collapses,
    realityCollapses: data.reality_collapses,
    gap: data.gap,
    realityDeaths: data.reality_deaths,
    realityInjured: data.reality_injured,
    officialSource: data.official_source,
    realitySource: data.reality_source,
    citizenReportsOnPlatform: data.citizen_reports_on_platform,
    updatedAt: data.updated_at,
  };
}
