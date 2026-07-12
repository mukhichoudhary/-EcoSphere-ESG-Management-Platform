const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all departments
router.get('/', (req, res) => {
    db.all('SELECT * FROM departments ORDER BY name ASC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching departments' });
        }
        res.json(rows);
    });
});

// POST create department
router.post('/', (req, res) => {
    const { name, code, head, parent_dept_id, employee_count } = req.body;
    if (!name || !code) {
        return res.status(400).json({ error: 'Please provide department name and code' });
    }

    db.run(
        'INSERT INTO departments (name, code, head, parent_dept_id, employee_count, status) VALUES (?, ?, ?, ?, ?, "Active")',
        [name.trim(), code.trim().toUpperCase(), head ? head.trim() : null, parent_dept_id || null, employee_count || 0],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Department code must be unique' });
                }
                return res.status(500).json({ error: 'Database error creating department' });
            }
            res.status(201).json({
                message: 'Department created successfully',
                department: { id: this.lastID, name, code, head, parent_dept_id, employee_count, status: 'Active' }
            });
        }
    );
});

// PUT update department
router.put('/:id', (req, res) => {
    const { name, code, head, parent_dept_id, employee_count, status } = req.body;
    db.run(
        `UPDATE departments
         SET name = COALESCE(?, name),
             code = COALESCE(?, code),
             head = COALESCE(?, head),
             parent_dept_id = COALESCE(?, parent_dept_id),
             employee_count = COALESCE(?, employee_count),
             status = COALESCE(?, status)
         WHERE id = ?`,
        [name, code, head, parent_dept_id, employee_count, status, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error updating department' });
            }
            res.json({ message: 'Department updated successfully' });
        }
    );
});

// DELETE department
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM departments WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error deleting department' });
        }
        res.json({ message: 'Department deleted successfully' });
    });
});

module.exports = router;
