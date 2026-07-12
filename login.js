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

let isLoginMode = true;

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const nameContainer = document.getElementById("nameContainer");
const companyContainer = document.getElementById("companyContainer");
const demoCredentialsSection = document.getElementById("demoCredentialsSection");

const fullnameInput = document.getElementById("fullname");
const companyInput = document.getElementById("company");

function switchToLogin() {
    isLoginMode = true;
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    authSubtitle.textContent = "Welcome Back 👋";
    authSubmitBtn.textContent = "Login";
    nameContainer.style.display = "none";
    companyContainer.style.display = "none";
    demoCredentialsSection.style.display = "block";
    fullnameInput.required = false;
    companyInput.required = false;
}

function switchToRegister() {
    isLoginMode = false;
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    authSubtitle.textContent = "Create your account 🌿";
    authSubmitBtn.textContent = "Register";
    nameContainer.style.display = "block";
    companyContainer.style.display = "block";
    demoCredentialsSection.style.display = "none";
    fullnameInput.required = true;
    companyInput.required = false;
}

if (loginTab) loginTab.addEventListener("click", switchToLogin);
if (registerTab) registerTab.addEventListener("click", switchToRegister);

// Form Submission
loginForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const userEmail = email.value.trim();
    const userPassword = password.value.trim();

    if (isLoginMode) {
        // LOGIN FLOW
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: userEmail, password: userPassword })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            return response.json();
        })
        .then(data => {
            // Save Login Status
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", data.user.name);
            localStorage.setItem("theme", data.user.theme || "Default");
            localStorage.setItem("darkMode", data.user.dark_mode === 1 ? "true" : "false");
            
            alert("✅ Login Successful!");
            window.location.href = "dashboard.html";
        })
        .catch(error => {
            alert("❌ Invalid Email or Password");
            console.error('Login error:', error);
        });
    } else {
        // REGISTRATION FLOW
        const userName = fullnameInput.value.trim();
        const userCompany = companyInput.value.trim();

        // --- Validation ---
        if (!userName) {
            alert("❌ Please enter your full name.");
            return;
        }

        if (userEmail.length <= 5 || userEmail.length >= 19) {
            alert("❌ Email must be more than 5 and less than 19 characters.");
            return;
        }

        if (userPassword.length <= 5 || userPassword.length >= 19) {
            alert("❌ Password must be more than 5 and less than 19 characters.");
            return;
        }
        // --- End Validation ---

        fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: userName,
                email: userEmail,
                password: userPassword,
                company: userCompany
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Registration failed');
                });
            }
            return response.json();
        })
        .then(data => {
            // Save Login Status
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", data.user.name);
            localStorage.setItem("theme", "Default");
            localStorage.setItem("darkMode", "false");
            
            alert("✅ Registration Successful!");
            window.location.href = "dashboard.html";
        })
        .catch(error => {
            alert("❌ Registration Failed: " + error.message);
            console.error('Registration error:', error);
        });
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