/* ============================================
   CLASS-PASS — Student Portal JavaScript
   Uses SensorAPI for data-driven rendering
   ============================================ */

// ---- DOM References ----
const gridEl = document.getElementById('classroomGrid');
const buildingFilter = document.getElementById('filterBuilding');
const floorFilter = document.getElementById('filterFloor');
const capacityFilter = document.getElementById('filterCapacity');
const searchInput = document.getElementById('searchRoom');

// ---- Render Stats ----
function updateStats(classrooms) {
    const total = classrooms.length;
    const available = classrooms.filter(c => c.status === 'available').length;
    const occupied = classrooms.filter(c => c.status === 'occupied').length;
    const reserved = classrooms.filter(c => c.status === 'reserved').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statAvailable').textContent = available;
    document.getElementById('statOccupied').textContent = occupied;
    document.getElementById('statReserved').textContent = reserved;

    // Update badge
    const badge = document.getElementById('availBadge');
    if (badge) badge.textContent = available;
}

// ---- Render Classroom Cards ----
function renderClassrooms() {
    // TODO: Replace with → const classrooms = await fetch('/api/classrooms').then(r => r.json())
    const classrooms = SensorAPI.getClassrooms();

    updateStats(classrooms);

    // Apply filters
    const building = buildingFilter.value;
    const floor = floorFilter.value;
    const capacity = capacityFilter.value;
    const search = searchInput.value.toLowerCase().trim();

    const filtered = classrooms.filter(c => {
        if (building !== 'all' && c.building !== building) return false;
        if (floor !== 'all' && c.floor !== floor) return false;
        if (capacity !== 'all') {
            const [min, max] = capacity.split('-').map(Number);
            if (max) {
                if (c.capacity < min || c.capacity > max) return false;
            } else {
                if (c.capacity < min) return false;
            }
        }
        if (search && !c.room.toLowerCase().includes(search)) return false;
        return true;
    });

    if (filtered.length === 0) {
        gridEl.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No classrooms found</h3>
                <p>Try adjusting your filters or search query.</p>
            </div>`;
        return;
    }

    gridEl.innerHTML = filtered.map(c => {
        const statusLabel = c.status.charAt(0).toUpperCase() + c.status.slice(1);
        const btnHTML = c.status === 'available'
            ? `<button class="book-btn primary" onclick="bookRoom('${c.room}')">Book</button>`
            : `<button class="book-btn disabled" disabled>${c.status === 'occupied' ? 'In Use' : 'Reserved'}</button>`;

        const detailLine3 = c.teacher
            ? `<div class="card-detail"><i class="fas fa-chalkboard-teacher"></i>${c.currentActivity} — ${c.teacher}</div>`
            : `<div class="card-detail"><i class="fas fa-tv"></i>${c.equipment}</div>`;

        // Sensor status indicators
        const boardDot = c.sensors.board.motionDetected ? 'active' : 'idle';
        const projDot = c.sensors.projector.motionDetected ? 'active' : 'idle';

        return `
        <div class="classroom-card ${c.status}">
            <div class="card-header">
                <span class="room-number">${c.room}</span>
                <span class="status-badge ${c.status}">${statusLabel}</span>
            </div>
            <div class="card-details">
                <div class="card-detail"><i class="fas fa-building"></i>${c.building} · ${c.floor}</div>
                <div class="card-detail"><i class="fas fa-users"></i>Capacity: ${c.capacity}</div>
                ${detailLine3}
            </div>
            <div class="sensor-indicators">
                <span class="sensor-ind" title="Board sensor: ${c.sensors.board.motionDetected ? 'Motion detected' : 'No motion'}">
                    <span class="sdot ${boardDot}"></span>Board
                </span>
                <span class="sensor-ind" title="Projector sensor: ${c.sensors.projector.motionDetected ? 'Motion detected' : 'No motion'}">
                    <span class="sdot ${projDot}"></span>Proj
                </span>
                <span class="sensor-update">Updated just now</span>
            </div>
            <div class="card-footer">
                <span class="time-info"><i class="fas fa-clock"></i>${c.freeInfo}</span>
                ${btnHTML}
            </div>
        </div>`;
    }).join('');
}

// ---- Book a Room ----
function bookRoom(roomNumber) {
    const user = SensorAPI.getLoggedInUser();
    const userId = user ? user.uid : 'GUEST';

    // TODO: Replace with → fetch('/api/bookings', { method: 'POST', body: {...} })
    const result = SensorAPI.bookRoom(roomNumber, userId, 'Study Session', '1 Hour');
    if (result.success) {
        showToast(`Room ${roomNumber} booked successfully!`, 'fa-check-circle');
    }
}

// ---- Update User Info in Sidebar ----
function updateUserInfo() {
    const user = SensorAPI.getLoggedInUser();
    if (user) {
        const avatarEl = document.querySelector('.user-avatar');
        const nameEl = document.querySelector('.user-info h4');
        const roleEl = document.querySelector('.user-info p');
        if (avatarEl) avatarEl.textContent = user.avatar || user.name.charAt(0);
        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = user.program ? `${user.program} — ${user.year}` : user.department;
    }
}

// ---- Event Listeners ----
buildingFilter.addEventListener('change', renderClassrooms);
floorFilter.addEventListener('change', renderClassrooms);
capacityFilter.addEventListener('change', renderClassrooms);
searchInput.addEventListener('input', renderClassrooms);

// ---- Initial Render ----
updateUserInfo();
renderClassrooms();

// ---- Auto-refresh sensor data every 5 seconds ----
setInterval(renderClassrooms, 5000);
