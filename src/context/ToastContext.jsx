/**
 * TruthBridge — Toast Notification System
 * 
 * Global toast notifications for success, error, warning, info messages.
 * Usage: const { showToast } = useToast();
 *        showToast('Report submitted!', 'success');
 */
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = TOAST_DURATION) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' },
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
        width: 'calc(100% - 2rem)',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors[toast.type].border}`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              animation: 'slideInRight 0.3s ease, fadeOut 0.3s ease ' + (toast.duration - 300) + 'ms forwards',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{icons[toast.type]}</span>
            <span style={{ flex: 1, color: colors[toast.type].text }}>{toast.message}</span>
            <span style={{ fontSize: '1rem', opacity: 0.5 }}>×</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
