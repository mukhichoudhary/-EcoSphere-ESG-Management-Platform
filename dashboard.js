// ================================
// LINE CHART
// ================================
// ==========================
// LOGIN CHECK
// ==========================

if(localStorage.getItem("isLoggedIn") !== "true"){

    window.location.href = "login.html";

}
const lineChart = document.getElementById("lineChart");

if (lineChart) {
    new Chart(lineChart, {
        type: "line",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [{
                label: "ESG Score",
                data: [60, 68, 72, 78, 82, 90],
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

// ================================
// BAR CHART
// ================================

const barChart = document.getElementById("barChart");

if (barChart) {
    new Chart(barChart, {
        type: "bar",
        data: {
            labels: ["HR", "IT", "Sales", "Finance", "Production"],
            datasets: [{
                label: "Carbon Emission",
                data: [35, 20, 28, 18, 45],
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

// ================================
// CARD HOVER EFFECT
// ================================

const cards = document.querySelectorAll(".card");

cards.forEach(card => {

    card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-8px)";
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
    });

});

// ================================
// ACTIVE SIDEBAR MENU
// ================================

const menuItems = document.querySelectorAll(".sidebar ul li");

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        menuItems.forEach(menu => {
            menu.classList.remove("active");
        });

        item.classList.add("active");

    });

});

// ================================
// WELCOME MESSAGE
// ================================

window.onload = function () {

    console.log("Welcome to EcoSphere Dashboard");

};

// ==============================
// LOGOUT
// ==============================

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");

    window.location.href = "login.html";
}