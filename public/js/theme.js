// Always default to Light mode unless Explicitly set to Dark mode
if (localStorage.getItem("color-theme") === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}
