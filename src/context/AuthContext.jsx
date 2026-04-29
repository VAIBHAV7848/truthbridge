/**
 * TruthBridge — Auth Context
 * Provides auth state (user + authority/engineer profile) to the React component tree.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentAuthority, getCurrentEngineer, onAuthStateChange } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authority, setAuthority] = useState(null);
  const [engineer, setEngineer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check if email is confirmed
        setEmailConfirmed(!!session.user.email_confirmed_at);
        
        // Try to fetch authority profile first, then engineer
        getCurrentAuthority().then((auth) => {
          if (auth) {
            setAuthority(auth);
            setEngineer(null);
          } else {
            // Not an authority, check if engineer
            getCurrentEngineer().then((eng) => {
              setEngineer(eng);
              setAuthority(null);
            });
          }
        }).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(err => {
      // Suppress lock contention errors - these are benign when multiple tabs are open
      if (err?.message?.includes('Lock') && err?.message?.includes('was released')) {
        console.warn('Auth lock contention (benign):', err.message);
        setLoading(false);
        return;
      }
      console.error('Auth session error:', err);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setEmailConfirmed(!!session.user.email_confirmed_at);
        getCurrentAuthority().then((auth) => {
          if (auth) {
            setAuthority(auth);
            setEngineer(null);
          } else {
            getCurrentEngineer().then((eng) => {
              setEngineer(eng);
              setAuthority(null);
            });
          }
        });
      } else {
        setAuthority(null);
        setEngineer(null);
        setEmailConfirmed(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      authority, 
      engineer,
      loading, 
      isAdmin: !!authority,
      isEngineer: !!engineer,
      isVerified: !!user && emailConfirmed,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}