// ============================================
// FileMoon - Login Page Script (login.js)
// Checks user credentials against LocalStorage
// ============================================

// Grab the form and fields
const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const formMessage = document.querySelector("#formMessage");

// Helper: show error text under a field
function showFieldError(inputEl, errorEl, message) {
  inputEl.classList.add("input-error");
  errorEl.textContent = message;
  errorEl.classList.add("show");
}

// Helper: clear error text under a field
function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove("input-error");
  errorEl.classList.remove("show");
}

// Helper: show a message box above the form
function showFormMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = "form-message show " + type;
}

// Helper: read users array from LocalStorage
function getUsers() {
  const usersJSON = localStorage.getItem("users");
  if (usersJSON) {
    return JSON.parse(usersJSON);
  }
  return [];
}

// Listen for form submit
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  // Reset old errors
  clearFieldError(emailInput, document.querySelector("#emailError"));
  clearFieldError(passwordInput, document.querySelector("#passwordError"));
  formMessage.classList.remove("show");

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  let hasError = false;

  // Check empty fields
  if (email === "") {
    showFieldError(emailInput, document.querySelector("#emailError"), "Please enter your email.");
    hasError = true;
  }

  if (password === "") {
    showFieldError(passwordInput, document.querySelector("#passwordError"), "Please enter your password.");
    hasError = true;
  }

  if (hasError) {
    return;
  }

  // Look for a matching user in LocalStorage
  const users = getUsers();
  const matchedUser = users.find(function (user) {
    return user.email === email && user.password === password;
  });

  if (!matchedUser) {
    showFormMessage("Incorrect email or password. Please try again.", "error");
    return;
  }

  // Save the logged-in user session
  const currentUser = {
    id: matchedUser.id,
    email: matchedUser.email
  };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Show success and redirect to dashboard
  showFormMessage("Login successful! Redirecting...", "success");

  setTimeout(function () {
    window.location.href = "dashboard.html";
  }, 800);
});
