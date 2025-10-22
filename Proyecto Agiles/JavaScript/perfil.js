// --- Responsive sidebar ---
const sidebar = document.getElementById('sidebar');
document.getElementById('openSidebar')?.addEventListener('click', ()=> sidebar.classList.add('open'));
document.getElementById('closeSidebar')?.addEventListener('click', ()=> sidebar.classList.remove('open'));

// --- DOM Elements ---
const inpNombre = document.getElementById('inpNombre');
const inpEmail = document.getElementById('inpEmail');
const pwdActual = document.getElementById('pwdActual');
const pwdNueva = document.getElementById('pwdNueva');
const pwdConfirm = document.getElementById('pwdConfirm');
const btnSaveAll = document.getElementById('btnSaveAll');
const btnCambiarPwd = document.getElementById('btnCambiarPwd');
const btnLogout = document.getElementById('btnLogout');
const btnExportData = document.getElementById('btnExportData');
const pwdMsg = document.getElementById('pwdMsg');
const lastUpdate = document.getElementById('lastUpdate');
const toast = document.getElementById('toast');
const passwordStrength = document.querySelector('.password-strength > div');

// --- User data ---
let userData = {
    nombre: 'AgroFlux Administrator',
    email: 'admin@agroflux.com',
    lastUpdated: new Date(),
    preferences: {
        theme: 'dark',
        language: 'en'
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    updateLastUpdate();
    setupEventListeners();
    setupPasswordStrength();
});

// --- Setup event listeners ---
function setupEventListeners() {
    btnSaveAll?.addEventListener('click', saveUserData);
    btnCambiarPwd.addEventListener('click', changePassword);
    btnLogout.addEventListener('click', logout);
    btnExportData.addEventListener('click', exportUserData);
    
    // Auto-save when changing fields
    inpNombre.addEventListener('blur', saveUserData);
    inpEmail.addEventListener('blur', saveUserData);
    
    // Password strength
    pwdNueva.addEventListener('input', updatePasswordStrength);
}

// --- Setup password strength ---
function setupPasswordStrength() {
    if (passwordStrength) {
        updatePasswordStrength();
    }
}

function updatePasswordStrength() {
    if (!passwordStrength) return;
    
    const password = pwdNueva.value;
    let strength = 0;
    
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    // Update visual
    passwordStrength.className = '';
    passwordStrength.style.width = `${Math.min(strength, 100)}%`;
    
    if (strength < 40) {
        passwordStrength.classList.add('strength-weak');
    } else if (strength < 70) {
        passwordStrength.classList.add('strength-fair');
    } else if (strength < 90) {
        passwordStrength.classList.add('strength-good');
    } else {
        passwordStrength.classList.add('strength-strong');
    }
}

// --- Load user data ---
function loadUserData() {
    // Try to load from localStorage
    const savedData = localStorage.getItem('agroflux_user');
    if (savedData) {
        userData = { ...userData, ...JSON.parse(savedData) };
    }
    
    // Update fields
    inpNombre.value = userData.nombre;
    inpEmail.value = userData.email;
    
    // Update preferences
    const themeSelect = document.querySelector('select[value="theme"]');
    const languageSelect = document.querySelector('select[value="language"]');
    
    if (themeSelect) themeSelect.value = userData.preferences?.theme || 'dark';
    if (languageSelect) languageSelect.value = userData.preferences?.language || 'en';
}

// --- Save user data ---
function saveUserData() {
    const newData = {
        nombre: inpNombre.value.trim(),
        email: inpEmail.value.trim(),
        preferences: {
            theme: document.querySelector('select[value="theme"]')?.value || 'dark',
            language: document.querySelector('select[value="language"]')?.value || 'en'
        }
    };

    // Basic validations
    if (!newData.nombre) {
        showToast('Name cannot be empty', 'error');
        inpNombre.focus();
        return false;
    }

    if (!newData.email || !isValidEmail(newData.email)) {
        showToast('Please enter a valid email address', 'error');
        inpEmail.focus();
        return false;
    }

    // Update data
    userData = { ...userData, ...newData, lastUpdated: new Date() };
    localStorage.setItem('agroflux_user', JSON.stringify(userData));
    
    showToast('Information saved successfully', 'success');
    updateLastUpdate();
    return true;
}

// --- Change password ---
function changePassword() {
    const current = pwdActual.value;
    const newPwd = pwdNueva.value;
    const confirm = pwdConfirm.value;

    // Validations
    if (!current) {
        showToast('Please enter your current password', 'error');
        pwdActual.focus();
        return;
    }

    if (!newPwd) {
        showToast('Please enter a new password', 'error');
        pwdNueva.focus();
        return;
    }

    if (newPwd.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        pwdNueva.focus();
        return;
    }

    if (newPwd !== confirm) {
        showToast('Passwords do not match', 'error');
        pwdConfirm.focus();
        return;
    }

    // Simulate password change (in a real system, this would be an API call)
    pwdMsg.textContent = 'Password changed successfully';
    pwdMsg.style.color = '#22c55e';
    
    // Clear fields
    pwdActual.value = '';
    pwdNueva.value = '';
    pwdConfirm.value = '';
    
    // Reset password strength
    if (passwordStrength) {
        passwordStrength.style.width = '0%';
        passwordStrength.className = '';
    }
    
    showToast('Password changed successfully', 'success');
    
    // Clear message after 3 seconds
    setTimeout(() => {
        pwdMsg.textContent = '';
    }, 3000);
}

// --- Export data ---
function exportUserData() {
    const data = {
        perfil: userData,
        exportDate: new Date().toISOString(),
        sistema: 'AgroFlux v0.1 - Arduino',
        timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `agroflux_data_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully', 'success');
}

// --- Sign out ---
function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        showToast('Session closed', 'info');
        // Simulate delay to show toast
        setTimeout(() => {
            // In a real app, you would clear the session here
            window.location.href = '../HTML/login.html'; // or dashboard.html
        }, 1500);
    }
}

// --- Utilities ---
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function updateLastUpdate() {
    if (userData.lastUpdated) {
        const date = new Date(userData.lastUpdated);
        lastUpdate.textContent = date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

function showToast(message, type = 'info') {
    // Clear previous toast
    toast.textContent = message;
    toast.className = 'toast';
    
    // Add classes based on type
    toast.classList.add('show');
    toast.classList.add(`toast-${type}`);
    
    // Add icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `${icon} ${message}`;
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Auto-save every 30 seconds ---
setInterval(() => {
    if (inpNombre.value !== userData.nombre || inpEmail.value !== userData.email) {
        saveUserData();
    }
}, 30000);