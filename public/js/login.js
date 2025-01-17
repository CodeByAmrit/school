// Modal toggle script
document.querySelectorAll('[data-modal-toggle]').forEach(button => {
    button.addEventListener('click', () => {
        const modal = document.getElementById(button.getAttribute('data-modal-toggle'));
        modal.classList.remove('hidden');
    });
});

document.querySelectorAll('[data-modal-hide]').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.fixed');
        modal.classList.add('hidden');
    });
});