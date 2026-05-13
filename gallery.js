// ==================== PUBLIC GALLERY - TIADA REDIRECT LOGIN ====================
const currentUser = sessionStorage.getItem("loggedInUser");
const GALLERY_KEY = "lostfinder_gallery";

// Demo gambar (sample untuk tunjuk contoh - boleh dipadam bila ada gambar sebenar)
const demoGallery = [
    { id: 1001, image: "https://placehold.co/400x300/1a6b5c/white?text=Dompet+Berjaya+Ditemui", title: "Dompet Kulit - Reunite", date: new Date().toISOString(), uploadedBy: "demo" },
    { id: 1002, image: "https://placehold.co/400x300/c0392b/white?text=iPhone+Berjaya+Kembali", title: "iPhone 14 - Kembali ke pemilik", date: new Date().toISOString(), uploadedBy: "demo" },
    { id: 1003, image: "https://placehold.co/400x300/d4820a/white?text=Kunci+Kereta", title: "Kunci Proton - Reunite", date: new Date().toISOString(), uploadedBy: "demo" }
];

function loadGallery() {
    const stored = localStorage.getItem(GALLERY_KEY);
    if (stored && JSON.parse(stored).length > 0) {
        return JSON.parse(stored);
    }
    // Kalau takde data, simpan demo sebagai contoh
    localStorage.setItem(GALLERY_KEY, JSON.stringify(demoGallery));
    return demoGallery;
}

function saveGallery(gallery) {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
}

function addGalleryItem(imageSrc, title = null) {
    if (!currentUser) {
        alert("Sila log masuk terlebih dahulu untuk upload gambar.");
        window.location.href = "login.html";
        return;
    }
    
    const gallery = loadGallery();
    const newItem = {
        id: Date.now(),
        image: imageSrc,
        title: title || `Reunite ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        uploadedBy: currentUser
    };
    
    gallery.unshift(newItem);
    saveGallery(gallery);
    renderGallery();
    
    // Show success message
    showToast("Gambar berjaya ditambahkan ke galeri!");
}

function deleteGalleryItem(id) {
    if (!currentUser) {
        alert("Sila log masuk untuk memadam gambar.");
        window.location.href = "login.html";
        return;
    }
    
    let gallery = loadGallery();
    const itemToDelete = gallery.find(item => item.id == id);
    
    if (itemToDelete && itemToDelete.uploadedBy !== currentUser) {
        if (!confirm("Anda hanya boleh memadam gambar yang anda upload sendiri. Teruskan?")) {
            return;
        }
    }
    
    gallery = gallery.filter(item => item.id != id);
    saveGallery(gallery);
    renderGallery();
    showToast("Gambar berjaya dipadamkan.");
}

function renderGallery() {
    const container = document.getElementById('galleryGrid');
    const gallery = loadGallery();
    
    if (gallery.length === 0) {
        container.innerHTML = '<div class="empty-gallery"><i class="fas fa-camera"></i><br>Belum ada gambar. Jadilah yang pertama upload gambar reunite anda!</div>';
        return;
    }
    
    container.innerHTML = gallery.map(item => `
        <div class="gallery-card" data-id="${item.id}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='https://placehold.co/300x200/e8dfce/8b7d6b?text=Gambar+Rosak'">
            <div class="gallery-info">
                <div class="gallery-title">${escapeHtml(item.title)}</div>
                <div class="gallery-date"><i class="fas fa-calendar-alt"></i> ${new Date(item.date).toLocaleDateString('ms-MY')} ${item.uploadedBy ? '• by ' + escapeHtml(item.uploadedBy) : ''}</div>
            </div>
            ${currentUser ? `<button class="delete-gallery-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>` : ''}
        </div>
    `).join('');
    
    // Attach click events for gallery cards
    document.querySelectorAll('.gallery-card').forEach(card => {
        const img = card.querySelector('img');
        img.addEventListener('click', () => {
            document.getElementById('previewImg').src = img.src;
            document.getElementById('previewModal').style.display = 'flex';
        });
        
        const delBtn = card.querySelector('.delete-gallery-btn');
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Hapus gambar ini?')) {
                    deleteGalleryItem(delBtn.getAttribute('data-id'));
                }
            });
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function showToast(message, isError = false) {
    // Create toast element if it doesn't exist
    let toast = document.querySelector('.gallery-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'gallery-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(80px);
            background: #1a1410;
            backdrop-filter: blur(12px);
            border: 1px solid #c8b690;
            padding: 10px 24px;
            border-radius: 60px;
            color: #f5eedc;
            font-family: 'DM Mono', monospace;
            font-size: 0.75rem;
            z-index: 200;
            transition: 0.25s;
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.background = isError ? '#5a1e15' : '#1a1410';
    toast.classList.add('show');
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(80px)';
    }, 2600);
}

// Setup UI berdasarkan status login
function setupUI() {
    const uploadSection = document.getElementById('uploadSection');
    const loginBanner = document.getElementById('loginBanner');
    
    if (currentUser) {
        // User dah login - show upload section
        if (uploadSection) uploadSection.style.display = 'block';
        if (loginBanner) loginBanner.style.display = 'none';
        
        // Setup upload handlers
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('galleryImageInput');
        
        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', e => {
                e.preventDefault();
                uploadArea.style.borderColor = '#1a6b5c';
            });
            uploadArea.addEventListener('dragleave', e => {
                uploadArea.style.borderColor = '#cfc3ac';
            });
            uploadArea.addEventListener('drop', e => {
                e.preventDefault();
                uploadArea.style.borderColor = '#cfc3ac';
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    processImageFile(file);
                } else {
                    alert('Sila letakkan fail gambar yang sah.');
                }
            });
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', e => {
                if (e.target.files[0]) processImageFile(e.target.files[0]);
            });
        }
        
        const addUrlBtn = document.getElementById('addUrlBtn');
        if (addUrlBtn) {
            addUrlBtn.addEventListener('click', () => {
                const url = document.getElementById('imageUrlInput').value.trim();
                if (url) {
                    addGalleryItem(url, 'Gambar dari URL');
                    document.getElementById('imageUrlInput').value = '';
                } else {
                    alert('Masukkan URL gambar terlebih dahulu');
                }
            });
        }
    } else {
        // User belum login - hide upload section, show banner
        if (uploadSection) uploadSection.style.display = 'none';
        if (loginBanner) loginBanner.style.display = 'block';
    }
}

function processImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        alert('Gambar terlalu besar (max 5MB)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = ev => {
        addGalleryItem(ev.target.result, file.name.split('.')[0]);
    };
    reader.readAsDataURL(file);
}

// Modal preview functionality
const previewModal = document.getElementById('previewModal');
if (previewModal) {
    previewModal.addEventListener('click', () => {
        previewModal.style.display = 'none';
    });
}

// Keyboard event to close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewModal && previewModal.style.display === 'flex') {
        previewModal.style.display = 'none';
    }
});

// Initialize
setupUI();
renderGallery();