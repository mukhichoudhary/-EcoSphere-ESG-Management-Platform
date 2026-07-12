const express = require('express');
const router = express.Router();
const db = require('../db');
const { createNotification } = require('./notifications');
const { checkAndAwardBadges } = require('./badges');

// ==========================================
// ENVIRONMENTAL ENDPOINTS
// ==========================================

// Get carbon records and chart data
router.get('/environmental', (req, res) => {
    db.all('SELECT * FROM carbon_records ORDER BY date DESC', [], (err, records) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching environmental logs' });
        }

        // Mock monthly data (or calculate from database if dates were multi-month)
        const monthlyEmissions = [240, 220, 205, 195, 180, 165]; // Default Jan - Jun
        
        res.json({
            records: records,
            monthlyEmissions: monthlyEmissions,
            totals: {
                totalCarbonEmission: '185 Tons',
                reduction: '18%',
                sustainabilityGoal: '82%',
                environmentalScore: '91%'
            }
        });
    });
});

// Add new carbon record (supports auto-calculation via settings)
router.post('/environmental', (req, res) => {
    const { department, emission, link_type, link_id, linked_value, emission_factor_id } = req.body;

    if (!department) {
        return res.status(400).json({ error: 'Please provide department name' });
    }

    const saveRecord = (finalEmission) => {
        let status = 'Low';
        if (finalEmission > 50) status = 'High';
        else if (finalEmission > 30) status = 'Medium';
        else status = 'Excellent';

        const date = new Date().toISOString().split('T')[0];

        db.run(
            'INSERT INTO carbon_records (department, emission, status, date) VALUES (?, ?, ?, ?)',
            [department, finalEmission, status, date],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error adding carbon record' });
                }
                res.json({
                    message: 'Carbon record added successfully',
                    record: { id: this.lastID, department, emission: finalEmission, status, date }
                });
            }
        );
    };

    // Check if auto emission calculation is enabled
    db.get('SELECT value FROM esg_config WHERE key = "auto_emission_calc"', [], (errConf, confRow) => {
        const isAutoCalcEnabled = confRow && confRow.value === '1';

        if (isAutoCalcEnabled && linked_value && emission_factor_id) {
            // Find the emission factor
            db.get('SELECT factor_per_unit FROM emission_factors WHERE id = ?', [emission_factor_id], (errEf, efRow) => {
                if (errEf || !efRow) {
                    // Fall back to provided emission value if factor not found
                    return saveRecord(parseFloat(emission || 0));
                }
                const calculatedEmission = parseFloat(linked_value) * efRow.factor_per_unit;
                saveRecord(calculatedEmission);
            });
        } else {
            // Manual entry
            if (emission === undefined) {
                return res.status(400).json({ error: 'Please provide emission amount or configure auto calculation' });
            }
            saveRecord(parseFloat(emission));
        }
    });
});

// ==========================================
// EMISSION FACTORS ENDPOINTS
// ==========================================

router.get('/emission-factors', (req, res) => {
    db.all('SELECT * FROM emission_factors ORDER BY category ASC, name ASC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching emission factors' });
        }
        res.json(rows);
    });
});

router.post('/emission-factors', (req, res) => {
    const { name, category, factor_per_unit, unit, description } = req.body;
    if (!name || !category || factor_per_unit === undefined || !unit) {
        return res.status(400).json({ error: 'Please provide name, category, factor_per_unit and unit' });
    }

    db.run(
        'INSERT INTO emission_factors (name, category, factor_per_unit, unit, description) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), category.trim(), parseFloat(factor_per_unit), unit.trim(), description ? description.trim() : ''],
        function(err) {
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

router.put('/emission-factors/:id', (req, res) => {
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
         function(err) {
             if (err) {
                 return res.status(500).json({ error: 'Database error updating emission factor' });
             }
             res.json({ message: 'Emission factor updated successfully' });
         }
    );
});

// ==========================================
// ESG GOALS ENDPOINTS
// ==========================================

router.get('/goals', (req, res) => {
    db.all('SELECT * FROM esg_goals ORDER BY deadline ASC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching goals' });
        }
        res.json(rows);
    });
});

