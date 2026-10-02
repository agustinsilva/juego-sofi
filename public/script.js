// --- DOM ELEMENTS ---
const menuContainer = document.getElementById('menu-container');
const game1Container = document.getElementById('game1-container');
const game2Container = document.getElementById('game2-container');
const game3Container = document.getElementById('game3-container');
const game4Container = document.getElementById('game4-container');
const homeBtn = document.getElementById('home-btn');

const btnGame1 = document.getElementById('btn-game1');
const btnGame2 = document.getElementById('btn-game2');
const btnGame3 = document.getElementById('btn-game3');
const btnGame4 = document.getElementById('btn-game4');

// --- SISTEMA DE AUDIO COMPATIBILIDAD ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
if (window.SofiApp) {
    SofiApp.audio.init(audioCtx);
}

// Wrappers de compatibilidad para código que aún los usa
function playSuccessSound() { SofiApp.audio.success(); }
function playErrorSound() { SofiApp.audio.softError(); }
function playVictorySpeech(mensaje) { SofiApp.audio.speak(mensaje || "¡Felicidades Sofi, has ganado!"); }
function playMenuSelectSound() { SofiApp.audio.tap(); }

// --- NAVEGACIÓN COMPATIBILIDAD ---
window.showMenu = function() {
    SofiApp.navigation.goHome();
};

function showDrawingSelector() {
    SofiApp.navigation.goTo('drawing-selector');
}

if (btnGame2) btnGame2.addEventListener('click', showDrawingSelector);
if (homeBtn) {
    // SofiApp registra el suyo en app-core.js, pero por si acaso lo removemos aquí
    // El listener en script.js viejo ya no es necesario
}

const btnCollection = document.getElementById('btn-collection');
if (btnCollection) {
    btnCollection.addEventListener('click', () => {
        SofiApp.navigation.goTo('collection');
    });
}

// Contador de estrellas del Home. Mis Cosas se dibuja aparte (collection.js).
window.refreshHomeProgress = function() {
    if (!SofiApp.progress) return;
    const globalText = document.getElementById('global-stars-text');
    if (globalText) globalText.innerText = SofiApp.progress.state.stars;
};

// Wrapper compatible: app-core (awardStar y el bootstrap) llama a refreshProgressUI por nombre.
// Mis Cosas solo se reconstruye si es la vista activa; si no, se dibuja al entrar (onEnter en collection.js).
window.refreshProgressUI = function() {
    window.refreshHomeProgress();
    if (SofiApp.state.currentView === 'collection' && typeof window.renderCollection === 'function') {
        window.renderCollection();
    }
};

// --- VISTAS GLOBALES ---
const endScreen2 = document.getElementById('end-screen-2');
const restartBtn2 = document.getElementById('restart-btn-2');
const drawingSelectorContainer = document.getElementById('drawing-selector-container');
const drawingOptions = document.getElementById('drawing-options');

SofiApp.navigation.registerView('drawing-selector', {
    onEnter: () => {
        drawingOptions.innerHTML = '';
        for (const [key, drawing] of Object.entries(gameDrawings)) {
            // 8D.3E: un dibujo terminado lleva una ⭐ chica en la esquina. Sale solo del evento painting-<id>
            // (no de las regiones pintadas, de Artista ni de las estrellas): un dibujo a medias no la lleva.
            const events = (SofiApp.progress && SofiApp.progress.state && SofiApp.progress.state.events) || [];
            const completed = events.includes(`painting-${key}`);
            const btn = document.createElement('button');
            btn.className = 'drawing-card ui-pressable';
            btn.setAttribute('aria-label', `Pintar ${drawing.title}${completed ? ', ya lo terminaste' : ''}`);
            if (completed) btn.style.position = 'relative';
            
            let previewHtml = '';
            if (drawing.originalImage) {
                previewHtml = `<img src="${drawing.originalImage}" alt="" class="drawing-card__image">`;
            } else {
                previewHtml = `<span class="card-icon" style="pointer-events:none;">${drawing.icon}</span>`;
            }
            
            const doneMarker = completed
                ? '<img src="/assets/icons/shared/icon-star.webp" alt="" aria-hidden="true" class="drawing-card__done" width="34" height="34" style="position:absolute;top:6px;right:6px;width:34px;height:34px;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25));">'
                : '';
            btn.innerHTML = `
                <div class="card-decor">✨</div>
                ${previewHtml}
                <span class="card-text" style="pointer-events:none;">${drawing.title.toUpperCase()}</span>
                ${doneMarker}
            `;
            
            btn.addEventListener('click', (e) => {
                SofiApp.audio.tap();
                btn.classList.add('is-selected');
                setTimeout(() => loadDrawing(key), 300);
            });
            drawingOptions.appendChild(btn);
        }
    }
});

SofiApp.navigation.registerView('game2', {
    onEnter: (options) => {
        endScreen2.classList.add('hidden');
        if (window.initGame2Phaser) {
            window.initGame2Phaser(options.drawingId);
        }
    },
    onExit: () => {
        // game2Instance es un `let` de game2.js (no está en window): se destruye desde allí.
        if (window.destroyGame2Phaser) window.destroyGame2Phaser();
    }
});

function loadDrawing(drawingId) {
    SofiApp.navigation.goTo('game2', { drawingId });
}

function showEndScreen2() {
    endScreen2.classList.remove('hidden');
    SofiApp.feedback.celebrate();
}

if (restartBtn2) restartBtn2.addEventListener('click', showDrawingSelector);

// Inicializar la app
SofiApp.navigation.goTo('menu', { silent: true });
