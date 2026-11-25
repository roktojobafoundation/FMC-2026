// Firebase-এ Admin ইউজার তৈরি করার ফাংশন
async function createFirebaseAdminUsers() {
    try {
        // শুধুমাত্র ডেভেলপমেন্ট এনভায়রনমেন্টে চালানো হবে
        const isDev = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (!isDev) return;

        const adminUsers = [
            {
                email: 'admintasrik@rjfmedical.com',
                password: 'Admin@123',
                displayName: 'Tasrik Hossain "Admin & Founder"'
            },
            {
                email: 'admin@rjfmedical.com',
                password: 'Admin@123',
                displayName: 'FMC "Admin"'
            }
        ];

        for (const user of adminUsers) {
            try {
                // চেক করুন ইউজার ইতিমধ্যে আছে কিনা
                const signInMethods = await auth.fetchSignInMethodsForEmail(user.email);

                if (signInMethods.length === 0) {
                    // নতুন ইউজার তৈরি করুন
                    const userCredential = await auth.createUserWithEmailAndPassword(
                        user.email,
                        user.password
                    );

                    // ডিসপ্লে নেম আপডেট করুন
                    await userCredential.user.updateProfile({
                        displayName: user.displayName
                    });

                    console.log(`Admin user created: ${user.email}`);

                    // Firestore-এ Admin ডকুমেন্ট তৈরি করুন
                    await db.collection('admins').doc(userCredential.user.uid).set({
                        uid: userCredential.user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        role: 'super_admin',
                        permissions: ['all'],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'active'
                    });

                    // লগআউট করুন (বিকাশের জন্য)
                    await auth.signOut();
                } else {
                    console.log(`Admin user already exists: ${user.email}`);
                }
            } catch (error) {
                console.error(`Error creating admin user ${user.email}:`, error.message);
            }
        }

        console.log('Admin user creation process completed.');

    } catch (error) {
        console.error('Error in createFirebaseAdminUsers:', error);
    }
}

// Admin login page লোড হলে এই ফাংশন কল করুন
function initAdminLoginPage() {
    // Admin users তৈরি করুন (শুধু ডেভেলপমেন্টে)
    createFirebaseAdminUsers();

    // Existing login logic
    initAdminLogin();
}

// DOMContentLoaded event এ initAdminLoginPage কল করুন
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'admin-login.html') {
        initAdminLoginPage();
    }
});

// Admin Portal JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is authenticated
    checkAdminAuth();

    // Initialize Admin Dashboard
    function initAdminDashboard() {
        console.log('Initializing admin dashboard...');

        // Check authentication first
        if (!checkAdminAuth()) {
            return;
        }

        // Update user info
        updateUserInfoFromStorage();

        // Load dashboard stats
        updateDashboardStats();

        // Initialize charts
        initCharts();

        // Setup real-time listeners
        setupRealtimeListeners();

        // Initialize add functionality
        initAddPatient();
        initAddDoctor();
        initAddVolunteer();

        // Initialize advanced search
        initAdvancedPatientSearch();

        console.log('Admin dashboard initialized successfully');
    }

    // Helper function to update user info from storage
    function updateUserInfoFromStorage() {
        const localAuth = localStorage.getItem('adminAuth');
        if (localAuth) {
            try {
                const authData = JSON.parse(localAuth);
                const userAvatar = document.getElementById('userAvatar');
                const userName = document.getElementById('userName');
                const userEmail = document.getElementById('userEmail');

                if (userAvatar) {
                    const initials = authData.email.substring(0, 2).toUpperCase();
                    userAvatar.textContent = initials;
                }

                if (userName) {
                    userName.textContent = authData.displayName || authData.email.split('@')[0];
                }

                if (userEmail) {
                    userEmail.textContent = authData.email;
                }
            } catch (error) {
                console.error('Error parsing auth data:', error);
            }
        }
    }

    // Initialize sidebar toggle
    initSidebarToggle();

    // Initialize logout functionality
    initLogout();

    // Initialize admin modules based on current page
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'admin-dashboard.html') {
        initDashboardStats();
        initPatientManagement();
        initDoctorManagement();
        initVolunteerManagement();

        // Initialize add buttons
        initAddPatient();
        initAddDoctor();
        initAddVolunteer();

        // Initialize advanced search
        initAdvancedPatientSearch();
    }

    // If on login page, initialize login
    if (currentPage === 'admin-login.html') {
        initAdminLogin();
    }
});

// Check Admin Authentication - Simplified Version
function checkAdminAuth() {
    const isLoginPage = window.location.pathname.includes('admin-login.html');

    // Primary check: localStorage
    const localAuth = localStorage.getItem('adminAuth');
    const sessionAuth = sessionStorage.getItem('currentAdmin');

    if (localAuth || sessionAuth) {
        console.log('Auth found in storage, user authenticated');
        return true;
    }

    // Secondary check: Firebase auth
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            console.log('Firebase auth state changed:', user ? 'User found' : 'No user');

            if (user && !isLoginPage) {
                // User is logged in and on admin page
                console.log('User authenticated via Firebase:', user.email);
                updateUserInfo(user);
                return;
            }

            if (!user && !isLoginPage) {
                // No user and not on login page, redirect
                console.log('No user found, redirecting to login');
                window.location.href = 'admin-login.html';
            }

            if (user && isLoginPage) {
                // User logged in but on login page, redirect to dashboard
                console.log('User already logged in, redirecting to dashboard');
                window.location.href = 'admin-dashboard.html';
            }
        });
    } else {
        console.log('Firebase auth not available');
        if (!isLoginPage && !localAuth && !sessionAuth) {
            window.location.href = 'admin-login.html';
        }
    }
}

// Helper function to set custom claims
async function setCustomAdminClaim(uid) {
    try {
        // This would typically call a Firebase Function
        // For now, just store in localStorage
        localStorage.setItem('adminAuth', JSON.stringify({
            uid: uid,
            isAdmin: true,
            timestamp: new Date().getTime()
        }));
    } catch (error) {
        console.error('Error setting admin claim:', error);
    }
}

// admin.js ফাইলে নিচের ফাংশনটি যোগ করুন অথবা সংশোধন করুন

