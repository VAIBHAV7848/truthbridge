/**
 * TruthBridge — IRC:81-1997 Risk Score Calculator
 *
 * Risk Score (0–100) =
 *   Age Factor (0–25) + Citizen Reports (0–25) +
 *   Inspection Gap (0–20) + Monsoon Risk (0–20) + Seismic Zone (0–10)
 */

function monthsSince(dateStr) {
  if (!dateStr) return 999;
  const then = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

export function calculateRiskScore(bridge, reports = [], rainfallMm = 0) {
  const age = bridge.year_built ? new Date().getFullYear() - bridge.year_built : 0;
  let ageFactor = 3;
  if (age >= 75) ageFactor = 25;
  else if (age >= 50) ageFactor = 22;
  else if (age >= 30) ageFactor = 15;
  else if (age >= 15) ageFactor = 8;

  const dangerousCount = reports.filter(r => r.severity === 'DANGEROUS').length;
  const seriousCount = reports.filter(r => r.severity === 'SERIOUS').length;
  const reportFactor = Math.min(25, (dangerousCount * 7) + (seriousCount * 4));

  const monthsUninspected = monthsSince(bridge.last_inspection_date);
  let inspectionFactor = 0;
  if (monthsUninspected >= 36) inspectionFactor = 20;
  else if (monthsUninspected >= 24) inspectionFactor = 18;
  else if (monthsUninspected >= 12) inspectionFactor = 12;
  else if (monthsUninspected >= 6) inspectionFactor = 5;

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
