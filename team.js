// ==================== TEAM PAGE SCRIPT ====================
const TEAM_STORAGE_KEY = "lostfinder_team_photos";

// Team member identifiers
const teamMembers = {
    ikmal: {
        name: "Mior Muhammad Ikmal bin Mior Darul Ridzuan",
        shortName: "Ikmal",
        imageKey: "ikmalPhoto",
        defaultImage: "https://placehold.co/300x300/e8dfce/8b7d6b?text=Ikmal+Photo"
    },
    syamsul: {
        name: "Muhammad Syamsul Nazir bin Samsuri",
        shortName: "Syamsul",
        imageKey: "syamsulPhoto",
        defaultImage: "https://placehold.co/300x300/e0d3be/7a6a50?text=Syamsul+Photo"
    }
};

let currentEditingMember = null;

// Load saved profile images from localStorage
function loadSavedImages() {
    const saved = localStorage.getItem(TEAM_STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return {};
}

// Save profile image to localStorage
function saveProfileImage(memberId, imageData) {
    const saved = loadSavedImages();
    saved[memberId] = imageData;
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(saved));
}

// Apply saved images to the page
function applySavedImages() {
    const saved = loadSavedImages();
    
    if (saved.ikmal) {
        const ikmalImg = document.getElementById('ikmalPhoto');
        if (ikmalImg) ikmalImg.src = saved.ikmal;
    }
    
    if (saved.syamsul) {
        const syamsulImg = document.getElementById('syamsulPhoto');
        if (syamsulImg) syamsulImg.src = saved.syamsul;
    }
}

// Show toast notification
function showToast(message, isError = false) {
    let toast = document.querySelector('.toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-msg';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.background = isError ? '#5a1e15' : '#1a1410';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Update profile image for a member
function updateProfileImage(memberId, imageUrl) {
    const member = teamMembers[memberId];
    if (!member) return false;
    
    // Validate URL is an image
    if (!imageUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) && !imageUrl.startsWith('data:image')) {
        showToast("Sila masukkan URL gambar yang sah (JPG, PNG, WEBP)", true);
        return false;
    }
    
    // Update image in DOM
    const imgElement = document.getElementById(member.imageKey);
    if (imgElement) {
        imgElement.src = imageUrl;
        imgElement.onerror = function() {
            this.src = member.defaultImage;
            showToast("Gambar gagal dimuatkan. Menggunakan gambar lalai.", true);
        };
    }
    
    // Save to localStorage
    saveProfileImage(memberId, imageUrl);
    showToast(`Gambar profil ${member.shortName} berjaya dikemaskini!`, false);
    return true;
}

// Open upload modal for a specific member
function openUploadModal(memberId) {
    currentEditingMember = memberId;
    const member = teamMembers[memberId];
    const modal = document.getElementById('uploadModal');
    const memberNamePreview = document.getElementById('memberNamePreview');
    
    if (memberNamePreview) {
        memberNamePreview.textContent = member.name;
    }
    
    // Clear previous inputs
    const fileInput = document.getElementById('modalFileInput');
    const urlInput = document.getElementById('modalImageUrl');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Close upload modal
function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingMember = null;
}

// Process image file upload
function processImageFile(file) {
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
        if (currentEditingMember) {
            updateProfileImage(currentEditingMember, e.target.result);
            closeUploadModal();
        }
    };
    reader.readAsDataURL(file);
}

// Process image URL
function processImageUrl(url) {
    if (!url.trim()) {
        showToast("Sila masukkan URL gambar.", true);
        return;
    }
    
    if (currentEditingMember) {
        updateProfileImage(currentEditingMember, url.trim());
        closeUploadModal();
    }
}

// Initialize event listeners
function initEventListeners() {
    // Profile picture click events
    const ikmalProfile = document.querySelector('.member-card[data-member="ikmal"] .profile-pic');
    const syamsulProfile = document.querySelector('.member-card[data-member="syamsul"] .profile-pic');
    
    if (ikmalProfile) {
        ikmalProfile.addEventListener('click', () => openUploadModal('ikmal'));
    }
    
    if (syamsulProfile) {
        syamsulProfile.addEventListener('click', () => openUploadModal('syamsul'));
    }
    
    // Modal close button
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeUploadModal);
    }
    
    // Click outside modal to close
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeUploadModal();
            }
        });
    }
    
    // Upload area click for file input
    const uploadArea = document.getElementById('modalUploadArea');
    const fileInput = document.getElementById('modalFileInput');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#1a6b5c';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#cfc3ac';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#cfc3ac';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                processImageFile(file);
            } else {
                showToast("Sila letakkan fail gambar yang sah.", true);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                processImageFile(e.target.files[0]);
            }
        });
    }
    
    // URL add button
    const addUrlBtn = document.getElementById('modalAddUrlBtn');
    const urlInput = document.getElementById('modalImageUrl');
    
    if (addUrlBtn && urlInput) {
        addUrlBtn.addEventListener('click', () => {
            processImageUrl(urlInput.value);
        });
        
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                processImageUrl(urlInput.value);
            }
        });
    }
}

// Initialize the page
function init() {
    applySavedImages();
    initEventListeners();
    console.log("✨ Team page loaded — Klik pada gambar profil untuk menukar gambar ✨");
    console.log("📸 Nama team: Mior Muhammad Ikmal & Muhammad Syamsul Nazir");
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);