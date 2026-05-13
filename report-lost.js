(function() {
    // ======================= CHECK LOGIN ===================
    if (!sessionStorage.getItem("loggedInUser")) {
        window.location.href = "login.html";
    }

    // ======================= GLOBAL STORAGE & HELPERS =================
    const STORAGE_KEY = "lostfound_items";
    const currentUser = sessionStorage.getItem("loggedInUser") || "pengguna";
    const userEmail = sessionStorage.getItem("userEmail") || `${currentUser}@example.com`;

    // Load all items from storage
    function loadAllItems() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        } else {
            // default sample (kalau tiada)
            const defaultItems = [
                { id: "item1", title: "Dompet kulit hitam", description: "Dompet Bally, ada IC dan kad debit. Hilang di sekitar Mid Valley.", category: "dompet", status: "lost", location: "Mid Valley Mall", date: "2025-03-20", reporter: "amirul", contact: "amirul@email.com", reportedAt: "2025-03-20T10:00:00Z" },
                { id: "item2", title: "iPhone 14 Pro Max", description: "Warna ungu, kes belakang retak. Terjatuh di LRT KLCC.", category: "telefon", status: "lost", location: "LRT KLCC", date: "2025-03-18", reporter: "sarah", contact: "sarah@email.com", reportedAt: "2025-03-18T10:00:00Z" },
                { id: "item3", title: "Kunci kereta Proton", description: "Gantung kunci dengan tag kuning. Ditemui di food court.", category: "kunci", status: "found", location: "Avenue K", date: "2025-03-21", reporter: "fatin", contact: "fatin@email.com", reportedAt: "2025-03-21T10:00:00Z" }
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
            return defaultItems;
        }
    }

    function saveAllItems(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        // trigger storage event supaya browse-item lain sync
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(items) }));
    }

    // ============== IMAGE UPLOAD HANDLING ==================
    const uploadZone = document.getElementById('uploadZone');
    const imageInput = document.getElementById('imageInput');
    const previewBox = document.getElementById('previewBox');
    const previewImg = document.getElementById('previewImg');
    const removeImgBtn = document.getElementById('removeImageBtn');
    let uploadedImageBase64 = null; // store gambar jika ada

    function triggerFileSelect() {
        imageInput.click();
    }

    if (uploadZone) {
        uploadZone.addEventListener('click', triggerFileSelect);
    }

    // drag & drop styling
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                processImageFile(file);
            } else {
                showFloatingToast('Sila pilih fail gambar sahaja.', true);
            }
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0]);
            }
        });
    }

    function processImageFile(file) {
        if (file.size > 5 * 1024 * 1024) {
            showFloatingToast('Gambar melebihi 5MB. Sila pilih gambar lain.', true);
            return;
        }
        const reader = new FileReader();
        reader.onload = function(ev) {
            uploadedImageBase64 = ev.target.result;
            previewImg.src = uploadedImageBase64;
            previewBox.style.display = 'block';
            uploadZone.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    if (removeImgBtn) {
        removeImgBtn.addEventListener('click', () => {
            uploadedImageBase64 = null;
            previewBox.style.display = 'none';
            uploadZone.style.display = 'block';
            imageInput.value = '';
        });
    }

    // ============== SUBMIT FORM ==================
    const form = document.getElementById('reportLostForm');
    const toastDiv = document.getElementById('toastMsg');

    function showFloatingToast(message, isError = false) {
        toastDiv.textContent = message;
        toastDiv.style.background = isError ? '#5a1e15' : '#1a1410';
        toastDiv.classList.add('show');
        setTimeout(() => {
            toastDiv.classList.remove('show');
        }, 2800);
    }

    // Set default contact info from logged in user
    const contactInfoField = document.getElementById('contactInfo');
    if (contactInfoField && !contactInfoField.value) {
        contactInfoField.value = userEmail;
    }

    // Optional: Set default date to today
    const lostDateField = document.getElementById('lostDate');
    if (lostDateField && !lostDateField.value) {
        const today = new Date().toISOString().slice(0, 10);
        lostDateField.value = today;
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // get values
            const nameField = document.getElementById('itemName').value.trim();
            if (!nameField) {
                showFloatingToast('Sila masukkan nama barang yang hilang.', true);
                return;
            }
            
            const locationField = document.getElementById('lostLocation').value.trim();
            if (!locationField) {
                showFloatingToast('Lokasi terakhir diperlukan untuk membantu pencarian.', true);
                return;
            }

            const category = document.getElementById('itemCategory').value;
            const lostDate = document.getElementById('lostDate').value;
            const description = document.getElementById('itemDescription').value.trim() || "Tiada penerangan lanjut";
            const contact = document.getElementById('contactInfo').value.trim() || userEmail;

            // built new item object (status = "lost")
            const newItem = {
                id: "lost_" + Date.now() + "_" + Math.random().toString(36).substr(2, 8),
                title: nameField,
                description: description,
                category: category,
                status: "lost",       // hilang
                location: locationField,
                date: lostDate || new Date().toISOString().slice(0, 10),
                reporter: currentUser,
                contact: contact,
                image: uploadedImageBase64 || null,   // simpan base64 jika ada
                reportedAt: new Date().toISOString()
            };

            // get existing items and push to global storage
            const allItems = loadAllItems();
            allItems.unshift(newItem);
            saveAllItems(allItems);

            // optional: kalau ada function global dari app.js untuk sync, panggil
            if (typeof window.addNewReportItem === 'function') {
                window.addNewReportItem(newItem);
            }

            // reset form + image
            form.reset();
            
            // Reset image preview
            if (uploadedImageBase64) {
                uploadedImageBase64 = null;
                previewBox.style.display = 'none';
                uploadZone.style.display = 'block';
                imageInput.value = '';
            }
            
            // Reset contact to default
            const contactReset = document.getElementById('contactInfo');
            if (contactReset) contactReset.value = userEmail;
            
            // Reset date to today
            const dateReset = document.getElementById('lostDate');
            if (dateReset) dateReset.value = new Date().toISOString().slice(0, 10);
            
            showFloatingToast(`✅ Laporan "${nameField}" berjaya dipin! Mengalih ke halaman browse...`);
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = "browse-items.html";
            }, 1500);
        });
    }

    console.log("📝 Report Lost page ready for:", currentUser);
    console.log("💡 Tips: Sertakan gambar dan penerangan yang jelas untuk memudahkan pencarian.");
})();