router.post('/goals', (req, res) => {
    const { name, target, current_value, unit, deadline, department } = req.body;
    if (!name || target === undefined) {
        return res.status(400).json({ error: 'Please provide goal name and target' });
    }

    db.run(
        'INSERT INTO esg_goals (name, target, current_value, unit, deadline, department, status) VALUES (?, ?, ?, ?, ?, ?, "Active")',
        [name.trim(), parseFloat(target), parseFloat(current_value || 0), unit || '%', deadline || null, department || 'All'],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error creating ESG goal' });
            }
            res.status(201).json({
                message: 'ESG goal created successfully',
                goal: { id: this.lastID, name, target, current_value: current_value || 0, unit: unit || '%', deadline, department, status: 'Active' }
            });
        }
    );
});

router.put('/goals/:id', (req, res) => {
    const { name, target, current_value, unit, deadline, department, status } = req.body;
    db.run(
        `UPDATE esg_goals
         SET name = COALESCE(?, name),
             target = COALESCE(?, target),
             current_value = COALESCE(?, current_value),
             unit = COALESCE(?, unit),
             deadline = COALESCE(?, deadline),
             department = COALESCE(?, department),
             status = COALESCE(?, status)
         WHERE id = ?`,
         [name, target, current_value, unit, deadline, department, status, req.params.id],
         function(err) {
             if (err) {
                 return res.status(500).json({ error: 'Database error updating ESG goal' });
             }
             res.json({ message: 'ESG goal updated successfully' });
         }
    );
});

// ==========================================
// SOCIAL ENDPOINTS & CSR PARTICIPATION
// ==========================================

// Get CSR activities
router.get('/social', (req, res) => {
    db.all('SELECT * FROM csr_activities ORDER BY date DESC', [], (err, activities) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching CSR logs' });
        }
        res.json({
            activities: activities,
            participationRate: [60, 65, 70, 75, 80, 86], // Monthly Jan - Jun
            totals: {
                csrActivitiesCompleted: activities.filter(a => a.status === 'Completed').length,
                employeeParticipation: '86%',
                diversityScore: '91%',
                trainingCompletion: '74%'
            }
        });
    });
});

// Add CSR activity
router.post('/social', (req, res) => {
    const { activity, department } = req.body;

    if (!activity || !department) {
        return res.status(400).json({ error: 'Please provide activity name and department' });
    }

    const date = new Date().toISOString().split('T')[0];
    const status = 'Pending';

    db.run(
        'INSERT INTO csr_activities (activity, department, status, date) VALUES (?, ?, ?, ?)',
        [activity, department, status, date],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error adding CSR activity' });
            }
            res.json({
                message: 'CSR activity submitted successfully',
                activity: { id: this.lastID, activity, department, status, date }
            });
        }
    );
});

// POST join / participate in a CSR activity (user_id = 1)
router.post('/social/:id/participate', (req, res) => {
    const { proof } = req.body;

    db.get('SELECT * FROM csr_activities WHERE id = ?', [req.params.id], (errAct, activity) => {
        if (errAct || !activity) {
            return res.status(404).json({ error: 'CSR activity not found' });
        }

        // Check if proof/evidence is required globally
        db.get('SELECT value FROM esg_config WHERE key = "evidence_required"', [], (errConf, confRow) => {
            const isEvidenceRequired = confRow && confRow.value === '1';
            if (isEvidenceRequired && !proof) {
                return res.status(400).json({ error: 'Evidence/proof file is required to participate in this CSR activity' });
            }

            db.get('SELECT name FROM users WHERE id = 1', [], (errUser, user) => {
                const userName = user ? user.name : 'You';
                const dateStr = new Date().toISOString().split('T')[0];

                db.run(
                    `INSERT INTO employee_participation (activity_id, user_id, employee_name, proof, approval_status, points_earned, completion_date)
                     VALUES (?, 1, ?, ?, 'Pending', 0, ?)`,
                    [activity.id, userName, proof || null, dateStr],
                    function(errPart) {
                        if (errPart) {
                            return res.status(500).json({ error: 'Database error joining CSR activity' });
                        }
                        res.json({
                            message: 'CSR participation request submitted successfully. Awaiting approval.'
                        });
                    }
                );
            });
        });
    });
});

