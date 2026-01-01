const tableElement = document.getElementById("table-search-body"); // tbody element
const loadingTable = document.getElementById("loading_table");
const tableContainer = document.getElementById("studentsTable"); // Full table element
let dataTable = null; // Store the DataTable instance

async function getStudents() {
  const response = await fetch(`/api/students/get/`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

getStudents()
  .then((data) => {
    loadingTable.style.display = "none";

    // Clear existing table rows
    tableElement.innerHTML = "";

    const fragment = document.createDocumentFragment();
    data.forEach((student) => {
      const tr = document.createElement("tr");
      tr.className =
        "bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600";
      tr.innerHTML = `
            <td class="flex w-fit items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                <div class="w-10 h-10 overflow-hidden rounded-full">
                    <img class="object-cover w-full h-full" src="${student.image}" alt="${student.name}">
                </div>
                <div class="ps-3">
                    <div class="text-base font-semibold">${student.name}</div>
                    <div class="font-normal text-gray-500">${student.session}</div>
                </div>
            </td>
            <td class="px-6 py-4">${student.class}</td>
            <td class="px-6 py-4">
                <a href="/student/edit/${student.school_id}" class="text-blue-600 hover:underline">Edit</a>
            </td>
        `;
      fragment.appendChild(tr);
    });
    tableElement.appendChild(fragment);

    // Initialize Simple-DataTables
    if (dataTable) {
      dataTable.destroy(); // Destroy the existing instance before re-initializing
    }
    dataTable = new simpleDatatables.DataTable(tableContainer);
  })
  .catch((error) => {
    console.error("Error fetching students:", error);
  });
