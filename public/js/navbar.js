document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("user-menu");
  const button = document.getElementById("userMenuButton");

  if (!menu || !button) return;

  // Toggle dropdown
  button.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent document click
    menu.classList.toggle("hidden");

    const isOpen = !menu.classList.contains("hidden");
    button.setAttribute("aria-expanded", isOpen);
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !button.contains(e.target)) {
      menu.classList.add("hidden");
      button.setAttribute("aria-expanded", "false");
    }
  });

  // Keyboard accessibility
  button.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      menu.classList.toggle("hidden");
    }

    if (e.key === "Escape") {
      menu.classList.add("hidden");
      button.setAttribute("aria-expanded", "false");
    }
  });
});

// Add active state to current page
document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll("#logo-sidebar a[href]");

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (
      currentPath === linkPath ||
      (currentPath.startsWith(linkPath) && linkPath !== "/")
    ) {
      link.classList.add(
        "bg-gradient-to-r",
        "from-blue-50",
        "to-white",
        "text-blue-600",
        "shadow-sm",
      );
      link.classList.remove(
        "hover:bg-gradient-to-r",
        "hover:from-blue-50",
        "hover:to-white",
        "hover:text-blue-600",
      );

      // Show active indicator
      const indicator = link.querySelector(".absolute.left-0");
      if (indicator) {
        indicator.classList.remove("opacity-0");
        indicator.classList.add("opacity-100");
      }

      // Update icon background
      const iconContainer = link.querySelector(".w-10.h-10.rounded-xl");
      if (iconContainer) {
        iconContainer.classList.remove(
          "bg-gradient-to-br",
          "from-blue-100",
          "to-white",
        );
        iconContainer.classList.add(
          "bg-gradient-to-br",
          "from-blue-200",
          "to-blue-100",
        );
      }
    }
  });
});
