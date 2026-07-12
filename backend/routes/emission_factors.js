const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all emission factors
router.get('/', (req, res) => {
    db.all('SELECT * FROM emission_factors ORDER BY category ASC, name ASC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching emission factors' });
        }
        res.json(rows);
    });
});

// POST create a new emission factor
router.post('/', (req, res) => {
    const { name, category, factor_per_unit, unit, description } = req.body;
    if (!name || !category || factor_per_unit === undefined || !unit) {
        return res.status(400).json({ error: 'Please provide name, category, factor_per_unit and unit' });
    }
    db.run(
        'INSERT INTO emission_factors (name, category, factor_per_unit, unit, description) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), category.trim(), parseFloat(factor_per_unit), unit.trim(), description ? description.trim() : ''],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Database error creating emission factor' });
            }
            res.status(201).json({
                message: 'Emission factor created successfully',
                emissionFactor: { id: this.lastID, name, category, factor_per_unit, unit, description }
            });
        }
    );
});

// PUT update emission factor by id
router.put('/:id', (req, res) => {
    const { name, category, factor_per_unit, unit, description } = req.body;
    db.run(
        `UPDATE emission_factors
         SET name = COALESCE(?, name),
             category = COALESCE(?, category),
             factor_per_unit = COALESCE(?, factor_per_unit),
             unit = COALESCE(?, unit),
             description = COALESCE(?, description)
         WHERE id = ?`,
        [name, category, factor_per_unit, unit, description, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Database error updating emission factor' });
            }
            res.json({ message: 'Emission factor updated successfully' });
        }
    );
});

// DELETE emission factor by id
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM emission_factors WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Database error deleting emission factor' });
        }
        res.json({ message: 'Emission factor deleted successfully' });
    });
});

module.exports = router;
