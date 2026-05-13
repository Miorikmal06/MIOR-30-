// ---------- GLOBAL STORAGE ----------
let allItems = [];
const currentUser = sessionStorage.getItem("loggedInUser");

function loadItemsFromStorage() {
    const stored = localStorage.getItem("lostfound_items");
    if (stored) {
        allItems = JSON.parse(stored);
    } else {
        // demo items with proper reporter names for testing
        const defaultItems = [
            { id: "item1", title: "Dompet kulit hitam", description: "Dompet Bally, ada IC dan kad debit. Hilang di sekitar Mid Valley.", category: "dompet", status: "lost", location: "Mid Valley Mall", date: "2025-03-20", reporter: "amirul", contact: "amirul@email.com", image: null },
            { id: "item2", title: "iPhone 14 Pro Max", description: "Warna ungu, kes belakang retak. Terjatuh di LRT KLCC.", category: "telefon", status: "lost", location: "LRT KLCC", date: "2025-03-18", reporter: "sarah", contact: "sarah@email.com", image: null },
            { id: "item3", title: "Kunci kereta Proton", description: "Gantung kunci dengan tag kuning. Ditemui di food court Avenue K.", category: "kunci", status: "found", location: "Avenue K", date: "2025-03-21", reporter: "fatin", contact: "fatin@email.com", image: null },
            { id: "item4", title: "Beg Tote Uniqlo", description: "Beg berwarna krim, mengandungi buku nota dan powerbank.", category: "beg", status: "lost", location: "Stesen MRT Bukit Bintang", date: "2025-03-15", reporter: "wei", contact: "wei@email.com", image: null },
            { id: "item5", title: "Pasport Malaysia", description: "Pasport nama Ahmad Faiz. Ditemui di Zoo Negara.", category: "dokumen", status: "found", location: "Zoo Negara", date: "2025-03-22", reporter: "aina", contact: "aina@email.com", image: null },
            { id: "item6", title: "AirPods Pro", description: "Casing putih, ada ukiran nama 'Ariq'. Hilang di gym.", category: "telefon", status: "lost", location: "Celebrity Fitness", date: "2025-03-19", reporter: "ariq", contact: "ariq@email.com", image: null }
        ];
        localStorage.setItem("lostfound_items", JSON.stringify(defaultItems));
        allItems = defaultItems;
    }
    allItems = allItems.map(item => ({ 
        ...item, 
        id: item.id || crypto.randomUUID?.() || Date.now() + Math.random() 
    }));
}

function persistItems() {
    localStorage.setItem("lostfound_items", JSON.stringify(allItems));
    window.dispatchEvent(new StorageEvent('storage', { key: 'lostfound_items', newValue: JSON.stringify(allItems) }));
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return { cat: params.get('cat') };
}

// modal elements
const modal = document.getElementById('itemModal');
const modalImageContainer = document.getElementById('modalImageContainer');
const modalDetailsDiv = document.getElementById('modalDetails');
const modalCloseBtn = document.getElementById('modalCloseBtn');

