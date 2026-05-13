// ==================== REVIEW SYSTEM DENGAN JQUERY ====================
const REVIEWS_KEY = "lostfinder_reviews";
const currentUser = sessionStorage.getItem("loggedInUser");
const currentUserEmail = sessionStorage.getItem("userEmail") || "";

// FORCE RESET - HAPUS DATA LAMA DARI LOCALSTORAGE
localStorage.removeItem(REVIEWS_KEY);

// ==================== 7 ULASAN DENGAN NAMA YANG DIMINTA ====================
const demoReviews = [
    {
        id: "rev1",
        name: "Mior Ikmal",
        email: "mior@lostfinder.my",
        rating: 4,
        title: "Berjaya dapat semula dompet!",
        text: "Alhamdulillah! Dompet kulit hitam saya yang hilang di Mid Valley selama 3 hari akhirnya ditemui melalui platform ini. Orang baik yang jumpa terus hubungi saya. Terima kasih LostFinder!",
        category: "lost",
        date: "2025-03-20T10:30:00Z",
        likes: 45,
        reported: false
    },
    {
        id: "rev2",
        name: "Syamsul Nazir",
        email: "syamsul@lostfinder.my",
        rating: 5,
        title: "Platform yang sangat membantu komuniti",
        text: "Saya terjumpa sebuah iPhone 14 Pro di dalam LRT, terus report di LostFinder. Dalam masa 6 jam, pemilik asal berjaya dihubungi dan telefon dikembalikan. Very satisfied!",
        category: "found",
        date: "2025-03-18T14:20:00Z",
        likes: 52,
        reported: false
    },
    {
        id: "rev3",
        name: "Ammar Mahadir",
        email: "ammar@lostfinder.my",
        rating: 4,
        title: "Reunite barang dengan cepat!",
        text: "Jam tangan Casio saya yang hilang di gym berjaya ditemui hanya dalam masa 2 jam selepas report. Proses mudah dan cepat. Highly recommended untuk semua!",
        category: "lost",
        date: "2025-03-15T09:15:00Z",
        likes: 38,
        reported: false
    },
    {
        id: "rev4",
        name: "Iskandar Zulkarnain",
        email: "iskandar@lostfinder.my",
        rating: 5,
        title: "Pengalaman terbaik pernah ada!",
        text: "Powerbank saya yang tertinggal di kafe berjaya dipulangkan. Terima kasih kepada orang baik dan platform LostFinder. Memang game changer!",
        category: "lost",
        date: "2025-03-12T16:45:00Z",
        likes: 29,
        reported: false
    },
    {
        id: "rev5",
        name: "Hafiz",
        email: "hafiz@lostfinder.my",
        rating: 5,
        title: "Berjaya pulangkan kunci kereta",
        text: "Saya terjumpa kunci kereta Proton di food court. Lepas post dalam LostFinder, owner terus contact. Rasa seronok dapat membantu orang lain. 👍",
        category: "found",
        date: "2025-03-10T11:00:00Z",
        likes: 31,
        reported: false
    },
    {
        id: "rev6",
        name: "Danish Shazwan",
        email: "danish@lostfinder.my",
        rating: 4,
        title: "Bagus tapi boleh improve lagi",
        text: "Secara keseluruhannya bagus. Cuma kadang loading slow sikit. Tapi dari segi fungsi dan reka bentuk, memang terbaik! Teruskan usaha.",
        category: "both",
        date: "2025-03-08T08:30:00Z",
        likes: 23,
        reported: false
    },
    {
        id: "rev7",
        name: "Haziq Afiq",
        email: "haziq@lostfinder.my",
        rating: 5,
        title: "Best platform ever!",
        text: "Berjaya reunite beg galas adik saya yang tertinggal di bas. Terima kasih banyak-banyak kepada semua yang membantu. LostFinder memang recommended!",
        category: "found",
        date: "2025-03-05T13:20:00Z",
        likes: 36,
        reported: false
    }
];

function loadReviews() {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(demoReviews));
    return demoReviews;
}

function saveReviews(reviews) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    updateStats();
}

function updateStats() {
    const reviews = loadReviews();
    const total = reviews.length;
    const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (sumRating / total).toFixed(1);
    const satisfiedCount = reviews.filter(r => r.rating >= 4).length;
    const successRate = Math.round((satisfiedCount / total) * 100);
    
    $('#totalReviews').text(total);
    $('#avgRating').text(avgRating);
    $('#successRate').text(successRate + '%');
    
    const fullStars = Math.floor(avgRating);
    const hasHalf = avgRating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            starsHtml += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalf) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }
    $('#avgStars').html(starsHtml);
}

