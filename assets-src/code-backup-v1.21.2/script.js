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

window.refreshProgressUI = function() {
    if (!SofiApp.progress) return;
    const globalText = document.getElementById('global-stars-text');
    if (globalText) globalText.innerText = SofiApp.progress.state.stars;
    
    const collectionText = document.getElementById('collection-stars-text');
    if (collectionText) collectionText.innerText = SofiApp.progress.state.stars;
    
    // Update stickers grid
    const grid = document.getElementById('stickers-grid');
    if (grid) {
        grid.innerHTML = '';
        Object.keys(SofiApp.progress.stickersConfig).forEach(id => {
            const config = SofiApp.progress.stickersConfig[id];
            const isUnlocked = SofiApp.progress.state.stickers.includes(id);
            
            const card = document.createElement('div');
            card.className = isUnlocked ? 'collection-card collection-card--unlocked' : 'collection-card collection-card--locked';
            
            if (isUnlocked) {
                const stickerVisual = config.asset
                    ? `<img src="${config.asset}" alt="" aria-hidden="true" class="collection-card__icon-image">`
                    : `<div class="collection-card__emoji">${config.emoji}</div>`;
                card.innerHTML = `
                    ${stickerVisual}
                    <div style="font-size: 1rem; font-weight: bold; margin-top: 5px; color: var(--color-text);">${config.name}</div>
                `;
                card.addEventListener('click', () => {
                    SofiApp.audio.tap();
                    card.classList.add('is-popped'); setTimeout(() => card.classList.remove('is-popped'), 220);
                });
            } else {
                card.innerHTML = `<div style="font-size: 3rem; opacity: 0.3;">❓</div>`;
            }
            grid.appendChild(card);
        });
    }
};

SofiApp.navigation.registerView('collection', {
    onEnter: () => {
        refreshProgressUI();
    },
    onExit: () => {}
});

// --- VISTAS GLOBALES ---
const endScreen2 = document.getElementById('end-screen-2');
const restartBtn2 = document.getElementById('restart-btn-2');
const drawingSelectorContainer = document.getElementById('drawing-selector-container');
const drawingOptions = document.getElementById('drawing-options');

SofiApp.navigation.registerView('drawing-selector', {
    onEnter: () => {
        drawingOptions.innerHTML = '';
        for (const [key, drawing] of Object.entries(gameDrawings)) {
            const btn = document.createElement('button');
            btn.className = 'drawing-card ui-pressable';
            btn.setAttribute('aria-label', `Pintar ${drawing.title}`);
            
            let previewHtml = '';
            if (drawing.originalImage) {
                previewHtml = `<img src="${drawing.originalImage}" alt="" class="drawing-card__image">`;
            } else {
                previewHtml = `<span class="card-icon" style="pointer-events:none;">${drawing.icon}</span>`;
            }
            
            btn.innerHTML = `
                <div class="card-decor">✨</div>
                ${previewHtml}
                <span class="card-text" style="pointer-events:none;">${drawing.title.toUpperCase()}</span>
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
        if (window.game2Instance) {
            window.game2Instance.destroy(true);
            window.game2Instance = null;
        }
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
