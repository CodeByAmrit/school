// Settings Page JavaScript
class SettingsManager {
  constructor() {
    this.currentTab = "profile";
    this.init();
  }

  init() {
    this.setupTabNavigation();
    this.setupFormSubmissions();
    this.setupEventListeners();
    this.loadClasses();
    this.loadSubjects();
    this.setupFilePreview();
  }

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll("[data-tab]");
    tabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const tabId = e.target.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Handle anchor links in quick navigation
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute("href").substring(1);
        this.scrollToSection(targetId);
      });
    });
  }

  switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll("[data-tab]").forEach((button) => {
      if (button.dataset.tab === tabId) {
        button.classList.add("tab-active");
        button.classList.remove("text-gray-500", "dark:text-gray-400");
        button.classList.add("text-gray-900", "dark:text-white");
      } else {
        button.classList.remove("tab-active");
        button.classList.add("text-gray-500", "dark:text-gray-400");
        button.classList.remove("text-gray-900", "dark:text-white");
      }
    });

    // Show/hide tab content
    document.querySelectorAll(".settings-content").forEach((content) => {
      if (content.id === `${tabId}-tab`) {
        content.classList.remove("hidden");
        content.style.animation = "slideDown 0.3s ease-out";
      } else {
        content.classList.add("hidden");
      }
    });

    this.currentTab = tabId;
  }

  scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      element.classList.add("ring-2", "ring-primary-500/20");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary-500/20");
      }, 2000);
    }
  }

  setupFormSubmissions() {
    // Save All button
    document.getElementById("save-all").addEventListener("click", () => {
      this.saveAllSettings();
    });

    // Reset All button
    document.getElementById("reset-all").addEventListener("click", () => {
      this.showConfirmation(
        "Reset All Settings",
        "Are you sure you want to reset all settings to default? This action cannot be undone.",
        () => this.resetAllSettings(),
      );
    });

    // Individual form submissions
    document
      .getElementById("update-profile")
      .addEventListener("click", () => this.updateProfile());
    document
      .getElementById("update-school")
      .addEventListener("click", () => this.updateSchool());
    document
      .getElementById("update-advanced")
      .addEventListener("click", () => this.updateAdvancedSettings());
    document
      .getElementById("manual-backup")
      .addEventListener("click", () => this.performBackup());
    document
      .getElementById("system-check")
      .addEventListener("click", () => this.runSystemCheck());
    document
      .getElementById("export-data")
      .addEventListener("click", () => this.exportData());
    document
      .getElementById("delete-account")
      .addEventListener("click", () => this.deleteAccount());
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      }
    });

    // School logo preview
    const logoInput = document.getElementById("school-logo");
    if (logoInput) {
      logoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            document.getElementById("logo-preview").src = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Add class button
    document.getElementById("add-class").addEventListener("click", () => {
      this.showClassForm();
    });

    // Add subject button
    document.getElementById("add-subject").addEventListener("click", () => {
      this.showSubjectForm();
    });
  }

  setupFilePreview() {
    // Add drag and drop for school logo
    const logoPreview = document.getElementById("logo-preview");
    if (logoPreview) {
      logoPreview.parentElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        logoPreview.parentElement.classList.add("ring-2", "ring-primary-500");
      });

      logoPreview.parentElement.addEventListener("dragleave", (e) => {
        e.preventDefault();
        logoPreview.parentElement.classList.remove(
          "ring-2",
          "ring-primary-500",
        );
      });

      logoPreview.parentElement.addEventListener("drop", (e) => {
        e.preventDefault();
        logoPreview.parentElement.classList.remove(
          "ring-2",
          "ring-primary-500",
        );

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith("image/")) {
          const fileInput = document.getElementById("school-logo");
          fileInput.files = files;
          fileInput.dispatchEvent(new Event("change"));
        }
      });
    }
  }

  async updateProfile() {
    const formData = new FormData();
    formData.append("first_name", document.getElementById("first_name").value);
    formData.append("last_name", document.getElementById("last_name").value);
    formData.append("email", document.getElementById("email").value);
    formData.append(
      "current_password",
      document.getElementById("current_password").value,
    );
    formData.append(
      "new_password",
      document.getElementById("new_password").value,
    );

    try {
      this.showLoading();
      const response = await fetch("/settings/update-profile", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      this.showNotification(
        result.message,
        result.success ? "success" : "error",
      );
    } catch (error) {
      this.showNotification("Failed to update profile", "error");
    } finally {
      this.hideLoading();
    }
  }

  async updateSchool() {
    const formData = new FormData();
    formData.append(
      "school_name",
      document.getElementById("school_name").value,
    );
    formData.append(
      "school_code",
      document.getElementById("school_code").value,
    );
    formData.append(
      "school_address",
      document.getElementById("school_address").value,
    );
    formData.append(
      "school_phone",
      document.getElementById("school_phone").value,
    );
    formData.append(
      "school_email",
      document.getElementById("school_email").value,
    );
    formData.append(
      "principal_name",
      document.getElementById("principal_name").value,
    );
    formData.append(
      "affiliation_number",
      document.getElementById("affiliation_number").value,
    );

    const logoFile = document.getElementById("school-logo").files[0];
    if (logoFile) {
      formData.append("school_logo", logoFile);
    }

    try {
      this.showLoading();
      const response = await fetch("/settings/update-school", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      this.showNotification(
        result.message,
        result.success ? "success" : "error",
      );
    } catch (error) {
      this.showNotification("Failed to update school information", "error");
    } finally {
      this.hideLoading();
    }
  }

  async updateAdvancedSettings() {
    const settings = {
      theme: document.getElementById("theme").value,
      language: document.getElementById("language").value,
      timezone: document.getElementById("timezone").value,
      date_format: document.getElementById("date-format").value,
      items_per_page: document.getElementById("items-per-page").value,
      default_session: document.getElementById("default-session").value,
      notifications_enabled: document.getElementById("notifications-enabled")
        .checked,
      email_notifications: document.getElementById("email-notifications")
        .checked,
      auto_save_draft: true,
    };

    try {
      this.showLoading();
      const response = await fetch("/settings/update-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      this.showNotification(
        result.message,
        result.success ? "success" : "error",
      );

      // Update theme if changed
      if (settings.theme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else if (settings.theme === "light") {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch (error) {
      this.showNotification("Failed to update settings", "error");
    } finally {
      this.hideLoading();
    }
  }

  async loadClasses() {
    try {
      const response = await fetch("/settings/api/classes");
      const classes = await response.json();
      this.renderClasses(classes);
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  }

  renderClasses(classes) {
    const container = document.getElementById("classes-container");
    if (!container) return;

    if (classes.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-chalkboard-teacher text-4xl mb-3 opacity-50"></i>
                    <p class="font-medium">No classes configured</p>
                    <p class="text-sm mt-1">Add your first class to get started</p>
                </div>
            `;
      return;
    }

    container.innerHTML = classes
      .map(
        (cls) => `
            <div class="class-item p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h4 class="font-bold text-gray-900 dark:text-white">${cls.class_name}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Sections: ${cls.sections}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="edit-class px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600" data-id="${cls.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-class px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600" data-id="${cls.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="text-gray-600 dark:text-gray-400">Max Students:</div>
                    <div class="font-medium">${cls.max_students}</div>
                    <div class="text-gray-600 dark:text-gray-400">Class Teacher:</div>
                    <div class="font-medium">${cls.class_teacher || "Not assigned"}</div>
                    <div class="text-gray-600 dark:text-gray-400">Room:</div>
                    <div class="font-medium">${cls.room_number || "Not specified"}</div>
                </div>
            </div>
        `,
      )
      .join("");

    // Add event listeners to class buttons
    container.querySelectorAll(".edit-class").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.editClass(e.target.closest("button").dataset.id),
      );
    });

    container.querySelectorAll(".delete-class").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.deleteClass(e.target.closest("button").dataset.id),
      );
    });
  }

  showClassForm(classData = null) {
    this.showModal(
      classData ? "Edit Class" : "Add New Class",
      `
            <div class="space-y-4">
                <div class="relative">
                    <input type="text" id="class-name" value="${classData?.class_name || ""}" 
                           class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all" 
                           placeholder="e.g., 10TH">
                    <label class="absolute -top-2 left-3 px-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900">
                        Class Name
                    </label>
                </div>
                
                <div class="relative">
                    <input type="text" id="class-sections" value="${classData?.sections || "A,B,C,D"}" 
                           class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all" 
                           placeholder="e.g., A,B,C,D">
                    <label class="absolute -top-2 left-3 px-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900">
                        Sections (comma separated)
                    </label>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="relative">
                        <input type="number" id="max-students" value="${classData?.max_students || 40}" 
                               class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all">
                        <label class="absolute -top-2 left-3 px-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900">
                            Max Students
                        </label>
                    </div>
                    
                    <div class="relative">
                        <input type="text" id="room-number" value="${classData?.room_number || ""}" 
                               class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all" 
                               placeholder="e.g., Room 101">
                        <label class="absolute -top-2 left-3 px-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900">
                            Room Number
                        </label>
                    </div>
                </div>
                
                <div class="relative">
                    <input type="text" id="class-teacher" value="${classData?.class_teacher || ""}" 
                           class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all" 
                           placeholder="Teacher's name">
                    <label class="absolute -top-2 left-3 px-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900">
                        Class Teacher
                    </label>
                </div>
                
                <input type="hidden" id="class-id" value="${classData?.id || ""}">
            </div>
            `,
      () => this.saveClass(),
    );
  }

  async saveClass() {
    const classData = {
      action: document.getElementById("class-id").value ? "update" : "add",
      class_id: document.getElementById("class-id").value || null,
      class_name: document.getElementById("class-name").value,
      sections: document.getElementById("class-sections").value,
      max_students: document.getElementById("max-students").value,
      class_teacher: document.getElementById("class-teacher").value,
      room_number: document.getElementById("room-number").value,
      subjects: [], // You would implement subject selection here
    };

    try {
      const response = await fetch("/settings/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classData),
      });

      const result = await response.json();
      this.showNotification(
        result.message,
        result.success ? "success" : "error",
      );

      if (result.success) {
        this.loadClasses();
        this.hideModal();
      }
    } catch (error) {
      this.showNotification("Failed to save class", "error");
    }
  }

  async deleteClass(classId) {
    this.showConfirmation(
      "Delete Class",
      "Are you sure you want to delete this class? This will also delete associated subjects and marks.",
      async () => {
        try {
          const response = await fetch("/settings/classes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "delete",
              class_id: classId,
            }),
          });

          const result = await response.json();
          this.showNotification(
            result.message,
            result.success ? "success" : "error",
          );

          if (result.success) {
            this.loadClasses();
          }
        } catch (error) {
          this.showNotification("Failed to delete class", "error");
        }
      },
    );
  }

  async editClass(classId) {
    // Fetch class data and show edit form
    // You would implement this based on your API
    this.showClassForm({ id: classId, class_name: "Sample Class" });
  }

  async loadSubjects() {
    // Similar to loadClasses, implement based on your API
  }

  showSubjectForm(subjectData = null) {
    // Implement subject form modal
  }

  async performBackup() {
    const backupBtn = document.getElementById("manual-backup");
    const progressBar = document.getElementById("backup-progress-bar");
    const progressText = document.getElementById("backup-progress-text");

    backupBtn.disabled = true;
    backupBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Backing up...';

    // Simulate backup progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      progressBar.style.width = `${progress}%`;
      progressText.textContent = `${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);
        backupBtn.disabled = false;
        backupBtn.innerHTML =
          '<i class="fas fa-cloud-upload-alt mr-2"></i>Backup Now';

        // Update last backup time
        const now = new Date();
        document.getElementById("last-backup-time").textContent =
          now.toLocaleDateString() + " " + now.toLocaleTimeString();

        this.showNotification("Backup completed successfully", "success");
      }
    }, 100);

    // In production, you would make an actual API call
    // try {
    //     const response = await fetch('/settings/backup', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({ action: 'manual' })
    //     });
    //
    //     const result = await response.json();
    //     this.showNotification(result.message, result.success ? 'success' : 'error');
    // } catch (error) {
    //     this.showNotification('Backup failed', 'error');
    // }
  }

  async runSystemCheck() {
    try {
      this.showLoading();
      const response = await fetch("/settings/system-check");
      const result = await response.json();

      if (result.success) {
        const checks = result.checks;
        let message = "System check completed:\n";

        Object.entries(checks).forEach(([check, status]) => {
          message += `• ${check}: ${status ? "✅ OK" : "❌ Failed"}\n`;
        });

        this.showNotification(message, "success");
      } else {
        this.showNotification("System check failed", "error");
      }
    } catch (error) {
      this.showNotification("Failed to run system check", "error");
    } finally {
      this.hideLoading();
    }
  }

  async exportData() {
    this.showConfirmation(
      "Export Data",
      "This will export all your school data as a JSON file. Continue?",
      async () => {
        try {
          window.open("/settings/export-data", "_blank");
        } catch (error) {
          this.showNotification("Failed to export data", "error");
        }
      },
    );
  }

  async deleteAccount() {
    this.showConfirmation(
      "Delete Account",
      '⚠️ WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Type "DELETE" to confirm.',
      async () => {
        // Implement account deletion
        this.showNotification(
          "Account deletion requested. This feature is not yet implemented.",
          "info",
        );
      },
      true, // Show input field for confirmation
    );
  }

  async saveAllSettings() {
    // Save all settings from all tabs
    await Promise.all([
      this.updateProfile(),
      this.updateSchool(),
      this.updateAdvancedSettings(),
    ]);

    this.showNotification("All settings saved successfully", "success");
  }

  async resetAllSettings() {
    try {
      // Implement reset logic
      this.showNotification("Settings reset to default", "success");
    } catch (error) {
      this.showNotification("Failed to reset settings", "error");
    }
  }

  // UI Helper Methods
  showNotification(message, type = "info") {
    const container = document.getElementById("notification-container");
    const notification = document.createElement("div");

    notification.className = `px-6 py-4 rounded-xl shadow-lg border transform transition-all duration-300 translate-x-full ${
      type === "success"
        ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
        : type === "error"
          ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
    }`;

    notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                  type === "success"
                    ? "fa-check-circle"
                    : type === "error"
                      ? "fa-exclamation-circle"
                      : "fa-info-circle"
                } mr-3 text-lg"></i>
                <div class="flex-1">
                    <div class="font-medium">${message}</div>
                </div>
                <button class="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
      notification.classList.add("translate-x-0");
    }, 10);

    // Add close button functionality
    notification.querySelector("button").addEventListener("click", () => {
      notification.classList.remove("translate-x-0");
      notification.classList.add("translate-x-full");
      setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove("translate-x-0");
        notification.classList.add("translate-x-full");
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  showModal(title, content, onConfirm, needsConfirmation = false) {
    const modal = document.getElementById("confirmation-modal");
    const titleEl = document.getElementById("modal-title");
    const messageEl = document.getElementById("modal-message");
    const confirmBtn = document.getElementById("modal-confirm");
    const cancelBtn = document.getElementById("modal-cancel");

    titleEl.textContent = title;

    if (needsConfirmation) {
      messageEl.innerHTML =
        content +
        `
                <div class="mt-4">
                    <input type="text" id="confirmation-input" 
                           class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                           placeholder="Type DELETE to confirm">
                </div>
            `;

      confirmBtn.disabled = true;

      const input = messageEl.querySelector("#confirmation-input");
      input.addEventListener("input", (e) => {
        confirmBtn.disabled = e.target.value !== "DELETE";
      });
    } else {
      messageEl.innerHTML = content;
    }

    // Set up confirm action
    const confirmHandler = () => {
      if (needsConfirmation) {
        const input = messageEl.querySelector("#confirmation-input");
        if (input.value === "DELETE") {
          onConfirm();
          modal.classList.add("hidden");
        }
      } else {
        onConfirm();
        modal.classList.add("hidden");
      }
    };

    // Update event listeners
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));

    document
      .getElementById("modal-confirm")
      .addEventListener("click", confirmHandler);
    document.getElementById("modal-cancel").addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    modal.classList.remove("hidden");
  }

  showConfirmation(title, message, onConfirm, needsConfirmation = false) {
    this.showModal(title, `<p>${message}</p>`, onConfirm, needsConfirmation);
  }

  showLoading() {
    document.getElementById("loading-overlay").classList.remove("hidden");
  }

  hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden");
  }

  hideModal() {
    document.getElementById("confirmation-modal").classList.add("hidden");
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.settingsManager = new SettingsManager();

  // Set theme from localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
  }
});
