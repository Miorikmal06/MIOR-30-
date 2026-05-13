// ==================== VIDEO GALLERY SYSTEM ====================
const VIDEOS_KEY = "lostfinder_videos";
const currentUser = sessionStorage.getItem("loggedInUser");

// Demo videos (sample data)
const demoVideos = [
    { id: "vid1", title: "Kunci Kereta Berjaya Ditemui", description: "Detik mengharapkan apabila kunci kereta yang hilang ditemui dan dikembalikan kepada pemilik.", videoUrl: "videos/kunci.mp4", type: "file", thumbnail: null, date: "2025-01-15", uploader: "admin", likes: 24, comments: [] },
    { id: "vid2", title: "Mouse Wireless Ditemukan", description: "Mouse gaming wireless yang tertinggal di kafe berjaya dipulangkan.", videoUrl: "videos/mouse.mp4", type: "file", thumbnail: null, date: "2025-01-10", uploader: "admin", likes: 15, comments: [] },
    { id: "vid3", title: "Kotak Barang Berharga", description: "Kotak berisi barangan peribadi berjaya dikembalikan kepada pemilik.", videoUrl: "videos/kotak.mp4", type: "file", thumbnail: null, date: "2025-01-05", uploader: "admin", likes: 32, comments: [] }
];

// Load videos from localStorage
function loadVideos() {
    const stored = localStorage.getItem(VIDEOS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(demoVideos));
    return demoVideos;
}

function saveVideos(videos) {
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

// Add new video
function addVideo(videoUrl, title, type = "file") {
    if (!currentUser) {
        showToast("Sila log masuk untuk upload video.", true);
        window.location.href = "login.html";
        return false;
    }
    
    const videos = loadVideos();
    const newVideo = {
        id: "vid_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        title: title || `Video Reunite ${new Date().toLocaleDateString()}`,
        description: "Video dokumentasi barang berjaya dikembalikan kepada pemilik.",
        videoUrl: videoUrl,
        type: type,
        thumbnail: null,
        date: new Date().toISOString().split('T')[0],
        uploader: currentUser,
        likes: 0,
        comments: []
    };
    videos.unshift(newVideo);
    saveVideos(videos);
    renderVideos();
    showToast("Video berjaya ditambahkan!", false);
    return true;
}

// Delete video (only by uploader or admin)
function deleteVideo(videoId) {
    let videos = loadVideos();
    const video = videos.find(v => v.id === videoId);
    
    if (!video) return;
    
    if (video.uploader !== currentUser && currentUser !== "admin") {
        showToast("Anda hanya boleh memadam video sendiri.", true);
        return;
    }
    
    videos = videos.filter(v => v.id !== videoId);
    saveVideos(videos);
    renderVideos();
    showToast("Video berjaya dipadamkan.", false);
}

// Like/Unlike video
function toggleLike(videoId) {
    const videos = loadVideos();
    const video = videos.find(v => v.id === videoId);
    if (video) {
        video.likes = (video.likes || 0) + 1;
        saveVideos(videos);
        renderVideos();
        if (currentVideoId === videoId) updateModalInfo(video);
    }
}

// Add comment
function addComment(videoId, commentText) {
    if (!currentUser) {
        showToast("Sila log masuk untuk komen.", true);
        window.location.href = "login.html";
        return;
    }
    
    const videos = loadVideos();
    const video = videos.find(v => v.id === videoId);
    if (video && commentText.trim()) {
        video.comments = video.comments || [];
        video.comments.unshift({
            author: currentUser,
            text: commentText.trim(),
            date: new Date().toISOString()
        });
        saveVideos(videos);
        if (currentVideoId === videoId) updateModalInfo(video);
        showToast("Komen ditambah!", false);
    }
}

// Render videos
let currentView = "grid";
let currentFilter = "all";
let currentVideoId = null;

function renderVideos() {
    const container = document.getElementById('videoGrid');
    let videos = loadVideos();
    
    // Apply filter
    if (currentFilter === "uploaded" && currentUser) {
        videos = videos.filter(v => v.uploader === currentUser);
    } else if (currentFilter === "featured") {
        videos = videos.filter(v => v.likes > 10);
    }
    
    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-video-slash"></i><br>Tiada video. Jadilah yang pertama upload video reunite!</div>';
        return;
    }
    
    container.className = currentView === "grid" ? "video-grid" : "video-grid list-view";
    
    container.innerHTML = videos.map(video => `
        <div class="video-card" data-id="${video.id}">
            <div class="video-thumbnail">
                <i class="fas fa-play-circle play-overlay"></i>
                <video preload="metadata">
                    <source src="${escapeHtml(video.videoUrl)}" type="video/mp4">
                </video>
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(video.title)}</div>
                <div class="video-date"><i class="fas fa-calendar-alt"></i> ${video.date}</div>
                <div class="video-stats">
                    <span><i class="fas fa-heart"></i> ${video.likes || 0}</span>
                    <span><i class="fas fa-comment"></i> ${video.comments?.length || 0}</span>
                    <span><i class="fas fa-user"></i> ${escapeHtml(video.uploader)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click event to video cards
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const videoId = card.getAttribute('data-id');
            openVideoModal(videoId);
        });
    });
}

function openVideoModal(videoId) {
    const videos = loadVideos();
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    
    currentVideoId = videoId;
    
    const modal = document.getElementById('videoModal');
    const modalVideoContainer = document.getElementById('modalVideoContainer');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalDate = document.getElementById('modalDate');
    const modalUploader = document.getElementById('modalUploader');
    const likeCount = document.getElementById('likeCount');
    
    modalVideoContainer.innerHTML = `
        <video controls autoplay>
            <source src="${escapeHtml(video.videoUrl)}" type="video/mp4">
            Browser tidak support video tag.
        </video>
    `;
    modalTitle.textContent = video.title;
    modalDescription.textContent = video.description || "Tiada penerangan.";
    modalDate.innerHTML = `<i class="fas fa-calendar-alt"></i> ${video.date}`;
    modalUploader.innerHTML = `<i class="fas fa-user"></i> Dikongsi oleh: ${escapeHtml(video.uploader)}`;
    likeCount.textContent = video.likes || 0;
    
    // Render comments
    const commentList = document.getElementById('commentList');
    const comments = video.comments || [];
    if (comments.length === 0) {
        commentList.innerHTML = '<p style="color:var(--muted); text-align:center;">Tiada komen. Jadilah yang pertama!</p>';
    } else {
        commentList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <span class="comment-author">${escapeHtml(comment.author)}</span>
                <span class="comment-time">${formatDate(comment.date)}</span>
                <p>${escapeHtml(comment.text)}</p>
            </div>
        `).join('');
    }
    
    modal.style.display = 'flex';
}

