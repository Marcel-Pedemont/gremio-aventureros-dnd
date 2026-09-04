// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCcUdHUP-2jeOwMohDxMJwY00Lm2I8SxEU",
    authDomain: "gremio-aventureros-dnd.firebaseapp.com",
    projectId: "gremio-aventureros-dnd",
    storageBucket: "gremio-aventureros-dnd.firebasestorage.app",
    messagingSenderId: "114422855181",
    appId: "1:114422855181:web:38e2e11fe82a36952d8744",
    measurementId: "G-WKVS37B8J7"
};

// Inicialización de Servicios
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Vistas Principal
    const heroSection = document.getElementById('hero-landing');
    const slotsSection = document.getElementById('slots-section');
    const gameDashboard = document.getElementById('game-dashboard');
    
    // Auth UI
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const userStatus = document.getElementById('user-status');
    const userAvatar = document.getElementById('user-avatar');
    const userDisplayName = document.getElementById('user-display-name');

    // Chat Drawer
    const chatDrawer = document.getElementById('chat-drawer');
    const btnChatToggle = document.getElementById('btn-chat-toggle');
    const btnCloseChat = document.getElementById('btn-close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // AI Master Terminal
    const aiStoryLog = document.getElementById('ai-story-log');
    const aiActionForm = document.getElementById('ai-action-form');
    const aiUserAction = document.getElementById('ai-user-action');

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // 1. AUTENTICACIÓN CON GOOGLE Y REGISTRO EN FIRESTORE
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('login-warning').classList.add('hidden');
            btnGoogleLogin.classList.add('hidden');
            userStatus.classList.remove('hidden');

            userAvatar.src = user.photoURL || 'https://via.placeholder.com/30';
            userDisplayName.innerText = `${user.displayName ? user.displayName.split(' ')[0].toUpperCase() : 'JUGADOR'} (ONLINE)`;

            // Guardar o actualizar usuario en Firestore para Ranking
            await db.collection('users').doc(user.uid).set({
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Cargar Ficha de Personaje
            updateDndSheetUI(user);
            loadGuildRanking();
        } else {
            currentUser = null;
            userStatus.classList.add('hidden');
            btnGoogleLogin.classList.remove('hidden');
        }
    });

    btnGoogleLogin.addEventListener('click', async () => {
        try {
            await auth.signInWithPopup(googleProvider);
        } catch (err) {
            console.error("Error Auth:", err);
        }
    });

    // 2. ENTRAR A LA AVENTURA
    document.getElementById('btn-enter-multiverse').addEventListener('click', () => {
        if (!currentUser) {
            document.getElementById('login-warning').classList.remove('hidden');
            return;
        }
        heroSection.classList.replace('active', 'hidden');
        slotsSection.classList.replace('hidden', 'active');
    });

    document.getElementById('btn-back-hero').addEventListener('click', () => {
        slotsSection.classList.replace('active', 'hidden');
        heroSection.classList.replace('hidden', 'active');
    });

    document.querySelectorAll('.btn-slot').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.slot-card');
            const title = card.querySelector('h3').innerText;

            document.getElementById('active-campaign-name').innerText = `[ MESA: ${title} ]`;
            slotsSection.classList.replace('active', 'hidden');
            gameDashboard.classList.replace('hidden', 'active');
        });
    });

    document.getElementById('btn-back-slots').addEventListener('click', () => {
        gameDashboard.classList.replace('active', 'hidden');
        slotsSection.classList.replace('hidden', 'active');
    });

    // 3. SISTEMA DE CHAT CON LA IA (DANGER MASTER)
    aiActionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const actionText = aiUserAction.value.trim();
        if (!actionText) return;

        // Renderizar acción del usuario
        appendStoryMsg('TÚ (Jugador)', actionText, true);
        aiUserAction.value = '';

        // Simular respuesta narrativa asincrónica del Danger Master
        setTimeout(() => {
            const responses = [
                `Danger Master-Mont procesa tu acción... "${actionText}". El entorno reacciona. Realiza una tirada de d20 para determinar si tienes éxito.`,
                `Escuchas un eco ressonar en las paredes mientras ejecutas tu movimiento. Danger Master-Mont registra tu avance en la bitácora de campaña.`,
                `¡Un desafío se presenta! Por favor presiona el botón d20 abajo para añadir la tirada a tu acción.`
            ];
            const randomReply = responses[Math.floor(Math.random() * responses.length)];
            appendStoryMsg('Danger Master-Mont (IA)', randomReply, false);
        }, 1000);
    });

    // Tirador de Dados Tactil Integrado
    document.querySelectorAll('.btn-quick-die').forEach(btn => {
        btn.addEventListener('click', () => {
            const sides = parseInt(btn.getAttribute('data-die'));
            const roll = Math.floor(Math.random() * sides) + 1;
            const diceMsg = `🎲 Ha tirado d${sides}. Resultado: [ ${roll} ]`;
            
            appendStoryMsg('TIRADA DE DADO', diceMsg, true);
            
            setTimeout(() => {
                if (sides === 20 && roll === 20) {
                    appendStoryMsg('Danger Master-Mont (IA)', '¡CRÍTICO NATURAL! 🎉 Logras un éxito deslumbrante en tu acción.', false);
                } else if (sides === 20 && roll === 1) {
                    appendStoryMsg('Danger Master-Mont (IA)', '¡PIFIA FATAL! 💀 Ocurre una complicación inesperada.', false);
                }
            }, 800);
        });
    });

    function appendStoryMsg(author, text, isUser) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${isUser ? 'user-action' : ''}`;
        msgDiv.innerHTML = `
            <div class="ai-author">${isUser ? '⚔️' : '🤖'} ${author}:</div>
            <div class="ai-text">${text}</div>
        `;
        aiStoryLog.appendChild(msgDiv);
        aiStoryLog.scrollTop = aiStoryLog.scrollHeight;
    }

    // 4. GENERADOR Y FICHA D&D 5E
    function updateDndSheetUI(user) {
        document.getElementById('hero-profile-pic').src = user.photoURL || '';
        document.getElementById('sheet-char-name').innerText = user.displayName || 'Aventurero';
        document.getElementById('sheet-player-email').innerText = `Jugador: ${user.email}`;
    }

    document.getElementById('btn-autogen-hero').addEventListener('click', () => {
        const classes = ['Guerrero', 'Mago', 'Pícaro', 'Clérigo', 'Bárbaro'];
        const races = ['Humano', 'Elfo', 'Enano', 'Mediano', 'Tiefling'];
        
        const randomClass = classes[Math.floor(Math.random() * classes.length)];
        const randomRace = races[Math.floor(Math.random() * races.length)];

        document.getElementById('val-class').innerText = `${randomClass} Nivel 1`;
        document.getElementById('val-race').innerText = randomRace;

        // Stats aleatorios d20 / 5e style
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
            const score = Math.floor(Math.random() * 8) + 10;
            const mod = Math.floor((score - 10) / 2);
            document.getElementById(`score-${stat}`).innerText = score;
            document.getElementById(`mod-${stat}`).innerText = mod >= 0 ? `+${mod}` : mod;
        });

        alert("¡Ficha re-generada automáticamente con reglas D&D 5e!");
    });

    // 5. RANKING CON USUARIOS Y FOTOS REALES DE GOOGLE
    async function loadGuildRanking() {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '';

        try {
            const snapshot = await db.collection('users').get();
            let index = 1;
            snapshot.forEach(doc => {
                const u = doc.data();
                const item = document.createElement('div');
                item.className = 'ranking-item';
                item.innerHTML = `
                    <div class="ranking-user-info">
                        <span class="ranking-xp">#${index}</span>
                        <img src="${u.photoURL || 'https://via.placeholder.com/40'}" class="ranking-avatar" alt="User">
                        <div>
                            <strong>${u.displayName || 'Aventurero'}</strong>
                            <div style="font-size:0.8rem; color: var(--text-muted);">${u.email}</div>
                        </div>
                    </div>
                    <span class="ranking-xp">1,250 XP</span>
                `;
                rankingList.appendChild(item);
                index++;
            });
        } catch (err) {
            console.error("Error ranking:", err);
        }
    }

    // 6. CHAT GLOBAL ENTRE JUGADORES
    btnChatToggle.addEventListener('click', () => chatDrawer.classList.toggle('hidden'));
    btnCloseChat.addEventListener('click', () => chatDrawer.classList.add('hidden'));

    db.collection('global_chat').orderBy('timestamp', 'asc').limitToLast(30).onSnapshot(snapshot => {
        chatMessages.innerHTML = '';
        document.getElementById('chat-count').innerText = snapshot.size;
        snapshot.forEach(doc => {
            const msg = doc.data();
            const row = document.createElement('div');
            row.className = 'chat-msg-row';
            row.innerHTML = `
                <img src="${msg.photoURL || 'https://via.placeholder.com/28'}" class="chat-msg-avatar">
                <div class="chat-msg-body">
                    <div class="msg-user-name">${msg.userName}</div>
                    <div class="msg-bubble">${msg.text}</div>
                </div>
            `;
            chatMessages.appendChild(row);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text || !currentUser) return;

        await db.collection('global_chat').add({
            userName: currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Aventurero',
            photoURL: currentUser.photoURL,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        chatInput.value = '';
    });

    // Cambios de Pestañas
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