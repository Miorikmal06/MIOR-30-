// ==================== MESSAGING SYSTEM ====================
const MESSAGES_KEY = "lostfinder_messages";
const currentUser = sessionStorage.getItem("loggedInUser");

// Check authentication
if (!currentUser) {
    window.location.href = "login.html";
}

// Get all messages from localStorage
function getAllMessages() {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (stored) return JSON.parse(stored);
    return {};
}

// Save all messages to localStorage
function saveAllMessages(messagesObj) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messagesObj));
    window.dispatchEvent(new StorageEvent('storage', { 
        key: MESSAGES_KEY, 
        newValue: JSON.stringify(messagesObj) 
    }));
}

// Get conversation ID between two users
function getConversationId(user1, user2) {
    const sorted = [user1, user2].sort();
    return `${sorted[0]}__${sorted[1]}`;
}

// Send a new message
function sendMessage(toUser, itemId, itemTitle, messageText) {
    if (!toUser || toUser === currentUser) {
        showToast("Anda tidak boleh menghantar mesej kepada diri sendiri.", true);
        return false;
    }
    
    if (!messageText || messageText.trim() === '') {
        showToast("Sila masukkan mesej.", true);
        return false;
    }
    
    const convId = getConversationId(currentUser, toUser);
    const messagesObj = getAllMessages();
    if (!messagesObj[convId]) messagesObj[convId] = [];
    
    const newMsg = {
        id: Date.now() + "_" + Math.random().toString(36),
        from: currentUser,
        to: toUser,
        text: messageText.trim(),
        timestamp: new Date().toISOString(),
        itemId: itemId || null,
        itemTitle: itemTitle || "Item",
        read: false
    };
    
    messagesObj[convId].push(newMsg);
    saveAllMessages(messagesObj);
    showToast(`Mesej dihantar kepada ${toUser}`, false);
    return true;
}

// Get all conversations for current user
function getUserConversations() {
    const allMessages = getAllMessages();
    const conversations = [];
    
    for (const [convId, messages] of Object.entries(allMessages)) {
        const participants = convId.split('__');
        const otherUser = participants[0] === currentUser ? participants[1] : participants[0];
        
        if (participants.includes(currentUser)) {
            const lastMsg = messages[messages.length - 1];
            const unreadCount = messages.filter(m => m.to === currentUser && !m.read).length;
            
            conversations.push({
                convId,
                otherUser,
                lastMsgText: lastMsg?.text || "Mesej",
                lastTimestamp: lastMsg?.timestamp || new Date().toISOString(),
                unreadCount,
                itemTitle: lastMsg?.itemTitle || "Perbualan"
            });
        }
    }
    
    conversations.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));
    return conversations;
}

// Mark all messages in a conversation as read
function markConversationRead(convId) {
    const messagesObj = getAllMessages();
    if (messagesObj[convId]) {
        let updated = false;
        messagesObj[convId] = messagesObj[convId].map(msg => {
            if (msg.to === currentUser && !msg.read) {
                updated = true;
                return { ...msg, read: true };
            }
            return msg;
        });
        if (updated) saveAllMessages(messagesObj);
    }
}

// Render inbox conversations list
function renderInbox() {
    const convList = document.getElementById('conversationList');
    const conversations = getUserConversations();
    
    if (conversations.length === 0) {
        convList.innerHTML = `<div style="padding: 2rem; text-align:center; color:var(--muted);"><i class="fas fa-comment-slash"></i><br>Tiada perbualan. Klik "Contact" pada mana-mana item untuk mula.</div>`;
        return;
    }
    
    convList.innerHTML = conversations.map(conv => `
        <div class="conv-item" data-convid="${conv.convId}" data-other="${conv.otherUser}">
            <div class="conv-avatar">${conv.otherUser.charAt(0).toUpperCase()}</div>
            <div class="conv-info">
                <div class="conv-name">
                    <span>${escapeHtml(conv.otherUser)}</span>
                    <span class="conv-time">${formatTime(conv.lastTimestamp)}</span>
                </div>
                <div class="conv-preview">${escapeHtml(conv.lastMsgText.substring(0, 50))}</div>
            </div>
            ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
        </div>
    `).join('');
    
    // Add click event listeners to conversation items
    document.querySelectorAll('.conv-item').forEach(el => {
        el.addEventListener('click', () => {
            const convId = el.getAttribute('data-convid');
            const otherUser = el.getAttribute('data-other');
            openConversation(convId, otherUser);
            markConversationRead(convId);
            renderInbox();
        });
    });
}

let currentConvId = null;
let currentOtherUser = null;

