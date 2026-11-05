// Doctor Assistant Portal - Complete Firebase Implementation
document.addEventListener('DOMContentLoaded', function () {
    console.log('Doctor Assistant Portal Initializing...');

    // Check authentication status
    checkDoctorAuth();

    // Initialize event listeners
    initEventListeners();

    // Add sidebar toggle button
    addSidebarToggleButton();
});

// Global variables
let currentDoctorId = null;
let currentDoctorData = null;
let realtimeListeners = [];

// Function to add toggle button in sidebar header
function addSidebarToggleButton() {
    const sidebarHeader = document.querySelector('.sidebar-header');

    // Check if button already exists
    if (document.querySelector('.sidebar-toggle-btn')) {
        return;
    }

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle-btn';
    toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    toggleBtn.title = 'Toggle Sidebar';

    // Add click event
    toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent event bubbling

        const sidebar = document.getElementById('sidebar');
        const isActive = sidebar.classList.contains('collapsed');

        if (isActive) {
            // Expand sidebar
            sidebar.classList.remove('collapsed');
            document.querySelector('.main-content').classList.remove('sidebar-collapsed');
            this.innerHTML = '<i class="fas fa-chevron-left"></i>';
            this.title = 'Collapse Sidebar';
        } else {
            // Collapse sidebar
            sidebar.classList.add('collapsed');
            document.querySelector('.main-content').classList.add('sidebar-collapsed');
            this.innerHTML = '<i class="fas fa-chevron-right"></i>';
            this.title = 'Expand Sidebar';
        }
    });

    // Append button to sidebar header
    sidebarHeader.appendChild(toggleBtn);

    // Add styles for collapsed state
    const style = document.createElement('style');
    style.textContent = `
        .sidebar-toggle-btn {
            position: absolute;
            top: 20px;
            right: 10px;
            background: rgba(109, 20, 84, 0.2);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 1001;
        }
        
        .sidebar-toggle-btn:hover {
            background: rgba(255, 0, 0, 0.3);
            transform: scale(1.1);
        }
        
        .sidebar.collapsed {
            width: 70px !important;
        }
        
        .sidebar.collapsed .sidebar-header {
            padding: 20px 10px !important;
            justify-content: center;
        }
        
        .sidebar.collapsed .sidebar-user,
        .sidebar.collapsed .nav-text,
        .sidebar.collapsed .nav-badge,
        .sidebar.collapsed .sidebar-footer span {
            display: none !important;
        }
        
        .sidebar.collapsed .sidebar-avatar {
            width: 40px !important;
            height: 40px !important;
            font-size: 1rem !important;
            margin: 0 auto !important;
        }
        
        .sidebar.collapsed .nav-link {
            padding: 15px !important;
            justify-content: center;
        }
        
        .sidebar.collapsed .nav-icon {
            margin: 0 !important;
            font-size: 22px !important;
        }
        
        .sidebar.collapsed .sidebar-footer button {
            justify-content: center;
            padding: 10px !important;
        }
        
        .sidebar.collapsed .sidebar-footer button span {
            display: none;
        }
        
        .sidebar.collapsed .sidebar-toggle-btn {
            position: relative;
            top: 0;
            right: 0;
            margin-top: 10px;
        }
        
        .main-content.sidebar-collapsed {
            margin-left: 70px !important;
        }
        
        @media (max-width: 992px) {
            .sidebar-toggle-btn {
                display: none;
            }
        }
    `;

    document.head.appendChild(style);
}

// Check Doctor Authentication
function checkDoctorAuth() {
    // Check if user is logged in via localStorage
    const doctorAuth = localStorage.getItem('doctorAuth');

    if (doctorAuth) {
        try {
            const authData = JSON.parse(doctorAuth);
            currentDoctorId = authData.uid;
            currentDoctorData = authData;

            // Show doctor portal
            showDoctorPortal(authData);

            // Load doctor data from Firestore
            loadDoctorData(authData.uid);

        } catch (error) {
            console.error('Error parsing auth data:', error);
            showLoginPage();
        }
    } else if (typeof auth !== 'undefined') {
        // Check Firebase auth
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is logged in via Firebase
                currentDoctorId = user.uid;
                loadDoctorData(user.uid);
            } else {
                // No user, show login page
                showLoginPage();
            }
        });
    } else {
        console.error('Firebase auth not available');
        showLoginPage();
    }
}

