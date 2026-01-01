window.addEventListener("load", () => {
  document.body.classList.add("ready");
});
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const editProfileBtn = document.getElementById("editProfileBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const editProfileForm = document.getElementById("editProfileForm");
  const logoUpload = document.getElementById("logo-upload");
  const schoolLogoInput = document.getElementById("school_logo");
  const successToast = document.getElementById("successToast");

  // Profile display elements
  const displayName = document.getElementById("displayName");
  const displayEmail = document.getElementById("displayEmail");
  const displaySchool = document.getElementById("displaySchool");
  const displayPhone = document.getElementById("displayPhone");
  const displayAddress = document.getElementById("displayAddress");

  // Form input elements
  const firstNameInput = document.getElementById("first_name");
  const lastNameInput = document.getElementById("last_name");
  const emailInput = document.getElementById("email");
  const schoolNameInput = document.getElementById("school_name");
  const phoneInput = document.getElementById("school_phone");
  const addressInput = document.getElementById("school_address");

  // Toggle Edit Form
  editProfileBtn.addEventListener("click", function () {
    editProfileForm.classList.remove("hidden");
    editProfileForm.scrollIntoView({ behavior: "smooth", block: "start" });

    // Update form values from display
    updateFormFromDisplay();

    // Add animation
    editProfileForm.style.animation = "fadeIn 0.5s ease-out";
  });

  // Cancel Edit
  cancelEditBtn.addEventListener("click", function () {
    editProfileForm.classList.add("hidden");
    resetFormToOriginal();
  });

  // Logo Upload Preview
  if (logoUpload) {
    logoUpload.addEventListener("change", function (e) {
      handleImageUpload(e, logoUpload, true);
    });
  }

  if (schoolLogoInput) {
    schoolLogoInput.addEventListener("change", function (e) {
      handleImageUpload(e, schoolLogoInput, false);
    });
  }

  // Form Submission
  const profileForm = document.getElementById("editProfileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Show loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
      submitBtn.disabled = true;

      // Simulate API call with timeout
      setTimeout(() => {
        // Update display values
        updateDisplayFromForm();

        // Reset form button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        // Hide form
        editProfileForm.classList.add("hidden");

        // Show success toast
        showSuccessToast("Profile updated successfully!");

        // Optionally submit the form
        this.submit();
      }, 1500);
    });
  }

  // Functions
  function updateFormFromDisplay() {
    // Extract values from display
    const nameParts = displayName.textContent.trim().split(" ");
    firstNameInput.value = nameParts[0] || "";
    lastNameInput.value = nameParts.slice(1).join(" ") || "";
    emailInput.value = displayEmail.textContent.trim();
    schoolNameInput.value = displaySchool.textContent.trim();
    phoneInput.value =
      displayPhone.textContent.trim() === "Not provided"
        ? ""
        : displayPhone.textContent.trim();
    addressInput.value = displayAddress.textContent.trim();
  }

  function updateDisplayFromForm() {
    // Update display values from form inputs
    displayName.textContent = `${firstNameInput.value.toUpperCase()} ${lastNameInput.value.toUpperCase()}`;
    displayEmail.textContent = emailInput.value;
    displaySchool.textContent = schoolNameInput.value.toUpperCase();
    displayPhone.textContent = phoneInput.value || "Not provided";
    displayAddress.textContent = addressInput.value.toUpperCase();
  }

  function resetFormToOriginal() {
    // Reset form to current display values
    updateFormFromDisplay();
  }

  function handleImageUpload(event, inputElement, isQuickUpload) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      showError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      showError("Image size should be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      if (isQuickUpload) {
        // Update the profile image preview
        const profileImage = document.querySelector(".w-48.h-48 img");
        if (profileImage) {
          profileImage.src = e.target.result;
        } else {
          const profileDiv = document.querySelector(".w-48.h-48");
          profileDiv.innerHTML = `<img src="${e.target.result}" alt="School Logo" class="w-full h-full object-cover">`;
        }

        // Also update the form file input
        if (schoolLogoInput) {
          // Create a new File object to attach to form
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          schoolLogoInput.files = dataTransfer.files;
        }

        showSuccessToast("Logo updated successfully!");
      }
    };
    reader.readAsDataURL(file);
  }

  function showSuccessToast(message) {
    const toast = successToast;
    const messageElement = toast.querySelector("p:nth-child(2)");

    if (message) {
      messageElement.textContent = message;
    }

    toast.classList.remove("hidden");
    toast.style.animation = "fadeIn 0.3s ease-out";

    setTimeout(() => {
      toast.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 300);
    }, 3000);
  }

  function showError(message) {
    // Create error toast if it doesn't exist
    let errorToast = document.getElementById("errorToast");
    if (!errorToast) {
      errorToast = document.createElement("div");
      errorToast.id = "errorToast";
      errorToast.className =
        "hidden fixed top-4 right-4 max-w-sm bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg z-50";
      errorToast.innerHTML = `
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                        <i class="fas fa-exclamation"></i>
                    </div>
                    <div>
                        <p class="font-bold">Error</p>
                        <p class="text-sm opacity-90"></p>
                    </div>
                </div>
            `;
      document.body.appendChild(errorToast);
    }

    errorToast.querySelector("p:nth-child(2)").textContent = message;
    errorToast.classList.remove("hidden");
    errorToast.style.animation = "fadeIn 0.3s ease-out";

    setTimeout(() => {
      errorToast.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => {
        errorToast.classList.add("hidden");
      }, 300);
    }, 3000);
  }

  // Add fadeOut animation to CSS
  if (!document.querySelector("#profile-animations")) {
    const style = document.createElement("style");
    style.id = "profile-animations";
    style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
    document.head.appendChild(style);
  }

  // Auto-capitalize inputs on blur
  const uppercaseInputs = document.querySelectorAll('input[type="text"]');
  uppercaseInputs.forEach((input) => {
    input.addEventListener("blur", function () {
      if (this.value) {
        this.value = this.value.toUpperCase();
      }
    });
  });

  // Phone number formatting
  if (phoneInput) {
    phoneInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 0) {
        value = value.match(new RegExp(".{1,3}", "g")).join(" ");
      }
      e.target.value = value;
    });
  }

  // Initialize profile completion percentage
  function calculateProfileCompletion() {
    const fields = [
      displayName.textContent.trim() !== "",
      displayEmail.textContent.trim() !== "",
      displaySchool.textContent.trim() !== "",
      displayPhone.textContent.trim() !== "Not provided",
      displayAddress.textContent.trim() !== "",
    ];

    const completed = fields.filter(Boolean).length;
    const percentage = Math.round((completed / fields.length) * 100);

    // Update progress bar
    const progressBar = document.querySelector(".w-24.h-2 div");
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    // Update percentage text
    const percentageText = document.querySelector(".ml-2.font-bold");
    if (percentageText) {
      percentageText.textContent = `${percentage}%`;
    }
  }

  // Calculate initial profile completion
  calculateProfileCompletion();
});
