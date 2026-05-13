/* ═══════════════════════════════════════════════════
   FINDERSMEET — script.js
   Full app logic: auth, reports, browse, chat, profile
═══════════════════════════════════════════════════ */

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
let currentUser = null;
let currentFilter = 'all';
let viewingItemId = null;
let currentChatWith = null; // { userId, itemId }
let screenHistory = [];

// ═══════════════════════════════════════
// LOCAL STORAGE HELPERS
// ═══════════════════════════════════════
function getUsers()        { return JSON.parse(localStorage.getItem('fm_users') || '[]'); }
function saveUsers(u)      { localStorage.setItem('fm_users', JSON.stringify(u)); }
function getItems()        { return JSON.parse(localStorage.getItem('fm_items') || '[]'); }
function saveItems(i)      { localStorage.setItem('fm_items', JSON.stringify(i)); }
function getMessages()     { return JSON.parse(localStorage.getItem('fm_messages') || '[]'); }
function saveMessages(m)   { localStorage.setItem('fm_messages', JSON.stringify(m)); }
function getSession()      { return JSON.parse(localStorage.getItem('fm_session') || 'null'); }
function saveSession(u)    { localStorage.setItem('fm_session', JSON.stringify(u)); }
function clearSession()    { localStorage.removeItem('fm_session'); }

// ═══════════════════════════════════════
// SCREEN NAVIGATION
// ═══════════════════════════════════════
function goTo(screenId) {
  const prev = document.querySelector('.screen.active');
  const next = document.getElementById(screenId);
  if (!next || prev === next) return;

  if (prev) {
    screenHistory.push(prev.id);
    prev.classList.remove('active');
    prev.classList.add('slide-back');
    setTimeout(() => prev.classList.remove('slide-back'), 350);
  }

  next.classList.add('active');
  next.scrollTop = 0;

  updateFabBar(screenId);
  updateTopBar(screenId);
  onScreenEnter(screenId);
}

function goBack() {
  if (screenHistory.length === 0) return;
  const prevId = screenHistory.pop();
  const curr = document.querySelector('.screen.active');
  const prev = document.getElementById(prevId);
  if (!prev) return;

  curr?.classList.remove('active');
  prev.classList.add('active');
  prev.scrollTop = 0;

  updateFabBar(prevId);
  updateTopBar(prevId);
}

function onScreenEnter(id) {
  if (id === 'dashboard')   refreshDashboard();
  if (id === 'find-items')  renderItems();
  if (id === 'my-items')    renderMyItems();
  if (id === 'messages')    renderConversations();
  if (id === 'profile')     renderProfile();
}

const topBarTitles = {
  dashboard: 'Dashboard',
  'find-items': 'Browse Items',
  'my-items': 'My Reports',
  'item-detail': 'Item Details',
  messages: 'Messages',
  'chat-screen': 'Chat',
  profile: 'My Profile',
  'report-lost': 'Report Lost Item',
  'report-found': 'Report Found Item',
};

function updateTopBar(id) {
  const tb = document.getElementById('desktop-topbar');
  const title = document.getElementById('desktop-topbar-title');
  const authScreens = ['splash', 'login', 'signup'];
  if (authScreens.includes(id)) {
    tb.style.display = 'none';
  } else {
    tb.style.display = 'flex';
    title.textContent = topBarTitles[id] || '';
  }
}

function updateFabBar(id) {
  const fab = document.getElementById('fab-bar');
  const authScreens = ['splash', 'login', 'signup'];
  if (authScreens.includes(id)) {
    fab.classList.remove('visible');
  } else {
    fab.classList.add('visible');
  }
}