function openModal(item) {
    let imageHtml = '';
    if (item.image && (item.image.startsWith('data:image') || item.image.startsWith('http'))) {
        imageHtml = `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">`;
    } else {
        imageHtml = `<div class="no-image-placeholder"><i class="fas fa-camera" style="font-size:2rem; opacity:0.6; margin-bottom:8px; display:block;"></i> Tiada gambar disediakan<br><span style="font-size:0.7rem;">Hubungi pelapor untuk keterangan lanjut</span></div>`;
    }
    modalImageContainer.innerHTML = imageHtml;

    const statusText = item.status === 'lost' ? 'HILANG' : (item.status === 'found' ? 'DITEMUI' : 'SUDAH REUNITE');
    const statusClass = item.status === 'lost' ? 'lost' : (item.status === 'found' ? 'found' : 'reunited');
    const categoryMap = { dompet: 'Dompet', telefon: 'Telefon', kunci: 'Kunci', beg: 'Beg', dokumen: 'Dokumen', lain: 'Lain' };
    const catName = categoryMap[item.category] || item.category || 'Lain-lain';

    modalDetailsDiv.innerHTML = `
        <div class="modal-status ${statusClass}"><i class="fas ${item.status === 'lost' ? 'fa-frown' : (item.status === 'found' ? 'fa-smile' : 'fa-handshake')}"></i> ${statusText}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="modal-detail-row"><i class="fas fa-tag"></i><strong>Kategori</strong><span>${catName}</span></div>
        <div class="modal-detail-row"><i class="fas fa-map-marker-alt"></i><strong>Lokasi</strong><span>${escapeHtml(item.location || 'Tidak dinyatakan')}</span></div>
        <div class="modal-detail-row"><i class="fas fa-calendar-alt"></i><strong>Tarikh</strong><span>${item.date || 'Tarikh tidak diketahui'}</span></div>
        <div class="modal-detail-row"><i class="fas fa-user"></i><strong>Dilaporkan oleh</strong><span>${escapeHtml(item.reporter || 'Pengguna tanpa nama')}</span></div>
        <div class="modal-description">
            <i class="fas fa-align-left" style="margin-right:6px; color:var(--muted);"></i> <strong>Penerangan:</strong><br>
            ${escapeHtml(item.description || 'Tiada penerangan tambahan.')}
        </div>
        <button class="modal-contact" id="modalContactBtn" style="background:var(--teal); color:white; border:none; cursor:pointer;">
            <i class="fas fa-comment-dots"></i> Hubungi ${escapeHtml(item.reporter || 'Pelapor')}
        </button>
        <div style="font-size:0.6rem; margin-top:12px; text-align:center; color:#8b7f68;">
            <i class="fas fa-thumbtack"></i> ID Laporan: ${item.id}
        </div>
    `;
    
    // attach event to modal contact button
    const modalContactBtn = document.getElementById('modalContactBtn');
    if (modalContactBtn) {
        modalContactBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            initiateChatWithReporter(item);
        });
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

// FUNCTION TO INITIATE CHAT WITH REPORTER
function initiateChatWithReporter(item) {
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }
    
    const reporter = item.reporter;
    if (!reporter) {
        alert("Maklumat pelapor tidak lengkap.");
        return;
    }
    
    if (reporter === currentUser) {
        alert("Anda tidak boleh menghantar mesej kepada laporan sendiri.");
        return;
    }
    
    // Store conversation data in sessionStorage to be picked up by messages page
    const chatData = {
        targetUser: reporter,
        itemTitle: item.title,
        itemId: item.id,
        autoMessage: `Saya berminat dengan item "${item.title}" yang anda laporkan. Boleh saya dapatkan maklumat lanjut?`
    };
    sessionStorage.setItem("pendingChat", JSON.stringify(chatData));
    
    // Redirect to messages page
    window.location.href = "messages.html";
}

