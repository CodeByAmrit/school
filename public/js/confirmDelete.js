// Integrated JavaScript for Student Table

// Initialize when DOM is loaded
window.addEventListener("DOMContentLoaded", function () {
  // Initialize dropdowns
  document.querySelectorAll("[data-dropdown-toggle]").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      const dropdownId = this.getAttribute("data-dropdown-toggle");
      const dropdown = document.getElementById(dropdownId);
      dropdown.classList.toggle("hidden");
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", function () {
    document.querySelectorAll('[id^="dropdown-"]').forEach((dropdown) => {
      dropdown.classList.add("hidden");
    });
  });

  // Prevent dropdown close when clicking inside
  document.querySelectorAll('[id^="dropdown-"]').forEach((dropdown) => {
    dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });

  // Initialize delete confirmation
  document.querySelectorAll('[id^="delete-link-"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (!confirmDelete(event, link)) {
        event.preventDefault();
      }
    });
  });

  // Initialize "move to leaved" confirmation
  document
    .querySelectorAll('[id^="move-to-leaved-form-"]')
    .forEach(function (form) {
      form.addEventListener("submit", function (event) {
        if (
          !confirm(
            "Are you sure you want to move this student to the leaved list?",
          )
        ) {
          event.preventDefault();
        }
      });
    });

  // Row selection functionality
  const selectAllCheckbox = document.getElementById("checkbox-all-search");
  const studentCheckboxes = document.querySelectorAll(".student-checkbox");
  const selectedCountElement = document.getElementById("selected-count");
  const bulkActionsBtn = document.getElementById("bulk-actions-btn");
  const bulkActionsPanel = document.getElementById("bulk-actions-panel");
  const bulkSelectedCount = document.getElementById("bulk-selected-count");
  const clearSelectionBtn = document.getElementById("clear-selection");
  const totalStudentsElement = document.getElementById("total-students");

  // Initialize select all functionality
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const isChecked = this.checked;
      const checkboxes = document.querySelectorAll(".student-checkbox");

      checkboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
        if (isChecked) {
          const row = checkbox.closest("tr");
          row.classList.add("bg-blue-50", "border-l-4", "border-blue-400");
        } else {
          const row = checkbox.closest("tr");
          row.classList.remove("bg-blue-50", "border-l-4", "border-blue-400");
        }
      });

      updateSelectedCount();
      updateBulkActionsButtons();
    });
  }

  // Individual checkbox change
  studentCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      // Update row styling
      const row = this.closest("tr");
      if (this.checked) {
        row.classList.add("bg-blue-50", "border-l-4", "border-blue-400");
      } else {
        row.classList.remove("bg-blue-50", "border-l-4", "border-blue-400");
      }

      // Update "select all" checkbox state
      const allChecked = Array.from(studentCheckboxes).every(
        (cb) => cb.checked,
      );
      const someChecked = Array.from(studentCheckboxes).some(
        (cb) => cb.checked,
      );

      if (selectAllCheckbox) {
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
      }

      updateSelectedCount();
      updateBulkActionsButtons();
    });
  });

  // Clear selection
  if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener("click", function () {
      studentCheckboxes.forEach((checkbox) => {
        checkbox.checked = false;
        const row = checkbox.closest("tr");
        row.classList.remove("bg-blue-50", "border-l-4", "border-blue-400");
      });

      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }

      updateSelectedCount();
      updateBulkActionsButtons();
    });
  }

  // Bulk actions
  if (document.getElementById("export-selected")) {
    document
      .getElementById("export-selected")
      .addEventListener("click", function () {
        const selectedIds = getSelectedStudentIds();

        if (selectedIds.length > 0) {
          // Call your existing Excel export function
          document.getElementById("selected_excel_file_button").click();
        } else {
          alert("Please select at least one student.");
        }
      });
  }

  if (document.getElementById("mark-attendance")) {
    document
      .getElementById("mark-attendance")
      .addEventListener("click", function () {
        const selectedIds = getSelectedStudentIds();

        if (selectedIds.length > 0) {
          alert(`Marking attendance for ${selectedIds.length} student(s)`);
          // Implement actual attendance marking logic here
        } else {
          alert("Please select at least one student.");
        }
      });
  }

  // Initialize total students count
  if (totalStudentsElement && studentlist && studentlist.length) {
    totalStudentsElement.textContent = studentlist.length;
  }

  // Initialize bulk action buttons visibility
  updateBulkActionsButtons();

  // Close modal when clicking on backdrop
  const quickViewModal = document.getElementById("quick-view-modal");
  if (quickViewModal) {
    quickViewModal.addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.add("hidden");
      }
    });
  }
});

// Helper Functions

function confirmDelete(event, link) {
  const isConfirmed = confirm("Are you sure you want to delete this record?");

  if (isConfirmed) {
    return true;
  } else {
    event.preventDefault();
    return false;
  }
}