// Sidebar active state helper
function setSidebarActive(itemId) {
  document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(itemId);
  if (el) el.classList.add('active');
}

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
function doSignup() {
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim().toLowerCase();
  const phone = document.getElementById('su-phone').value.trim();
  const pass  = document.getElementById('su-pass').value;
  const err   = document.getElementById('su-err');

  if (!name || !email || !pass) {
    err.style.display = 'block';
    err.textContent = 'Sila isi semua maklumat dengan lengkap.';
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    err.style.display = 'block';
    err.textContent = 'Email ini sudah didaftarkan.';
    return;
  }

  err.style.display = 'none';

  const user = {
    id: 'u_' + Date.now(),
    name, email, phone, pass,
    joinedAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  saveSession(user);
  currentUser = user;

  showToast('Akaun berjaya dibuat! 🎉', 'green');
  afterLogin();
}

function doLogin() {
  const email = document.getElementById('li-email').value.trim().toLowerCase();
  const pass  = document.getElementById('li-pass').value;
  const err   = document.getElementById('li-err');

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.pass === pass);

  if (!user) {
    err.style.display = 'block';
    return;
  }

  err.style.display = 'none';
  saveSession(user);
  currentUser = user;
  showToast('Selamat datang kembali, ' + user.name + '! 👋', 'green');
  afterLogin();
}

function doLogout() {
  clearSession();
  currentUser = null;
  screenHistory = [];
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('fab-bar').classList.remove('visible');
  document.getElementById('desktop-topbar').style.display = 'none';
  goTo('splash');
  setSidebarActive('snav-dashboard');
}

function afterLogin() {
  screenHistory = [];
  goTo('dashboard');
  setSidebarActive('snav-dashboard');
  updateSidebarUser();
}

function updateSidebarUser() {
  if (!currentUser) return;
  const initial = currentUser.name.charAt(0).toUpperCase();
  const el = (id) => document.getElementById(id);
  el('sidebar-user-av').textContent   = initial;
  el('sidebar-user-name').textContent = currentUser.name;
  el('sidebar-user-email').textContent= currentUser.email;
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
function refreshDashboard() {
  if (!currentUser) return;
  const initial = currentUser.name.charAt(0).toUpperCase();

  document.getElementById('dash-welcome').textContent = 'Selamat datang, ' + currentUser.name + '!';
  document.getElementById('dash-avatar').textContent  = initial;

  const items = getItems();
  const active = items.filter(i => i.status !== 'resolved');
  document.getElementById('browse-count').textContent = active.length + ' item aktif dalam komuniti';

  updateSidebarUser();
  checkUnreadBadge();
}

// ═══════════════════════════════════════
// REPORT SUBMIT
// ═══════════════════════════════════════
function previewImage(prefix) {
  const input = document.getElementById(prefix + '-img-input');
  const preview = document.getElementById(prefix + '-preview');
  const placeholder = document.getElementById(prefix + '-placeholder');
  const changeBtn = document.getElementById(prefix + '-change-btn');

  if (!input.files[0]) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    changeBtn.style.display = 'block';
  };
  reader.readAsDataURL(input.files[0]);
}

