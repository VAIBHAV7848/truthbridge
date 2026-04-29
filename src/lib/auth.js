/**
 * TruthBridge — Auth Service
 *
 * Wraps Supabase Auth for admin login/logout.
 * Citizens do NOT need accounts — reports are anonymous.
 * Only authorities (admins) authenticate.
 */
import { supabase } from './supabase';

/**
 * Sign in an authority user with email + password.
 * Returns { user, session, authority } on success.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Fetch the authority profile linked to this auth user
  const { data: authority, error: profileError } = await supabase
    .from('authorities')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .single();

  if (profileError) {
    // User exists in auth but not in authorities table — not an admin
    await supabase.auth.signOut();
    throw new Error('This account does not have admin privileges.');
  }

  if (!authority.is_active) {
    await supabase.auth.signOut();
    throw new Error('This admin account has been deactivated.');
  }

  // Update last_login
  await supabase
    .from('authorities')
    .update({ last_login: new Date().toISOString() })
    .eq('id', authority.id);

  return {
    user: data.user,
    session: data.session,
    authority,
  };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the currently signed-in user's session.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get the current authority profile (if signed in).
 */
export async function getCurrentAuthority() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: authority, error } = await supabase
    .from('authorities')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (error) return null;
  return authority;
}

/**
 * Listen for auth state changes.
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Sign in an engineer user with email + password.
 * Returns { user, session, engineer } on success.
 */
export async function signInEngineer(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Fetch the engineer profile linked to this auth user
  const { data: engineer, error: profileError } = await supabase
    .from('engineers')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    throw new Error('This account is not registered as an engineer.');
  }

  if (!engineer.is_active) {
    await supabase.auth.signOut();
    throw new Error('This engineer account has been deactivated.');
  }

  // Update last_login
  await supabase
    .from('engineers')
    .update({ last_login: new Date().toISOString() })
    .eq('id', engineer.id);

  return {
    user: data.user,
    session: data.session,
    engineer,
  };
}

/**
 * Get the current engineer profile (if signed in).
 */
export async function getCurrentEngineer() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: engineer, error } = await supabase
    .from('engineers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (error) return null;
  return engineer;
}
