const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user info (excluding password hash)
        const { password_hash, ...userInfo } = user;
        res.json({
            message: 'Login successful',
            user: userInfo
        });
    });
});

// Register Route
router.post('/register', (req, res) => {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please provide name, email, and password' });
    }

    // Email length validation: must be > 5 and < 19 characters
    if (email.trim().length <= 5 || email.trim().length >= 19) {
        return res.status(400).json({ error: 'Email must be more than 5 and less than 19 characters' });
    }

    // Password length validation: must be > 5 and < 19 characters
    if (password.length <= 5 || password.length >= 19) {
        return res.status(400).json({ error: 'Password must be more than 5 and less than 19 characters' });
    }

    const emailClean = email.trim().toLowerCase();

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [emailClean], (err, existingUser) => {
        if (err) {
            return res.status(500).json({ error: 'Database error checking existing user' });
        }
        if (existingUser) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }

        // Hash password
        const hash = bcrypt.hashSync(password, 10);
        const comp = company ? company.trim() : 'EcoSphere Pvt Ltd';

        // Insert new user
        db.run(
            `INSERT INTO users (name, email, password_hash, company, dark_mode, email_notifications, push_notifications, theme)
             VALUES (?, ?, ?, ?, 0, 1, 1, 'Default')`,
            [name.trim(), emailClean, hash, comp],
            function(err2) {
                if (err2) {
                    return res.status(500).json({ error: 'Database error creating user' });
                }

                const userId = this.lastID;

                // Also insert into leaderboard
                db.run(
                    'INSERT INTO leaderboard (name, xp, is_current_user) VALUES (?, 0, 1)',
                    [name.trim()],
                    function(err3) {
                        // Mark other users as not current user just in case, to make this newly registered user the primary logged in user
                        db.run('UPDATE leaderboard SET is_current_user = 0 WHERE id != ?', [this.lastID]);
                        
                        // Seed initial XP history for Jan-Jun as 0 to avoid charts breaking
                        const stmt = db.prepare(`INSERT INTO xp_history (user_id, month, xp_earned) VALUES (?, ?, 0)`);
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                        months.forEach(m => stmt.run([userId, m]));
                        stmt.finalize();

                        res.status(201).json({
                            message: 'User registered successfully',
                            user: {
                                id: userId,
                                name: name.trim(),
                                email: emailClean,
                                company: comp
                            }
                        });
                    }
                );
            }
        );
    });
});

module.exports = router;
