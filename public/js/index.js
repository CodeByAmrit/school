window.addEventListener("scroll", function () {
    const navbar = document.getElementById("customNav");
    if (window.scrollY > 0) {
        navbar.classList.add("scrolledMenu");
    } else {
        navbar.classList.remove("scrolledMenu");
    }
});


async function getTotalStudents() {
    try {
        const response = await fetch(`/total-students`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function updateStudentCount() {
    const total_data = await getTotalStudents();
    document.getElementById('student').innerText = total_data.total_students.toString() + '+ Students' ;
    document.getElementById('teacher').innerText = total_data.total_teachers.toString() + '+ Teachers' ;
}

updateStudentCount();
