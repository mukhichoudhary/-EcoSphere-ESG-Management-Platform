// ============================
// EXPLORE BUTTON
// ============================

const exploreBtn = document.getElementById("exploreBtn");

if (exploreBtn) {
    exploreBtn.addEventListener("click", function () {
        document.getElementById("features").scrollIntoView({
            behavior: "smooth"
        });
    });
}

// ============================
// LOGIN BUTTON
// ============================

const loginBtn = document.querySelector(".login-btn");

if (loginBtn) {
    loginBtn.addEventListener("click", function () {
        alert("Login Page Coming Soon!");
        // Later:
        // window.location.href = "login.html";
    });
}

// ============================
// CTA BUTTON
// ============================

const ctaBtn = document.querySelector(".cta button");

if (ctaBtn) {
    ctaBtn.addEventListener("click", function () {
        alert("Welcome to EcoSphere!");
    });
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