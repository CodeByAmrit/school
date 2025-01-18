document.addEventListener('DOMContentLoaded', function () {
    // Handle "View" button clicks
    const viewButtons = document.querySelectorAll('.view-file-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function () {
            const fileUrl = button.getAttribute('data-file-url');
            openModal(fileUrl);
        });
    });

    // Close the modal when the close button is clicked
    const closeModalBtn = document.querySelector('[data-modal-hide="default-modal"]');
    closeModalBtn.addEventListener('click', closeModal);
});

function openModal(fileUrl) {
    const modal = document.getElementById('default-modal');
    const fileFrame = document.getElementById('fileFrame');

    fileFrame.src = fileUrl;  // Set the iframe source to the selected file URL

    // Listen for iframe load to confirm if the file is successfully loaded
    fileFrame.onload = function () {
        console.log('File loaded successfully');
    };

    fileFrame.onerror = function () {
        console.log('Error loading file');
    };

    // Show the modal
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('default-modal');
    const fileFrame = document.getElementById('fileFrame');
    fileFrame.src = '';  // Clear the iframe source to stop loading
    modal.classList.add('hidden');  // Hide the modal
}