// Open a conversation
function openConversation(convId, otherUser, autoMessage = null) {
    currentConvId = convId;
    currentOtherUser = otherUser;
    
    const messagesObj = getAllMessages();
    let messages = messagesObj[convId] || [];
    
    // If autoMessage provided and no messages exist yet, send it
    if (autoMessage && messages.length === 0) {
        sendMessage(otherUser, null, null, autoMessage);
        messages = messagesObj[convId] || [];
    }
    
    // Update chat header
    document.getElementById('chatPartnerName').innerHTML = `<i class="fas fa-user-circle"></i> ${escapeHtml(otherUser)}`;
    
    const lastItem = messages.length > 0 ? (messages[0].itemTitle || "Perbualan") : "Perbualan";
    document.getElementById('chatContext').innerHTML = `<i class="fas fa-tag"></i> Berkaitan: ${escapeHtml(lastItem)}`;
    
    // Render messages
    const chatContainer = document.getElementById('chatMessages');
    if (messages.length === 0) {
        chatContainer.innerHTML = `<div class="empty-chat"><i class="fas fa-comment"></i><br>Tiada mesej. Hantar mesej pertama!</div>`;
    } else {
        chatContainer.innerHTML = messages.map(msg => {
            const isSent = msg.from === currentUser;
            return `
                <div class="message-bubble ${isSent ? 'message-sent' : 'message-received'}">
                    ${escapeHtml(msg.text)}
                    <div class="message-meta">
                        <span>${formatTime(msg.timestamp)}</span>
                        ${msg.itemTitle ? `<span><i class="fas fa-box"></i> ${escapeHtml(msg.itemTitle)}</span>` : ''}
                        ${isSent ? '<span><i class="fas fa-check"></i></span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Show input area
    document.getElementById('chatInputArea').style.display = 'flex';
    document.getElementById('messageInput').focus();
    
    // Highlight active conversation in inbox
    document.querySelectorAll('.conv-item').forEach(el => {
        if (el.getAttribute('data-convid') === convId) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Send a new message in current conversation
function sendNewMessage() {
    if (!currentOtherUser || !currentConvId) {
        showToast("Pilih perbualan dahulu.", true);
        return;
    }
    
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;
    
    const messagesObj = getAllMessages();
    const convMsgs = messagesObj[currentConvId] || [];
    let itemTitle = "Item";
    let itemId = null;
    
    if (convMsgs.length > 0) {
        itemTitle = convMsgs[0].itemTitle || "Item";
        itemId = convMsgs[0].itemId;
    }
    
    if (!messagesObj[currentConvId]) messagesObj[currentConvId] = [];
    
    const newMsg = {
        id: Date.now() + "_" + Math.random().toString(36),
        from: currentUser,
        to: currentOtherUser,
        text: text,
        timestamp: new Date().toISOString(),
        itemId: itemId,
        itemTitle: itemTitle,
        read: false
    };
    
    messagesObj[currentConvId].push(newMsg);
    saveAllMessages(messagesObj);
    input.value = '';
    openConversation(currentConvId, currentOtherUser);
    renderInbox();
}

// Format timestamp to relative time
function formatTime(isoString) {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Baru';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} jam`;
    if (diffDays < 7) return `${diffDays} hari`;
    
    return date.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' });
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

// Show toast notification
function showToast(msg, isErr = false) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = msg;
    toast.style.background = isErr ? '#5a1e15' : '#1a1410';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Check for pending chat from browse-items
function checkPendingChat() {
    const pendingChat = sessionStorage.getItem("pendingChat");
    if (pendingChat) {
        sessionStorage.removeItem("pendingChat");
        try {
            const chatData = JSON.parse(pendingChat);
            const { targetUser, itemTitle, itemId, autoMessage } = chatData;
            
            if (targetUser && targetUser !== currentUser) {
                showToast(`Membuka perbualan dengan ${targetUser}...`, false);
                
                const convId = getConversationId(currentUser, targetUser);
                const messagesObj = getAllMessages();
                if (!messagesObj[convId]) {
                    messagesObj[convId] = [];
                    saveAllMessages(messagesObj);
                }
                
                // If auto message provided, send it
                if (autoMessage) {
                    sendMessage(targetUser, itemId, itemTitle, autoMessage);
                }
                
                // Open the conversation after a short delay
                setTimeout(() => {
                    openConversation(convId, targetUser);
                    renderInbox();
                }, 100);
            }
        } catch (e) {
            console.error("Error parsing pending chat:", e);
        }
    }
}

// Global function for browse-items to start conversation
window.startConversation = function(targetUser, itemTitle, itemId) {
    if (!targetUser || targetUser === currentUser) {
        showToast("Anda tidak boleh berinteraksi dengan diri sendiri.", true);
        return false;
    }
    
    const convId = getConversationId(currentUser, targetUser);
    const messagesObj = getAllMessages();
    if (!messagesObj[convId]) {
        messagesObj[convId] = [];
        saveAllMessages(messagesObj);
    }
    
    openConversation(convId, targetUser);
    renderInbox();
    document.getElementById('messageInput')?.focus();
    showToast(`Anda kini berbual dengan ${targetUser} tentang ${itemTitle}`, false);
    return true;
};

// Load inbox function for external calls
window.loadMessagesInbox = function() { 
    renderInbox(); 
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendMsgBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendNewMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendNewMessage();
        });
    }
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === MESSAGES_KEY) {
            renderInbox();
            if (currentConvId && currentOtherUser) {
                openConversation(currentConvId, currentOtherUser);
            }
        }
    });
    
    // Initialize
    renderInbox();
    checkPendingChat();
    
    if (!currentOtherUser) {
        document.getElementById('chatInputArea').style.display = 'none';
    }
});

console.log("💬 Messaging system initialized for user:", currentUser);