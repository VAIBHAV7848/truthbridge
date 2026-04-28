/**
 * Compute accountability score for an authority (0–100).
 * Higher = more accountable (responds faster, takes more actions).
 */
export function computeAccountabilityScore(authority) {
  const total = (authority.total_actioned || 0) + (authority.total_ignored || 0);
  if (total === 0) return null;

  const responseRate = (authority.total_actioned || 0) / total;
  const responseRateScore = responseRate * 60;

  const efficiencyBonus = (authority.total_actioned || 0) > (authority.total_ignored || 0) ? 40 :
                          (authority.total_actioned || 0) === (authority.total_ignored || 0) ? 20 : 0;

  return Math.round(Math.min(100, responseRateScore + efficiencyBonus));
}

export function getAccountabilityLabel(score) {
  if (score === null) return { label: 'No Data', color: '#94a3b8' };
  if (score >= 75) return { label: 'Accountable', color: '#10b981' };
  if (score >= 50) return { label: 'Partial', color: '#f59e0b' };
  if (score >= 25) return { label: 'Poor', color: '#f97316' };
  return { label: 'Negligent', color: '#ef4444' };
}
