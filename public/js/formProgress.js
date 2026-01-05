// Form Progress Tracking System
class FormProgressTracker {
  constructor() {
    this.requiredFields = [
      "name",
      "father_name",
      "mother_name",
      "roll_no",
      "class",
      "dob",
      "corresponding_address",
      "mobile_no",
      "gender",
    ];

    this.optionalFields = [
      "srn_no",
      "pen_no",
      "admission_no",
      "session",
      "permanent_address",
      "paste_file_no",
      "family_id",
      "profile_status",
      "apaar_id",
      "student_aadhar_no",
      "father_aadhar_no",
      "mother_aadhar_no",
      "section",
    ];

    this.progressBar = document.getElementById("progress-bar");
    this.progressText = document.getElementById("form-progress");
    this.form = document.getElementById("student_form");

    this.init();
  }

  init() {
    if (!this.progressBar || !this.progressText || !this.form) {
      console.warn("Form progress elements not found");
      return;
    }

    this.setupEventListeners();
    this.calculateProgress();

    // Also track file uploads
    this.setupFileUploadTracking();
  }

  setupEventListeners() {
    // Listen to all form field changes
    const formFields = this.form.querySelectorAll("input, select, textarea");

    formFields.forEach((field) => {
      // Use debounce to avoid excessive calculations
      field.addEventListener(
        "input",
        this.debounce(() => this.calculateProgress(), 300),
      );
      field.addEventListener(
        "change",
        this.debounce(() => this.calculateProgress(), 300),
      );
    });

    // Special handling for file inputs
    const fileInputs = this.form.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      input.addEventListener("change", () => {
        setTimeout(() => this.calculateProgress(), 100);
      });
    });
  }

  setupFileUploadTracking() {
    // Track photo upload progress
    const photoInput = document.getElementById("dropzone-file");
    const signatureInput = document.getElementById("file-signature");

    if (photoInput) {
      photoInput.addEventListener("change", () => {
        if (photoInput.files.length > 0) {
          this.showUploadFeedback("photo", true);
        }
      });
    }

    if (signatureInput) {
      signatureInput.addEventListener("change", () => {
        if (signatureInput.files.length > 0) {
          this.showUploadFeedback("signature", true);
        }
      });
    }
  }

  calculateProgress() {
    if (!this.progressBar || !this.progressText) return;

    let score = 0;
    let totalWeight = 0;

    // Required fields (70% weight)
    const requiredWeight = 0.7;
    const requiredScore = this.calculateSectionScore(this.requiredFields);
    score += requiredScore * requiredWeight;
    totalWeight += requiredWeight;

    // Optional fields (20% weight)
    const optionalWeight = 0.2;
    const optionalScore = this.calculateSectionScore(this.optionalFields);
    score += optionalScore * optionalWeight;
    totalWeight += optionalWeight;

    // File uploads (10% weight - only if they exist on page)
    const fileWeight = 0.1;
    let fileScore = 0;

    const photoInput = document.getElementById("dropzone-file");
    const signatureInput = document.getElementById("file-signature");

    if (photoInput) {
      fileScore += photoInput.files.length > 0 ? 0.5 : 0;
    }

    if (signatureInput) {
      fileScore += signatureInput.files.length > 0 ? 0.5 : 0;
    }

    // If no file inputs on page, redistribute weight
    if (!photoInput && !signatureInput) {
      // Add file weight to optional fields
      score += optionalScore * fileWeight;
    } else {
      score += fileScore * fileWeight;
    }

    // Calculate final percentage
    const progress = Math.round((score / totalWeight) * 100);

    this.updateProgressDisplay(progress);
    this.updateProgressColor(progress);
    this.updateCompletionTips(progress);

    return progress;
  }

  calculateSectionScore(fields) {
    let filledCount = 0;

    fields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        const value = field.value;

        // Different validation for different field types
        if (field.type === "select-one") {
          if (value && value.trim() !== "") {
            filledCount++;
          }
        } else if (field.type === "file") {
          // File inputs - check if file is selected
          if (field.files && field.files.length > 0) {
            filledCount++;
          }
        } else {
          // Text inputs, textareas, etc.
          if (value && value.toString().trim() !== "") {
            // Additional validation for specific fields
            if (fieldId === "mobile_no") {
              const mobilePattern = /^[0-9]{10}$/;
              if (mobilePattern.test(value.trim())) {
                filledCount++;
              }
            } else if (fieldId === "dob") {
              // Simple date validation
              if (value.trim().length >= 8) {
                filledCount++;
              }
            } else {
              filledCount++;
            }
          }
        }
      }
    });

    return fields.length > 0 ? filledCount / fields.length : 0;
  }

  updateProgressDisplay(progress) {
    this.progressBar.style.width = `${progress}%`;
    this.progressText.textContent = `${progress}%`;

    // Add animation effect when progress increases
    const currentWidth = parseInt(this.progressBar.style.width) || 0;
    if (progress > currentWidth) {
      this.progressBar.classList.add("progress-increasing");
      setTimeout(() => {
        this.progressBar.classList.remove("progress-increasing");
      }, 500);
    }
  }

  updateProgressColor(progress) {
    // Remove all color classes
    this.progressBar.classList.remove(
      "from-red-500",
      "to-red-600",
      "from-yellow-500",
      "to-yellow-600",
      "from-green-500",
      "to-green-600",
      "from-blue-500",
      "to-blue-600",
    );

    // Set gradient based on progress
    if (progress < 25) {
      this.progressBar.classList.add("from-red-500", "to-red-600");
    } else if (progress < 50) {
      this.progressBar.classList.add("from-yellow-500", "to-yellow-600");
    } else if (progress < 75) {
      this.progressBar.classList.add("from-blue-500", "to-blue-600");
    } else {
      this.progressBar.classList.add("from-green-500", "to-green-600");
    }
  }

  updateCompletionTips(progress) {
    // Remove existing tips
    const existingTips = document.querySelector(".form-tips-container");
    if (existingTips) {
      existingTips.remove();
    }

    // Only show tips for incomplete forms
    if (progress >= 100) return;

    const tips = this.getCompletionTips();
    if (tips.length === 0) return;

    const tipsContainer = document.createElement("div");
    tipsContainer.className =
      "form-tips-container mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800";

    tipsContainer.innerHTML = `
      <div class="flex items-center mb-2">
        <i class="fas fa-lightbulb text-blue-500 dark:text-blue-400 mr-2"></i>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white">Complete your form:</h4>
      </div>
      <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        ${tips.map((tip) => `<li class="flex items-center"><i class="fas fa-check-circle text-green-500 text-xs mr-2"></i>${tip}</li>`).join("")}
      </ul>
    `;

    // Insert after progress bar container
    const progressContainer = this.progressBar.closest(".mt-6");
    if (progressContainer) {
      progressContainer.appendChild(tipsContainer);
    }
  }

  getCompletionTips() {
    const tips = [];

    // Check required fields
    this.requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field && (!field.value || field.value.trim() === "")) {
        const fieldName = this.getFieldDisplayName(fieldId);
        tips.push(`Fill in ${fieldName}`);
      }
    });

    // Check optional but important fields
    const importantOptional = [
      "student_aadhar_no",
      "father_aadhar_no",
      "mother_aadhar_no",
    ];
    importantOptional.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field && (!field.value || field.value.trim() === "")) {
        const fieldName = this.getFieldDisplayName(fieldId);
        tips.push(`Consider adding ${fieldName}`);
      }
    });

    // Check file uploads
    const photoInput = document.getElementById("dropzone-file");
    if (photoInput && (!photoInput.files || photoInput.files.length === 0)) {
      tips.push("Upload student photo");
    }

    const signatureInput = document.getElementById("file-signature");
    if (
      signatureInput &&
      (!signatureInput.files || signatureInput.files.length === 0)
    ) {
      tips.push("Upload signature");
    }

    return tips.slice(0, 3); // Limit to 3 tips
  }

  getFieldDisplayName(fieldId) {
    const nameMap = {
      name: "student name",
      father_name: "father's name",
      mother_name: "mother's name",
      roll_no: "roll number",
      class: "class",
      dob: "date of birth",
      corresponding_address: "corresponding address",
      permanent_address: "permanent address",
      mobile_no: "mobile number",
      gender: "gender",
      srn_no: "SRN number",
      pen_no: "PEN number",
      admission_no: "admission number",
      session: "academic session",
      paste_file_no: "paste file number",
      family_id: "family ID",
      profile_status: "profile status",
      apaar_id: "Apaar ID",
      student_aadhar_no: "student Aadhar number",
      father_aadhar_no: "father's Aadhar number",
      mother_aadhar_no: "mother's Aadhar number",
      section: "section",
    };

    return nameMap[fieldId] || fieldId.replace("_", " ");
  }

  showUploadFeedback(type, success) {
    const message = success
      ? `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`
      : `Failed to upload ${type}`;

    const colorClass = success
      ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
      : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200";

    const icon = success ? "fa-check-circle" : "fa-exclamation-circle";

    // Create temporary feedback
    const feedback = document.createElement("div");
    feedback.className = `upload-feedback fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border ${colorClass} transform transition-all duration-300 translate-x-full`;
    feedback.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${icon} mr-2"></i>
        <span class="text-sm font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(feedback);

    // Animate in
    setTimeout(() => {
      feedback.classList.remove("translate-x-full");
      feedback.classList.add("translate-x-0");
    }, 10);

    // Auto remove
    setTimeout(() => {
      feedback.classList.remove("translate-x-0");
      feedback.classList.add("translate-x-full");
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Public methods
  getProgress() {
    return this.calculateProgress();
  }

  validateForm() {
    const errors = [];

    this.requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field && (!field.value || field.value.trim() === "")) {
        const fieldName = this.getFieldDisplayName(fieldId);
        errors.push(`${fieldName} is required`);

        // Highlight field
        field.classList.add("border-red-500", "dark:border-red-500");
        setTimeout(() => {
          field.classList.remove("border-red-500", "dark:border-red-500");
        }, 3000);
      }
    });

    // Validate mobile number format
    const mobileNo = document.getElementById("mobile_no");
    if (mobileNo && mobileNo.value.trim() !== "") {
      const mobilePattern = /^[0-9]{10}$/;
      if (!mobilePattern.test(mobileNo.value.trim())) {
        errors.push("Mobile number must be 10 digits");
      }
    }

    return errors;
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on a student form page
  const form = document.getElementById("student_form");
  const progressBar = document.getElementById("progress-bar");

  if (form && progressBar) {
    // Initialize progress tracker
    window.formProgress = new FormProgressTracker();

    // Add CSS for animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes progressPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
      
      .progress-increasing {
        animation: progressPulse 0.5s ease-in-out;
      }
      
      .form-tips-container li {
        transition: all 0.3s ease;
      }
      
      .form-tips-container li:hover {
        transform: translateX(4px);
      }
      
      .upload-feedback {
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);

    // Also integrate with form submission
    form.addEventListener("submit", function (e) {
      const errors = window.formProgress.validateForm();

      if (errors.length > 0) {
        e.preventDefault();

        // Show error notification
        const errorDiv = document.createElement("div");
        errorDiv.className =
          "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl shadow-lg";
        errorDiv.innerHTML = `
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-3"></i>
            <div>
              <div class="font-bold mb-1">Please fix the following:</div>
              <ul class="text-sm space-y-1">
                ${errors.map((error) => `<li>• ${error}</li>`).join("")}
              </ul>
            </div>
            <button class="ml-4 text-red-500 hover:text-red-700">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;

        document.body.appendChild(errorDiv);

        // Add close button functionality
        errorDiv.querySelector("button").addEventListener("click", () => {
          errorDiv.remove();
        });

        // Auto remove after 10 seconds
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.remove();
          }
        }, 10000);

        return false;
      }
    });

    // Add real-time validation for mobile number
    const mobileNo = document.getElementById("mobile_no");
    if (mobileNo) {
      mobileNo.addEventListener("input", function () {
        const value = this.value.trim();
        if (value && value !== "") {
          const isValid = /^[0-9]{10}$/.test(value);
          if (isValid) {
            this.classList.remove("border-red-500", "dark:border-red-500");
            this.classList.add("border-green-500", "dark:border-green-500");
          } else {
            this.classList.remove("border-green-500", "dark:border-green-500");
            this.classList.add("border-red-500", "dark:border-red-500");
          }
        } else {
          this.classList.remove(
            "border-red-500",
            "dark:border-red-500",
            "border-green-500",
            "dark:border-green-500",
          );
        }
      });
    }

    // Add auto-format for Aadhar numbers
    const aadharFields = [
      "student_aadhar_no",
      "father_aadhar_no",
      "mother_aadhar_no",
    ];
    aadharFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener("input", function () {
          let value = this.value.replace(/\D/g, ""); // Remove non-digits

          // Format as XXXX-XXXX-XXXX
          if (value.length > 8) {
            value =
              value.substring(0, 4) +
              "-" +
              value.substring(4, 8) +
              "-" +
              value.substring(8, 12);
          } else if (value.length > 4) {
            value = value.substring(0, 4) + "-" + value.substring(4);
          }

          this.value = value;
        });
      }
    });
  }
});

// Export for module usage (if using modules)
if (typeof module !== "undefined" && module.exports) {
  module.exports = FormProgressTracker;
}
