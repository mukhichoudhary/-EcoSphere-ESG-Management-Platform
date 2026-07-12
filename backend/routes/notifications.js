const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper function to create a notification (exported for use by other routers)
function createNotification(userId, type, title, message, callback) {
    const dateStr = new Date().toISOString().split('T')[0];
    db.run(
        'INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, 0, ?)',
        [userId, type, title, message, dateStr],
        function(err) {
            if (callback) callback(err, this ? this.lastID : null);
        }
    );
}

// GET all notifications for a user (assume user_id = 1 for single-user/demo mode)
router.get('/', (req, res) => {
    db.all('SELECT * FROM notifications WHERE user_id = 1 ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching notifications' });
        }
        res.json(rows);
    });
});

// PUT mark notification as read
router.put('/:id/read', (req, res) => {
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = 1', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error updating notification' });
        }
        res.json({ message: 'Notification marked as read' });
    });
});

// PUT mark all as read
router.put('/read-all', (req, res) => {
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = 1', [], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error updating notifications' });
        }
        res.json({ message: 'All notifications marked as read' });
    });
});

module.exports = {
    router,
    createNotification
};
