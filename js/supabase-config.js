import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configuration
const SUPABASE_URL = 'https://lqytdmbpaknugrrjoylh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxeXRkbWJwYWtudWdycmpveWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODM3MTQsImV4cCI6MjA2Njk1OTcxNH0.B9AndZdM-_2_ojsbqSC-p7hboIN0XKsrs8TBEnDO3lY';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxeXRkbWJwYWtudWdycmpveWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM4MzcxNCwiZXhwIjoyMDY2OTU5NzE0fQ.WTbqM9vTtNq3N1N85uwxnOMk8hjQuXV9FDxNCAJ8YtE';

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Debug mode - set to false for production
const DEBUG_BYPASS_RLS = true;

// Helper function for RLS bypass
const getClient = () => {
  if (DEBUG_BYPASS_RLS) {
    console.warn('WARNING: Using admin client - only for debugging!');
    return adminClient;
  }
  return supabase;
};

// Registration Functions
export async function submitRegistration(formData) {
  try {
    if (!formData.owner_email?.includes('@')) {
      throw new Error('Valid email required');
    }
    
    const client = getClient();
    
    // Check for existing serial number
    const { data: existing } = await client
      .from('ebike_registrations')
      .select('serial_number')
      .eq('serial_number', formData.serial_number)
      .maybeSingle();
      
    if (existing) {
      throw new Error('This serial number is already registered');
    }
    
    // Submit new registration
    const { data, error } = await client
      .from('ebike_registrations')
      .insert([{
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        brand: formData.brand,
        ebike_model: formData.ebike_model,
        serial_number: formData.serial_number,
        status: 'pending',
        email_verified: false
      }])
      .select();
      
    if (error) throw error;
    
    // Send verification email immediately
    await sendVerificationEmail(formData.owner_email);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function loadUserRegistrations() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // If not signed in, attempt anonymous auth
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw new Error('Authentication failed');
    }
    
    const { data, error } = await supabase
      .from('ebike_registrations')
      .select('*')
      .eq('owner_email', user?.email)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading registrations:', error);
    throw error;
  }
}

export async function loadAllRegistrations() {
  try {
    const client = getClient();
    console.log('Attempting to load registrations...');
    
    // First try with standard query
    let { data, error } = await client
      .from('ebike_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Initial query results:', { data, error });
    
    // Handle missing email_verified column
    if (error?.code === 'PGRST204') {
      console.log('email_verified column missing, falling back to JS filtering');
      ({ data, error } = await client
        .from('ebike_registrations')
        .select('*')
        .order('created_at', { ascending: false }));
      
      if (error) throw error;
      return data.filter(reg => reg.email_verified !== false);
    }
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    // Filter verified emails (both for direct query and fallback)
    const verifiedData = data.filter(reg => reg.email_verified !== false);
    console.log('Returning verified registrations:', verifiedData.length);
    
    return verifiedData;
  } catch (error) {
    console.error('Admin load error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw new Error(`Failed to load registrations: ${error.message}`);
  }
}

export async function updateRegistrationStatus(id, status) {
  try {
    // Use admin client to bypass RLS
    const client = adminClient;
    
    let updateData = { 
      status,
      decision_date: new Date().toISOString() 
    };
    
    let { data, error } = await client
      .from('ebike_registrations')
      .update(updateData)
      .eq('id', id)
      .select();
    
    // If decision_date column doesn't exist, try without it
    if (error?.code === 'PGRST204') {
      updateData = { status };
      ({ data, error } = await client
        .from('ebike_registrations')
        .update(updateData)
        .eq('id', id)
        .select());
    }
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Status update error:', error);
    throw error;
  }
}

export async function sendVerificationEmail(email) {
  try {
    const verificationUrl = `${window.location.origin}/Registration/verify-email.html?email=${encodeURIComponent(email)}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: verificationUrl
      }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Verification email error:', error);
    throw error;
  }
}

export async function verifyEmail(email) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('ebike_registrations')
      .update({ email_verified: true })
      .eq('owner_email', email)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
}

export async function searchBySerialNumber(serialNumber) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('ebike_registrations')
      .select('*')
      .eq('serial_number', serialNumber)
      .eq('status', 'approved')
      .maybeSingle();
      
    if (error) throw error;
    return data; // Returns null if no match found
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export async function checkRegistrationStatus(email) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('ebike_registrations')
      .select('status, decision_date, created_at')
      .eq('owner_email', email)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
}

export function subscribeToStatusChanges(email, callback) {
  if (!email) return () => {};
  
  const subscription = supabase
    .channel('registration-status')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ebike_registrations',
        filter: `owner_email=eq.${email}`,
      },
      (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          callback(payload.new);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(subscription);
}

export async function editRegistrationStatus(id, newStatus) {
  try {
    const client = adminClient;
    const { data, error } = await client
      .from('ebike_registrations')
      .update({ 
        status: newStatus,
        decision_date: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Edit error:', error);
    throw error;
  }
}

export async function deleteRegistration(id) {
  try {
    const client = adminClient;
    const { data, error } = await client
      .from('ebike_registrations')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

export async function checkExistingEmail(email) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('ebike_registrations')
      .select('owner_email')
      .eq('owner_email', email)
      .maybeSingle();
    
    if (error) throw error;
    return !!data; // Returns true if email exists
  } catch (error) {
    console.error('Email check failed:', error);
    throw error;
  }
}

export async function checkExistingSerial(serial) {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('ebike_registrations')
      .select('serial_number')
      .eq('serial_number', serial)
      .maybeSingle();
    
    if (error) throw error;
    return !!data; // Returns true if serial exists
  } catch (error) {
    console.error('Serial check failed:', error);
    throw error;
  }
}

export { supabase };