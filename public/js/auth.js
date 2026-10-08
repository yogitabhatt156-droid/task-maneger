/**
 * TaskFlow Authentication Service (Supabase Auth Client)
 */

let supabaseClient = null;
let appConfig = null;

const AUTH_STORAGE_KEY = 'taskflow_auth_session';

/**
 * Fetch public app configuration from Express backend
 */
async function loadAppConfig() {
  if (appConfig) return appConfig;
  try {
    const res = await fetch('/api/config');
    const json = await res.json();
    if (json.success) {
      appConfig = json.data;
      if (appConfig.isConfigured && window.supabase) {
        supabaseClient = window.supabase.createClient(
          appConfig.supabaseUrl,
          appConfig.supabaseAnonKey
        );
      }
    }
  } catch (err) {
    console.error('Failed to load API configuration:', err);
  }
  return appConfig;
}

/**
 * Get current session token
 */
async function getAuthToken() {
  await loadAppConfig();

  // Check demo session first
  const localSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (localSession) {
    try {
      const parsed = JSON.parse(localSession);
      if (parsed.isDemo) {
        return parsed.token;
      }
    } catch (e) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  // Live Supabase Client session
  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session) {
      return data.session.access_token;
    }
  }

  // Fallback to saved Supabase token
  if (localSession) {
    try {
      const parsed = JSON.parse(localSession);
      return parsed.token || null;
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Get current user object
 */
async function getCurrentUser() {
  await loadAppConfig();

  const localSession = localStorage.getItem(AUTH_STORAGE_KEY);
  if (localSession) {
    try {
      const parsed = JSON.parse(localSession);
      if (parsed.isDemo) {
        if (parsed.user && parsed.user.full_name !== 'Yogita Bhatt') {
          parsed.user.full_name = 'Yogita Bhatt';
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed.user;
      }
    } catch (e) {}
  }

  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getUser();
    if (data?.user) {
      return {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
      };
    }
  }

  if (localSession) {
    try {
      const parsed = JSON.parse(localSession);
      return parsed.user || null;
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Sign Up with Supabase
 */
async function signUp(email, password, fullName) {
  await loadAppConfig();

  if (!appConfig?.isConfigured) {
    showToast('Supabase is not configured yet. Launching in Demo Workspace...', 'warning');
    return signInDemo();
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (data.session) {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
        },
        isDemo: false,
      })
    );
  }

  return data;
}

/**
 * Sign In with Supabase
 */
async function signIn(email, password) {
  await loadAppConfig();

  if (!appConfig?.isConfigured) {
    showToast('Supabase is not configured yet. Switching to Demo Workspace...', 'warning');
    return signInDemo();
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.session) {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
        },
        isDemo: false,
      })
    );
  }

  return data;
}

/**
 * Sign In to Demo Workspace (Instant Sandbox)
 */
async function signInDemo() {
  const demoData = {
    token: `demo-token-${Date.now()}`,
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@taskflow.app',
      full_name: 'Yogita Bhatt',
    },
    isDemo: true,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoData));
  return demoData;
}

/**
 * Sign Out
 */
async function signOut() {
  await loadAppConfig();

  if (supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout notice:', e);
    }
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.href = '/login.html';
}

/**
 * Password Reset Email
 */
async function resetPassword(email) {
  await loadAppConfig();

  if (!appConfig?.isConfigured) {
    throw new Error('Supabase credentials are required to dispatch password reset emails.');
  }

  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`,
  });

  if (error) throw error;
  return data;
}

/**
 * Update password (after reset email link)
 */
async function updatePassword(newPassword) {
  await loadAppConfig();

  if (!appConfig?.isConfigured || !supabaseClient) {
    throw new Error('Supabase not configured.');
  }

  const { data, error } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

/**
 * Guard: Protected page check
 */
async function requireAuth() {
  const token = await getAuthToken();
  if (!token) {
    window.location.href = '/login.html';
    return false;
  }

  // Populate sidebar user info if available
  const user = await getCurrentUser();
  if (user) {
    const nameEl = document.querySelector('.user-name');
    const emailEl = document.querySelector('.user-email');
    const avatarEl = document.querySelector('.user-avatar');

    if (nameEl) nameEl.textContent = user.full_name || 'TaskFlow User';
    if (emailEl) emailEl.textContent = user.email || 'user@taskflow.app';
    if (avatarEl) {
      avatarEl.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        user.full_name || user.email || 'TF'
      )}`;
    }
  }

  // Bind logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
    });
  }

  return true;
}

/**
 * Guard: Public auth page check (redirect if already logged in)
 */
async function redirectIfAuthenticated() {
  const token = await getAuthToken();
  if (token) {
    window.location.href = '/dashboard.html';
  }
}
