// Add auth check at top
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', () => {
    fetchEnvironmentalData();
});

let environmentChart;

function fetchEnvironmentalData() {
    fetch('/api/esg/environmental')
        .then(res => res.json())
        .then(data => {
            // 1. Update Score Cards
            const cardElements = document.querySelectorAll(".cards .card h2");
            if (cardElements.length >= 4) {
                // Calculate actual total emissions from db records
                const totalEmissions = data.records.reduce((sum, rec) => sum + rec.emission, 0);
                cardElements[0].innerText = `${totalEmissions} Tons`;
                cardElements[1].innerText = data.totals.reduction;
                cardElements[2].innerText = data.totals.sustainabilityGoal;
                cardElements[3].innerText = data.totals.environmentalScore;
            }

            // 2. Initialize or Update Chart
            const ctx = document.getElementById("environmentChart");
            if (ctx) {
                if (environmentChart) {
                    environmentChart.destroy();
                }
                environmentChart = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        datasets: [{
                            label: "Carbon Emission (Tons)",
                            data: data.monthlyEmissions,
                            borderColor: "#16a34a",
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

            // 3. Populate Department Table
            const table = document.querySelector(".table-section table");
            if (table) {
                const headerRow = `<tr>
                    <th>Department</th>
                    <th>Emission</th>
                    <th>Status</th>
                </tr>`;
                
                let rowsHtml = headerRow;
                data.records.forEach(rec => {
                    let statusClass = 'status-low';
                    if (rec.status === 'High') statusClass = 'status-high';
                    else if (rec.status === 'Medium') statusClass = 'status-medium';

                    rowsHtml += `<tr>
                        <td>${rec.department}</td>
                        <td>${rec.emission} Tons</td>
                        <td>${rec.status}</td>
                    </tr>`;
                });
                table.innerHTML = rowsHtml;
                
                // Re-apply table row hover animations
                applyTableRowHover();
            }

            // 4. Progress Bars
            const goalsContainer = document.querySelector(".progress-section");
            if (goalsContainer) {
                fetch('/api/esg/goals')
                    .then(res => res.json())
                    .then(goals => {
                        if (!goals || goals.length === 0) return;
                        let goalsHtml = '<h2>Sustainability Goals</h2>';
                        goals.forEach(g => {
                            const percent = Math.round((g.current_value / g.target) * 100);
                            goalsHtml += `
                                <div class="goal">
                                    <p>${g.name} (${g.department})</p>
                                    <progress value="${percent}" max="100"></progress>
                                    <span>${percent}%</span>
                                </div>
                            `;
                        });
                        goalsContainer.innerHTML = goalsHtml;
                        animateProgressBars();
                    })
                    .catch(err => console.error('Error fetching goals:', err));
            } else {
                animateProgressBars();
            }
        })
        .catch(err => console.error('Error loading environmental data:', err));
}

// Add Carbon Record
const addBtn = document.querySelector(".add-btn");
if (addBtn) {
    addBtn.addEventListener("click", () => {
        fetch('/api/settings/esg-config')
            .then(res => res.json())
            .then(config => {
                const isAuto = config.auto_emission_calc === '1';
                if (isAuto) {
                    // Fetch emission factors from backend
                    fetch('/api/esg/emission-factors')
                        .then(res => res.json())
                        .then(factors => {
                            if (!factors || factors.length === 0) {
                                alert("No emission factors configured. Please add one first.");
                                return;
                            }
                            let factorListText = "Select an emission factor by number:\n\n";
                            factors.forEach((f, idx) => {
                                factorListText += `${idx + 1}. ${f.name} (${f.factor_per_unit} kg CO2 / ${f.unit})\n`;
                            });
                            const selection = prompt(factorListText);
                            if (!selection) return;
                            const idx = parseInt(selection) - 1;
                            if (isNaN(idx) || idx < 0 || idx >= factors.length) {
                                alert("Invalid selection.");
                                return;
                            }
                            const factor = factors[idx];
                            
                            const valueStr = prompt(`Enter consumption value in ${factor.unit}:`);
                            if (!valueStr) return;
                            const value = parseFloat(valueStr);
                            if (isNaN(value)) {
                                alert("Invalid consumption value.");
                                return;
                            }

                            const department = prompt("Enter department name (e.g. IT, HR, Manufacturing, Logistics):");
                            if (!department) return;

                            fetch('/api/esg/environmental', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    department,
                                    linked_value: value,
                                    emission_factor_id: factor.id
                                })
                            })
                            .then(res => {
                                if (!res.ok) throw new Error('Failed to save record');
                                return res.json();
                            })
                            .then(data => {
                                alert(`✅ Calculated Emission: ${data.record.emission} Tons.\nCarbon record added successfully!`);
                                fetchEnvironmentalData();
                            })
                            .catch(err => alert("Error: " + err.message));
                        });
                } else {
                    // Manual entry
                    const department = prompt("Enter department name (e.g. IT, HR, Manufacturing, Logistics):");
                    if (!department) return;
                    
                    const emissionStr = prompt("Enter carbon emission in tons (e.g. 25.5):");
                    if (!emissionStr) return;
                    
                    const emission = parseFloat(emissionStr);
                    if (isNaN(emission)) {
                        alert("Please enter a valid numeric emission value.");
                        return;
                    }

                    fetch('/api/esg/environmental', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ department, emission })
                    })
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to save record');
                        return res.json();
                    })
                    .then(data => {
                        alert("✅ Carbon record added successfully!");
                        fetchEnvironmentalData(); // Refresh UI
                    })
                    .catch(err => {
                        alert("Error adding record: " + err.message);
                    });
                }
            });
    });
}

function applyTableRowHover() {
    const rows = document.querySelectorAll("table tr");
    rows.forEach((row, index) => {
        if (index !== 0) {
            row.addEventListener("mouseenter", () => {
                row.style.background = "#dcfce7";
            });
            row.style.transition = "background 0.2s";
            row.addEventListener("mouseleave", () => {
                row.style.background = "white";
            });
        }
    });
}

function animateProgressBars() {
    const progress = document.querySelectorAll("progress");
    progress.forEach(bar => {
        let value = 0;
        let target = bar.getAttribute("value");
        bar.value = 0;
        let interval = setInterval(() => {
            if (value >= target) {
                clearInterval(interval);
            } else {
                value++;
                bar.value = value;
            }
        }, 15);
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