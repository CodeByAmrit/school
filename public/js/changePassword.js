document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    document.getElementById("introScreen").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("introScreen").style.display = "none";
    }, 300);
  }, 500);
});

// Password visibility toggles
const togglePassword = (inputId, toggleId) => {
  const toggleBtn = document.getElementById(toggleId);
  const passwordInput = document.getElementById(inputId);

  toggleBtn.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Toggle eye icon
    const icon = toggleBtn.querySelector("i");
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
  });
};

togglePassword("currentPassword", "toggle-current-password");
togglePassword("newPassword", "toggle-new-password");
togglePassword("confirmPassword", "toggle-confirm-password");

// Password strength checker
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordStrength = document.getElementById("password-strength");
const strengthText = document.getElementById("strength-text");

// Password requirement elements
const reqLength = document.getElementById("req-length");
const reqUppercase = document.getElementById("req-uppercase");
const reqLowercase = document.getElementById("req-lowercase");
const reqNumber = document.getElementById("req-number");
const reqSpecial = document.getElementById("req-special");

// Password match indicators
const passwordMatch = document.getElementById("password-match");
const passwordMismatch = document.getElementById("password-mismatch");

// Check password strength
const checkPasswordStrength = (password) => {
  let strength = 0;
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  // Update requirement indicators
  reqLength.classList.toggle("valid", requirements.length);
  reqUppercase.classList.toggle("valid", requirements.uppercase);
  reqLowercase.classList.toggle("valid", requirements.lowercase);
  reqNumber.classList.toggle("valid", requirements.number);
  reqSpecial.classList.toggle("valid", requirements.special);

  // Calculate strength
  Object.values(requirements).forEach((req) => {
    if (req) strength += 20;
  });

  // Update strength meter
  passwordStrength.className = "password-strength";

  if (strength <= 20) {
    passwordStrength.classList.add("weak");
    strengthText.textContent = "Weak";
    strengthText.className = "text-sm font-medium text-red-600";
  } else if (strength <= 40) {
    passwordStrength.classList.add("fair");
    strengthText.textContent = "Fair";
    strengthText.className = "text-sm font-medium text-yellow-600";
  } else if (strength <= 60) {
    passwordStrength.classList.add("good");
    strengthText.textContent = "Good";
    strengthText.className = "text-sm font-medium text-blue-600";
  } else {
    passwordStrength.classList.add("strong");
    strengthText.textContent = "Strong";
    strengthText.className = "text-sm font-medium text-green-600";
  }
};

// Check if passwords match
const checkPasswordMatch = () => {
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (confirmPassword.length === 0) {
    passwordMatch.classList.add("hidden");
    passwordMismatch.classList.add("hidden");
    return;
  }

  if (newPassword === confirmPassword) {
    passwordMatch.classList.remove("hidden");
    passwordMismatch.classList.add("hidden");
  } else {
    passwordMatch.classList.add("hidden");
    passwordMismatch.classList.remove("hidden");
  }
};

// Event listeners for password inputs
newPasswordInput.addEventListener("input", (e) => {
  checkPasswordStrength(e.target.value);
  checkPasswordMatch();
});

confirmPasswordInput.addEventListener("input", checkPasswordMatch);

// Show flash message
const showFlashMessage = (message, type = "success") => {
  const flashMessage = document.getElementById("flash-message");

  flashMessage.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"} mr-3 text-${type === "success" ? "green" : "red"}-500"></i>
                        <span class="${type === "success" ? "text-green-800" : "text-red-800"}">${message}</span>
                    </div>
                    <button id="close-flash" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

  flashMessage.className = `flash-message mb-6 p-4 rounded-lg ${type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`;
  flashMessage.classList.remove("hidden");

  // Add close button event
  document.getElementById("close-flash").addEventListener("click", () => {
    flashMessage.classList.add("hidden");
  });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    flashMessage.classList.add("hidden");
  }, 5000);
};

// Form submission
document
  .getElementById("change-password-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = this.currentPassword.value.trim();
    const newPassword = this.newPassword.value.trim();
    const confirmPassword = this.confirmPassword.value.trim();

    // Basic validation
    if (newPassword !== confirmPassword) {
      showFlashMessage(
        "New passwords do not match. Please ensure both passwords are identical.",
        "error",
      );
      return;
    }

    // Check password strength
    if (newPassword.length < 8) {
      showFlashMessage("Password must be at least 8 characters long.", "error");
      return;
    }

    // Show loading state
    const submitBtn = document.getElementById("submit-btn");
    const btnText = document.getElementById("btn-text");
    const btnLoading = document.getElementById("btn-loading");

    btnText.classList.add("hidden");
    btnLoading.classList.remove("hidden");
    submitBtn.disabled = true;
    submitBtn.classList.remove("btn-gradient");
    submitBtn.classList.add("bg-gray-400", "cursor-not-allowed");

    // API call to change password
    try {
      const res = await fetch("/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.status === "success") {
        showFlashMessage(
          "Password changed successfully! Redirecting to dashboard...",
          "success",
        );

        // Reset form
        this.reset();
        passwordStrength.className = "password-strength";
        strengthText.textContent = "None";
        strengthText.className = "text-sm font-medium";

        // Reset requirement indicators
        [reqLength, reqUppercase, reqLowercase, reqNumber, reqSpecial].forEach(
          (el) => {
            el.classList.remove("valid");
          },
        );

        // Hide match indicators
        passwordMatch.classList.add("hidden");
        passwordMismatch.classList.add("hidden");

        // Redirect after delay
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        showFlashMessage(
          data.message || "Failed to change password. Please try again.",
          "error",
        );
      }
    } catch (error) {
      showFlashMessage(
        "An error occurred. Please check your connection and try again.",
        "error",
      );
    } finally {
      // Reset button state
      btnText.classList.remove("hidden");
      btnLoading.classList.add("hidden");
      submitBtn.disabled = false;
      submitBtn.classList.remove("bg-gray-400", "cursor-not-allowed");
      submitBtn.classList.add("btn-gradient");
    }
  });

// Initialize with a check on page load
checkPasswordStrength("");
checkPasswordMatch();
