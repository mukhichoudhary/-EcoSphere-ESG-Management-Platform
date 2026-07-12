const express = require('express');
const router = express.Router();
const db = require('../db');
const { createNotification } = require('./notifications');

// GET all badge definitions
router.get('/', (req, res) => {
    db.all('SELECT * FROM badges ORDER BY name ASC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching badges' });
        }
        res.json(rows);
    });
});

// GET all earned badges for the current user (user_id = 1)
router.get('/earned', (req, res) => {
    db.all(
        `SELECT b.*, eb.earned_at
         FROM earned_badges eb
         JOIN badges b ON eb.badge_id = b.id
         WHERE eb.user_id = 1`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error fetching earned badges' });
            }
            res.json(rows);
        }
    );
});

// POST create a new badge definition
router.post('/', (req, res) => {
    const { name, description, unlock_rule_type, unlock_rule_value, icon } = req.body;
    if (!name || !unlock_rule_type || unlock_rule_value === undefined) {
        return res.status(400).json({ error: 'Please provide badge name, unlock rule type and value' });
    }

    db.run(
        'INSERT INTO badges (name, description, unlock_rule_type, unlock_rule_value, icon) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), description ? description.trim() : '', unlock_rule_type.trim().toLowerCase(), unlock_rule_value, icon || '🏅'],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error creating badge' });
            }
            res.status(201).json({
                message: 'Badge definition created successfully',
                badge: { id: this.lastID, name, description, unlock_rule_type, unlock_rule_value, icon: icon || '🏅' }
            });
        }
    );
});

// Helper function to check and auto-award badges
function checkAndAwardBadges(userId, callback) {
    // 1. Get user name
    db.get('SELECT name FROM users WHERE id = ?', [userId], (errUser, user) => {
        if (errUser || !user) return callback && callback(errUser || new Error('User not found'));

        // 2. Get user current XP
        db.get('SELECT xp FROM leaderboard WHERE is_current_user = 1', [], (errXp, leaderRow) => {
            const userXp = leaderRow ? leaderRow.xp : 0;

            // 3. Get user completed challenges count
            db.get(
                'SELECT COUNT(*) AS count FROM challenge_participation WHERE user_id = ? AND approval = "Approved"',
                [userId],
                (errCh, chRow) => {
                    const completedChallengesCount = chRow ? chRow.count : 0;

                    // 4. Get user completed CSR activities count
                    db.get(
                        'SELECT COUNT(*) AS count FROM employee_participation WHERE user_id = ? AND approval_status = "Approved"',
                        [userId],
                        (errCsr, csrRow) => {
                            const completedCsrCount = csrRow ? csrRow.count : 0;

                            // 5. Get already earned badges
                            db.all('SELECT badge_id FROM earned_badges WHERE user_id = ?', [userId], (errEarned, earnedRows) => {
                                if (errEarned) return callback && callback(errEarned);
                                const earnedBadgeIds = new Set(earnedRows.map(r => r.badge_id));

                                // 6. Fetch all badge definitions
                                db.all('SELECT * FROM badges', [], (errBadges, badgeDefinitions) => {
                                    if (errBadges) return callback && callback(errBadges);

                                    const dateStr = new Date().toISOString().split('T')[0];
                                    let newBadgesEarned = [];
                                    let checkCount = 0;
                                    let insertCount = 0;
                                    let errorOccurred = null;

                                    badgeDefinitions.forEach(badge => {
                                        if (earnedBadgeIds.has(badge.id)) return; // already earned

                                        let qualifies = false;
                                        if (badge.unlock_rule_type === 'xp' && userXp >= badge.unlock_rule_value) {
                                            qualifies = true;
                                        } else if (badge.unlock_rule_type === 'challenges' && completedChallengesCount >= badge.unlock_rule_value) {
                                            qualifies = true;
                                        } else if (badge.unlock_rule_type === 'csr' && completedCsrCount >= badge.unlock_rule_value) {
                                            qualifies = true;
                                        }

                                        if (qualifies) {
                                            checkCount++;
                                            // Award badge
                                            db.run(
                                                'INSERT OR IGNORE INTO earned_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)',
                                                [userId, badge.id, dateStr],
                                                function(errIns) {
                                                    if (errIns) {
                                                        errorOccurred = errIns;
                                                    } else if (this.changes > 0) {
                                                        newBadgesEarned.push(badge);
                                                        // Send notification
                                                        createNotification(
                                                            userId,
                                                            'Badge Unlocked',
                                                            `🏅 New Badge Earned: ${badge.name}`,
                                                            `Congratulations! You have unlocked the "${badge.name}" badge: ${badge.description}`
                                                        );
                                                    }
                                                    insertCount++;
                                                    if (insertCount === checkCount) {
                                                        if (callback) callback(errorOccurred, newBadgesEarned);
                                                    }
                                                }
                                            );
                                        }
                                    });

                                    // If no new badges qualify, complete immediately
                                    if (checkCount === 0 && callback) {
                                        callback(null, []);
                                    }
                                });
                            });
                        }
                    );
                }
            );
        });
    });
}

// POST endpoint to trigger manual/auto check
router.post('/check', (req, res) => {
    checkAndAwardBadges(1, (err, newBadges) => {
        if (err) {
            return res.status(500).json({ error: 'Error checking/awarding badges' });
        }
        res.json({
            message: 'Badge check completed successfully',
            newBadgesAwarded: newBadges
        });
    });
});

module.exports = {
    router,
    checkAndAwardBadges
};
