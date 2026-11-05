// Volunteer Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize volunteer registration
    initVolunteerRegistration();
    
    // Initialize volunteer management (admin side)
    if (window.location.pathname.includes('admin-dashboard.html')) {
        initVolunteerManagement();
    }
});

// Volunteer Registration
function initVolunteerRegistration() {
    const registrationForm = document.getElementById('volunteerRegistrationForm');
    
    if (!registrationForm) return;
    
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm('volunteerRegistrationForm')) {
            showAlert('Please fill in all required fields.', 'danger');
            return;
        }
        
        // Get form data
        const formData = {
            fullName: document.getElementById('volunteerName').value.trim(),
            age: parseInt(document.getElementById('volunteerAge').value),
            gender: document.getElementById('volunteerGender').value,
            phone: document.getElementById('volunteerPhone').value.trim(),
            email: document.getElementById('volunteerEmail').value.trim(),
            address: document.getElementById('volunteerAddress').value.trim(),
            occupation: document.getElementById('volunteerOccupation').value.trim(),
            education: document.getElementById('volunteerEducation').value.trim(),
            skills: document.getElementById('volunteerSkills').value.trim(),
            preferredArea: document.getElementById('preferredArea').value,
            availability: document.getElementById('volunteerAvailability').value,
            previousExperience: document.getElementById('previousExperience').value.trim(),
            emergencyContact: document.getElementById('volunteerEmergencyContact').value.trim(),
            registrationDate: new Date().toISOString(),
            status: 'Pending',
            assignedTask: null,
            assignedArea: null,
            checkedIn: false,
            checkedInTime: null
        };
        
        // Validate phone number
        if (!/^[0-9]{10,15}$/.test(formData.phone)) {
            showAlert('Please enter a valid phone number (10-15 digits).', 'danger');
            return;
        }
        
        // Validate email if provided
        if (formData.email && !validateEmail(formData.email)) {
            showAlert('Please enter a valid email address.', 'danger');
            return;
        }
        
        // Submit button loading state
        const submitBtn = registrationForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        showLoading(submitBtn);
        
        try {
            // Save to Firebase
            const docRef = await db.collection('volunteers').add(formData);
            
            // Show success message
            showAlert(`Volunteer registration submitted successfully! We will contact you soon.`, 'success');
            
            // Reset form
            registrationForm.reset();
            
            // Show confirmation
            showVolunteerConfirmation(formData);
            
        } catch (error) {
            console.error('Error registering volunteer:', error);
            showAlert('Registration failed. Please try again.', 'danger');
        } finally {
            hideLoading(submitBtn, originalBtnText);
        }
    });
}

// Show Volunteer Confirmation
function showVolunteerConfirmation(volunteerData) {
    const confirmationSection = document.getElementById('volunteerConfirmationSection');
    if (!confirmationSection) return;
    
    confirmationSection.style.display = 'block';
    confirmationSection.classList.add('animate-fade-in');
    
    document.getElementById('confirmationVolunteerName').textContent = volunteerData.fullName;
    document.getElementById('confirmationVolunteerPhone').textContent = formatPhoneNumber(volunteerData.phone);
    document.getElementById('confirmationVolunteerArea').textContent = volunteerData.preferredArea;
    document.getElementById('confirmationVolunteerStatus').textContent = volunteerData.status;
    
    // Scroll to confirmation
    confirmationSection.scrollIntoView({ behavior: 'smooth' });
}

// Volunteer Management (Admin Side)
async function initVolunteerManagement() {
    // Load volunteers table
    await loadVolunteersTable();
    
    // Initialize volunteer actions
    initVolunteerActions();
}

