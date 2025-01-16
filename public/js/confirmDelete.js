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