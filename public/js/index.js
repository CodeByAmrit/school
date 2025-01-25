window.addEventListener("scroll", function () {
    const navbar = document.getElementById("customNav");
    if (window.scrollY > 0) {
        navbar.classList.add("scrolledMenu");
    } else {
        navbar.classList.remove("scrolledMenu");
    }
});