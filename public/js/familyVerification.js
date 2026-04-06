// Family ID Verification Logic
document.addEventListener("DOMContentLoaded", () => {
  const verifyBtn = document.getElementById("verify-family-btn");
  if (!verifyBtn) return;

  verifyBtn.addEventListener("click", async () => {
    const familyId = document.getElementById("family_id").value.trim();
    if (!familyId) {
      alert("Please enter a Family ID first.");
      return;
    }

    const studentName = document.getElementById("name").value.trim().toUpperCase();
    const fatherName = document.getElementById("father_name").value.trim().toUpperCase();
    const motherName = document.getElementById("mother_name").value.trim().toUpperCase();

    if (!studentName || !fatherName || !motherName) {
      alert("Please fill Student, Father, and Mother names first to verify.");
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';

    try {
      const response = await fetch(`/get-family-members/${familyId}`);
      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.result)) {
        const members = data.result.map(m => m.text.toUpperCase());
        console.log("Family members found:", members);

        const studentMatched = members.some(m => m.includes(studentName) || studentName.includes(m));
        const fatherMatched = members.some(m => m.includes(fatherName) || fatherName.includes(m));
        const motherMatched = members.some(m => m.includes(motherName) || motherName.includes(m));

        if (studentMatched && fatherMatched && motherMatched) {
          updateVerificationStatus(true);
          alert("✅ Family ID Verified Successfully!\nStudent, Father, and Mother names matched.");
        } else {
          let missing = [];
          if (!studentMatched) missing.push("Student Name");
          if (!fatherMatched) missing.push("Father Name");
          if (!motherMatched) missing.push("Mother Name");
          
          updateVerificationStatus(false);
          alert(`❌ Verification Failed.\nCould not find matches for: ${missing.join(", ")} in the Family ID records.`);
        }
      } else {
        alert("❌ Error: Invalid Family ID or no records found.");
        updateVerificationStatus(false);
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("An error occurred during verification. Please try again.");
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = '<i class="fas fa-shield-alt mr-2"></i>Verify';
    }
  });

  function updateVerificationStatus(isVerified) {
    const statusInput = document.getElementById("family_id_verified");
    const statusDiv = document.getElementById("verification-status");
    const schoolIdInput = document.getElementById("school_id");
    const schoolId = schoolIdInput ? schoolIdInput.value : null;

    if (statusInput) statusInput.value = isVerified ? "true" : "false";

    if (statusDiv) {
      if (isVerified) {
        statusDiv.innerHTML = `
          <span class="text-green-600 dark:text-green-400 flex items-center">
            <i class="fas fa-check-circle mr-1 text-xs"></i> Verified Securely
          </span>
        `;
        
        // If student exists, update status in DB immediately
        if (schoolId && schoolId !== 'null' && schoolId !== '') {
          fetch(`/api/student/verify/${schoolId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: true })
          }).catch(err => console.error("Auto-sync error:", err));
        }
      } else {
        statusDiv.innerHTML = `
          <span class="text-amber-600 dark:text-amber-400 flex items-center">
            <i class="fas fa-exclamation-triangle mr-1 text-xs"></i> Unverified Profile
          </span>
        `;
      }
    }
  }

  // Reset verification if family_id changes
  const familyIdInput = document.getElementById("family_id");
  if (familyIdInput) {
    familyIdInput.addEventListener("input", () => {
      updateVerificationStatus(false);
    });
  }
});
