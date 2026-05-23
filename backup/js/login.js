/* ============================================
   CLASS-PASS — Login Page JavaScript
   Role switching, authentication, sensor anim
   ============================================ */

let currentRole = 'student';

// ---- Role Tab Switching ----
function switchLoginRole(role, btn) {
    currentRole = role;
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    const uidLabel = document.getElementById('uidLabel');
    const uidInput = document.getElementById('loginUID');

    if (role === 'student') {
        uidLabel.textContent = 'Registration Number';
        uidInput.placeholder = 'e.g. 12312345';
    } else if (role === 'teacher') {
        uidLabel.textContent = 'Employee ID';
        uidInput.placeholder = 'e.g. T001';
    } else {
        uidLabel.textContent = 'Admin ID';
        uidInput.placeholder = 'e.g. A001';
    }

    // Clear error
    document.getElementById('loginError').classList.remove('show');
}

// ---- Toggle Password Visibility ----
function togglePassword() {
    const input = document.getElementById('loginPassword');
    const icon = document.getElementById('eyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ---- Handle Login ----
function handleLogin(e) {
    e.preventDefault();
    const uid = document.getElementById('loginUID').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    // Show loading
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    // Simulate network delay
    setTimeout(() => {
        // TODO: Replace with → fetch('/api/auth/login', { method: 'POST', body: { uid, password, role } })
        const result = SensorAPI.login(currentRole, uid, password);

        if (result.success) {
            // Redirect based on role
            if (currentRole === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (currentRole === 'teacher') {
                window.location.href = 'teacher-dashboard.html';
            } else {
                window.location.href = 'admin-dashboard.html';
            }
        } else {
            // Show error
            const errorEl = document.getElementById('loginError');
            const errorText = document.getElementById('loginErrorText');
            errorText.textContent = 'Invalid credentials. Check your ID and password.';
            errorEl.classList.add('show');

            btn.classList.remove('loading');
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }, 800);
}

// ---- Demo Quick Login ----
function demoLogin(role) {
    // TODO: Replace with proper demo token authentication
    const demoCredentials = {
        student: { uid: '12312345', password: 'surya123' },
        teacher: { uid: 'T001', password: 'teacher123' },
        admin: { uid: 'A001', password: 'admin123' }
    };

    const cred = demoCredentials[role];
    const result = SensorAPI.login(role, cred.uid, cred.password);

    if (result.success) {
        if (role === 'student') window.location.href = 'student-dashboard.html';
        else if (role === 'teacher') window.location.href = 'teacher-dashboard.html';
        else window.location.href = 'admin-dashboard.html';
    }
}

// ---- Sensor Animation on Login Page ----
function animateSensors() {
    const sensors = [
        { dot: 'sensor1', val: 'sensor1val', type: 'board' },
        { dot: 'sensor2', val: 'sensor2val', type: 'projector' },
        { dot: 'sensor3', val: 'sensor3val', type: 'board' },
        { dot: 'sensor4', val: 'sensor4val', type: 'projector' },
        { dot: 'sensor5', val: 'sensor5val', type: 'board' },
    ];

    sensors.forEach(s => {
        const dotEl = document.getElementById(s.dot);
        const valEl = document.getElementById(s.val);
        if (!dotEl || !valEl) return;

        // Randomly update sensor states
        const rand = Math.random();
        if (rand > 0.7) {
            dotEl.className = 'sensor-dot active';
            valEl.textContent = s.type === 'board' ? 'Writing detected' : 'Projection active';
        } else if (rand > 0.3) {
            dotEl.className = 'sensor-dot idle';
            const mins = Math.floor(5 + Math.random() * 50);
            valEl.textContent = `No motion (${mins}m)`;
        } else if (rand > 0.1) {
            dotEl.className = 'sensor-dot active';
            valEl.textContent = 'Motion detected';
        } else {
            dotEl.className = 'sensor-dot alert';
            valEl.textContent = '⚠ Check sensor';
        }
    });
}

// Run sensor animation every 3 seconds
setInterval(animateSensors, 3000);

// ---- Check if already logged in ----
(function () {
    const user = SensorAPI.getLoggedInUser();
    if (user) {
        if (user.role === 'student') window.location.href = 'student-dashboard.html';
        else if (user.role === 'teacher') window.location.href = 'teacher-dashboard.html';
        else window.location.href = 'admin-dashboard.html';
    }
})();
