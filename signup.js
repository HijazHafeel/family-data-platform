// Signup Page Logic

document.addEventListener('DOMContentLoaded', () => {
    setupSignupForm();
});

// Setup signup form handler
function setupSignupForm() {
    const form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', handleSignup);
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const organization = document.getElementById('organization').value.trim();

    // Validate inputs
    const errors = validateSignupData({
        fullName,
        username,
        email,
        password,
        confirmPassword,
        role
    });

    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }

    const submitBtn = document.querySelector('.btn-primary');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Check if username already exists
        const existingUser = await checkUsernameExists(username);
        if (existingUser) {
            showToast('Username already taken. Please choose another.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
            return;
        }

        // Create user data
        const userData = {
            fullName,
            username,
            email,
            password: hashedPassword,
            role: role === 'admin' ? 'pending-admin' : role, // Admin accounts need approval
            organization,
            status: role === 'admin' ? 'pending' : 'active',
            createdAt: Date.now(),
            approvedBy: null
        };

        // Save user
        if (AppState.isFirebaseReady && FirebaseDB) {
            await FirebaseDB.addUser(userData);
        } else {
            // Save to localStorage
            const users = JSON.parse(localStorage.getItem('platformUsers') || '[]');
            userData.id = 'USER' + Date.now();
            users.push(userData);
            localStorage.setItem('platformUsers', JSON.stringify(users));
        }

        // Show success message
        if (role === 'admin') {
            showToast('Account created! Admin approval required before you can login.', 'success');
        } else {
            showToast('Account created successfully! Redirecting to login...', 'success');
        }

        // Redirect to login after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (error) {
        console.error('Signup error:', error);
        showToast('Error creating account. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
}

// Validate signup data
function validateSignupData(data) {
    const errors = [];

    if (!data.fullName || data.fullName.length < 2) {
        errors.push('Full name must be at least 2 characters');
    }

    if (!data.username || data.username.length < 3) {
        errors.push('Username must be at least 3 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Please enter a valid email address');
    }

    if (!data.password || data.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (data.password !== data.confirmPassword) {
        errors.push('Passwords do not match');
    }

    if (!data.role) {
        errors.push('Please select an account type');
    }

    return errors;
}

// Check if username exists
async function checkUsernameExists(username) {
    try {
        if (AppState.isFirebaseReady && FirebaseDB) {
            const user = await FirebaseDB.getUserByUsername(username);
            return user !== null;
        } else {
            const users = JSON.parse(localStorage.getItem('platformUsers') || '[]');
            return users.some(u => u.username === username);
        }
    } catch (error) {
        console.error('Error checking username:', error);
        return false;
    }
}
