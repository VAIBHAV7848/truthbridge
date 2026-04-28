/**
 * TruthBridge — Inspection Service
 *
 * Inspection logging and retrieval via Supabase.
 */
import { supabase } from './supabase';

/**
 * Get inspections for a bridge.
 */
export async function getInspections(bridgeId) {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('bridge_id', bridgeId)
    .order('inspection_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Log a new inspection (admin only).
 * @param {Object} inspectionData
 * @param {File|null} pdfFile - Optional PDF report
 */
export async function createInspection(inspectionData, pdfFile = null) {
  let pdfUrl = null;
  let pdfPath = null;

  if (pdfFile) {
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
    pdfPath = `inspections/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('inspection-pdfs')
      .upload(pdfPath, pdfFile, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('inspection-pdfs')
      .getPublicUrl(pdfPath);

    pdfUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('inspections')
    .insert({
      bridge_id: inspectionData.bridge_id,
      conducted_by: inspectionData.conducted_by || null,
      inspector_name: inspectionData.inspector_name,
      inspection_date: inspectionData.inspection_date,
      inspection_type: inspectionData.inspection_type,
      findings: inspectionData.findings || {},
      irc_compliance_score: inspectionData.irc_compliance_score || null,
      report_pdf_url: pdfUrl,
      report_pdf_path: pdfPath,
      next_inspection_due: inspectionData.next_inspection_due || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Update bridge's last_inspection_date
  await supabase
    .from('bridges')
    .update({
      last_inspection_date: inspectionData.inspection_date,
      last_inspection_report: pdfUrl,
    })
    .eq('id', inspectionData.bridge_id);

  return data;
}
