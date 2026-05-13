// ==================== AUTH & PROFILE STORAGE ====================
const currentUser = sessionStorage.getItem("loggedInUser");
if (!currentUser) {
    window.location.href = "login.html";
}

// Key for user profiles
const USER_PROFILES_KEY = "lostfinder_user_profiles";

// Default profile structure
function getDefaultProfile(username) {
    return {
        username: username,
        email: `${username}@example.com`,
        phone: "",
        location: "",
        bio: "",
        profileImage: null, // base64 string
        joinedAt: new Date().toISOString()
    };
}

// Load all user profiles
function getAllProfiles() {
    const stored = localStorage.getItem(USER_PROFILES_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return {};
}

function saveAllProfiles(profiles) {
    localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(profiles));
}

// Get current user profile
function getUserProfile() {
    const profiles = getAllProfiles();
    if (!profiles[currentUser]) {
        profiles[currentUser] = getDefaultProfile(currentUser);
        saveAllProfiles(profiles);
    }
    return profiles[currentUser];
}

function updateUserProfile(updatedProfile) {
    const profiles = getAllProfiles();
    profiles[currentUser] = { ...profiles[currentUser], ...updatedProfile };
    saveAllProfiles(profiles);
}

// DOM elements
const profileImg = document.getElementById('profileImg');
const profilePlaceholder = document.getElementById('profilePlaceholder');
const usernameInput = document.getElementById('usernameInput');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const locationInput = document.getElementById('locationInput');
const bioInput = document.getElementById('bioInput');
const toggleEditBtn = document.getElementById('toggleEditBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const profileImageInput = document.getElementById('profileImageInput');
const cameraOverlay = document.getElementById('cameraOverlay');
const profilePicWrapper = document.getElementById('profilePicWrapper');

let isEditMode = false;

// Load profile data into UI
function loadProfileToUI() {
    const profile = getUserProfile();
    usernameInput.value = profile.username || currentUser;
    emailInput.value = profile.email || "";
    phoneInput.value = profile.phone || "";
    locationInput.value = profile.location || "";
    bioInput.value = profile.bio || "";
    
    // Load profile image
    if (profile.profileImage && profile.profileImage.startsWith('data:image')) {
        profileImg.src = profile.profileImage;
        profileImg.style.display = 'block';
        profilePlaceholder.style.display = 'none';
    } else {
        profileImg.style.display = 'none';
        profilePlaceholder.style.display = 'flex';
    }
}

// Save profile from UI
function saveProfileFromUI() {
    const updatedProfile = {
        username: usernameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        location: locationInput.value,
        bio: bioInput.value,
    };
    
    // Preserve existing image if not changed
    const currentProfile = getUserProfile();
    if (currentProfile.profileImage) {
        updatedProfile.profileImage = currentProfile.profileImage;
    }
    
    updateUserProfile(updatedProfile);
    
    // If username changed, update sessionStorage
    if (updatedProfile.username !== currentUser) {
        sessionStorage.setItem("loggedInUser", updatedProfile.username);
        showToast("Nama pengguna ditukar. Sila log masuk semula untuk kesan penuh.", true);
        setTimeout(() => {
            sessionStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        }, 2000);
        return;
    }
    
    showToast("Profil berjaya dikemaskini!");
    loadProfileToUI();
    setEditMode(false);
}

// Handle profile image upload
function handleImageUpload(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showToast("Gambar melebihi 2MB. Sila pilih gambar yang lebih kecil.", true);
        return;
    }
    if (!file.type.startsWith('image/')) {
        showToast("Sila pilih fail gambar (JPG, PNG, WEBP).", true);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageBase64 = e.target.result;
        // Update profile in storage
        const profiles = getAllProfiles();
        if (!profiles[currentUser]) profiles[currentUser] = getDefaultProfile(currentUser);
        profiles[currentUser].profileImage = imageBase64;
        saveAllProfiles(profiles);
        
        // Update UI
        profileImg.src = imageBase64;
        profileImg.style.display = 'block';
        profilePlaceholder.style.display = 'none';
        showToast("Gambar profil berjaya dimuat naik!");
    };
    reader.readAsDataURL(file);
}

function setEditMode(edit) {
    isEditMode = edit;
    const disabledState = !edit;
    usernameInput.disabled = disabledState;
    emailInput.disabled = disabledState;
    phoneInput.disabled = disabledState;
    locationInput.disabled = disabledState;
    bioInput.disabled = disabledState;
    
    if (edit) {
        toggleEditBtn.innerHTML = '<i class="fas fa-times"></i> Batal';
        toggleEditBtn.style.background = '#ede0cf';
        saveProfileBtn.style.display = 'flex';
    } else {
        toggleEditBtn.innerHTML = '<i class="fas fa-pen"></i> Edit Profile';
        toggleEditBtn.style.background = 'transparent';
        saveProfileBtn.style.display = 'none';
    }
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = msg;
    toast.style.background = isError ? '#5a1e15' : '#1a1410';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
}

// Logout function
function logout() {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}

// Event Listeners
toggleEditBtn.addEventListener('click', () => {
    if (isEditMode) {
        // Cancel edit - reload original data
        loadProfileToUI();
        setEditMode(false);
    } else {
        setEditMode(true);
    }
});

saveProfileBtn.addEventListener('click', saveProfileFromUI);
logoutBtn.addEventListener('click', logout);

// Profile picture upload
cameraOverlay.addEventListener('click', () => {
    profileImageInput.click();
});

profilePicWrapper.addEventListener('click', () => {
    profileImageInput.click();
});

profileImageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0]);
    }
});

// Optional: drag & drop for profile picture
profilePicWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    profilePicWrapper.style.opacity = '0.7';
});

profilePicWrapper.addEventListener('dragleave', () => {
    profilePicWrapper.style.opacity = '1';
});

profilePicWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    profilePicWrapper.style.opacity = '1';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    } else {
        showToast("Sila letakkan fail gambar.", true);
    }
});

// Initialize
loadProfileToUI();
setEditMode(false);

console.log("Profile page ready - user can upload profile picture");