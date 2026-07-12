const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
    }
});

// Run migrations and seed data
db.serialize(() => {

    // ============================================================
    // EXISTING TABLES (unchanged)
    // ============================================================

    // 1. Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            company TEXT,
            dark_mode INTEGER DEFAULT 0,
            email_notifications INTEGER DEFAULT 1,
            push_notifications INTEGER DEFAULT 1,
            theme TEXT DEFAULT 'Default'
        )
    `);

    // 2. Carbon Records Table
    db.run(`
        CREATE TABLE IF NOT EXISTS carbon_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department TEXT NOT NULL,
            emission REAL NOT NULL,
            status TEXT NOT NULL,
            date TEXT NOT NULL
        )
    `);

    // 3. CSR Activities Table
    db.run(`
        CREATE TABLE IF NOT EXISTS csr_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity TEXT NOT NULL,
            department TEXT NOT NULL,
            status TEXT NOT NULL,
            date TEXT NOT NULL
        )
    `);

    // 4. Governance Audits/Policies Table
    db.run(`
        CREATE TABLE IF NOT EXISTS governance_audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_name TEXT NOT NULL,
            owner TEXT NOT NULL,
            status TEXT NOT NULL,
            date TEXT NOT NULL
        )
    `);

    // 5. Gamification / XP History Table
    db.run(`
        CREATE TABLE IF NOT EXISTS xp_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            month TEXT NOT NULL,
            xp_earned INTEGER NOT NULL
        )
    `);

    // 6. Leaderboard Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            xp INTEGER NOT NULL,
            is_current_user INTEGER DEFAULT 0
        )
    `);

    // 7. Reports Table
    db.run(`
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL
        )
    `);

    // ============================================================
    // NEW TABLES
    // ============================================================

    // 8. Departments Table
    db.run(`
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            head TEXT,
            parent_dept_id INTEGER,
            employee_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Active'
        )
    `);

    // 9. Categories Table (shared for CSR Activities and Challenges)
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'Active'
        )
    `);

    // 10. Emission Factors Table
    db.run(`
        CREATE TABLE IF NOT EXISTS emission_factors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            factor_per_unit REAL NOT NULL,
            unit TEXT NOT NULL,
            description TEXT
        )
    `);

    // 11. ESG Goals Table
    db.run(`
        CREATE TABLE IF NOT EXISTS esg_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            target REAL NOT NULL,
            current_value REAL DEFAULT 0,
            unit TEXT DEFAULT '%',
            deadline TEXT,
            department TEXT,
            status TEXT DEFAULT 'Active'
        )
    `);

    // 12. Policies Table (separate from governance_audits)
    db.run(`
        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            owner TEXT NOT NULL,
            status TEXT DEFAULT 'Draft',
            effective_date TEXT
        )
    `);

    // 13. Badges Table
    db.run(`
        CREATE TABLE IF NOT EXISTS badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            unlock_rule_type TEXT NOT NULL,
            unlock_rule_value INTEGER NOT NULL,
            icon TEXT DEFAULT '🏅'
        )
    `);

    // 14. Earned Badges Table (links users to badges they've earned)
    db.run(`
        CREATE TABLE IF NOT EXISTS earned_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            badge_id INTEGER NOT NULL,
            earned_at TEXT NOT NULL,
            UNIQUE(user_id, badge_id)
        )
    `);

    // 15. Rewards Table
    db.run(`
        CREATE TABLE IF NOT EXISTS rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            points_required INTEGER NOT NULL,
            stock INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Active'
        )
    `);

    // 16. Challenges Table
    db.run(`
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category_id INTEGER,
            description TEXT,
            xp INTEGER DEFAULT 100,
            difficulty TEXT DEFAULT 'Medium',
            evidence_required INTEGER DEFAULT 0,
            deadline TEXT,
            status TEXT DEFAULT 'Draft'
        )
    `);

    // 17. Challenge Participation Table
    db.run(`
        CREATE TABLE IF NOT EXISTS challenge_participation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            employee_name TEXT NOT NULL,
            progress INTEGER DEFAULT 0,
            proof TEXT,
            approval TEXT DEFAULT 'Pending',
            xp_awarded INTEGER DEFAULT 0,
            submitted_at TEXT
        )
    `);

    // 18. Employee Participation in CSR Activities
    db.run(`
        CREATE TABLE IF NOT EXISTS employee_participation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            employee_name TEXT NOT NULL,
            proof TEXT,
            approval_status TEXT DEFAULT 'Pending',
            points_earned INTEGER DEFAULT 0,
            completion_date TEXT
        )
    `);

    // 19. Policy Acknowledgements Table
    db.run(`
        CREATE TABLE IF NOT EXISTS policy_acknowledgements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            employee_name TEXT NOT NULL,
            acknowledged_at TEXT NOT NULL,
            UNIQUE(policy_id, user_id)
        )
    `);

    // 20. Compliance Issues Table
    db.run(`
        CREATE TABLE IF NOT EXISTS compliance_issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audit_id INTEGER,
            severity TEXT NOT NULL DEFAULT 'Medium',
            description TEXT NOT NULL,
            owner TEXT NOT NULL,
            due_date TEXT NOT NULL,
            status TEXT DEFAULT 'Open'
        )
    `);

    // 21. Department Scores Table
    db.run(`
        CREATE TABLE IF NOT EXISTS department_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department TEXT NOT NULL UNIQUE,
            environmental_score REAL DEFAULT 0,
            social_score REAL DEFAULT 0,
            governance_score REAL DEFAULT 0,
            total_score REAL DEFAULT 0,
            calculated_at TEXT
        )
    `);

    // 22. Notifications Table
    db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    `);

    // 23. ESG Config Table (key-value store for org-level settings)
    db.run(`
        CREATE TABLE IF NOT EXISTS esg_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        )
    `);

    // ============================================================
    // SEED DATA - EXISTING
    // ============================================================

    // Seed Demo User
    db.get("SELECT * FROM users WHERE email = 'admin@ecosphere.com'", (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('123456', 10);
            db.run(`
                INSERT INTO users (name, email, password_hash, company, dark_mode, email_notifications, push_notifications, theme)
                VALUES ('Admin', 'admin@ecosphere.com', ?, 'EcoSphere Pvt Ltd', 0, 1, 1, 'Default')
            `, [hash]);
            console.log('Seeded demo user admin@ecosphere.com');
        }
    });

    // Seed Carbon Records
    db.get("SELECT COUNT(*) AS count FROM carbon_records", (err, row) => {
        if (row && row.count === 0) {
            const records = [
                ['Manufacturing', 65, 'High', '2026-07-10'],
                ['IT', 20, 'Low', '2026-07-09'],
                ['HR', 12, 'Excellent', '2026-07-08'],
                ['Logistics', 48, 'Medium', '2026-07-07']
            ];
            const stmt = db.prepare(`INSERT INTO carbon_records (department, emission, status, date) VALUES (?, ?, ?, ?)`);
            records.forEach(r => stmt.run(r));
            stmt.finalize();
            console.log('Seeded carbon records');
        }
    });

    // Seed CSR Activities
    db.get("SELECT COUNT(*) AS count FROM csr_activities", (err, row) => {
        if (row && row.count === 0) {
            const activities = [
                ['Blood Donation', 'HR', 'Completed', '2026-06-15'],
                ['Tree Plantation', 'IT', 'Completed', '2026-06-20'],
                ['Education Camp', 'Sales', 'Pending', '2026-07-01'],
                ['Health Camp', 'Finance', 'Approved', '2026-07-05']
            ];
            const stmt = db.prepare(`INSERT INTO csr_activities (activity, department, status, date) VALUES (?, ?, ?, ?)`);
            activities.forEach(a => stmt.run(a));
            stmt.finalize();
            console.log('Seeded CSR activities');
        }
    });

    // Seed Governance Audits
    db.get("SELECT COUNT(*) AS count FROM governance_audits", (err, row) => {
        if (row && row.count === 0) {
            const audits = [
                ['Data Privacy', 'IT Department', 'Active', '2026-05-10'],
                ['Health & Safety', 'HR', 'Approved', '2026-06-11'],
                ['Environmental Policy', 'Operations', 'Under Review', '2026-06-12'],
                ['Code of Conduct', 'Management', 'Active', '2026-07-01']
            ];
            const stmt = db.prepare(`INSERT INTO governance_audits (policy_name, owner, status, date) VALUES (?, ?, ?, ?)`);
            audits.forEach(a => stmt.run(a));
            stmt.finalize();
            console.log('Seeded governance audits');
        }
    });

    // Seed XP History
    db.get("SELECT COUNT(*) AS count FROM xp_history", (err, row) => {
        if (row && row.count === 0) {
            const xp = [
                [1, 'Jan', 1200],
                [1, 'Feb', 1800],
                [1, 'Mar', 2200],
                [1, 'Apr', 3100],
                [1, 'May', 3700],
                [1, 'Jun', 4250]
            ];
            const stmt = db.prepare(`INSERT INTO xp_history (user_id, month, xp_earned) VALUES (?, ?, ?)`);
            xp.forEach(x => stmt.run(x));
            stmt.finalize();
            console.log('Seeded XP history');
        }
    });

    // Seed Leaderboard
    db.get("SELECT COUNT(*) AS count FROM leaderboard", (err, row) => {
        if (row && row.count === 0) {
            const board = [
                ['Rahul', 5200, 0],
                ['You', 4250, 1],
                ['Ananya', 4100, 0],
                ['Amit', 3920, 0]
            ];
            const stmt = db.prepare(`INSERT INTO leaderboard (name, xp, is_current_user) VALUES (?, ?, ?)`);
            board.forEach(b => stmt.run(b));
            stmt.finalize();
            console.log('Seeded leaderboard');
        }
    });

    // Seed Reports
    db.get("SELECT COUNT(*) AS count FROM reports", (err, row) => {
        if (row && row.count === 0) {
            const reps = [
                ['January ESG Report', '05 Jan 2026', 'Completed'],
                ['February ESG Report', '05 Feb 2026', 'Completed'],
                ['March ESG Report', '05 Mar 2026', 'Processing'],
                ['Quarterly ESG Report', '10 Apr 2026', 'Completed']
            ];
            const stmt = db.prepare(`INSERT INTO reports (name, date, status) VALUES (?, ?, ?)`);
            reps.forEach(r => stmt.run(r));
            stmt.finalize();
            console.log('Seeded reports list');
        }
    });

    // ============================================================
    // SEED DATA - NEW TABLES
    // ============================================================

    // Seed Departments
    db.get("SELECT COUNT(*) AS count FROM departments", (err, row) => {
        if (row && row.count === 0) {
            const depts = [
                ['Manufacturing', 'MFG', 'Vikram Singh', null, 120],
                ['Information Technology', 'IT', 'Priya Sharma', null, 85],
                ['Human Resources', 'HR', 'Neha Gupta', null, 45],
                ['Logistics', 'LOG', 'Amit Patel', null, 60],
                ['Sales', 'SAL', 'Riya Mehta', null, 75],
                ['Finance', 'FIN', 'Arun Kumar', null, 35]
            ];
            const stmt = db.prepare(`INSERT INTO departments (name, code, head, parent_dept_id, employee_count) VALUES (?, ?, ?, ?, ?)`);
            depts.forEach(d => stmt.run(d));
            stmt.finalize();
            console.log('Seeded departments');
        }
    });

    // Seed Categories
    db.get("SELECT COUNT(*) AS count FROM categories", (err, row) => {
        if (row && row.count === 0) {
            const cats = [
                ['Community Service', 'CSR Activity'],
                ['Environmental', 'CSR Activity'],
                ['Health & Wellness', 'CSR Activity'],
                ['Education', 'CSR Activity'],
                ['Carbon Reduction', 'Challenge'],
                ['Energy Saving', 'Challenge'],
                ['Waste Management', 'Challenge'],
                ['Sustainability', 'Challenge']
            ];
            const stmt = db.prepare(`INSERT INTO categories (name, type) VALUES (?, ?)`);
            cats.forEach(c => stmt.run(c));
            stmt.finalize();
            console.log('Seeded categories');
        }
    });

    // Seed Emission Factors
    db.get("SELECT COUNT(*) AS count FROM emission_factors", (err, row) => {
        if (row && row.count === 0) {
            const factors = [
                ['Electricity (Grid)', 'Energy', 0.82, 'kWh', 'Grid electricity - average national factor'],
                ['Natural Gas', 'Energy', 2.04, 'cubic meter', 'Natural gas combustion'],
                ['Diesel Fleet', 'Fleet', 2.68, 'liter', 'Diesel vehicle fuel combustion'],
                ['Petrol Fleet', 'Fleet', 2.31, 'liter', 'Petrol vehicle fuel combustion'],
                ['Air Travel', 'Fleet', 0.255, 'km/passenger', 'Economy class air travel'],
                ['Purchased Goods', 'Manufacturing', 0.5, 'kg', 'Average manufactured goods factor'],
                ['Business Meals', 'Expenses', 3.5, 'meal', 'Average food & beverage carbon cost'],
                ['Paper Usage', 'Manufacturing', 1.84, 'kg', 'Paper production and disposal']
            ];
            const stmt = db.prepare(`INSERT INTO emission_factors (name, category, factor_per_unit, unit, description) VALUES (?, ?, ?, ?, ?)`);
            factors.forEach(f => stmt.run(f));
            stmt.finalize();
            console.log('Seeded emission factors');
        }
    });

    // Seed ESG Goals
    db.get("SELECT COUNT(*) AS count FROM esg_goals", (err, row) => {
        if (row && row.count === 0) {
            const goals = [
                ['Carbon Reduction Target', 100, 82, '%', '2026-12-31', 'Manufacturing', 'Active'],
                ['Renewable Energy Adoption', 100, 70, '%', '2026-12-31', 'IT', 'Active'],
                ['Waste Recycling Rate', 100, 90, '%', '2026-09-30', 'HR', 'Active'],
                ['Employee Training Completion', 100, 74, '%', '2026-12-31', 'All', 'Active'],
                ['Policy Compliance Rate', 100, 95, '%', '2026-12-31', 'Management', 'Active']
            ];
            const stmt = db.prepare(`INSERT INTO esg_goals (name, target, current_value, unit, deadline, department, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            goals.forEach(g => stmt.run(g));
            stmt.finalize();
            console.log('Seeded ESG goals');
        }
    });

    // Seed Policies
    db.get("SELECT COUNT(*) AS count FROM policies", (err, row) => {
        if (row && row.count === 0) {
            const pols = [
                ['Data Privacy Policy', 'Governs collection, storage and use of personal data', 'IT Department', 'Active', '2026-01-01'],
                ['Health & Safety Policy', 'Workplace safety standards and emergency procedures', 'HR', 'Active', '2026-01-01'],
                ['Environmental Policy', 'Carbon reduction commitments and green practices', 'Operations', 'Active', '2026-02-01'],
                ['Code of Conduct', 'Employee behavior and ethics guidelines', 'Management', 'Active', '2026-01-01'],
                ['Anti-Corruption Policy', 'Zero tolerance for bribery and corruption', 'Finance', 'Draft', '2026-08-01']
            ];
            const stmt = db.prepare(`INSERT INTO policies (title, description, owner, status, effective_date) VALUES (?, ?, ?, ?, ?)`);
            pols.forEach(p => stmt.run(p));
            stmt.finalize();
            console.log('Seeded policies');
        }
    });

    // Seed Badges
    db.get("SELECT COUNT(*) AS count FROM badges", (err, row) => {
        if (row && row.count === 0) {
            const badgeList = [
                ['Eco Starter', 'Earn your first 500 XP', 'xp', 500, '🌱'],
                ['Green Warrior', 'Earn 2000 XP', 'xp', 2000, '⚔️'],
                ['Eco Champion', 'Earn 5000 XP', 'xp', 5000, '🏆'],
                ['Challenge Newbie', 'Complete 1 challenge', 'challenges', 1, '🎯'],
                ['Challenge Pro', 'Complete 5 challenges', 'challenges', 5, '🥇'],
                ['Challenge Master', 'Complete 10 challenges', 'challenges', 10, '👑'],
                ['CSR Hero', 'Participate in 3 CSR activities', 'csr', 3, '🤝'],
                ['Sustainability Star', 'Earn 3500 XP', 'xp', 3500, '⭐']
            ];
            const stmt = db.prepare(`INSERT INTO badges (name, description, unlock_rule_type, unlock_rule_value, icon) VALUES (?, ?, ?, ?, ?)`);
            badgeList.forEach(b => stmt.run(b));
            stmt.finalize();
            console.log('Seeded badges');
        }
    });

    // Seed Rewards
    db.get("SELECT COUNT(*) AS count FROM rewards", (err, row) => {
        if (row && row.count === 0) {
            const rewardList = [
                ['Eco Champion Badge', 'Exclusive digital badge for top performers', 500, 50, 'Active'],
                ['Green Warrior Certificate', 'Printed certificate of sustainability achievement', 750, 30, 'Active'],
                ['Sustainability Star Trophy', 'Physical trophy for ESG leaders', 1500, 10, 'Active'],
                ['Premium EcoSphere Theme', 'Unlock exclusive app theme', 300, 100, 'Active'],
                ['Extra Day Off Voucher', 'One additional paid leave day', 3000, 5, 'Active'],
                ['Company Merchandise Pack', 'EcoSphere branded merchandise kit', 800, 25, 'Active']
            ];
            const stmt = db.prepare(`INSERT INTO rewards (name, description, points_required, stock, status) VALUES (?, ?, ?, ?, ?)`);
            rewardList.forEach(r => stmt.run(r));
            stmt.finalize();
            console.log('Seeded rewards');
        }
    });

    // Seed Challenges
    db.get("SELECT COUNT(*) AS count FROM challenges", (err, row) => {
        if (row && row.count === 0) {
            const challengeList = [
                ['Use Public Transport for 30 Days', 1, 'Commit to public transport for a full month and reduce fleet emissions', 200, 'Medium', 1, '2026-08-31', 'Active'],
                ['Zero Waste Week', 3, 'Generate zero non-recyclable waste for one full work week', 150, 'Easy', 1, '2026-07-31', 'Active'],
                ['Plant 10 Trees', 1, 'Organize or personally participate in a tree-planting drive', 300, 'Hard', 1, '2026-09-30', 'Active'],
                ['Energy Audit Your Department', 2, 'Conduct and document a full energy usage audit', 250, 'Medium', 1, '2026-08-15', 'Draft'],
                ['CSR Activity Organizer', 1, 'Organize a CSR activity with minimum 10 participants', 400, 'Hard', 1, '2026-12-31', 'Active']
            ];
            const stmt = db.prepare(`INSERT INTO challenges (title, category_id, description, xp, difficulty, evidence_required, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            challengeList.forEach(c => stmt.run(c));
            stmt.finalize();
            console.log('Seeded challenges');
        }
    });

    // Seed Compliance Issues
    db.get("SELECT COUNT(*) AS count FROM compliance_issues", (err, row) => {
        if (row && row.count === 0) {
            const issues = [
                [1, 'High', 'Fire safety audit pending — extinguishers not inspected', 'Safety Officer', '2026-07-20', 'Open'],
                [2, 'Medium', 'Vendor compliance verification required for 3 new suppliers', 'Procurement Head', '2026-07-25', 'Open'],
                [3, 'Low', 'Employee policy acknowledgement incomplete for 12 staff', 'HR Manager', '2026-07-15', 'Overdue'],
                [4, 'Medium', 'GDPR data retention policy review pending', 'IT Manager', '2026-08-01', 'Open']
            ];
            const stmt = db.prepare(`INSERT INTO compliance_issues (audit_id, severity, description, owner, due_date, status) VALUES (?, ?, ?, ?, ?, ?)`);
            issues.forEach(i => stmt.run(i));
            stmt.finalize();
            console.log('Seeded compliance issues');
        }
    });

    // Seed Department Scores
    db.get("SELECT COUNT(*) AS count FROM department_scores", (err, row) => {
        if (row && row.count === 0) {
            const scores = [
                ['Manufacturing', 65, 72, 88, 73.6, '2026-07-01'],
                ['IT', 88, 85, 95, 89.2, '2026-07-01'],
                ['HR', 92, 94, 92, 92.6, '2026-07-01'],
                ['Logistics', 70, 68, 80, 72.4, '2026-07-01'],
                ['Sales', 75, 90, 85, 82.5, '2026-07-01'],
                ['Finance', 80, 78, 96, 83.8, '2026-07-01']
            ];
            const stmt = db.prepare(`INSERT INTO department_scores (department, environmental_score, social_score, governance_score, total_score, calculated_at) VALUES (?, ?, ?, ?, ?, ?)`);
            scores.forEach(s => stmt.run(s));
            stmt.finalize();
            console.log('Seeded department scores');
        }
    });

    // Seed ESG Config (org-level settings and feature toggles)
    db.get("SELECT COUNT(*) AS count FROM esg_config", (err, row) => {
        if (row && row.count === 0) {
            const configs = [
                ['env_weight', '40'],
                ['social_weight', '30'],
                ['governance_weight', '30'],
                ['auto_emission_calc', '0'],
                ['evidence_required', '0'],
                ['badge_auto_award', '1'],
                ['notify_compliance_issue', '1'],
                ['notify_csr_approval', '1'],
                ['notify_challenge_approval', '1'],
                ['notify_policy_reminder', '1'],
                ['notify_badge_unlock', '1']
            ];
            const stmt = db.prepare(`INSERT INTO esg_config (key, value) VALUES (?, ?)`);
            configs.forEach(c => stmt.run(c));
            stmt.finalize();
            console.log('Seeded ESG config');
        }
    });

});

module.exports = db;
