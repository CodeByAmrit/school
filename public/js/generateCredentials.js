document.addEventListener("DOMContentLoaded", function () {
    const generateBtn = document.getElementById("generate_credentials_button");
    const spinner = document.getElementById("spinner");
  
    if (generateBtn) {
      generateBtn.addEventListener("click", async function () {
        // Collect selected IDs
        const checkboxes = document.querySelectorAll(".student-checkbox:checked");
        const studentIds = Array.from(checkboxes).map((cb) => cb.dataset.id);
  
        const confirmMsg =
          studentIds.length > 0
            ? `Generate credentials for ${studentIds.length} selected students?`
            : "Generate credentials for ALL your students? This may take a while.";
  
        if (!confirm(confirmMsg)) return;
  
        // Show spinner
        if (spinner) spinner.classList.remove("hidden");
  
        try {
          const response = await fetch("/api/students/generate-credentials", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ student_ids: studentIds.length > 0 ? studentIds : null }),
          });
  
          const result = await response.json();
  
          // Hide spinner
          if (spinner) spinner.classList.add("hidden");
  
          if (response.ok) {
            alert(result.message || "Credentials generated successfully.");
          } else {
            alert("Error: " + (result.error || result.message || "Unknown error"));
          }
        } catch (error) {
          if (spinner) spinner.classList.add("hidden");
          console.error("Error generating credentials:", error);
          alert("An unexpected error occurred.");
        }
      });
    }
});
