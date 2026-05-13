// LostFinder Dashboard Main Script
// No jQuery required - Pure JavaScript

// Storage keys
const STORAGE_KEY = "lostfound_items";
const USERS_KEY = "lostfinder_users";

// Get current logged in user
const currentUser = sessionStorage.getItem("loggedInUser");

// Check authentication
if (!currentUser) {
    window.location.href = "login.html";
}

// Display username
function displayUserName() {
    const userNameSpan = document.getElementById("userNameDisplay");
    if (userNameSpan && currentUser) {
        userNameSpan.textContent = currentUser;
    }
}

// Load all items from storage
function loadAllItems() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    // Return demo data if empty
    return [];
}

// Get statistics
function getStats() {
    const items = loadAllItems();
    const total = items.length;
    const reunited = items.filter(item => item.status === 'reunited').length;
    const lost = items.filter(item => item.status === 'lost').length;
    const found = items.filter(item => item.status === 'found').length;
    
    return { total, reunited, lost, found };
}

// Get recent activities (last 5 items)
function getRecentActivities() {
    const items = loadAllItems();
    // Sort by date (newest first) if date exists
    const sorted = items.sort((a, b) => {
        if (a.date && b.date) {
            return new Date(b.date) - new Date(a.date);
        }
        return 0;
    });
    return sorted.slice(0, 5);
}

// Format relative time
function getRelativeTime(dateString) {
    if (!dateString) return "Recently";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('ms-MY');
}

// Get status icon/badge
function getStatusBadge(status) {
    const statusMap = {
        'lost': { class: 'lost', label: 'LOST' },
        'found': { class: 'found', label: 'FOUND' },
        'reunited': { class: 'reunited', label: 'REUNITED' }
    };
    return statusMap[status] || statusMap['lost'];
}

// Update dashboard stats display
function updateStatsDisplay() {
    const stats = getStats();
    const totalItemsEl = document.getElementById("totalItems");
    const reunitedCountEl = document.getElementById("reunitedCount");
    
    if (totalItemsEl) totalItemsEl.textContent = stats.total;
    if (reunitedCountEl) reunitedCountEl.textContent = stats.reunited;
}

// Update recent activities display
function updateRecentActivities() {
    const activities = getRecentActivities();
    const container = document.getElementById("recentActivitiesList");
    
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="evidence-item">
                <div class="ev-dot lost"></div>
                <div class="ev-text">
                    <div class="ev-name">No activities yet</div>
                    <div class="ev-meta">Be the first to report!</div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.map(item => {
        const statusBadge = getStatusBadge(item.status);
        const relativeTime = getRelativeTime(item.date);
        const title = item.title || "Untitled Item";
        
        return `
            <div class="evidence-item" data-item-id="${item.id || ''}">
                <div class="ev-dot ${statusBadge.class}"></div>
                <div class="ev-text">
                    <div class="ev-name">${escapeHtml(title)}</div>
                    <div class="ev-meta">${escapeHtml(item.location || 'Unknown location')} • ${relativeTime}</div>
                </div>
                <div class="ev-badge ${statusBadge.class}">${statusBadge.label}</div>
            </div>
        `;
    }).join('');
    
    // Add click event to evidence items to open item details
    document.querySelectorAll('.evidence-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const itemId = item.getAttribute('data-item-id');
            if (itemId) {
                openItemDetails(itemId);
            }
        });
    });
}

// Open item details (can be expanded later)
function openItemDetails(itemId) {
    const items = loadAllItems();
    const item = items.find(i => i.id == itemId);
    if (item) {
        // Store current item in sessionStorage and redirect to browse page with modal
        sessionStorage.setItem("viewItemId", itemId);
        window.location.href = "browse-items.html";
    }
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Display dashboard stats (exported function for external calls)
function displayDashboardStats() {
    updateStatsDisplay();
    updateRecentActivities();
}

// Listen for storage changes (when items are added/updated from other tabs)
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        updateStatsDisplay();
        updateRecentActivities();
    }
});

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    displayUserName();
    displayDashboardStats();
    
    // Log welcome message
    console.log(`Welcome to LostFinder Dashboard, ${currentUser}!`);
});

// Export functions for use in other scripts (if needed)
window.displayDashboardStats = displayDashboardStats;
window.loadAllItems = loadAllItems;
window.getStats = getStats;