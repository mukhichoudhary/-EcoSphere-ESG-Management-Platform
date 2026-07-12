const express = require('express');
const router = express.Router();
const db = require('../db');

// GET categories (optionally filter by type)
router.get('/', (req, res) => {
    const type = req.query.type;
    let query = 'SELECT * FROM categories WHERE status = "Active"';
    let params = [];
    if (type) {
        query += ' AND type = ?';
        params.push(type);
    }
    query += ' ORDER BY name ASC';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching categories' });
        }
        res.json(rows);
    });
});

// POST create category
router.post('/', (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ error: 'Please provide category name and type' });
    }

    db.run(
        'INSERT INTO categories (name, type, status) VALUES (?, ?, "Active")',
        [name.trim(), type.trim()],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error creating category' });
            }
            res.status(201).json({
                message: 'Category created successfully',
                category: { id: this.lastID, name, type, status: 'Active' }
            });
        }
    );
});

// PUT update category
router.put('/:id', (req, res) => {
    const { name, type, status } = req.body;
    db.run(
        `UPDATE categories
         SET name = COALESCE(?, name),
             type = COALESCE(?, type),
             status = COALESCE(?, status)
         WHERE id = ?`,
        [name, type, status, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error updating category' });
            }
            res.json({ message: 'Category updated successfully' });
        }
    );
});

// DELETE category
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error deleting category' });
        }
        res.json({ message: 'Category deleted successfully' });
    });
});

module.exports = router;