// Load Doctor Data from Firestore
async function loadDoctorData(doctorId) {
    try {
        if (!doctorId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const docRef = await db.collection('doctors').doc(doctorId).get();

        if (!docRef.exists) {
            showAlert('Doctor profile not found. Please contact admin.', 'danger');
            handleLogout();
            return;
        }

        const doctorData = docRef.data();

        // Check if doctor is active
        if (!doctorData.isActive) {
            showAlert('Your account is not active. Please contact admin.', 'danger');
            handleLogout();
            return;
        }

        currentDoctorData = doctorData;

        // Store auth data
        localStorage.setItem('doctorAuth', JSON.stringify({
            uid: doctorId,
            email: doctorData.email,
            displayName: `Dr. ${doctorData.fullName}`,
            isDoctor: true,
            specialization: doctorData.specialization,
            doctorId: doctorData.doctorId,
            timestamp: new Date().getTime()
        }));

        // Update UI
        updateDoctorUI(doctorData);

        // Load initial data
        loadDashboardData();
        setupRealtimeListeners();

    } catch (error) {
        console.error('Error loading doctor data:', error);
        showAlert('Error loading doctor profile', 'danger');
        showLoginPage();
    }
}

// Update Doctor UI
function updateDoctorUI(doctorData) {
    const displayName = `Dr. ${doctorData.fullName}`;

    // Update header
    document.getElementById('userName').textContent = displayName;
    document.getElementById('userEmail').textContent = doctorData.email;

    // Update sidebar
    document.getElementById('sidebarName').textContent = displayName;
    document.getElementById('sidebarSpecialization').textContent = doctorData.specialization;

    // Update profile section
    document.getElementById('profileName').textContent = displayName;
    document.getElementById('profileSpecialization').textContent = doctorData.specialization;
    document.getElementById('profileId').textContent = doctorData.doctorId || 'N/A';
    document.getElementById('profileFullName').textContent = displayName;
    document.getElementById('profileEmail').textContent = doctorData.email;
    document.getElementById('profilePhone').textContent = doctorData.phone || 'N/A';
    document.getElementById('profileSpecializationText').textContent = doctorData.specialization;
    document.getElementById('profileRegNumber').textContent = doctorData.registrationNumber || 'N/A';
    document.getElementById('profileExperience').textContent = `${doctorData.yearsOfExperience || 0} years`;
    document.getElementById('profileHospital').textContent = doctorData.hospital || 'N/A';
    document.getElementById('profileStatus').textContent = doctorData.isActive ? 'Active' : 'Inactive';
    document.getElementById('profileAvailability').textContent = doctorData.availability || 'N/A';
    document.getElementById('profileLastLogin').textContent = new Date().toLocaleString();

    // Set avatars
    const initials = getInitials(displayName);
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('sidebarAvatar').textContent = initials;
    document.getElementById('profileAvatar').textContent = initials;
}

// Get Initials from Name
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Initialize Event Listeners
function initEventListeners() {
    // Login Form
    const loginForm = document.getElementById('doctorLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout Buttons
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('sidebarLogoutBtn').addEventListener('click', handleLogout);

    // Menu Toggle
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);

    // Navigation Links
    document.querySelectorAll('.nav-link, .mobile-tab').forEach(element => {
        element.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.dataset.section;
            handleNavigation(section);

            // Close sidebar on mobile
            if (window.innerWidth <= 992) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });

    // Refresh Buttons
    document.getElementById('refreshDashboard').addEventListener('click', () => loadDashboardData());
    document.getElementById('refreshWaiting').addEventListener('click', () => loadWaitingPatients());
    document.getElementById('refreshAssigned').addEventListener('click', () => loadOngoingPatients());
    document.getElementById('refreshCompleted').addEventListener('click', () => loadCompletedPatients());
    document.getElementById('refreshAll').addEventListener('click', () => loadAllPatients());

    // Status Filter
    document.getElementById('statusFilter').addEventListener('change', function () {
        loadAllPatients(this.value);
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function (event) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');

        if (window.innerWidth <= 992 &&
            sidebar.classList.contains('active') &&
            !sidebar.contains(event.target) &&
            !menuToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showAlert('Please enter both email and password', 'danger');
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;

    try {
        if (typeof auth === 'undefined' || typeof db === 'undefined') {
            throw new Error('Firebase not initialized. Please refresh the page.');
        }

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Check if user is a doctor
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists || userDoc.data().userType !== 'doctor') {
            await auth.signOut();
            throw new Error('Access denied. Not a registered doctor.');
        }

        // Get doctor data
        const doctorDoc = await db.collection('doctors').doc(user.uid).get();
        if (!doctorDoc.exists) {
            await auth.signOut();
            throw new Error('Doctor profile not found.');
        }

        const doctorData = doctorDoc.data();

        // Check if doctor is active
        if (!doctorData.isActive) {
            await auth.signOut();
            throw new Error('Your account is not active. Please contact admin.');
        }

        // Store auth data
        localStorage.setItem('doctorAuth', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: `Dr. ${doctorData.fullName}`,
            isDoctor: true,
            specialization: doctorData.specialization,
            doctorId: doctorData.doctorId,
            timestamp: new Date().getTime()
        }));

        currentDoctorId = user.uid;
        currentDoctorData = doctorData;

        showAlert('Login successful!', 'success');

        // Update last login time
        await db.collection('doctors').doc(user.uid).update({
            lastLogin: new Date()
        });

        await db.collection('users').doc(user.uid).update({
            lastLogin: new Date()
        });

        setTimeout(() => {
            showDoctorPortal({
                uid: user.uid,
                email: user.email,
                displayName: `Dr. ${doctorData.fullName}`,
                specialization: doctorData.specialization
            });
            loadDoctorData(user.uid);
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);

        let errorMessage = 'Login failed: ';
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-login-credentials':
                errorMessage += 'Invalid email or password.';
                break;
            case 'auth/network-request-failed':
                errorMessage += 'Network error. Please check your internet connection.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many login attempts. Please try again later.';
                break;
            default:
                errorMessage += error.message || 'An unknown error occurred.';
        }

        showAlert(errorMessage, 'danger');

        // Clear any stored auth data
        localStorage.removeItem('doctorAuth');
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// Handle Logout
function handleLogout() {
    // Clear all auth data
    localStorage.removeItem('doctorAuth');

    // Remove realtime listeners
    realtimeListeners.forEach(unsubscribe => unsubscribe());
    realtimeListeners = [];

    // Sign out from Firebase
    if (typeof auth !== 'undefined') {
        auth.signOut().catch(console.error);
    }

    // Show login page
    showLoginPage();
    showAlert('Logged out successfully', 'success');
}

// Toggle Sidebar
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Show Login Page
function showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('doctorPortal').style.display = 'none';

    // Clear form
    const loginForm = document.getElementById('doctorLoginForm');
    if (loginForm) loginForm.reset();
}

// Show Doctor Portal
function showDoctorPortal(authData) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('doctorPortal').style.display = 'flex';

    // Show dashboard by default
    handleNavigation('dashboard');
}

// Handle Navigation
function handleNavigation(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Remove active class from all navigation
    document.querySelectorAll('.nav-link, .mobile-tab').forEach(element => {
        element.classList.remove('active');
    });

    // Show selected section
    const sectionElement = document.getElementById(`${section}Section`);
    if (sectionElement) {
        sectionElement.style.display = 'block';

        // Set active navigation
        document.querySelectorAll(`[data-section="${section}"]`).forEach(element => {
            element.classList.add('active');
        });

        // Load section data
        switch (section) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'waiting':
                loadWaitingPatients();
                break;
            case 'assigned':
                loadOngoingPatients();
                break;
            case 'completed':
                loadCompletedPatients();
                break;
            case 'all':
                loadAllPatients();
                break;
            case 'profile':
                // Profile data is already loaded
                break;
        }
    }
}

