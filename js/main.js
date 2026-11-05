// Main JavaScript for the Medical Camp Website

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            menuToggle.innerHTML = navMenu.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-container') && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (menuToggle) {
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });
    
    // Update stats on homepage
    updateHomepageStats();
    
    // Animate elements on scroll
    initScrollAnimations();
    
    // Set countdown timer
    setCountdownTimer();
    
    // Initialize Firebase if available
    if (typeof firebase !== 'undefined') {
        initFirebaseStats();
    }
});

// Update homepage statistics
function updateHomepageStats() {
    // These would be updated from Firebase in real implementation
    const stats = {
        patients: 125,
        doctors: 12,
        volunteers: 35
    };
    
    // Animate counting up
    animateCount('totalPatients', stats.patients);
    animateCount('totalDoctors', stats.doctors);
    animateCount('totalVolunteers', stats.volunteers);
}

// Animate number counting
function animateCount(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepValue = targetNumber / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += stepValue;
        if (current >= targetNumber) {
            clearInterval(timer);
            element.textContent = targetNumber;
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// Initialize scroll animations
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe feature cards and service items
    document.querySelectorAll('.feature-card, .service-item, .stat-card').forEach(card => {
        observer.observe(card);
    });
}

// Set countdown timer to December 16, 2025
function setCountdownTimer() {
    const targetDate = new Date('December 16, 2025 09:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = targetDate - now;
        
        if (timeLeft < 0) {
            document.querySelectorAll('.countdown-timer').forEach(timer => {
                timer.innerHTML = '<span class="countdown-ended">Medical Camp is Live!</span>';
            });
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.querySelectorAll('.countdown-timer').forEach(timer => {
            timer.innerHTML = `
                <div class="countdown-item">
                    <span class="countdown-number">${days}</span>
                    <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${hours}</span>
                    <span class="countdown-label">Hours</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${minutes}</span>
                    <span class="countdown-label">Minutes</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${seconds}</span>
                    <span class="countdown-label">Seconds</span>
                </div>
            `;
        });
    }
    
    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Initialize Firebase statistics
function initFirebaseStats() {
    // Listen for real-time updates on patient count
    db.collection('patients').onSnapshot(snapshot => {
        const count = snapshot.size;
        document.getElementById('totalPatients').textContent = count;
    });
    
    // Listen for real-time updates on doctor count
    db.collection('doctors').onSnapshot(snapshot => {
        const count = snapshot.size;
        document.getElementById('totalDoctors').textContent = count;
    });
    
    // Listen for real-time updates on volunteer count
    db.collection('volunteers').onSnapshot(snapshot => {
        const count = snapshot.size;
        document.getElementById('totalVolunteers').textContent = count;
    });
}

// Form validation helper
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
            
            // Add error message if not already present
            if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('error-message')) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'This field is required';
                field.parentNode.appendChild(errorMsg);
            }
        } else {
            field.classList.remove('error');
            
            // Remove error message if present
            const errorMsg = field.parentNode.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    });
    
    return isValid;
}

// Format date for display
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Export functions for use in other files
window.mainUtils = {
    validateForm,
    formatDate,
    updateHomepageStats
};