async function getTotalStudents() {
  try {
    const response = await fetch(`/total-students`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

async function updateStudentCount() {
  const total_data = await getTotalStudents();
  document.getElementById("student").innerText =
    total_data.total_students.toString() + "+";
  document.getElementById("teacher").innerText =
    total_data.total_teachers.toString() + "+";
}

document.addEventListener("DOMContentLoaded", () => {
  updateStudentCount();
  
  // Mobile menu toggle logic
  const toggleBtn = document.querySelector('[data-collapse-toggle="navbar-default"]');
  const menu = document.getElementById('navbar-default');
  
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', function() {
      menu.classList.toggle('hidden');
    });
  }
});
