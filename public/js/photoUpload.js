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
        loadingIcon.classList.remove("hidden"); // Show the loading spinner
        console.log("CLICKED");

        document.getElementById("button_").innerText = "Loading...";

        let formData = new FormData();

        // Collect form data
        formData.append("name", document.getElementById("name").value);
        formData.append("father_name", document.getElementById("father_name").value);
        formData.append("mother_name", document.getElementById("mother_name").value);
        formData.append("srn_no", document.getElementById("srn_no").value);
        formData.append("pen_no", document.getElementById("pen_no").value);
        formData.append("admission_no", document.getElementById("admission_no").value);
        formData.append("roll_no", document.getElementById("roll_no").value);
        formData.append("class", document.getElementById("class").value);
        formData.append("session", document.getElementById("session").value);

        // Check if photo is selected and append it to FormData
        const file = document.getElementById('dropzone-file').files[0];
        if (file) {
            formData.append("photo", file); // Append file directly to FormData
        }

        // Send data to the server
        async function sendData() {
            try {
                const response = await fetch(`/update-student/${document.getElementById("srn_no").value}`, {
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
