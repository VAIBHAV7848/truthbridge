/**
 * TruthBridge — Auth Context
 * Provides auth state (user + authority profile) to the React component tree.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentAuthority, onAuthStateChange } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authority, setAuthority] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check if email is confirmed
        setEmailConfirmed(!!session.user.email_confirmed_at);
        getCurrentAuthority().then(setAuthority).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setEmailConfirmed(!!session.user.email_confirmed_at);
        getCurrentAuthority().then(setAuthority);
      } else {
        setAuthority(null);
        setEmailConfirmed(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      authority, 
      loading, 
      isAdmin: !!authority,
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