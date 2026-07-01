// ============================================
// FileMoon - Signup Page Script (signup.js)
// Stores new users inside LocalStorage under "users"
// ============================================

// Grab the form and all the fields we need
const signupForm = document.querySelector("#signupForm");
const fullNameInput = document.querySelector("#fullName");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const confirmPasswordInput = document.querySelector("#confirmPassword");
const formMessage = document.querySelector("#formMessage");

// Helper function: show an error message under a specific field
function showFieldError(inputEl, errorEl, message) {
  inputEl.classList.add("input-error");
  errorEl.textContent = message;
  errorEl.classList.add("show");
}

// Helper function: clear the error message under a specific field
function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove("input-error");
  errorEl.classList.remove("show");
}

// Helper function: show a message box above the form (error or success)
function showFormMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = "form-message show " + type;
}

// Helper function: get the users array stored in LocalStorage
function getUsers() {
  const usersJSON = localStorage.getItem("users");
  if (usersJSON) {
    return JSON.parse(usersJSON);
  }
  return [];
}

// Helper function: simple email format check
function isValidEmail(email) {
  return email.includes("@") && email.includes(".");
}

// Listen for the form submit event
signupForm.addEventListener("submit", function (event) {
  event.preventDefault();

  // Reset previous errors
  clearFieldError(fullNameInput, document.querySelector("#fullNameError"));
  clearFieldError(emailInput, document.querySelector("#emailError"));
  clearFieldError(passwordInput, document.querySelector("#passwordError"));
  clearFieldError(confirmPasswordInput, document.querySelector("#confirmPasswordError"));
  formMessage.classList.remove("show");

  // Read values and trim extra spaces
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  let hasError = false;

  // Check: full name should not be empty
  if (fullName === "") {
    showFieldError(fullNameInput, document.querySelector("#fullNameError"), "Please enter your full name.");
    hasError = true;
  }

  // Check: email should not be empty and should look valid
  if (email === "") {
    showFieldError(emailInput, document.querySelector("#emailError"), "Please enter your email.");
    hasError = true;
  } else if (!isValidEmail(email)) {
    showFieldError(emailInput, document.querySelector("#emailError"), "Please enter a valid email address.");
    hasError = true;
  }

  // Check: password minimum length of 6
  if (password === "") {
    showFieldError(passwordInput, document.querySelector("#passwordError"), "Please enter a password.");
    hasError = true;
  } else if (password.length < 6) {
    showFieldError(passwordInput, document.querySelector("#passwordError"), "Password must be at least 6 characters.");
    hasError = true;
  }

  // Check: confirm password should match password
  if (confirmPassword === "") {
    showFieldError(confirmPasswordInput, document.querySelector("#confirmPasswordError"), "Please confirm your password.");
    hasError = true;
  } else if (password !== confirmPassword) {
    showFieldError(confirmPasswordInput, document.querySelector("#confirmPasswordError"), "Passwords do not match.");
    hasError = true;
  }

  // Stop here if any field has an error
  if (hasError) {
    return;
  }

  // Check if the email is already registered
  const users = getUsers();
  const emailExists = users.some(function (user) {
    return user.email === email;
  });

  if (emailExists) {
    showFieldError(emailInput, document.querySelector("#emailError"), "This email is already registered.");
    showFormMessage("An account with this email already exists.", "error");
    return;
  }

  // Create the new user object
  const newUser = {
    id: Date.now().toString(),
    name: fullName,
    email: email,
    password: password
  };

  // Save the new user into the users array in LocalStorage
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  // Show success message and redirect to login page
  showFormMessage("Account created successfully! Redirecting to login...", "success");

  setTimeout(function () {
    window.location.href = "login.html";
  }, 1200);
});
