// Add auth check at top
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', () => {
    fetchGamificationData();
});

let xpChart;

function fetchGamificationData() {
    fetch('/api/gamification/stats')
        .then(res => res.json())
        .then(data => {
            // 1. Update Score Cards
            const cardElements = document.querySelectorAll(".cards .card h2");
            if (cardElements.length >= 4) {
                cardElements[0].innerText = Number(data.totals.totalXP).toLocaleString();
                cardElements[1].innerText = data.totals.badgesEarned;
                cardElements[2].innerText = data.totals.challengesCompleted;
                cardElements[3].innerText = data.totals.ranking;
            }

            // 2. Initialize or Update Chart
            const ctx = document.getElementById("xpChart");
            if (ctx) {
                if (xpChart) {
                    xpChart.destroy();
                }
                xpChart = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: data.xpHistory.labels,
                        datasets: [{
                            label: "XP Earned",
                            data: data.xpHistory.data,
                            backgroundColor: [
                                "#8b5cf6",
                                "#7c3aed",
                                "#6d28d9",
                                "#9333ea",
                                "#a855f7",
                                "#c084fc"
                            ],
                            borderRadius: 8
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

            // 3. Populate Leaderboard Table
            const table = document.querySelector(".table-section table");
            if (table) {
                const headerRow = `<tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>XP</th>
                </tr>`;
                
                let rowsHtml = headerRow;
                data.leaderboard.forEach((user, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1);
                    const nameLabel = user.is_current_user ? 'You' : user.name;
                    rowsHtml += `<tr style="${user.is_current_user ? 'font-weight: bold; background: #faf5ff;' : ''}">
                        <td>${medal}</td>
                        <td>${nameLabel}</td>
                        <td>${user.xp}</td>
                    </tr>`;
                });
                table.innerHTML = rowsHtml;
                
                // Re-apply table row hover animations
                applyTableRowHover();
            }

            // 4. Update Progress Bar
            const progress = document.querySelector("progress");
            if (progress) {
                // Calculate progress to next level (level up every 1000 XP)
                const currentXP = data.totals.totalXP;
                const currentLevel = Math.floor(currentXP / 1000) + 1;
                const levelProgress = Math.floor((currentXP % 1000) / 10);
                
                progress.value = levelProgress;
                
                const progressText = document.querySelector(".progress-section p");
                if (progressText) {
                    progressText.innerText = `${levelProgress}% Completed to Reach Level ${currentLevel + 1}`;
                }
            }

            // 5. Populate Available Rewards dynamically
            const rewardsContainer = document.querySelector(".activities");
            if (rewardsContainer) {
                fetch('/api/rewards')
                    .then(res => res.json())
                    .then(rewards => {
                        if (!rewards || rewards.length === 0) return;
                        let rewardsHtml = '<h2>Available Rewards</h2><ul>';
                        rewards.forEach(r => {
                            rewardsHtml += `
                                <li>
                                    🎁 <strong>${r.name}</strong> - ${r.description} (${r.points_required} XP) [Stock: ${r.stock}]
                                </li>
                            `;
                        });
                        rewardsHtml += '</ul>';
                        rewardsContainer.innerHTML = rewardsHtml;
                    })
                    .catch(err => console.error('Error fetching rewards list:', err));
            }
        })
        .catch(err => console.error('Error loading gamification stats:', err));
}

// Claim Reward
const rewardBtn = document.querySelector(".reward-btn");
if (rewardBtn) {
    rewardBtn.addEventListener("click", () => {
        // Fetch available rewards
        fetch('/api/rewards')
            .then(res => res.json())
            .then(rewards => {
                if (!rewards || rewards.length === 0) {
                    alert("No rewards available in the catalog.");
                    return;
                }
                
                let rewardText = "Select a reward to claim by number:\n\n";
                rewards.forEach((r, idx) => {
                    rewardText += `${idx + 1}. ${r.name} - Cost: ${r.points_required} XP (Stock: ${r.stock})\n`;
                });
                
                const selection = prompt(rewardText);
                if (!selection) return;
                
                const idx = parseInt(selection) - 1;
                if (isNaN(idx) || idx < 0 || idx >= rewards.length) {
                    alert("Invalid selection.");
                    return;
                }
                
                const reward = rewards[idx];
                
                fetch('/api/gamification/claim', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reward_id: reward.id })
                })
                .then(res => {
                    if (!res.ok) return res.json().then(e => { throw new Error(e.error || 'Failed to claim reward') });
                    return res.json();
                })
                .then(data => {
                    alert(`🎉 Congratulations!\n\n${data.message}`);
                    fetchGamificationData(); // Refresh UI
                })
                .catch(err => {
                    alert("Error claiming reward: " + err.message);
                });
            })
            .catch(err => alert("Error loading reward catalog: " + err.message));
    });
}

function applyTableRowHover() {
    const rows = document.querySelectorAll("table tr");
    rows.forEach((row, index) => {
        if (index !== 0) {
            row.addEventListener("mouseenter", () => {
                row.style.background = "#f3e8ff";
            });
            row.style.transition = "background 0.2s";
            row.addEventListener("mouseleave", () => {
                row.style.background = "white";
            });
        }
    });
}

// Card Hover effects
const cards = document.querySelectorAll(".card");
cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-8px)";
        card.style.transition = "0.3s";
    });
    card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0px)";
    });
});