const express = require('express');
const router = express.Router();
const db = require('../db');
const { createNotification } = require('./notifications');

// GET all rewards
router.get('/', (req, res) => {
    db.all('SELECT * FROM rewards WHERE status = "Active" ORDER BY name ASC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching rewards' });
        }
        res.json(rows);
    });
});

// POST create a reward
router.post('/', (req, res) => {
    const { name, description, points_required, stock } = req.body;
    if (!name || points_required === undefined) {
        return res.status(400).json({ error: 'Please provide reward name and points required' });
    }

    db.run(
        'INSERT INTO rewards (name, description, points_required, stock, status) VALUES (?, ?, ?, ?, "Active")',
        [name.trim(), description ? description.trim() : '', points_required, stock || 0],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error creating reward' });
            }
            res.status(201).json({
                message: 'Reward created successfully',
                reward: { id: this.lastID, name, description, points_required, stock: stock || 0, status: 'Active' }
            });
        }
    );
});

// POST redeem a reward (user_id = 1)
router.post('/:id/redeem', (req, res) => {
    db.get('SELECT * FROM rewards WHERE id = ?', [req.params.id], (errReward, reward) => {
        if (errReward || !reward) {
            return res.status(404).json({ error: 'Reward not found' });
        }
        if (reward.status !== 'Active') {
            return res.status(400).json({ error: 'This reward is not active' });
        }
        if (reward.stock <= 0) {
            return res.status(400).json({ error: 'This reward is out of stock' });
        }

        // Get user XP
        db.get('SELECT xp FROM leaderboard WHERE is_current_user = 1', [], (errUser, leaderRow) => {
            const userXp = leaderRow ? leaderRow.xp : 0;
            if (userXp < reward.points_required) {
                return res.status(400).json({ error: `Insufficient XP. You need ${reward.points_required} XP, but you only have ${userXp} XP.` });
            }

            // Deduct XP and decrement stock
            db.run('UPDATE leaderboard SET xp = xp - ? WHERE is_current_user = 1', [reward.points_required], function(errDed) {
                if (errDed) {
                    return res.status(500).json({ error: 'Database error deducting XP' });
                }

                db.run('UPDATE rewards SET stock = stock - 1 WHERE id = ?', [reward.id], function(errSt) {
                    if (errSt) {
                        console.error('Error decrementing stock:', errSt);
                    }

                    // Create Notification
                    createNotification(
                        1,
                        'Reward Redeemed',
                        `🎁 Reward Redeemed: ${reward.name}`,
                        `You have successfully redeemed "${reward.name}". deducted ${reward.points_required} XP from your balance.`
                    );

                    res.json({
                        message: `Successfully redeemed "${reward.name}"!`,
                        pointsDeducted: reward.points_required,
                        remainingXP: userXp - reward.points_required
                    });
                });
            });
        });
    });
});

module.exports = router;