function addReview(reviewData) {
    if (!currentUser) {
        showToast("Sila log masuk untuk memberikan ulasan.", true);
        return false;
    }
    
    const reviews = loadReviews();
    const newReview = {
        id: "rev_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        name: reviewData.name,
        email: currentUserEmail,
        rating: reviewData.rating,
        title: reviewData.title,
        text: reviewData.text,
        category: reviewData.category,
        date: new Date().toISOString(),
        likes: 0,
        reported: false
    };
    
    reviews.unshift(newReview);
    saveReviews(reviews);
    renderReviews();
    showToast("Ulasan anda berjaya dihantar! Terima kasih!", false);
    return true;
}

function likeReview(reviewId) {
    if (!currentUser) {
        showToast("Sila log masuk untuk like ulasan.", true);
        return;
    }
    
    const reviews = loadReviews();
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
        review.likes = (review.likes || 0) + 1;
        saveReviews(reviews);
        renderReviews();
        showToast("Terima kasih kerana menyukai ulasan ini!", false);
    }
}

function reportReview(reviewId) {
    if (!currentUser) {
        showToast("Sila log masuk untuk melaporkan ulasan.", true);
        return;
    }
    
    const reviews = loadReviews();
    const review = reviews.find(r => r.id === reviewId);
    if (review && !review.reported) {
        review.reported = true;
        saveReviews(reviews);
        renderReviews();
        showToast("Ulasan telah dilaporkan. Terima kasih atas maklum balas anda.", false);
    }
}

let currentPage = 1;
const itemsPerPage = 5;
let currentFilterRating = "all";
let currentSortBy = "newest";
let currentSearchTerm = "";

