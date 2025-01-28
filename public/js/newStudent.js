document.getElementById('dropzone-file').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const previewImage = document.getElementById('image-preview');

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

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("student_form");
    const saveButton = form.querySelector("button[type='button']");
    const loadingIcon = saveButton.querySelector("svg");

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent default form submission
        saveButton.disabled = true; // Disable the button
        loadingIcon.classList.remove("hidden");

        document.getElementById("button_").innerText = "Loading...";

        let formData = new FormData();

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
        formData.append('gender', document.getElementById('gender').value.toUpperCase());


        // Check if photo is selected and append it to FormData
        const file = document.getElementById('dropzone-file').files[0];
        if (file) {
            formData.append("photo", file); // Append file directly to FormData
        }

        let school_id = null;
        school_id = document.getElementById("school_id").value;

        // Send data to the server
        async function sendData() {
            try {
                const response = await fetch(`/update-student/new`, {
                    method: 'POST',
                    body: formData, // Send FormData as the request body
                });

                const result = await response.json();

                if (result !== null) {
                    alert("Data submitted successfully!");
                    window.location.reload();
                } else {
                    alert("Error: " + result.message);
                }
            } catch (error) {
                alert("An error occurred: " + error.message);
            } finally {
                saveButton.disabled = false; // Enable the button
                loadingIcon.classList.add("hidden"); // Hide the loading spinner
                document.getElementById("button_").innerText = "Update Details";
            }
        }

        sendData();
    });

    saveButton.addEventListener("click", () => {
        form.dispatchEvent(new Event("submit")); // Trigger form submission
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const checkbox = document.getElementById("link-checkbox");
    const correspondingAddress = document.getElementById("corresponding_address");
    const permanentAddress = document.getElementById("permanent_address");

    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            // Copy the corresponding address to the permanent address
            permanentAddress.value = correspondingAddress.value;
            // Disable the permanent address input
            permanentAddress.setAttribute("disabled", "true");
        } else {
            // Enable the permanent address input
            permanentAddress.removeAttribute("disabled");
            // Clear the permanent address input (optional)
            permanentAddress.value = "";
        }
    });

    // Optional: Update permanent address when corresponding address changes and checkbox is checked
    correspondingAddress.addEventListener("input", () => {
        if (checkbox.checked) {
            permanentAddress.value = correspondingAddress.value;
        }
    });
});

