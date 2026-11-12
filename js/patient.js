// Patient Registration JavaScript - বাংলা সংস্করণ
// Version: 4.0 - English Values + Yes/No Toggles + Age (Years/Months)

document.addEventListener('DOMContentLoaded', function () {
    initPatientRegistration();
    initPatientStatusCheck();
    initFocusAnimations();
    initFormValidationFeedback();
    addFormValidationStyles();
    addPDFStyles();
});

// ============================================
// STYLES MANAGEMENT
// ============================================

function addFormValidationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .form-control.valid {
            border-color: #28a745;
            background: linear-gradient(135deg, #f8fff8 0%, #e8f5e9 100%);
        }
        .form-control.invalid {
            border-color: #dc3545;
            background: linear-gradient(135deg, #fff8f8 0%, #ffebee 100%);
        }
        .form-group.focused .form-label {
            color: #e63946;
            transform: translateX(10px);
        }
        .form-group.focused .form-control {
            box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.15);
        }
        .alert {
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
            animation: fadeIn 0.3s ease;
        }
        .alert-success { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 1px solid #c3e6cb; color: #155724; }
        .alert-danger  { background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); border: 1px solid #f5c6cb; color: #721c24; }
        .alert-warning { background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 1px solid #ffeaa7; color: #856404; }
        .alert-info    { background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border: 1px solid #bee5eb; color: #0c5460; }
        .alert i { font-size: 1.5rem; margin-top: 2px; }
        .alert-content { flex: 1; }
        .alert h4 { margin: 0 0 5px 0; font-size: 1.1rem; }
        .alert p { margin: 0; font-size: 0.95rem; }
        .alert-close { background: none; border: none; color: inherit; cursor: pointer; padding: 0; opacity: 0.7; transition: opacity 0.3s ease; font-size: 1.2rem; }
        .alert-close:hover { opacity: 1; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-10px); } }
        .animate-fade-in { animation: fadeIn 0.3s ease; }
        .animate-fade-out { animation: fadeOut 0.3s ease; }
    `;
    document.head.appendChild(style);
}

function addPDFStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .pdf-preview-container { display: none; margin-top: 40px; animation: fadeIn 0.5s ease; }
        .pdf-preview-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
            margin-bottom: 30px;
            border: 1px solid #e0e0e0;
        }
        .pdf-header {
            background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
            padding: 30px 25px;
            color: white;
            text-align: center;
            position: relative;
        }
        .pdf-header::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 8px;
            background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px);
        }
        .pdf-logo {
            width: 100px; height: 100px;
            background: white;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .pdf-logo i { font-size: 50px; color: #e63946; }
        .pdf-title {
            font-size: 2rem; font-weight: 700; margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2); letter-spacing: 0.5px;
        }
        .pdf-subtitle { font-size: 1.1rem; opacity: 0.95; font-weight: 400; }
        .registration-id-display {
            text-align: center;
            background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
            padding: 20px;
            border-radius: 10px;
            border: 2px dashed #ff9800;
            margin: 20px 25px 0;
        }
        .registration-id-display h4 { color: #e65100; margin-bottom: 12px; font-size: 1.1rem; font-weight: 600; }
        .registration-id {
            font-size: 2rem; font-weight: 700; color: #e63946; letter-spacing: 1.5px;
            background: white; padding: 12px 25px; border-radius: 8px;
            display: inline-block; border: 2px solid #e63946; margin-bottom: 8px;
            font-family: 'Courier New', monospace;
        }
        .registration-id-display p { margin: 0; color: #666; font-size: 0.9rem; }
        .pdf-body { padding: 30px; }
        .pdf-section { margin-bottom: 30px; padding-bottom: 25px; border-bottom: 2px solid #f0f0f0; }
        .pdf-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .section-title {
            color: #e63946; font-size: 1.4rem; font-weight: 600; margin-bottom: 20px;
            padding-bottom: 12px; border-bottom: 2px solid #e63946;
            display: flex; align-items: center; gap: 10px;
        }
        .section-title i { font-size: 1.2rem; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }
        .info-item { display: flex; flex-direction: column; gap: 6px; }
        .info-label { color: #666; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .info-label i { font-size: 0.8rem; color: #e63946; }
        .info-value {
            font-size: 1.05rem; font-weight: 600; color: #333; padding: 12px;
            background: #f8f9fa; border-radius: 8px; border-left: 4px solid #e63946;
            min-height: 45px; display: flex; align-items: center;
        }
        .qr-code-container { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; margin-top: 20px; }
        .pdf-footer { background: #f8f9fa; padding: 30px 25px; border-top: 2px solid #dee2e6; }
        .footer-instructions {
            background: white; padding: 25px; border-radius: 10px;
            border-left: 4px solid #28a745; box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }
        .footer-instructions h4 { color: #28a745; margin-bottom: 18px; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; }
        .footer-instructions ul { list-style: none; padding: 0; margin: 0; }
        .footer-instructions li { padding: 10px 0; display: flex; align-items: flex-start; gap: 12px; border-bottom: 1px dashed #eee; }
        .footer-instructions li:last-child { border-bottom: none; }
        .footer-instructions i { color: #28a745; min-width: 20px; margin-top: 3px; }
        .footer-instructions strong { color: #333; min-width: 60px; display: inline-block; }
        .pdf-actions { display: flex; gap: 15px; justify-content: center; margin-top: 30px; flex-wrap: wrap; }
        .pdf-btn {
            padding: 12px 30px; border-radius: 8px; font-weight: 600;
            display: flex; align-items: center; gap: 10px;
            transition: all 0.3s ease; border: none; cursor: pointer;
            font-size: 1rem; min-width: 160px; justify-content: center;
        }
        .pdf-btn:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .pdf-btn i { font-size: 1.1rem; }
        @media print {
            body * { visibility: hidden; }
            .pdf-preview-container, .pdf-preview-container * { visibility: visible; }
            .pdf-preview-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .pdf-preview-card { box-shadow: none; border: none; border-radius: 0; }
            .pdf-actions, .pdf-btn { display: none; }
        }
        .status-badge {
            display: inline-block; padding: 6px 15px; border-radius: 50px;
            color: white; font-weight: 600; font-size: 0.85rem;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function validateBangladeshiPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const patterns = [
        /^01[3-9]\d{8}$/,
        /^\+8801[3-9]\d{8}$/,
        /^8801[3-9]\d{8}$/
    ];
    return patterns.some(pattern => pattern.test(cleaned));
}

function formatBangladeshiPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('880') && cleaned.length === 13) {
        return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)}-${cleaned.substring(8)}`;
    } else if (cleaned.startsWith('01') && cleaned.length === 11) {
        return `+880 ${cleaned.substring(1, 5)} ${cleaned.substring(5)}`;
    } else if (cleaned.startsWith('+880') && cleaned.length === 14) {
        return `+${cleaned.substring(1, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8)}`;
    }
    return phone;
}

