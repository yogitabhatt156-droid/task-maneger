const { supabase, getScopedSupabase, isConfigured } = require('../config/supabase');

/**
 * Express middleware to authenticate Supabase JWT Bearer tokens
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token format.',
      });
    }

    // In demo mode (when credentials aren't configured yet)
    if (!isConfigured) {
      if (token.startsWith('demo-token-')) {
        req.user = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'demo@taskflow.app',
          user_metadata: { full_name: 'Demo User' },
        };
        req.supabase = null;
        req.isDemo = true;
        return next();
      }
      return res.status(401).json({
        success: false,
        message: 'Supabase credentials are not configured in .env. Use Demo Mode or supply credentials.',
      });
    }

    // Verify token with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({
        success: false,
        message: error?.message || 'Invalid or expired session. Please log in again.',
      });
    }

    // Attach authenticated user and user-scoped Supabase client (respects RLS)
    req.user = data.user;
    req.supabase = getScopedSupabase(token);
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth Middleware Exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.',
    });
  }
};

module.exports = {
  requireAuth,
};
