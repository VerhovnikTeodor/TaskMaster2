const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const commentRoutes = require('./routes/comments');

// Osnovni route
app.get('/', (req, res) => {
  res.json({
    message: 'Dobrodošli na TaskMaster API',
    version: '1.1.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      tasks: '/api/tasks',
      dashboard: '/api/dashboard',
      comments: '/api/comments',
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/comments', commentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Nekaj je šlo narobe!!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint ne obstaja' });
});

async function start() {
  if (process.env.DATABASE_URL && process.env.USE_MEMORY_STORE !== 'true') {
    const { waitForDb, initDb } = require('./data/db');
    await waitForDb();
    await initDb();
  } else {
    console.log('Uporabljam in-memory shrambo (brez PostgreSQL)');
  }

  app.listen(PORT, () => {
    console.log(`TaskMaster streznik tece na portu ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Zagon strežnika ni uspel:', err);
  process.exit(1);
});

module.exports = app;
