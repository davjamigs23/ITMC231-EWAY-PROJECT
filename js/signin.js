import { supabase } from './supabase-config.js';

// Add hover effect to form inputs
document.addEventListener('DOMContentLoaded', function() {
  const signInForm = document.getElementById('signInForm');
  if (!signInForm) return;

  document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('mouseenter', () => {
      input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
    input.addEventListener('mouseleave', () => {
      input.style.boxShadow = 'none';
    });
  });

  signInForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const selectedRole = document.querySelector('input[name="role"]:checked').value;
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Basic validation
    let isValid = true;
    if (!email.includes('@')) {
      if (emailError) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.remove('hidden');
      }
      isValid = false;
    } else if (emailError) {
      emailError.classList.add('hidden');
    }

    if (!password) {
      if (passwordError) {
        passwordError.textContent = 'Please enter your password';
        passwordError.classList.remove('hidden');
      }
      isValid = false;
    } else if (passwordError) {
      passwordError.classList.add('hidden');
    }

    if (!isValid) return;

    // Animation effect on submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.innerHTML = 'Signing In...';
    submitBtn.disabled = true;
    submitBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)';

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (!data || !data.user) {
        throw new Error('No user data returned from sign in');
      }

      // Get user role from the profiles table
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        // If no profile exists, create one with selected role
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          role: selectedRole
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (insertError) {
          throw insertError;
        }

        // Only allow 'user' or 'admin' roles
        if (selectedRole !== 'user' && selectedRole !== 'admin') {
          if (passwordError) {
            passwordError.textContent = 'Not valid credentials: role is not User or Admin.';
            passwordError.classList.remove('hidden');
          } else {
            alert('Not valid credentials: role is not User or Admin.');
          }
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Sign In';
          submitBtn.style.background = 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)';
          return;
        }
        redirectUser(selectedRole);
        return;
      }

      // Only allow 'user' or 'admin' roles from DB
      if (userData.role !== 'user' && userData.role !== 'admin') {
        if (passwordError) {
          passwordError.textContent = 'Not valid credentials: role is not User or Admin.';
          passwordError.classList.remove('hidden');
        } else {
          alert('Not valid credentials: role is not User or Admin.');
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In';
        submitBtn.style.background = 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)';
        return;
      }

      // Enforce that selected role matches registered role
      if (selectedRole !== userData.role) {
        if (passwordError) {
          passwordError.textContent = `You are registered as a ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}. Please sign in as a ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}.`;
          passwordError.classList.remove('hidden');
        } else {
          alert(`You are registered as a ${userData.role}. Please sign in as a ${userData.role}.`);
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In';
        submitBtn.style.background = 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)';
        return;
      }

      redirectUser(userData.role);
      return;
    } catch (error) {
      const errorMessage = error.message || 'Failed to sign in. Please check your credentials.';

      if (passwordError) {
        passwordError.textContent = errorMessage;
        passwordError.classList.remove('hidden');
      } else {
        alert('Error: ' + errorMessage);
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
      submitBtn.style.background = 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)';
    }
  });

  // Function to handle redirection based on user role
  function redirectUser(role) {
    if (role === 'admin') {
      window.location.href = '../Admin/admin-dashboard.html';
    } else if (role === 'user') {
      window.location.href = '../Homepage/HomepageWithAccount.html';
    } else {
      // fallback
      window.location.href = '../Homepage/Homepage.html';
    }
  }
});
