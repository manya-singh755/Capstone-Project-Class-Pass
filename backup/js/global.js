/* ============================================
   CLASS-PASS — Global JavaScript
   Live clock, sidebar navigation, utilities
   ============================================ */

// ---- Live Clock ----
function updateTime() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const el = document.getElementById('liveTime');
    if (el) el.textContent = `${h12}:${m} ${ampm}`;
}
setInterval(updateTime, 1000);
updateTime();

// ---- Sidebar Navigation ----
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function () {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// ---- Toast Notification ----
function showToast(message, icon = 'fa-check-circle') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${icon}"></i>${message}`;
    document.body.appendChild(toast);

    // Trigger show
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---- Utility: Format Time ----
function formatTime(hours, minutes) {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
    return `${h12}:${m} ${ampm}`;
}
