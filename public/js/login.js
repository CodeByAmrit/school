document.getElementById('login-form').onsubmit = async function (e) {
    e.preventDefault();

    const email = this.email.value.trim();
    const password = this.password.value.trim();
    const loginBtn = this.querySelector('button[type="submit"]');

    // Hide previous errors
    document.getElementById('email-error').classList.add('hidden');
    document.getElementById('password-error').classList.add('hidden');
    document.getElementById('email').classList.remove('border-red-500');
    document.getElementById('password').classList.remove('border-red-500');

    // Disable button to prevent multiple requests
    loginBtn.disabled = true;

    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data.status === 'success') {
            window.location.href = '/dashboard';
        } else {
            if (data.status === 'Invalid Password') {
                document.getElementById('password-error').classList.remove('hidden');
                document.getElementById('password').classList.add('border-red-500');
            } else if (data.status === 'Invalid email') {
                document.getElementById('email-error').classList.remove('hidden');
                document.getElementById('email').classList.add('border-red-500');
            }
        }
    } catch (err) {
        alert("Network error. Please try again.");
    } finally {
        loginBtn.disabled = false; // Re-enable button
    }
};
