const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Initialize DB and migrations

const authRouter = require('./routes/auth');
const esgRouter = require('./routes/esg');
const gamificationRouter = require('./routes/gamification');
const settingsRouter = require('./routes/settings');
const departmentsRouter = require('./routes/departments');
const categoriesRouter = require('./routes/categories');
const challengesRouter = require('./routes/challenges');
const { router: badgesRouter } = require('./routes/badges');
const rewardsRouter = require('./routes/rewards');
const { router: notificationsRouter } = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/esg', esgRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/notifications', notificationsRouter);

// Catch-all route to serve index.html for undefined requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🌿 EcoSphere local server is running successfully!`);
    console.log(`🌍 Access the website at: http://localhost:${PORT}`);
    console.log(`===================================================`);
});
