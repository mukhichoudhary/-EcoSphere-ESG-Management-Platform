// Add auth check at top
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', () => {
    fetchSocialData();
});

let socialChart;

function fetchSocialData() {
    fetch('/api/esg/social')
        .then(res => res.json())
        .then(data => {
            // 1. Update Score Cards
            const cardElements = document.querySelectorAll(".cards .card h2");
            if (cardElements.length >= 4) {
                cardElements[0].innerText = data.totals.csrActivitiesCompleted;
                cardElements[1].innerText = data.totals.employeeParticipation;
                cardElements[2].innerText = data.totals.diversityScore;
                cardElements[3].innerText = data.totals.trainingCompletion;
            }

            // 2. Initialize or Update Chart
            const ctx = document.getElementById("socialChart");
            if (ctx) {
                if (socialChart) {
                    socialChart.destroy();
                }
                socialChart = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        datasets: [{
                            label: "Employee Participation (%)",
                            data: data.participationRate,
                            borderColor: "#3b82f6",
                            backgroundColor: "rgba(59,130,246,0.2)",
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

            // 3. Populate CSR Activities Table
            const table = document.querySelector(".table-section table");
            if (table) {
                const headerRow = `<tr>
                    <th>Activity</th>
                    <th>Department</th>
                    <th>Status</th>
                </tr>`;
                
                let rowsHtml = headerRow;
                data.activities.forEach(act => {
                    rowsHtml += `<tr>
                        <td>${act.activity}</td>
                        <td>${act.department}</td>
                        <td>${act.status}</td>
                    </tr>`;
                });
                table.innerHTML = rowsHtml;
                
                // Re-apply table row hover animations
                applyTableRowHover();
            }
        })
        .catch(err => console.error('Error loading social data:', err));
}

// Add CSR Activity
const addBtn = document.querySelector(".add-btn");
if (addBtn) {
    addBtn.addEventListener("click", () => {
        fetch('/api/settings/esg-config')
            .then(res => res.json())
            .then(config => {
                const isProofRequired = config.evidence_required === '1';
                
                const activity = prompt("Enter CSR activity name (e.g. Clean Energy Workshop, Food Drive):");
                if (!activity) return;
                
                const department = prompt("Enter department name (e.g. IT, HR, Sales, Finance):");
                if (!department) return;

                let proof = null;
                if (isProofRequired) {
                    proof = prompt("Evidence is required. Please enter proof (file path, link, or description):");
                    if (!proof) {
                        alert("❌ Proof is required to submit this CSR activity.");
                        return;
                    }
                } else {
                    proof = prompt("Enter proof file path/description (optional):");
                }

                fetch('/api/esg/social', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ activity, department, proof })
                })
                .then(res => {
                    if (!res.ok) return res.json().then(e => { throw new Error(e.error || 'Failed to save') });
                    return res.json();
                })
                .then(data => {
                    alert("✅ CSR Activity submitted successfully! Status is set to Pending.");
                    fetchSocialData(); // Refresh UI
                })
                .catch(err => {
                    alert("Error adding activity: " + err.message);
                });
            });
    });
}

function applyTableRowHover() {
    const rows = document.querySelectorAll("table tr");
    rows.forEach((row, index) => {
        if (index !== 0) {
            row.addEventListener("mouseenter", () => {
                row.style.background = "#eff6ff";
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