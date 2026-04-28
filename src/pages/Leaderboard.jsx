/**
 * TruthBridge — Authority Leaderboard
 * 
 * Public accountability rankings of government authorities
 * based on their response rates to citizen reports.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { computeAccountabilityScore, getAccountabilityLabel } from '../lib/accountabilityScore';
import { SkeletonText, SkeletonCard } from '../components/Skeleton';

export default function Leaderboard() {
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthorities() {
      try {
        const { data, error } = await supabase
          .from('authorities')
          .select('id, name, jurisdiction, role, total_actioned, total_ignored, created_at')
          .eq('is_active', true)
          .order('total_actioned', { ascending: false });

        if (error) throw error;

        // Compute scores and rankings
        const withScores = (data || []).map(a => {
          const score = computeAccountabilityScore(a);
          const label = getAccountabilityLabel(score);
          return { ...a, score: score ?? 0, label };
        }).sort((a, b) => b.score - a.score);

        setAuthorities(withScores);
      } catch (err) {
        console.error('Failed to load authorities:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAuthorities();
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          🏆 Authority Leaderboard
        </h1>
        <p className="text-gray" style={{ fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          Government authorities ranked by their responsiveness to citizen bridge safety reports.
          Higher scores = faster action, fewer ignored reports.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card-dark">
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24' }}>
            {authorities.filter(a => a.score >= 75).length}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Accountable (75+)</div>
        </div>
        <div className="card-dark">
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f97316' }}>
            {authorities.filter(a => a.score >= 25 && a.score < 75).length}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Needs Improvement</div>
        </div>
        <div className="card-dark">
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ef4444' }}>
            {authorities.filter(a => a.score < 25).length}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>At Risk (&lt;25)</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} height="100px" />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {authorities.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem',
                borderRadius: '12px',
                background: i < 3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i < 3 ? a.label.color + '40' : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              {/* Rank */}
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                background: i < 3 ? a.label.color + '20' : 'rgba(255,255,255,0.05)',
                color: i < 3 ? a.label.color : '#94a3b8',
                flexShrink: 0,
              }}>
                {medals[i] || `#${i + 1}`}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{a.name}</strong>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: a.label.color + '20',
                    color: a.label.color,
                    border: `1px solid ${a.label.color}40`,
                  }}>
                    {a.label.label}
                  </span>
                </div>
                <p className="text-gray" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {a.role?.replace('_', ' ')} · {a.jurisdiction ? Object.values(a.jurisdiction).flat().slice(0, 2).join(', ') : 'Karnataka'}
                </p>
              </div>

              {/* Stats */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: a.label.color }}>
                  {a.score}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Score</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>How We Calculate Scores</h3>
        <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>
          <p>📊 <strong>Response Rate (60%):</strong> Percentage of citizen reports that received action</p>
          <p>⚡ <strong>Efficiency Bonus (40%):</strong> Extra points for resolving more than ignoring</p>
          <p>🎯 <strong>Score Ranges:</strong> 75+ Accountable | 50-74 Partial | 25-49 Poor | &lt;25 Negligent</p>
        </div>
      </div>
    </div>
  );
}
