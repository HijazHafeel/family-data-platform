// Application State
// AppState is declared in firebase-config.js

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupEventListeners();
});

// Check if user is already logged in
function checkSession() {
    const session = localStorage.getItem('userSession');
    if (session) {
        try {
            AppState.currentUser = JSON.parse(session);
            redirectToPortal(AppState.currentUser.role);
        } catch (error) {
            localStorage.removeItem('userSession');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add password visibility toggle
    setupPasswordToggles();
}

// Setup password visibility toggles
function setupPasswordToggles() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        const wrapper = input.parentElement;
        if (!wrapper.querySelector('.password-toggle')) {
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'password-toggle';
            toggle.innerHTML = '<i data-lucide="eye"></i>';
            toggle.setAttribute('aria-label', 'Toggle password visibility');
            toggle.style.cssText = `
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(calc(-50% - 10px));
                background: none;
                border: none;
                color: var(--text-light);
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                z-index: 10;
            `;

            wrapper.style.position = 'relative';
            wrapper.appendChild(toggle);

            toggle.addEventListener('click', () => {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                toggle.innerHTML = type === 'password'
                    ? '<i data-lucide="eye"></i>'
                    : '<i data-lucide="eye-off"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });

            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });
}

// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showToast('Please enter both email/username and password', 'error');
        return;
    }

    const loginBtn = document.querySelector('.btn-primary');
    const originalText = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i data-lucide="loader-2" style="width: 18px; height: 18px; animation: spin 1s linear infinite;"></i> Logging in...';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        let user = null;

        // --- PRIMARY: FIREBASE EMAIL AUTHENTICATION ---
        if (AppState.isFirebaseReady && auth) {
            try {
                // Determine if login is email or username
                const isEmail = username.includes('@');
                let loginEmail = username;

                // Fallback: If username is provided, look up email in Firestore
                if (!isEmail) {
                    const profile = await FirebaseDB.getUserByUsername(username);
                    if (profile && profile.email) {
                        loginEmail = profile.email;
                    }
                }

                if (loginEmail && loginEmail.includes('@')) {
                    try {
                        // Official Firebase Authentication
                        const userCredential = await auth.signInWithEmailAndPassword(loginEmail, password);

                        // Fetch full profile from Firestore
                        const allUsers = await FirebaseDB.getAllUsers();
                        user = allUsers.find(u => u.email === loginEmail);

                        if (user) {
                            if (user.status === 'pending') {
                                await auth.signOut();
                                showToast('Account pending admin approval', 'warning');
                                loginBtn.disabled = false;
                                loginBtn.innerHTML = originalText;
                                if (typeof lucide !== 'undefined') lucide.createIcons();
                                return;
                            }
                            if (user.status === 'disabled') {
                                await auth.signOut();
                                showToast('Account has been disabled. Contact admin.', 'error');
                                loginBtn.disabled = false;
                                loginBtn.innerHTML = originalText;
                                if (typeof lucide !== 'undefined') lucide.createIcons();
                                return;
                            }
                            loginSuccess(user);
                            return;
                        }
                    } catch (authError) {
                        console.warn('Firebase Auth failed:', authError.message);
                        if (authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found') {
                            // Don't return yet, try legacy fallback
                        } else {
                            throw authError;
                        }
                    }
                }
            } catch (error) {
                console.warn('Firebase lookup error:', error);
            }
        }

        // --- SECONDARY: LEGACY FALLBACK (Default Users & LocalStorage) ---
        const hashedPassword = await hashPassword(password);

        // Check default users (admin/staff)
        const defaultUsers = await getDefaultUsers();
        user = defaultUsers.find(u => u.username === username && u.password === hashedPassword);

        if (user) {
            loginSuccess(user);
            return;
        }

        // Check LocalStorage for registered users
        const registeredUsers = JSON.parse(localStorage.getItem('platformUsers') || '[]');
        user = registeredUsers.find(u => (u.username === username || u.email === username) && u.password === hashedPassword);

        if (user) {
            if (user.status === 'pending') {
                showToast('Account pending admin approval', 'warning');
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalText;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            if (user.status === 'disabled') {
                showToast('Account has been disabled. Contact admin.', 'error');
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalText;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            loginSuccess(user);
        } else {
            showToast('Invalid credentials. Please try again.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed: ' + error.message, 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Login success
function loginSuccess(user) {
    AppState.currentUser = {
        username: user.username,
        role: user.role,
        fullName: user.fullName || user.username,
        email: user.email || ''
    };

    localStorage.setItem('userSession', JSON.stringify(AppState.currentUser));
    showToast(`Welcome, ${AppState.currentUser.fullName}!`, 'success');

    setTimeout(() => {
        redirectToPortal(user.role);
    }, 500);
}

// Redirect to appropriate portal
function redirectToPortal(role) {
    const currentPage = window.location.pathname.split('/').pop();
    if (role === 'admin' && currentPage !== 'admin-dashboard.html') {
        window.location.href = 'admin-dashboard.html';
    } else if (role === 'staff' && currentPage !== 'data-entry.html') {
        window.location.href = 'data-entry.html';
    }
}

// Get default users (for initial setup)
async function getDefaultUsers() {
    const adminPassword = await hashPassword('admin123');
    const staffPassword = await hashPassword('staff123');

    return [
        {
            username: 'admin',
            password: adminPassword,
            role: 'admin',
            fullName: 'Administrator',
            status: 'active'
        },
        {
            username: 'staff',
            password: staffPassword,
            role: 'staff',
            fullName: 'Data Entry Staff',
            status: 'active'
        }
    ];
}

// Logout function
function logout() {
    if (AppState.isFirebaseReady && auth) {
        auth.signOut().catch(err => console.error('Sign out error:', err));
    }
    localStorage.removeItem('userSession');
    AppState.currentUser = null;
    window.location.href = 'index.html';
}

// Show toast notification (IMPROVED)
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i data-lucide="${icons[type] || 'info'}" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
            <span style="flex: 1;">${message}</span>
        </div>
    `;

    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Validate family form data
function validateFamilyData(data) {
    const errors = [];

    if (!data.familyName || data.familyName.trim() === '') {
        errors.push('Family name is required');
    }

    if (!data.contactNumber || data.contactNumber.trim() === '') {
        errors.push('Contact number is required');
    } else if (!/^\d{10}$/.test(data.contactNumber.replace(/[-\s]/g, ''))) {
        errors.push('Contact number must be 10 digits');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }

    if (!data.address || data.address.trim() === '') {
        errors.push('Address is required');
    }

    if (!data.numberOfMembers || data.numberOfMembers < 1) {
        errors.push('Number of members must be at least 1');
    }

    return errors;
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    if (!input) return '';
    const div = document.createElement('div');
    div.textContent = String(input);
    return div.innerHTML;
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format phone number
function formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

// Export data as JSON
function exportAsJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, filename);
}

// Export data as CSV
function exportAsCSV(data, filename) {
    if (data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, filename);
}

// Download file
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Confirm dialog
function confirmAction(message) {
    return new Promise((resolve) => {
        const confirmed = confirm(message);
        resolve(confirmed);
    });
}

// Add loading spinner
function showLoadingSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loadingSpinner';
    container.appendChild(spinner);
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.remove();
}

// Firebase is automatically initialized in firebase-config.js if SDK is present