function initBangladeshiPhoneInput(inputId) {
    const phoneInput = document.getElementById(inputId);
    if (!phoneInput) return;
    phoneInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (e.target.value.startsWith('+') && !value.startsWith('+')) value = '+' + value;
        if (value.length > 14) value = value.substring(0, 14);
        if (value.startsWith('+880') && value.length > 4) {
            const formatted = `+${value.substring(1, 4)} ${value.substring(4, 6)} ${value.substring(6, 9)}-${value.substring(9)}`;
            e.target.value = formatted;
        } else if (value.startsWith('880') && value.length > 3) {
            const formatted = `+${value.substring(0, 3)} ${value.substring(3, 5)} ${value.substring(5, 8)}-${value.substring(8)}`;
            e.target.value = formatted;
        } else if (value.startsWith('01') && value.length > 2) {
            const formatted = `${value.substring(0, 3)} ${value.substring(3, 6)}-${value.substring(6)}`;
            e.target.value = formatted;
        } else {
            e.target.value = value;
        }
    });
    phoneInput.placeholder = "01XXXXXXXXX or +8801XXXXXXXXX";
}

function formatBangladeshiDateTime(date) {
    const banglaMonths = ['জানুয়ারী','ফেব্রুয়ারী','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    const banglaDays = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
    const d = new Date(date);
    const day = d.getDate();
    const month = banglaMonths[d.getMonth()];
    const year = d.getFullYear();
    const dayName = banglaDays[d.getDay()];
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12; hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${dayName} - ${hours}:${minutes}:${seconds} ${ampm}`;
}

function getBanglaStatus(status) {
    const statusMap = {
        'Waiting': 'অপেক্ষমাণ',
        'Under Checkup': 'চেকআপ চলছে',
        'Completed': 'সম্পন্ন',
        'Rejected': 'বাতিল'
    };
    return statusMap[status] || status;
}

// --- New helpers for English values + bilingual display ---

function getBanglaGender(gender) {
    const map = {
        'Male': 'পুরুষ',
        'Female': 'মহিলা',
        'Other': 'অন্যান্য',
        'পুরুষ': 'পুরুষ',
        'মহিলা': 'মহিলা',
        'অন্যান্য': 'অন্যান্য'
    };
    return map[gender] || gender || 'N/A';
}

function getBanglaYesNo(value) {
    if (value === 'Yes' || value === 'yes' || value === true) return 'হ্যাঁ';
    if (value === 'No'  || value === 'no'  || value === false) return 'না';
    return 'নাই';
}

function formatAgeBengali(years, months) {
    years = parseInt(years) || 0;
    months = parseInt(months) || 0;
    if (years > 0 && months > 0) return `${years} বছর ${months} মাস`;
    if (years > 0) return `${years} বছর`;
    if (months > 0) return `${months} মাস`;
    return 'N/A';
}

function getAgeDisplay(patientData) {
    if (patientData.ageYears !== undefined && patientData.ageYears !== null) {
        return formatAgeBengali(patientData.ageYears, patientData.ageMonths);
    }
    if (typeof patientData.age === 'number') {
        return formatAgeBengali(patientData.age, 0);
    }
    if (typeof patientData.age === 'string' && patientData.age) {
        return patientData.age;
    }
    return 'N/A';
}

// ============================================
// REGISTRATION ID - SEQUENTIAL PER DATE
// Format: RJFFMC-YYMMDD-0001
// ============================================

async function checkRegistrationIdExists(registrationId) {
    try {
        if (!window.db) { console.error('Firestore is not initialized'); return false; }
        const querySnapshot = await window.db.collection('patients')
            .where('registrationId', '==', registrationId)
            .limit(1)
            .get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Registration ID চেক করার সময় ত্রুটি:', error);
        return false;
    }
}

async function generateSequentialRegistrationID() {
    const now = new Date();
    const bdTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    const yy = bdTime.getFullYear().toString().slice(-2);
    const mm = (bdTime.getMonth() + 1).toString().padStart(2, '0');
    const dd = bdTime.getDate().toString().padStart(2, '0');
    const dateKey = `${yy}${mm}${dd}`;
    const prefix = `RJFFMC-${dateKey}-`;

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const snapshot = await window.db.collection('patients')
                .where('registrationId', '>=', prefix)
                .where('registrationId', '<', prefix + '\uf8ff')
                .get();

            let maxSerial = 0;
            snapshot.forEach(doc => {
                const id = doc.data().registrationId || '';
                const match = id.match(/-(\d+)$/);
                if (match) {
                    const serial = parseInt(match[1], 10);
                    if (serial > maxSerial) maxSerial = serial;
                }
            });

            const candidateId = `${prefix}${(maxSerial + 1).toString().padStart(4, '0')}`;
            const exists = await checkRegistrationIdExists(candidateId);
            if (!exists) {
                console.log('নতুন নিবন্ধন আইডি তৈরি হয়েছে:', candidateId);
                return candidateId;
            }
        } catch (error) {
            console.warn('ID জেনারেশন চেষ্টা ব্যর্থ, পুনরায় চেষ্টা:', error);
        }
    }
    throw new Error('নিবন্ধন আইডি তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
}

function generateRegistrationID() {
    return generateSequentialRegistrationID();
}

function showLoading(button) {
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্রক্রিয়াধীন...';
    button.disabled = true;
}

function hideLoading(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) { console.error('Alert container not found'); return; }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} animate-fade-in`;

    let icon = 'fa-info-circle', title = 'তথ্য';
    switch (type) {
        case 'success': icon = 'fa-check-circle'; title = 'সফল!'; break;
        case 'danger':  icon = 'fa-exclamation-circle'; title = 'ত্রুটি!'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; title = 'সতর্কতা!'; break;
        case 'info':    icon = 'fa-info-circle'; title = 'তথ্য'; break;
    }

    alert.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="alert-content">
            <h4 class="bengali-text">${title}</h4>
            <p class="bengali-text">${message}</p>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.classList.add('animate-fade-out');
        setTimeout(() => {
            if (alert.parentNode) alert.parentNode.removeChild(alert);
        }, 300);
    }, 5000);
}

