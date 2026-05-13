// ==================== SIGN UP SYSTEM ====================
const USERS_KEY = "lostfinder_users";

// Helper function to show toast message
function showToast(message, isError = true) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = message;
    toast.style.background = isError ? '#5a1e15' : '#1a1410';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Get all registered users from localStorage
function getUsers() {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return {};
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number (optional, basic validation)
function isValidPhone(phone) {
    if (!phone) return true;
    const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
    return phoneRegex.test(phone);
}

// Initialize user profile in profiles storage
function initUserProfile(email, name, phone) {
    const PROFILES_KEY = "lostfinder_user_profiles";
    const stored = localStorage.getItem(PROFILES_KEY);
    let profiles = stored ? JSON.parse(stored) : {};
    
    profiles[email] = {
        username: name,
        email: email,
        phone: phone || "",
        location: "",
        bio: "",
        profileImage: null,
        joinedAt: new Date().toISOString()
    };
    
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    // Validation
    if (!fullName) {
        showToast("Sila masukkan nama penuh anda.", true);
        return;
    }
    
    if (!email) {
        showToast("Sila masukkan alamat email.", true);
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast("Email tidak sah. Contoh: nama@domain.com", true);
        return;
    }
    
    if (password.length < 6) {
        showToast("Kata laluan minimum 6 aksara.", true);
        return;
    }
    
    if (phone && !isValidPhone(phone)) {
        showToast("Nombor telefon tidak sah.", true);
        return;
    }
    
    const users = getUsers();
    
    // Check if email already registered
    if (users[email]) {
        showToast("Email sudah berdaftar. Sila log masuk atau gunakan email lain.", true);
        return;
    }
    
    // Create new user
    users[email] = {
        email: email,
        password: password,
        name: fullName,
        phone: phone || "",
        joinedAt: new Date().toISOString()
    };
    
    saveUsers(users);
    
    // Initialize user profile
    initUserProfile(email, fullName, phone);
    
    // Store session
    sessionStorage.setItem("loggedInUser", fullName);
    sessionStorage.setItem("userEmail", email);
    
    showToast(`🎉 Selamat datang, ${fullName}! Pendaftaran berjaya.`, false);
    
    // Redirect to dashboard after short delay
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

// Check if user is already logged in
function checkAlreadyLoggedIn() {
    if (sessionStorage.getItem("loggedInUser")) {
        window.location.href = "index.html";
    }
}

// Setup password strength indicator
function setupPasswordHint() {
    const pwdInput = document.getElementById('signupPassword');
    const hintSpan = document.querySelector('.password-hint span');
    
    if (pwdInput && hintSpan) {
        pwdInput.addEventListener('input', function() {
            const value = this.value;
            const length = value.length;
            
            if (length === 0) {
                hintSpan.innerHTML = 'Kata laluan mestilah sekurang-kurangnya 6 aksara';
                hintSpan.style.color = 'var(--muted)';
            } else if (length < 6) {
                hintSpan.innerHTML = '⚠️ Kata laluan terlalu pendek (minimum 6 aksara)';
                hintSpan.style.color = 'var(--red)';
            } else if (length >= 6 && length < 8) {
                hintSpan.innerHTML = '✓ Kata laluan lemah (tambah huruf besar/nombor)';
                hintSpan.style.color = 'var(--amber)';
            } else if (length >= 8) {
                // Check for complexity
                const hasUpper = /[A-Z]/.test(value);
                const hasNumber = /[0-9]/.test(value);
                if (hasUpper && hasNumber) {
                    hintSpan.innerHTML = '✓ Kata laluan kukuh!';
                    hintSpan.style.color = 'var(--teal)';
                } else {
                    hintSpan.innerHTML = '✓ Kata laluan baik (tambah huruf besar & nombor untuk lebih selamat)';
                    hintSpan.style.color = 'var(--amber)';
                }
            }
        });
    }
}

// Add floating label effect
function setupFloatingLabels() {
    const inputs = document.querySelectorAll('.auth-box input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.01)';
        });
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
}

// Add demo account info to console
function showDemoInfo() {
    console.log("📝 Sign Up page ready!");
    console.log("💡 Tips: Daftar akaun baru atau login dengan demo account:");
    console.log("   Email: user@example.com");
    console.log("   Password: password123");
}

// Initialize signup form
function initSignup() {
    const form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', handleSignup);
    }
    
    setupPasswordHint();
    setupFloatingLabels();
}

// Run initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAlreadyLoggedIn();
    initSignup();
    showDemoInfo();
});

// Export for potential external use
window.signupHelpers = {
    getUsers,
    saveUsers,
    isValidEmail,
    isValidPhone
};