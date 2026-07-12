// Add auth check at top
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', () => {
    fetchSettings();
});

function fetchSettings() {
    // Fetch profile and preferences settings
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            // Populate inputs
            const nameInput = document.querySelector('.settings-card input[type="text"]');
            if (nameInput) nameInput.value = data.name;

            const emailInput = document.querySelector('.settings-card input[type="email"]');
            if (emailInput) emailInput.value = data.email;

            const companyInputs = document.querySelectorAll('.settings-card input[type="text"]');
            if (companyInputs.length >= 2) companyInputs[1].value = data.company;

            // Preferences
            const darkModeToggle = document.getElementById("darkMode");
            if (darkModeToggle) {
                darkModeToggle.checked = data.dark_mode === 1;
                localStorage.setItem("darkMode", data.dark_mode === 1 ? "true" : "false");
                applyDarkMode(darkModeToggle.checked);
            }

            const toggles = document.querySelectorAll('.settings-card .toggle input[type="checkbox"]');
            if (toggles.length >= 3) {
                toggles[1].checked = data.email_notifications === 1;
                toggles[2].checked = data.push_notifications === 1;
            }

            // Theme dropdown
            const themeSelect = document.getElementById("theme");
            if (themeSelect) {
                themeSelect.value = data.theme;
                localStorage.setItem("theme", data.theme);
                applyTheme(data.theme);
            }
        })
        .catch(err => console.error('Error fetching settings:', err));

    // Fetch ESG weighted configs & toggles
    fetch('/api/settings/esg-config')
        .then(res => res.json())
        .then(config => {
            if (config.env_weight !== undefined) document.getElementById('envWeight').value = config.env_weight;
            if (config.social_weight !== undefined) document.getElementById('socWeight').value = config.social_weight;
            if (config.governance_weight !== undefined) document.getElementById('govWeight').value = config.governance_weight;

            if (config.auto_emission_calc !== undefined) document.getElementById('autoEmissionCalc').checked = config.auto_emission_calc === '1';
            if (config.evidence_required !== undefined) document.getElementById('evidenceRequired').checked = config.evidence_required === '1';
            if (config.badge_auto_award !== undefined) document.getElementById('badgeAutoAward').checked = config.badge_auto_award === '1';

            if (config.notify_compliance_issue !== undefined) document.getElementById('notifyComplianceIssue').checked = config.notify_compliance_issue === '1';
            if (config.notify_csr_approval !== undefined) document.getElementById('notifyApprovalDecision').checked = config.notify_csr_approval === '1';
            if (config.notify_policy_reminder !== undefined) document.getElementById('notifyPolicyReminder').checked = config.notify_policy_reminder === '1';
            if (config.notify_badge_unlock !== undefined) document.getElementById('notifyBadgeUnlock').checked = config.notify_badge_unlock === '1';
        })
        .catch(err => console.error('Error fetching ESG config:', err));
}