// PUT approve/reject CSR participation
router.put('/social/participation/:id/approve', (req, res) => {
    const { approval } = req.body; // 'Approved' or 'Rejected'
    if (!approval || !['Approved', 'Rejected'].includes(approval)) {
        return res.status(400).json({ error: 'Please provide valid approval status: Approved or Rejected' });
    }

    db.get('SELECT * FROM employee_participation WHERE id = ?', [req.params.id], (errPart, part) => {
        if (errPart || !part) {
            return res.status(404).json({ error: 'Participation record not found' });
        }
        if (part.approval_status !== 'Pending') {
            return res.status(400).json({ error: 'Participation record has already been processed' });
        }

        db.get('SELECT * FROM csr_activities WHERE id = ?', [part.activity_id], (errAct, activity) => {
            if (errAct || !activity) {
                return res.status(404).json({ error: 'CSR activity not found' });
            }

            const pointsEarned = approval === 'Approved' ? 150 : 0; // Fixed 150 XP for CSR participation

            db.run(
                'UPDATE employee_participation SET approval_status = ?, points_earned = ? WHERE id = ?',
                [approval === 'Approved' ? 'Approved' : 'Rejected', pointsEarned, req.params.id],
                function(errUpd) {
                    if (errUpd) {
                        return res.status(500).json({ error: 'Database error updating approval status' });
                    }

                    if (approval === 'Approved') {
                        // Update CSR activity status to Completed/Approved if it was pending
                        db.run('UPDATE csr_activities SET status = "Completed" WHERE id = ?', [activity.id]);

                        // Update Leaderboard User's XP
                        db.run('UPDATE leaderboard SET xp = xp + ? WHERE is_current_user = 1', [pointsEarned], function(errLd) {
                            if (errLd) console.error('Error updating leaderboard:', errLd);

                            const currentMonth = new Date().toLocaleString('default', { month: 'short' });
                            db.get('SELECT * FROM xp_history WHERE user_id = ? AND month = ?', [part.user_id, currentMonth], (errXp, xpHRow) => {
                                if (xpHRow) {
                                    db.run('UPDATE xp_history SET xp_earned = xp_earned + ? WHERE id = ?', [pointsEarned, xpHRow.id]);
                                } else {
                                    db.run('INSERT INTO xp_history (user_id, month, xp_earned) VALUES (?, ?, ?)', [part.user_id, currentMonth, pointsEarned]);
                                }
                            });

                            // Create Notification
                            createNotification(
                                part.user_id,
                                'CSR Approved',
                                `🎉 CSR Participation Approved: ${activity.activity}`,
                                `Your participation in "${activity.activity}" has been approved! You earned ${pointsEarned} XP.`
                            );

                            // Check and auto-award badges
                            checkAndAwardBadges(part.user_id, (errBadges, earned) => {
                                if (errBadges) console.error('Error checking badges:', errBadges);
                            });
                        });
                    } else {
                        // Create Notification for Rejection
                        createNotification(
                            part.user_id,
                            'CSR Rejected',
                            `❌ CSR Participation Rejected: ${activity.activity}`,
                            `Your CSR participation request for "${activity.activity}" was not approved.`
                        );
                    }

                    res.json({ message: `CSR participation request marked as ${approval}` });
                }
            );
        });
    });
});

// ==========================================
// GOVERNANCE & POLICIES ENDPOINTS
// ==========================================

