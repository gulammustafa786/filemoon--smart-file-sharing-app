// ============================================
// FileMoon - Home Page Script (index.js)
// Handles the mobile menu toggle only.
// ============================================

// Get the navbar and the toggle button
const navbar = document.querySelector("#navbar");
const navToggle = document.querySelector("#navToggle");

// When the hamburger icon is clicked, open/close the mobile menu
navToggle.addEventListener("click", function () {
  navbar.classList.toggle("open");
});

// Close the mobile menu whenever a link inside it is clicked
const navLinks = document.querySelectorAll(".nav-links a, .nav-actions a");
navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    navbar.classList.remove("open");
  });
});
