document
  .getElementById("dropzone-file")
  .addEventListener("change", function (event) {
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

document.addEventListener("DOMContentLoaded", function () {
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");
  const submitBtn = document.getElementById("submit-btn");
  const formSlider = document.getElementById("form-slider");
  const progressBar = document.getElementById("progress-bar");
  const currentStepSpan = document.getElementById("current-step");

  let currentStep = 1;

  nextBtn.addEventListener("click", () => {
    if (currentStep === 1) {
      // Slide to step 2
      formSlider.style.transform = "translateX(-50%)";
      progressBar.style.width = "100%";
      currentStepSpan.textContent = "2";

      // Update buttons
      prevBtn.classList.remove("hidden");
      prevBtn.classList.add("w-1/2");
      nextBtn.classList.add("hidden");
      submitBtn.classList.remove("hidden");
      submitBtn.classList.add("w-1/2");

      currentStep = 2;
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentStep === 2) {
      // Slide back to step 1
      formSlider.style.transform = "translateX(0%)";
      progressBar.style.width = "50%";
      currentStepSpan.textContent = "1";

      // Update buttons
      prevBtn.classList.add("hidden");
      nextBtn.classList.remove("hidden");
      nextBtn.classList.add("w-full");
      submitBtn.classList.add("hidden");

      currentStep = 1;
    }
  });
});
