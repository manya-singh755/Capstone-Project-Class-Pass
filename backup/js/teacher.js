/* ============================================
   CLASS-PASS — Teacher Portal JavaScript
   Report chips, emergency booking, issue form
   ============================================ */

// ---- Report Chip Toggle ----
document.querySelectorAll('.report-chip').forEach(chip => {
    chip.addEventListener('click', function () {
        document.querySelectorAll('.report-chip').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
    });
});

// ---- Emergency Booking ----
const availableRooms = [
    { room: '34-301', building: 'Block 34', floor: '3rd Floor', capacity: 60, equipment: 'Projector, Smart Board' },
    { room: '38-105', building: 'Block 38', floor: '1st Floor', capacity: 45, equipment: 'Projector, AC' },
    { room: '36-401', building: 'Block 36', floor: '4th Floor', capacity: 50, equipment: 'Smart Board, AC' },
    { room: '34-205', building: 'Block 34', floor: '2nd Floor', capacity: 40, equipment: 'Projector, Whiteboard' },
    { room: '38-201', building: 'Block 38', floor: '2nd Floor', capacity: 55, equipment: 'Projector, AC' },
    { room: 'UM-102', building: 'Uni Mall', floor: '1st Floor', capacity: 35, equipment: 'Whiteboard' }
];

// Update suggested room when preferences change
function updateSuggestion() {
    const prefBuilding = document.getElementById('prefBuilding').value;
    const prefCapacity = document.getElementById('prefCapacity').value;

    let matches = availableRooms;

    if (prefBuilding !== 'any') {
        matches = matches.filter(r => r.building === prefBuilding);
    }

    if (prefCapacity !== 'any') {
        const [min, max] = prefCapacity.split('-').map(Number);
        matches = matches.filter(r => {
            if (max) return r.capacity >= min && r.capacity <= max;
            return r.capacity >= min;
        });
    }

    const suggestedEl = document.getElementById('suggestedRoom');
    if (matches.length > 0) {
        const best = matches[0];
        suggestedEl.innerHTML = `
            <div class="room-icon"><i class="fas fa-star"></i></div>
            <div class="room-info">
                <h4>Suggested: Room ${best.room}</h4>
                <p>${best.building}, ${best.floor} · Capacity ${best.capacity} · ${best.equipment}</p>
            </div>`;
    } else {
        suggestedEl.innerHTML = `
            <div class="room-icon"><i class="fas fa-exclamation-circle"></i></div>
            <div class="room-info">
                <h4>No rooms match your criteria</h4>
                <p>Try changing the building or capacity filter</p>
            </div>`;
    }
}

// Bind preference change events
document.getElementById('prefBuilding').addEventListener('change', updateSuggestion);
document.getElementById('prefCapacity').addEventListener('change', updateSuggestion);

// ---- Book Classroom Button ----
document.getElementById('bookClassroomBtn').addEventListener('click', function () {
    const subject = document.getElementById('bookSubject').value.trim();
    if (!subject) {
        showToast('Please enter a subject or purpose.', 'fa-exclamation-circle');
        return;
    }
    showToast('Classroom booked successfully! 🎉', 'fa-check-circle');
});

// ---- Submit Issue Report ----
document.getElementById('submitReportBtn').addEventListener('click', function () {
    const selectedChip = document.querySelector('.report-chip.selected');
    const desc = document.getElementById('issueDescription').value.trim();

    if (!selectedChip) {
        showToast('Please select an issue type.', 'fa-exclamation-circle');
        return;
    }

    const issueType = selectedChip.textContent.trim();
    const room = document.getElementById('issueRoom').value;
    showToast(`Issue "${issueType}" reported for Room ${room}.`, 'fa-flag');

    // Reset form
    document.getElementById('issueDescription').value = '';
});