function updateSelectedCount() {
  const selectedCountElement = document.getElementById("selected-count");
  const bulkSelectedCount = document.getElementById("bulk-selected-count");

  if (selectedCountElement && bulkSelectedCount) {
    const selectedCount = document.querySelectorAll(
      ".student-checkbox:checked",
    ).length;
    selectedCountElement.textContent = selectedCount;
    bulkSelectedCount.textContent = `${selectedCount} student${selectedCount !== 1 ? "s" : ""} selected`;
  }
}

function updateBulkActionsButtons() {
  const selectedCount = document.querySelectorAll(
    ".student-checkbox:checked",
  ).length;
  const bulkActionsBtn = document.getElementById("bulk-actions-btn");
  const bulkActionsPanel = document.getElementById("bulk-actions-panel");
  const promoteButton = document.getElementById("promote-button");
  const demoteButton = document.getElementById("demote-button");
  const selectedIdCardButton = document.getElementById(
    "selected_id_card_button",
  );
  const selectedCertificateButton = document.getElementById(
    "selected_Certificate_button",
  );
  const selectedExcelButton = document.getElementById(
    "selected_excel_file_button",
  );

  // Show/hide bulk actions button
  if (bulkActionsBtn) {
    if (selectedCount > 0) {
      bulkActionsBtn.classList.remove("hidden");
    } else {
      bulkActionsBtn.classList.add("hidden");
    }
  }

  // Show/hide bulk actions panel
  if (bulkActionsPanel) {
    if (selectedCount > 0) {
      bulkActionsPanel.classList.remove("hidden");
    } else {
      bulkActionsPanel.classList.add("hidden");
    }
  }

  // Enable/disable action buttons based on selection
  const isEnabled = selectedCount > 0;

  if (promoteButton) {
    promoteButton.disabled = !isEnabled;
    promoteButton.classList.toggle("opacity-50", !isEnabled);
    promoteButton.classList.toggle("cursor-not-allowed", !isEnabled);
  }

  if (demoteButton) {
    demoteButton.disabled = !isEnabled;
    demoteButton.classList.toggle("opacity-50", !isEnabled);
    demoteButton.classList.toggle("cursor-not-allowed", !isEnabled);
  }

  if (selectedIdCardButton) {
    selectedIdCardButton.disabled = !isEnabled;
    selectedIdCardButton.classList.toggle("opacity-50", !isEnabled);
    selectedIdCardButton.classList.toggle("cursor-not-allowed", !isEnabled);
  }

  if (selectedCertificateButton) {
    selectedCertificateButton.disabled = !isEnabled;
    selectedCertificateButton.classList.toggle("opacity-50", !isEnabled);
    selectedCertificateButton.classList.toggle(
      "cursor-not-allowed",
      !isEnabled,
    );
  }

  if (selectedExcelButton) {
    selectedExcelButton.disabled = !isEnabled;
    selectedExcelButton.classList.toggle("opacity-50", !isEnabled);
    selectedExcelButton.classList.toggle("cursor-not-allowed", !isEnabled);
  }
}

function getSelectedStudentIds() {
  const checkboxes = document.querySelectorAll(".student-checkbox:checked");
  const selectedIds = [];

  checkboxes.forEach((checkbox) => {
    selectedIds.push(checkbox.getAttribute("data-id"));
  });

  return selectedIds;
}

function getSelectedStudents() {
  const checkboxes = document.querySelectorAll(".student-checkbox:checked");
  const selectedStudents = [];

  checkboxes.forEach((checkbox) => {
    selectedStudents.push({
      id: checkbox.getAttribute("data-id"),
      currentClass: checkbox.getAttribute("data-class"),
    });
  });

  return selectedStudents;
}

// Quick view function
function quickViewStudent(studentId) {
  const modal = document.getElementById("quick-view-modal");
  const modalContent = modal.querySelector(".relative");

  // In a real implementation, fetch student data via AJAX
  // For now, show a placeholder
  modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-start mb-6">
                <h3 class="text-xl font-bold text-gray-900">Student Quick View</h3>
                <button onclick="document.getElementById('quick-view-modal').classList.add('hidden')" 
                        class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="flex items-center space-x-4 mb-6">
                <div class="w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow-lg">
                    <img src="https://ui-avatars.com/api/?name=Student+Name&background=63b3ed&color=fff&bold=true&size=80"
                         alt="Student"
                         class="object-cover w-full h-full">
                </div>
                <div>
                    <h4 class="text-lg font-bold text-gray-900">Loading...</h4>
                    <p class="text-gray-600">ID: ${studentId}</p>
                    <div class="flex items-center space-x-2 mt-2">
                        <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Loading...
                        </span>
                    </div>
                </div>
            </div>
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
                <p class="text-gray-600 mt-2">Loading student details...</p>
            </div>
        </div>
    `;

  modal.classList.remove("hidden");

  // Simulate AJAX call to fetch student data
  setTimeout(() => {
    // In real implementation, fetch actual data
    modalContent.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <h3 class="text-xl font-bold text-gray-900">Student Quick View</h3>
                    <button onclick="document.getElementById('quick-view-modal').classList.add('hidden')" 
                            class="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="flex items-center space-x-4 mb-6">
                    <div class="w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow-lg">
                        <img src="https://ui-avatars.com/api/?name=Student+${studentId}&background=63b3ed&color=fff&bold=true&size=80"
                             alt="Student"
                             class="object-cover w-full h-full">
                    </div>
                    <div>
                        <h4 class="text-lg font-bold text-gray-900">Student ${studentId}</h4>
                        <p class="text-gray-600">ID: ${studentId}</p>
                        <div class="flex items-center space-x-2 mt-2">
                            <span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                            <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                Class 10
                            </span>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="p-4 bg-blue-50 rounded-xl">
                        <p class="text-sm text-gray-600">Father's Name</p>
                        <p class="font-medium text-gray-900">Parent Name</p>
                    </div>
                    <div class="p-4 bg-blue-50 rounded-xl">
                        <p class="text-sm text-gray-600">Session</p>
                        <p class="font-medium text-gray-900">2023-2024</p>
                    </div>
                </div>
                <div class="flex justify-end space-x-3">
                    <button onclick="document.getElementById('quick-view-modal').classList.add('hidden')"
                            class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                        Close
                    </button>
                    <a href="/student/edit/${studentId}"
                       class="btn-gradient text-white font-medium rounded-xl px-6 py-2.5 inline-flex items-center">
                        <i class="fas fa-edit mr-2"></i>
                        Edit Profile
                    </a>
                </div>
            </div>
        `;
  }, 500);
}