// Get governance audits
router.get('/governance', (req, res) => {
    db.all('SELECT * FROM governance_audits ORDER BY date DESC', [], (err, audits) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching audits' });
        }
        res.json({
            audits: audits,
            complianceHistory: [88, 90, 89, 92, 94, 95], // Monthly compliance scores
            totals: {
                complianceScore: '95%',
                policies: audits.length,
                auditsCompleted: audits.filter(a => a.status === 'Active' || a.status === 'Approved').length,
                issuesPending: 4
            }
        });
    });
});

// Add governance audit
router.post('/governance', (req, res) => {
    const { policy_name, owner, status } = req.body;

    if (!policy_name || !owner || !status) {
        return res.status(400).json({ error: 'Please provide policy name, owner, and status' });
    }

    const date = new Date().toISOString().split('T')[0];

    db.run(
        'INSERT INTO governance_audits (policy_name, owner, status, date) VALUES (?, ?, ?, ?)',
        [policy_name, owner, status, date],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error adding audit record' });
            }
            res.json({
                message: 'Audit/Policy record added successfully',
                audit: { id: this.lastID, policy_name, owner, status, date }
            });
        }
    );
});

// GET all policies (separate from audits)
router.get('/policies', (req, res) => {
    db.all('SELECT * FROM policies ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching policies' });
        }
        res.json(rows);
    });
});

// POST create a policy
router.post('/policies', (req, res) => {
    const { title, description, owner, effective_date } = req.body;
    if (!title || !owner) {
        return res.status(400).json({ error: 'Please provide title and owner' });
    }

    const dateStr = effective_date || new Date().toISOString().split('T')[0];

    db.run(
        'INSERT INTO policies (title, description, owner, status, effective_date) VALUES (?, ?, ?, "Draft", ?)',
        [title.trim(), description ? description.trim() : '', owner.trim(), dateStr],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error creating policy' });
            }
            res.status(201).json({
                message: 'Policy created successfully as Draft',
                policy: { id: this.lastID, title, description, owner, status: 'Draft', effective_date: dateStr }
            });
        }
    );
});

// PUT update policy status
router.put('/policies/:id/status', (req, res) => {
    const { status } = req.body;
    const allowed = ['Draft', 'Active', 'Archived'];
    if (!status || !allowed.includes(status)) {
        return res.status(400).json({ error: 'Please provide valid status: Draft, Active, or Archived' });
    }

    db.run('UPDATE policies SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error updating policy status' });
        }

        if (status === 'Active') {
            // Notify all users about new policy (using user_id = 1 for the main demo user)
            createNotification(
                1,
                'Policy Active',
                `📄 New Active Policy: ${req.body.title || 'Review Required'}`,
                `A new policy has been activated. Please review and acknowledge it.`
            );
        }

        res.json({ message: `Policy status updated to ${status} successfully` });
    });
});

// POST acknowledge a policy (user_id = 1)
router.post('/policies/:id/acknowledge', (req, res) => {
    db.get('SELECT * FROM policies WHERE id = ?', [req.params.id], (errPol, policy) => {
        if (errPol || !policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }
        if (policy.status !== 'Active') {
            return res.status(400).json({ error: 'Can only acknowledge Active policies' });
        }

        db.get('SELECT name FROM users WHERE id = 1', [], (errUser, user) => {
            const userName = user ? user.name : 'You';
            const dateStr = new Date().toISOString().split('T')[0];

            db.run(
                'INSERT OR IGNORE INTO policy_acknowledgements (policy_id, user_id, employee_name, acknowledged_at) VALUES (?, 1, ?, ?)',
                [policy.id, userName, dateStr],
                function(errAck) {
                    if (errAck) {
                        return res.status(500).json({ error: 'Database error acknowledging policy' });
                    }
                    if (this.changes === 0) {
                        return res.status(400).json({ error: 'You have already acknowledged this policy' });
                    }

                    // Create Notification
                    createNotification(
                        1,
                        'Policy Acknowledged',
                        `✅ Policy Acknowledged: ${policy.title}`,
                        `Thank you for acknowledging the "${policy.title}" policy.`
                    );

                    res.json({ message: 'Policy successfully acknowledged' });
                }
            );
        });
    });
});

