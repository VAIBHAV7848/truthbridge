/**
 * TruthBridge — Report Data Service
 *
 * Citizen report submission and management via Supabase.
 */
import { supabase } from './supabase';

/**
 * Fetch all public reports, optionally filtered.
 */
export async function getReports(filters = {}) {
  let query = supabase
    .from('reports')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (filters.bridgeId) {
    query = query.eq('bridge_id', filters.bridgeId);
  }
  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const limit = filters.limit || 20;
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Submit a new citizen report.
 * @param {Object} reportData - { bridge_id, damage_type, severity, description, lat, lng }
 * @param {File} photo - The damage photo file
 */
export async function submitReport(reportData, photo) {
  let photoUrl = null;
  let photoPath = null;

  // 1. Upload photo to Supabase Storage
  if (photo) {
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    photoPath = `reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(photoPath, photo, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('report-photos')
      .getPublicUrl(photoPath);

    photoUrl = urlData.publicUrl;
  }

  // 2. Generate anonymous reporter hash from timestamp
  const reporterHash = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  // 3. Fetch bridge name for denormalization
  let bridgeName = reportData.bridge_name || null;
  if (!bridgeName && reportData.bridge_id) {
    const { data: bridge } = await supabase
      .from('bridges')
      .select('name')
      .eq('id', reportData.bridge_id)
      .single();
    bridgeName = bridge?.name || null;
  }

  // 4. Insert report
  const { data, error } = await supabase
    .from('reports')
    .insert({
      bridge_id: reportData.bridge_id,
      bridge_name: bridgeName,
      reporter_hash: reporterHash,
      citizen_id: reportData.citizen_id || null,
      photo_url: photoUrl,
      photo_path: photoPath,
      damage_type: reportData.damage_type,
      severity: reportData.severity,
      description: reportData.description || null,
      lat: reportData.lat || null,
      lng: reportData.lng || null,
      detected_age_group: reportData.detected_age_group || null,
      age_detection_confidence: reportData.age_detection_confidence || null,
      status: 'PENDING',
      is_public: true,
    })
    .select()
    .single();

  if (error) throw error;

  // 5. Increment total_reports on the bridge
  const { error: updateError } = await supabase.rpc('increment_bridge_reports', {
    bridge_uuid: reportData.bridge_id,
  });
  // If the RPC doesn't exist yet, fall back to manual update
  if (updateError) {
    await supabase
      .from('bridges')
      .update({
        total_reports: supabase.rpc ? undefined : 0, // handled by trigger/edge function
      })
      .eq('id', reportData.bridge_id);
  }

  return data;
}

/**
 * Update report status (admin only).
 */
export async function updateReportStatus(reportId, statusData, proofPhoto) {
  let proofPhotoUrl = null;

  if (proofPhoto) {
    const fileExt = proofPhoto.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const proofPath = `proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('proof-photos')
      .upload(proofPath, proofPhoto, {
        contentType: proofPhoto.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('proof-photos')
      .getPublicUrl(proofPath);

    proofPhotoUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('reports')
    .update({
      status: statusData.status,
      response_notes: statusData.notes || null,
      proof_photo_url: proofPhotoUrl || statusData.proof_photo_url || null,
      responded_at: new Date().toISOString(),
      days_unaddressed: 0,
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
