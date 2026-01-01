document.addEventListener("DOMContentLoaded", () => {
  /* ======================================================
     INTRO / LOADING SCREEN
  ====================================================== */
  const introScreen = document.getElementById("introScreen");

  if (introScreen) {
    if (!localStorage.getItem("introShown")) {
      setTimeout(() => {
        introScreen.style.transition = "opacity 0.8s ease-out";
        introScreen.style.opacity = "0";
        setTimeout(() => {
          introScreen.style.display = "none";
          localStorage.setItem("introShown", "true");
        }, 800);
      }, 1500);
    } else {
      introScreen.style.display = "none";
    }
  }

  /* ======================================================
     ELEMENT REFERENCES
  ====================================================== */
  const sessionDropdown = document.getElementById("session");
  const classDataTable = document.getElementById("classData");
  const currentSessionDisplay = document.getElementById(
    "currentSessionDisplay",
  );
  const tableTotalStudents = document.getElementById("tableTotalStudents");
  const totalBoysElement = document.getElementById("totalBoys");
  const totalGirlsElement = document.getElementById("totalGirls");

  /* ======================================================
     HELPERS
  ====================================================== */
  function getCurrentSession() {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  }

  function showLoading() {
    classDataTable.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-10 text-center">
          <i class="fas fa-spinner animate-spin text-blue-500 text-xl"></i>
        </td>
      </tr>
    `;
  }

  function showEmpty(session) {
    classDataTable.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <i class="fas fa-database text-blue-500 text-xl"></i>
            </div>
            <p class="text-gray-600">No data available for ${session}</p>
            <p class="text-sm text-gray-500 mt-1">
              Select a different session or add students
            </p>
          </div>
        </td>
      </tr>
    `;
  }

  /* ======================================================
     FETCH + RENDER REAL DATA
  ====================================================== */
  async function fetchStudentData(session) {
    try {
      showLoading();

      const response = await fetch(`/students/count/${session}`);
      const result = await response.json();

      if (!result.data || result.data.length === 0) {
        showEmpty(session);
        tableTotalStudents.textContent = "0";
        totalBoysElement.textContent = "0";
        totalGirlsElement.textContent = "0";
        updateDashboardStats(0, 0);
        return;
      }

      let totalBoys = 0;
      let totalGirls = 0;

      const rows = result.data
        .map((row) => {
          const total = row.male_count + row.female_count;
          totalBoys += row.male_count;
          totalGirls += row.female_count;

          const ratio =
            total > 0
              ? `${Math.round((row.male_count / total) * 100)}:${Math.round(
                  (row.female_count / total) * 100,
                )}`
              : "0:0";

          const barWidth = total > 0 ? (row.male_count / total) * 100 : 0;

          return `
            <tr class="hover:bg-blue-50 transition-colors duration-200">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50
                              flex items-center justify-center mr-3">
                    <i class="fas fa-graduation-cap text-blue-600 text-sm"></i>
                  </div>
                  <span class="font-medium text-gray-900">${row.class}</span>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  <span class="font-bold text-blue-600">${row.male_count}</span>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-2 h-2 rounded-full bg-pink-500 mr-2"></div>
                  <span class="font-bold text-pink-600">${row.female_count}</span>
                </div>
              </td>

              <td class="px-6 py-4 font-bold text-gray-900">
                ${total}
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-16 h-2 rounded-full bg-blue-100 overflow-hidden mr-2">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-pink-500"
                         style="width:${barWidth}%"></div>
                  </div>
                  <span class="text-xs text-gray-600">${ratio}</span>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");

      classDataTable.innerHTML = rows;

      const totalStudents = totalBoys + totalGirls;
      tableTotalStudents.textContent = totalStudents;
      totalBoysElement.textContent = totalBoys;
      totalGirlsElement.textContent = totalGirls;

      updateDashboardStats(totalStudents, result.data.length);
    } catch (error) {
      console.error("Error fetching student data:", error);
      classDataTable.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-10 text-center text-red-500">
            Failed to load student data
          </td>
        </tr>
      `;
    }
  }

  /* ======================================================
     DASHBOARD STATS (SAFE)
  ====================================================== */
  function updateDashboardStats(totalStudents, classCount) {
    const activeClasses = document.getElementById("activeClasses");
    const attendanceRateEl = document.getElementById("attendanceRate");
    const presentCountEl = document.getElementById("presentCount");
    const pendingTasksEl = document.getElementById("pendingTasks");

    if (activeClasses) activeClasses.textContent = classCount;

    if (attendanceRateEl && presentCountEl) {
      const attendanceRate = Math.floor(Math.random() * 30) + 70;
      attendanceRateEl.textContent = `${attendanceRate}%`;
      presentCountEl.textContent = Math.floor(
        (totalStudents * attendanceRate) / 100,
      );
    }
  }

  /* ======================================================
     INIT + EVENTS
  ====================================================== */
  const initialSession = getCurrentSession();
  if (currentSessionDisplay) currentSessionDisplay.textContent = initialSession;
  fetchStudentData(initialSession);

  if (sessionDropdown) {
    sessionDropdown.addEventListener("change", function () {
      const session = this.value;
      if (currentSessionDisplay) currentSessionDisplay.textContent = session;

      fetchStudentData(session);

      const tableContainer = classDataTable.closest(".overflow-x-auto");
      if (tableContainer) {
        tableContainer.style.opacity = "0.8";
        setTimeout(() => (tableContainer.style.opacity = "1"), 300);
      }
    });
  }
});
