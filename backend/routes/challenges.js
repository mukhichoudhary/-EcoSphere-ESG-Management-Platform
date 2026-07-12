const express = require('express');
const router = express.Router();
const db = require('../db');
const { createNotification } = require('./notifications');
const { checkAndAwardBadges } = require('./badges');

// GET all challenges (optionally filter by status)
router.get('/', (req, res) => {
    const status = req.query.status;
    let query = 'SELECT * FROM challenges';
    let params = [];
    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }
    query += ' ORDER BY id DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching challenges' });
        }
        res.json(rows);
    });
});

// POST create a challenge (starts in Draft)
router.post('/', (req, res) => {
    const { title, category_id, description, xp, difficulty, evidence_required, deadline } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Please provide a challenge title' });
    }

    db.run(
        `INSERT INTO challenges (title, category_id, description, xp, difficulty, evidence_required, deadline, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft')`,
        [title.trim(), category_id || null, description ? description.trim() : '', xp || 100, difficulty || 'Medium', evidence_required ? 1 : 0, deadline || null],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error creating challenge' });
            }
            res.status(201).json({
                message: 'Challenge created successfully as Draft',
                challenge: { id: this.lastID, title, category_id, description, xp: xp || 100, difficulty: difficulty || 'Medium', evidence_required: evidence_required ? 1 : 0, deadline, status: 'Draft' }
            });
        }
    );
});

// PUT transition state machine
router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['Draft', 'Active', 'Under Review', 'Completed', 'Archived'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid or missing status transition' });
    }

    db.run('UPDATE challenges SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error updating challenge status' });
        }
        res.json({ message: `Challenge status updated to ${status} successfully` });
    });
});

// GET challenge participation list
router.get('/:id/participation', (req, res) => {
    db.all('SELECT * FROM challenge_participation WHERE challenge_id = ?', [req.params.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching participation list' });
        }
        res.json(rows);
    });
});

// POST join/submit proof for a challenge (user_id = 1)
router.post('/:id/join', (req, res) => {
    const { progress, proof } = req.body;

    // Check if challenge is Active
    db.get('SELECT * FROM challenges WHERE id = ?', [req.params.id], (err, challenge) => {
        if (err || !challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        if (challenge.status !== 'Active') {
            return res.status(400).json({ error: 'Cannot participate in a challenge that is not Active' });
        }

        // Check if evidence is required by the challenge
        if (challenge.evidence_required && !proof) {
            return res.status(400).json({ error: 'Evidence / proof is required for this challenge' });
        }

        // Check if settings require evidence (global toggle)
        db.get('SELECT value FROM esg_config WHERE key = "evidence_required"', [], (errConf, confRow) => {
            const globalEvidenceRequired = confRow && confRow.value === '1';
            if (globalEvidenceRequired && !proof) {
                return res.status(400).json({ error: 'Proof file is required (enforced globally in Settings)' });
            }

            db.get('SELECT name FROM users WHERE id = 1', [], (errUser, user) => {
                const userName = user ? user.name : 'You';
                const dateStr = new Date().toISOString().split('T')[0];

                // Upsert participation
                db.get('SELECT * FROM challenge_participation WHERE challenge_id = ? AND user_id = 1', [challenge.id], (errPart, partRow) => {
                    if (partRow) {
                        // Update existing participation
                        db.run(
                            `UPDATE challenge_participation
                             SET progress = ?, proof = ?, approval = 'Pending', submitted_at = ?
                             WHERE id = ?`,
                            [progress || 100, proof || null, dateStr, partRow.id],
                            function(errUpd) {
                                if (errUpd) {
                                    return res.status(500).json({ error: 'Database error updating challenge participation' });
                                }
                                res.json({ message: 'Challenge progress updated. Awaiting approval.' });
                            }
                        );
                    } else {
                        // Insert new participation
                        db.run(
                            `INSERT INTO challenge_participation (challenge_id, user_id, employee_name, progress, proof, approval, xp_awarded, submitted_at)
                             VALUES (?, 1, ?, ?, ?, 'Pending', 0, ?)`,
                            [challenge.id, userName, progress || 100, proof || null, dateStr],
                            function(errIns) {
                                if (errIns) {
                                    return res.status(500).json({ error: 'Database error joining challenge' });
                                }
                                res.json({ message: 'Successfully joined challenge. Awaiting approval.' });
                            }
                        );
                    }
                });
            });
        });
    });
});

// PUT approve/reject participation
router.put('/participation/:id/approve', (req, res) => {
    const { approval } = req.body; // 'Approved' or 'Rejected'
    if (!approval || !['Approved', 'Rejected'].includes(approval)) {
        return res.status(400).json({ error: 'Please provide valid approval status: Approved or Rejected' });
    }

    db.get('SELECT * FROM challenge_participation WHERE id = ?', [req.params.id], (err, part) => {
        if (err || !part) {
            return res.status(404).json({ error: 'Participation record not found' });
        }
        if (part.approval !== 'Pending') {
            return res.status(400).json({ error: 'Participation record has already been processed' });
        }

        db.get('SELECT * FROM challenges WHERE id = ?', [part.challenge_id], (errCh, challenge) => {
            if (errCh || !challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }

            const xpToAward = approval === 'Approved' ? challenge.xp : 0;

            db.run(
                'UPDATE challenge_participation SET approval = ?, xp_awarded = ? WHERE id = ?',
                [approval, xpToAward, req.params.id],
                function(errUpd) {
                    if (errUpd) {
                        return res.status(500).json({ error: 'Database error updating approval status' });
                    }

                    if (approval === 'Approved') {
                        // Update Leaderboard User's XP
                        db.run('UPDATE leaderboard SET xp = xp + ? WHERE is_current_user = 1', [xpToAward], function(errLd) {
                            if (errLd) console.error('Error updating leaderboard:', errLd);

                            // Seed or update XP history for the current month
                            const currentMonth = new Date().toLocaleString('default', { month: 'short' }); // e.g. 'Jul'
                            db.get('SELECT * FROM xp_history WHERE user_id = ? AND month = ?', [part.user_id, currentMonth], (errXpH, xpHRow) => {
                                if (xpHRow) {
                                    db.run('UPDATE xp_history SET xp_earned = xp_earned + ? WHERE id = ?', [xpToAward, xpHRow.id]);
                                } else {
                                    db.run('INSERT INTO xp_history (user_id, month, xp_earned) VALUES (?, ?, ?)', [part.user_id, currentMonth, xpToAward]);
                                }
                            });

                            // Create Notification
                            createNotification(
                                part.user_id,
                                'Challenge Approved',
                                `🎉 Challenge Completed: ${challenge.title}`,
                                `Your participation in "${challenge.title}" has been approved! You have been awarded ${xpToAward} XP.`
                            );

                            // Check and auto-award badges
                            checkAndAwardBadges(part.user_id, (errBadges, earned) => {
                                if (errBadges) console.error('Error checking badges:', errBadges);
                                if (earned && earned.length > 0) {
                                    console.log(`Auto-awarded ${earned.length} badges to user ${part.user_id}`);
                                }
                            });
                        });
                    } else {
                        // Create Notification for Rejection
                        createNotification(
                            part.user_id,
                            'Challenge Rejected',
                            `❌ Challenge Submission Rejected: ${challenge.title}`,
                            `Your submission for "${challenge.title}" was not approved by the administrator.`
                        );
                    }

                    res.json({ message: `Participation successfully marked as ${approval}` });
                }
            );
        });
    });
});

module.exports = router;