// Enhanced Admin Login Function
function initAdminLogin() {
    const loginForm = document.getElementById('adminLoginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        console.log('Login attempt for:', email);

        if (!email || !password) {
            showAlert('Please enter both email and password', 'danger');
            return;
        }

        // Submit button loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        try {
            // Firebase authentication
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log('Firebase login successful:', user.email);
            console.log('User displayName:', user.displayName);

            // Get the user's ID token
            const idToken = await user.getIdToken();
            console.log('User ID Token:', idToken.substring(0, 20) + '...');

            // Custom display name mapping based on email
            let displayName = user.displayName;

            // If Firebase displayName is not set, use email-based mapping
            if (!displayName || displayName === '') {
                if (email === 'admintasrik@rjfmedical.com') {
                    displayName = 'Tasrik Hossain "Admin & Founder"';
                } else if (email === 'admin@rjfmedical.com') {
                    displayName = 'FMC "Admin"';
                } else {
                    // Default: use email prefix
                    displayName = user.email.split('@')[0];
                }

                // Update Firebase profile with display name
                try {
                    await user.updateProfile({
                        displayName: displayName
                    });
                    console.log('Updated displayName in Firebase:', displayName);
                } catch (updateError) {
                    console.warn('Could not update Firebase profile:', updateError);
                }
            }

            // Check if user is admin (you can add custom logic here)
            // For now, we'll allow any authenticated user with the admin email domain
            if (email.includes('@rjfmedical.com') || email.includes('@roktojoba.org')) {
                // Store user info in localStorage with correct display name
                localStorage.setItem('adminAuth', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: displayName,  // Use the mapped display name
                    isAdmin: true,
                    token: idToken,
                    timestamp: new Date().getTime(),
                    firebaseAuth: true
                }));

                // Also store in sessionStorage for immediate access
                sessionStorage.setItem('currentAdmin', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: displayName,  // Use the mapped display name
                    loggedIn: true,
                    token: idToken
                }));

                // Check if admin exists in Firestore, if not create one
                try {
                    const adminDoc = await db.collection('admins').doc(user.uid).get();

                    if (!adminDoc.exists) {
                        console.log('Creating admin record in Firestore');
                        await db.collection('admins').doc(user.uid).set({
                            uid: user.uid,
                            email: user.email,
                            displayName: displayName,  // Use the mapped display name
                            role: 'admin',
                            permissions: ['all'],
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // Update last login time and display name
                        await db.collection('admins').doc(user.uid).update({
                            displayName: displayName,  // Update display name in Firestore too
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                } catch (firestoreError) {
                    console.warn('Firestore admin check error:', firestoreError);
                    // Continue even if Firestore fails
                }

                showAlert('Login successful! Redirecting to dashboard...', 'success');

                // Force token refresh
                await user.getIdToken(true);

                // Wait a bit then redirect
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1000);

            } else {
                // Not an admin email
                await auth.signOut();
                localStorage.removeItem('adminAuth');
                sessionStorage.removeItem('currentAdmin');

                showAlert('Access denied. This email is not authorized for admin access.', 'danger');
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }

        } catch (error) {
            console.error('Firebase login error:', error);

            // Clear any existing auth data
            localStorage.removeItem('adminAuth');
            sessionStorage.removeItem('currentAdmin');

            let errorMessage = 'Login failed. ';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email address format.';
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
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// Also update the user info update function to ensure correct display name is shown
function updateUserInfo(user) {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');
    const userEmail = document.querySelector('.user-email');

    if (userAvatar) {
        const initials = (user.displayName || user.email).substring(0, 2).toUpperCase();
        userAvatar.textContent = initials;
    }

    if (userName) {
        // Use displayName from user object or fallback to email mapping
        let displayName = user.displayName;
        if (!displayName || displayName === '') {
            if (user.email === 'admintasrik@rjfmedical.com') {
                displayName = 'Tasrik Hossain "Admin & Founder"';
            } else if (user.email === 'admin@rjfmedical.com') {
                displayName = 'FMC "Admin"';
            } else {
                displayName = user.email.split('@')[0];
            }
        }
        userName.textContent = displayName;
    }

    if (userEmail) {
        userEmail.textContent = user.email;
    }
}

// Update the initialization function to use localStorage data properly
function updateUserInfoFromStorage() {
    const localAuth = localStorage.getItem('adminAuth');
    if (localAuth) {
        try {
            const authData = JSON.parse(localAuth);
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');

            if (userAvatar) {
                const initials = (authData.displayName || authData.email).substring(0, 2).toUpperCase();
                userAvatar.textContent = initials;
            }

            if (userName) {
                // Use stored displayName or fallback to email mapping
                let displayName = authData.displayName;
                if (!displayName || displayName === '') {
                    if (authData.email === 'admintasrik@rjfmedical.com') {
                        displayName = 'Tasrik Hossain "Admin & Founder"';
                    } else if (authData.email === 'admin@rjfmedical.com') {
                        displayName = 'FMC "Admin"';
                    } else {
                        displayName = authData.email.split('@')[0];
                    }
                }
                userName.textContent = displayName;
            }

            if (userEmail) {
                userEmail.textContent = authData.email;
            }
        } catch (error) {
            console.error('Error parsing auth data:', error);
        }
    }
}

// Update User Info in Header
function updateUserInfo(user) {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');
    const userEmail = document.querySelector('.user-email');

    if (userAvatar) {
        const initials = user.email.substring(0, 2).toUpperCase();
        userAvatar.textContent = initials;
    }

    if (userName) {
        userName.textContent = user.displayName || user.email.split('@')[0];
    }

    if (userEmail) {
        userEmail.textContent = user.email;
    }
}

// Initialize Sidebar Toggle
function initSidebarToggle() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const mainContent = document.querySelector('.admin-main');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function (event) {
        if (window.innerWidth <= 992) {
            if (!event.target.closest('.admin-sidebar') &&
                !event.target.closest('.mobile-menu-toggle') &&
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Initialize Logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
            try {
                // Clear all auth storage
                localStorage.removeItem('adminAuth');
                sessionStorage.removeItem('currentAdmin');
                localStorage.removeItem('firebase:authUser:*');

                // Clear Firebase auth
                if (typeof auth !== 'undefined') {
                    await auth.signOut();
                }

                // Clear auth manager
                if (typeof window.authManager !== 'undefined') {
                    window.authManager.clearAuth();
                }

                // Redirect to login
                window.location.href = 'admin-login.html';

            } catch (error) {
                console.error('Logout error:', error);
                // Still redirect even if error
                window.location.href = 'admin-login.html';
            }
        });
    }
}

// Initialize Dashboard Statistics
async function initDashboardStats() {
    // Fetch and display real-time stats
    await updateDashboardStats();

    // Initialize charts
    initCharts();

    // Set up real-time listeners
    setupRealtimeListeners();
}

// Update Dashboard Statistics
async function updateDashboardStats() {
    try {
        // Get counts from Firestore
        const [
            patientsSnapshot,
            doctorsSnapshot,
            volunteersSnapshot,
            completedPatientsSnapshot
        ] = await Promise.all([
            db.collection('patients').get(),
            db.collection('doctors').get(),
            db.collection('volunteers').get(),
            db.collection('patients').where('checkupCompleted', '==', true).get()
        ]);

        // Calculate waiting patients
        const waitingPatients = patientsSnapshot.docs.filter(doc => {
            const data = doc.data();
            return !data.checkupStarted && !data.checkupCompleted;
        }).length;

        // Calculate ongoing checkups
        const ongoingPatients = patientsSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.checkupStarted && !data.checkupCompleted;
        }).length;

        // Update stats cards
        document.getElementById('totalPatientsCount').textContent = patientsSnapshot.size;
        document.getElementById('waitingPatientsCount').textContent = waitingPatients;
        document.getElementById('ongoingPatientsCount').textContent = ongoingPatients;
        document.getElementById('completedPatientsCount').textContent = completedPatientsSnapshot.size;
        document.getElementById('totalDoctorsCount').textContent = doctorsSnapshot.size;
        document.getElementById('totalVolunteersCount').textContent = volunteersSnapshot.size;

        // Calculate average wait time
        const completedPatients = completedPatientsSnapshot.docs.map(doc => doc.data());
        if (completedPatients.length > 0) {
            const totalWaitTime = completedPatients.reduce((sum, patient) => {
                if (patient.waitTime) return sum + patient.waitTime;
                return sum;
            }, 0);

            const avgWaitTime = Math.round(totalWaitTime / completedPatients.length);
            document.getElementById('avgWaitTime').textContent = `${avgWaitTime} min`;
        }

    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Initialize Charts
function initCharts() {
    // Patient Status Chart
    const patientStatusCtx = document.getElementById('patientStatusChart');
    if (patientStatusCtx) {
        new Chart(patientStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Waiting', 'Under Checkup', 'Completed'],
                datasets: [{
                    data: [
                        parseInt(document.getElementById('waitingPatientsCount').textContent),
                        parseInt(document.getElementById('ongoingPatientsCount').textContent),
                        parseInt(document.getElementById('completedPatientsCount').textContent)
                    ],
                    backgroundColor: [
                        '#e9c46a',
                        '#457b9d',
                        '#2a9d8f'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Daily Registration Chart
    const dailyRegCtx = document.getElementById('dailyRegistrationChart');
    if (dailyRegCtx) {
        // This would typically come from Firebase data
        new Chart(dailyRegCtx, {
            type: 'line',
            data: {
                labels: ['Dec 1', 'Dec 2', 'Dec 3', 'Dec 4', 'Dec 5', 'Dec 6', 'Today'],
                datasets: [{
                    label: 'Patient Registrations',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    backgroundColor: 'rgba(230, 57, 70, 0.1)',
                    borderColor: 'rgb(230, 57, 70)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Setup Realtime Listeners
function setupRealtimeListeners() {
    // Listen for patient updates
    db.collection('patients').onSnapshot(snapshot => {
        updateDashboardStats();
        if (typeof window.loadPatientsTable === 'function') {
            window.loadPatientsTable();
        }
    });

    // Listen for doctor updates
    db.collection('doctors').onSnapshot(snapshot => {
        updateDashboardStats();
        if (typeof window.loadDoctorsTable === 'function') {
            window.loadDoctorsTable();
        }
    });

    // Listen for volunteer updates
    db.collection('volunteers').onSnapshot(snapshot => {
        updateDashboardStats();
        if (typeof window.loadVolunteersTable === 'function') {
            window.loadVolunteersTable();
        }
    });
}

// Initialize Patient Management
async function initPatientManagement() {
    // Load patients table
    await loadPatientsTable();

    // Initialize search and filter
    initPatientSearch();

    // Initialize patient actions
    initPatientActions();
}

// Load Patients Table - Show ALL registered patients (no limit)
async function loadPatientsTable() {
    const tableBody = document.getElementById('patientsTableBody');
    if (!tableBody) return;

    try {
        const snapshot = await db.collection('patients')
            .orderBy('registrationDate', 'desc')
            .get();   // ← .limit(100) সরানো হয়েছে

        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No patients found</td>
                </tr>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const patient = doc.data();
            const status = calculatePatientStatus(patient);
            const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${esc(patient.registrationId)}</td>
                <td>${esc(patient.fullName)}</td>
                <td>${patient.age}</td>
                <td>${patient.gender}</td>
                <td>${formatPhoneNumber(patient.phone)}</td>
                <td>${formatFirestoreTimestamp(patient.registrationDate)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </td>
                <td>${patient.assignedDoctor || 'Not Assigned'}</td>
                <td>
                    <button class="btn-action view-patient" data-id="${doc.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action assign-doctor" data-id="${doc.id}">
                        <i class="fas fa-user-md"></i>
                    </button>
                    <button class="btn-action update-status" data-id="${doc.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        addPatientActionListeners();

    } catch (error) {
        console.error('Error loading patients:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center error">Error loading patients</td>
            </tr>
        `;
    }
}

// Initialize Patient Search
function initPatientSearch() {
    const searchInput = document.getElementById('patientSearch');
    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchPatients(this.value);
        }, 500);
    });
}

// Search Patients - searches across ALL registered patients (client-side substring match)
async function searchPatients(searchTerm) {
    if (!searchTerm.trim()) {
        await loadPatientsTable();
        return;
    }

    const tableBody = document.getElementById('patientsTableBody');
    if (!tableBody) return;

    try {
        // সব রোগী ফেচ করুন, তারপর client-side ফিল্টার করুন
        const snapshot = await db.collection('patients')
            .orderBy('registrationDate', 'desc')
            .get();

        const term = searchTerm.toLowerCase().trim();
        const cleanPhoneTerm = term.replace(/\D/g, '');

        const results = [];
        snapshot.forEach(doc => {
            const patient = doc.data();
            const matchesId = (patient.registrationId || '').toLowerCase().includes(term);
            const matchesName = (patient.fullName || '').toLowerCase().includes(term);
            const matchesPhone = cleanPhoneTerm
                ? (patient.phone || '').replace(/\D/g, '').includes(cleanPhoneTerm)
                : false;

            if (matchesId || matchesName || matchesPhone) {
                results.push(doc);
            }
        });

        tableBody.innerHTML = '';

        if (results.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No patients found for "${searchTerm}"</td>
                </tr>
            `;
            return;
        }

        results.forEach(doc => {
            const patient = doc.data();
            const status = calculatePatientStatus(patient);
            const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${esc(patient.registrationId)}</td>
                <td>${esc(patient.fullName)}</td>
                <td>${patient.age}</td>
                <td>${patient.gender}</td>
                <td>${formatPhoneNumber(patient.phone)}</td>
                <td>${formatFirestoreTimestamp(patient.registrationDate)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </td>
                <td>${patient.assignedDoctor || 'Not Assigned'}</td>
                <td>
                    <button class="btn-action view-patient" data-id="${doc.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action assign-doctor" data-id="${doc.id}">
                        <i class="fas fa-user-md"></i>
                    </button>
                    <button class="btn-action update-status" data-id="${doc.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        addPatientActionListeners();

    } catch (error) {
        console.error('Error searching patients:', error);
    }
}

// Add Patient Action Listeners
function addPatientActionListeners() {
    // View patient details
    document.querySelectorAll('.view-patient').forEach(btn => {
        btn.addEventListener('click', function () {
            const patientId = this.getAttribute('data-id');
            viewPatientDetails(patientId);
        });
    });

    // Assign doctor
    document.querySelectorAll('.assign-doctor').forEach(btn => {
        btn.addEventListener('click', function () {
            const patientId = this.getAttribute('data-id');
            assignDoctorToPatient(patientId);
        });
    });

    // Update status
    document.querySelectorAll('.update-status').forEach(btn => {
        btn.addEventListener('click', function () {
            const patientId = this.getAttribute('data-id');
            updatePatientStatus(patientId);
        });
    });
}

// View Patient Details
async function viewPatientDetails(patientId) {
    try {
        const doc = await db.collection('patients').doc(patientId).get();

        if (!doc.exists) {
            showAlert('Patient not found', 'danger');
            return;
        }

        const patient = doc.data();
        const status = calculatePatientStatus(patient);

        // Create modal with patient details
        const modalContent = `
            <div class="modal-header">
                <h3>Patient Details - ${esc(patient.registrationId)}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="patient-details-grid">
                    <div class="detail-group">
                        <h4>Personal Information</h4>
                        <p><strong>Full Name:</strong> ${esc(patient.fullName)}</p>
                        <p><strong>Age:</strong> ${patient.age}</p>
                        <p><strong>Gender:</strong> ${patient.gender}</p>
                        <p><strong>Phone:</strong> ${formatPhoneNumber(patient.phone)}</p>
                        <p><strong>Address:</strong> ${patient.address}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Medical Information</h4>
                        <p><strong>Blood Group:</strong> ${patient.bloodGroup || 'Not specified'}</p>
                        <p><strong>Allergy:</strong> ${patient.allergies || 'None reported'}</p>
                        <p><strong>Previous Medical History:</strong> ${patient.medicalHistory || 'None reported'}</p>
                        <p><strong>Previous Medicine:</strong> ${patient.previousMedications || 'None reported'}</p>
                        <p><strong>Patient BP:</strong> ${patient.bp || 'None reported'} mmHg</p>
                        <p><strong>Patient Weight:</strong> ${patient.weight || 'None reported'} KG</p>
                        <p><strong>Current Symptoms:</strong> ${patient.currentSymptoms || 'None reported'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Camp Information</h4>
                        <p><strong>Registration Date:</strong> ${formatFirestoreTimestamp(patient.registrationDate)}</p>
                        <p><strong>Status:</strong> <span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">${status}</span></p>
                        <p><strong>Assigned Doctor:</strong> ${patient.assignedDoctor || 'Not assigned'}</p>
                        ${patient.checkupStartTime ? `<p><strong>Checkup Started:</strong> ${formatFirestoreTimestamp(patient.checkupStartTime)}</p>` : ''}
                        ${patient.checkupEndTime ? `<p><strong>Checkup Completed:</strong> ${formatFirestoreTimestamp(patient.checkupEndTime)}</p>` : ''}
                        ${patient.waitTime ? `<p><strong>Wait Time:</strong> ${patient.waitTime} minutes</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-warning assign-doctor-from-details">
                    <i class="fas fa-user-md"></i> ${patient.assignedDoctor ? 'Assign/Change Doctor' : 'Assign Doctor'}
                </button>
                <button class="btn btn-primary print-details"><i class="fas fa-print"></i> Print Prescription</button>
            </div>
        `;

        showModal(modalContent);

        // Add event listeners
        document.querySelector('.close-modal').addEventListener('click', closeModal);
        document.querySelector('.print-details').addEventListener('click', () => printPatientPrescription(patient));
        document.querySelector('.assign-doctor-from-details').addEventListener('click', () => {
            // Details মডাল বন্ধ হয়ে assign মডাল খুলবে; success হলে আবার details মডাল refresh হবে
            assignDoctorToPatient(patientId, function () {
                viewPatientDetails(patientId);
            });
        });

    } catch (error) {
        console.error('Error viewing patient details:', error);
        showAlert('Error loading patient details', 'danger');
    }
}

// Assign Doctor to Patient
async function assignDoctorToPatient(patientId, onSuccess) {
    try {
        // Fetch available doctors
        const doctorsSnapshot = await db.collection('doctors')
            .where('isActive', '==', true)
            .get();

        if (doctorsSnapshot.empty) {
            showAlert('No active doctors available', 'warning');
            return;
        }

        const doctors = doctorsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Create modal with doctor selection
        const optionsHtml = doctors.map(doctor =>
            `<option value="${doctor.id}">Dr. ${esc(doctor.fullName)} (${doctor.specialization})</option>`
        ).join('');

        const modalContent = `
            <div class="modal-header">
                <h3>Assign Doctor</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="doctorSelect" class="form-label">Select Doctor:</label>
                    <select id="doctorSelect" class="form-control">
                        <option value="">-- Select a doctor --</option>
                        ${optionsHtml}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <button class="btn btn-primary assign-doctor-btn">Assign Doctor</button>
            </div>
        `;

        showModal(modalContent);

        // Add event listeners
        document.querySelector('.close-modal').addEventListener('click', closeModal);
        document.querySelector('.assign-doctor-btn').addEventListener('click', async () => {
            const doctorId = document.getElementById('doctorSelect').value;
            if (!doctorId) {
                showAlert('Please select a doctor', 'warning');
                return;
            }

            const selectedDoctor = doctors.find(d => d.id === doctorId);

            try {
                await db.collection('patients').doc(patientId).update({
                    assignedDoctor: `Dr. ${selectedDoctor.fullName}`,
                    assignedDoctorId: doctorId
                });

                showAlert('Doctor assigned successfully', 'success');
                closeModal();
                loadPatientsTable();

                // Patient Details থেকে এসে থাকলে সেটি refresh করে দেখানো হবে
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }

            } catch (error) {
                console.error('Error assigning doctor:', error);
                showAlert('Error assigning doctor', 'danger');
            }
        });

    } catch (error) {
        console.error('Error in assignDoctorToPatient:', error);
        showAlert('Error loading doctors', 'danger');
    }
}

// Update Patient Status
async function updatePatientStatus(patientId) {
    try {
        const doc = await db.collection('patients').doc(patientId).get();

        if (!doc.exists) {
            showAlert('Patient not found', 'danger');
            return;
        }

        const patient = doc.data();
        const currentStatus = calculatePatientStatus(patient);

        // Create modal with status options
        const modalContent = `
            <div class="modal-header">
                <h3>Update Patient Status</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Current Status: <strong>${currentStatus}</strong></label>
                </div>
                <div class="form-group">
                    <label for="statusSelect" class="form-label">Update Status To:</label>
                    <select id="statusSelect" class="form-control">
                        <option value="">-- Select new status --</option>
                        <option value="checkupStarted" ${currentStatus === 'Waiting' ? 'selected' : ''}>Start Checkup</option>
                        <option value="checkupCompleted" ${currentStatus === 'Under Checkup' ? 'selected' : ''}>Complete Checkup</option>
                        <option value="reset">Reset to Waiting</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <button class="btn btn-primary update-status-btn">Update Status</button>
            </div>
        `;

        showModal(modalContent);

        // Add event listeners
        document.querySelector('.close-modal').addEventListener('click', closeModal);
        document.querySelector('.update-status-btn').addEventListener('click', async () => {
            const statusAction = document.getElementById('statusSelect').value;

            if (!statusAction) {
                showAlert('Please select a status action', 'warning');
                return;
            }

            try {
                const updateData = {};
                const now = new Date();

                switch (statusAction) {
                    case 'checkupStarted':
                        updateData.checkupStarted = true;
                        updateData.checkupStartTime = now;
                        updateData.waitTime = Math.floor((now - patient.registrationDate.toDate()) / (1000 * 60));
                        break;
                    case 'checkupCompleted':
                        updateData.checkupCompleted = true;
                        updateData.checkupEndTime = now;
                        break;
                    case 'reset':
                        updateData.checkupStarted = false;
                        updateData.checkupCompleted = false;
                        updateData.checkupStartTime = null;
                        updateData.checkupEndTime = null;
                        break;
                }

                await db.collection('patients').doc(patientId).update(updateData);

                showAlert('Patient status updated successfully', 'success');
                closeModal();
                loadPatientsTable();

            } catch (error) {
                console.error('Error updating status:', error);
                showAlert('Error updating status', 'danger');
            }
        });

    } catch (error) {
        console.error('Error in updatePatientStatus:', error);
        showAlert('Error loading patient data', 'danger');
    }
}

// Print Patient Details
function printPatientDetails(patient) {
    const printWindow = window.open('', '_blank');
    const status = calculatePatientStatus(patient);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Details - ${esc(patient.registrationId)}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                h1 { color: #333; border-bottom: 2px solid #e63946; padding-bottom: 10px; }
                .detail-section { margin-bottom: 30px; }
                .detail-section h3 { color: #1d3557; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .detail-row { display: flex; margin-bottom: 10px; }
                .detail-label { font-weight: bold; width: 200px; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <h1>Roktojoba Foundation - Patient Details</h1>
            <div class="detail-section">
                <h3>Personal Information</h3>
                <div class="detail-row">
                    <div class="detail-label">Registration ID:</div>
                    <div>${esc(patient.registrationId)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Full Name:</div>
                    <div>${esc(patient.fullName)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Age / Gender:</div>
                    <div>${patient.age} / ${patient.gender}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div>${formatPhoneNumber(patient.phone)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Address:</div>
                    <div>${patient.address}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Medical Information</h3>
                <div class="detail-row">
                    <div class="detail-label">Blood Group:</div>
                    <div>${patient.bloodGroup || 'Not specified'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Medical History:</div>
                    <div>${patient.medicalHistory || 'None reported'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Current Symptoms:</div>
                    <div>${patient.currentSymptoms || 'None reported'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Allergies:</div>
                    <div>${patient.allergies || 'None reported'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Previous Medications:</div>
                    <div>${patient.previousMedications || 'None reported'}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Camp Information</h3>
                <div class="detail-row">
                    <div class="detail-label">Registration Date:</div>
                    <div>${formatFirestoreTimestamp(patient.registrationDate)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Assigned Doctor:</div>
                    <div>${patient.assignedDoctor || 'Not assigned'}</div>
                </div>
                ${patient.checkupStartTime ? `
                <div class="detail-row">
                    <div class="detail-label">Checkup Started:</div>
                    <div>${formatFirestoreTimestamp(patient.checkupStartTime)}</div>
                </div>
                ` : ''}
                ${patient.checkupEndTime ? `
                <div class="detail-row">
                    <div class="detail-label">Checkup Completed:</div>
                    <div>${formatFirestoreTimestamp(patient.checkupEndTime)}</div>
                </div>
                ` : ''}
                ${patient.waitTime ? `
                <div class="detail-row">
                    <div class="detail-label">Wait Time:</div>
                    <div>${patient.waitTime} minutes</div>
                </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p>Printed on: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}</p>
                <p>Roktojoba Foundation - Free Medical Camp | 16 December 2025 | Designed & Developed by Tasrik Hossain</p>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

// ---------------------------------------------------------------
// Print Prescription (A4) - design based on the outdoor ticket layout
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// Code 128 barcode (SVG) — scannable by phone cameras & USB scanners
// ---------------------------------------------------------------
const CODE128_PATTERNS = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

function code128Encode(text) {
    const s = String(text === undefined || text === null ? '' : text).replace(/[^\x20-\x7E]/g, '');
    if (!s) return null;

    const digitRun = pos => {
        let n = 0;
        while (pos + n < s.length && s[pos + n] >= '0' && s[pos + n] <= '9') n++;
        return n;
    };

    const codes = [];
    let mode = null;
    let i = 0;

    while (i < s.length) {
        const run = digitRun(i);

        if (mode === null) {
            if (run >= 4) {
                if (run % 2 === 0) {
                    codes.push(105); mode = 'C';
                } else {
                    codes.push(104);
                    codes.push(s.charCodeAt(i) - 32); i++;
                    codes.push(99); mode = 'C';
                }
            } else {
                codes.push(104); mode = 'B';
            }
            continue;
        }

        if (mode === 'C') {
            if (run >= 2) {
                codes.push(parseInt(s.substr(i, 2), 10)); i += 2;
            } else {
                codes.push(100); mode = 'B';
            }
            continue;
        }

        // mode B
        if (run >= 6 || (run >= 4 && i + run === s.length)) {
            if (run % 2 === 1) { codes.push(s.charCodeAt(i) - 32); i++; }
            codes.push(99); mode = 'C';
            continue;
        }
        codes.push(s.charCodeAt(i) - 32); i++;
    }

    let sum = codes[0];
    for (let k = 1; k < codes.length; k++) sum += codes[k] * k;
    codes.push(sum % 103);
    codes.push(106); // stop
    return codes;
}

function buildCode128Svg(text, height) {
    const codes = code128Encode(text);
    if (!codes) return '';

    const quiet = 10; // quiet zone (modules) on both sides
    let x = quiet;
    let bars = '';

    codes.forEach(code => {
        const pattern = CODE128_PATTERNS[code];
        for (let i = 0; i < pattern.length; i++) {
            const w = parseInt(pattern[i], 10);
            if (i % 2 === 0) {
                bars += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000"/>`;
            }
            x += w;
        }
    });

    const totalModules = x + quiet;
    const moduleWidth = Math.min(2, 225 / totalModules);   // px per module (≈0.36mm for a 11-char ID)
    const widthPx = (totalModules * moduleWidth).toFixed(1);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${height}" ` +
           `width="${widthPx}" height="${height}" preserveAspectRatio="none" shape-rendering="crispEdges" ` +
           `style="display:block;">${bars}</svg>`;
}

// Escape text before placing it into the prescription HTML
function escapePrescriptionText(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// dd-mm-yyyy hh:mm AM/PM (works with Firestore Timestamp, Date or string)
function formatPrescriptionDateTime(value) {
    let d;
    if (value && typeof value.toDate === 'function') d = value.toDate();
    else if (value instanceof Date) d = value;
    else if (value) d = new Date(value);
    else d = new Date();

    if (isNaN(d.getTime())) d = new Date();

    const pad = n => String(n).padStart(2, '0');
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(hours)}:${pad(d.getMinutes())} ${ampm}`;
}

// Print Patient Prescription (A4) — Investigation higher + bigger gap to Diagnosis
async function printPatientPrescription(patient) {
    // Popup with user gesture so it won't be blocked
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showAlert('Please allow pop-ups to print the prescription', 'warning');
        return;
    }

    const esc = escapePrescriptionText;

    let printedBy = 'Admin';
    try {
        const authData = JSON.parse(localStorage.getItem('adminAuth') || '{}');
        printedBy = authData.displayName || (authData.email ? authData.email.split('@')[0] : 'Admin');
    } catch (e) { /* keep default */ }

    // ── Doctor details (Name, Specialization, Hospital, BMDC, Phone) ──
    let doctorName = patient.assignedDoctor || 'Not assigned';
    let doctorSpecialization = '';
    let doctorHospital = 'N/A';
    let doctorRegNumber = 'N/A';
    let doctorPhone = 'N/A';

    if (patient.assignedDoctorId) {
        try {
            const doctorDoc = await db.collection('doctors').doc(patient.assignedDoctorId).get();
            if (doctorDoc.exists) {
                const docData = doctorDoc.data();
                doctorSpecialization = docData.specialization || '';
                doctorHospital = docData.hospital || 'N/A';
                doctorRegNumber = docData.registrationNumber || 'N/A';
                doctorPhone = docData.phone || 'N/A';
            }
        } catch (e) {
            console.warn('Could not fetch doctor details:', e);
        }
    }

    const logoUrl = new URL('assets/logo.png', window.location.href).href;
    const auroralogoUrl = new URL('assets/Aurora Logo.webp', window.location.href).href;

    // ── Print Date & Time: DD/MM/YYYY - HH:MM:SS AM/PM ──────────
    const now = new Date();
    const padN = n => String(n).padStart(2, '0');
    let printHours = now.getHours();
    const printAmpm = printHours >= 12 ? 'PM' : 'AM';
    printHours = printHours % 12 || 12;
    const printDate = `${padN(now.getDate())}/${padN(now.getMonth() + 1)}/${now.getFullYear()} - ` +
                      `${padN(printHours)}:${padN(now.getMinutes())}:${padN(now.getSeconds())} ${printAmpm}`;

    const visitDate = formatPrescriptionDateTime(patient.registrationDate);

    const barcode = buildCode128Svg(patient.registrationId, 40);

    const qrTarget = 'https://roktojobafoundation.github.io/qr/';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent(qrTarget)}`;

    let ccHtml = '';

    let middleHtml = '';
    if (patient.allergies) {
        middleHtml += `<div class="cc-line"><strong>Allergy:</strong> ${esc(patient.allergies)}</div>`;
    }
    if (patient.medicalHistory) {
        middleHtml += `<div class="cc-line"><strong>Previous Medical History:</strong> ${esc(patient.medicalHistory)}</div>`;
    }
    if (patient.previousMedications) {
        middleHtml += `<div class="cc-line"><strong>Previous Medicine:</strong> ${esc(patient.previousMedications)}</div>`;
    }
    if (patient.bp) {
        middleHtml += `<div class="cc-line"><strong>Patient BP:</strong> ${esc(patient.bp)} mmHg</div>`;
    }
    if (patient.weight) {
        middleHtml += `<div class="cc-line"><strong>Patient Weight:</strong> ${esc(patient.weight)} KG</div>`;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="bn">
        <head>
            <meta charset="UTF-8">
            <title>Prescription - ${esc(patient.registrationId)}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 0; }
                * { box-sizing: border-box; }
                html, body {
                    margin: 0; padding: 0;
                    background: #fff; color: #000;
                    font-family: 'Roboto', 'Noto Sans Bengali', Arial, sans-serif;
                    font-size: 13px;
                }
                .sheet {
                    width: 210mm; height: 297mm;
                    padding: 10mm 12mm 8mm;
                    display: flex; flex-direction: column;
                    page-break-after: avoid;
                }

                /* Header */
                .rx-header {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 12px; padding-bottom: 8px; border-bottom: 1px solid #000;
                }
                .header-left { flex-shrink: 0; width: 92px; display: flex; align-items: center; }
                .header-right {
                    flex-shrink: 0; width: 92px;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                }
                .logo-img { width: 78px; height: 78px; object-fit: contain; display: block; }
                .logo {
                    width: 74px; height: 74px; border-radius: 50%;
                    border: 3px solid #1d3557;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center; background: #fff;
                }
                .logo .drop { color: #e63946; font-size: 26px; line-height: 1; }
                .logo .abbr { font-weight: 700; font-size: 13px; color: #1d3557; letter-spacing: 1px; }
                .org { flex: 1; text-align: center; }
                .org h1 { margin: 0; font-size: 21px; font-weight: 700; color: #000000; }
                .org .bn { font-family: 'Noto Sans Bengali', sans-serif; font-size: 18px; font-weight: 500; margin-top: 2px; }
                .org .addr { font-size: 11px; margin-top: 3px; color: #222; }
                .qr-img { width: 82px; height: 82px; display: block; }
                .qr-label { font-size: 8.5px; font-weight: 700; text-align: center; margin-top: 2px; letter-spacing: 0.3px; color: #111; }

                /* Title row */
                .title-row {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 12px; padding: 6px 0; border-bottom: 1px solid #000;
                }
                .title-row .date { font-size: 12.5px; white-space: nowrap; }
                .title-row .date strong { font-weight: 700; }
                .title-row .title {
                    font-family: 'Noto Sans Bengali', sans-serif;
                    font-size: 18px; font-weight: 700; text-align: center; flex: 1;
                }
                .title-row .barcode {
                    width: 240px; flex-shrink: 0;
                    display: flex; flex-direction: column;
                    align-items: flex-start;
                    justify-content: flex-start;
                }

                .title-row .barcode .bc-label {
                    font-size: 10px; font-weight: 500;
                    margin-top: 2px; letter-spacing: 0.6px;
                    font-family: 'Roboto', Arial, sans-serif;
                    text-align: left;
                }

                /* Patient info */
                .info {
                    display: flex; flex-direction: column;
                    gap: 4px;
                    padding: 8px 0 10px;
                    font-size: 13px; line-height: 1.65;
                }
                .info-row {
                    display: flex; justify-content: space-between; gap: 20px;
                }
                .info .col-left { flex: 1.2; min-width: 0; }
                .info .col-right { flex: 1; }
                .info strong { font-weight: 700; }

                /* ── Doctor block: Name + Specialization below ── */
                .doctor-block {
                    display: flex;
                    align-items: flex-start;
                    gap: 3px;
                }
                .doctor-block strong { flex-shrink: 0; }
                .doctor-block .doctor-values {
                    flex: 1;
                    min-width: 0;
                }
                .doctor-specialization {
                    font-size: 12px;
                    color: #000000;
                    font-style: italic;
                    line-height: 1.25;
                    margin-top: 0;
                    margin-bottom: 0;
                }

                .info .address-line {
                    white-space: nowrap;
                    font-size: 11.5px;
                    width: 100%;
                    overflow: visible;
                }

                /* Main 2-column table */
                .rx-table {
                    flex: 1; display: flex; flex-direction: column;
                    border: 1px solid #000; min-height: 0;
                }
                .rx-table .head { display: flex; }
                .rx-table .head div {
                    background: #c9c9c9; border-bottom: 1px solid #000;
                    padding: 5px 8px;
                    font-family: 'Noto Sans Bengali', sans-serif;
                    font-weight: 700; font-size: 14px;
                }
                .rx-table .head .left, .rx-table .body .left { width: 29%; border-right: 1px solid #000; }
                .rx-table .head .right, .rx-table .body .right { flex: 1; }
                .rx-table .body { display: flex; flex: 1; min-height: 0; }
                .rx-table .body > div { padding: 8px; }

                .label-cc, .label-rx { font-weight: 700; font-size: 13px; margin-bottom: 6px; }
                .cc-line { font-size: 12.5px; line-height: 1.5; margin-bottom: 4px; word-break: break-word; }

                .body .left {
                    display: flex;
                    flex-direction: column;
                }
                .cc-top { flex-shrink: 0; }
                .flex-spacer-top    { flex: 1;     min-height: 8px; }
                .cc-middle {
                    flex-shrink: 0;
                    padding: 4px 0;
                }
                .flex-spacer-mid    { flex: 0.10;  min-height: 2px; }
                .cc-bottom          { flex-shrink: 0; }
                .flex-spacer-bottom { flex: 0.90;  min-height: 8px; }

                .section-label {
                    font-weight: 700; font-size: 13px;
                    margin-top: 6px; margin-bottom: 4px;
                }
                .investigation-space { height: 100px; }
                .diagnosis-space { height: 30px; }

                /* RIGHT column — Rx + Physician signature */
                .body .right {
                    display: flex;
                    flex-direction: column;
                }
                .signature-block {
                    margin-top: auto;
                    text-align: right;
                    padding-top: 40px;
                    padding-bottom: 6px;
                }
                .signature-line {
                    display: inline-block;
                    border-top: 1px solid #000;
                    padding-top: 3px;
                    font-size: 11px;
                    font-weight: 600;
                    min-width: 150px;
                    text-align: center;
                }

                /* Footer — QR at bottom-left + centered text */
                .rx-footer {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding-top: 8px;
                }
                .footer-qr {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .footer-qr .qr-img {
                    width: 60px;
                    height: 60px;
                    display: block;
                }
                .footer-qr .qr-label {
                    font-size: 6.5px;
                    font-weight: 700;
                    text-align: center;
                    margin-top: 1px;
                    letter-spacing: 0.2px;
                    color: #111;
                    white-space: nowrap;
                }
                .footer-text {
                    flex: 1;
                    text-align: center;
                }
                .footer-text .note {
                    font-family: 'Noto Sans Bengali', sans-serif;
                    font-size: 14px; font-weight: 500;
                }
                .footer-text .note strong { font-weight: 700; }
                .footer-text .sponsor { font-size: 12px; margin-top: 2px; }
                .footer-text .printed { font-size: 10.5px; margin-top: 2px; }

                html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @media print { html, body { width: 210mm; height: 297mm; } }
            </style>
        </head>
        <body>
            <div class="sheet">
                <div class="rx-header">
                    <div class="header-left">
                        <img class="logo-img" src="${logoUrl}" alt="Roktojoba Foundation"
                             onerror="this.style.display='none';document.getElementById('logoFallback').style.display='flex';">
                        <div class="logo" id="logoFallback" style="display:none;">
                            <div class="drop">&#10084;</div>
                            <div class="abbr">RJF</div>
                        </div>
                    </div>
                    <div class="org">
                        <h1>Roktojoba Foundation |  Aurora Specialized Hospital</h1>
                        <div class="bn">Free Medical Camp</div>
                        <div class="addr">Matlab (North), Chandpur. | Mobile: +880 1960-506601 | Email: roktojobafoundation@gmail.com</div>
                    </div>
                    <div class="header-right">
                        <img class="logo-img" src="${auroralogoUrl}" alt="Aurora Logo">
                    </div>
                </div>

                <div class="title-row">
                    <div class="date"><strong>Date :</strong> ${esc(printDate)}</div>
                    <div class="title"> Patient Prescription</div>
                    <div class="barcode">${barcode}</div>
                </div>

                <div class="info">
                    <div class="info-row">
                        <div class="col-left">
                            <div><strong>Patient ID :</strong> ${esc(patient.registrationId)}</div>
                            <div><strong>Patient Name :</strong> ${esc(patient.fullName)}</div>
                            <div><strong>Age / Gender :</strong> ${esc(patient.age)} - ${esc(patient.gender)}</div>
                            <div><strong>Blood Group :</strong> ${esc(patient.bloodGroup)}</div>
                            <div><strong>Mobile No :</strong> ${esc(patient.phone)}</div>
                        </div>
                        <div class="col-right">
                            <div class="doctor-block">
                                <strong>Doctor :</strong>
                                <div class="doctor-values">
                                    <div>${esc(doctorName)}</div>
                                    ${doctorSpecialization ? `<div class="doctor-specialization">${esc(doctorSpecialization)}</div>` : ''}
                                </div>
                            </div>
                            <div><strong>Hospital :</strong> ${esc(doctorHospital)}</div>
                            <div><strong>BMDC Reg. No :</strong> ${esc(doctorRegNumber)}</div>
                            <div><strong>Doctor Ass. Phone No :</strong> ${esc(doctorPhone)}</div>
                        </div>
                    </div>
                    <div class="address-line" id="addressLine"><strong>Address :</strong> ${esc(patient.address)}</div>
                </div>

                <div class="rx-table">
                    <div class="head">
                        <div class="left">রোগের বিবরণ ও পরীক্ষা সমূহ</div>
                        <div class="right">চিকিৎসা</div>
                    </div>
                    <div class="body">
                        <!-- LEFT COLUMN -->
                        <div class="left">
                            <div class="cc-top">
                                <div class="label-cc">C/C</div>
                                ${ccHtml}
                            </div>

                            <div class="flex-spacer-top"></div>

                            <div class="cc-middle">
                                ${middleHtml}
                            </div>

                            <div class="flex-spacer-mid"></div>

                            <div class="cc-bottom">
                                <div class="section-label">Diagnosis:</div>
                                <div class="investigation-space"></div>
                                <div class="section-label">Investigation:</div>
                                <div class="diagnosis-space"></div>
                            </div>

                            <div class="flex-spacer-bottom"></div>
                        </div>

                        <!-- RIGHT COLUMN -->
                        <div class="right">
                            <div class="label-rx">Rx</div>
                            <div class="signature-block">
                                <div class="signature-line">Physician's Signature</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rx-footer">
                    <div class="footer-qr">
                        <img class="qr-img" src="${qrUrl}" alt="QR Code">
                        <div class="qr-label">More info SCAN ME</div>
                    </div>
                    <div class="footer-text">
                        <div class="note"><strong>বিঃ দ্রঃ</strong> পরবর্তী ভিজিটের জন্য নিবন্ধন কার্ডটি অবশ্যই যত্ন সহকারে সংরক্ষন করে রাখুন। <strong>ধন্যবাদ</strong></div>
                        <div class="sponsor">Powered by <strong>FT Innovation</strong> | Our Medical Partnar <strong>Aurora Specialized Hospital Ltd.</strong></div>
                        <div class="printed">Roktojoba Foundation - Free Medical Camp | Software Designed & Developed by <strong>MD. Tasrik Hossain</strong></div>
                    </div>
                </div>
            </div>

            <script>
                function fitAddressLine() {
                    var el = document.getElementById('addressLine');
                    if (!el) return;
                    el.style.fontSize = '11.5px';
                    var maxW = el.clientWidth;
                    var fs = 11.5;
                    while (el.scrollWidth > maxW && fs > 8) {
                        fs -= 0.3;
                        el.style.fontSize = fs + 'px';
                    }
                }

                window.onload = function () {
                    fitAddressLine();
                    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
                    ready.then(function () {
                        setTimeout(function () {
                            fitAddressLine();
                            window.focus();
                            window.print();
                        }, 500);
                    });
                };
                window.onresize = fitAddressLine;
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
}

// Modal Utility Functions
function showModal(content) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal-content">
            ${content}
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Add close event
    modalOverlay.querySelector('.modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
        document.body.style.overflow = '';
    }
}

// Export functions for use in other files
window.adminUtils = {
    checkAdminAuth,
    initAdminLogin,
    updateUserInfo,
    initSidebarToggle,
    initLogout,
    updateDashboardStats,
    initAddPatient,
    initAddDoctor,
    initAddVolunteer,
    showModal,
    closeModal
};

// Initialize Add Patient Functionality
function initAddPatient() {
    const addPatientBtn = document.getElementById('addPatientBtn');
    if (!addPatientBtn || addPatientBtn.dataset.bound) return;
    addPatientBtn.dataset.bound = '1';

    addPatientBtn.addEventListener('click', function () {
        showAddPatientModal();
    });
}

// Show Add Patient Modal
function showAddPatientModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Add New Patient</h3>
            <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
            <form id="addPatientForm" class="modal-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Full Name *</label>
                        <input type="text" class="form-control" id="patientName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Age *</label>
                        <input type="number" class="form-control" id="patientAge" min="1" max="120" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Gender *</label>
                        <select class="form-control" id="patientGender" required>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" class="form-control" id="patientPhone" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="patientEmail">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Address *</label>
                    <textarea class="form-control" id="patientAddress" rows="2" required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Blood Group</label>
                        <select class="form-control" id="patientBloodGroup">
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Emergency Contact</label>
                        <input type="tel" class="form-control" id="patientEmergencyContact">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Medical History</label>
                    <textarea class="form-control" id="patientMedicalHistory" rows="2"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Current Symptoms</label>
                    <textarea class="form-control" id="patientSymptoms" rows="2"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Allergies</label>
                    <textarea class="form-control" id="patientAllergies" rows="2"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Previous Medications</label>
                    <textarea class="form-control" id="patientMedications" rows="2"></textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary close-modal">Cancel</button>
            <button class="btn btn-primary" id="submitPatientBtn">Add Patient</button>
        </div>
    `;

    showModal(modalContent);

    // Add event listeners
    document.querySelector('.close-modal').addEventListener('click', closeModal);

    document.getElementById('submitPatientBtn').addEventListener('click', async function () {
        await addNewPatient();
    });
}

// Add New Patient to Firestore
async function addNewPatient() {
    const form = document.getElementById('addPatientForm');
    if (!form.checkValidity()) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }

    try {
        const submitBtn = document.getElementById('submitPatientBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;

        // Generate registration ID
        const registrationId = 'RJF' + Date.now().toString().slice(-8);

        // Get current timestamp
        const now = new Date();

        // Create patient data
        const patientData = {
            registrationId: registrationId,
            fullName: document.getElementById('patientName').value.trim(),
            age: parseInt(document.getElementById('patientAge').value),
            gender: document.getElementById('patientGender').value,
            phone: document.getElementById('patientPhone').value.trim(),
            email: document.getElementById('patientEmail').value.trim() || '',
            address: document.getElementById('patientAddress').value.trim(),
            bloodGroup: document.getElementById('patientBloodGroup').value || '',
            emergencyContact: document.getElementById('patientEmergencyContact').value.trim() || '',
            medicalHistory: document.getElementById('patientMedicalHistory').value.trim() || '',
            currentSymptoms: document.getElementById('patientSymptoms').value.trim() || '',
            allergies: document.getElementById('patientAllergies').value.trim() || '',
            previousMedications: document.getElementById('patientMedications').value.trim() || '',
            registrationDate: now,
            checkupStarted: false,
            checkupCompleted: false,
            checkupStartTime: null,
            checkupEndTime: null,
            assignedDoctor: '',
            assignedDoctorId: '',
            waitTime: 0,
            status: 'Waiting',
            createdAt: now,
            updatedAt: now
        };

        // Add to Firestore
        await db.collection('patients').add(patientData);

        showAlert('Patient added successfully!', 'success');
        closeModal();

        // Refresh patients table
        if (typeof loadPatientsTable === 'function') {
            loadPatientsTable();
        }

        // Update dashboard stats
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }

    } catch (error) {
        console.error('Error adding patient:', error);
        showAlert('Error adding patient: ' + error.message, 'danger');
    } finally {
        const submitBtn = document.getElementById('submitPatientBtn');
        if (submitBtn) {
            submitBtn.innerHTML = 'Add Patient';
            submitBtn.disabled = false;
        }
    }
}

// Initialize Add Doctor Functionality
function initAddDoctor() {
    const addDoctorBtn = document.getElementById('addDoctorBtn');
    if (!addDoctorBtn || addDoctorBtn.dataset.bound) return;
    addDoctorBtn.dataset.bound = '1';

    addDoctorBtn.addEventListener('click', function () {
        showAddDoctorModal();
    });
}

// Show Add Doctor Modal
function initAddVolunteer() {
    const addVolunteerBtn = document.getElementById('addVolunteerBtn');
    if (!addVolunteerBtn || addVolunteerBtn.dataset.bound) return;
    addVolunteerBtn.dataset.bound = '1';

    addVolunteerBtn.addEventListener('click', function () {
        showAddVolunteerModal();
    });
}

// Show Add Volunteer Modal
function showAddVolunteerModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Add New Volunteer</h3>
            <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
            <form id="volunteerRegistrationForm">
                <!-- Step 1: Personal Information -->
                <div class="form-step active" id="step1">
                    <h3 class="section-subtitle" style="text-align: left; margin: 0 0 20px;">Personal Information</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="volunteerName" class="form-label">Full Name *</label>
                            <input type="text" id="volunteerName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="volunteerAge" class="form-label">Age *</label>
                            <input type="number" id="volunteerAge" class="form-control" min="18" max="70" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="volunteerGender" class="form-label">Gender *</label>
                            <select id="volunteerGender" class="form-control" required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="volunteerPhone" class="form-label">Phone Number *</label>
                            <input type="tel" id="volunteerPhone" class="form-control" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="volunteerEmail" class="form-label">Email Address</label>
                            <input type="email" id="volunteerEmail" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="volunteerEmergencyContact" class="form-label">Emergency Contact *</label>
                            <input type="tel" id="volunteerEmergencyContact" class="form-control" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="volunteerAddress" class="form-label">Full Address *</label>
                        <textarea id="volunteerAddress" class="form-control" rows="2" required></textarea>
                    </div>

                    <div class="form-navigation">
                        <button type="button" class="btn btn-primary next-step" data-next="step2">
                            Next <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 2: Background Information -->
                <div class="form-step" id="step2">
                    <h3 class="section-subtitle" style="text-align: left; margin: 0 0 20px;">Background Information</h3>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="volunteerOccupation" class="form-label">Education/Profession</label>
                            <input type="text" id="volunteerOccupation" class="form-control"
                                placeholder="Student, Teacher, Business, etc.">
                        </div>
                        <div class="form-group">
                            <label for="volunteerEducation" class="form-label">Education Level</label>
                            <select id="volunteerEducation" class="form-control">
                                <option value="">Select Education</option>
                                <option value="High School">High School</option>
                                <option value="College">College</option>
                                <option value="Bachelor's Degree">Bachelor's Degree</option>
                                <option value="Master's Degree">Master's Degree</option>
                                <option value="Doctorate">Doctorate</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="volunteerSkills" class="form-label">Skills & Qualifications</label>
                        <textarea id="volunteerSkills" class="form-control" rows="3"
                            placeholder="Medical knowledge, First aid training, Language skills, etc."></textarea>
                        <small class="form-text">List any skills that might be useful for the medical camp</small>
                    </div>

                    <div class="form-group">
                        <label for="previousExperience" class="form-label">Previous Volunteer Experience</label>
                        <textarea id="previousExperience" class="form-control" rows="3"
                            placeholder="Describe any previous volunteer work or similar experience"></textarea>
                    </div>

                    <div class="form-navigation">
                        <button type="button" class="btn btn-secondary prev-step" data-prev="step1">
                            <i class="fas fa-arrow-left"></i> Previous
                        </button>
                        <button type="button" class="btn btn-primary next-step" data-next="step3">
                            Next <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 3: Preferences -->
                <div class="form-step" id="step3">
                    <h3 class="section-subtitle" style="text-align: left; margin: 0 0 20px;">Volunteer Preferences</h3>

                    <div class="form-group">
                        <label for="preferredArea" class="form-label">Preferred Volunteer Area *</label>
                        <select id="preferredArea" class="form-control" required>
                            <option value="">Select preferred area</option>
                            <option value="registration">Registration Desk</option>
                            <option value="crowd_control">Crowd Control & Guidance</option>
                            <option value="patient_support">Patient Support & Assistance</option>
                            <option value="medicine_distribution">Medicine Distribution</option>
                            <option value="food_water">Food & Water Distribution</option>
                            <option value="cleanup">Cleanup & Maintenance</option>
                            <option value="transportation">Patient Transportation</option>
                            <option value="other">Anywhere Needed</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="volunteerAvailability" class="form-label">Availability *</label>
                        <select id="volunteerAvailability" class="form-control" required>
                            <option value="">Select availability</option>
                            <option value="full_day">Full Day (8 AM - 5 PM)</option>
                            <option value="morning">Morning Shift (8 AM - 1 PM)</option>
                            <option value="afternoon">Afternoon Shift (1 PM - 5 PM)</option>
                            <option value="flexible">Flexible - Any Shift</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">T-shirt Size</label>
                        <div class="size-options">
                            <label class="size-option">
                                <input type="radio" name="tshirtSize" value="S">
                                <span>S</span>
                            </label>
                            <label class="size-option">
                                <input type="radio" name="tshirtSize" value="M">
                                <span>M</span>
                            </label>
                            <label class="size-option">
                                <input type="radio" name="tshirtSize" value="L">
                                <span>L</span>
                            </label>
                            <label class="size-option">
                                <input type="radio" name="tshirtSize" value="XL">
                                <span>XL</span>
                            </label>
                            <label class="size-option">
                                <input type="radio" name="tshirtSize" value="XXL">
                                <span>XXL</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="additionalInfo" class="form-label">Additional Information</label>
                        <textarea id="additionalInfo" class="form-control" rows="3"
                            placeholder="Any other information you'd like to share..."></textarea>
                    </div>

                    <div class="form-navigation">
                        <button type="button" class="btn btn-secondary prev-step" data-prev="step2">
                            <i class="fas fa-arrow-left"></i> Previous
                        </button>
                        <button type="button" class="btn btn-primary next-step" data-next="step4">
                            Next <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 4: Review & Submit -->
                <div class="form-step" id="step4">
                    <h3 class="section-subtitle" style="text-align: left; margin: 0 0 20px;">Review & Submit</h3>

                    <div class="review-summary">
                        <h4>Please review your information:</h4>

                        <div class="review-section">
                            <h5>Personal Information</h5>
                            <div class="review-row">
                                <span class="review-label">Full Name:</span>
                                <span class="review-value" id="reviewName"></span>
                            </div>
                            <div class="review-row">
                                <span class="review-label">Age & Gender:</span>
                                <span class="review-value" id="reviewAgeGender"></span>
                            </div>
                            <div class="review-row">
                                <span class="review-label">Phone:</span>
                                <span class="review-value" id="reviewPhone"></span>
                            </div>
                            <div class="review-row">
                                <span class="review-label">Email:</span>
                                <span class="review-value" id="reviewEmail"></span>
                            </div>
                            <div class="review-row">
                                <span class="review-label">Address:</span>
                                <span class="review-value" id="reviewAddress"></span>
                            </div>
                        </div>

                        <div class="review-section">
                            <h5>Background Information</h5>
                            <div class="review-row">
                                <span class="review-label">Occupation:</span>
                                <span class="review-value" id="reviewOccupation"></span>
                            </div>
                            <div class="review-row">
                                <span class="review-label">Education:</span>
                                <span class="review-value" id="reviewEducation"></span>
                            </div>
                            <div class="review-row">
                                <span class="review-label">Skills:</span>
                                <span class="review-value" id="reviewSkills"></span>
                            </div>
                        </div>

                        <div class="review-section">
                            <h5>Volunteer Preferences</h5>
                            <div class="review-row">
                                <span class="review-label">Preferred Area:</span>
                                <span class="review-value" id="reviewArea"></span>
                            </div>
                            <div class="review-row">
                                <span class="review-label">Availability:</span>
                                <span class="review-value" id="reviewAvailability"></span>
                            </div>
                            <div class="review-row">
                                <span class="review-label">T-shirt Size:</span>
                                <span class="review-value" id="reviewTshirtSize"></span>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="form-check">
                            <input type="checkbox" id="termsAgreement" class="form-check-input" required>
                            <label for="termsAgreement" class="form-check-label">
                                I agree to the terms and conditions of volunteering *
                            </label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" id="healthDeclaration" class="form-check-input" required>
                            <label for="healthDeclaration" class="form-check-label">
                                I declare that I am in good health and able to perform volunteer duties *
                            </label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" id="photoConsent" class="form-check-input">
                            <label for="photoConsent" class="form-check-label">
                                I consent to photographs/videos being taken during the event
                            </label>
                        </div>
                    </div>

                    <div class="form-navigation">
                        <button type="button" class="btn btn-secondary prev-step" data-prev="step3">
                            <i class="fas fa-arrow-left"></i> Previous
                        </button>
                        <button type="submit" class="btn btn-primary" id="submitVolunteerBtn">
                            <i class="fas fa-check-circle"></i> Add Volunteer
                        </button>
                    </div>
                </div>

                <!-- Compatibility fields for existing addNewVolunteer() -->
                <input type="hidden" id="volunteerArea">
                <input type="hidden" id="volunteerHours">
                <input type="hidden" id="volunteerExperience">
                <input type="checkbox" id="volunteerCheckedIn" style="display:none;">
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary close-modal">Cancel</button>
        </div>
    `;

    showModal(modalContent);

    // Close handlers
    const closeBtn = document.querySelector('.close-modal');
    const modalCloseBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    const form = document.getElementById('volunteerRegistrationForm');
    const steps = form.querySelectorAll('.form-step');

    function showStep(stepId) {
        steps.forEach(step => step.classList.remove('active'));
        const target = document.getElementById(stepId);
        if (target) target.classList.add('active');
    }

    function validateStep(stepEl) {
        let valid = true;
        stepEl.querySelectorAll('[required]').forEach(field => {
            if (!field.checkValidity()) {
                field.reportValidity();
                valid = false;
            }
        });
        return valid;
    }

    // Next buttons
    form.querySelectorAll('.next-step').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = btn.closest('.form-step');
            if (!validateStep(currentStep)) return;

            const nextId = btn.dataset.next;
            if (nextId === 'step4') populateReview();
            showStep(nextId);
        });
    });

    // Previous buttons
    form.querySelectorAll('.prev-step').forEach(btn => {
        btn.addEventListener('click', () => {
            showStep(btn.dataset.prev);
        });
    });

    // Populate the review step
    function populateReview() {
        const val = id => (document.getElementById(id)?.value || '').trim();
        const selectedText = id => {
            const el = document.getElementById(id);
            return el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '';
        };

        document.getElementById('reviewName').textContent = val('volunteerName') || '-';

        const age = val('volunteerAge');
        const gender = val('volunteerGender');
        document.getElementById('reviewAgeGender').textContent =
            (age ? age + ' years' : '-') + (gender ? ', ' + gender : '');

        document.getElementById('reviewPhone').textContent = val('volunteerPhone') || '-';
        document.getElementById('reviewEmail').textContent = val('volunteerEmail') || '-';
        document.getElementById('reviewAddress').textContent = val('volunteerAddress') || '-';
        document.getElementById('reviewOccupation').textContent = val('volunteerOccupation') || '-';
        document.getElementById('reviewEducation').textContent = selectedText('volunteerEducation') || '-';
        document.getElementById('reviewSkills').textContent = val('volunteerSkills') || '-';
        document.getElementById('reviewArea').textContent = selectedText('preferredArea') || '-';
        document.getElementById('reviewAvailability').textContent = selectedText('volunteerAvailability') || '-';

        const tshirt = form.querySelector('input[name="tshirtSize"]:checked');
        document.getElementById('reviewTshirtSize').textContent = tshirt ? tshirt.value : '-';
    }

    // Submit handler
    form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    await addNewVolunteer();
});
}

// Add New Volunteer to Firestore — FIXED
async function addNewVolunteer() {
    // ✅ সঠিক ফর্ম ID
    const form = document.getElementById('volunteerRegistrationForm');

    if (!form) {
        showAlert('Volunteer registration form not found', 'danger');
        return;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitBtn = document.getElementById('submitVolunteerBtn');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

    try {
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            submitBtn.disabled = true;
        }

        const now = new Date();

        // ✅ T-shirt size রেডিও থেকে পড়ুন
        const tshirtInput = form.querySelector('input[name="tshirtSize"]:checked');
        const tshirtSize = tshirtInput ? tshirtInput.value : '';

        // ✅ Availability → আনুমানিক ঘণ্টা (NaN এড়ানোর জন্য)
        const availability = document.getElementById('volunteerAvailability').value;
        const availabilityHoursMap = {
            'full_day': 9,
            'morning': 5,
            'afternoon': 4,
            'flexible': 9
        };
        const availableHours = availabilityHoursMap[availability] || 0;

        // ✅ Volunteer data — সব ফিল্ড সরাসরি ফর্ম থেকে
        const volunteerData = {
            fullName: document.getElementById('volunteerName').value.trim(),
            age: parseInt(document.getElementById('volunteerAge').value, 10) || 0,
            gender: document.getElementById('volunteerGender').value,
            phone: document.getElementById('volunteerPhone').value.trim(),
            email: document.getElementById('volunteerEmail').value.trim() || '',
            emergencyContact: document.getElementById('volunteerEmergencyContact').value.trim() || '',
            address: document.getElementById('volunteerAddress').value.trim() || '',

            occupation: document.getElementById('volunteerOccupation').value.trim() || '',
            education: document.getElementById('volunteerEducation').value || '',
            skills: document.getElementById('volunteerSkills').value.trim() || '',
            previousExperience: document.getElementById('previousExperience').value.trim() || '',

            preferredArea: document.getElementById('preferredArea').value,
            availability: availability,
            tshirtSize: tshirtSize,
            additionalInfo: document.getElementById('additionalInfo').value.trim() || '',

            specialSkills: document.getElementById('volunteerSkills').value.trim() || '',

            availableHours: availableHours,
            checkedIn: false,
            checkedInTime: null,
            assignedTask: '',
            status: 'Registered',
            hoursWorked: 0,

            createdAt: now,
            registrationDate: now,
            lastActivity: now
        };

        // Firestore-এ যোগ করুন
        await db.collection('volunteers').add(volunteerData);

        showAlert('Volunteer added successfully!', 'success');
        closeModal();

        // টেবিল রিফ্রেশ
        if (typeof loadVolunteersTable === 'function') {
            loadVolunteersTable();
        }

        // ড্যাশবোর্ড স্ট্যাট আপডেট
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }

    } catch (error) {
        console.error('Error adding volunteer:', error);
        showAlert('Error adding volunteer: ' + error.message, 'danger');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalBtnHtml || '<i class="fas fa-check-circle"></i> Add Volunteer';
            submitBtn.disabled = false;
        }
    }
}

// Enhanced Patient Search Functionality - UPDATED
function initAdvancedPatientSearch() {
    const searchInput = document.getElementById('patientSearch');
    if (!searchInput) return;

    let searchTimeout;

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function () {
            document.getElementById('patientSearch').value = '';
            document.getElementById('patientStatusFilter').value = '';
            document.getElementById('patientDoctorFilter').value = '';

            const genderFilterEl = document.getElementById('patientGenderFilter');
            if (genderFilterEl) genderFilterEl.value = '';

            loadPatientsTable();
        });
    }

    // Status filter
    const statusFilter = document.getElementById('patientStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            applyPatientFilters();
        });
    }

    // Gender filter
    const genderFilter = document.getElementById('patientGenderFilter');
    if (genderFilter) {
        genderFilter.addEventListener('change', function () {
            applyPatientFilters();
        });
    }

    // Doctor filter (populate from Firestore)
    const doctorFilter = document.getElementById('patientDoctorFilter');
    if (doctorFilter) {
        populateDoctorFilter();
    }

    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyPatientFilters();
        }, 500);
    });
}

// Populate Doctor Filter Dropdown - FIXED
async function populateDoctorFilter() {
    const doctorFilter = document.getElementById('patientDoctorFilter');
    if (!doctorFilter) return;

    // Prevent duplicate change listeners
    if (!doctorFilter.dataset.bound) {
        doctorFilter.addEventListener('change', function () {
            applyPatientFilters();
        });
        doctorFilter.dataset.bound = '1';
    }

    try {
        const snapshot = await db.collection('doctors')
            .where('isActive', '==', true)
            .get();

        // প্রথম option (All) বাদে বাকি সব মুছে ফেলুন
        while (doctorFilter.options.length > 1) {
            doctorFilter.remove(1);
        }

        // "Not Assigned" option যোগ করুন
        const notAssignedOpt = document.createElement('option');
        notAssignedOpt.value = '__not_assigned__';
        notAssignedOpt.textContent = 'Not Assigned';
        doctorFilter.appendChild(notAssignedOpt);

        snapshot.forEach(doc => {
            const doctor = doc.data();
            const option = document.createElement('option');
            // FIX: patient.assignedDoctor-এ যেভাবে সেভ হয় ঠিক সেভাবেই value
            option.value = `Dr. ${doctor.fullName}`;
            option.textContent = `Dr. ${esc(doctor.fullName)} (${doctor.specialization})`;
            doctorFilter.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading doctors for filter:', error);
    }
}

// Apply All Patient Filters - FIXED (Doctor + Not Assigned + Gender)
async function applyPatientFilters() {
    const searchTerm = document.getElementById('patientSearch').value.trim();
    const statusFilter = document.getElementById('patientStatusFilter').value;
    const doctorFilter = document.getElementById('patientDoctorFilter').value;

    // Gender filter (যদি HTML-এ থাকে)
    const genderFilterEl = document.getElementById('patientGenderFilter');
    const genderFilter = genderFilterEl ? genderFilterEl.value : '';

    const tableBody = document.getElementById('patientsTableBody');
    if (!tableBody) return;

    // কোনো ফিল্টার নেই → সব রোগী দেখান
    if (!searchTerm && !statusFilter && !doctorFilter && !genderFilter) {
        await loadPatientsTable();
        return;
    }

    try {
        const snapshot = await db.collection('patients')
            .orderBy('registrationDate', 'desc')
            .get();

        const term = searchTerm.toLowerCase().trim();
        const cleanPhoneTerm = term.replace(/\D/g, '');
        const filteredPatients = [];

        snapshot.forEach(doc => {
            const patient = doc.data();

            // Search filter (name / id / phone — substring match)
            if (term) {
                const matchesId = (patient.registrationId || '').toLowerCase().includes(term);
                const matchesName = (patient.fullName || '').toLowerCase().includes(term);
                const matchesPhone = cleanPhoneTerm
                    ? (patient.phone || '').replace(/\D/g, '').includes(cleanPhoneTerm)
                    : false;

                if (!matchesId && !matchesName && !matchesPhone) return;
            }

            // Status filter
            if (statusFilter) {
                const status = calculatePatientStatus(patient);
                if (status !== statusFilter) return;
            }

            // Doctor filter (FIXED + Not Assigned support)
            if (doctorFilter) {
                if (doctorFilter === '__not_assigned__') {
                    // assignedDoctor খালি / নেই → সেগুলো দেখাবে
                    const hasDoctor = patient.assignedDoctor &&
                                      patient.assignedDoctor !== '' &&
                                      patient.assignedDoctor !== 'Not Assigned';
                    if (hasDoctor) return;
                } else {
                    if (patient.assignedDoctor !== doctorFilter) return;
                }
            }

            // Gender filter (Male / Female / Other)
            if (genderFilter) {
                if ((patient.gender || '') !== genderFilter) return;
            }

            filteredPatients.push({ id: doc.id, ...patient });
        });

        displayFilteredPatients(filteredPatients);

        // Update count
        const patientCount = document.getElementById('patientCount');
        if (patientCount) {
            patientCount.textContent = `${filteredPatients.length} patients`;
        }

    } catch (error) {
        console.error('Error applying filters:', error);
        showAlert('Error applying filters', 'danger');
    }
}

// Display Filtered Patients
function displayFilteredPatients(patients) {
    const tableBody = document.getElementById('patientsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (patients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">No patients found matching your criteria</td>
            </tr>
        `;
        return;
    }

    patients.forEach(patient => {
        const status = calculatePatientStatus(patient);
        const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${esc(patient.registrationId)}</td>
            <td>${esc(patient.fullName)}</td>
            <td>${patient.age}</td>
            <td>${patient.gender}</td>
            <td>${formatPhoneNumber(patient.phone)}</td>
            <td>${formatFirestoreTimestamp(patient.registrationDate)}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${status}
                </span>
            </td>
            <td>${patient.assignedDoctor || 'Not Assigned'}</td>
            <td>
                <button class="btn-action view-patient" data-id="${patient.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action assign-doctor" data-id="${patient.id}">
                    <i class="fas fa-user-md"></i>
                </button>
                <button class="btn-action update-status" data-id="${patient.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Update count
    const patientCount = document.getElementById('patientCount');
    if (patientCount) {
        patientCount.textContent = `${patients.length} patients`;
    }

    // Add event listeners to action buttons
    addPatientActionListeners();
}
// Doctor Management - Updated Version
async function initDoctorManagement() {
    await loadDoctorsTable();
    initAddDoctor();
    initDoctorActions();
}

// Load Doctors Table
async function loadDoctorsTable() {
    const tableBody = document.getElementById('doctorsTableBody');
    if (!tableBody) return;

    try {
        const snapshot = await db.collection('doctors')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No doctors found</td>
                </tr>
            `;
            return;
        }

        // Calculate stats
        const activeDoctors = snapshot.docs.filter(d => d.data().isActive);
        const totalPatients = snapshot.docs.reduce((sum, doc) => sum + (doc.data().patientsToday || 0), 0);
        const avgPatientsPerDoctor = snapshot.size > 0 ? Math.round(totalPatients / snapshot.size) : 0;

        snapshot.forEach(doc => {
            const doctor = doc.data();
            const statusClass = doctor.isActive ? 'status-active' : 'status-inactive';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doctor.doctorId || 'N/A'}</td>
                <td>Dr. ${esc(doctor.fullName)}</td>
                <td>${doctor.specialization}</td>
                <td>${formatPhoneNumber(doctor.phone)}</td>
                <td>${esc(doctor.email)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${doctor.patientsToday || 0}</td>
                <td>${doctor.avgCheckupTime || 0} min</td>
                <td>
                    <button class="btn-action view-doctor" data-id="${doc.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit-doctor" data-id="${doc.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action toggle-doctor" data-id="${doc.id}" data-active="${doctor.isActive}">
                        <i class="fas fa-power-off"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Update small stats cards
        document.getElementById('totalDoctorsSmall').textContent = snapshot.size;
        document.getElementById('activeDoctorsSmall').textContent = activeDoctors.length;
        document.getElementById('avgPatientsPerDoctor').textContent = avgPatientsPerDoctor;

    } catch (error) {
        console.error('Error loading doctors:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center error">Error loading doctors</td>
            </tr>
        `;
    }
}

// Initialize Doctor Actions
function initDoctorActions() {
    document.addEventListener('click', function (e) {
        // View doctor details
        if (e.target.closest('.view-doctor')) {
            const doctorId = e.target.closest('.view-doctor').getAttribute('data-id');
            viewDoctorDetails(doctorId);
        }

        // Edit doctor
        if (e.target.closest('.edit-doctor')) {
            const doctorId = e.target.closest('.edit-doctor').getAttribute('data-id');
            editDoctor(doctorId);
        }

        // Toggle doctor status
        if (e.target.closest('.toggle-doctor')) {
            const doctorId = e.target.closest('.toggle-doctor').getAttribute('data-id');
            const isActive = e.target.closest('.toggle-doctor').getAttribute('data-active') === 'true';
            toggleDoctorStatus(doctorId, !isActive);
        }
    });
}

// Show Add Doctor Modal - Updated with password field
function showAddDoctorModal() {
    const modalContent = `
        <div class="modal-header">
            <h3>Add New Doctor</h3>
            <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
            <form id="addDoctorForm" class="modal-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Full Name *</label>
                        <input type="text" class="form-control" id="doctorName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Specialization *</label>
                        <select class="form-control" id="doctorSpecialization" required>
                            <option value="">Select Specialization</option>
                            <option value="General Physician">General Physician</option>
                            <option value="Cardiologist">Cardiologist</option>
                            <option value="Dermatologist">Dermatologist</option>
                            <option value="Pediatrician">Pediatrician</option>
                            <option value="Gynecologist">Gynecologist</option>
                            <option value="Orthopedic">Orthopedic</option>
                            <option value="Neurologist">Neurologist</option>
                            <option value="Psychiatrist">Psychiatrist</option>
                            <option value="ENT Specialist">ENT Specialist</option>
                            <option value="Dentist">Dentist</option>
                            <option value="Eye Specialist">Eye Specialist</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" class="form-control" id="doctorPhone" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-control" id="doctorEmail" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Password *</label>
                        <input type="password" class="form-control" id="doctorPassword" required minlength="6">
                        <small class="form-text text-muted">Minimum 6 characters</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password *</label>
                        <input type="password" class="form-control" id="doctorConfirmPassword" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Registration Number</label>
                        <input type="text" class="form-control" id="doctorRegNumber">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Years of Experience</label>
                        <input type="number" class="form-control" id="doctorExperience" min="0" max="50">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Hospital/Clinic</label>
                        <input type="text" class="form-control" id="doctorHospital">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Availability *</label>
                        <select class="form-control" id="doctorAvailability" required>
                            <option value="Full Day">Full Day</option>
                            <option value="Morning Shift">Morning Shift</option>
                            <option value="Evening Shift">Evening Shift</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-control" id="doctorAddress" rows="2"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" id="doctorNotes" rows="2"></textarea>
                </div>
                
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="doctorIsActive" checked>
                    <label class="form-check-label" for="doctorIsActive">Active</label>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary close-modal">Cancel</button>
            <button class="btn btn-primary" id="submitDoctorBtn">Add Doctor</button>
        </div>
    `;

    showModal(modalContent);

    // Add event listeners
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('submitDoctorBtn').addEventListener('click', async function () {
        await addNewDoctor();
    });
}

// Add New Doctor with Firebase Authentication
async function addNewDoctor() {
    const form = document.getElementById('addDoctorForm');
    if (!form.checkValidity()) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }

    // Validate passwords match
    const password = document.getElementById('doctorPassword').value;
    const confirmPassword = document.getElementById('doctorConfirmPassword').value;

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'danger');
        return;
    }

    try {
        const submitBtn = document.getElementById('submitDoctorBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;

        const email = document.getElementById('doctorEmail').value.trim();
        const fullName = document.getElementById('doctorName').value.trim();

        // Check if email already exists in Firebase Auth
        const signInMethods = await auth.fetchSignInMethodsForEmail(email);

        let userCredential;

        if (signInMethods.length > 0) {
            // User already exists in Auth
            showAlert('A user with this email already exists', 'warning');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Create user in Firebase Authentication
        userCredential = await auth.createUserWithEmailAndPassword(email, password);

        // Update display name
        await userCredential.user.updateProfile({
            displayName: `Dr. ${fullName}`
        });

        // Generate Doctor ID
        const doctorId = 'DOC' + Date.now().toString().slice(-6);

        // Get current timestamp
        const now = new Date();

        // Create doctor data for Firestore
        const doctorData = {
            doctorId: doctorId,
            uid: userCredential.user.uid,
            fullName: fullName,
            specialization: document.getElementById('doctorSpecialization').value,
            phone: document.getElementById('doctorPhone').value.trim(),
            email: email,
            registrationNumber: document.getElementById('doctorRegNumber').value.trim() || '',
            yearsOfExperience: parseInt(document.getElementById('doctorExperience').value) || 0,
            hospital: document.getElementById('doctorHospital').value.trim() || '',
            availability: document.getElementById('doctorAvailability').value,
            address: document.getElementById('doctorAddress').value.trim() || '',
            notes: document.getElementById('doctorNotes').value.trim() || '',
            isActive: document.getElementById('doctorIsActive').checked,
            patientsToday: 0,
            totalPatients: 0,
            avgCheckupTime: 0,
            status: 'Available',
            userType: 'doctor',
            createdAt: now,
            lastActivity: now
        };

        // Add to Firestore 'doctors' collection
        await db.collection('doctors').doc(userCredential.user.uid).set(doctorData);

        // Also add to 'users' collection for authentication
        await db.collection('users').doc(userCredential.user.uid).set({
            uid: userCredential.user.uid,
            email: email,
            displayName: `Dr. ${fullName}`,
            userType: 'doctor',
            role: 'doctor',
            specialization: doctorData.specialization,
            isActive: doctorData.isActive,
            createdAt: now,
            lastLogin: null
        });

        // Sign out the admin user
        await auth.signOut();

        // Sign back in as admin (you should have stored admin credentials securely)
        // For demo purposes, we'll redirect to login
        showAlert('Doctor added successfully! Doctor can now login to the Doctor Assistant Portal.', 'success');
        closeModal();

        // Refresh doctors table
        if (typeof loadDoctorsTable === 'function') {
            loadDoctorsTable();
        }

        // Update dashboard stats
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }

        // Note: In production, you should use Firebase Functions to create users
        // or re-authenticate the admin after creating the doctor

    } catch (error) {
        console.error('Error adding doctor:', error);

        let errorMessage = 'Error adding doctor: ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'Email is already in use';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address';
                break;
            case 'auth/operation-not-allowed':
                errorMessage += 'Email/password accounts are not enabled';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password is too weak';
                break;
            default:
                errorMessage += error.message || 'An unknown error occurred';
        }

        showAlert(errorMessage, 'danger');
    } finally {
        const submitBtn = document.getElementById('submitDoctorBtn');
        if (submitBtn) {
            submitBtn.innerHTML = 'Add Doctor';
            submitBtn.disabled = false;
        }
    }
}

// View Doctor Details
async function viewDoctorDetails(doctorId) {
    try {
        const doc = await db.collection('doctors').doc(doctorId).get();

        if (!doc.exists) {
            showAlert('Doctor not found', 'danger');
            return;
        }

        const doctor = doc.data();
        const patientsSnapshot = await db.collection('patients')
            .where('assignedDoctorId', '==', doctorId)
            .get();

        const modalContent = `
            <div class="modal-header">
                <h3>Doctor Details - Dr. ${esc(doctor.fullName)}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="doctor-details-grid">
                    <div class="detail-group">
                        <h4>Personal Information</h4>
                        <p><strong>Doctor ID:</strong> ${doctor.doctorId}</p>
                        <p><strong>Full Name:</strong> Dr. ${esc(doctor.fullName)}</p>
                        <p><strong>Email:</strong> ${esc(doctor.email)}</p>
                        <p><strong>Phone:</strong> ${formatPhoneNumber(doctor.phone)}</p>
                        <p><strong>Specialization:</strong> ${doctor.specialization}</p>
                        <p><strong>Status:</strong> 
                            <span class="status-badge ${doctor.isActive ? 'status-active' : 'status-inactive'}">
                                ${doctor.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Professional Information</h4>
                        <p><strong>Registration Number:</strong> ${doctor.registrationNumber || 'N/A'}</p>
                        <p><strong>Years of Experience:</strong> ${doctor.yearsOfExperience || 0}</p>
                        <p><strong>Hospital/Clinic:</strong> ${doctor.hospital || 'N/A'}</p>
                        <p><strong>Availability:</strong> ${doctor.availability}</p>
                        <p><strong>Address:</strong> ${doctor.address || 'N/A'}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Performance Statistics</h4>
                        <p><strong>Patients Today:</strong> ${doctor.patientsToday || 0}</p>
                        <p><strong>Total Patients:</strong> ${doctor.totalPatients || 0}</p>
                        <p><strong>Average Checkup Time:</strong> ${doctor.avgCheckupTime || 0} minutes</p>
                        <p><strong>Current Assigned Patients:</strong> ${patientsSnapshot.size}</p>
                        <p><strong>Account Created:</strong> ${formatFirestoreTimestamp(doctor.createdAt)}</p>
                    </div>
                </div>
                
                <div class="notes-section">
                    <h4>Notes</h4>
                    <p>${doctor.notes || 'No notes available'}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
            </div>
        `;

        showModal(modalContent);

    } catch (error) {
        console.error('Error viewing doctor details:', error);
        showAlert('Error loading doctor details', 'danger');
    }
}

// Edit Doctor
async function editDoctor(doctorId) {
    try {
        const doc = await db.collection('doctors').doc(doctorId).get();

        if (!doc.exists) {
            showAlert('Doctor not found', 'danger');
            return;
        }

        const doctor = doc.data();

        const modalContent = `
            <div class="modal-header">
                <h3>Edit Doctor - Dr. ${esc(doctor.fullName)}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editDoctorForm" class="modal-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Full Name *</label>
                            <input type="text" class="form-control" id="editDoctorName" value="${esc(doctor.fullName)}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Specialization *</label>
                            <select class="form-control" id="editDoctorSpecialization" required>
                                <option value="">Select Specialization</option>
                                <option value="General Physician" ${doctor.specialization === 'General Physician' ? 'selected' : ''}>General Physician</option>
                                <option value="Cardiologist" ${doctor.specialization === 'Cardiologist' ? 'selected' : ''}>Cardiologist</option>
                                <option value="Dermatologist" ${doctor.specialization === 'Dermatologist' ? 'selected' : ''}>Dermatologist</option>
                                <option value="Pediatrician" ${doctor.specialization === 'Pediatrician' ? 'selected' : ''}>Pediatrician</option>
                                <option value="Gynecologist" ${doctor.specialization === 'Gynecologist' ? 'selected' : ''}>Gynecologist</option>
                                <option value="Orthopedic" ${doctor.specialization === 'Orthopedic' ? 'selected' : ''}>Orthopedic</option>
                                <option value="Other" ${doctor.specialization === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Phone Number *</label>
                            <input type="tel" class="form-control" id="editDoctorPhone" value="${doctor.phone}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" id="editDoctorEmail" value="${esc(doctor.email)}" required readonly>
                            <small class="form-text text-muted">Email cannot be changed</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Registration Number</label>
                            <input type="text" class="form-control" id="editDoctorRegNumber" value="${doctor.registrationNumber || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Years of Experience</label>
                            <input type="number" class="form-control" id="editDoctorExperience" value="${doctor.yearsOfExperience || 0}" min="0" max="50">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Hospital/Clinic</label>
                            <input type="text" class="form-control" id="editDoctorHospital" value="${doctor.hospital || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Availability *</label>
                            <select class="form-control" id="editDoctorAvailability" required>
                                <option value="Full Day" ${doctor.availability === 'Full Day' ? 'selected' : ''}>Full Day</option>
                                <option value="Morning Shift" ${doctor.availability === 'Morning Shift' ? 'selected' : ''}>Morning Shift</option>
                                <option value="Evening Shift" ${doctor.availability === 'Evening Shift' ? 'selected' : ''}>Evening Shift</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <textarea class="form-control" id="editDoctorAddress" rows="2">${doctor.address || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-control" id="editDoctorNotes" rows="2">${doctor.notes || ''}</textarea>
                    </div>
                    
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="editDoctorIsActive" ${doctor.isActive ? 'checked' : ''}>
                        <label class="form-check-label" for="editDoctorIsActive">Active</label>
                    </div>
                    
                    <div class="form-group mt-3">
                        <label class="form-label">Reset Password</label>
                        <input type="password" class="form-control" id="editDoctorNewPassword" placeholder="Leave blank to keep current password">
                        <small class="form-text text-muted">Only enter if you want to change the password</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <button class="btn btn-primary" id="updateDoctorBtn">Update Doctor</button>
            </div>
        `;

        showModal(modalContent);

        document.querySelector('.close-modal').addEventListener('click', closeModal);
        document.getElementById('updateDoctorBtn').addEventListener('click', async () => {
            await updateDoctor(doctorId, doctor.email);
        });

    } catch (error) {
        console.error('Error editing doctor:', error);
        showAlert('Error loading doctor data', 'danger');
    }
}

// Update Doctor Information
async function updateDoctor(doctorId, originalEmail) {
    const form = document.getElementById('editDoctorForm');
    if (!form.checkValidity()) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }

    try {
        const submitBtn = document.getElementById('updateDoctorBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitBtn.disabled = true;

        const newPassword = document.getElementById('editDoctorNewPassword').value;
        const updateData = {
            fullName: document.getElementById('editDoctorName').value.trim(),
            specialization: document.getElementById('editDoctorSpecialization').value,
            phone: document.getElementById('editDoctorPhone').value.trim(),
            registrationNumber: document.getElementById('editDoctorRegNumber').value.trim() || '',
            yearsOfExperience: parseInt(document.getElementById('editDoctorExperience').value) || 0,
            hospital: document.getElementById('editDoctorHospital').value.trim() || '',
            availability: document.getElementById('editDoctorAvailability').value,
            address: document.getElementById('editDoctorAddress').value.trim() || '',
            notes: document.getElementById('editDoctorNotes').value.trim() || '',
            isActive: document.getElementById('editDoctorIsActive').checked,
            updatedAt: new Date()
        };

        // Update Firestore doctor document
        await db.collection('doctors').doc(doctorId).update(updateData);

        // Also update users collection
        await db.collection('users').doc(doctorId).update({
            displayName: `Dr. ${updateData.fullName}`,
            specialization: updateData.specialization,
            isActive: updateData.isActive,
            updatedAt: new Date()
        });

        // Update Firebase Auth display name
        const user = auth.currentUser;
        if (user && user.uid === doctorId) {
            await user.updateProfile({
                displayName: `Dr. ${updateData.fullName}`
            });
        }

        // Update password if provided
        if (newPassword && newPassword.length >= 6) {
            try {
                // Note: In production, this should be done via Firebase Functions
                // or require re-authentication
                if (user && user.uid === doctorId) {
                    await user.updatePassword(newPassword);
                }
            } catch (passwordError) {
                console.warn('Could not update password:', passwordError);
                // Don't fail the whole update if password update fails
            }
        }

        showAlert('Doctor updated successfully!', 'success');
        closeModal();
        loadDoctorsTable();

    } catch (error) {
        console.error('Error updating doctor:', error);
        showAlert('Error updating doctor: ' + error.message, 'danger');
    } finally {
        const submitBtn = document.getElementById('updateDoctorBtn');
        if (submitBtn) {
            submitBtn.innerHTML = 'Update Doctor';
            submitBtn.disabled = false;
        }
    }
}

// Toggle Doctor Status
async function toggleDoctorStatus(doctorId, newStatus) {
    try {
        await db.collection('doctors').doc(doctorId).update({
            isActive: newStatus,
            status: newStatus ? 'Available' : 'Inactive',
            updatedAt: new Date()
        });

        // Also update users collection
        await db.collection('users').doc(doctorId).update({
            isActive: newStatus,
            updatedAt: new Date()
        });

        showAlert(`Doctor ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
        loadDoctorsTable();

    } catch (error) {
        console.error('Error toggling doctor status:', error);
        showAlert('Error updating doctor status', 'danger');
    }
}

// Doctor Login Functionality (for doctor-portal.html)
async function doctorLogin(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Check if user is a doctor
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists || userDoc.data().userType !== 'doctor') {
            await auth.signOut();
            throw new Error('Access denied. Not a registered doctor.');
        }

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

        // Store doctor info in localStorage
        localStorage.setItem('doctorAuth', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isDoctor: true,
            specialization: doctorData.specialization,
            doctorId: doctorData.doctorId
        }));

        // Update last login time
        await db.collection('doctors').doc(user.uid).update({
            lastLogin: new Date()
        });

        await db.collection('users').doc(user.uid).update({
            lastLogin: new Date()
        });

        return { success: true, doctor: doctorData };

    } catch (error) {
        console.error('Doctor login error:', error);
        throw error;
    }
}

// Export doctor management functions
window.doctorManagement = {
    initDoctorManagement,
    loadDoctorsTable,
    addNewDoctor,
    doctorLogin,
    toggleDoctorStatus
};

// Initialize Volunteer Management
async function initVolunteerManagement() {
    await loadVolunteersTable();
    initAddVolunteer();
}

// Load Volunteers Table
async function loadVolunteersTable() {
    const tableBody = document.getElementById('volunteersTableBody');
    if (!tableBody) return;

    try {
        // ✅ orderBy বাদ — সব ডকুমেন্ট ফেচ, পরে client-side sort
        const snapshot = await db.collection('volunteers').get();

        // createdAt → registrationDate → 0 এই অর্ডারে sort key বের করুন
        const volunteers = snapshot.docs.map(doc => {
            const data = doc.data();
            let t = 0;
            if (data.createdAt) {
                t = data.createdAt.toDate
                    ? data.createdAt.toDate().getTime()
                    : new Date(data.createdAt).getTime();
            } else if (data.registrationDate) {
                t = data.registrationDate.toDate
                    ? data.registrationDate.toDate().getTime()
                    : new Date(data.registrationDate).getTime();
            }
            return { id: doc.id, ...data, _sortTime: t };
        });

        volunteers.sort((a, b) => b._sortTime - a._sortTime);

        tableBody.innerHTML = '';

        if (volunteers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No volunteers found</td>
                </tr>`;
            return;
        }

        volunteers.forEach(v => {
            const statusClass = v.checkedIn ? 'status-active' : 'status-registered';
            const checkedInTime = v.checkedInTime
                ? formatFirestoreTimestamp(v.checkedInTime)
                : 'Not checked in';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${esc(v.fullName)}</td>
                <td>${v.age ?? ''}</td>
                <td>${v.gender ?? ''}</td>
                <td>${formatPhoneNumber(v.phone)}</td>
                <td>${esc(v.preferredArea || 'N/A')}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${v.status || (v.checkedIn ? 'Active' : 'Registered')}
                    </span>
                </td>
                <td>${v.assignedTask || 'Not assigned'}</td>
                <td>${checkedInTime}</td>
                <td>
                    <button class="btn-action view-volunteer" data-id="${v.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action assign-task" data-id="${v.id}">
                        <i class="fas fa-tasks"></i>
                    </button>
                    <button class="btn-action toggle-checkin" data-id="${v.id}" data-checked="${v.checkedIn}">
                        <i class="fas fa-user-check"></i>
                    </button>
                </td>`;
            tableBody.appendChild(row);
        });

        // Stats
        const totalEl = document.getElementById('totalVolunteersSmall');
        if (totalEl) totalEl.textContent = volunteers.length;

        const checkedEl = document.getElementById('checkedInVolunteers');
        if (checkedEl) checkedEl.textContent = volunteers.filter(v => v.checkedIn).length;

        // ✅ বাটনগুলোর action listeners attach করুন
        // (আগে admin.js-এ এগুলো attach-ই হচ্ছিল না — তাই বাটনে ক্লিক করলে কিছুই হতো না)
        if (typeof viewVolunteerDetails === 'function') {
            document.querySelectorAll('.view-volunteer').forEach(btn => {
                btn.addEventListener('click', function () {
                    viewVolunteerDetails(this.getAttribute('data-id'));
                });
            });
            document.querySelectorAll('.assign-task').forEach(btn => {
                btn.addEventListener('click', function () {
                    assignVolunteerTask(this.getAttribute('data-id'));
                });
            });
            document.querySelectorAll('.toggle-checkin').forEach(btn => {
                btn.addEventListener('click', function () {
                    toggleVolunteerCheckIn(this.getAttribute('data-id'));
                });
            });
        }

    } catch (error) {
        console.error('Error loading volunteers:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center error">Error loading volunteers</td>
            </tr>`;
    }
}

const menuToggle = document.getElementById('menuToggle');
const navMenu = document.querySelector('.nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
});

// ═══════════════════════════════════════════════════════════════════
// VOLUNTEER MANAGEMENT - Full Implementation (Fixed)
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// Helper: Format date/time for check-in / check-out display
// ─────────────────────────────────────────────────────────────────
function formatVolunteerDateTime(value) {
    if (!value) return '-';
    let d;
    if (typeof value.toDate === 'function') d = value.toDate();
    else if (value instanceof Date) d = value;
    else d = new Date(value);
    if (isNaN(d.getTime())) return '-';

    const pad = n => String(n).padStart(2, '0');
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(hours)}:${pad(d.getMinutes())} ${ampm}`;
}

// ─────────────────────────────────────────────────────────────────
// Helper: Total hours worked (stored + live session if checked in)
// ─────────────────────────────────────────────────────────────────
function calculateVolunteerHours(volunteer) {
    let hours = Number(volunteer.hoursWorked) || 0;
    if (volunteer.checkedIn && volunteer.checkedInTime) {
        let t;
        if (typeof volunteer.checkedInTime.toDate === 'function') {
            t = volunteer.checkedInTime.toDate();
        } else {
            t = new Date(volunteer.checkedInTime);
        }
        if (!isNaN(t.getTime())) {
            hours += (Date.now() - t.getTime()) / (1000 * 60 * 60);
        }
    }
    return Math.max(0, hours);
}

// ─────────────────────────────────────────────────────────────────
// Initialize Volunteer Management
// ─────────────────────────────────────────────────────────────────
async function initVolunteerManagement() {
    await loadVolunteersTable();
    initVolunteerActions();
}

// ─────────────────────────────────────────────────────────────────
// Load Volunteers Table (shows check-in/out, hours, assigned task)
// ─────────────────────────────────────────────────────────────────
async function loadVolunteersTable() {
    const tableBody = document.getElementById('volunteersTableBody');
    if (!tableBody) return;

    try {
        const snapshot = await db.collection('volunteers')
            .orderBy('createdAt', 'desc')
            .get();

        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No volunteers found</td>
                </tr>
            `;
            return;
        }

        // Small stat cards (optional - only if elements exist)
        const activeCount = snapshot.docs.filter(d => d.data().checkedIn).length;
        const totalHours = snapshot.docs.reduce(
            (sum, doc) => sum + calculateVolunteerHours(doc.data()), 0
        );
        const totalEl = document.getElementById('totalVolunteersSmall');
        if (totalEl) totalEl.textContent = snapshot.size;
        const activeEl = document.getElementById('activeVolunteersSmall');
        if (activeEl) activeEl.textContent = activeCount;
        const hoursEl = document.getElementById('totalVolunteerHours');
        if (hoursEl) hoursEl.textContent = totalHours.toFixed(1);

        snapshot.forEach(doc => {
            const v = doc.data();

            // Status logic
            const checkedOut = !!v.checkedOutTime && !v.checkedIn;
            const statusText = v.checkedIn
                ? 'Checked In'
                : (v.checkedOutTime ? 'Checked Out' : 'Not Checked In');
            const statusClass = v.checkedIn
                ? 'status-active'
                : (v.checkedOutTime ? 'status-completed' : 'status-waiting');

            const hours = calculateVolunteerHours(v).toFixed(2);
            const hoursLabel = v.checkedIn ? `${hours} (live)` : `${hours}`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${esc(v.fullName)}</td>
                <td>${esc(v.phone || '-')}</td>
                <td>${esc(v.preferredArea || '-')}</td>
                <td>${esc(v.assignedTask || 'Not Assigned')}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${formatVolunteerDateTime(v.checkedInTime)}</td>
                <td>${formatVolunteerDateTime(v.checkedOutTime)}</td>
                <td>${hoursLabel} hrs</td>
                <td>
                    <button class="btn-action view-volunteer" data-id="${doc.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action assign-task" data-id="${doc.id}" title="Assign Task">
                        <i class="fas fa-tasks"></i>
                    </button>
                    <button class="btn-action toggle-checkin" data-id="${doc.id}" title="${v.checkedIn ? 'Check Out' : 'Check In'}">
                        <i class="fas fa-${v.checkedIn ? 'sign-out-alt' : 'sign-in-alt'}"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading volunteers:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center error">Error loading volunteers</td>
            </tr>
        `;
    }
}

// ─────────────────────────────────────────────────────────────────
// Initialize Volunteer Actions (event delegation — bug-free)
// ─────────────────────────────────────────────────────────────────
function initVolunteerActions() {
    // Remove old handler if it exists (avoid duplicate listeners)
    if (window.__volunteerActionsHandler) {
        document.removeEventListener('click', window.__volunteerActionsHandler);
    }

    window.__volunteerActionsHandler = function (e) {
        const viewBtn = e.target.closest('.view-volunteer');
        if (viewBtn) {
            viewVolunteerDetails(viewBtn.getAttribute('data-id'));
            return;
        }

        const assignBtn = e.target.closest('.assign-task');
        if (assignBtn) {
            assignTaskToVolunteer(assignBtn.getAttribute('data-id'));
            return;
        }

        const checkinBtn = e.target.closest('.toggle-checkin');
        if (checkinBtn) {
            toggleVolunteerCheckIn(checkinBtn.getAttribute('data-id'));
            return;
        }
    };
    document.addEventListener('click', window.__volunteerActionsHandler);
}

// ─────────────────────────────────────────────────────────────────
// Assign Task to Volunteer (FIXED — works properly now)
// ─────────────────────────────────────────────────────────────────
async function assignTaskToVolunteer(volunteerId) {
    try {
        const doc = await db.collection('volunteers').doc(volunteerId).get();
        if (!doc.exists) {
            showAlert('Volunteer not found', 'danger');
            return;
        }

        const v = doc.data();
        const predefinedTasks = [
            'Registration Desk',
            'Crowd Control & Guidance',
            'Patient Support & Assistance',
            'Medicine Distribution',
            'Food & Water Distribution',
            'Cleanup & Maintenance',
            'Patient Transportation',
            'Other'
        ];

        const optionsHtml = predefinedTasks
            .map(t => `<option value="${esc(t)}">${esc(t)}</option>`)
            .join('');

        const modalContent = `
            <div class="modal-header">
                <h3>Assign Task</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Volunteer:</label>
                    <p style="margin:0;"><strong>${esc(v.fullName)}</strong> ${v.phone ? '(' + esc(v.phone) + ')' : ''}</p>
                </div>
                <div class="form-group">
                    <label for="taskSelect" class="form-label">Select Task:</label>
                    <select id="taskSelect" class="form-control">
                        <option value="">-- Select a task --</option>
                        ${optionsHtml}
                    </select>
                </div>
                <div class="form-group">
                    <label for="customTaskInput" class="form-label">Custom Task / Notes:</label>
                    <textarea id="customTaskInput" class="form-control" rows="2"
                        placeholder="Any extra details or custom task description...">${esc(v.taskNotes || '')}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <button class="btn btn-primary" id="saveTaskBtn">Assign Task</button>
            </div>
        `;

        showModal(modalContent);
        document.querySelector('.close-modal').addEventListener('click', closeModal);

        // Pre-select current task
        const taskSelect = document.getElementById('taskSelect');
        if (v.assignedTask) {
            if (predefinedTasks.includes(v.assignedTask)) {
                taskSelect.value = v.assignedTask;
            } else {
                taskSelect.value = 'Other';
                document.getElementById('customTaskInput').value = v.assignedTask;
            }
        }

        document.getElementById('saveTaskBtn').addEventListener('click', async () => {
            const selectedTask = taskSelect.value;
            const notes = document.getElementById('customTaskInput').value.trim();

            if (!selectedTask) {
                showAlert('Please select a task', 'warning');
                return;
            }

            const finalTask = (selectedTask === 'Other')
                ? (notes || 'Other Task')
                : selectedTask;

            const btn = document.getElementById('saveTaskBtn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            try {
                await db.collection('volunteers').doc(volunteerId).update({
                    assignedTask: finalTask,
                    taskNotes: notes,
                    taskAssignedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastActivity: new Date()
                });
                showAlert('Task assigned successfully!', 'success');
                closeModal();
                loadVolunteersTable();
            } catch (err) {
                console.error('Error assigning task:', err);
                showAlert('Error assigning task: ' + err.message, 'danger');
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        });

    } catch (err) {
        console.error('Error opening task modal:', err);
        showAlert('Error loading volunteer data', 'danger');
    }
}

// ─────────────────────────────────────────────────────────────────
// Toggle Check-In / Check-Out (calculates hours on checkout)
// ─────────────────────────────────────────────────────────────────
async function toggleVolunteerCheckIn(volunteerId) {
    try {
        const docRef = db.collection('volunteers').doc(volunteerId);
        const doc = await docRef.get();
        if (!doc.exists) {
            showAlert('Volunteer not found', 'danger');
            return;
        }

        const v = doc.data();
        const now = new Date();

        if (!v.checkedIn) {
            // ── CHECK IN ──
            await docRef.update({
                checkedIn: true,
                checkedInTime: now,
                checkedOutTime: null,       // reset previous session's checkout
                status: 'Checked In',
                lastActivity: now
            });
            showAlert('Checked in successfully!', 'success');

        } else {
            // ── CHECK OUT ──
            let checkInDate;
            if (v.checkedInTime && typeof v.checkedInTime.toDate === 'function') {
                checkInDate = v.checkedInTime.toDate();
            } else if (v.checkedInTime) {
                checkInDate = new Date(v.checkedInTime);
            } else {
                checkInDate = now;
            }
            if (isNaN(checkInDate.getTime())) checkInDate = now;

            const sessionHours = Math.max(0, (now - checkInDate) / (1000 * 60 * 60));
            const newTotalHours = (Number(v.hoursWorked) || 0) + sessionHours;

            await docRef.update({
                checkedIn: false,
                checkedOutTime: now,
                hoursWorked: Number(newTotalHours.toFixed(2)),
                status: 'Checked Out',
                lastActivity: now
            });

            showAlert(
                `Checked out! Session: ${sessionHours.toFixed(2)} hrs | Total: ${newTotalHours.toFixed(2)} hrs`,
                'success'
            );
        }

        loadVolunteersTable();

    } catch (err) {
        console.error('Error toggling check-in:', err);
        showAlert('Error updating check-in status: ' + err.message, 'danger');
    }
}

// ─────────────────────────────────────────────────────────────────
// View Volunteer Details (shows ALL info + attendance + hours)
// ─────────────────────────────────────────────────────────────────
async function viewVolunteerDetails(volunteerId) {
    try {
        const doc = await db.collection('volunteers').doc(volunteerId).get();
        if (!doc.exists) {
            showAlert('Volunteer not found', 'danger');
            return;
        }

        const v = doc.data();
        const hours = calculateVolunteerHours(v).toFixed(2);
        const statusText = v.checkedIn
            ? 'Checked In'
            : (v.checkedOutTime ? 'Checked Out' : 'Not Checked In');
        const statusClass = v.checkedIn
            ? 'status-active'
            : (v.checkedOutTime ? 'status-completed' : 'status-waiting');

        const modalContent = `
            <div class="modal-header">
                <h3>Volunteer Details</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="patient-details-grid">

                    <div class="detail-group">
                        <h4>Personal Information</h4>
                        <p><strong>Full Name:</strong> ${esc(v.fullName)}</p>
                        <p><strong>Age:</strong> ${v.age || '-'}</p>
                        <p><strong>Gender:</strong> ${esc(v.gender || '-')}</p>
                        <p><strong>Phone:</strong> ${esc(v.phone || '-')}</p>
                        <p><strong>Email:</strong> ${esc(v.email || '-')}</p>
                        <p><strong>Emergency Contact:</strong> ${esc(v.emergencyContact || '-')}</p>
                        <p><strong>Address:</strong> ${esc(v.address || '-')}</p>
                    </div>

                    <div class="detail-group">
                        <h4>Background Information</h4>
                        <p><strong>Occupation:</strong> ${esc(v.occupation || '-')}</p>
                        <p><strong>Education:</strong> ${esc(v.education || '-')}</p>
                        <p><strong>Skills:</strong> ${esc(v.skills || v.specialSkills || '-')}</p>
                        <p><strong>Previous Experience:</strong> ${esc(v.previousExperience || '-')}</p>
                    </div>

                    <div class="detail-group">
                        <h4>Volunteer Preferences</h4>
                        <p><strong>Preferred Area:</strong> ${esc(v.preferredArea || '-')}</p>
                        <p><strong>Availability:</strong> ${esc(v.availability || '-')}</p>
                        <p><strong>T-Shirt Size:</strong> ${esc(v.tshirtSize || '-')}</p>
                        <p><strong>Additional Info:</strong> ${esc(v.additionalInfo || '-')}</p>
                    </div>

                    <div class="detail-group">
                        <h4>Attendance &amp; Task</h4>
                        <p><strong>Current Status:</strong>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </p>
                        <p><strong>Assigned Task:</strong> ${esc(v.assignedTask || 'Not Assigned')}</p>
                        ${v.taskNotes ? `<p><strong>Task Notes:</strong> ${esc(v.taskNotes)}</p>` : ''}
                        <p><strong>Checked In:</strong> ${formatVolunteerDateTime(v.checkedInTime)}</p>
                        <p><strong>Checked Out:</strong> ${formatVolunteerDateTime(v.checkedOutTime)}</p>
                        <p><strong>Total Hours Worked:</strong> <strong style="color:#2a9d8f;">${hours} hrs</strong>${v.checkedIn ? ' <em>(session active)</em>' : ''}</p>
                    </div>

                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-warning" id="assignTaskFromDetails">
                    <i class="fas fa-tasks"></i> ${v.assignedTask ? 'Change Task' : 'Assign Task'}
                </button>
                <button class="btn btn-${v.checkedIn ? 'danger' : 'success'}" id="toggleCheckinFromDetails">
                    <i class="fas fa-${v.checkedIn ? 'sign-out-alt' : 'sign-in-alt'}"></i>
                    ${v.checkedIn ? 'Check Out' : 'Check In'}
                </button>
            </div>
        `;

        showModal(modalContent);
        document.querySelector('.close-modal').addEventListener('click', closeModal);

        document.getElementById('assignTaskFromDetails').addEventListener('click', () => {
            closeModal();
            assignTaskToVolunteer(volunteerId);
        });

        document.getElementById('toggleCheckinFromDetails').addEventListener('click', async () => {
            await toggleVolunteerCheckIn(volunteerId);
            closeModal();
            viewVolunteerDetails(volunteerId); // reopen with fresh data
        });

    } catch (err) {
        console.error('Error viewing volunteer details:', err);
        showAlert('Error loading volunteer details', 'danger');
    }
}

// ─────────────────────────────────────────────────────────────────
// Expose volunteer management functions globally (optional)
// ─────────────────────────────────────────────────────────────────
window.volunteerUtils = {
    initVolunteerManagement,
    loadVolunteersTable,
    initVolunteerActions,
    viewVolunteerDetails,
    assignTaskToVolunteer,
    toggleVolunteerCheckIn,
    calculateVolunteerHours
};