// Load Volunteers Table
async function loadVolunteersTable() {
    const tableBody = document.getElementById('volunteersTableBody');
    if (!tableBody) return;
    
    try {
        const snapshot = await db.collection('volunteers')
            .orderBy('registrationDate', 'desc')
            .limit(100)
            .get();
        
        tableBody.innerHTML = '';
        
        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No volunteers found</td>
                </tr>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const volunteer = doc.data();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${volunteer.fullName}</td>
                <td>${volunteer.age}</td>
                <td>${volunteer.gender}</td>
                <td>${formatPhoneNumber(volunteer.phone)}</td>
                <td>${volunteer.preferredArea}</td>
                <td>
                    <span class="status-badge ${volunteer.checkedIn ? 'status-completed' : 'status-waiting'}">
                        ${volunteer.checkedIn ? 'Checked In' : 'Not Checked In'}
                    </span>
                </td>
                <td>${volunteer.assignedTask || 'Not Assigned'}</td>
                <td>
                    <button class="btn-action view-volunteer" data-id="${doc.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action assign-task" data-id="${doc.id}">
                        <i class="fas fa-tasks"></i>
                    </button>
                    <button class="btn-action check-in" data-id="${doc.id}">
                        <i class="fas fa-user-check"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        addVolunteerActionListeners();
        
    } catch (error) {
        console.error('Error loading volunteers:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center error">Error loading volunteers</td>
            </tr>
        `;
    }
}

// Add Volunteer Action Listeners
function addVolunteerActionListeners() {
    // View volunteer details
    document.querySelectorAll('.view-volunteer').forEach(btn => {
        btn.addEventListener('click', function() {
            const volunteerId = this.getAttribute('data-id');
            viewVolunteerDetails(volunteerId);
        });
    });
    
    // Assign task
    document.querySelectorAll('.assign-task').forEach(btn => {
        btn.addEventListener('click', function() {
            const volunteerId = this.getAttribute('data-id');
            assignVolunteerTask(volunteerId);
        });
    });
    
    // Check in/out
    document.querySelectorAll('.check-in').forEach(btn => {
        btn.addEventListener('click', function() {
            const volunteerId = this.getAttribute('data-id');
            toggleVolunteerCheckIn(volunteerId);
        });
    });
}

// View Volunteer Details
async function viewVolunteerDetails(volunteerId) {
    try {
        const doc = await db.collection('volunteers').doc(volunteerId).get();
        
        if (!doc.exists) {
            showAlert('Volunteer not found', 'danger');
            return;
        }
        
        const volunteer = doc.data();
        
        // Create modal with volunteer details
        const modalContent = `
            <div class="modal-header">
                <h3>Volunteer Details</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="volunteer-details-grid">
                    <div class="detail-group">
                        <h4>Personal Information</h4>
                        <p><strong>Full Name:</strong> ${volunteer.fullName}</p>
                        <p><strong>Age:</strong> ${volunteer.age} | <strong>Gender:</strong> ${volunteer.gender}</p>
                        <p><strong>Phone:</strong> ${formatPhoneNumber(volunteer.phone)}</p>
                        <p><strong>Email:</strong> ${volunteer.email || 'N/A'}</p>
                        <p><strong>Address:</strong> ${volunteer.address}</p>
                        <p><strong>Emergency Contact:</strong> ${formatPhoneNumber(volunteer.emergencyContact) || 'N/A'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Background Information</h4>
                        <p><strong>Occupation:</strong> ${volunteer.occupation || 'N/A'}</p>
                        <p><strong>Education:</strong> ${volunteer.education || 'N/A'}</p>
                        <p><strong>Skills:</strong> ${volunteer.skills || 'N/A'}</p>
                        <p><strong>Previous Experience:</strong> ${volunteer.previousExperience || 'No previous experience'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Camp Information</h4>
                        <p><strong>Registration Date:</strong> ${formatFirestoreTimestamp(volunteer.registrationDate)}</p>
                        <p><strong>Preferred Area:</strong> ${volunteer.preferredArea}</p>
                        <p><strong>Availability:</strong> ${volunteer.availability}</p>
                        <p><strong>Status:</strong> ${volunteer.status}</p>
                        <p><strong>Assigned Task:</strong> ${volunteer.assignedTask || 'Not assigned'}</p>
                        <p><strong>Assigned Area:</strong> ${volunteer.assignedArea || 'Not assigned'}</p>
                        <p><strong>Checked In:</strong> ${volunteer.checkedIn ? 'Yes' : 'No'}</p>
                        ${volunteer.checkedInTime ? `<p><strong>Checked In Time:</strong> ${formatFirestoreTimestamp(volunteer.checkedInTime)}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
            </div>
        `;
        
        showModal(modalContent);
        
        // Add event listener
        document.querySelector('.close-modal').addEventListener('click', closeModal);
        
    } catch (error) {
        console.error('Error viewing volunteer details:', error);
        showAlert('Error loading volunteer details', 'danger');
    }
}

// Assign Volunteer Task
async function assignVolunteerTask(volunteerId) {
    try {
        const doc = await db.collection('volunteers').doc(volunteerId).get();
        
        if (!doc.exists) {
            showAlert('Volunteer not found', 'danger');
            return;
        }
        
        const volunteer = doc.data();
        
        // Create modal with task assignment form
        const modalContent = `
            <div class="modal-header">
                <h3>Assign Task to ${volunteer.fullName}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="taskSelect" class="form-label">Select Task:</label>
                    <select id="taskSelect" class="form-control">
                        <option value="">-- Select a task --</option>
                        <option value="registration">Registration Desk</option>
                        <option value="crowd_control">Crowd Control</option>
                        <option value="medicine_distribution">Medicine Distribution</option>
                        <option value="patient_guidance">Patient Guidance</option>
                        <option value="food_water">Food & Water Distribution</option>
                        <option value="cleanup">Cleanup Crew</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="areaSelect" class="form-label">Assign Area:</label>
                    <select id="areaSelect" class="form-control">
                        <option value="">-- Select an area --</option>
                        <option value="entrance">Entrance/Reception</option>
                        <option value="waiting_area">Waiting Area</option>
                        <option value="consultation">Consultation Area</option>
                        <option value="pharmacy">Pharmacy</option>
                        <option value="emergency">Emergency Area</option>
                        <option value="parking">Parking Area</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="taskDescription" class="form-label">Additional Instructions:</label>
                    <textarea id="taskDescription" class="form-control" rows="3" placeholder="Enter task details..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <button class="btn btn-primary assign-task-btn">Assign Task</button>
            </div>
        `;
        
        showModal(modalContent);
        
        // Add event listeners
        document.querySelector('.close-modal').addEventListener('click', closeModal);
        document.querySelector('.assign-task-btn').addEventListener('click', async () => {
            const task = document.getElementById('taskSelect').value;
            const area = document.getElementById('areaSelect').value;
            const description = document.getElementById('taskDescription').value.trim();
            
            if (!task || !area) {
                showAlert('Please select both task and area', 'warning');
                return;
            }
            
            try {
                await db.collection('volunteers').doc(volunteerId).update({
                    assignedTask: task,
                    assignedArea: area,
                    taskDescription: description,
                    status: 'Assigned'
                });
                
                showAlert('Task assigned successfully', 'success');
                closeModal();
                loadVolunteersTable();
                
            } catch (error) {
                console.error('Error assigning task:', error);
                showAlert('Error assigning task', 'danger');
            }
        });
        
    } catch (error) {
        console.error('Error in assignVolunteerTask:', error);
        showAlert('Error loading volunteer data', 'danger');
    }
}

// Toggle Volunteer Check In/Out
async function toggleVolunteerCheckIn(volunteerId) {
    try {
        const volunteerRef = db.collection('volunteers').doc(volunteerId);
        const volunteerDoc = await volunteerRef.get();
        
        if (!volunteerDoc.exists) {
            showAlert('Volunteer not found', 'danger');
            return;
        }
        
        const volunteer = volunteerDoc.data();
        const now = new Date();
        
        if (volunteer.checkedIn) {
            // Check out volunteer
            await volunteerRef.update({
                checkedIn: false,
                checkedOutTime: now
            });
            
            showAlert('Volunteer checked out successfully', 'success');
        } else {
            // Check in volunteer
            await volunteerRef.update({
                checkedIn: true,
                checkedInTime: now,
                status: 'Active'
            });
            
            showAlert('Volunteer checked in successfully', 'success');
        }
        
        // Update table
        loadVolunteersTable();
        
    } catch (error) {
        console.error('Error toggling check-in:', error);
        showAlert('Error updating check-in status', 'danger');
    }
}

// Initialize Volunteer Actions
function initVolunteerActions() {
    // This function is called from admin.js
}

// Export functions for use in other files
window.volunteerUtils = {
    initVolunteerRegistration,
    loadVolunteersTable,
    viewVolunteerDetails,
    assignVolunteerTask,
    toggleVolunteerCheckIn
};