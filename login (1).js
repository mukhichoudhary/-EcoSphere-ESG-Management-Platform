// ======================================
// LOGIN MODULE - EcoSphere
// ======================================


// ==============================
// ELEMENTS
// ==============================

const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");



// ==============================
// SHOW / HIDE PASSWORD
// ==============================

showPassword.addEventListener("change", () => {

    if (showPassword.checked) {

        password.type = "text";

    } else {

        password.type = "password";

    }

});



// ==============================
// LOGIN VALIDATION
// ==============================

loginForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const userEmail = email.value.trim();
    const userPassword = password.value.trim();

    // Demo Credentials

    const demoEmail = "admin@ecosphere.com";
    const demoPassword = "123456";

    if (userEmail === demoEmail && userPassword === demoPassword) {

        // Save Login Status

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", "Admin");

        alert("✅ Login Successful!");

        // Redirect to Dashboard

        window.location.href = "dashboard.html";

    }

    else {

        alert("❌ Invalid Email or Password");

    }

});



// ==============================
// AUTO LOGIN
// ==============================

if (localStorage.getItem("isLoggedIn") === "true") {

    console.log("User Already Logged In");

}



// ==============================
// LOGOUT FUNCTION
// ==============================

function logout() {

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");

    window.location.href = "login.html";

}



// ==============================
// ENTER KEY LOGIN
// ==============================

document.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        loginForm.requestSubmit();

    }

});



// ==============================
// INPUT ANIMATION
// ==============================

const inputs = document.querySelectorAll("input");

inputs.forEach(input => {

    input.addEventListener("focus", () => {

        input.style.borderColor = "#10b981";
        input.style.boxShadow = "0 0 10px rgba(16,185,129,.3)";

    });

    input.addEventListener("blur", () => {

        input.style.boxShadow = "none";
        input.style.borderColor = "#ccc";

    });

});



// ==============================
// PAGE LOAD
// ==============================

window.onload = () => {

    console.log("EcoSphere Login Page Loaded");

};



// ==============================
// DEMO CREDENTIAL REMINDER
// ==============================

setTimeout(() => {

    console.log("Demo Login:");
    console.log("Email : admin@ecosphere.com");
    console.log("Password : 123456");

}, 1500);



// ==============================
// PREVENT EMPTY INPUTS
// ==============================

email.addEventListener("input", () => {

    email.value = email.value.trimStart();

});

password.addEventListener("input", () => {

    password.value = password.value.trimStart();

});