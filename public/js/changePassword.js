document.getElementById("change-password-form").onsubmit = async function (e) {
    e.preventDefault();

    const currentPassword = this.currentPassword.value.trim();
    const newPassword = this.newPassword.value.trim();
    const confirmPassword = this.confirmPassword.value.trim();

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
    }

    try {
        const res = await fetch("/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await res.json();

        if (data.status === "success") {
            alert("Password changed successfully!");
            window.location.href = "/dashboard";
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert("An error occurred. Please try again.");
    }
};