// ============================================
// TOGGLE HELPERS (Required selection feedback)
// ============================================

function clearToggleError(formId) {
    document.querySelectorAll('.form-group.toggle-error').forEach(g => {
        g.classList.remove('toggle-error');
    });
}

function markToggleError(groupId) {
    const group = document.getElementById(groupId);
    if (group) {
        group.classList.add('toggle-error');
        group.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ============================================
// PATIENT REGISTRATION
// ============================================

function initPatientRegistration() {
    const registrationForm = document.getElementById('patientRegistrationForm');
    if (!registrationForm) { console.error('Registration form not found'); return; }

    initBangladeshiPhoneInput('phone');

    // Clear toggle error state when user makes a selection
    document.querySelectorAll(
        'input[name="medicalHistory"], input[name="allergies"], input[name="previousMedications"]'
    ).forEach(radio => {
        radio.addEventListener('change', function () {
            const group = this.closest('.form-group');
            if (group) group.classList.remove('toggle-error');
        });
    });

    registrationForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearToggleError();

        if (!window.db || !window.rtdb) {
            showAlert('ডাটাবেজ সংযোগ পাওয়া যায়নি। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।', 'danger');
            return;
        }

        const db = window.db;
        const rtdb = window.rtdb;

        const now = new Date();
        const bangladeshTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));

        // ----- Basic required field validation -----
        const requiredFields = ['fullName', 'gender', 'phone', 'address',
            'bpSystolic', 'bpDiastolic', 'weight', 'currentSymptoms'];
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                showAlert('অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য পূরণ করুন', 'warning');
                field?.focus();
                return;
            }
        }

        // ----- Age validation (years + months) -----
        const ageYears  = parseInt(document.getElementById('ageYears').value)  || 0;
        const ageMonths = parseInt(document.getElementById('ageMonths').value) || 0;

        if (ageYears < 0 || ageYears > 120) {
            showAlert('বয়স (বছর) ০-১২০ এর মধ্যে হতে হবে', 'danger');
            document.getElementById('ageYears').focus();
            return;
        }
        if (ageMonths < 0 || ageMonths > 11) {
            showAlert('বয়স (মাস) ০-১১ এর মধ্যে হতে হবে', 'danger');
            document.getElementById('ageMonths').focus();
            return;
        }

        const totalMonths = (ageYears * 12) + ageMonths;
        if (totalMonths < 1) {
            showAlert('অনুগ্রহ করে বয়স লিখুন (বছর অথবা মাস)', 'warning');
            document.getElementById('ageYears').focus();
            return;
        }

        let ageEnglish;
        if (ageYears > 0 && ageMonths > 0)      ageEnglish = `${ageYears} years ${ageMonths} months`;
        else if (ageYears > 0)                   ageEnglish = `${ageYears} years`;
        else                                     ageEnglish = `${ageMonths} months`;

        const phone = document.getElementById('phone').value.replace(/\D/g, '');

        // ----- Validate phone -----
        if (!validateBangladeshiPhoneNumber(phone)) {
            showAlert('অনুগ্রহ করে একটি বৈধ বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX বা +8801XXXXXXXXX)', 'danger');
            return;
        }

        // ----- Validate BP -----
        const bpSystolic  = parseInt(document.getElementById('bpSystolic').value);
        const bpDiastolic = parseInt(document.getElementById('bpDiastolic').value);
        if (bpSystolic < 00 || bpSystolic > 00) {
            showAlert('অনুগ্রহ করে একটি বৈধ সিস্টোলিক BP দিন (৫০-৩০০)', 'danger');
            return;
        }
        if (bpDiastolic < 00 || bpDiastolic > 00) {
            showAlert('অনুগ্রহ করে একটি বৈধ ডায়াস্টোলিক BP দিন (৩০-২০০)', 'danger');
            return;
        }
        

        // ----- Validate weight -----
        const weight = parseFloat(document.getElementById('weight').value);
        if (isNaN(weight) || weight < 1 || weight > 300) {
            showAlert('অনুগ্রহ করে একটি বৈধ ওজন দিন (১-৩০০ কেজি)', 'danger');
            return;
        }

        // ----- YES/NO flags (Required — stored as "Yes"/"No" in English) -----
        const medicalHistoryVal      = document.querySelector('input[name="medicalHistory"]:checked')?.value;
        const allergiesVal           = document.querySelector('input[name="allergies"]:checked')?.value;
        const previousMedicationsVal = document.querySelector('input[name="previousMedications"]:checked')?.value;

        if (!medicalHistoryVal) {
            showAlert('অনুগ্রহ করে চিকিৎসা ইতিহাস আছে কি না নির্বাচন করুন (হ্যাঁ / না)', 'warning');
            markToggleError('medicalHistoryGroup');
            return;
        }
        if (!allergiesVal) {
            showAlert('অনুগ্রহ করে অ্যালার্জি আছে কি না নির্বাচন করুন (হ্যাঁ / না)', 'warning');
            markToggleError('allergiesGroup');
            return;
        }
        if (!previousMedicationsVal) {
            showAlert('অনুগ্রহ করে পূর্ববর্তী ঔষধ আছে কি না নির্বাচন করুন (হ্যাঁ / না)', 'warning');
            markToggleError('previousMedicationsGroup');
            return;
        }

        const submitBtn = registrationForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        showLoading(submitBtn);

        try {
            // ----- PHONE LIMIT: max 10 per phone -----
            const phoneQuery = await db.collection('patients')
                .where('phone', '==', phone)
                .get();

            if (phoneQuery.size >= 10) {
                showAlert('এই মোবাইল নম্বর দিয়ে ইতিমধ্যে ১০ জন রোগী নিবন্ধিত হয়েছে। সর্বোচ্চ ১০ জন নিবন্ধন করা যাবে।', 'warning');
                hideLoading(submitBtn, originalBtnText);
                return;
            }

            // ----- Generate sequential registration ID -----
            let registrationId;
            try {
                registrationId = await generateSequentialRegistrationID();
            } catch (idError) {
                console.error('ID generation failed:', idError);
                showAlert('নিবন্ধন আইডি তৈরি করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।', 'danger');
                hideLoading(submitBtn, originalBtnText);
                return;
            }

            // ----- Build form data (English values for DB) -----
            const formData = {
                registrationId: registrationId,
                fullName: document.getElementById('fullName').value.trim(),
                ageYears: ageYears,
                ageMonths: ageMonths,
                ageInMonths: totalMonths,
                age: ageEnglish,                              // e.g. "25 years 6 months"
                gender: document.getElementById('gender').value,  // English: Male/Female/Other
                phone: phone,
                address: document.getElementById('address').value.trim(),
                bloodGroup: document.getElementById('bloodGroup').value || '',

                // Vitals
                bpSystolic: bpSystolic,
                bpDiastolic: bpDiastolic,
                bp: `${bpSystolic}/${bpDiastolic}`,
                weight: weight,

                // Medical fields — Yes/No in English (required)
                medicalHistory: medicalHistoryVal,            // "Yes" | "No"
                allergies: allergiesVal,                       // "Yes" | "No"
                previousMedications: previousMedicationsVal,   // "Yes" | "No"
                hasMedicalHistory:      medicalHistoryVal      === 'Yes',
                hasAllergies:           allergiesVal           === 'Yes',
                hasPreviousMedications: previousMedicationsVal === 'Yes',

                currentSymptoms: document.getElementById('currentSymptoms').value.trim(),

                // Metadata
                registrationDate: firebase.firestore.Timestamp.fromDate(bangladeshTime),
                registrationDateISO: bangladeshTime.toISOString(),
                registrationTimestamp: bangladeshTime.getTime(),
                status: 'Waiting',
                checkupStarted: false,
                checkupCompleted: false,
                assignedDoctor: null,
                checkupStartTime: null,
                checkupEndTime: null,
                waitTime: Math.floor(Math.random() * 30) + 10,
                dailySerial: parseInt(registrationId.split('-').pop(), 10)
            };

            console.log("রোগী তথ্য জমা দেওয়া হচ্ছে:", formData);

            // ----- Save to Firestore -----
            const docRef = await db.collection('patients').add(formData);
            console.log("রোগী সংরক্ষিত হয়েছে ID:", docRef.id);

            // ----- Save to Realtime DB -----
            await rtdb.ref(`patients/${docRef.id}`).set({
                ...formData,
                id: docRef.id
            });

            showAlert(`রোগী নিবন্ধন সফল হয়েছে! নিবন্ধন আইডি: ${registrationId}`, 'success');

            registrationForm.reset();

            showPDFPreview(formData);

        } catch (error) {
            console.error('সম্পূর্ণ ত্রুটির বিবরণ:', error);
            if (error.code === 'permission-denied') {
                showAlert('ডাটাবেজ পারমিশন ডিনাই করা হয়েছে। অনুগ্রহ করে Firebase Rules চেক করুন।', 'danger');
            } else if (error.code === 'unavailable') {
                showAlert('নেটওয়ার্ক সংযোগ ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার ইন্টারনেট চেক করুন।', 'danger');
            } else {
                showAlert(`নিবন্ধন ব্যর্থ হয়েছে: ${error.message}`, 'danger');
            }
        } finally {
            hideLoading(submitBtn, originalBtnText);
        }
    });
}

