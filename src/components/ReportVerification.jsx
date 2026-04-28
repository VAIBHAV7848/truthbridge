/**
 * TruthBridge — Report Verification Component
 * 
 * Allows citizens to confirm/validate reports filed by others.
 * Shows verification count and button to verify/unverify.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { verifyReport, unverifyReport } from '../lib/verifications';

export default function ReportVerification({ reportId, bridgeId, initialCount = 0, isOwnReport = false }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [count, setCount] = useState(initialCount);
  const [hasVerified, setHasVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user has verified this report
  useEffect(() => {
    if (!user || !reportId) return;
    
    // In a real app, we'd fetch the verification status
    // For now, we track it locally after interaction
  }, [user, reportId]);

  const handleVerify = useCallback(async () => {
    if (!user) {
      showToast('Please login to verify reports', 'warning');
      return;
    }

    if (isOwnReport) {
      showToast('You cannot verify your own report', 'warning');
      return;
    }

    if (hasVerified) {
      // Unverify
      setLoading(true);
      try {
        await unverifyReport(reportId, user.id);
        setHasVerified(false);
        setCount(c => Math.max(0, c - 1));
        showToast('Verification removed', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to remove verification', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      // Verify
      setLoading(true);
      try {
        await verifyReport(reportId, bridgeId, user.id);
        setHasVerified(true);
        setCount(c => c + 1);
        showToast('Report verified! Thank you for confirming.', 'success');
      } catch (err) {
        if (err.message?.includes('already verified')) {
          setHasVerified(true);
          showToast('You already verified this report', 'warning');
        } else if (err.message?.includes('own report')) {
          showToast('You cannot verify your own report', 'warning');
        } else {
          showToast(err.message || 'Failed to verify report', 'error');
        }
      } finally {
        setLoading(false);
      }
    }
  }, [user, reportId, bridgeId, hasVerified, isOwnReport, showToast]);

  if (!user) return null; // Don't show for logged-out users

  const getVerificationLabel = (n) => {
    if (n === 0) return 'No confirmations yet';
    if (n === 1) return '1 citizen confirmed';
    return `${n} citizens confirmed`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginTop: '0.75rem',
      padding: '0.5rem 0.75rem',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ 
          fontSize: '0.85rem', 
          color: count > 0 ? '#34d399' : '#94a3b8',
          fontWeight: count > 0 ? 600 : 400,
        }}>
          ✓ {getVerificationLabel(count)}
        </span>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
          Other citizens can confirm this issue exists
        </p>
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || isOwnReport}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: 'none',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: isOwnReport ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          background: hasVerified 
            ? 'rgba(239, 68, 68, 0.15)' 
            : 'rgba(16, 185, 129, 0.15)',
          color: hasVerified ? '#f87171' : '#34d399',
          border: `1px solid ${hasVerified ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          opacity: isOwnReport ? 0.5 : 1,
        }}
      >
        {loading ? '...' : hasVerified ? '✓ Confirmed' : '✓ Confirm Issue'}
      </button>
    </div>
  );
}
