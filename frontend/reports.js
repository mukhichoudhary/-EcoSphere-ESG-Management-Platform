// Add auth check at top
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', () => {
    fetchReportsData();
});

let reportChart;

function fetchReportsData() {
    fetch('/api/esg/reports')
        .then(res => res.json())
        .then(data => {
            // 1. Update Score Cards
            const cardElements = document.querySelectorAll(".cards .card h2");
            if (cardElements.length >= 4) {
                cardElements[0].innerText = data.totals.totalReports;
                cardElements[1].innerText = data.totals.thisMonth;
                cardElements[2].innerText = data.totals.performanceScore;
                cardElements[3].innerText = data.totals.totalDownloads;
            }

            // 2. Initialize or Update Chart
            const ctx = document.getElementById("reportChart");
            if (ctx) {
                if (reportChart) {
                    reportChart.destroy();
                }
                reportChart = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        datasets: [{
                            label: "Reports Generated",
                            data: data.monthlyReports,
                            borderColor: "#06b6d4",
                            backgroundColor: "rgba(6,182,212,0.2)",
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

            // 3. Populate Recent Reports Table
            const table = document.querySelector(".table-section table");
            if (table) {
                const headerRow = `<tr>
                    <th>Report Name</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>`;
                
                let rowsHtml = headerRow;
                data.reports.forEach(rep => {
                    rowsHtml += `<tr>
                        <td>${rep.name}</td>
                        <td>${rep.date}</td>
                        <td>${rep.status}</td>
                    </tr>`;
                });
                table.innerHTML = rowsHtml;
                
                // Style the status cells
                applyStatusStyles();
                // Re-apply table row hover animations
                applyTableRowHover();
            }
        })
        .catch(err => console.error('Error loading reports data:', err));
}

// Download handlers
const pdfBtn = document.querySelector(".pdf-btn");
const csvBtn = document.querySelector(".csv-btn");

if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
        alert("📥 EcoSphere PDF Report Download Started!");
    });
}

if (csvBtn) {
    csvBtn.addEventListener("click", () => {
        alert("📊 EcoSphere CSV Spreadsheet Export Started!");
    });
}

function applyStatusStyles() {
    const statusCells = document.querySelectorAll("table td:last-child");
    statusCells.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (text.includes("completed")) {
            item.style.color = "green";
            item.style.fontWeight = "bold";
        } else if (text.includes("processing")) {
            item.style.color = "orange";
            item.style.fontWeight = "bold";
        }
    });
}

function applyTableRowHover() {
    const rows = document.querySelectorAll("table tr");
    rows.forEach((row, index) => {
        if (index !== 0) {
            row.addEventListener("mouseenter", () => {
                row.style.background = "#ecfeff";
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