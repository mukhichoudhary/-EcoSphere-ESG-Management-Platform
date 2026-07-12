// Add auth check at top
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', () => {
    fetchGovernanceData();
});

let governanceChart;

function fetchGovernanceData() {
    fetch('/api/esg/governance')
        .then(res => res.json())
        .then(data => {
            // 1. Update Score Cards
            const cardElements = document.querySelectorAll(".cards .card h2");
            if (cardElements.length >= 4) {
                cardElements[0].innerText = data.totals.complianceScore;
                cardElements[1].innerText = data.totals.policies;
                cardElements[2].innerText = data.totals.auditsCompleted;
                cardElements[3].innerText = data.totals.issuesPending;
            }

            // 2. Initialize or Update Chart
            const ctx = document.getElementById("governanceChart");
            if (ctx) {
                if (governanceChart) {
                    governanceChart.destroy();
                }
                governanceChart = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        datasets: [{
                            label: "Compliance Score (%)",
                            data: data.complianceHistory,
                            borderColor: "#ea580c",
                            backgroundColor: "rgba(234,88,12,0.2)",
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

            // 3. Populate Policies Table
            const table = document.querySelector(".table-section table");
            if (table) {
                const headerRow = `<tr>
                    <th>Policy</th>
                    <th>Owner</th>
                    <th>Status</th>
                </tr>`;
                
                let rowsHtml = headerRow;
                data.audits.forEach(audit => {
                    rowsHtml += `<tr>
                        <td>${audit.policy_name}</td>
                        <td>${audit.owner}</td>
                        <td>${audit.status}</td>
                    </tr>`;
                });
                table.innerHTML = rowsHtml;
                
                // Re-apply table row hover animations
                applyTableRowHover();
            }

            // 4. Populate Compliance Issues
            const issuesContainer = document.querySelector(".activities");
            if (issuesContainer) {
                fetch('/api/esg/compliance-issues')
                    .then(res => res.json())
                    .then(issues => {
                        if (!issues || issues.length === 0) return;
                        let issuesHtml = '<h2>Compliance Issues</h2><ul>';
                        issues.forEach(iss => {
                            let icon = '🚨';
                            if (iss.status === 'Overdue') icon = '⚠️ [OVERDUE]';
                            else if (iss.status === 'Closed' || iss.status === 'Completed' || iss.status === 'Resolved') icon = '✅';
                            
                            issuesHtml += `
                                <li style="${iss.status === 'Overdue' ? 'color: #ef4444; font-weight: bold;' : ''}">
                                    ${icon} ${iss.description} (Owner: ${iss.owner}, Due: ${iss.due_date})
                                </li>
                            `;
                        });
                        issuesHtml += '</ul>';
                        issuesContainer.innerHTML = issuesHtml;
                    })
                    .catch(err => console.error('Error fetching compliance issues:', err));
            }
        })
        .catch(err => console.error('Error loading governance data:', err));
}

// Add Governance Audit/Policy
const addBtn = document.querySelector(".add-btn");
if (addBtn) {
    addBtn.addEventListener("click", () => {
        const policy_name = prompt("Enter policy or audit name (e.g. Anti-Corruption, Whistleblower Policy):");
        if (!policy_name) return;
        
        const owner = prompt("Enter policy owner (e.g. Management, HR, Legal, IT):");
        if (!owner) return;
        
        const status = prompt("Enter status (Active, Approved, Under Review):", "Active");
        if (!status) return;

        fetch('/api/esg/governance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ policy_name, owner, status })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to save audit');
            return res.json();
        })
        .then(data => {
            alert("✅ Policy/Audit record added successfully!");
            fetchGovernanceData(); // Refresh UI
        })
        .catch(err => {
            alert("Error adding record: " + err.message);
        });
    });
}

function applyTableRowHover() {
    const rows = document.querySelectorAll("table tr");
    rows.forEach((row, index) => {
        if (index !== 0) {
            row.addEventListener("mouseenter", () => {
                row.style.background = "#fff7ed";
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