function renderReviews() {
    let reviews = loadReviews();
    
    if (currentFilterRating !== "all") {
        const minRating = parseInt(currentFilterRating);
        reviews = reviews.filter(r => r.rating >= minRating);
    }
    
    if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        reviews = reviews.filter(r => 
            r.title.toLowerCase().includes(term) || 
            r.text.toLowerCase().includes(term) ||
            r.name.toLowerCase().includes(term)
        );
    }
    
    switch (currentSortBy) {
        case "newest":
            reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case "oldest":
            reviews.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case "highest":
            reviews.sort((a, b) => b.rating - a.rating);
            break;
        case "lowest":
            reviews.sort((a, b) => a.rating - b.rating);
            break;
    }
    
    const totalPages = Math.ceil(reviews.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedReviews = reviews.slice(startIndex, startIndex + itemsPerPage);
    
    const $container = $('#reviewsList');
    $container.empty();
    
    if (paginatedReviews.length === 0) {
        $container.html('<div class="empty-state"><i class="fas fa-comment-slash"></i><br>Tiada ulasan. Jadilah yang pertama memberikan ulasan!</div>');
        $('#pagination').empty();
        return;
    }
    
    $.each(paginatedReviews, function(index, review) {
        const starsHtml = renderStars(review.rating);
        const categoryIcon = getCategoryIcon(review.category);
        const categoryText = getCategoryText(review.category);
        const formattedDate = formatDate(review.date);
        const initials = getInitials(review.name);
        
        const $card = $(`
            <div class="review-card" data-id="${review.id}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${initials}</div>
                        <div>
                            <div class="reviewer-name">${escapeHtml(review.name)}</div>
                            <div class="review-date">${formattedDate}</div>
                        </div>
                    </div>
                    <div class="review-stars">${starsHtml}</div>
                </div>
                <div class="review-title">${escapeHtml(review.title)}</div>
                <div class="review-text">${escapeHtml(review.text)}</div>
                <div class="review-category"><i class="fas ${categoryIcon}"></i> ${categoryText}</div>
                <div class="review-actions">
                    <button class="like-review-btn" data-id="${review.id}"><i class="far fa-heart"></i> <span class="like-count">${review.likes || 0}</span></button>
                    <button class="report-review-btn" data-id="${review.id}"><i class="fas fa-flag"></i> Lapor</button>
                </div>
            </div>
        `);
        $container.append($card);
    });
    
    $(document).off('click', '.like-review-btn').on('click', '.like-review-btn', function() {
        const reviewId = $(this).data('id');
        likeReview(reviewId);
    });
    
    $(document).off('click', '.report-review-btn').on('click', '.report-review-btn', function() {
        const reviewId = $(this).data('id');
        reportReview(reviewId);
    });
    
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const $pagination = $('#pagination');
    $pagination.empty();
    if (totalPages <= 1) return;
    
    for (let i = 1; i <= totalPages; i++) {
        const $btn = $(`<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);
        $pagination.append($btn);
    }
    
    $('.page-btn').off('click').on('click', function() {
        currentPage = parseInt($(this).data('page'));
        renderReviews();
        $('html, body').animate({ scrollTop: 0 }, 'smooth');
    });
}

function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1] ? parts[1][0] : parts[0][1])).toUpperCase();
}

function renderStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalf) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function getCategoryIcon(category) {
    switch(category) {
        case 'lost': return 'fa-frown';
        case 'found': return 'fa-smile';
        default: return 'fa-hand-peace';
    }
}

function getCategoryText(category) {
    switch(category) {
        case 'lost': return 'Berjaya dapat barang hilang';
        case 'found': return 'Berjaya pulangkan barang';
        default: return 'Pengalaman am';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);
    
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Semalam';
    if (diffDays < 7) return `${diffDays} hari lepas`;
    return date.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
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

function showToast(msg, isError = false) {
    const toast = $('#toastMsg');
    toast.text(msg);
    toast.css('background', isError ? '#5a1e15' : '#1a1410');
    toast.addClass('show');
    setTimeout(function() {
        toast.removeClass('show');
    }, 3000);
}

function setupStarRating() {
    let selectedRating = 0;
    
    $('#starRating i').hover(
        function() {
            const rating = $(this).data('rating');
            $('#starRating i').each(function(index) {
                if (index < rating) {
                    $(this).removeClass('far').addClass('fas').addClass('hover');
                } else {
                    $(this).removeClass('fas hover').addClass('far');
                }
            });
        },
        function() {
            $('#starRating i').each(function(index) {
                $(this).removeClass('hover');
                if (index < selectedRating) {
                    $(this).removeClass('far').addClass('fas').addClass('active');
                } else {
                    $(this).removeClass('fas active').addClass('far');
                }
            });
        }
    );
    
    $('#starRating i').on('click', function() {
        selectedRating = $(this).data('rating');
        $('#ratingValue').val(selectedRating);
        $('#starRating i').each(function(index) {
            if (index < selectedRating) {
                $(this).removeClass('far').addClass('fas').addClass('active');
            } else {
                $(this).removeClass('fas active').addClass('far');
            }
        });
    });
}

function setupReviewForm() {
    $('#reviewForm').on('submit', function(e) {
        e.preventDefault();
        
        const rating = parseInt($('#ratingValue').val());
        const title = $('#reviewTitle').val().trim();
        const text = $('#reviewText').val().trim();
        const category = $('#reviewCategory').val();
        
        if (rating === 0) {
            showToast("Sila berikan rating untuk ulasan anda.", true);
            return;
        }
        
        if (!title) {
            showToast("Sila masukkan tajuk ulasan.", true);
            return;
        }
        
        if (!text) {
            showToast("Sila masukkan ulasan anda.", true);
            return;
        }
        
        addReview({
            name: currentUser,
            rating: rating,
            title: title,
            text: text,
            category: category
        });
        
        $('#ratingValue').val(0);
        $('#reviewTitle').val('');
        $('#reviewText').val('');
        $('#reviewCategory').val('lost');
        $('#starRating i').removeClass('fas active').addClass('far');
    });
}

function setupUI() {
    if (currentUser) {
        $('#writeReviewSection').show();
        $('#loginBanner').hide();
        $('#reviewerName').val(currentUser);
    } else {
        $('#writeReviewSection').hide();
        $('#loginBanner').show();
    }
}

function initFilters() {
    $('#ratingFilter').on('change', function() {
        currentFilterRating = $(this).val();
        currentPage = 1;
        renderReviews();
    });
    
    $('#sortBy').on('change', function() {
        currentSortBy = $(this).val();
        currentPage = 1;
        renderReviews();
    });
    
    let timeout;
    $('#searchReview').on('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            currentSearchTerm = $(this).val();
            currentPage = 1;
            renderReviews();
        }, 300);
    });
}

$(document).ready(function() {
    console.log("⭐ Review page loaded dengan nama: Mior Ikmal, Syamsul Nazir, Ammar Mahadir, Iskandar Zulkarnain, Hafiz, Danish Shazwan, Haziq Afiq ⭐");
    updateStats();
    setupUI();
    setupStarRating();
    setupReviewForm();
    initFilters();
    renderReviews();
});