function submitReport(type) {
  const p = type === 'lost' ? 'rl' : 'rf';
  const name  = document.getElementById(p + '-name').value.trim();
  const cat   = document.getElementById(p + '-cat').value;
  const loc   = document.getElementById(p + '-loc').value.trim();
  const date  = document.getElementById(p + '-date').value;
  const desc  = document.getElementById(p + '-desc').value.trim();
  const preview = document.getElementById(p + '-preview');

  if (!name || !loc) {
    showToast('Sila isi Nama Item dan Lokasi! ⚠️');
    return;
  }

  const item = {
    id: 'item_' + Date.now(),
    type,
    name, cat, loc, date, desc,
    image: preview.style.display !== 'none' ? preview.src : null,
    ownerId: currentUser.id,
    ownerName: currentUser.name,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  if (type === 'lost') {
    item.reward = document.getElementById('rl-reward').value.trim();
  } else {
    item.handover = document.getElementById('rf-handover').value.trim();
  }

  const items = getItems();
  items.unshift(item);
  saveItems(items);

  // Reset form
  resetReportForm(p);

  showToast(type === 'lost' ? 'Laporan kehilangan dihantar! 🔍' : 'Laporan jumpa item dihantar! ✓', 'green');
  goTo('my-items');
  setSidebarActive('snav-my-items');
}

function resetReportForm(p) {
  ['name','loc','date','desc'].forEach(f => {
    const el = document.getElementById(p + '-' + f);
    if (el) el.value = '';
  });
  const cat = document.getElementById(p + '-cat');
  if (cat) cat.value = '';
  const reward = document.getElementById('rl-reward');
  if (reward) reward.value = '';
  const handover = document.getElementById('rf-handover');
  if (handover) handover.value = '';

  const preview = document.getElementById(p + '-preview');
  const placeholder = document.getElementById(p + '-placeholder');
  const changeBtn = document.getElementById(p + '-change-btn');
  if (preview) { preview.src=''; preview.style.display='none'; }
  if (placeholder) placeholder.style.display='flex';
  if (changeBtn) changeBtn.style.display='none';

  const input = document.getElementById(p + '-img-input');
  if (input) input.value = '';
}

// ═══════════════════════════════════════
// BROWSE ITEMS
// ═══════════════════════════════════════
function setFilter(filter, chipEl) {
  currentFilter = filter;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chipEl.classList.add('active');
  renderItems();
}

function renderItems() {
  const container = document.getElementById('items-list');
  const query = (document.getElementById('search-input')?.value || '').toLowerCase();
  let items = getItems().filter(i => i.status !== 'resolved');

  if (currentFilter === 'lost')   items = items.filter(i => i.type === 'lost');
  else if (currentFilter === 'found') items = items.filter(i => i.type === 'found');
  else if (currentFilter !== 'all') items = items.filter(i => i.cat === currentFilter);

  if (query) {
    items = items.filter(i =>
      i.name.toLowerCase().includes(query) ||
      (i.loc||'').toLowerCase().includes(query) ||
      (i.desc||'').toLowerCase().includes(query)
    );
  }

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3dba6e" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      <p>Tiada item dijumpai.</p>
    </div>`;
    return;
  }

  container.innerHTML = items.map(item => buildItemCard(item)).join('');
}

function renderMyItems() {
  const container = document.getElementById('my-items-list');
  if (!currentUser) { container.innerHTML = ''; return; }
  const items = getItems().filter(i => i.ownerId === currentUser.id);

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3dba6e" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
      <p>Tiada laporan lagi. Mulakan dengan membuat laporan!</p>
    </div>`;
    return;
  }

  container.innerHTML = items.map(item => buildItemCard(item, true)).join('');
}

function buildItemCard(item, showStatus = false) {
  const imgHtml = item.image
    ? `<img src="${item.image}" alt="${item.name}">`
    : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3dba6e" stroke-width="1.5" opacity="0.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;

  const statusBadge = `<span class="status-badge status-${item.type}">${item.type === 'lost' ? '🔍 Lost' : '✓ Found'}</span>`;
  const resolvedBadge = item.status === 'resolved'
    ? `<span class="status-badge" style="background:#e0f2fe;color:#0369a1">✔ Resolved</span>` : '';

  return `<div class="item-card" onclick="openItemDetail('${item.id}')">
    <div class="item-thumb">${imgHtml}</div>
    <div class="item-card-text">
      <h3>${escHtml(item.name)}</h3>
      <p>📍 ${escHtml(item.loc || '—')}</p>
      <div class="item-meta">
        ${statusBadge}
        ${resolvedBadge}
        ${item.date ? `<span style="font-size:10px;color:var(--muted)">${formatDate(item.date)}</span>` : ''}
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════
// ITEM DETAIL
// ═══════════════════════════════════════
function openItemDetail(itemId) {
  viewingItemId = itemId;
  const items = getItems();
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const isOwner = currentUser && item.ownerId === currentUser.id;

  // Image
  const imgWrap = document.getElementById('di-img-wrap');
  if (item.image) {
    imgWrap.innerHTML = `<img src="${item.image}" alt="${escHtml(item.name)}" style="width:100%;height:100%;object-fit:cover">`;
  } else {
    imgWrap.innerHTML = `<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#3dba6e" stroke-width="1.5" opacity="0.4"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;
  }

  document.getElementById('di-name').textContent   = item.name || '—';
  document.getElementById('di-cat').textContent    = item.cat  || '—';
  document.getElementById('di-loc').textContent    = item.loc  || '—';
  document.getElementById('di-date').textContent   = item.date ? formatDate(item.date) : '—';
  document.getElementById('di-desc').textContent   = item.desc || '—';
  document.getElementById('di-reporter').textContent = item.ownerName || '—';
  document.getElementById('di-reporter-av').textContent = (item.ownerName || 'U').charAt(0).toUpperCase();

  const statusBadge = document.getElementById('di-status');
  if (item.status === 'resolved') {
    statusBadge.className = 'status-badge';
    statusBadge.style.cssText = 'background:#e0f2fe;color:#0369a1';
    statusBadge.textContent = '✔ Resolved';
  } else {
    statusBadge.className = `status-badge status-${item.type}`;
    statusBadge.style.cssText = '';
    statusBadge.textContent = item.type === 'lost' ? '🔍 Lost' : '✓ Found';
  }

  const rewardRow = document.getElementById('di-reward-row');
  if (item.reward) {
    rewardRow.style.display = 'flex';
    document.getElementById('di-reward').textContent = item.reward;
  } else {
    rewardRow.style.display = 'none';
  }

  // Owner menu button
  document.getElementById('item-detail-menu').style.display = isOwner ? 'block' : 'none';

  // Mark resolved button label
  document.getElementById('menu-mark-btn').textContent =
    item.status === 'resolved' ? '↩ Mark as Active' : '✓ Mark as Resolved';

  // Action buttons
  const actionsDiv = document.getElementById('di-actions');
  if (isOwner) {
    actionsDiv.innerHTML = '';
  } else {
    actionsDiv.innerHTML = `<button class="btn btn-primary" onclick="startChat('${item.ownerId}','${item.id}')">💬 Chat with ${escHtml(item.ownerName)}</button>`;
  }

  goTo('item-detail');
}

