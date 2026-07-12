// ============================
// EXPLORE BUTTON
// ============================

// ============================
// EXPLORE & CTA BUTTONS
// ============================

const exploreBtn = document.getElementById("exploreBtn");
const ctaBtn = document.querySelector(".cta button");

function handleGetStarted() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "dashboard.html";
    } else {
        window.location.href = "login.html";
    }
}

if (exploreBtn) {
    exploreBtn.addEventListener("click", handleGetStarted);
}

if (ctaBtn) {
    ctaBtn.addEventListener("click", handleGetStarted);
}

// ============================
// LOGIN / DASHBOARD BUTTON
// ============================

const loginBtn = document.querySelector(".login-btn");

if (loginBtn) {
    if (localStorage.getItem("isLoggedIn") === "true") {
        loginBtn.textContent = "Dashboard";
        loginBtn.addEventListener("click", () => {
            window.location.href = "dashboard.html";
        });
    } else {
        loginBtn.textContent = "Login";
        loginBtn.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }
}

// ============================
// CARD ANIMATION
// ============================

const cards = document.querySelectorAll(".card, .feature-box");

cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-10px)";
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
    });
});

// ============================
// NAVBAR SHADOW ON SCROLL
// ============================

window.addEventListener("scroll", () => {
    const header = document.querySelector("header");

    if (window.scrollY > 50) {
        header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
    } else {
        header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
    }
});