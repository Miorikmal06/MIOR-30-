// Storage keys
const USERS_KEY = "lf_users";
const REPORTS_KEY = "lf_reports";
const CHATS_KEY = "lf_chats";

// Helper: initialize data
function initData() {
    if(!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify([]));
    if(!localStorage.getItem(REPORTS_KEY)) localStorage.setItem(REPORTS_KEY, JSON.stringify([]));
    if(!localStorage.getItem(CHATS_KEY)) localStorage.setItem(CHATS_KEY, JSON.stringify([]));
}
initData();

// Auth: signup
if(document.getElementById("signupForm")) {
    document.getElementById("signupForm").addEventListener("submit", (e) => {
        e.preventDefault();
        let name = document.getElementById("fullName").value;
        let email = document.getElementById("signupEmail").value;
        let phone = document.getElementById("phone").value;
        let pwd = document.getElementById("signupPassword").value;
        let users = JSON.parse(localStorage.getItem(USERS_KEY));
        if(users.find(u=>u.email===email)) return alert("Email already exists!");
        users.push({ name, email, phone, password: pwd });
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        alert("Sign up success! Please login.");
        window.location.href = "login.html";
    });
}
// Login
if(document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        let email = document.getElementById("loginEmail").value;
        let pwd = document.getElementById("loginPassword").value;
        let users = JSON.parse(localStorage.getItem(USERS_KEY));
        let user = users.find(u=> u.email===email && u.password===pwd);
        if(user) {
            sessionStorage.setItem("loggedInUser", JSON.stringify({name:user.name,email:user.email,phone:user.phone}));
            window.location.href = "index.html";
        } else alert("Invalid credentials");
    });
}
// dashboard welcome
function displayDashboardStats() {
    let user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if(!user) return;
    document.getElementById("userNameDisplay") && (document.getElementById("userNameDisplay").innerText = user.name);
    let reports = JSON.parse(localStorage.getItem(REPORTS_KEY));
    document.getElementById("totalItems") && (document.getElementById("totalItems").innerText = reports.length);
}
// report lost
if(document.getElementById("reportLostForm")) {
    document.getElementById("reportLostForm").addEventListener("submit", (e) => {
        e.preventDefault();
        let user = JSON.parse(sessionStorage.getItem("loggedInUser"));
        if(!user) return window.location="login.html";
        let newReport = {
            id: Date.now(),
            type: "lost",
            itemName: document.getElementById("lostItemName").value,
            category: document.getElementById("lostCategory").value,
            description: document.getElementById("lostDescription").value,
            location: document.getElementById("lostLocation").value,
            date: document.getElementById("lostDate").value,
            reporterEmail: user.email,
            reporterName: user.name,
            timestamp: new Date().toISOString()
        };
        let reports = JSON.parse(localStorage.getItem(REPORTS_KEY));
        reports.push(newReport);
        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
        alert("Lost item reported!");
        window.location.href = "my-reports.html";
    });
}
// report found
if(document.getElementById("reportFoundForm")) {
    document.getElementById("reportFoundForm").addEventListener("submit", (e) => {
        e.preventDefault();
        let user = JSON.parse(sessionStorage.getItem("loggedInUser"));
        let newFound = {
            id: Date.now(),
            type: "found",
            itemName: document.getElementById("foundItemName").value,
            description: document.getElementById("foundDescription").value,
            location: document.getElementById("foundLocation").value,
            contact: document.getElementById("foundContact").value,
            reporterEmail: user.email,
            reporterName: user.name
        };
        let reports = JSON.parse(localStorage.getItem(REPORTS_KEY));
        reports.push(newFound);
        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
        alert("Found item reported! Someone may contact you.");
        window.location.href = "my-reports.html";
    });
}
// browse + search
function loadBrowseItems() {
    let user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if(!user) return;
    let reports = JSON.parse(localStorage.getItem(REPORTS_KEY));
    let container = document.getElementById("itemsList");
    function render(filter="") {
        let filtered = reports.filter(r => r.itemName.toLowerCase().includes(filter) || r.description.toLowerCase().includes(filter));
        container.innerHTML = filtered.map(r => `<div class='item-card'><h3>${r.itemName}</h3><p>${r.type.toUpperCase()} - ${r.location||''}</p><p>${r.description}</p><button class='btn btn-primary' onclick='startChatWith("${r.reporterEmail}","${r.itemName}")'>Chat Owner</button></div>`).join("");
    }
    let searchInput = document.getElementById("searchInput");
    if(searchInput) searchInput.addEventListener("input", (e)=>render(e.target.value.toLowerCase()));
    render("");
}
window.startChatWith = (reporterEmail, itemName) => {
    let currentUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if(currentUser.email === reporterEmail) return alert("It's your own report!");
    let chatId = [currentUser.email, reporterEmail].sort().join("_");
    let chats = JSON.parse(localStorage.getItem(CHATS_KEY));
    let existing = chats.find(c=>c.id === chatId);
    if(!existing) {
        chats.push({ id: chatId, participants: [currentUser.email, reporterEmail], messages: [], itemContext: itemName });
        localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    }
    sessionStorage.setItem("activeChat", chatId);
    window.location.href = `chat.html?chat=${chatId}&other=${reporterEmail}`;
};
// my reports
function loadMyReports() {
    let user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    let reports = JSON.parse(localStorage.getItem(REPORTS_KEY));
    let myReports = reports.filter(r=> r.reporterEmail === user.email);
    document.getElementById("myReportsContainer").innerHTML = myReports.map(r=> `<div class='item-card'><strong>${r.type}</strong> : ${r.itemName} - ${r.location || ''}<br>${r.description}<button class='btn btn-danger' onclick='deleteReport(${r.id})'>Delete</button></div>`).join("");
}
window.deleteReport = (id) => {
    let reports = JSON.parse(localStorage.getItem(REPORTS_KEY));
    let updated = reports.filter(r=> r.id !== id);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
    loadMyReports();
};
// messages inbox
function loadMessagesInbox() {
    let user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    let chats = JSON.parse(localStorage.getItem(CHATS_KEY));
    let userChats = chats.filter(c=> c.participants.includes(user.email));
    let chatListDiv = document.getElementById("chatList");
    chatListDiv.innerHTML = userChats.map(chat=> {
        let other = chat.participants.find(p=> p!==user.email);
        let lastMsg = chat.messages.length ? chat.messages[chat.messages.length-1].text : "No messages";
        return `<div class='chat-item' onclick="openChat('${chat.id}','${other}')"><strong>${other}</strong><p>${lastMsg}</p></div>`;
    }).join("");
}
window.openChat = (chatId, otherEmail) => {
    sessionStorage.setItem("activeChat", chatId);
    window.location.href = `chat.html?chat=${chatId}&other=${otherEmail}`;
};
// chat room
function initChatRoom() {
    let params = new URLSearchParams(window.location.search);
    let chatId = params.get("chat");
    let other = params.get("other");
    let currentUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if(!chatId) return;
    let chats = JSON.parse(localStorage.getItem(CHATS_KEY));
    let chat = chats.find(c=> c.id === chatId);
    if(!chat) return;
    function renderMessages() {
        let msgDiv = document.getElementById("chatMessages");
        msgDiv.innerHTML = chat.messages.map(m=> `<div class='message-bubble'><b>${m.sender}</b>: ${m.text} <small>${new Date(m.time).toLocaleTimeString()}</small></div>`).join("");
        msgDiv.scrollTop = msgDiv.scrollHeight;
    }
    renderMessages();
    document.getElementById("sendMsgBtn").addEventListener("click",()=>{
        let msgInput = document.getElementById("chatMessageInput");
        if(msgInput.value.trim() === "") return;
        chat.messages.push({ sender: currentUser.email, text: msgInput.value, time: Date.now() });
        localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
        renderMessages();
        msgInput.value = "";
    });
}
// profile & logout
function displayProfileAndLogout() {
    let user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if(user) {
        document.getElementById("profileName").innerText = user.name;
        document.getElementById("profileEmail").innerText = user.email;
        document.getElementById("profilePhone").innerText = user.phone || "Not provided";
    }
    document.getElementById("logoutBtn")?.addEventListener("click",()=>{
        sessionStorage.clear();
        window.location.href = "login.html";
    });
}