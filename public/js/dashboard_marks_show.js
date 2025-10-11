document.addEventListener('DOMContentLoaded', () => {
  const sessionDropdown = document.getElementById('session');
  const classDataTable = document.getElementById('classData');

  // Function to calculate the current session
  function getCurrentSession() {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  }

  // Populate session dropdown dynamically
  async function fetchSessions(session) {
    try {
      const response = await fetch(`/students/count/${session}`); // Adjust to your API endpoint
      const data = await response.json();

      const currentSession = getCurrentSession();

      // Populate dropdown with sessions
      sessionDropdown.innerHTML = data.sessions
        .map((session) => {
          const isSelected = session === currentSession ? 'selected' : '';
          return `<option value="${session}" ${isSelected}>${session}</option>`;
        })
        .join('');

      // Automatically fetch data for the current session
      await fetchStudentData(currentSession);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }

  // Fetch student count data
  async function fetchStudentData(session) {
    try {
      const response = await fetch(`/students/count/${session}`);
      const result = await response.json();

      if (result.data && result.data.length > 0) {
        classDataTable.innerHTML = result.data
          .map(
            (row) => `
                        <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                            <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                ${row.class}
                            </td>
                            <td class="px-6 py-4 text-blue-500 font-bold">
                                ${row.male_count}
                            </td>
                            <td class="px-6 py-4 text-red-400 font-bold">
                                ${row.female_count}
                            </td>
                        </tr>
                    `
          )
          .join('');
      } else {
        classDataTable.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No data available for the selected session.
                        </td>
                    </tr>
                `;
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  }

  // Trigger fetchStudentData on session dropdown change
  sessionDropdown.addEventListener('change', async (event) => {
    const selectedSession = event.target.value;
    await fetchStudentData(selectedSession);
  });

  // Initial setup
  (async () => {
    const currentYear = new Date().getFullYear();
    let value = `${currentYear}-${currentYear + 1}`;
    await fetchStudentData(value);
  })();
});

window.addEventListener('load', () => {
  setTimeout(() => {
    const introScreen = document.getElementById('introScreen');
    introScreen.style.transition = 'opacity 1s ease-out';
    introScreen.style.opacity = '0';
    setTimeout(() => {
      introScreen.style.display = 'none';
      localStorage.setItem('introShown', 'true');
    }, 1000);
  }, 1000);
});