function updateModalInfo(video) {
    const likeCount = document.getElementById('likeCount');
    if (likeCount) likeCount.textContent = video.likes || 0;
    
    const commentList = document.getElementById('commentList');
    const comments = video.comments || [];
    if (comments.length === 0) {
        commentList.innerHTML = '<p style="color:var(--muted); text-align:center;">Tiada komen. Jadilah yang pertama!</p>';
    } else {
        commentList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <span class="comment-author">${escapeHtml(comment.author)}</span>
                <span class="comment-time">${formatDate(comment.date)}</span>
                <p>${escapeHtml(comment.text)}</p>
            </div>
        `).join('');
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} jam`;
    return date.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = msg;
    toast.style.background = isError ? '#5a1e15' : '#1a1410';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Setup UI based on login status
function setupUI() {
    const uploadSection = document.getElementById('uploadSection');
    const loginBanner = document.getElementById('loginBanner');
    
    if (currentUser) {
        if (uploadSection) uploadSection.style.display = 'block';
        if (loginBanner) loginBanner.style.display = 'none';
        
        // Setup upload handlers
        const uploadArea = document.getElementById('uploadArea');
        const videoInput = document.getElementById('videoInput');
        
        if (uploadArea && videoInput) {
            uploadArea.addEventListener('click', () => videoInput.click());
            uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = '#1a6b5c'; });
            uploadArea.addEventListener('drop', e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('video/')) processVideoFile(file);
                else showToast("Sila letakkan fail video yang sah.", true);
            });
            videoInput.addEventListener('change', e => { if (e.target.files[0]) processVideoFile(e.target.files[0]); });
        }
        
        const addUrlBtn = document.getElementById('addVideoUrlBtn');
        const urlInput = document.getElementById('videoUrlInput');
        if (addUrlBtn && urlInput) {
            addUrlBtn.addEventListener('click', () => {
                const url = urlInput.value.trim();
                if (url) {
                    addVideo(url, `Video dari URL`, "url");
                    urlInput.value = '';
                } else showToast("Masukkan URL video.", true);
            });
        }
    } else {
        if (uploadSection) uploadSection.style.display = 'none';
        if (loginBanner) loginBanner.style.display = 'block';
    }
}

function processVideoFile(file) {
    if (file.size > 50 * 1024 * 1024) {
        showToast("Video melebihi 50MB.", true);
        return;
    }
    const reader = new FileReader();
    reader.onload = e => addVideo(e.target.result, file.name.split('.')[0], "file");
    reader.readAsDataURL(file);
}

// Initialize event listeners
function init() {
    setupUI();
    renderVideos();
    
    // Filter change
    const filterSelect = document.getElementById('videoFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderVideos();
        });
    }
    
    // View toggle
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    if (gridViewBtn && listViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            currentView = "grid";
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            renderVideos();
        });
        listViewBtn.addEventListener('click', () => {
            currentView = "list";
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            renderVideos();
        });
    }
    
    // Modal close
    const modal = document.getElementById('videoModal');
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    
    // Like button
    const likeBtn = document.getElementById('modalLikeBtn');
    if (likeBtn) likeBtn.addEventListener('click', () => { if (currentVideoId) toggleLike(currentVideoId); });
    
    // Add comment
    const addCommentBtn = document.getElementById('addCommentBtn');
    const commentInput = document.getElementById('commentInput');
    if (addCommentBtn && commentInput) {
        addCommentBtn.addEventListener('click', () => {
            if (currentVideoId) {
                addComment(currentVideoId, commentInput.value);
                commentInput.value = '';
            }
        });
        commentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addCommentBtn.click(); });
    }
}

document.addEventListener('DOMContentLoaded', init);
console.log("🎥 Video page loaded - Share your reunion moments!");