// Your existing functions (keep them as they are)

// Function to handle promotion of selected students
if (document.getElementById("promote-button")) {
  document
    .getElementById("promote-button")
    .addEventListener("click", function () {
      const selectedStudents = getSelectedStudents();
      if (selectedStudents.length > 0) {
        if (
          confirm("Are you sure you want to promote the selected students?")
        ) {
          fetch("/promote", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              studentIds: selectedStudents.map((student) => student.id),
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message.includes("successfully")) {
                alert(data.message);
                location.reload();
              } else {
                alert(data.message);
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("An error occurred while promoting students.");
            });
        }
      } else {
        alert("No students selected.");
      }
    });
}

// Function to handle demotion of selected students
if (document.getElementById("demote-button")) {
  document
    .getElementById("demote-button")
    .addEventListener("click", function () {
      const selectedStudents = getSelectedStudents();
      if (selectedStudents.length > 0) {
        if (confirm("Are you sure you want to demote the selected students?")) {
          fetch("/demote", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              studentIds: selectedStudents.map((student) => student.id),
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message.includes("successfully")) {
                alert(data.message);
                location.reload();
              } else {
                alert(data.message);
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("An error occurred while demoting students.");
            });
        }
      } else {
        alert("No students selected.");
      }
    });
}

// ID Card generation
if (document.getElementById("selected_id_card_button")) {
  document
    .getElementById("selected_id_card_button")
    .addEventListener("click", function () {
      const selectedStudents = getSelectedStudents();

      if (selectedStudents.length > 0) {
        fetch("/api/students/virtual-cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentIds: selectedStudents.map((student) => student.id),
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to generate PDF");
            }
            return response.blob();
          })
          .then((blob) => {
            const pdfUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "ID-Cards.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pdfUrl);
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("Error occurred: " + error.message);
          });
      } else {
        alert("Please select at least one student to generate ID cards.");
      }
    });
}

// Certificate generation
if (document.getElementById("selected_Certificate_button")) {
  document
    .getElementById("selected_Certificate_button")
    .addEventListener("click", function () {
      const selectedStudents = getSelectedStudents();
      const spinner = document.getElementById("spinner");

      if (selectedStudents.length > 0) {
        if (spinner) spinner.classList.remove("hidden");

        fetch("/api/students/ceremonty-certificates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentIds: selectedStudents.map((student) => student.id),
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to generate PDF");
            }
            return response.blob();
          })
          .then((blob) => {
            const pdfUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "Class_list.xls";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pdfUrl);
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("Error occurred: " + error.message);
          })
          .finally(() => {
            if (spinner) spinner.classList.add("hidden");
          });
      } else {
        alert("Please select at least one student to generate certificates.");
      }
    });
}

// Excel export
if (document.getElementById("selected_excel_file_button")) {
  document
    .getElementById("selected_excel_file_button")
    .addEventListener("click", function () {
      const selectedStudents = getSelectedStudents();
      const spinner = document.getElementById("spinner");

      if (selectedStudents.length > 0) {
        if (spinner) spinner.classList.remove("hidden");

        fetch("/api/students/create-excel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentIds: selectedStudents.map((student) => student.id),
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to generate Excel file");
            }
            return response.blob();
          })
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Student_List.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("Error occurred: " + error.message);
          })
          .finally(() => {
            if (spinner) spinner.classList.add("hidden");
          });
      } else {
        alert("Select at least one student to create excel file");
      }
    });
}

// Make functions available globally
window.confirmDelete = confirmDelete;
window.getSelectedStudents = getSelectedStudents;
window.quickViewStudent = quickViewStudent;
