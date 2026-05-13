// ==================== GALLERY - LETAK GAMBAR SENDIRI DI SINI ====================
// 💡 CARA GUNA: Gantikan 'image' dengan path gambar kamu
// Contoh: "images/dompet.jpg" atau "https://i.imgur.com/xxx.jpg"

const galleryItems = [
    { image: "images/dompet.png", label: "Dompet Kulit Hitam", category: "Dompet", desc: "Ditemui di Mid Valley - Berjaya dikembalikan" },
    { image: "images/ipon.png", label: "iPhone 14 Pro Max", category: "Telefon", desc: "Ditemui di LRT KLCC - Pemilik dikenalpasti" },
    { image: "images/kunci.png", label: "Kunci Proton", category: "Kunci", desc: "Ditemui di food court - Berjaya reunite" },
    { image: "images/tote.png", label: "Beg Tote Uniqlo", category: "Beg", desc: "Ditinggalkan di MRT - Pemilik contact" },
    { image: "images/passport.png", label: "Pasport Malaysia", category: "Dokumen", desc: "Ditemui di Zoo Negara - Sudah diambil" },
    { image: "images/airpod.png", label: "AirPods Pro", category: "Elektronik", desc: "Ditemui di gym - Berjaya dipulangkan" },
    { image: "images/cincin.png", label: "Cincin Emas", category: "Barang Kemas", desc: "Ditemui di toilet - Pemilik gembira" },
    { image: "images/jam.png", label: "Samsung Watch", category: "Elektronik", desc: "Hilang di kolam renang - Ditemui" },
    { image: "images/matrik.png", label: "Kad Matrik UPM", category: "Dokumen", desc: "Ditemui di fakulti - Dipulangkan" },
    { image: "images/power.png", label: "Powerbank 20000mAh", category: "Elektronik", desc: "Tinggal di kafe - Sudah diambil" },
    { image: "images/rayban.png", label: "Cermin Mata Ray-Ban", category: "Aksesori", desc: "Ditemui di taman - Berjaya reunite" },
    { image: "images/jaket.png", label: "Jaket Kulit Hitam", category: "Pakaian", desc: "Tinggal di restoran - Diambil pemilik" }
];

function generateGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = galleryItems.map((item, index) => `
        <div class="gallery-item" onclick="showItemDetails('${item.label}', '${item.category}', '${item.desc}')">
            <img src="${item.image}" alt="${item.label}" onerror="this.src='https://placehold.co/200x200/e8dfce/8b7d6b?text=No+Image'">
            <div class="gallery-label">${item.label}</div>
        </div>
    `).join('');
}

// Function to show item details
function showItemDetails(label, category, desc) {
    alert(`📱 ${label}\n📂 Kategori: ${category}\n📝 ${desc}\n\n✨ Terima kasih kepada komuniti LostFinder!`);
}

// ==================== STATS FROM STORAGE ====================
const STORAGE_KEY = "lostfound_items";
const USERS_KEY = "lostfinder_users";

function loadAllItems() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [];
}

function getUsersCount() {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) return Object.keys(JSON.parse(stored)).length;
    return 0;
}

function updateStats() {
    const items = loadAllItems();
    const lost = items.filter(i => i.status === 'lost').length;
    const found = items.filter(i => i.status === 'found').length;
    const reunited = items.filter(i => i.status === 'reunited').length;
    const userCount = getUsersCount();
    
    const lostEl = document.getElementById('statTotalLost');
    const foundEl = document.getElementById('statTotalFound');
    const reunitedEl = document.getElementById('statReunited');
    const usersEl = document.getElementById('statUsers');
    
    if (lostEl) lostEl.textContent = lost || 24;
    if (foundEl) foundEl.textContent = found || 18;
    if (reunitedEl) reunitedEl.textContent = reunited || 15;
    if (usersEl) usersEl.textContent = userCount || 128;
}

// ==================== FAQ ACCORDION ====================
function initFaq() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(q => {
        q.addEventListener('click', () => {
            const faqId = q.getAttribute('data-faq');
            const answer = document.getElementById(`faqAns${faqId}`);
            if (answer) {
                answer.classList.toggle('show');
                q.classList.toggle('open');
            }
        });
    });
}

// ==================== ADD DEMO DATA IF EMPTY ====================
function initializeDemoData() {
    const items = loadAllItems();
    if (items.length === 0) {
        // Demo data will be added when user creates reports
        console.log("No items found. Users can add items through the dashboard.");
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    generateGallery();
    updateStats();
    initFaq();
    initializeDemoData();
    
    // Log to console
    console.log("About page loaded successfully");
});