// GET all acknowledgements for a policy
router.get('/policies/:id/acknowledgements', (req, res) => {
    db.all('SELECT * FROM policy_acknowledgements WHERE policy_id = ?', [req.params.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching acknowledgements' });
        }
        res.json(rows);
    });
});

// ==========================================
// COMPLIANCE ISSUES ENDPOINTS
// ==========================================

// GET all compliance issues (checks and flags overdue issues dynamically)
router.get('/compliance-issues', (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    // First check for and update status to Overdue if due_date has passed and status is Open
    db.run(
        'UPDATE compliance_issues SET status = "Overdue" WHERE due_date < ? AND status = "Open"',
        [today],
        function(errUpd) {
            if (errUpd) console.error('Error updating overdue status:', errUpd);

            db.all('SELECT * FROM compliance_issues ORDER BY due_date ASC', [], (err, rows) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error fetching compliance issues' });
                }
                res.json(rows);
            });
        }
    );
});

// POST create compliance issue
router.post('/compliance-issues', (req, res) => {
    const { audit_id, severity, description, owner, due_date } = req.body;
    if (!description || !owner || !due_date) {
        return res.status(400).json({ error: 'Please provide description, owner, and due_date' });
    }

    db.run(
        'INSERT INTO compliance_issues (audit_id, severity, description, owner, due_date, status) VALUES (?, ?, ?, ?, ?, "Open")',
        [audit_id || null, severity || 'Medium', description.trim(), owner.trim(), due_date],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error creating compliance issue' });
            }

            // Create notification for new compliance issue
            createNotification(
                1,
                'Compliance Issue',
                `🚨 New Compliance Issue Raised`,
                `A new issue has been raised: "${description}". Assigned Owner: ${owner}. Due Date: ${due_date}`
            );

            res.status(201).json({
                message: 'Compliance issue raised successfully',
                issue: { id: this.lastID, audit_id, severity, description, owner, due_date, status: 'Open' }
            });
        }
    );
});

// PUT update compliance issue
router.put('/compliance-issues/:id', (req, res) => {
    const { status, owner, due_date, severity, description } = req.body;
    db.run(
        `UPDATE compliance_issues
         SET status = COALESCE(?, status),
             owner = COALESCE(?, owner),
             due_date = COALESCE(?, due_date),
             severity = COALESCE(?, severity),
             description = COALESCE(?, description)
         WHERE id = ?`,
        [status, owner, due_date, severity, description, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error updating compliance issue' });
            }
            res.json({ message: 'Compliance issue updated successfully' });
        }
    );
});

// ==========================================
// SCORES & ESG CALCULATOR ENDPOINTS
// ==========================================

