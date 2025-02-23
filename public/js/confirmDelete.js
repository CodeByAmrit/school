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
    console.log(this.checked);
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        if (isChecked) {
            checkbox.classList.add("border-1", "border-blue-400", "bg-blue-50", "dark:bg-blue-900");
        } else {
            checkbox.classList.remove("border-1", "border-blue-400", "bg-blue-50", "dark:bg-blue-900");
        }
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

document.getElementById('selected_id_card_button').addEventListener('click', function () {
    const selectedStudents = getSelectedStudents();

    if (selectedStudents.length > 0) {
        fetch('/api/students/virtual-cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentIds: selectedStudents.map(student => student.id)
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to generate PDF');
                }
                return response.blob(); // Convert response to binary blob
            })
            .then(blob => {
                const pdfUrl = URL.createObjectURL(blob); // Create a temporary URL
                const a = document.createElement("a"); // Create a hidden <a> element
                a.href = pdfUrl;
                a.download = "ID-Cards.pdf"; // Set the default filename
                document.body.appendChild(a);
                a.click(); // Trigger the download
                document.body.removeChild(a); // Remove the element after download
                URL.revokeObjectURL(pdfUrl); // Clean up the temporary URL
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error occurred: ' + error.message);
            });
    }
});

document.getElementById('selected_Certificate_button').addEventListener('click', function () {
    const selectedStudents = getSelectedStudents();
    const spinner = document.getElementById('spinner');

    if (selectedStudents.length > 0) {
        spinner.classList.remove('hidden'); // Show spinner

        fetch('/api/students/ceremonty-certificates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentIds: selectedStudents.map(student => student.id)
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to generate PDF');
                }
                return response.blob(); // Convert response to binary blob
            })
            .then(blob => {
                const pdfUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = "Class_list.xls";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(pdfUrl);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error occurred: ' + error.message);
            })
            .finally(() => {
                spinner.classList.add('hidden'); // Hide spinner after completion
            });
    }
});

document.getElementById('selected_excel_file_button').addEventListener('click', function () {
    const selectedStudents = getSelectedStudents();
    const spinner = document.getElementById('spinner');

    if (selectedStudents.length > 0) {
        spinner.classList.remove('hidden'); // Show spinner

        fetch('/api/students/create-excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentIds: selectedStudents.map(student => student.id)
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to generate PDF');
                }
                return response.blob(); // Convert response to binary blob
            })
            .then(blob => {
                const pdfUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = `Student_List.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(pdfUrl);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error occurred: ' + error.message);
            })
            .finally(() => {
                spinner.classList.add('hidden'); // Hide spinner after completion
            });
    } else {
        alert("Select At least one student to create excel file");
    }
});


// Function to get selected students
function getSelectedStudents() {
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    let selectedStudents = [];
    checkboxes.forEach(checkbox => {
        checkbox.classList.add("border-1", "border-blue-400", "bg-blue-50", "dark:bg-blue-900");
        selectedStudents.push({
            id: checkbox.getAttribute('data-id'),
            currentClass: checkbox.getAttribute('data-class')
        });
    });
    return selectedStudents;
}

document.querySelectorAll(".student-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        let row = this.closest("tr");
        if (this.checked) {
            row.classList.add("border-1", "border-blue-400", "bg-blue-50", "dark:bg-blue-900");
        } else {
            row.classList.remove("border-1", "border-blue-400", "bg-blue-50", "dark:bg-blue-900");
        }
    });
});

