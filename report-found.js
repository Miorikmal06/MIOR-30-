// ==================== REPORT FOUND ITEM ====================
const STORAGE_KEY = "lostfound_items";
const currentUser = sessionStorage.getItem("loggedInUser");

// Check authentication
if (!currentUser) {
    window.location.href = "login.html";
}

// Get user email from profile or session
let userEmail = sessionStorage.getItem("userEmail") || `${currentUser}@example.com`;

// DOM Elements
const form = document.getElementById('reportFoundForm');
const itemTitle = document.getElementById('itemTitle');
const itemCategory = document.getElementById('itemCategory');
const itemDescription = document.getElementById('itemDescription');
const itemLocation = document.getElementById('itemLocation');
const itemDate = document.getElementById('itemDate');
const itemImage = document.getElementById('itemImage');
const userContact = document.getElementById('userContact');
const uploadArea = document.getElementById('uploadArea');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImageBtn');
const resetBtn = document.getElementById('resetBtn');

let currentImageData = null;

// Set today's date as default
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    if (itemDate) itemDate.value = today;
}

// Set user contact
function setUserContact() {
    if (userContact) {
        userContact.value = userEmail;
    }
}

// Load all items from storage
function loadAllItems() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

// Save all items to storage
function saveAllItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Generate unique ID
function generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Format date to readable format
function formatDate(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];
    return dateString;
}

// Show toast notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = message;
    toast.style.background = isError ? '#5a1e15' : '#1a1410';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Validate form
function validateForm() {
    if (!itemTitle.value.trim()) {
        showToast("Sila masukkan nama/jenis barang.", true);
        itemTitle.focus();
        return false;
    }
    
    if (!itemCategory.value) {
        showToast("Sila pilih kategori barang.", true);
        itemCategory.focus();
        return false;
    }
    
    if (!itemDescription.value.trim()) {
        showToast("Sila masukkan penerangan terperinci tentang barang.", true);
        itemDescription.focus();
        return false;
    }
    
    if (!itemLocation.value.trim()) {
        showToast("Sila masukkan lokasi anda menemui barang.", true);
        itemLocation.focus();
        return false;
    }
    
    if (!itemDate.value) {
        showToast("Sila pilih tarikh anda menemui barang.", true);
        itemDate.focus();
        return false;
    }
    
    return true;
}

// Create new item object
function createNewItem() {
    const newItem = {
        id: generateId(),
        title: itemTitle.value.trim(),
        category: itemCategory.value,
        description: itemDescription.value.trim(),
        location: itemLocation.value.trim(),
        date: formatDate(itemDate.value),
        status: "found",
        reporter: currentUser,
        contact: userEmail,
        reportedAt: new Date().toISOString()
    };
    
    // Add image if available
    if (currentImageData) {
        newItem.image = currentImageData;
    }
    
    return newItem;
}

// Save report to storage and trigger global update
function saveReport(item) {
    const items = loadAllItems();
    items.unshift(item); // Add to beginning (newest first)
    saveAllItems(items);
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(items)
    }));
    
    // Call global function if exists (for browse-items page)
    if (typeof window.addNewReportItem === 'function') {
        window.addNewReportItem(item);
    }
}

// Reset form
function resetForm() {
    itemTitle.value = '';
    itemCategory.value = '';
    itemDescription.value = '';
    itemLocation.value = '';
    setDefaultDate();
    currentImageData = null;
    imagePreview.style.display = 'none';
    previewImg.src = '';
    itemImage.value = '';
    showToast("Borang telah direset.", false);
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const newItem = createNewItem();
    
    // Save to storage
    saveReport(newItem);
    
    // Show success message
    showToast(`✅ Laporan "${newItem.title}" berjaya dihantar! Terima kasih kerana prihatin.`, false);
    
    // Reset form after successful submission
    resetForm();
    
    // Optional: redirect after 2 seconds
    setTimeout(() => {
        if (confirm("Laporan berjaya! Ingin ke halaman Browse untuk melihat semua laporan?")) {
            window.location.href = "browse-items.html";
        }
    }, 1500);
}

// Handle image upload
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
        currentImageData = e.target.result;
        previewImg.src = currentImageData;
        imagePreview.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
}

// Remove image
function removeImage() {
    currentImageData = null;
    imagePreview.style.display = 'none';
    previewImg.src = '';
    itemImage.value = '';
    showToast("Gambar telah dibuang.", false);
}

// Setup upload area event listeners
function setupUploadArea() {
    if (!uploadArea) return;
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        itemImage.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#1a6b5c';
        uploadArea.style.background = '#f5efe2';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#cfc3ac';
        uploadArea.style.background = '#fefaf0';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#cfc3ac';
        uploadArea.style.background = '#fefaf0';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        } else {
            showToast("Sila letakkan fail gambar yang sah.", true);
        }
    });
    
    // File input change
    itemImage.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    });
    
    // Remove image button
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', removeImage);
    }
}

// Check if there's a pending item from lost page (for switching)
function checkPendingItem() {
    const pendingItem = sessionStorage.getItem("pendingFoundItem");
    if (pendingItem) {
        try {
            const item = JSON.parse(pendingItem);
            if (item.title) itemTitle.value = item.title;
            if (item.category) itemCategory.value = item.category;
            if (item.location) itemLocation.value = item.location;
            if (item.description) itemDescription.value = item.description;
            sessionStorage.removeItem("pendingFoundItem");
            showToast("Maklumat dari laporan Hilang telah dipindahkan. Sila lengkapkan.", false);
        } catch (e) {
            console.error("Error parsing pending item:", e);
        }
    }
}

// Initialize page
function init() {
    setDefaultDate();
    setUserContact();
    setupUploadArea();
    checkPendingItem();
    
    // Form submit
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
    
    console.log("📝 Report Found page ready for:", currentUser);
    console.log("💡 Tips: Sertakan gambar dan penerangan yang jelas untuk memudahkan pemilik mengenal pasti barang.");
}

// Run initialization
init();