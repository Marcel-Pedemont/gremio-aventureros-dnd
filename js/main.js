// Configuración Real de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCcUdHUP-2jeOwMohDxMJwY00Lm2I8SxEU",
    authDomain: "gremio-aventureros-dnd.firebaseapp.com",
    projectId: "gremio-aventureros-dnd",
    storageBucket: "gremio-aventureros-dnd.firebasestorage.app",
    messagingSenderId: "114422855181",
    appId: "1:114422855181:web:38e2e11fe82a36952d8744",
    measurementId: "G-WKVS37B8J7"
};

// Inicializar Servicios
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Vistas y Navegación
    const btnEnter = document.getElementById('btn-enter-multiverse');
    const btnBackHero = document.getElementById('btn-back-hero');
    const btnBackSlots = document.getElementById('btn-back-slots');
    const heroSection = document.getElementById('hero-landing');
    const slotsSection = document.getElementById('slots-section');
    const gameDashboard = document.getElementById('game-dashboard');
    const activeCampaignName = document.getElementById('active-campaign-name');
    const loginWarning = document.getElementById('login-warning');

    // Auth UI
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const userStatus = document.getElementById('user-status');
    const userAvatar = document.getElementById('user-avatar');
    const userDisplayName = document.getElementById('user-display-name');

    // Chat UI
    const chatDrawer = document.getElementById('chat-drawer');
    const btnChatToggle = document.getElementById('btn-chat-toggle');
    const btnCloseChat = document.getElementById('btn-close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // 1. ESCUCHADOR DE SESIÓN CON GOOGLE
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loginWarning.classList.add('hidden');
            btnGoogleLogin.classList.add('hidden');
            userStatus.classList.remove('hidden');

            userAvatar.src = user.photoURL || 'https://via.placeholder.com/26';
            userDisplayName.innerText = `${user.displayName ? user.displayName.split(' ')[0].toUpperCase() : 'JUGADOR'} (ONLINE)`;

            // Cargar datos en Mi Héroe
            document.getElementById('hero-profile-pic').src = user.photoURL || '';
            document.getElementById('hero-name-val').innerText = user.displayName || 'Aventurero';
            document.getElementById('hero-email-val').innerText = `Email: ${user.email}`;
        } else {
            currentUser = null;
            userStatus.classList.add('hidden');
            btnGoogleLogin.classList.remove('hidden');
        }
    });

    // Login Event
    btnGoogleLogin.addEventListener('click', async () => {
        try {
            await auth.signInWithPopup(googleProvider);
        } catch (error) {
            console.error("Error Auth:", error);
            alert("No se pudo iniciar sesión con Google.");
        }
    });

    // Logout Event
    userStatus.addEventListener('click', async () => {
        if (confirm("¿Deseas salir del Gremio?")) {
            await auth.signOut();
            gameDashboard.classList.replace('active', 'hidden');
            slotsSection.classList.replace('active', 'hidden');
            heroSection.classList.replace('hidden', 'active');
        }
    });

    // 2. BLOQUEO EN PORTADA SI NO HAY SESIÓN
    btnEnter.addEventListener('click', () => {
        if (!currentUser) {
            loginWarning.classList.remove('hidden');
            btnGoogleLogin.classList.add('pulse-glow');
            setTimeout(() => btnGoogleLogin.classList.remove('pulse-glow'), 1500);
            return;
        }
        heroSection.classList.replace('active', 'hidden');
        slotsSection.classList.replace('hidden', 'active');
    });

    // 3. CHAT EN TIEMPO REAL CON FIRESTORE
    btnChatToggle.addEventListener('click', () => {
        if (!currentUser) {
            alert("Inicia sesión para abrir el chat.");
            return;
        }
        chatDrawer.classList.toggle('hidden');
    });

    btnCloseChat.addEventListener('click', () => chatDrawer.classList.add('hidden'));

    db.collection('global_chat')
        .orderBy('timestamp', 'asc')
        .limitToLast(40)
        .onSnapshot(snapshot => {
            chatMessages.innerHTML = '';
            document.getElementById('chat-count').innerText = snapshot.size;

            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMe = currentUser && currentUser.email === msg.email;

                const msgDiv = document.createElement('div');
                msgDiv.className = `chat-msg ${isMe ? 'my-msg' : 'other-msg'}`;
                msgDiv.innerHTML = `
                    <span class="msg-user">${isMe ? 'TÚ' : msg.userName}</span>
                    <div class="msg-text">${msg.text}</div>
                `;
                chatMessages.appendChild(msgDiv);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text || !currentUser) return;

        try {
            await db.collection('global_chat').add({
                userName: currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Aventurero',
                email: currentUser.email,
                text: text,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            chatInput.value = '';
        } catch (err) {
            console.error("Error envío chat:", err);
        }
    });

    // 4. LANZADOR DE DADOS EN SALA DE JUEGO
    const diceBtns = document.querySelectorAll('.btn-dice');
    const diceDisplay = document.getElementById('dice-result-display');

    diceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sides = parseInt(btn.getAttribute('data-die'));
            const result = Math.floor(Math.random() * sides) + 1;
            
            diceDisplay.innerHTML = `🎲 Has tirado d${sides}: <strong class="die-val">${result}</strong>`;
            
            if (sides === 20 && result === 20) {
                diceDisplay.innerHTML += ` <span class="crit-text">¡CRÍTICO NATURAL! 🎉</span>`;
            } else if (sides === 20 && result === 1) {
                diceDisplay.innerHTML += ` <span class="pifia-text">¡PIFIA FATAL! 💀</span>`;
            }
        });
    });

    // 5. NAVEGACIÓN Y TABS
    btnBackHero.addEventListener('click', () => {
        slotsSection.classList.replace('active', 'hidden');
        heroSection.classList.replace('hidden', 'active');
    });

    document.querySelectorAll('.btn-slot').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.slot-card');
            const title = card.querySelector('h3').innerText;

            activeCampaignName.innerText = `[ ${title} ]`;
            slotsSection.classList.replace('active', 'hidden');
            gameDashboard.classList.replace('hidden', 'active');
        });
    });

    btnBackSlots.addEventListener('click', () => {
        gameDashboard.classList.replace('active', 'hidden');
        slotsSection.classList.replace('hidden', 'active');
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
});