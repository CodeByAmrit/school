document.addEventListener("DOMContentLoaded", function () {
  // Handle "View" button clicks
  const viewButtons = document.querySelectorAll(".view-file-btn");
  viewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const fileUrl = button.getAttribute("data-file-url");
      const fileType = button.getAttribute("data-file-type"); // Get file type based on extension
      openModal(fileUrl, fileType);
    });
  });

  // Close the modal when the close button is clicked
  const closeModalBtn = document.querySelector(
    '[data-modal-hide="default-modal"]',
  );
  closeModalBtn.addEventListener("click", closeModal);
});

// Function to get file type based on file extension
function getFileType(fileUrl) {
  const extension = fileUrl.split(".").pop().toLowerCase();
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp"];
  const videoExtensions = ["mp4", "webm", "ogg"];
  const pdfExtensions = ["pdf"];

  if (imageExtensions.includes(extension)) {
    return "image";
  } else if (videoExtensions.includes(extension)) {
    return "video";
  } else if (pdfExtensions.includes(extension)) {
    return "pdf";
  } else {
    return "unknown"; // Default for unsupported file types
  }
}

function openModal(fileUrl, fileType) {
  const modal = document.getElementById("default-modal");
  const fileContainer = document.getElementById("fileContainer"); // New container for different file types
  fileContainer.innerHTML = ""; // Clear previous content

  if (fileType.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = fileUrl;
    img.classList.add("max-w-full", "max-h-full"); // Ensure the image fits within the modal
    fileContainer.appendChild(img);
  } else if (fileType.startsWith("video/")) {
    const video = document.createElement("video");
    video.src = fileUrl;
    video.controls = true;
    video.classList.add("max-w-full", "max-h-full"); // Ensure the video fits within the modal
    fileContainer.appendChild(video);
  } else if (fileType === "application/pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = fileUrl;
    iframe.classList.add("w-full", "h-full");
    iframe.onload = function () {
      console.log("PDF loaded successfully");
    };
    iframe.onerror = function () {
      console.log("Error loading PDF");
    };
    fileContainer.appendChild(iframe);
  } else {
    fileContainer.innerHTML = "<p>Unsupported file type</p>";
  }

  // Show the modal
  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("default-modal");
  const fileContainer = document.getElementById("fileContainer");
  fileContainer.innerHTML = ""; // Clear the content when the modal is closed
  modal.classList.add("hidden"); // Hide the modal
}
