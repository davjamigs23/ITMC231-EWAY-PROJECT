import { supabase } from './supabase-config.js';

// Check if user is authenticated
export async function checkAuth(redirectIfNotAuthenticated = true) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    if (redirectIfNotAuthenticated) {
      window.location.href = '../Account/SignIn.html';
    }
    return { user: null, error: error || new Error('Not authenticated') };
  }

  try {
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;
    
    return { user: { ...user, ...userData }, error: null };
  } catch (error) {
    console.error('Error fetching user data:', error);
    if (redirectIfNotAuthenticated) {
      window.location.href = '../Account/SignIn.html';
    }
    return { user: null, error };
  }
}

// Sign out user
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear stored session
    localStorage.removeItem('supabase.auth.token');
    window.location.href = '../Account/SignIn.html';
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Get current session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session;
}
