const express = require('express');
const router = express.Router();
const db = require('../db');
const { createNotification } = require('./notifications');
const { checkAndAwardBadges } = require('./badges');

// Get gamification stats and leaderboard
router.get('/stats', (req, res) => {
    // Get leaderboard
    db.all('SELECT * FROM leaderboard ORDER BY xp DESC', [], (err, board) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching leaderboard' });
        }

        // Get XP history
        db.all('SELECT * FROM xp_history ORDER BY id ASC', [], (err2, history) => {
            if (err2) {
                return res.status(500).json({ error: 'Database error fetching XP history' });
            }

            const months = history.map(h => h.month);
            const xpValues = history.map(h => h.xp_earned);

            // Get current user XP
            const currentUser = board.find(b => b.is_current_user === 1) || { xp: 4250 };

            // Count actual earned badges from DB
            db.get('SELECT COUNT(*) AS count FROM earned_badges WHERE user_id = 1', [], (errB, badgeRow) => {
                const badgesCount = badgeRow ? badgeRow.count : 12; // default fallback if none

                // Count completed challenges from DB
                db.get('SELECT COUNT(*) AS count FROM challenge_participation WHERE user_id = 1 AND approval = "Approved"', [], (errCh, chRow) => {
                    const completedChallengesCount = chRow ? chRow.count : 18; // default fallback if none

                    res.json({
                        leaderboard: board,
                        xpHistory: {
                            labels: months,
                            data: xpValues
                        },
                        totals: {
                            totalXP: currentUser.xp,
                            badgesEarned: badgesCount,
                            challengesCompleted: completedChallengesCount,
                            ranking: '#' + (board.findIndex(b => b.is_current_user === 1) + 1 || 2)
                        }
                    });
                });
            });
        });
    });
});

// POST Claim/Redeem Reward
router.post('/claim', (req, res) => {
    const { reward_id, reward_name } = req.body;

    if (!reward_id && !reward_name) {
        return res.status(400).json({ error: 'Reward ID or Name is required' });
    }

    const query = reward_id ? 'SELECT * FROM rewards WHERE id = ?' : 'SELECT * FROM rewards WHERE name = ?';
    const param = reward_id ? reward_id : reward_name;

    db.get(query, [param], (errR, reward) => {
        if (errR || !reward) {
            return res.status(404).json({ error: 'Reward not found' });
        }
        if (reward.status !== 'Active') {
            return res.status(400).json({ error: 'This reward is not active' });
        }
        if (reward.stock <= 0) {
            return res.status(400).json({ error: 'This reward is out of stock' });
        }

        // Get user current XP
        db.get('SELECT xp FROM leaderboard WHERE is_current_user = 1', [], (errU, leaderRow) => {
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
                    if (errSt) console.error('Error decrementing stock:', errSt);

                    // Create Notification
                    createNotification(
                        1,
                        'Reward Redeemed',
                        `🎁 Reward Redeemed: ${reward.name}`,
                        `You have successfully redeemed "${reward.name}". Deducted ${reward.points_required} XP from your balance.`
                    );

                    res.json({
                        message: `🎉 Reward "${reward.name}" claimed successfully!`,
                        pointsDeducted: reward.points_required,
                        remainingXP: userXp - reward.points_required
                    });
                });
            });
        });
    });
});

module.exports = router;