// Render items
function renderItems() {
    const container = document.getElementById('itemsGridContainer');
    if (!container) return;

    const typeVal = document.getElementById('typeFilter')?.value || 'all';
    const catVal = document.getElementById('catFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';

    let filtered = [...allItems];

    if (typeVal !== 'all') filtered = filtered.filter(item => item.status === typeVal);
    if (catVal !== 'all') filtered = filtered.filter(item => item.category === catVal);
    if (searchTerm !== '') {
        filtered = filtered.filter(item => 
            item.title?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            item.location?.toLowerCase().includes(searchTerm) ||
            (item.reporter?.toLowerCase().includes(searchTerm))
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-puzzle-piece"></i>  Tiada item ditemui. Mungkin laporkan barang? <a href="index.html" style="color:var(--red);">Lapor sekarang</a></div>`;
        return;
    }

    container.innerHTML = filtered.map((item, idx) => {
        const rot = (Math.random() * 1.6 - 0.8).toFixed(1);
        const statusClass = item.status === 'lost' ? 'badge-lost' : (item.status === 'found' ? 'badge-found' : 'badge-reunited');
        const statusText = item.status === 'lost' ? 'HILANG' : (item.status === 'found' ? 'DITEMUI' : 'SUDAH REUNITE');
        const categoryMap = { dompet: 'Dompet', telefon: 'Telefon', kunci: 'Kunci', beg: 'Beg', dokumen: 'Dokumen', lain: 'Lain' };
        const catName = categoryMap[item.category] || 'Lain';
        
        // Hide contact button if current user is the reporter
        const showContactBtn = currentUser && item.reporter !== currentUser;
        
        return `
            <div class="item-card" data-item-id="${escapeHtml(item.id)}" style="--rot: ${rot}deg;">
                <div class="card-pin"></div>
                <div class="item-badge ${statusClass}">${statusText}</div>
                <div class="item-content">
                    <div class="item-category"><i class="fas fa-tag"></i> ${catName}</div>
                    <h3 class="item-title">${escapeHtml(item.title)}</h3>
                    <div class="item-desc">${escapeHtml(item.description?.length > 90 ? item.description.slice(0, 90) + '…' : item.description || 'Tiada penerangan')}</div>
                    <div class="item-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location || 'Tidak spesifik')}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${item.date || 'tarikh tidak diketahui'}</span>
                    </div>
                    <div class="item-meta" style="margin-top: 4px; border-top: none; padding-top: 0;">
                        <span><i class="fas fa-user"></i> Dilapor: ${escapeHtml(item.reporter || 'pengguna')}</span>
                    </div>
                </div>
                <div class="item-footer">
                    <span style="font-size:0.6rem; color:#7a6b52;"><i class="fas fa-envelope-open-text"></i> hubungi:</span>
                    ${showContactBtn ? 
                        `<button class="contact-btn" data-reporter="${escapeHtml(item.reporter)}" data-title="${escapeHtml(item.title)}" data-id="${escapeHtml(item.id)}"><i class="fas fa-comment-dots"></i> Chat</button>` :
                        `<button class="contact-btn" style="background:#7a7060; cursor:not-allowed;" disabled><i class="fas fa-user"></i> Laporan sendiri</button>
                    `}
                </div>
            </div>
        `;
    }).join('');

    // attach click card event untuk buka modal
    document.querySelectorAll('.item-card').forEach(card => {
        const itemId = card.getAttribute('data-item-id');
        card.addEventListener('click', (e) => {
            if (e.target.closest('.contact-btn')) return;
            const foundItem = allItems.find(i => i.id === itemId);
            if (foundItem) openModal(foundItem);
        });
    });

    // attach contact button events - REDIRECT TO MESSAGES
    document.querySelectorAll('.contact-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const reporter = btn.getAttribute('data-reporter');
            const title = btn.getAttribute('data-title');
            const itemId = btn.getAttribute('data-id');
            
            if (!currentUser) {
                window.location.href = "login.html";
                return;
            }
            
            if (reporter === currentUser) {
                alert("Anda tidak boleh chat dengan laporan sendiri.");
                return;
            }
            
            // Store conversation data in sessionStorage
            const chatData = {
                targetUser: reporter,
                itemTitle: title,
                itemId: itemId,
                autoMessage: `Saya berminat dengan item "${title}" yang anda laporkan. Boleh saya dapatkan maklumat lanjut?`
            };
            sessionStorage.setItem("pendingChat", JSON.stringify(chatData));
            
            // Redirect to messages page
            window.location.href = "messages.html";
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function initFiltersAndSearch() {
    const typeFilter = document.getElementById('typeFilter');
    const catFilter = document.getElementById('catFilter');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (typeFilter) typeFilter.addEventListener('change', () => renderItems());
    if (catFilter) catFilter.addEventListener('change', () => renderItems());
    if (searchInput) searchInput.addEventListener('input', () => renderItems());
    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        renderItems();
    });

    const urlCat = getUrlParams().cat;
    if (urlCat && catFilter) {
        const validCats = ['dompet', 'telefon', 'kunci', 'beg', 'dokumen'];
        if (validCats.includes(urlCat)) catFilter.value = urlCat;
    }
    renderItems();
}

// Global function to add new report from other pages
window.addNewReportItem = (newItem) => {
    if (!newItem.id) newItem.id = 'item_' + Date.now() + '_' + Math.random().toString(36);
    allItems.unshift(newItem);
    persistItems();
    renderItems();
};

// Check authentication and initialize
if (!currentUser) {
    window.location.href = "login.html";
} else {
    loadItemsFromStorage();
    initFiltersAndSearch();
}

// Event listener for storage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'lostfound_items') {
        loadItemsFromStorage();
        renderItems();
    }
});

// Close modal when clicking outside
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
}

window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});