// ============================================
// PDF PREVIEW
// ============================================

function showPDFPreview(patientData) {
    let pdfContainer = document.getElementById('pdfPreviewContainer');
    if (!pdfContainer) {
        pdfContainer = document.createElement('div');
        pdfContainer.id = 'pdfPreviewContainer';
        pdfContainer.className = 'pdf-preview-container';
        const form = document.getElementById('patientRegistrationForm');
        form.parentNode.insertBefore(pdfContainer, form.nextSibling);
    }

    let regDate;
    if (patientData.registrationDate && patientData.registrationDate.toDate) {
        regDate = formatBangladeshiDateTime(patientData.registrationDate.toDate());
    } else if (patientData.registrationDateISO) {
        regDate = formatBangladeshiDateTime(new Date(patientData.registrationDateISO));
    } else {
        regDate = formatBangladeshiDateTime(new Date());
    }

    const ageDisplay    = getAgeDisplay(patientData);
    const genderDisplay = getBanglaGender(patientData.gender);

    const mh = getBanglaYesNo(patientData.medicalHistory ?? patientData.hasMedicalHistory);
    const al = getBanglaYesNo(patientData.allergies ?? patientData.hasAllergies);
    const pm = getBanglaYesNo(patientData.previousMedications ?? patientData.hasPreviousMedications);

    pdfContainer.innerHTML = `
        <div class="pdf-preview-card">
            <div class="pdf-header">
                <div class="pdf-logo"><i class="fas fa-heartbeat"></i></div>
                <h1 class="pdf-title bengali-text">রক্তজবা ফাউন্ডেশন</h1>
                <p class="pdf-subtitle bengali-text">বিনামূল্যে মেডিকেল ক্যাম্প</p>
            </div>

            <div class="registration-id-display">
                <h4 class="bengali-text">আপনার নিবন্ধন আইডি:</h4>
                <div class="registration-id">${patientData.registrationId}</div>
                <p class="bengali-text">এই আইডিটি সংরক্ষণ করুন এবং ক্যাম্পে আনুন</p>
            </div>

            <div class="pdf-body">
                <!-- Personal Info -->
                <div class="pdf-section">
                    <h3 class="section-title bengali-text"><i class="fas fa-user-circle"></i> ব্যক্তিগত তথ্য</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-user"></i> পূর্ণ নাম</span>
                            <div class="info-value bengali-text">${patientData.fullName}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-birthday-cake"></i> বয়স / লিঙ্গ</span>
                            <div class="info-value bengali-text">${ageDisplay} / ${genderDisplay}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-phone"></i> মোবাইল নম্বর</span>
                            <div class="info-value bengali-text">${formatBangladeshiPhoneNumber(patientData.phone)}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-tint"></i> রক্তের গ্রুপ</span>
                            <div class="info-value bengali-text">${patientData.bloodGroup || 'নাই'}</div>
                        </div>
                        <div class="info-item" style="grid-column: 1 / -1;">
                            <span class="info-label bengali-text"><i class="fas fa-map-marker-alt"></i> ঠিকানা</span>
                            <div class="info-value bengali-text">${patientData.address}</div>
                        </div>
                    </div>
                </div>

                <!-- Medical Info -->
                <div class="pdf-section">
                    <h3 class="section-title bengali-text"><i class="fas fa-file-medical"></i> চিকিৎসা তথ্য</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-heartbeat"></i> রক্তচাপ (BP)</span>
                            <div class="info-value bengali-text">${patientData.bpSystolic}/${patientData.bpDiastolic} mmHg</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-weight"></i> ওজন</span>
                            <div class="info-value bengali-text">${patientData.weight} কেজি</div>
                        </div>
                        <div class="info-item" style="grid-column: 1 / -1;">
                            <span class="info-label bengali-text"><i class="fas fa-stethoscope"></i> বর্তমান সমস্যা</span>
                            <div class="info-value bengali-text">${patientData.currentSymptoms || 'নাই'}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-history"></i> চিকিৎসা ইতিহাস</span>
                            <div class="info-value bengali-text">${mh}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-allergies"></i> অ্যালার্জি</span>
                            <div class="info-value bengali-text">${al}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-pills"></i> পূর্ববর্তী ঔষধ</span>
                            <div class="info-value bengali-text">${pm}</div>
                        </div>
                    </div>
                </div>

                <!-- Registration Details -->
                <div class="pdf-section">
                    <h3 class="section-title bengali-text"><i class="fas fa-clipboard-check"></i> নিবন্ধন বিবরণ</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-id-card"></i> নিবন্ধন আইডি</span>
                            <div class="info-value bengali-text">${patientData.registrationId}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-calendar-alt"></i> নিবন্ধনের তারিখ</span>
                            <div class="info-value bengali-text">${regDate}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-hourglass-half"></i> বর্তমান স্ট্যাটাস</span>
                            <div class="info-value">
                                <span class="status-badge" style="background: #ffc107;">${getBanglaStatus(patientData.status)}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label bengali-text"><i class="fas fa-clock"></i> আনুমানিক অপেক্ষার সময়</span>
                            <div class="info-value bengali-text">${patientData.waitTime || 30} মিনিট</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="pdf-footer">
                <div class="footer-instructions">
                    <h4 class="bengali-text"><i class="fas fa-info-circle"></i> গুরুত্বপূর্ণ নির্দেশাবলী:</h4>
                    <ul class="bengali-text">
                        <li><i class="fas fa-clock"></i> <strong>সময়:</strong> সকাল ৮:০০ টা থেকে শুরু</li>
                        <li><i class="fas fa-map-marker-alt"></i> <strong>স্থান:</strong> মতলব(উত্তর), চাঁদপুর।</li>
                        <li><i class="fas fa-id-card"></i> এই ফর্মটি প্রিন্ট করে আনুন বা মোবাইলে সংরক্ষণ করুন</li>
                        <li><i class="fas fa-phone"></i> <strong>জরুরী যোগাযোগ:</strong> +880 1960 506 601</li>
                    </ul>
                </div>

                <div class="pdf-actions">
                    <button class="pdf-btn" style="background:#007bff;color:white;" onclick="printPDF()">
                        <i class="fas fa-print"></i> প্রিন্ট করুন
                    </button>
                    <button class="pdf-btn" style="background:#28a745;color:white;" onclick="downloadPDF()">
                        <i class="fas fa-download"></i> ডাউনলোড করুন
                    </button>
                    <button class="pdf-btn" style="background:#6c757d;color:white;" onclick="sharePDF()">
                        <i class="fas fa-share-alt"></i> শেয়ার করুন
                    </button>
                    <button class="pdf-btn" style="background:white;color:#007bff;border:2px solid #007bff;" onclick="newRegistration()">
                        <i class="fas fa-user-plus"></i> নতুন নিবন্ধন
                    </button>
                </div>
            </div>
        </div>
    `;

    pdfContainer.style.display = 'block';
    pdfContainer.scrollIntoView({ behavior: 'smooth' });
}

