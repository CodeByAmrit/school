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
        console.log("CLICKED")

        document.getElementById("button_").innerText = "Loading..."

        let data = {};

        // Collect form data
        data["name"] = document.getElementById("name").value;
        data["father_name"] = document.getElementById("father_name").value;
        data["mother_name"] = document.getElementById("mother_name").value;
        data["srn_no"] = document.getElementById("srn_no").value;
        data["pen_no"] = document.getElementById("pen_no").value;
        data["admission_no"] = document.getElementById("admission_no").value;
        data["roll_no"] = document.getElementById("roll_no").value;
        data["class"] = document.getElementById("class").value;
        data["session"] = document.getElementById("session").value;

        // Check if photo is selected
        const file = document.getElementById('dropzone-file').files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                data["photo"] = reader.result.split(',')[1]; // Get the base64 string part
                sendData();
            };
            reader.readAsDataURL(file); // Convert file to base64
        } else {
            // If no photo selected, proceed with the data
            sendData();
        }

        // Function to send data
        async function sendData() {
            try {
                const response = await fetch(`/update-student/${data.srn_no}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
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
                document.getElementById("button_").innerText = "Update Details"
            }
        }
    });

    saveButton.addEventListener("click", () => {
        form.dispatchEvent(new Event("submit")); // Trigger form submission
    });
});