// Save Changes
const saveBtn = document.querySelector(".save-btn");
if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        const nameInput = document.querySelector('.settings-card input[type="text"]');
        const emailInput = document.querySelector('.settings-card input[type="email"]');
        const companyInputs = document.querySelectorAll('.settings-card input[type="text"]');
        const darkModeToggle = document.getElementById("darkMode");
        const toggles = document.querySelectorAll('.settings-card .toggle input[type="checkbox"]');
        const themeSelect = document.getElementById("theme");

        const envW = parseFloat(document.getElementById('envWeight').value || 0);
        const socW = parseFloat(document.getElementById('socWeight').value || 0);
        const govW = parseFloat(document.getElementById('govWeight').value || 0);

        if (envW + socW + govW !== 100) {
            alert("❌ ESG weights must sum to exactly 100%!");
            return;
        }

        const settingsData = {
            name: nameInput ? nameInput.value : null,
            email: emailInput ? emailInput.value : null,
            company: companyInputs.length >= 2 ? companyInputs[1].value : null,
            dark_mode: darkModeToggle ? (darkModeToggle.checked ? 1 : 0) : null,
            email_notifications: toggles.length >= 3 ? (toggles[1].checked ? 1 : 0) : null,
            push_notifications: toggles.length >= 3 ? (toggles[2].checked ? 1 : 0) : null,
            theme: themeSelect ? themeSelect.value : null
        };

        const esgConfigData = {
            env_weight: envW,
            social_weight: socW,
            governance_weight: govW,
            auto_emission_calc: document.getElementById('autoEmissionCalc').checked ? 1 : 0,
            evidence_required: document.getElementById('evidenceRequired').checked ? 1 : 0,
            badge_auto_award: document.getElementById('badgeAutoAward').checked ? 1 : 0,
            notify_compliance_issue: document.getElementById('notifyComplianceIssue').checked ? 1 : 0,
            notify_csr_approval: document.getElementById('notifyApprovalDecision').checked ? 1 : 0,
            notify_challenge_approval: document.getElementById('notifyApprovalDecision').checked ? 1 : 0,
            notify_policy_reminder: document.getElementById('notifyPolicyReminder').checked ? 1 : 0,
            notify_badge_unlock: document.getElementById('notifyBadgeUnlock').checked ? 1 : 0
        };

        // Promise to update general settings
        const updateSettings = fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
        }).then(res => {
            if (!res.ok) throw new Error('Failed to update profile settings');
            return res.json();
        });

        // Promise to update ESG configurations
        const updateEsgConfig = fetch('/api/settings/esg-config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(esgConfigData)
        }).then(res => {
            if (!res.ok) throw new Error('Failed to update ESG configuration');
            return res.json();
        });

        Promise.all([updateSettings, updateEsgConfig])
            .then(([settingsResult, esgResult]) => {
                alert("✅ All Settings Saved Successfully!");
                if (settingsResult.settings.name) {
                    localStorage.setItem("username", settingsResult.settings.name);
                }
                localStorage.setItem("theme", settingsResult.settings.theme);
                localStorage.setItem("darkMode", settingsResult.settings.dark_mode === 1 ? "true" : "false");
                
                window.location.reload();
            })
            .catch(err => {
                alert("Error saving settings: " + err.message);
            });
    });
}

// Dark Mode Toggle listener
const darkModeToggle = document.getElementById("darkMode");
if (darkModeToggle) {
    darkModeToggle.addEventListener("change", function () {
        applyDarkMode(this.checked);
    });
}

function applyDarkMode(isDark) {
    if (isDark) {
        document.body.style.background = "#121212";
        document.body.style.color = "white";
        document.querySelectorAll(".settings-card").forEach(card => {
            card.style.background = "#1f2937";
            card.style.color = "white";
        });
    } else {
        document.body.style.background = "#f4f7fb";
        document.body.style.color = "black";
        document.querySelectorAll(".settings-card").forEach(card => {
            card.style.background = "white";
            card.style.color = "black";
        });
    }
}

// Theme Dropdown listener
const themeSelect = document.getElementById("theme");
if (themeSelect) {
    themeSelect.addEventListener("change", function () {
        applyTheme(this.value);
    });
}

function applyTheme(themeValue) {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    switch (themeValue) {
        case "Green":
            sidebar.style.background = "#15803d";
            break;
        case "Blue":
            sidebar.style.background = "#2563eb";
            break;
        case "Purple":
            sidebar.style.background = "#7c3aed";
            break;
        case "Dark":
            sidebar.style.background = "#111827";
            break;
        default:
            sidebar.style.background = "#0f172a";
    }
}

// Security buttons placeholder
const securityButtons = document.querySelectorAll(".security-btn");
securityButtons.forEach(button => {
    button.addEventListener("click", () => {
        alert(button.innerText + "\n\nFeature is simulated under local server.");
    });
});

// Card Hover animation
const cards = document.querySelectorAll(".settings-card");
cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-5px)";
        card.style.transition = ".3s";
    });
    card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0px)";
    });
});