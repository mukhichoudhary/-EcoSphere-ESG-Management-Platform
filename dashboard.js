// Add auth check at top
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});

function fetchDashboardData() {
    Promise.all([
        fetch('/api/esg/environmental').then(res => res.json()),
        fetch('/api/esg/social').then(res => res.json()),
        fetch('/api/esg/governance').then(res => res.json()),
        fetch('/api/gamification/stats').then(res => res.json())
    ])
    .then(([envData, socialData, govData, gameData]) => {
        // 1. Update Score Cards
        const cardElements = document.querySelectorAll(".cards .card h2");
        if (cardElements.length >= 4) {
            // Fetch ESG Scores and Config dynamically
            fetch('/api/esg/scores')
                .then(res => res.json())
                .then(scores => {
                    if (!scores || scores.length === 0) return;
                    let envSum = 0, socSum = 0, govSum = 0;
                    scores.forEach(s => {
                        envSum += s.environmental_score;
                        socSum += s.social_score;
                        govSum += s.governance_score;
                    });
                    const envAvg = Math.round(envSum / scores.length);
                    const socAvg = Math.round(socSum / scores.length);
                    const govAvg = Math.round(govSum / scores.length);

                    fetch('/api/settings/esg-config')
                        .then(res => res.json())
                        .then(config => {
                            const envW = parseFloat(config.env_weight || 40) / 100;
                            const socW = parseFloat(config.social_weight || 30) / 100;
                            const govW = parseFloat(config.governance_weight || 30) / 100;

                            const weightedOverall = Math.round((envAvg * envW) + (socAvg * socW) + (govAvg * govW));

                            cardElements[0].innerText = envAvg + "%";
                            cardElements[1].innerText = socAvg + "%";
                            cardElements[2].innerText = govAvg + "%";
                            cardElements[3].innerText = weightedOverall + "%";
                        });
                })
                .catch(err => console.error('Error fetching scores:', err));
        }

        // 2. Initialize Line Chart (Monthly ESG Score)
        const lineChartCtx = document.getElementById("lineChart");
        if (lineChartCtx) {
            // ESG Score average trend based on monthly trends
            const monthlyScores = [];
            for (let i = 0; i < 6; i++) {
                // Approximate trend based on parts
                const env = envData.monthlyEmissions ? (300 - envData.monthlyEmissions[i]) / 3 : 80; // inverse of carbon
                const soc = socialData.participationRate ? socialData.participationRate[i] : 80;
                const gov = govData.complianceHistory ? govData.complianceHistory[i] : 80;
                monthlyScores.push(Math.round((env + soc + gov) / 3));
            }

            new Chart(lineChartCtx, {
                type: "line",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [{
                        label: "ESG Score",
                        data: monthlyScores,
                        borderColor: "#22c55e",
                        backgroundColor: "rgba(34,197,94,0.2)",
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
        }

        // 3. Initialize Bar Chart (Carbon Emissions by Department)
        const barChartCtx = document.getElementById("barChart");
        if (barChartCtx) {
            // Aggregate carbon emission by department from current database records
            const deptEmissions = {};
            envData.records.forEach(rec => {
                deptEmissions[rec.department] = (deptEmissions[rec.department] || 0) + rec.emission;
            });

            const labels = Object.keys(deptEmissions);
            const data = Object.values(deptEmissions);

            new Chart(barChartCtx, {
                type: "bar",
                data: {
                    labels: labels.length ? labels : ["Manufacturing", "IT", "HR", "Logistics"],
                    datasets: [{
                        label: "Carbon Emission (Tons)",
                        data: data.length ? data : [65, 20, 12, 48],
                        backgroundColor: [
                            "#16a34a",
                            "#0ea5e9",
                            "#f59e0b",
                            "#8b5cf6",
                            "#ef4444"
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // 4. Update Recent Activities Table
        const table = document.querySelector(".activity table");
        if (table) {
            // Keep header row
            const headerRow = table.rows[0].outerHTML;
            let rowsHtml = headerRow;

            // Merge activities from all tables
            const activities = [];
            
            // Env records
            if (envData.records.length > 0) {
                activities.push({
                    dept: envData.records[0].department,
                    action: `Carbon Record added (${envData.records[0].emission} Tons)`,
                    status: envData.records[0].status === 'High' ? 'Pending ⏳' : 'Completed ✅'
                });
            }
            // Social activities
            if (socialData.activities.length > 0) {
                activities.push({
                    dept: socialData.activities[0].department,
                    action: `CSR: ${socialData.activities[0].activity}`,
                    status: socialData.activities[0].status === 'Completed' ? 'Completed ✅' : 'Approved ✔'
                });
            }
            // Governance audits
            if (govData.audits.length > 0) {
                activities.push({
                    dept: govData.audits[0].owner.split(' ')[0], // Get first word
                    action: `Policy: ${govData.audits[0].policy_name}`,
                    status: govData.audits[0].status === 'Active' ? 'Approved ✔' : 'Pending ⏳'
                });
            }

            activities.forEach(act => {
                rowsHtml += `<tr>
                    <td>${act.dept}</td>
                    <td>${act.action}</td>
                    <td>${act.status}</td>
                </tr>`;
            });

            table.innerHTML = rowsHtml;
        }

        // 5. Update Leaderboard List
        const leaderboardList = document.querySelector(".leaderboard ol");
        if (leaderboardList && gameData.leaderboard) {
            leaderboardList.innerHTML = gameData.leaderboard
                .slice(0, 4)
                .map((user, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐';
                    return `<li>${user.name} ${medal} ${user.xp} XP</li>`;
                })
                .join('');
        }

    })
    .catch(err => {
        console.error('Error fetching dashboard data:', err);
    });
}

// Card Hover animation logic
const cards = document.querySelectorAll(".card");
cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-8px)";
    });
    card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
    });
});

// Logout
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    window.location.href = "login.html";
}