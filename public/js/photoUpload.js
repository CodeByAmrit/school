document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('student_form');
    const saveButton = form.querySelector("button[type='button']");
    const loadingIcon = saveButton.querySelector('svg');
    const previewImage = document.getElementById('image-preview');
    const dropzoneFileInput = document.getElementById('dropzone-file');
    const signUpload = document.getElementById('file-signature');
    const schoolIdInput = document.getElementById('school_id');
    const buttonText = document.getElementById('button_');

    // Image preview logic
    dropzoneFileInput.addEventListener('change', function (event) {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                previewImage.src = e.target.result;
            };

            reader.readAsDataURL(file);
        } else {
            previewImage.src = '/image/user.svg';
        }
    });

    // Form submit logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior
        saveButton.disabled = true; // Disable the button
        loadingIcon.classList.remove('hidden'); // Show the loading spinner
        buttonText.innerText = 'Loading...'; // Change button text to "Loading..."

        const formData = new FormData();

        // Collect form data and convert all values to uppercase
        formData.append('name', document.getElementById('name').value.toUpperCase());
        formData.append('father_name', document.getElementById('father_name').value.toUpperCase());
        formData.append('mother_name', document.getElementById('mother_name').value.toUpperCase());
        formData.append('srn_no', document.getElementById('srn_no').value.toUpperCase());
        formData.append('pen_no', document.getElementById('pen_no').value.toUpperCase());
        formData.append('admission_no', document.getElementById('admission_no').value.toUpperCase());
        formData.append('roll_no', document.getElementById('roll_no').value.toUpperCase());
        formData.append('class', document.getElementById('class').value.toUpperCase());
        formData.append('session', document.getElementById('session').value.toUpperCase());
        formData.append('permanent_address', document.getElementById('permanent_address').value.toUpperCase());
        formData.append('corresponding_address', document.getElementById('corresponding_address').value.toUpperCase());
        formData.append('paste_file_no', document.getElementById('paste_file_no').value.toUpperCase());
        formData.append('mobile_no', document.getElementById('mobile_no').value.toUpperCase());
        formData.append('family_id', document.getElementById('family_id').value.toUpperCase());
        formData.append('dob', document.getElementById('dob').value.toUpperCase());
        formData.append('profile_status', document.getElementById('profile_status').value.toUpperCase());
        formData.append('apaar_id', document.getElementById('apaar_id').value.toUpperCase());


        // Check if photo is selected and append it to FormData
        const file = dropzoneFileInput.files[0];
        const signPhoto = signUpload.files[0];
        if (file) {
            formData.append('photo', file); // Append the selected photo file
        }

        if (signPhoto) {
            formData.append('sign', signPhoto);
        }

        const schoolId = schoolIdInput.value;

        try {
            // Send data to the server using fetch API
            const response = await fetch(`/update-student/${schoolId}`, {
                method: 'POST',
                body: formData, // Send the form data as the request body
            });

            const result = await response.json();

            if (result !== null) {
                alert('Data submitted successfully!');
                window.location.reload(); // Reload the page to reflect updated data
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('An error occurred: ' + error.message);
        } finally {
            saveButton.disabled = false; // Enable the button
            loadingIcon.classList.add('hidden'); // Hide the loading spinner
            buttonText.innerText = 'Update Details'; // Reset the button text
        }
    });

    // Trigger form submission on save button click
    saveButton.addEventListener('click', () => {
        form.dispatchEvent(new Event('submit')); // Trigger the form submission
    });
});
