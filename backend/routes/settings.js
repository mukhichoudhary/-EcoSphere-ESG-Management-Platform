const express = require('express');
const router = express.Router();
const db = require('../db');

// Get Settings for the current user (using ID 1 for single-user demo)
router.get('/', (req, res) => {
    db.get('SELECT * FROM users WHERE id = 1', [], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching settings' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User settings not found' });
        }
        const { password_hash, ...settings } = user;
        res.json(settings);
    });
});

// Update Settings
router.put('/', (req, res) => {
    const { name, email, company, dark_mode, email_notifications, push_notifications, theme } = req.body;

    db.run(
        `UPDATE users
         SET name = COALESCE(?, name),
             email = COALESCE(?, email),
             company = COALESCE(?, company),
             dark_mode = COALESCE(?, dark_mode),
             email_notifications = COALESCE(?, email_notifications),
             push_notifications = COALESCE(?, push_notifications),
             theme = COALESCE(?, theme)
         WHERE id = 1`,
        [
            name,
            email ? email.trim().toLowerCase() : null,
            company,
            dark_mode !== undefined ? (dark_mode ? 1 : 0) : null,
            email_notifications !== undefined ? (email_notifications ? 1 : 0) : null,
            push_notifications !== undefined ? (push_notifications ? 1 : 0) : null,
            theme
        ],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error updating settings' });
            }
            db.get('SELECT * FROM users WHERE id = 1', [], (err2, user) => {
                if (err2 || !user) {
                    return res.status(500).json({ error: 'Failed to retrieve updated settings' });
                }
                const { password_hash, ...settings } = user;
                res.json({
                    message: 'Settings updated successfully',
                    settings: settings
                });
            });
        }
    );
});

// GET ESG weightings and global toggles
router.get('/esg-config', (req, res) => {
    db.all('SELECT key, value FROM esg_config', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching ESG configuration' });
        }
        const config = {};
        rows.forEach(r => {
            config[r.key] = r.value;
        });
        res.json(config);
    });
});

// PUT update ESG weightings and global toggles
router.put('/esg-config', (req, res) => {
    const configs = req.body; // e.g. { env_weight: 40, social_weight: 30, governance_weight: 30, auto_emission_calc: 1 }

    // Validate weights if provided
    const envW = configs.env_weight !== undefined ? parseFloat(configs.env_weight) : null;
    const socW = configs.social_weight !== undefined ? parseFloat(configs.social_weight) : null;
    const govW = configs.governance_weight !== undefined ? parseFloat(configs.governance_weight) : null;

    if (envW !== null && socW !== null && govW !== null) {
        if (envW + socW + govW !== 100) {
            return res.status(400).json({ error: 'Environmental, Social, and Governance weights must sum to exactly 100' });
        }
    }

    db.serialize(() => {
        let errorOccurred = null;
        const keys = Object.keys(configs);
        let completed = 0;

        if (keys.length === 0) {
            return res.json({ message: 'No configurations provided to update' });
        }

        keys.forEach(key => {
            const val = String(configs[key]);
            db.run(
                'INSERT OR REPLACE INTO esg_config (key, value) VALUES (?, ?)',
                [key, val],
                function(err) {
                    if (err) errorOccurred = err;
                    completed++;
                    if (completed === keys.length) {
                        if (errorOccurred) {
                            return res.status(500).json({ error: 'Database error saving configurations' });
                        }
                        res.json({ message: 'ESG configurations updated successfully' });
                    }
                }
            );
        });
    });
});

module.exports = router;