function showItemMenu() {
  document.getElementById('item-menu-modal').classList.add('show');
}

function closeItemMenu() {
  document.getElementById('item-menu-modal').classList.remove('show');
}

function markItemResolved() {
  const items = getItems();
  const item = items.find(i => i.id === viewingItemId);
  if (!item) return;
  item.status = item.status === 'resolved' ? 'active' : 'resolved';
  saveItems(items);
  closeItemMenu();
  showToast(item.status === 'resolved' ? 'Item ditanda sebagai selesai ✔' : 'Item diaktifkan semula', 'green');
  openItemDetail(viewingItemId);
}

function deleteMyItem() {
  let items = getItems();
  items = items.filter(i => i.id !== viewingItemId);
  saveItems(items);
  closeItemMenu();
  showToast('Laporan dipadam.', '');
  goBack();
}

// ═══════════════════════════════════════
// MESSAGES / CHAT
// ═══════════════════════════════════════
function getChatKey(userId1, userId2, itemId) {
  const sorted = [userId1, userId2].sort().join('_');
  return `${sorted}_${itemId}`;
}

function startChat(otherUserId, itemId) {
  if (!currentUser) return;
  const users = getUsers();
  const other = users.find(u => u.id === otherUserId);
  if (!other) return;

  currentChatWith = { userId: otherUserId, name: other.name, itemId };
  openChat();
}

function openChat() {
  if (!currentChatWith) return;
  const other = currentChatWith;
  const initial = other.name.charAt(0).toUpperCase();
  const avatarColors = ['#3dba6e','#f47c3c','#6366f1','#ec4899','#0ea5e9'];
  const colorIdx = other.userId.charCodeAt(other.userId.length-1) % avatarColors.length;

  const avatarEl = document.getElementById('chat-other-av');
  avatarEl.textContent = initial;
  avatarEl.style.background = avatarColors[colorIdx];

  document.getElementById('chat-other-name').textContent = other.name;

  renderChatMessages();
  goTo('chat-screen');
}