function printPDF() {
    const printWindow = window.open('', '_blank');
    const pdfContent = document.getElementById('pdfPreviewContainer').innerHTML;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="bn">
        <head>
            <meta charset="UTF-8">
            <title>রক্তজবা ফাউন্ডেশন - নিবন্ধন নিশ্চিতকরণ</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Noto Sans Bengali', sans-serif; margin: 0; padding: 20px; background: white; }
                .pdf-preview-card { background: white; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; }
                .pdf-header { background: #e63946; padding: 20px; color: white; text-align: center; }
                .pdf-title { font-size: 1.8rem; margin: 10px 0; }
                .pdf-logo i { font-size: 40px; }
                .registration-id { font-size: 24px; font-weight: bold; color: #e63946; text-align: center; margin: 20px 0; font-family: 'Courier New', monospace; }
                .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px; }
                .info-item { padding: 8px; }
                .info-label { color: #666; font-size: 0.85rem; display: block; margin-bottom: 3px; }
                .info-value { font-weight: 600; padding: 8px; background: #f8f9fa; border-left: 3px solid #e63946; border-radius: 4px; }
                .section-title { color: #e63946; border-bottom: 2px solid #e63946; padding-bottom: 8px; margin: 20px; }
                .pdf-footer { background: #f8f9fa; padding: 15px; }
                .footer-instructions { background: white; padding: 15px; border-left: 4px solid #28a745; }
                .footer-instructions ul { list-style: none; padding: 0; }
                .footer-instructions li { padding: 6px 0; }
                .pdf-actions, .pdf-btn { display: none; }
                @media print { .pdf-actions { display: none !important; } }
            </style>
        </head>
        <body>${pdfContent}</body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 600);
}

function downloadPDF() {
    showAlert('PDF ডাউনলোড শুরু হচ্ছে...', 'info');
    setTimeout(() => printPDF(), 800);
}

function sharePDF() {
    const pdfContainer = document.getElementById('pdfPreviewContainer');
    if (!pdfContainer) return;

    const registrationId = pdfContainer.querySelector('.registration-id')?.textContent || '';
    const patientName    = pdfContainer.querySelector('.info-value')?.textContent || '';

    const shareText = `রক্তজবা ফাউন্ডেশন - নিবন্ধন নিশ্চিতকরণ\n\nনাম: ${patientName}\nনিবন্ধন আইডি: ${registrationId}\nতারিখ: ১৬ ডিসেম্বর ২০২৫\nস্থান: ভাটিরসুলপুর, এনায়েতনগর, মতলব(উত্তর), চাঁদপুর\n\nএই আইডিটি সাথে আনুন এবং ক্যাম্পে উপস্থিত হন।`;

    if (navigator.share) {
        navigator.share({
            title: 'রক্তজবা ফাউন্ডেশন - নিবন্ধন নিশ্চিতকরণ',
            text: shareText,
            url: window.location.href
        }).catch(() => fallbackShare(shareText));
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('নিবন্ধন তথ্য কপি করা হয়েছে!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showAlert('কপি করতে সমস্যা হচ্ছে, ম্যানুয়ালি কপি করুন', 'warning');
    });
}

function newRegistration() {
    const pdfContainer = document.getElementById('pdfPreviewContainer');
    if (pdfContainer) pdfContainer.style.display = 'none';

    const form = document.getElementById('patientRegistrationForm');
    form.reset();
    clearToggleError();

    form.scrollIntoView({ behavior: 'smooth' });
    showAlert('নতুন রোগী নিবন্ধন শুরু করুন', 'info');
}

// ============================================
// PATIENT STATUS CHECK
// ============================================

function initPatientStatusCheck() {
    const statusCheckForm = document.getElementById('statusCheckForm');
    if (!statusCheckForm) return;

    statusCheckForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const registrationId = document.getElementById('checkRegistrationId').value.trim();
        if (!registrationId) {
            showAlert('অনুগ্রহ করে নিবন্ধন আইডি দিন', 'warning');
            return;
        }

        const submitBtn = statusCheckForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        showLoading(submitBtn);

        try {
            if (!window.db) throw new Error('ডাটাবেজ সংযোগ নেই');

            const querySnapshot = await window.db.collection('patients')
                .where('registrationId', '==', registrationId)
                .limit(1)
                .get();

            if (querySnapshot.empty) {
                showAlert('প্রদত্ত নিবন্ধন আইডি দিয়ে কোন রোগী পাওয়া যায়নি।', 'warning');
                hideLoading(submitBtn, originalBtnText);
                return;
            }

            const patientData = querySnapshot.docs[0].data();
            displayPatientStatus(patientData);
        } catch (error) {
            console.error('স্ট্যাটাস চেক করার সময় ত্রুটি:', error);
            showAlert('স্ট্যাটাস চেক করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'danger');
        } finally {
            hideLoading(submitBtn, originalBtnText);
        }
    });
}

function displayPatientStatus(patientData) {
    const statusResult = document.getElementById('statusResult');
    if (!statusResult) return;

    const status = patientData.status;
    const banglaStatus = getBanglaStatus(status);

    let statusIcon, statusColor;
    switch (status) {
        case 'Waiting':       statusIcon = 'fa-clock';        statusColor = '#ffc107'; break;
        case 'Under Checkup': statusIcon = 'fa-user-md';      statusColor = '#17a2b8'; break;
        case 'Completed':     statusIcon = 'fa-check-circle'; statusColor = '#28a745'; break;
        default:              statusIcon = 'fa-question-circle'; statusColor = '#6c757d';
    }

    let regDate;
    if (patientData.registrationDate && patientData.registrationDate.toDate) {
        regDate = formatBangladeshiDateTime(patientData.registrationDate.toDate());
    } else if (patientData.registrationDateISO) {
        regDate = formatBangladeshiDateTime(new Date(patientData.registrationDateISO));
    } else {
        regDate = 'তারিখ পাওয়া যায়নি';
    }

    const ageDisplay    = getAgeDisplay(patientData);
    const genderDisplay = getBanglaGender(patientData.gender);

    const mh = getBanglaYesNo(patientData.medicalHistory      ?? patientData.hasMedicalHistory);
    const al = getBanglaYesNo(patientData.allergies           ?? patientData.hasAllergies);
    const pm = getBanglaYesNo(patientData.previousMedications ?? patientData.hasPreviousMedications);

    statusResult.innerHTML = `
        <div class="status-result-container animate-fade-in">
            <div class="status-card" style="background:white;border-radius:10px;padding:20px;box-shadow:0 5px 15px rgba(0,0,0,0.1);">
                <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid ${statusColor}">
                    <i class="fas ${statusIcon}" style="font-size:2rem;color:${statusColor}"></i>
                    <div>
                        <h3 class="bengali-text" style="margin:0 0 5px 0;">রোগীর স্ট্যাটাস</h3>
                        <span class="status-badge" style="background:${statusColor}">${banglaStatus}</span>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-bottom:20px;">
                    <div>
                        <h4 class="bengali-text" style="color:#e63946;margin-bottom:15px;">রোগীর তথ্য</h4>
                        <p class="bengali-text"><strong>নিবন্ধন আইডি:</strong> ${patientData.registrationId}</p>
                        <p class="bengali-text"><strong>নাম:</strong> ${patientData.fullName}</p>
                        <p class="bengali-text"><strong>বয়স/লিঙ্গ:</strong> ${ageDisplay} / ${genderDisplay}</p>
                        <p class="bengali-text"><strong>মোবাইল:</strong> ${formatBangladeshiPhoneNumber(patientData.phone)}</p>
                        <p class="bengali-text"><strong>BP:</strong> ${patientData.bpSystolic || '-'}/${patientData.bpDiastolic || '-'} mmHg</p>
                        <p class="bengali-text"><strong>ওজন:</strong> ${patientData.weight || '-'} কেজি</p>
                    </div>
                    <div>
                        <h4 class="bengali-text" style="color:#e63946;margin-bottom:15px;">নিবন্ধন বিবরণ</h4>
                        <p class="bengali-text"><strong>নিবন্ধনের সময়:</strong> ${regDate}</p>
                        <p class="bengali-text"><strong>রক্তের গ্রুপ:</strong> ${patientData.bloodGroup || 'নাই'}</p>
                        <p class="bengali-text"><strong>অপেক্ষার সময়:</strong> ${patientData.waitTime || 20} মিনিট</p>
                        <p class="bengali-text"><strong>চিকিৎসা ইতিহাস:</strong> ${mh}</p>
                        <p class="bengali-text"><strong>অ্যালার্জি:</strong> ${al}</p>
                        <p class="bengali-text"><strong>পূর্ববর্তী ঔষধ:</strong> ${pm}</p>
                        ${patientData.assignedDoctor ? `<p class="bengali-text"><strong>ডাক্তার:</strong> ${patientData.assignedDoctor}</p>` : ''}
                    </div>
                </div>

                <div style="background:#f8f9fa;padding:15px;border-radius:8px;border-left:4px solid ${statusColor}">
                    <h4 class="bengali-text" style="margin-top:0;">বর্তমান অবস্থা</h4>
                    <p class="bengali-text">${getStatusMessage(status)}</p>
                </div>
            </div>
        </div>
    `;

    statusResult.style.display = 'block';
    statusResult.scrollIntoView({ behavior: 'smooth' });
}

function getStatusMessage(status) {
    switch (status) {
        case 'Waiting': return 'আপনি অপেক্ষার তালিকায় আছেন। অনুগ্রহ করে আপনার নির্ধারিত সময়ে ক্যাম্প স্থানে উপস্থিত হন।';
        case 'Under Checkup': return 'আপনার চেকআপ বর্তমানে চলছে। ধৈর্য্য ধরুন, শীঘ্রই সম্পন্ন হবে।';
        case 'Completed': return 'আপনার চেকআপ সফলভাবে সম্পন্ন হয়েছে। ডাক্তারের পরামর্শ অনুসরণ করুন।';
        default: return 'স্ট্যাটাস পাওয়া যায়নি।';
    }
}

// ============================================
// ANIMATION FUNCTIONS
// ============================================

function initFocusAnimations() {
    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach(control => {
        control.addEventListener('focus', function () {
            this.parentElement.classList.add('focused');
        });
        control.addEventListener('blur', function () {
            if (!this.value) this.parentElement.classList.remove('focused');
        });
    });
}

function initFormValidationFeedback() {
    const form = document.getElementById('patientRegistrationForm');
    if (!form) return;

    form.addEventListener('input', function (e) {
        const input = e.target;
        if (input.classList.contains('form-control')) {
            if (input.checkValidity()) {
                input.classList.add('valid');
                input.classList.remove('invalid');
            } else {
                input.classList.add('invalid');
                input.classList.remove('valid');
            }
        }
    });
}

// ============================================
// EXPORTS
// ============================================

window.patientUtils = {
    generateSequentialRegistrationID,
    generateRegistrationID,
    showPDFPreview,
    displayPatientStatus,
    validateBangladeshiPhoneNumber,
    formatBangladeshiPhoneNumber,
    formatBangladeshiDateTime,
    getBanglaStatus,
    getBanglaGender,
    getBanglaYesNo,
    formatAgeBengali,
    getAgeDisplay,
    printPDF,
    downloadPDF,
    sharePDF,
    newRegistration,
    showAlert,
    showLoading,
    hideLoading,
    checkRegistrationIdExists
};

window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.db) {
            console.log("Firestore প্রস্তুত");
        } else {
            console.error("Firestore পাওয়া যায়নি");
            showAlert("অনুগ্রহ করে অপেক্ষা করুন, সিস্টেম লোড হচ্ছে...", 'warning');
        }
    }, 2000);
});
