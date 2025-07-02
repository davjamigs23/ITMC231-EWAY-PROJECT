import { supabase } from './supabase-config.js';

// Fetch all admin emails from the profiles table
async function getAdminEmails() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin');
  if (error) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
  return data.map(row => row.email);
}

// Insert message into a messages table for admin processing
async function sendMessageToAdmins(name, email, message) {
  // Optionally: create a messages table in Supabase for record keeping
  await supabase.from('contact_messages').insert([
    { name, email, message, created_at: new Date().toISOString() }
  ]);
}

// Send email via Supabase Edge Function (if available) or 3rd party
async function sendEmailToAdmins(adminEmails, name, email, message) {
  // This is a placeholder. You need a Supabase Edge Function or external email API for actual email sending.
  // For now, just log. Replace with your Edge Function call if you have one.
  console.log('Would send email to:', adminEmails, 'from', email, 'name', name, 'msg:', message);
  // Example Edge Function call:
  // await fetch('https://<your-supabase-project>.functions.supabase.co/send-admin-email', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ to: adminEmails, name, email, message })
  // });
}

// Main handler
export async function handleContactFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  if (!name || !email || !message) {
    alert('Please fill in all fields.');
    return;
  }
  const adminEmails = await getAdminEmails();
  if (adminEmails.length === 0) {
    alert('No admin emails found.');
    return;
  }
  await sendMessageToAdmins(name, email, message);
  await sendEmailToAdmins(adminEmails, name, email, message);
  alert('Your message has been sent to all admins!');
  form.reset();
}