function renderChatMessages() {
  if (!currentChatWith || !currentUser) return;
  const key = getChatKey(currentUser.id, currentChatWith.userId, currentChatWith.itemId);
  const allMessages = getMessages();
  const msgs = allMessages.filter(m => m.chatKey === key);

  const container = document.getElementById('chat-messages');
  if (msgs.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:13px;padding:20px 0">Mulakan perbualan! 👋</div>`;
    return;
  }

  container.innerHTML = msgs.map(m => {
    const isMe = m.senderId === currentUser.id;
    const senderName = isMe ? currentUser.name : currentChatWith.name;
    const initial = senderName.charAt(0).toUpperCase();
    const colorClass = isMe ? 'var(--green)' : 'var(--orange)';

    const contentHtml = m.image
      ? `<img src="${m.image}" alt="image" style="max-width:200px;border-radius:10px;display:block">`
      : escHtml(m.text);

    return `<div class="chat-bubble-row ${isMe ? 'me' : ''}">
      <div class="bubble-avatar" style="background:${colorClass}">${initial}</div>
      <div class="bubble ${isMe ? 'me' : 'them'}">
        ${contentHtml}
        <span class="bubble-time">${formatTime(m.createdAt)}</span>
      </div>
    </div>`;
  }).join('');

  // Mark as read
  const allMsgs = getMessages();
  allMsgs.forEach(m => {
    if (m.chatKey === key && m.senderId !== currentUser.id) m.read = true;
  });
  saveMessages(allMsgs);

  container.scrollTop = container.scrollHeight;
  checkUnreadBadge();
}

function sendMessage() {
  if (!currentChatWith || !currentUser) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const key = getChatKey(currentUser.id, currentChatWith.userId, currentChatWith.itemId);
  const msg = {
    id: 'msg_' + Date.now(),
    chatKey: key,
    senderId: currentUser.id,
    receiverId: currentChatWith.userId,
    text,
    image: null,
    read: false,
    createdAt: new Date().toISOString()
  };

  const msgs = getMessages();
  msgs.push(msg);
  saveMessages(msgs);
  input.value = '';
  renderChatMessages();
}

function sendChatImage() {
  const input = document.getElementById('chat-img-input');
  if (!input.files[0] || !currentChatWith || !currentUser) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const key = getChatKey(currentUser.id, currentChatWith.userId, currentChatWith.itemId);
    const msg = {
      id: 'msg_' + Date.now(),
      chatKey: key,
      senderId: currentUser.id,
      receiverId: currentChatWith.userId,
      text: '',
      image: e.target.result,
      read: false,
      createdAt: new Date().toISOString()
    };
    const msgs = getMessages();
    msgs.push(msg);
    saveMessages(msgs);
    input.value = '';
    renderChatMessages();
  };
  reader.readAsDataURL(input.files[0]);
}

