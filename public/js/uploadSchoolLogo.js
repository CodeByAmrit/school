document.getElementById("dropzone-file").addEventListener("change", function (event) {
    const fileInput = event.target;
    const container = fileInput.parentElement; // Parent element of the file input
    const file = fileInput.files[0];

    // Clear previously displayed image, if any
    const existingImage = container.querySelector("img");
    if (existingImage) {
        existingImage.remove();
    }

    if (file) {
        const validTypes = ["image/png", "image/jpg", "image/jpeg"];
        if (!validTypes.includes(file.type)) {
            alert("Invalid file type. Please upload a PNG, JPG, or JPEG file.");
            fileInput.value = ""; // Clear the file input
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.alt = "Selected Image";
            img.classList.add("max-h-64", "rounded-lg", "mt-4"); // Add Tailwind classes for styling

            // Hide the default content and append the image
            container.querySelector("div").style.display = "none"; // Hide default content
            container.appendChild(img);
        };

        reader.readAsDataURL(file);
    }
});
