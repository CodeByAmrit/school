window.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[id^="delete-link-"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            if (!confirmDelete(event, link)) {
                event.preventDefault();
            }
        });
    });
});


function confirmDelete(event, link) {

    // Show a confirmation dialog
    const isConfirmed = confirm("Are you sure you want to delete this record?");

    // If the user clicked "Yes", proceed to the link
    if (isConfirmed) {
        // event.preventDefault();

        return true;
    } else {
        // If the user clicked "No", prevent the link from being followed
        event.preventDefault();
        return false;
    }
}
// JavaScript to handle "Select All" checkbox
document.getElementById('checkbox-all-search').addEventListener('change', function () {
    const isChecked = this.checked;
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
});

// Function to handle promotion of selected students
document.getElementById('promote-button').addEventListener('click', function () {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length > 0) {
        // Send the selected student IDs to the backend for promotion
        fetch('/promote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentIds: selectedStudents.map(student => student.id)
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message.includes('successfully')) {
                    alert(data.message); // Show success message
                    location.reload();  // Reload the page to reflect changes
                } else {
                    alert(data.message); // Show error message
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while promoting students.');
            });
    } else {
        alert('No students selected.');
    }
});

// Function to handle demotion of selected students
document.getElementById('demote-button').addEventListener('click', function () {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length > 0) {
        // Send the selected student IDs to the backend for demotion
        fetch('/demote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentIds: selectedStudents.map(student => student.id)
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message.includes('successfully')) {
                    alert(data.message); // Show success message
                    location.reload();  // Reload the page to reflect changes
                } else {
                    alert(data.message); // Show error message
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while demoting students.');
            });
    } else {
        alert('No students selected.');
    }
});

// Function to get selected students
function getSelectedStudents() {
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    let selectedStudents = [];
    checkboxes.forEach(checkbox => {
        selectedStudents.push({
            id: checkbox.getAttribute('data-id'),
            currentClass: checkbox.getAttribute('data-class')
        });
    });
    return selectedStudents;
}

// if (document.getElementById("student-table") && typeof simpleDatatables.DataTable !== 'undefined') {
//     // const dataTable = new simpleDatatables.DataTable("#student-table", {
//     //     searchable: false,
//     //     perPageSelect: false
//     // });
//     const dataTable = new simpleDatatables.DataTable("#student-table", {
//         searchable: false,
//         perPageSelect: false,
//         perPage: 50, // set the number of rows per page
//         perPageSelect: [50, 100, 200, 500], // set the number of rows per page options
//          // enable or disable the next and previous buttons
//     });
//     // Observer to reapply Tailwind styles when new pages are inserted
//     dataTable.on("datatable.update", function () {
//         setTimeout(() => {
//             document.querySelectorAll('.datatable-pagination li').forEach(el => {
//                 el.classList.add("bg-gray-200", "px-3", "py-1", "rounded", "cursor-pointer", "hover:bg-gray-300");
//             });
//             document.querySelector('.datatable-pagination .active')?.classList.add("bg-blue-500", "text-white");
//         }, 50);
//     });
// }