function renderConversations() {
  if (!currentUser) return;
  const container = document.getElementById('conversations-list');
  const allMessages = getMessages();

  // Find unique chatKeys involving current user
  const myChats = {};
  allMessages.forEach(m => {
    if (m.senderId === currentUser.id || m.receiverId === currentUser.id) {
      if (!myChats[m.chatKey] || new Date(m.createdAt) > new Date(myChats[m.chatKey].createdAt)) {
        myChats[m.chatKey] = m;
      }
    }
  });

  const chatList = Object.values(myChats).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (chatList.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3dba6e" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <p>Tiada perbualan lagi.</p>
    </div>`;
    return;
  }

  const users = getUsers();
  const items = getItems();
  const avatarColors = ['#3dba6e','#f47c3c','#6366f1','#ec4899','#0ea5e9'];

  container.innerHTML = chatList.map(lastMsg => {
    const otherId = lastMsg.senderId === currentUser.id ? lastMsg.receiverId : lastMsg.senderId;
    const other = users.find(u => u.id === otherId) || { name: 'Unknown', id: otherId };
    const item = items.find(i => i.id === lastMsg.chatKey.split('_').pop()) || null;
    const initial = other.name.charAt(0).toUpperCase();
    const colorIdx = otherId.charCodeAt(otherId.length-1) % avatarColors.length;
    const bgColor = avatarColors[colorIdx];

    // Count unread
    const unread = allMessages.filter(m =>
      m.chatKey === lastMsg.chatKey && m.senderId !== currentUser.id && !m.read
    ).length;

    const preview = lastMsg.image ? '📷 Image' : escHtml(lastMsg.text.substring(0, 40));
    const itemParts = lastMsg.chatKey.split('_');
    const itemId = itemParts[itemParts.length - 1];

    return `<div class="conv-card" onclick="openConvChat('${otherId}','${other.name}','${itemId}')">
      <div class="conv-avatar" style="background:${bgColor}">${initial}</div>
      <div class="conv-info">
        <h3>${escHtml(other.name)}</h3>
        <p>${preview || '...'}</p>
      </div>
      <div class="conv-meta">
        <span class="conv-time">${formatTime(lastMsg.createdAt)}</span>
        ${unread > 0 ? `<span class="conv-unread">${unread}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

function openConvChat(otherUserId, otherName, itemId) {
  currentChatWith = { userId: otherUserId, name: otherName, itemId };
  openChat();
}

function checkUnreadBadge() {
  if (!currentUser) return;
  const allMessages = getMessages();
  const unread = allMessages.filter(m => m.receiverId === currentUser.id && !m.read).length;

  const badge = document.getElementById('msg-badge');
  const sidebarBadge = document.getElementById('sidebar-msg-badge');

  if (unread > 0) {
    if (badge) { badge.style.display = 'flex'; badge.textContent = unread; }
    if (sidebarBadge) { sidebarBadge.style.display = 'flex'; sidebarBadge.textContent = unread; }
  } else {
    if (badge) badge.style.display = 'none';
    if (sidebarBadge) sidebarBadge.style.display = 'none';
  }
}

// ═══════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════
function renderProfile() {
  if (!currentUser) return;
  const initial = currentUser.name.charAt(0).toUpperCase();

  document.getElementById('profile-av-big').textContent  = initial;
  document.getElementById('profile-name-big').textContent = currentUser.name;
  document.getElementById('profile-email-big').textContent = currentUser.email;
  document.getElementById('p-name').value  = currentUser.name;
  document.getElementById('p-phone').value = currentUser.phone || '';

  // Stats
  const items = getItems();
  const myLost   = items.filter(i => i.ownerId === currentUser.id && i.type === 'lost').length;
  const myFound  = items.filter(i => i.ownerId === currentUser.id && i.type === 'found').length;
  const reunions = items.filter(i => i.ownerId === currentUser.id && i.status === 'resolved').length;

  document.getElementById('stat-lost').textContent    = myLost;
  document.getElementById('stat-found').textContent   = myFound;
  document.getElementById('stat-reunions').textContent = reunions;
}

function saveProfile() {
  const name  = document.getElementById('p-name').value.trim();
  const phone = document.getElementById('p-phone').value.trim();
  if (!name) { showToast('Nama tidak boleh kosong!'); return; }

  const users = getUsers();
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx === -1) return;

  users[idx].name  = name;
  users[idx].phone = phone;
  saveUsers(users);
  currentUser.name  = name;
  currentUser.phone = phone;
  saveSession(currentUser);

  renderProfile();
  updateSidebarUser();
  refreshDashboard();
  showToast('Profil dikemaskini! ✓', 'green');
}

// ═══════════════════════════════════════
// MODALS
// ═══════════════════════════════════════
function showReportModal() {
  document.getElementById('report-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('report-modal').classList.remove('show');
}

// ═══════════════════════════════════════
// TOAST
// ═══════════════════════════════════════
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast' + (type === 'green' ? ' green-toast' : '');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ms-MY', { day:'numeric', month:'short', year:'numeric' });
  } catch { return dateStr; }
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000)   return 'Baru sahaja';
    if (diff < 3600000) return Math.floor(diff/60000) + 'm lalu';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'j lalu';
    return d.toLocaleDateString('ms-MY', { day:'numeric', month:'short' });
  } catch { return ''; }
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Hide all screens first
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  const session = getSession();
  if (session) {
    currentUser = session;
    document.getElementById('fab-bar').classList.add('visible');
    updateTopBar('dashboard');
    document.getElementById('dashboard').classList.add('active');
    refreshDashboard();
    setSidebarActive('snav-dashboard');
  } else {
    document.getElementById('splash').classList.add('active');
    document.getElementById('desktop-topbar').style.display = 'none';
  }
});