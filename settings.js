// ======================================
// SETTINGS MODULE
// ======================================


// ==============================
// SAVE BUTTON
// ==============================
if(localStorage.getItem("isLoggedIn") !== "true"){

    window.location.href = "login.html";

}
const saveBtn = document.querySelector(".save-btn");

if (saveBtn) {

    saveBtn.addEventListener("click", () => {

        alert("✅ Settings Saved Successfully!");

    });

}



// ==============================
// DARK MODE
// ==============================

const darkMode = document.getElementById("darkMode");

if (darkMode) {

    darkMode.addEventListener("change", function () {

        if (this.checked) {

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

    });

}



// ==============================
// THEME CHANGER
// ==============================

const theme = document.getElementById("theme");

if (theme) {

    theme.addEventListener("change", function () {

        switch (this.value) {

            case "Green":
                document.querySelector(".sidebar").style.background = "#15803d";
                break;

            case "Blue":
                document.querySelector(".sidebar").style.background = "#2563eb";
                break;

            case "Purple":
                document.querySelector(".sidebar").style.background = "#7c3aed";
                break;

            case "Dark":
                document.querySelector(".sidebar").style.background = "#111827";
                break;

            default:
                document.querySelector(".sidebar").style.background = "#0f172a";

        }

    });

}



// ==============================
// SECURITY BUTTONS
// ==============================

const securityButtons = document.querySelectorAll(".security-btn");

securityButtons.forEach(button => {

    button.addEventListener("click", () => {

        alert(button.innerText + "\n\nBackend Integration Required.");

    });

});



// ==============================
// INPUT FOCUS EFFECT
// ==============================

const inputs = document.querySelectorAll("input");

inputs.forEach(input => {

    input.addEventListener("focus", () => {

        input.style.boxShadow = "0 0 8px rgba(16,185,129,.4)";

    });

    input.addEventListener("blur", () => {

        input.style.boxShadow = "none";

    });

});



// ==============================
// CARD HOVER
// ==============================

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



// ==============================
// SIDEBAR ACTIVE
// ==============================

const menu = document.querySelectorAll(".sidebar ul li");

menu.forEach(item => {

    item.addEventListener("click", () => {

        menu.forEach(i => {

            i.classList.remove("active");

        });

        item.classList.add("active");

    });

});



// ==============================
// PAGE LOAD
// ==============================

window.onload = function () {

    console.log("Settings Module Loaded Successfully");

};



// ==============================
// AUTO SAVE REMINDER
// ==============================

setTimeout(() => {

    console.log("💾 Don't forget to save your changes.");

}, 5000);



// ==============================
// PROFILE VALIDATION
// ==============================

const emailInput = document.querySelector('input[type="email"]');

if (emailInput) {

    emailInput.addEventListener("blur", () => {

        if (!emailInput.value.includes("@")) {

            alert("Please enter a valid email address.");

        }

    });

}