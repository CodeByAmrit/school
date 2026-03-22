// Universal Theme Toggle Handler
document.addEventListener("DOMContentLoaded", function () {
  const themeToggleBtns = document.querySelectorAll("#theme-toggle");

  themeToggleBtns.forEach((btn) => {
    // Initial icon state
    const darkIcon = btn.querySelector("#theme-toggle-dark-icon");
    const lightIcon = btn.querySelector("#theme-toggle-light-icon");

    if (darkIcon && lightIcon) {
      if (
        localStorage.getItem("color-theme") === "dark" ||
        (!("color-theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        lightIcon.classList.remove("hidden");
        darkIcon.classList.add("hidden");
      } else {
        darkIcon.classList.remove("hidden");
        lightIcon.classList.add("hidden");
      }
    }

    btn.addEventListener("click", function () {
      // Toggle local storage and document class
      if (localStorage.getItem("color-theme")) {
        if (localStorage.getItem("color-theme") === "light") {
          document.documentElement.classList.add("dark");
          localStorage.setItem("color-theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("color-theme", "light");
        }
      } else {
        if (document.documentElement.classList.contains("dark")) {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("color-theme", "light");
        } else {
          document.documentElement.classList.add("dark");
          localStorage.setItem("color-theme", "dark");
        }
      }

      // Toggle icons for this button and all other buttons to stay in sync
      document.querySelectorAll("#theme-toggle").forEach((syncBtn) => {
        const dIcon = syncBtn.querySelector("#theme-toggle-dark-icon");
        const lIcon = syncBtn.querySelector("#theme-toggle-light-icon");
        if (dIcon && lIcon) {
          dIcon.classList.toggle("hidden");
          lIcon.classList.toggle("hidden");
        }
      });
    });
  });
});
