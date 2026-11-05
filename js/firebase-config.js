// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBq8WNV7qkQ2rX3I5c8R3_6CaTKVa9KNDY",
    authDomain: "rjf-free-medical-camp.firebaseapp.com",
    databaseURL: "https://rjf-free-medical-camp-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rjf-free-medical-camp",
    storageBucket: "rjf-free-medical-camp.firebasestorage.app",
    messagingSenderId: "447883551752",
    appId: "1:447883551752:web:b8dc09bf9537296765ddbd",
    measurementId: "G-6L2CE2H8KW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

console.log("Firebase configured successfully");

// ✅ Set persistence to LOCAL (important!)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log("Auth persistence set to LOCAL");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

// Firestore settings
db.settings({
    timestampsInSnapshots: true,
    merge: true,
    ignoreUndefinedProperties: true
});

// Firestore persistence enable
db.enablePersistence()
    .catch((err) => {
        console.log("Firestore persistence error: ", err);
    });

// Make Firebase services globally available
window.auth = auth;
window.db = db;
window.rtdb = rtdb;
window.firebase = firebase;


// Utility function to format Firestore timestamp
function formatFirestoreTimestamp(timestamp) {
    if (!timestamp) return 'N/A';

    if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return timestamp;
}

// Generate Registration ID
function generateRegistrationID() {
    const prefix = 'RJF';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${timestamp}${random}`;
}

// Calculate patient status
function calculatePatientStatus(patient) {
    if (patient.checkupCompleted) {
        return 'Completed';
    } else if (patient.checkupStarted) {
        return 'Under Checkup';
    } else {
        return 'Waiting';
    }
}

// Format phone number
function formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
}

// Validate email
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Show loading spinner
function showLoading(element) {
    element.innerHTML = '<div class="loading"></div>';
}

// Hide loading spinner
function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
}

// Show alert message
function showAlert(message, type = 'success', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(alert);

    // Remove alert after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 5000);
}

// Export utility functions
window.firebaseUtils = {
    formatFirestoreTimestamp,
    generateRegistrationID,
    calculatePatientStatus,
    formatPhoneNumber,
    validateEmail,
    showLoading,
    hideLoading,
    showAlert
};