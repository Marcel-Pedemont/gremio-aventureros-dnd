// CONFIGURACIÓN DE FIREBASE
// Reemplaza estos valores con los de tu consola de Firebase (https://console.firebase.google.com/)
// CONFIGURACIÓN REAL DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCcUdHUP-2jeOwMohDxMJwY00Lm2I8SxEU",
    authDomain: "gremio-aventureros-dnd.firebaseapp.com",
    projectId: "gremio-aventureros-dnd",
    storageBucket: "gremio-aventureros-dnd.firebasestorage.app",
    messagingSenderId: "114422855181",
    appId: "1:114422855181:web:38e2e11fe82a36952d8744",
    measurementId: "G-WKVS37B8J7"
};

// Inicializar Firebase y el proveedor de Google
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Vistas y Botones
    const btnEnter = document.getElementById('btn-enter-multiverse');
    const btnBackHero = document.getElementById('btn-back-hero');
    const btnBackSlots = document.getElementById('btn-back-slots');
    
    const heroSection = document.getElementById('hero-landing');
    const slotsSection = document.getElementById('slots-section');
    const gameDashboard = document.getElementById('game-dashboard');
    const activeCampaignName = document.getElementById('active-campaign-name');
    const loginWarning = document.getElementById('login-warning');

    // Elementos Auth
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const userStatus = document.getElementById('user-status');
    const userAvatar = document.getElementById('user-avatar');
    const userDisplayName = document.getElementById('user-display-name');
    const userInfoDetail = document.getElementById('user-info-detail');

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // 1. ESCUCHADOR DE ESTADO DE AUTENTICACIÓN (Firebase)
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loginWarning.classList.add('hidden');
            btnGoogleLogin.classList.add('hidden');
            userStatus.classList.remove('hidden');

            userAvatar.src = user.photoURL || 'https://via.placeholder.com/24';
            userDisplayName.innerText = `${user.displayName ? user.displayName.split(' ')[0].toUpperCase() : 'JUGADOR'} (ONLINE)`;
            userInfoDetail.innerText = `Jugador: ${user.displayName} | Email: ${user.email}`;
        } else {
            currentUser = null;
            userStatus.classList.add('hidden');
            btnGoogleLogin.classList.remove('hidden');
            userInfoDetail.innerText = "Inicia sesión para ver los datos de tu héroe.";
        }
    });

    // 2. INICIAR SESIÓN CON GOOGLE (Ventana Emergent Pop-up)
    btnGoogleLogin.addEventListener('click', async () => {
        try {
            await auth.signInWithPopup(googleProvider);
        } catch (error) {
            console.error("Error en la autenticación con Google:", error);
            alert("No se pudo completar el inicio de sesión.");
        }
    });

    // 3. CERRAR SESIÓN (Haciendo clic en la barra ONLINE)
    userStatus.addEventListener('click', async () => {
        if (confirm("¿Quieres cerrar la sesión de tu aventurero?")) {
            await auth.signOut();
            // Si estaba en los slots o juego, vuelve a la portada
            gameDashboard.classList.replace('active', 'hidden');
            slotsSection.classList.replace('active', 'hidden');
            heroSection.classList.replace('hidden', 'active');
        }
    });

    // 4. VALIDACIÓN AL PRESIONAR "INICIAR TU AVENTURA"
    btnEnter.addEventListener('click', () => {
        if (!currentUser) {
            // Si no está logueado, se bloquea y muestra advertencia con animación
            loginWarning.classList.remove('hidden');
            btnGoogleLogin.classList.add('pulse-glow');
            setTimeout(() => btnGoogleLogin.classList.remove('pulse-glow'), 1500);
            return;
        }

        // Si está logueado, avanza a los slots
        heroSection.classList.replace('active', 'hidden');
        slotsSection.classList.replace('hidden', 'active');
    });

    // 5. NAVEGACIÓN ENTRE VISTAS Y TABS
    btnBackHero.addEventListener('click', () => {
        slotsSection.classList.replace('active', 'hidden');
        heroSection.classList.replace('hidden', 'active');
    });

    const slotBtns = document.querySelectorAll('.btn-slot');
    slotBtns.forEach(btn => {
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