// Helper to compute and update ESG scores
function calculateESGScores(callback) {
    // 1. Get organizational weights from config
    db.all('SELECT key, value FROM esg_config WHERE key IN ("env_weight", "social_weight", "governance_weight")', [], (err, configRows) => {
        let envW = 0.4, socW = 0.3, govW = 0.3; // Defaults
        if (!err && configRows) {
            configRows.forEach(row => {
                if (row.key === 'env_weight') envW = parseFloat(row.value) / 100;
                if (row.key === 'social_weight') socW = parseFloat(row.value) / 100;
                if (row.key === 'governance_weight') govW = parseFloat(row.value) / 100;
            });
        }

        // 2. Fetch carbon records by department to calculate Env score
        db.all('SELECT department, SUM(emission) AS total_emissions FROM carbon_records GROUP BY department', [], (errEnv, envRows) => {
            const envByDept = {};
            if (!errEnv && envRows) {
                envRows.forEach(r => {
                    // Score starts at 100, and is penalized based on carbon emission relative to some threshold e.g. 100 tons max
                    const score = Math.max(0, 100 - Math.round(r.total_emissions));
                    envByDept[r.department] = score;
                });
            }

            // 3. Fetch CSR activities by department to calculate Social score
            db.all('SELECT department, COUNT(*) AS total_activities, SUM(CASE WHEN status="Completed" THEN 1 ELSE 0 END) AS completed_activities FROM csr_activities GROUP BY department', [], (errSoc, socRows) => {
                const socByDept = {};
                if (!errSoc && socRows) {
                    socRows.forEach(r => {
                        const score = r.total_activities > 0 ? Math.round((r.completed_activities / r.total_activities) * 100) : 100;
                        socByDept[r.department] = score;
                    });
                }

                // 4. Fetch governance audits to calculate Gov score
                db.all('SELECT owner AS department, COUNT(*) AS total_policies, SUM(CASE WHEN status="Active" OR status="Approved" THEN 1 ELSE 0 END) AS active_policies FROM governance_audits GROUP BY owner', [], (errGov, govRows) => {
                    const govByDept = {};
                    if (!errGov && govRows) {
                        govRows.forEach(r => {
                            // Standardize department names from owners if needed
                            const deptName = r.department.replace(' Department', '').trim();
                            const score = r.total_policies > 0 ? Math.round((r.active_policies / r.total_policies) * 100) : 100;
                            govByDept[deptName] = score;
                        });
                    }

                    // 5. Fetch all departments
                    db.all('SELECT name FROM departments', [], (errDepts, depts) => {
                        if (errDepts || !depts) return callback(errDepts || new Error('No departments found'));

                        const dateStr = new Date().toISOString().split('T')[0];
                        let processedCount = 0;
                        const results = [];

                        depts.forEach(dept => {
                            const name = dept.name;
                            const eScore = envByDept[name] !== undefined ? envByDept[name] : 80; // default
                            const sScore = socByDept[name] !== undefined ? socByDept[name] : 80; // default
                            const gScore = govByDept[name] !== undefined ? govByDept[name] : 80; // default
                            
                            // Weighted overall score
                            const totalScore = Math.round((eScore * envW) + (sScore * socW) + (gScore * govW));

                            results.push({ department: name, environmental_score: eScore, social_score: sScore, governance_score: gScore, total_score: totalScore });

                            // Insert or update score in database
                            db.run(
                                `INSERT INTO department_scores (department, environmental_score, social_score, governance_score, total_score, calculated_at)
                                 VALUES (?, ?, ?, ?, ?, ?)
                                 ON CONFLICT(department) DO UPDATE SET
                                    environmental_score=excluded.environmental_score,
                                    social_score=excluded.social_score,
                                    governance_score=excluded.governance_score,
                                    total_score=excluded.total_score,
                                    calculated_at=excluded.calculated_at`,
                                [name, eScore, sScore, gScore, totalScore, dateStr],
                                function(errUpd) {
                                    if (errUpd) console.error(`Error saving score for ${name}:`, errUpd);
                                    processedCount++;
                                    if (processedCount === depts.length) {
                                        callback(null, results);
                                    }
                                }
                            );
                        });
                    });
                });
            });
        });
    });
}

// GET weighted ESG scores
router.get('/scores', (req, res) => {
    db.all('SELECT * FROM department_scores', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching ESG scores' });
        }
        res.json(rows);
    });
});

// POST recalculate ESG scores
router.post('/scores/recalculate', (req, res) => {
    calculateESGScores((err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to calculate ESG scores' });
        }
        res.json({
            message: 'ESG scores recalculated successfully',
            scores: results
        });
    });
});

// ==========================================
// REPORTS ENDPOINTS
// ==========================================

// Get reports list
router.get('/reports', (req, res) => {
    db.all('SELECT * FROM reports ORDER BY id DESC', [], (err, reps) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching reports' });
        }
        res.json({
            reports: reps,
            monthlyReports: [5, 7, 6, 8, 10, 12],
            totals: {
                totalReports: reps.length,
                thisMonth: 6,
                performanceScore: '92%',
                totalDownloads: 180
            }
        });
    });
});

module.exports = router;
