require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { supabaseUrl, supabaseAnonKey, isConfigured } = require('./config/supabase');
const { requireAuth } = require('./middleware/authMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const tagRoutes = require('./routes/tagRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Client-safe configuration endpoint
// Exposes ONLY the public URL and anon key to the frontend. Service role key is NEVER exposed.
app.get('/api/config', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      supabaseUrl: isConfigured ? supabaseUrl : '',
      supabaseAnonKey: isConfigured ? supabaseAnonKey : '',
      isConfigured,
    },
  });
});

// System Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    application: 'TaskFlow API',
    isSupabaseConfigured: isConfigured,
    timestamp: new Date().toISOString(),
  });
});

// Current User Profile
app.get('/api/profile', requireAuth, async (req, res, next) => {
  try {
    if (req.isDemo) {
      return res.status(200).json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          full_name: 'Demo Workspace',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=DemoUser',
        },
      });
    }

    const { data, error } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(200).json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.user.email || 'User')}`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tags', tagRoutes);

// Catch 404 for API routes
app.use('/api/*', notFoundHandler);

// Fallback route for single page app views or root
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 \x1b[32mTaskFlow Server is up and running!\x1b[0m`);
  console.log(`📡 Local URL:   \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`🔐 Supabase:    ${isConfigured ? '\x1b[32mConnected\x1b[0m' : '\x1b[33mDemo Mode (Set .env for live Supabase)\x1b[0m'}\n`);
});

module.exports = app;