// Setup Realtime Listeners
function setupRealtimeListeners() {
    if (!currentDoctorId || typeof db === 'undefined') return;

    // Remove existing listeners
    realtimeListeners.forEach(unsubscribe => unsubscribe && unsubscribe());
    realtimeListeners = [];

    console.log('Setting up realtime listeners for doctor:', currentDoctorId);

    // Listen for assigned patients updates
    try {
        const assignedListener = db.collection('patients')
            .where('assignedDoctorId', '==', currentDoctorId)
            .onSnapshot((snapshot) => {
                console.log('Realtime update received:', snapshot.docs.length, 'patients');

                // Get all patients
                const patients = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Update dashboard stats with correct counts
                updateDashboardStats(patients);

                // Force refresh current section
                const activeNav = document.querySelector('.nav-link.active') ||
                    document.querySelector('.mobile-tab.active');
                if (activeNav) {
                    handleNavigation(activeNav.dataset.section);
                }
            }, (error) => {
                console.error('Realtime listener error:', error);
            });

        realtimeListeners.push(assignedListener);
    } catch (error) {
        console.error('Error setting up realtime listeners:', error);
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        if (!currentDoctorId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const snapshot = await db.collection('patients')
            .where('assignedDoctorId', '==', currentDoctorId)
            .get();

        if (!snapshot.empty) {
            const patients = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log('Loaded patients:', patients); // ডিবাগিং জন্য

            updateDashboardStats(patients);
            updateRecentPatients(patients);
        } else {
            console.log('No patients found for doctor:', currentDoctorId); // ডিবাগিং জন্য
            updateDashboardStats([]);
            updateRecentPatients([]);
        }

        // Update last updated time
        updateLastUpdatedTime();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error loading dashboard data: ' + error.message, 'danger');
    }
}

// Update Last Updated Time
function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdatedTime').textContent = timeString;
}

