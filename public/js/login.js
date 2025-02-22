document.getElementById('login-form').onsubmit = async function (e) {
    e.preventDefault();

    const email = this.email.value.trim();
    const password = this.password.value.trim();
    const loginBtn = this.querySelector('button[type="submit"]');

    // Show spinner loading button
    document.getElementById("login_spinner").classList.remove("hidden");

    try {
        // Get reCAPTCHA token
        const captchaToken = await new Promise((resolve, reject) => {
            grecaptcha.enterprise.ready(async () => {
                try {
                    const token = await grecaptcha.enterprise.execute('6LfB29QqAAAAAHo2JKtWWZx24MoRn75EMb0NKg3s', { action: 'LOGIN' });
                    resolve(token);
                } catch (error) {
                    reject(error);
                }
            });
        });

        if (!captchaToken) {
            throw new Error("CAPTCHA token not generated");
        }

        // Hide previous errors
        document.getElementById('email-error').classList.add('hidden');
        document.getElementById('password-error').classList.add('hidden');
        document.getElementById('email').classList.remove('border-red-500');
        document.getElementById('password').classList.remove('border-red-500');

        // Disable button to prevent multiple requests
        loginBtn.disabled = true;

        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, captcha: captchaToken }), // Include captcha token
        });

        const data = await res.json();

        if (data.status === 'success') {
            window.location.href = '/dashboard';
        } else {
            document.getElementById("login_spinner").classList.add("hidden");

            if (data.status === 'Invalid Password') {
                document.getElementById('password-error').classList.remove('hidden');
                document.getElementById('password').classList.add('border-red-500');
            } else if (data.status === 'Invalid email') {
                document.getElementById('email-error').classList.remove('hidden');
                document.getElementById('email').classList.add('border-red-500');
            } else if (data.status === 'captcha_failed') {
                alert("CAPTCHA verification failed. Please try again.");
            }
        }
    } catch (err) {
        console.error("Error in login process:", err);
        alert("Network error or CAPTCHA issue. Please try again.");
    } finally {
        loginBtn.disabled = false; // Re-enable button
    }
};
