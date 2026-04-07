require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDB = require('./database/init');

const authRoutes      = require('./routes/auth');
const pickupRoutes    = require('./routes/pickup');
const jobRoutes       = require('./routes/jobs');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes     = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/pickup',    pickupRoutes);
app.use('/api/jobs',      jobRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin',     adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'E-Waste Server Running ✅' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n🌿 E-Waste Server → http://localhost:${PORT}`);
    console.log(`📦 Database  → SQLite (./database/ewaste.db)`);
    console.log(`🔑 JWT Auth  → Enabled\n`);
  });
}

start().catch(err => { console.error('Startup error:', err); process.exit(1); });