// Update Dashboard Stats
function updateDashboardStats(patients = []) {
    if (!patients.length) {
        patients = [];
    }

    const total = patients.length;
    const waiting = patients.filter(p => !p.checkupStarted && !p.checkupCompleted).length;
    const ongoing = patients.filter(p => p.checkupStarted && !p.checkupCompleted).length;
    const completed = patients.filter(p => p.checkupCompleted).length;

    // Update stat cards
    document.getElementById('totalAssignedPatients').textContent = total;
    document.getElementById('waitingPatients').textContent = waiting;
    document.getElementById('ongoingPatients').textContent = ongoing;
    document.getElementById('completedPatients').textContent = completed;

    // Update badges - CORRECTED: Show specific counts for each section
    document.getElementById('assignedBadge').textContent = ongoing; // Changed from total to ongoing
    document.getElementById('waitingBadge').textContent = waiting;
    document.getElementById('completedBadge').textContent = completed;
    document.getElementById('allBadge').textContent = total;

    // Update profile stats
    document.getElementById('profilePatientsToday').textContent = total;
}

// Update Recent Patients
function updateRecentPatients(patients) {
    const tableBody = document.getElementById('recentPatientsTable');

    // Sort by registration date (newest first)
    const recentPatients = patients
        .sort((a, b) => {
            const dateA = a.registrationDate?.toDate ? a.registrationDate.toDate() : new Date(a.registrationDate);
            const dateB = b.registrationDate?.toDate ? b.registrationDate.toDate() : new Date(b.registrationDate);
            return dateB - dateA;
        })
        .slice(0, 5);

    tableBody.innerHTML = '';

    if (recentPatients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-user-injured"></i>
                    <p>No patients assigned yet</p>
                </td>
            </tr>
        `;
        document.getElementById('recentCount').textContent = '0 patients';
        return;
    }

    recentPatients.forEach((patient, index) => {
        const status = calculatePatientStatus(patient);
        const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
        const waitTime = calculateWaitTime(patient);

        // Calculate checkup start time and duration
        const checkupStartTime = patient.checkupStartTime ?
            formatFirestoreTimestamp(patient.checkupStartTime) : 'Not started';
        const checkupDuration = patient.checkupStartTime ?
            calculateCheckupDuration(patient) : 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${patient.registrationId || 'N/A'}</strong></td>
            <td>${patient.fullName || 'N/A'}</td>
            <td>${patient.age || 'N/A'}</td>
            <td>${patient.gender || 'N/A'}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${status}
                </span>
            </td>
            <td>${waitTime}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" data-id="${patient.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${status === 'Waiting' ? `
                    <button class="btn-action btn-start" data-id="${patient.id}" title="Start Checkup">
                        <i class="fas fa-play"></i>
                    </button>
                    ` : ''}
                    ${status === 'Ongoing' ? `
                    <button class="btn-action btn-complete" data-id="${patient.id}" title="Complete Checkup">
                        <i class="fas fa-check"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Update count
    document.getElementById('recentCount').textContent = `${recentPatients.length} recent patients`;

    // Add event listeners to action buttons
    addPatientActionListeners();
}

// Load Waiting Patients
async function loadWaitingPatients() {
    try {
        if (!currentDoctorId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const snapshot = await db.collection('patients')
            .where('assignedDoctorId', '==', currentDoctorId)
            .where('checkupStarted', '==', false)
            .where('checkupCompleted', '==', false)
            .get();

        const tableBody = document.getElementById('waitingPatientsTable');
        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        <i class="fas fa-clock"></i>
                        <p>No waiting patients</p>
                    </td>
                </tr>
            `;
            document.getElementById('waitingCount').textContent = '0 patients';
            return;
        }

        // Get all patients and convert to array
        let patients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort patients by registration date (oldest first)
        patients.sort((a, b) => {
            // Convert Firestore timestamp to Date object
            const dateA = a.registrationDate ?
                (a.registrationDate.toDate ? a.registrationDate.toDate() : new Date(a.registrationDate)) : new Date(0);
            const dateB = b.registrationDate ?
                (b.registrationDate.toDate ? b.registrationDate.toDate() : new Date(b.registrationDate)) : new Date(0);

            return dateA - dateB; // Ascending order (oldest first)
        });

        // Add serial numbers based on sorted order
        patients.forEach((patient, index) => {
            patient.serialNumber = index + 1;
        });

        // Display patients
        patients.forEach(patient => {
            const waitTime = calculateWaitTime(patient);
            const registrationTime = patient.registrationDate ?
                formatFirestoreTimestamp(patient.registrationDate) : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.serialNumber}</td>
                <td><strong>${patient.registrationId || 'N/A'}</strong></td>
                <td>${patient.fullName || 'N/A'}</td>
                <td>${patient.age || 'N/A'}</td>
                <td>${patient.gender || 'N/A'}</td>
                <td>${formatPhoneNumber(patient.phone)}</td>
                <td>${registrationTime}</td>
                <td>${waitTime}</td>
                <td>${patient.currentSymptoms || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" data-id="${patient.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-start" data-id="${patient.id}" title="Start Checkup">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        document.getElementById('waitingCount').textContent = `${patients.length} patients`;
        addPatientActionListeners();

    } catch (error) {
        console.error('Error loading waiting patients:', error);
        showAlert('Error loading waiting patients: ' + error.message, 'danger');
    }
}

// Load Ongoing Checkups Patients
async function loadOngoingPatients() {
    try {
        if (!currentDoctorId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const snapshot = await db.collection('patients')
            .where('assignedDoctorId', '==', currentDoctorId)
            .where('checkupStarted', '==', true)
            .where('checkupCompleted', '==', false)
            .orderBy('checkupStartTime', 'asc')
            .get();

        const tableBody = document.getElementById('assignedPatientsTable');
        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-stethoscope"></i>
                        <p>No ongoing checkups</p>
                    </td>
                </tr>
            `;
            document.getElementById('assignedCount').textContent = '0 patients';
            // Update sidebar badge
            document.getElementById('assignedBadge').textContent = '0';
            return;
        }

        const patients = snapshot.docs.map((doc, index) => ({
            id: doc.id,
            index: index + 1,
            ...doc.data()
        }));

        patients.forEach(patient => {
            const checkupDuration = calculateCheckupDuration(patient);
            const checkupStartTime = patient.checkupStartTime ?
                formatFirestoreTimestamp(patient.checkupStartTime) : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.index}</td>
                <td><strong>${patient.registrationId || 'N/A'}</strong></td>
                <td>${patient.fullName || 'N/A'}</td>
                <td>${patient.age || 'N/A'}</td>
                <td>${patient.gender || 'N/A'}</td>
                <td>${formatPhoneNumber(patient.phone)}</td>
                <td>${checkupStartTime}</td>
                <td>${checkupDuration}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" data-id="${patient.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-complete" data-id="${patient.id}" title="Complete Checkup">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        document.getElementById('assignedCount').textContent = `${patients.length} ongoing checkups`;

        // Update sidebar badge with correct count
        document.getElementById('assignedBadge').textContent = patients.length;

        addPatientActionListeners();

    } catch (error) {
        console.error('Error loading ongoing patients:', error);
        showAlert('Error loading ongoing patients: ' + error.message, 'danger');
    }
}

// Calculate Checkup Duration
function calculateCheckupDuration(patient) {
    if (!patient.checkupStartTime) return 'N/A';

    const startTime = patient.checkupStartTime?.toDate ?
        patient.checkupStartTime.toDate() : new Date(patient.checkupStartTime);
    const now = new Date();

    const diffMs = now - startTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (diffHours > 0) {
        return `${diffHours}h ${remainingMins}m`;
    }
    return `${diffMins}m`;
}

// Load Completed Patients
async function loadCompletedPatients() {
    try {
        if (!currentDoctorId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const snapshot = await db.collection('patients')
            .where('assignedDoctorId', '==', currentDoctorId)
            .where('checkupCompleted', '==', true)
            .orderBy('checkupEndTime', 'desc')
            .get();

        const tableBody = document.getElementById('completedPatientsTable');
        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>No completed patients</p>
                    </td>
                </tr>
            `;
            document.getElementById('completedCount').textContent = '0 patients';
            return;
        }

        const patients = snapshot.docs.map((doc, index) => ({
            id: doc.id,
            index: index + 1,
            ...doc.data()
        }));

        patients.forEach(patient => {
            const totalTime = calculateTotalCheckupTime(patient);
            const completionTime = patient.checkupEndTime ?
                formatFirestoreTimestamp(patient.checkupEndTime) : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.index}</td>
                <td><strong>${patient.registrationId || 'N/A'}</strong></td>
                <td>${patient.fullName || 'N/A'}</td>
                <td>${patient.age || 'N/A'}</td>
                <td>${patient.gender || 'N/A'}</td>
                <td>${completionTime}</td>
                <td>${totalTime}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" data-id="${patient.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        document.getElementById('completedCount').textContent = `${patients.length} patients`;
        addPatientActionListeners();

    } catch (error) {
        console.error('Error loading completed patients:', error);
        showAlert('Error loading completed patients: ' + error.message, 'danger');
    }
}

// Load All Patients
async function loadAllPatients(filter = 'all') {
    try {
        if (!currentDoctorId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const snapshot = await db.collection('patients')
            .where('assignedDoctorId', '==', currentDoctorId)
            .orderBy('registrationDate', 'desc')
            .get();

        const tableBody = document.getElementById('allPatientsTable');
        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No patients found</p>
                    </td>
                </tr>
            `;
            return;
        }

        let patients = snapshot.docs.map((doc, index) => ({
            id: doc.id,
            index: index + 1,
            ...doc.data()
        }));

        // Apply filter
        if (filter !== 'all') {
            patients = patients.filter(patient => {
                const status = calculatePatientStatus(patient);
                return status.toLowerCase() === filter;
            });
        }

        if (patients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-filter"></i>
                        <p>No patients match the filter</p>
                    </td>
                </tr>
            `;
            return;
        }

        patients.forEach(patient => {
            const status = calculatePatientStatus(patient);
            const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
            const registrationDate = patient.registrationDate ?
                formatFirestoreTimestamp(patient.registrationDate) : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.index}</td>
                <td><strong>${patient.registrationId || 'N/A'}</strong></td>
                <td>${patient.fullName || 'N/A'}</td>
                <td>${patient.age || 'N/A'}</td>
                <td>${patient.gender || 'N/A'}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </td>
                <td>${registrationDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" data-id="${patient.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${status === 'Waiting' ? `
                        <button class="btn-action btn-start" data-id="${patient.id}" title="Start Checkup">
                            <i class="fas fa-play"></i>
                        </button>
                        ` : ''}
                        ${status === 'Ongoing' ? `
                        <button class="btn-action btn-complete" data-id="${patient.id}" title="Complete Checkup">
                            <i class="fas fa-check"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        addPatientActionListeners();

    } catch (error) {
        console.error('Error loading all patients:', error);
        showAlert('Error loading all patients: ' + error.message, 'danger');
    }
}

// Add Patient Action Listeners
function addPatientActionListeners() {
    // View patient details
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function () {
            const patientId = this.getAttribute('data-id');
            viewPatientDetails(patientId);
        });
    });

    // Start checkup
    document.querySelectorAll('.btn-start').forEach(btn => {
        btn.addEventListener('click', function () {
            const patientId = this.getAttribute('data-id');
            startCheckup(patientId);
        });
    });

    // Complete checkup
    document.querySelectorAll('.btn-complete').forEach(btn => {
        btn.addEventListener('click', function () {
            const patientId = this.getAttribute('data-id');
            completeCheckup(patientId);
        });
    });
}

// View Patient Details
async function viewPatientDetails(patientId) {
    try {
        if (!patientId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const doc = await db.collection('patients').doc(patientId).get();

        if (!doc.exists) {
            showAlert('Patient not found', 'danger');
            return;
        }

        const patient = doc.data();
        const status = calculatePatientStatus(patient);

        // Create modal content
        const modalContent = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Patient Details - ${patient.registrationId}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="patient-details-grid">
                            <div class="detail-group">
                                <h4>Personal Information</h4>
                                <div class="detail-item">
                                    <span class="detail-label">Full Name:</span>
                                    <span class="detail-value">${patient.fullName}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Age / Gender:</span>
                                    <span class="detail-value">${patient.age} / ${patient.gender}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Phone:</span>
                                    <span class="detail-value">${formatPhoneNumber(patient.phone)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">E C:</span>
                                    <span class="detail-value">${formatPhoneNumber(patient.emergencyContact) || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Address:</span>
                                    <span class="detail-value">${patient.address || 'N/A'}</span>
                                </div>
                            </div>
                            
                            <div class="detail-group">
                                <h4>Medical Information</h4>
                                <div class="detail-item">
                                    <span class="detail-label">Blood Group:</span>
                                    <span class="detail-value">${patient.bloodGroup || 'Not specified'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Allergies:</span>
                                    <span class="detail-value">${patient.allergies || 'None reported'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Medical History:</span>
                                    <span class="detail-value">${patient.medicalHistory || 'None reported'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Current Symptoms:</span>
                                    <span class="detail-value">${patient.currentSymptoms || 'None reported'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Previous Medications:</span>
                                    <span class="detail-value">${patient.previousMedications || 'None reported'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-group" style="margin-top: 20px;">
                            <h4>Checkup Information</h4>
                            <div class="detail-item">
                                <span class="detail-label">Registration Date:</span>
                                <span class="detail-value">${formatFirestoreTimestamp(patient.registrationDate)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value">
                                    <span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">
                                        ${status}
                                    </span>
                                </span>
                            </div>
                            ${patient.checkupStartTime ? `
                            <div class="detail-item">
                                <span class="detail-label">Checkup Started:</span>
                                <span class="detail-value">${formatFirestoreTimestamp(patient.checkupStartTime)}</span>
                            </div>
                            ` : ''}
                            ${patient.checkupEndTime ? `
                            <div class="detail-item">
                                <span class="detail-label">Checkup Completed:</span>
                                <span class="detail-value">${formatFirestoreTimestamp(patient.checkupEndTime)}</span>
                            </div>
                            ` : ''}
                            ${patient.waitTime ? `
                            <div class="detail-item">
                                <span class="detail-label">Wait Time:</span>
                                <span class="detail-value">${patient.waitTime} minutes</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary close-modal">Close</button>
                        ${status === 'Waiting' ? `
                        <button class="btn btn-primary start-checkup-btn" data-id="${patientId}">Start Checkup</button>
                        ` : ''}
                        ${status === 'Ongoing' ? `
                        <button class="btn btn-primary complete-checkup-btn" data-id="${patientId}">Complete Checkup</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // Add event listeners
        document.querySelector('.modal-close').addEventListener('click', closeModal);
        document.querySelector('.close-modal').addEventListener('click', closeModal);

        const startBtn = document.querySelector('.start-checkup-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                startCheckup(patientId);
                closeModal();
            });
        }

        const completeBtn = document.querySelector('.complete-checkup-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                completeCheckup(patientId);
                closeModal();
            });
        }

        // Close modal on overlay click
        document.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeModal();
            }
        });

    } catch (error) {
        console.error('Error viewing patient details:', error);
        showAlert('Error loading patient details', 'danger');
    }
}

// Start Checkup
async function startCheckup(patientId) {
    try {
        if (!patientId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const patientRef = db.collection('patients').doc(patientId);
        const patientDoc = await patientRef.get();

        if (!patientDoc.exists) {
            showAlert('Patient not found', 'danger');
            return;
        }

        const patient = patientDoc.data();

        // Check if patient is already in checkup
        if (patient.checkupStarted) {
            showAlert('Checkup already started for this patient', 'warning');
            return;
        }

        // Calculate wait time
        const now = new Date();
        const registrationTime = patient.registrationDate?.toDate ?
            patient.registrationDate.toDate() : new Date(patient.registrationDate);
        const waitTime = Math.floor((now - registrationTime) / (1000 * 60));

        // Update patient status
        await patientRef.update({
            checkupStarted: true,
            checkupStartTime: now,
            waitTime: waitTime
        });

        showAlert('Checkup started successfully', 'success');

        // Refresh all data
        loadDashboardData();
        loadOngoingPatients();
        loadWaitingPatients();
        loadAllPatients();

    } catch (error) {
        console.error('Error starting checkup:', error);
        showAlert('Error starting checkup', 'danger');
    }
}

// Complete Checkup
async function completeCheckup(patientId) {
    try {
        if (!patientId || typeof db === 'undefined') {
            throw new Error('Database not available');
        }

        const patientRef = db.collection('patients').doc(patientId);
        const patientDoc = await patientRef.get();

        if (!patientDoc.exists) {
            showAlert('Patient not found', 'danger');
            return;
        }

        const patient = patientDoc.data();

        // Check if checkup was started
        if (!patient.checkupStarted) {
            showAlert('Checkup not started for this patient', 'warning');
            return;
        }

        // Check if already completed
        if (patient.checkupCompleted) {
            showAlert('Checkup already completed for this patient', 'warning');
            return;
        }

        // Update patient status
        await patientRef.update({
            checkupCompleted: true,
            checkupEndTime: new Date()
        });

        showAlert('Checkup completed successfully', 'success');

        // Refresh all data
        loadDashboardData();
        loadOngoingPatients();
        loadCompletedPatients();
        loadAllPatients();

    } catch (error) {
        console.error('Error completing checkup:', error);
        showAlert('Error completing checkup', 'danger');
    }
}

// Close Modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Helper Functions
function calculatePatientStatus(patient) {
    if (!patient.checkupStarted && !patient.checkupCompleted) {
        return 'Waiting';
    } else if (patient.checkupStarted && !patient.checkupCompleted) {
        return 'Ongoing';
    } else if (patient.checkupCompleted) {
        return 'Completed';
    }
    return 'Unknown';
}

function calculateWaitTime(patient) {
    if (!patient.registrationDate) return 'N/A';

    const registrationTime = patient.registrationDate?.toDate ?
        patient.registrationDate.toDate() : new Date(patient.registrationDate);
    const now = new Date();
    const waitMinutes = Math.floor((now - registrationTime) / (1000 * 60));

    if (patient.waitTime) {
        return `${patient.waitTime} min`;
    }

    if (waitMinutes < 1) return 'Just now';
    if (waitMinutes < 60) return `${waitMinutes} min`;

    const hours = Math.floor(waitMinutes / 60);
    const minutes = waitMinutes % 60;
    return `${hours}h ${minutes}m`;
}

function calculateTotalCheckupTime(patient) {
    if (!patient.checkupStartTime || !patient.checkupEndTime) return 'N/A';

    const startTime = patient.checkupStartTime?.toDate ?
        patient.checkupStartTime.toDate() : new Date(patient.checkupStartTime);
    const endTime = patient.checkupEndTime?.toDate ?
        patient.checkupEndTime.toDate() : new Date(patient.checkupEndTime);

    const totalMinutes = Math.floor((endTime - startTime) / (1000 * 60));
    return `${totalMinutes} min`;
}

function formatPhoneNumber(phone) {
    if (!phone) return 'N/A';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format for Bangladeshi numbers
    if (cleaned.startsWith('880') && cleaned.length === 13) {
        return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)}-${cleaned.substring(8)}`;
    } else if (cleaned.startsWith('01') && cleaned.length === 11) {
        return `+880 ${cleaned.substring(1, 3)} ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }

    return phone;
}

function formatFirestoreTimestamp(timestamp) {
    if (!timestamp) return 'N/A';

    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'N/A';
    }
}

// Show Alert
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer') ||
        document.getElementById('portalAlertContainer');

    if (!alertContainer) return;

    // Remove existing alerts
    const existingAlerts = alertContainer.querySelectorAll('.alert');
    existingAlerts.forEach(alert => {
        if (alert.parentNode) {
            alert.remove();
        }
    });

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer;" 
                onclick="this.parentElement.remove()">×</button>
    `;

    alertContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Make functions globally available
window.showAlert = showAlert;
window.closeModal = closeModal;