// ==================== LOGIN SYSTEM ====================
const USERS_KEY = "lostfinder_users";

// Helper function to show toast message
function showToast(message, isError = true) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = message;
    toast.style.background = isError ? '#5a1e15' : '#1a1410';
    toast.style.borderColor = isError ? 'rgba(192,57,43,0.4)' : '#c8b690';
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
    // Create demo user if no users exist
    const defaultUsers = {
        "user@example.com": {
            email: "user@example.com",
            password: "password123",
            name: "Pengguna Demo"
        }
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast("Sila masukkan email dan kata laluan.", true);
        return;
    }
    
    const users = getUsers();
    
    // Check if user exists
    if (users[email] && users[email].password === password) {
        // Store logged in user info
        sessionStorage.setItem("loggedInUser", users[email].name || email.split('@')[0]);
        sessionStorage.setItem("userEmail", email);
        
        showToast(`Selamat datang kembali, ${users[email].name || email.split('@')[0]}!`, false);
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);
    } else {
        // Check if email exists but password wrong
        if (users[email]) {
            showToast("Kata laluan salah. Sila cuba lagi.", true);
        } else {
            showToast("Email tidak berdaftar. Sila daftar akaun terlebih dahulu.", true);
        }
    }
}

// Check if user is already logged in
function checkAlreadyLoggedIn() {
    if (sessionStorage.getItem("loggedInUser")) {
        // User already logged in, redirect to dashboard
        window.location.href = "index.html";
    }
}

// Initialize login form listener
function initLogin() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    // Add input focus effects
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

// Show demo credentials on console
function showDemoCredentials() {
    console.log("🔐 Login demo credentials:");
    console.log("   Email: user@example.com");
    console.log("   Password: password123");
    console.log("   Or register a new account at signup.html");
}

// Run initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAlreadyLoggedIn();
    initLogin();
    showDemoCredentials();
});