// game4.js - JUEGO 4: MI GATITO (Phaser Version)

// btnGame4 y game4Container ya están declarados en script.js
const adoptionScreen = document.getElementById('adoption-screen');
const adoptBtns = document.querySelectorAll('.adopt-btn');
const catNameDisplay = document.getElementById('cat-name-display');

const bars = {
    hambre: document.getElementById('bar-hambre'),
    sed: document.getElementById('bar-sed'),
    energia: document.getElementById('bar-energia'),
    limpieza: document.getElementById('bar-limpieza'),
    diversion: document.getElementById('bar-diversion')
};

// --- ESTADO DEL GATITO ---
let catState = {
    adopted: false,
    emoji: '🐱',
    name: 'Mi Gatito',
    hambre: 100,
    sed: 100,
    energia: 100,
    limpieza: 100,
    diversion: 100,
    lastUpdate: Date.now()
};

let decayInterval = null;
let catGameInstance = null;

const CAT_MEMORIES = [
    { id: 'first-love', emoji: '❤️', assetKey: 'shared-heart', title: 'Mimos', description: '¡Nos dimos mucho cariño!' },
    { id: 'first-meal', emoji: '🍽️', title: 'Comida', description: 'Comimos juntos por primera vez.' },
    { id: 'first-play', emoji: '🧶', title: 'Juegos', description: '¡Nos divertimos mucho jugando!' },
    { id: 'first-bath', emoji: '🛁', title: 'Baño', description: '¡Quedamos muy limpios!' },
    { id: 'first-sleep', emoji: '🌙', title: 'A dormir', description: 'Dulces sueños, gatito.' },
    { id: 'butterfly', emoji: '🦋', title: 'Mariposa', description: 'Vimos una mariposa en el jardín.' },
    { id: 'bird', emoji: '🐦', title: 'Pajarito', description: 'Saludamos a un pajarito.' },
    { id: 'ladybug', emoji: '🐞', title: 'Mariquita', description: '¡Una mariquita roja!' },
    { id: 'firefly', emoji: '✨', title: 'Luciérnaga', description: 'Luz brillante en la noche.' },
    { id: 'box-surprise', emoji: '📦', title: 'Sorpresa', description: '¡Algo saltó de la caja!' },
    { id: 'moon-window', emoji: '🪟', title: 'La luna', description: 'Miramos la noche juntos.' },
    { id: 'happy-together', emoji: '🥰', title: 'Muy felices', description: '¡Un momento perfecto juntos!' },
    { id: 'favorite-food', emoji: '🍗', title: 'Comida favorita', description: 'Descubrimos lo que le gusta comer.' },
    { id: 'favorite-toy', emoji: '⚽', title: 'Juguete favorito', description: 'Descubrimos su juego favorito.' },
    { id: 'favorite-zone', emoji: '🌿', title: 'Lugar favorito', description: 'Descubrimos dónde le gusta estar.' }
];

function unlockCatMemory(memoryId) {
    if (!catState.memories) return false;
    
    const memoryDef = CAT_MEMORIES.find(m => m.id === memoryId);
    if (!memoryDef) {
        console.warn('Invalid memory ID:', memoryId);
        return false;
    }
    
    if (catState.memories.unlocked[memoryId]) {
        return false;
    }
    
    catState.memories.unlocked[memoryId] = true;
    catState.memories.firstUnlockedAt[memoryId] = Date.now();
    saveCatState();
    
    if (typeof catGameInstance !== 'undefined' && catGameInstance) {
        const scene = catGameInstance.scene.scenes[0];
        if (scene && typeof scene.showMemoryToast === 'function') {
            scene.showMemoryToast(memoryDef.emoji);
        }
    }
    
    return true;
}

// --- PERSISTENCIA ---
function saveCatState() {
    catState.lastUpdate = Date.now();
    localStorage.setItem('juegosSofi_gatito', JSON.stringify(catState));
}

function loadCatState() {
    const saved = localStorage.getItem('juegosSofi_gatito');
    if (saved) {
        try {
            catState = JSON.parse(saved);
        } catch (e) {
            console.error("Error loading cat state");
        }
    }
    
    catState.preferences = catState.preferences || {};
    catState.preferences.foodCounts = catState.preferences.foodCounts || {};
    catState.preferences.toyCounts = catState.preferences.toyCounts || {};
    catState.preferences.zoneCounts = catState.preferences.zoneCounts || {};
    catState.preferences.favoriteFood = catState.preferences.favoriteFood || null;
    catState.preferences.favoriteToy = catState.preferences.favoriteToy || null;
    catState.preferences.favoriteZone = catState.preferences.favoriteZone || null;
    
    catState.memories = catState.memories || {};
    catState.memories.unlocked = catState.memories.unlocked || {};
    catState.memories.firstUnlockedAt = catState.memories.firstUnlockedAt || {};
}

function applyTimeDecay() {
    const now = Date.now();
    const elapsed = now - catState.lastUpdate;
    const hoursElapsed = elapsed / 3600000;
    const decayAmount = Math.floor(hoursElapsed * 10);
    
    if (decayAmount > 0) {
        catState.hambre = Math.max(30, catState.hambre - decayAmount);
        catState.sed = Math.max(30, catState.sed - decayAmount);
        catState.energia = Math.max(30, catState.energia - decayAmount);
        catState.limpieza = Math.max(30, catState.limpieza - decayAmount);
        catState.diversion = Math.max(30, catState.diversion - decayAmount);
        saveCatState();
    }
}

function updateDOMBars() {
    bars.hambre.style.width = catState.hambre + '%';
    bars.sed.style.width = catState.sed + '%';
    bars.energia.style.width = catState.energia + '%';
    bars.limpieza.style.width = catState.limpieza + '%';
    bars.diversion.style.width = catState.diversion + '%';
}

function startDecay() {
    if (decayInterval) clearInterval(decayInterval);
    decayInterval = setInterval(() => {
        // En lugar de chequear isSleeping, bajamos stats muy lentamente si no están dormidos en Phaser
        // Pero lo simplificamos aquí
        if (Math.random() < 0.5) catState.hambre = Math.max(0, catState.hambre - 1);
        if (Math.random() < 0.5) catState.sed = Math.max(0, catState.sed - 1);
        if (Math.random() < 0.3) catState.limpieza = Math.max(0, catState.limpieza - 1);
        if (Math.random() < 0.4) catState.diversion = Math.max(0, catState.diversion - 1);
        catState.energia = Math.max(0, catState.energia - 1);
        
        updateDOMBars();
        saveCatState();
    }, 12000); // Pierde 1 punto cada pocos segundos mientras se juega
}


function recalculateFavorite(countsObj, currentFav) {
    let topItem = null;
    let topCount = 0;
    let secondCount = 0;
    
    for (const [item, count] of Object.entries(countsObj)) {
        if (count > topCount) {
            secondCount = topCount;
            topCount = count;
            topItem = item;
        } else if (count > secondCount) {
            secondCount = count;
        }
    }
    
    if (topCount >= 5 && (topCount - secondCount >= 2)) {
        return topItem;
    }
    return currentFav;
}

function recordPreference(type, id) {
    if (!catState.preferences) return;
    
    let changed = false;
    let newFav = null;
    
    if (type === 'food') {
        catState.preferences.foodCounts[id] = (catState.preferences.foodCounts[id] || 0) + 1;
        newFav = recalculateFavorite(catState.preferences.foodCounts, catState.preferences.favoriteFood);
        if (newFav !== catState.preferences.favoriteFood) {
            catState.preferences.favoriteFood = newFav;
            changed = true;
            unlockCatMemory("favorite-food");
        }
    } else if (type === 'toy') {
        catState.preferences.toyCounts[id] = (catState.preferences.toyCounts[id] || 0) + 1;
        newFav = recalculateFavorite(catState.preferences.toyCounts, catState.preferences.favoriteToy);
        if (newFav !== catState.preferences.favoriteToy) {
            catState.preferences.favoriteToy = newFav;
            changed = true;
            unlockCatMemory("favorite-toy");
        }
    } else if (type === 'zone') {
        catState.preferences.zoneCounts[id] = (catState.preferences.zoneCounts[id] || 0) + 1;
        newFav = recalculateFavorite(catState.preferences.zoneCounts, catState.preferences.favoriteZone);
        if (newFav !== catState.preferences.favoriteZone) {
            catState.preferences.favoriteZone = newFav;
            changed = true;
            unlockCatMemory("favorite-zone");
        }
    }
    
    if (changed && catGameInstance) {
        const scene = catGameInstance.scene.scenes[0];
        if (scene) {
            scene.showCatReaction('❤️', 2000);
            scene.speakCat("¡Creo que este es mi favorito!");
            scene.showParticles(scene.cat.x, scene.cat.y, '✨', 10);
        }
    }
    
    saveCatState();
}

// --- NAVEGACIÓN ---
if (btnGame4) {
    btnGame4.addEventListener('click', startGame4);
}

// (Legacy showMenu wrapper removed - app-core handles navigation now)
function startGame4() {
    SofiApp.navigation.goTo('game4');
}

// --- ADOPCIÓN ---
adoptBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const catEmoji = e.target.getAttribute('data-cat');
        catState.adopted = true;
        catState.emoji = catEmoji;
        catState.hambre = 100;
        catState.sed = 100;
        catState.energia = 100;
        catState.limpieza = 100;
        catState.diversion = 100;
        
        saveCatState();
        
        adoptionScreen.classList.add('hidden');
        if (typeof playSuccessSound === 'function') playSuccessSound();
        
        updateDOMBars();
        startDecay();
        initPhaser();
    });
});

function recordCatCareAction() {
    if (SofiApp.progress) {
        catState.totalActions = (catState.totalActions || 0) + 1;
        
        // Every 5 actions gives a star milestone
        if (catState.totalActions % 5 === 0) {
            SofiApp.progress.recordEvent(`cat-milestone-${catState.totalActions}`);
        }
        
        // At 15 actions, unlock 'amiga' sticker
        if (catState.totalActions === 15) {
            SofiApp.progress.unlockSticker('amiga');
        }
        saveCatState();
    }
}

// --- SONIDOS ---
function playCustomSound(type) {
    if (typeof audioCtx === 'undefined') return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'eat') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(900, audioCtx.currentTime + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.25);
        gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.15);
        gain2.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc2.start(audioCtx.currentTime + 0.15); osc2.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'drink') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'play' || type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'bath') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'sleep') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 1.5);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 2.0);
    } else if (type === 'pet' || type === 'purr') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    }
}

// =========================================
// PHASER ENGINE
// =========================================

function initPhaser() {
    if (catGameInstance) {
        catGameInstance.destroy(true);
    }
    
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 500,
        parent: 'cat-game-container',
        backgroundColor: '#e0f7fa',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [RoomScene]
    };

    catGameInstance = new Phaser.Game(config);
}

const WORLD_OBJECTS = [
    { id: 'flower', zone: 'garden', emoji: '🌸', x: 200, y: 380, interaction: 'flower' },
    { id: 'tree', zone: 'garden', emoji: '🌳', x: 600, y: 350, interaction: 'tree' },
    { id: 'mushroom', zone: 'garden', emoji: '🍄', x: 400, y: 400, interaction: 'mushroom' },
    { id: 'sunflower', zone: 'garden', emoji: '🌻', x: 750, y: 380, interaction: 'sunflower' },
    
    { id: 'ball', zone: 'playground', emoji: '⚽', x: 300, y: 420, interaction: 'ball' },
    { id: 'box', zone: 'playground', emoji: '📦', x: 600, y: 400, interaction: 'box' },
    { id: 'teddy', zone: 'playground', emoji: '🧸', x: 150, y: 400, interaction: 'teddy' },
    { id: 'balloon', zone: 'playground', emoji: '🎈', x: 700, y: 350, interaction: 'balloon' },
    
    { id: 'window', zone: 'room', emoji: '🪟', x: 500, y: 200, interaction: 'window' },
    { id: 'yarn_dec', zone: 'room', emoji: '🧶', x: 100, y: 460, interaction: 'yarn_dec' }
];

// Fondos ilustrados por zona (Fase 8C.1). Solo visuales: los objetos interactivos siguen siendo Phaser.
// night: overlay translúcido sobre el fondo diurno cuando isNight (misma regla horaria de buildZone).
const CAT_ZONE_BACKGROUNDS = {
    room: { key: 'cat-bg-room', path: '/assets/backgrounds/cat/cat-room.webp', night: { color: 0x1a237e, alpha: 0.28 } },
    garden: { key: 'cat-bg-garden', path: '/assets/backgrounds/cat/cat-garden.webp', night: { color: 0x1a237e, alpha: 0.30 } },
    playground: { key: 'cat-bg-playground', path: '/assets/backgrounds/cat/cat-playground.webp', night: { color: 0x4a2c6d, alpha: 0.24 } }
};

class RoomScene extends Phaser.Scene {
    constructor() {
        super('RoomScene');
        this.currentState = 'IDLE';
        this.currentZone = 'room';
        this.sessionState = {
            announcedNeeds: new Set(),
            lastIdleSoundAt: 0,
            lastNeedShownAt: 0,
            hasCelebratedAllHappy: false,
            lastInitiativeType: null,
            lastInitiativeTarget: null
        };
        this.initiativeState = {
            active: false,
            type: null,
            target: null,
            startedAt: 0,
            cooldownUntil: 0,
            timer: null
        };
        this.currentZoneVisit = null;
    }

    preload() {
        this.load.image('shared-heart', '/assets/icons/shared/icon-heart.webp');
        Object.values(CAT_ZONE_BACKGROUNDS).forEach(bg => this.load.image(bg.key, bg.path));
    }

    create() {
        catState.rugStyle = catState.rugStyle || 'blue';
        this.initiativeState.cooldownUntil = this.time.now + Phaser.Math.Between(10000, 15000);
        
        this.positions = {
            home: { x: 400, y: 350 },
            food: { x: 150, y: 400 },
            water: { x: 250, y: 420 },
            bed: { x: 650, y: 380 },
            toy: { x: 400, y: 450 },
            bath: { x: 700, y: 250 }
        };

        this.zoneContainer = this.add.container(0, 0);
        
        this.cat = this.add.text(this.positions.home.x, this.positions.home.y, catState.emoji, { fontSize: '120px' }).setOrigin(0.5);
        this.makeInteractive(this.cat, () => this.actionLove());
        
        this.hintBubble = this.add.text(this.cat.x, this.cat.y - 100, '', { fontSize: '40px' }).setOrigin(0.5).setAlpha(0);
        this.reactionBubble = this.add.text(this.cat.x + 50, this.cat.y - 80, '', { fontSize: '40px' }).setOrigin(0.5).setAlpha(0);
        
        this.navContainer = this.add.container(0, 0).setDepth(50);
        const navBg = this.add.rectangle(400, 30, 800, 60, 0xffffff, 0.5);
        const btnRoom = this.add.text(250, 30, '🏠', { fontSize: '40px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        const btnGarden = this.add.text(400, 30, '🌿', { fontSize: '40px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        const btnPlay = this.add.text(550, 30, '🎈', { fontSize: '40px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        const btnAlbum = this.add.text(700, 30, '📖', { fontSize: '40px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        
        btnRoom.on('pointerdown', () => this.switchZone('room'));
        btnGarden.on('pointerdown', () => this.switchZone('garden'));
        btnPlay.on('pointerdown', () => this.switchZone('playground'));
        btnAlbum.on('pointerdown', () => this.openMemoryAlbum());
        
        this.navContainer.add([navBg, btnRoom, btnGarden, btnPlay, btnAlbum]);

        this.input.on('pointerdown', (pointer, targets) => {
            if (targets.length > 0) return; 
            if (this.activeCareActivity) return; 
            if (pointer.y < 80) return; 

            this.freeWalkTo(pointer.x, pointer.y);
        });

        this.time.addEvent({
            delay: 6000,
            callback: this.idleBehavior,
            callbackScope: this,
            loop: true
        });
        
        this.events.once('shutdown', () => {
            this.clearTemporaryWorldObject();
            this.clearCatInitiative();
            if (this.currentZoneVisit && this.currentZoneVisit.timer) {
                this.currentZoneVisit.timer.remove();
                this.currentZoneVisit = null;
            }
            if (this.zoneAmbientTimer) {
                this.zoneAmbientTimer.remove();
                this.zoneAmbientTimer = null;
            }
        });
        
        this.buildZone(this.currentZone);
    }

    clearCatInitiative() {
        if (!this.initiativeState) return;

        if (this.initiativeState.timer) {
            this.initiativeState.timer.remove(false);
            this.initiativeState.timer = null;
        }

        this.initiativeState.active = false;
        this.initiativeState.type = null;
        this.initiativeState.target = null;
        this.initiativeState.startedAt = 0;
    }

    startSignificantZoneVisit(zoneKey) {
        if (this.currentZoneVisit && this.currentZoneVisit.timer) {
            this.currentZoneVisit.timer.remove();
        }

        this.currentZoneVisit = {
            zone: zoneKey,
            counted: false,
            timer: this.time.delayedCall(10000, () => this.recordSignificantZoneVisit())
        };
    }

    recordSignificantZoneVisit() {
        const visit = this.currentZoneVisit;
        if (!visit || visit.counted || visit.zone !== this.currentZone) return;

        visit.counted = true;
        if (visit.timer) {
            visit.timer.remove();
            visit.timer = null;
        }

        if (typeof recordPreference === 'function') recordPreference('zone', visit.zone);
    }

    switchZone(zoneKey) {
        if (this.isAlbumOpen) return;
        if (this.currentZone === zoneKey) return;
        if (this.currentState === 'WALKING' || this.currentState === 'SLEEPING' || this.currentState === 'MINIGAME') return;
        
        this.clearTemporaryWorldObject();
        this.clearCatInitiative();
        
        this.currentZone = zoneKey;
        this.startSignificantZoneVisit(zoneKey);
        
        this.cameras.main.fadeOut(200, 255, 255, 255);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.buildZone(this.currentZone);
            this.cat.setPosition(400, 400);
            this.cameras.main.fadeIn(200, 255, 255, 255);
            
            if (catState.preferences && catState.preferences.favoriteZone === zoneKey) {
                if (Math.random() < 0.4) {
                    this.time.delayedCall(500, () => {
                        this.showCatReaction('❤️');
                        if (window.SofiApp && SofiApp.audio) SofiApp.audio.success();
                    });
                }
            }
        });
    }

    buildZone(zoneKey) {
        if (this.zoneContainer) this.zoneContainer.removeAll(true);
        if (this.zoneAmbientTimer) {
            this.zoneAmbientTimer.remove();
            this.zoneAmbientTimer = null;
        }

        const hr = new Date().getHours();
        const isNight = hr >= 18 || hr < 6;

        // Primer hijo de zoneContainer: queda debajo de todo. Si la textura no cargó, se usa el escenario legacy.
        const hasBackground = this.addZoneBackground(zoneKey, isNight);

        let skyColor = 0xe0f7fa;
        let floorColor = 0x81c784;

        if (zoneKey === 'room') {
            skyColor = isNight ? 0x283593 : 0xe0f7fa;
            floorColor = 0xffcc80;
            this.cameras.main.setBackgroundColor(skyColor);

            if (!hasBackground) this.zoneContainer.add(this.add.rectangle(400, 480, 800, 240, floorColor));
            
            let rugHex = 0x64b5f6; 
            if (catState.rugStyle === 'pink') rugHex = 0xf48fb1;
            else if (catState.rugStyle === 'yellow') rugHex = 0xfff59d;
            
            const rug = this.add.ellipse(this.positions.home.x, 420, 300, 100, rugHex);
            this.makeInteractive(rug, () => {
                if (catState.rugStyle === 'blue') catState.rugStyle = 'pink';
                else if (catState.rugStyle === 'pink') catState.rugStyle = 'yellow';
                else catState.rugStyle = 'blue';
                saveCatState();
                this.buildZone('room');
            });
            this.zoneContainer.add(rug);
            
            this.zoneContainer.add(this.add.rectangle(200, 150, 150, 200, isNight ? 0x1a237e : 0x4fc3f7));
            this.zoneContainer.add(this.add.rectangle(200, 150, 150, 200, 0xffffff).setStrokeStyle(10, 0xffffff).setFillStyle());
            this.zoneContainer.add(this.add.text(170, 80, isNight ? '🌙' : '☀️', { fontSize: '40px' }));
            
            this.bed = this.add.text(this.positions.bed.x, this.positions.bed.y, '🛏️', { fontSize: '100px' }).setOrigin(0.5);
            this.makeInteractive(this.bed, () => this.actionSleep());
            
            this.foodBowl = this.add.text(this.positions.food.x, this.positions.food.y, '🥣', { fontSize: '70px' }).setOrigin(0.5);
            this.makeInteractive(this.foodBowl, () => this.actionEat());
            
            this.waterBowl = this.add.text(this.positions.water.x, this.positions.water.y, '💧', { fontSize: '50px' }).setOrigin(0.5);
            this.makeInteractive(this.waterBowl, () => this.actionDrink());
            
            this.toyObj = this.add.text(this.positions.toy.x, this.positions.toy.y, '🧶', { fontSize: '60px' }).setOrigin(0.5);
            this.makeInteractive(this.toyObj, () => this.actionPlay());
            
            this.bathObj = this.add.text(this.positions.bath.x, this.positions.bath.y, '🛁', { fontSize: '80px' }).setOrigin(0.5);
            this.makeInteractive(this.bathObj, () => this.actionBath());
            
            this.zoneContainer.add([this.bed, this.foodBowl, this.waterBowl, this.toyObj, this.bathObj]);
            
        } else if (zoneKey === 'garden') {
            skyColor = isNight ? 0x1a237e : 0x81d4fa;
            floorColor = isNight ? 0x388e3c : 0x81c784;
            this.cameras.main.setBackgroundColor(skyColor);

            if (!hasBackground) this.zoneContainer.add(this.add.rectangle(400, 480, 800, 240, floorColor));
            
            if (isNight) {
                this.zoneContainer.add(this.add.text(700, 100, '🌙', {fontSize:'60px'}).setOrigin(0.5));
                this.zoneContainer.add(this.add.text(200, 80, '⭐', {fontSize:'30px'}).setOrigin(0.5));
                this.zoneContainer.add(this.add.text(500, 150, '⭐', {fontSize:'20px'}).setOrigin(0.5));
            } else {
                this.zoneContainer.add(this.add.text(100, 100, '☀️', {fontSize:'60px'}).setOrigin(0.5));
            }
            
            WORLD_OBJECTS.filter(o => o.zone === 'garden').forEach(o => this.buildWorldObject(o));
            
            this.zoneAmbientTimer = this.time.addEvent({
                delay: 20000,
                callback: () => {
                    const rnd = Math.random();
                    if (rnd < 0.3) {
                        this.showParticles(Phaser.Math.Between(200,600), 200, '🦋', 1);
                    } else if (rnd < 0.6) {
                        this.showParticles(Phaser.Math.Between(200,600), 200, '🍃', 1);
                    } else {
                        const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;
                        if (isNight) {
                            this.spawnTemporaryWorldObject({ id: 'firefly', zone: 'garden', emoji: '✨', x: Phaser.Math.Between(200,600), y: 300, interaction: 'ladybug' }, 6000);
                        } else {
                            this.spawnTemporaryWorldObject({ id: 'ladybug_temp', zone: 'garden', emoji: '🐞', x: Phaser.Math.Between(200,600), y: 400, interaction: 'ladybug' }, 6000);
                        }
                    }
                },
                loop: true
            });
            
        } else if (zoneKey === 'playground') {
            skyColor = isNight ? 0xffcc80 : 0xffecb3; 
            floorColor = isNight ? 0x8d6e63 : 0xbcaaa4;
            this.cameras.main.setBackgroundColor(skyColor);

            if (!hasBackground) this.zoneContainer.add(this.add.rectangle(400, 480, 800, 240, floorColor));
            
            WORLD_OBJECTS.filter(o => o.zone === 'playground').forEach(o => this.buildWorldObject(o));
            
            this.zoneAmbientTimer = this.time.addEvent({
                delay: 25000,
                callback: () => {
                    if (Math.random() < 0.5) {
                        this.showParticles(Phaser.Math.Between(200,600), 100, '✨', 2);
                    } else {
                        this.spawnTemporaryWorldObject({ id: 'feather_temp', zone: 'playground', emoji: '🪶', x: Phaser.Math.Between(200,600), y: 350, interaction: 'ladybug' }, 8000);
                    }
                },
                loop: true
            });
        }
    }

    addZoneBackground(zoneKey, isNight) {
        const bg = CAT_ZONE_BACKGROUNDS[zoneKey];
        if (!bg || !this.textures.exists(bg.key)) return false;

        // NO interactivos: freeWalkTo depende de que tocar un espacio vacío no produzca targets.
        const image = this.add.image(0, 0, bg.key).setOrigin(0, 0).setDisplaySize(800, 500);
        this.zoneContainer.add(image);
        if (isNight && bg.night) {
            this.zoneContainer.add(this.add.rectangle(400, 250, 800, 500, bg.night.color, bg.night.alpha));
        }
        return true;
    }

    buildWorldObject(cfg) {
        const obj = this.add.text(cfg.x, cfg.y, cfg.emoji, { fontSize: '80px' }).setOrigin(0.5);
        this.makeInteractive(obj, () => this.interactWithWorldObject(cfg, obj));
        this.zoneContainer.add(obj);
    }

    
    getPrimaryNeed() {
        if (catState.energia < 30) return 'energy';
        if (catState.hambre < 30) return 'hunger';
        if (catState.sed < 30) return 'thirst';
        if (catState.limpieza < 30) return 'cleanliness';
        if (catState.diversion < 30) return 'fun';
        return null;
    }

    getCatMood() {
        const primary = this.getPrimaryNeed();
        if (primary === 'energy') return 'TIRED';
        if (primary === 'hunger') return 'HUNGRY';
        if (primary === 'thirst') return 'THIRSTY';
        if (primary === 'cleanliness') return 'DIRTY';
        if (primary === 'fun') return 'BORED';
        
        const avg = (catState.hambre + catState.sed + catState.energia + catState.limpieza + catState.diversion) / 5;
        if (avg >= 80) return 'VERY_HAPPY';
        if (avg >= 60) return 'HAPPY';
        return 'CONTENT';
    }

    speakCat(text) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.rate = 0.9;
        ut.pitch = 1.1;
        
        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es-AR')) || voices.find(v => v.lang.startsWith('es'));
        if (esVoice) {
            ut.voice = esVoice;
            ut.lang = esVoice.lang;
        } else {
            ut.lang = 'es-ES';
        }
        window.speechSynthesis.speak(ut);
    }

    reactTo(event) {
        this.tweens.killTweensOf(this.reactionBubble);
        this.reactionBubble.setAlpha(0);
        
        if (event === 'eat-complete') {
            this.showCatReaction('😋');
            this.tweens.add({ targets: this.cat, scaleX: 1.1, scaleY: 0.9, duration: 150, yoyo: true, repeat: 1 });
            this.sessionState.announcedNeeds.delete('hunger');
        } else if (event === 'play-complete') {
            this.showCatReaction('😻');
            this.tweens.add({ targets: this.cat, angle: {from: -15, to: 15}, duration: 150, yoyo: true, repeat: 2 });
            this.sessionState.announcedNeeds.delete('fun');
        } else if (event === 'bath-complete') {
            this.showCatReaction('✨');
            this.tweens.add({ targets: this.cat, angle: {from: -5, to: 5}, x: this.cat.x + 5, duration: 50, yoyo: true, repeat: 6 });
            this.sessionState.announcedNeeds.delete('cleanliness');
        } else if (event === 'drink-complete') {
            this.showCatReaction('😸');
            this.tweens.add({ targets: this.cat, scaleY: 1.1, duration: 150, yoyo: true });
            this.sessionState.announcedNeeds.delete('thirst');
        } else if (event === 'wake') {
            this.showCatReaction('☀️');
            this.tweens.add({ targets: this.cat, scaleY: 1.15, duration: 300, yoyo: true });
            playCustomSound('pet');
            this.sessionState.announcedNeeds.delete('energy');
        } else if (event === 'love') {
            const emojis = ['❤️', '💕', '😻', '✨'];
            this.showCatReaction(Phaser.Math.RND.pick(emojis));
            this.tweens.add({ targets: this.cat, scaleX: 1.15, scaleY: 1.15, duration: 200, yoyo: true, repeat: 1 });
        }
    }

    showCatReaction(emoji, duration = 1500) {
        this.tweens.killTweensOf(this.reactionBubble);
        this.reactionBubble.setText(emoji);
        this.reactionBubble.setPosition(this.cat.x + 50, this.cat.y - 80);
        this.reactionBubble.setAlpha(0);
        this.tweens.add({
            targets: this.reactionBubble,
            alpha: 1,
            y: this.cat.y - 100,
            duration: 300,
            yoyo: true,
            hold: duration
        });
    }

    makeInteractive(obj, callback) {
        obj.setInteractive({ useHandCursor: true });
        obj.on('pointerdown', () => {
            if (this.currentState !== 'IDLE' && this.currentState !== 'SLEEPING') return; 
            if (this.currentState === 'SLEEPING' && obj !== this.cat && obj !== this.bed) return;
            
            this.tweens.add({
                targets: obj,
                scale: 1.15,
                duration: 100,
                yoyo: true,
                onComplete: callback
            });
        });
    }

isCatVeryHappy() {
        return catState.hambre >= 80 && catState.sed >= 80 && catState.energia >= 80 && catState.limpieza >= 80 && catState.diversion >= 80;
    }

    checkHappyTogetherMemory() {
        if (!this.isCatVeryHappy()) return;
        unlockCatMemory('happy-together');
    }

    idleBehavior() {
        if (this.currentState !== 'IDLE') return;
        
        const now = this.time.now;
        const mood = this.getCatMood();
        const need = this.getPrimaryNeed();
        
        const canShowNeed = (now - this.sessionState.lastNeedShownAt) > 8000;
        const canPlaySound = (now - this.sessionState.lastIdleSoundAt) > 15000;
        
        if (need && canShowNeed) {
            this.sessionState.lastNeedShownAt = now;
            let emoji = '';
            let targetKey = '';
            let speechText = '';
            
            if (need === 'energy') { emoji = '🥱'; targetKey = 'bed'; speechText = 'El gatito tiene sueño.'; }
            else if (need === 'hunger') { emoji = '🍗'; targetKey = 'food'; speechText = 'El gatito tiene hambre.'; }
            else if (need === 'thirst') { emoji = '💧'; targetKey = 'water'; speechText = 'El gatito tiene sed.'; }
            else if (need === 'cleanliness') { emoji = '🧼'; targetKey = 'bath'; speechText = 'El gatito necesita un baño.'; }
            else if (need === 'fun') { emoji = '🧶'; targetKey = 'toy'; speechText = 'El gatito quiere jugar.'; }
            
            if (this.currentZone === 'room' && targetKey) {
                const target = this.positions[targetKey];
                this.cat.flipX = (target.x < this.cat.x);
                this.showHint(emoji);
            } else {
                this.showHint(emoji + '🏠');
            }
            if (canPlaySound) {
                playCustomSound('meow');
                this.sessionState.lastIdleSoundAt = now;
            }
            
            if (!this.sessionState.announcedNeeds.has(need)) {
                this.speakCat(speechText);
                this.sessionState.announcedNeeds.add(need);
            }
            return;
        }

        if (Math.random() < 0.5) return; 
        
        // Idle invitation for favorite object
        if (Math.random() < 0.2) {
            if (this.currentZone === catState.preferences?.favoriteZone) {
                if (catState.preferences.favoriteToy === '⚽' && this.currentZone === 'playground') {
                    this.showHint('⚽?');
                    return;
                } else if (this.currentZone === 'garden') {
                    this.showHint('🌸?');
                    return;
                }
            }
        }
        
        if (mood === 'VERY_HAPPY' || mood === 'HAPPY') {
            this.checkHappyTogetherMemory();
            if (Math.random() < 0.5) {
                this.tweens.add({ targets: this.cat, y: this.cat.y - 20, duration: 200, yoyo: true });
            } else {
                this.showCatReaction('❤️', 1000);
            }
        } else if (mood === 'CONTENT') {
            this.tweens.add({ targets: this.cat, angle: 5, duration: 200, yoyo: true, repeat: 1 });
        } else if (mood === 'TIRED') {
            this.tweens.add({ targets: this.cat, scaleY: 0.95, duration: 400, yoyo: true });
        } else if (mood === 'HUNGRY' || mood === 'THIRSTY' || mood === 'DIRTY' || mood === 'BORED') {
            this.showCatReaction('🥺', 1000);
        }
    }

    showHint(emoji) {
        this.tweens.killTweensOf(this.hintBubble);
        this.hintBubble.setText(emoji);
        this.hintBubble.setPosition(this.cat.x, this.cat.y - 100);
        this.hintBubble.setAlpha(0);
        this.tweens.add({
            targets: this.hintBubble,
            alpha: 1,
            y: this.cat.y - 120,
            duration: 500,
            yoyo: true,
            hold: 1500
        });
    }

    freeWalkTo(x, y) {
        if (this.isAlbumOpen) return;
        if (this.currentState !== 'IDLE') return;
        
        let bounds = { minX: 100, maxX: 700, minY: 320, maxY: 480 };
        const targetX = Phaser.Math.Clamp(x, bounds.minX, bounds.maxX);
        const targetY = Phaser.Math.Clamp(y, bounds.minY, bounds.maxY);
        
        this.moveCatToPosition(targetX, targetY, () => {
            this.currentState = 'IDLE';
        });
    }

    moveCatTo(targetKey, onComplete) {
        if (this.currentZone !== 'room') return; 
        const target = this.positions[targetKey];
        this.moveCatToPosition(target.x, target.y, onComplete);
    }
    
    moveCatToPosition(targetX, targetY, onComplete) {
        if (this.currentState === 'SLEEPING' || this.currentState === 'MINIGAME') return;
        
        this.currentState = 'WALKING';
        this.cat.flipX = (targetX < this.cat.x);
        
        const walkAnim = this.tweens.add({
            targets: this.cat,
            angle: { from: -10, to: 10 },
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        const dist = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, targetX, targetY);
        
        this.tweens.add({
            targets: this.cat,
            x: targetX,
            y: targetY,
            duration: dist * 3, 
            onComplete: () => {
                walkAnim.stop();
                this.cat.angle = 0;
                if (onComplete) onComplete();
            }
        });
    }

    interactWithWorldObject(cfg, objText) {
        if (this.isAlbumOpen) return;
        if (this.currentState !== 'IDLE') return;
        
        if (this.initiativeState && this.initiativeState.active) {
            this.clearCatInitiative();
        }
        
        if (this.currentZoneVisit && !this.currentZoneVisit.counted && this.currentZoneVisit.zone === this.currentZone) {
            this.recordSignificantZoneVisit();
        }
        
        const now = Date.now();
        this.sessionState.objectCooldowns = this.sessionState.objectCooldowns || {};
        if (this.sessionState.objectCooldowns[cfg.id] && (now - this.sessionState.objectCooldowns[cfg.id] < 3000)) {
            return; // Cooldown to prevent spam
        }
        this.sessionState.objectCooldowns[cfg.id] = now;
        
        this.moveCatToPosition(cfg.x + (cfg.x < 400 ? 50 : -50), cfg.y + 20, () => {
            this.currentState = 'IDLE';
            
            this.cat.flipX = (cfg.x < this.cat.x);
            
            if (cfg.interaction === 'flower') {
                this.tweens.add({targets: objText, scale: 1.2, duration: 150, yoyo: true});
                this.showParticles(cfg.x, cfg.y - 50, '🦋', 1);
                this.showCatReaction('😻');
            } else if (cfg.interaction === 'tree') {
                this.tweens.add({targets: objText, angle: {from: -5, to: 5}, duration: 100, yoyo: true, repeat: 2});
                this.showParticles(cfg.x, cfg.y - 80, '🍃', 2);
            } else if (cfg.interaction === 'ball') {
                this.tweens.add({targets: objText, x: cfg.x + 30, angle: 180, duration: 300, yoyo: true});
                this.tweens.add({targets: this.cat, y: this.cat.y - 20, duration: 150, yoyo: true});
                this.showParticles(this.cat.x, this.cat.y - 50, '✨', 1);
            } else if (cfg.interaction === 'box') {
                this.tweens.add({targets: objText, scale: 1.1, duration: 100, yoyo: true});
                const rnd = Math.random();
                if (rnd < 0.3) this.showParticles(cfg.x, cfg.y - 40, '🐾', 1);
                else if (rnd < 0.6) this.showParticles(cfg.x, cfg.y - 40, '✨', 1);
                else this.showCatReaction('❓', 1000);
            } else if (cfg.interaction === 'teddy') {
                this.tweens.add({targets: objText, scale: 1.15, duration: 200, yoyo: true});
                this.showCatReaction('❤️');
            } else if (cfg.interaction === 'mushroom') {
                this.tweens.add({targets: objText, scaleY: 1.2, duration: 150, yoyo: true});
                if (Math.random() < 0.2) this.showParticles(cfg.x, cfg.y - 40, '✨', 2);
                else this.showCatReaction('😸', 1000);
            } else if (cfg.interaction === 'sunflower') {
                this.tweens.add({targets: objText, angle: {from:-5, to:5}, duration: 200, yoyo: true, repeat: 1});
                this.showParticles(cfg.x, cfg.y - 60, '🌻', 1);
            } else if (cfg.interaction === 'balloon') {
                this.tweens.add({targets: objText, y: cfg.y - 50, duration: 400, yoyo: true, ease: 'Sine.easeInOut'});
                this.tweens.add({targets: this.cat, y: this.cat.y - 30, duration: 200, yoyo: true, delay: 100});
                this.showParticles(cfg.x, cfg.y - 50, '✨', 1);
            } else if (cfg.interaction === 'window') {
                this.showCatReaction('👀', 1000);
                const hr = new Date().getHours();
                const isNight = hr >= 18 || hr < 6;
                this.showParticles(cfg.x, cfg.y - 40, isNight ? '🌙' : '🐦', 1);
            } else if (cfg.interaction === 'yarn_dec') {
                this.tweens.add({targets: objText, x: cfg.x + 20, angle: 90, duration: 300, yoyo: true});
                this.tweens.add({targets: this.cat, x: this.cat.x + 10, duration: 150, yoyo: true});
                if (catState.preferences && catState.preferences.favoriteToy === '🧶') {
                    this.showCatReaction('😻');
                } else {
                    this.showParticles(this.cat.x, this.cat.y - 40, '🐾', 1);
                }
            } else if (cfg.interaction === 'ladybug') {
                this.tweens.add({targets: objText, x: cfg.x + 50, duration: 1000});
                this.tweens.add({targets: this.cat, x: this.cat.x + 40, duration: 800, delay: 200});
                this.showCatReaction('😸');
            }
        });
    }

spawnTemporaryWorldObject(cfg, duration) {
        if (this.currentZone !== cfg.zone) return;
        
        // Solo 1 evento a la vez
        if (this.activeTempObject) return;
        
        const objText = this.add.text(cfg.x, cfg.y, cfg.emoji, { fontSize: '60px' }).setOrigin(0.5);
        this.zoneContainer.add(objText);
        
        this.activeTempObject = objText;
        
        this.makeInteractive(objText, () => {
            if (!this.activeTempObject || this.activeTempObject !== objText) return;
            if (this.tempObjectTimer) {
                this.tempObjectTimer.remove();
                this.tempObjectTimer = null;
            }
            
            this.interactWithWorldObject(cfg, objText);
            
            this.time.delayedCall(2000, () => {
                if (objText && objText.active) {
                    this.tweens.add({
                        targets: objText, alpha: 0, duration: 500,
                        onComplete: () => this.clearTemporaryWorldObject()
                    });
                }
            });
        });
        
        this.tempObjectTimer = this.time.delayedCall(duration, () => {
            if (objText && this.activeTempObject === objText) {
                this.tweens.add({
                    targets: objText, alpha: 0, duration: 500,
                    onComplete: () => this.clearTemporaryWorldObject()
                });
            }
        });
    }

    clearTemporaryWorldObject() {
        if (this.tempObjectTimer) {
            this.tempObjectTimer.remove();
            this.tempObjectTimer = null;
        }

        if (this.activeTempObject) {
            this.tweens.killTweensOf(this.activeTempObject);
            if (this.activeTempObject.active) this.activeTempObject.destroy();
            this.activeTempObject = null;
        }
    }

    showParticles(x, y, emoji, count) {
        for (let i = 0; i < count; i++) {
            const p = this.add.text(x, y, emoji, { fontSize: '30px' }).setOrigin(0.5);
            this.tweens.add({
                targets: p,
                x: x + Phaser.Math.Between(-50, 50),
                y: y - Phaser.Math.Between(50, 150),
                alpha: 0,
                scale: 1.5,
                duration: 1000,
                onComplete: () => p.destroy()
            });
        }
    }

    createMemoryVisual(mem, x, y, maxSize) {
        if (mem.assetKey && this.textures.exists(mem.assetKey)) {
            const image = this.add.image(x, y, mem.assetKey).setOrigin(0.5);
            const maxDimension = Math.max(image.width, image.height);
            if (maxDimension > 0) image.setScale(maxSize / maxDimension);
            return image;
        }

        return this.add.text(x, y, mem.emoji, { fontSize: `${maxSize}px` }).setOrigin(0.5);
    }

openMemoryAlbum() {
        if (this.isAlbumOpen) return;
        if (this.activeCareActivity) return;
        if (this.currentState !== 'IDLE' && this.currentState !== 'SLEEPING') return;

        this.clearTemporaryWorldObject(); 
        this.clearCatInitiative();
        this.isAlbumOpen = true;

        this.albumContainer = this.add.container(0, 0).setDepth(300).setAlpha(0);
        
        const overlay = this.add.rectangle(400, 250, 800, 500, 0x000000, 0.6).setInteractive();
        const panel = this.add.rectangle(400, 250, 750, 440, 0xffffff, 1).setStrokeStyle(4, 0xffa726);
        
        const title = this.add.text(400, 60, '📖 Mis Recuerdos', { fontSize: '35px', color: '#ff9800', fontStyle: 'bold' }).setOrigin(0.5);
        
        const closeBtn = this.add.text(730, 60, '❌', { fontSize: '35px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        closeBtn.on('pointerdown', () => this.closeMemoryAlbum());
        
        this.albumContainer.add([overlay, panel, title, closeBtn]);
        
        let unlockedCount = 0;
        let startX = 140;
        let startY = 140;
        let paddingX = 130;
        let paddingY = 130;

        CAT_MEMORIES.forEach((mem, idx) => {
            let isUnlocked = catState.memories && catState.memories.unlocked[mem.id];
            
            let row = Math.floor(idx / 5);
            let col = idx % 5;
            
            let cx = startX + col * paddingX;
            let cy = startY + row * paddingY;
            
            const cardBg = this.add.rectangle(cx, cy, 110, 110, isUnlocked ? 0xfff3e0 : 0xeeeeee, 1).setStrokeStyle(3, isUnlocked ? 0xffb74d : 0xcccccc);
            const cardIcon = isUnlocked
                ? this.createMemoryVisual(mem, cx, cy - 10, 50)
                : this.add.text(cx, cy - 10, '❓', { fontSize: '50px' }).setOrigin(0.5);
            
            const txtStyle = { fontSize: '13px', color: '#555', align: 'center', wordWrap: { width: 100 } };
            const cardText = this.add.text(cx, cy + 35, isUnlocked ? mem.title : '', txtStyle).setOrigin(0.5);
            
            this.albumContainer.add([cardBg, cardIcon, cardText]);
            
            if (isUnlocked) {
                unlockedCount++;
                cardBg.setInteractive({useHandCursor: true});
                cardBg.on('pointerdown', () => {
                    this.showMemoryDetail(mem);
                });
            }
        });
        
        if (unlockedCount === 0) {
            const emptyTxt = this.add.text(400, 250, '✨ ¡Vamos a crear hermosos recuerdos! ✨', { fontSize: '25px', color: '#ff9800' }).setOrigin(0.5);
            this.albumContainer.add(emptyTxt);
        }
        
        this.tweens.add({ targets: this.albumContainer, alpha: 1, duration: 200 });
    }

    closeMemoryAlbum() {
        if (!this.isAlbumOpen) return;
        
        if (this.memoryDetailContainer) {
            this.tweens.killTweensOf(this.memoryDetailContainer);
            this.memoryDetailContainer.destroy();
            this.memoryDetailContainer = null;
        }
        
        this.tweens.add({
            targets: this.albumContainer,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                if (this.albumContainer) {
                    this.albumContainer.destroy();
                    this.albumContainer = null;
                }
                this.isAlbumOpen = false;
            }
        });
    }

    showMemoryDetail(mem) {
        if (this.memoryDetailContainer) this.memoryDetailContainer.destroy();
        
        this.memoryDetailContainer = this.add.container(0, 0).setDepth(310).setAlpha(0);
        
        const block = this.add.rectangle(400, 250, 800, 500, 0x000000, 0.3).setInteractive();
        block.on('pointerdown', () => {
            this.tweens.add({ targets: this.memoryDetailContainer, alpha: 0, duration: 150, onComplete: () => {
                if (this.memoryDetailContainer) {
                    this.memoryDetailContainer.destroy();
                    this.memoryDetailContainer = null;
                }
            }});
        });
        
        const panel = this.add.rectangle(400, 250, 450, 280, 0xfff3e0, 1).setStrokeStyle(6, 0xffa726);
        const icon = this.createMemoryVisual(mem, 400, 180, 90);
        const title = this.add.text(400, 260, mem.title, { fontSize: '32px', color: '#ff9800', fontStyle: 'bold' }).setOrigin(0.5);
        const desc = this.add.text(400, 310, mem.description, { fontSize: '20px', color: '#666', wordWrap: { width: 400 }, align: 'center' }).setOrigin(0.5);
        
        this.memoryDetailContainer.add([block, panel, icon, title, desc]);
        this.tweens.add({ targets: this.memoryDetailContainer, alpha: 1, duration: 150, ease: 'Back.easeOut' });
        
        this.speakCat(mem.description);
    }
    
    showMemoryToast(emoji) {
        if (!this.memoryToastQueue) this.memoryToastQueue = [];
        this.memoryToastQueue.push(emoji);
        if (!this.isMemoryToastActive) {
            this.playNextMemoryToast();
        }
    }
    
    playNextMemoryToast() {
        if (!this.memoryToastQueue || this.memoryToastQueue.length === 0) {
            this.isMemoryToastActive = false;
            return;
        }
        this.isMemoryToastActive = true;
        const emoji = this.memoryToastQueue.shift();
        
        const toast = this.add.container(400, -50).setDepth(200);
        const bg = this.add.rectangle(0, 0, 200, 60, 0xffffff, 0.9).setStrokeStyle(4, 0xffd54f);
        bg.setInteractive(); // Prevent clicks behind it
        const txt = this.add.text(0, 0, '📖 ' + emoji + ' ✨', { fontSize: '30px' }).setOrigin(0.5);
        toast.add([bg, txt]);
        
        this.tweens.add({
            targets: toast,
            y: 50,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                if (typeof playCustomSound === 'function') playCustomSound('play');
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: toast,
                        y: -50,
                        duration: 300,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            toast.destroy();
                            this.playNextMemoryToast();
                        }
                    });
                });
            }
        });
    }

    wakeUp() {
        this.currentState = 'IDLE';
        this.cat.setAlpha(1);
        this.reactTo('wake');
    }

    // --- ACCIONES ESPECÍFICAS Y MICROJUEGOS ---

    startCareActivity(type) {
        if (this.isAlbumOpen) return;
        if (this.currentState !== 'IDLE') return;
        if (this.currentZone !== 'room') return;
        if (this.activeCareActivity) return;
        
        this.clearCatInitiative();
        
        this.activeCareActivity = type;
        this.currentState = 'MINIGAME';
        this.activityCompleting = false;
        
        if (this.hintBubble) this.hintBubble.setAlpha(0);
        if (this.reactionBubble) this.reactionBubble.setAlpha(0);
        
        this.activityContainer = this.add.container(0, 0).setDepth(100).setAlpha(0);
        
        let bgHex = 0xffffff;
        if (type === 'eat') bgHex = 0xffe0b2;
        else if (type === 'play') bgHex = 0xfff59d;
        else if (type === 'bath') bgHex = 0xb3e5fc;
        else if (type === 'drink') bgHex = 0x81d4fa;
        else if (type === 'sleep') bgHex = 0x5e35b1;
        
        const bg = this.add.rectangle(400, 250, 800, 500, bgHex, 0.95).setInteractive();
        const closeBtn = this.add.text(50, 50, '❌', { fontSize: '40px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        closeBtn.on('pointerdown', () => this.cancelCareActivity());
        
        this.activityCat = this.add.text(400, 250, catState.emoji, { fontSize: '150px' }).setOrigin(0.5);
        this.activityContainer.add([bg, this.activityCat, closeBtn]);
        
        this.activityProgress = 0;
        this.activityItems = [];
        this.activityHintTimer = null;
        
        if (type === 'eat') this.setupEatActivity();
        else if (type === 'play') this.setupPlayActivity();
        else if (type === 'bath') this.setupBathActivity();
        else if (type === 'drink') this.setupDrinkActivity();
        else if (type === 'sleep') this.setupSleepActivity();
        
        this.resetActivityHint();
        this.tweens.add({ targets: this.activityContainer, alpha: 1, duration: 300 });
    }

    resetActivityHint() {
        if (this.activityHintTimer) this.activityHintTimer.remove();
        this.activityHintTimer = this.time.delayedCall(7000, () => {
            if (!this.activeCareActivity || this.activityItems.length === 0) return;
            let validItem = this.activityItems.find(i => !i.consumed);
            if (validItem) {
                let target = validItem.visual ? validItem.visual : validItem;
                this.tweens.add({ targets: target, scale: {from: 1, to: 1.15}, duration: 300, yoyo: true, repeat: 1 });
            }
        });
    }

    cancelCareActivity() {
        if (!this.activeCareActivity || this.activityCompleting) return;
        this.cleanupCareActivity();
        this.currentState = 'IDLE';
    }

    finishCareActivity(type) {
        if (!this.activeCareActivity || this.activeCareActivity !== type) return;
        if (this.activityCompleting) return;
        this.activityCompleting = true;
        
        if (type === 'play' && this.activeToy) {
            if (typeof recordPreference === 'function') recordPreference('toy', this.activeToy);
            if (catState.preferences && catState.preferences.favoriteToy === this.activeToy) {
                this.showParticles(this.activityCat.x, this.activityCat.y, '😻', 3);
                this.showParticles(this.activityCat.x, this.activityCat.y, '✨', 3);
            }
        }
        
        if (type === 'eat') unlockCatMemory('first-meal');
        else if (type === 'play') unlockCatMemory('first-play');
        else if (type === 'bath') unlockCatMemory('first-bath');
        else if (type === 'sleep') unlockCatMemory('first-sleep');

        this.showParticles(this.activityCat.x, this.activityCat.y - 50, '❤️', 5);
        this.showParticles(this.activityCat.x, this.activityCat.y, '✨', 5);
        playCustomSound(type); // Uses 'eat', 'play', or 'bath'
        
        this.tweens.add({ targets: this.activityCat, y: this.activityCat.y - 30, duration: 200, yoyo: true, repeat: 2 });
        
        this.time.delayedCall(1200, () => {
            this.cleanupCareActivity();
            this.applyCareResult(type);
        });
    }

    cleanupCareActivity() {
        if (this.activityHintTimer) this.activityHintTimer.remove();
        this.tweens.add({
            targets: this.activityContainer,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                if (this.activityContainer) this.activityContainer.destroy();
                this.activeCareActivity = null;
                this.activityCompleting = false;
            }
        });
    }

    showCareSuggestion() {
        const need = this.getPrimaryNeed();
        let emoji = '❤️';
        if (need === 'energy') emoji = '🥱';
        else if (need === 'hunger') emoji = '🍗';
        else if (need === 'thirst') emoji = '💧';
        else if (need === 'cleanliness') emoji = '🧼';
        else if (need === 'fun') emoji = '🧶';
        else {
            this.checkHappyTogetherMemory();
            if (!this.sessionState.hasCelebratedAllHappy) {
                this.sessionState.hasCelebratedAllHappy = true;
                this.showParticles(this.cat.x, this.cat.y - 100, '✨', 5);
                this.showCatReaction('😻', 2000);
                this.speakCat('¡El gatito está muy feliz!');
                return;
            }
        }
        
        if (emoji !== '❤️') {
            if (this.currentZone !== 'room') {
                this.showHint(emoji + '🏠');
            } else {
                this.showHint(emoji);
            }
        } else {
            if (Math.random() < 0.2) {
                this.showParticles(this.cat.x, this.cat.y - 80, '🐾', 1);
            }
        }
    }

    applyCareResult(type) {
        if (type === 'eat') {
            catState.hambre = Math.min(100, catState.hambre + 30);
        } else if (type === 'play') {
            catState.diversion = Math.min(100, catState.diversion + 30);
            catState.energia = Math.max(0, catState.energia - 5);
        } else if (type === 'bath') {
            catState.limpieza = Math.min(100, catState.limpieza + 40);
        } else if (type === 'drink') {
            catState.sed = Math.min(100, catState.sed + 30);
        } else if (type === 'sleep') {
            catState.energia = Math.min(100, catState.energia + 40);
        }
        
        updateDOMBars();
        saveCatState();
        recordCatCareAction();
        
        this.showParticles(this.cat.x, this.cat.y - 50, (type === 'bath' ? '🫧' : '❤️'), 3);
        
        if (type === 'sleep') {
            this.currentState = 'SLEEPING';
            this.cat.setAlpha(0.6);
            this.showParticles(this.cat.x, this.cat.y - 50, '💤', 3);
        } else {
            this.reactTo(type + '-complete');
            this.currentState = 'IDLE';
            
            this.time.delayedCall(2000, () => {
                if (this.currentState === 'IDLE') {
                    this.showCareSuggestion();
                }
            });
        }
    }

    setupEatActivity() {
        this.activityCat.setPosition(400, 320);
        this.sessionState.favoriteFoodReacted = false;
        
        const FOOD_SETS = [
            ['🐟', '🍗', '🥩'],
            ['🐟', '🍗', '🥣'],
            ['🥩', '🐟', '🍗']
        ];
        const foods = Phaser.Math.RND.pick(FOOD_SETS);
        
        const startX = 250;
        
        const bowl = this.add.text(400, 420, '🥣', { fontSize: '80px' }).setOrigin(0.5);
        this.activityContainer.add(bowl);
        
        foods.forEach((f, i) => {
            const item = this.add.text(startX + (i * 150), 150 + Phaser.Math.Between(-10, 10), f, { fontSize: '80px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
            item.consumed = false;
            item.on('pointerdown', () => {
                if (item.consumed || this.activityCompleting) return;
                item.consumed = true;
                item.disableInteractive();
                this.resetActivityHint();
                playCustomSound('pop');
                
                if (typeof recordPreference === 'function') recordPreference('food', f);
                
                if (catState.preferences && catState.preferences.favoriteFood === f) {
                    if (!this.sessionState.favoriteFoodReacted) {
                        this.sessionState.favoriteFoodReacted = true;
                        this.showCatReaction('😻');
                        this.showParticles(this.activityCat.x, this.activityCat.y, '❤️', 3);
                    }
                }
                
                this.tweens.add({
                    targets: item,
                    x: this.activityCat.x,
                    y: this.activityCat.y,
                    scale: 0.2,
                    duration: 400,
                    onComplete: () => {
                        item.setVisible(false);
                        this.activityProgress++;
                        
                        this.tweens.add({targets: this.activityCat, scale: 1.1, duration: 100, yoyo: true});
                        if (this.activityProgress >= 3) {
                            this.finishCareActivity('eat');
                        }
                    }
                });
            });
            this.activityItems.push(item);
            this.activityContainer.add(item);
        });
        
        const title = this.add.text(400, 50, '¡Dale de comer!', { fontSize: '30px', color: '#000' }).setOrigin(0.5);
        this.activityContainer.add(title);
        this.tweens.add({targets: title, alpha: 0, delay: 1500, duration: 500});
    }

    setupPlayActivity() {
        this.activityCat.setPosition(400, 250);
        
        const toys = ['🧶', '⚽', '🪶'];
        const selectedToy = Phaser.Math.RND.pick(toys);
        this.activeToy = selectedToy;
        
        const toy = this.add.text(400, 100, selectedToy, { fontSize: '80px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        toy.consumed = false;
        this.activityItems.push(toy);
        this.activityContainer.add(toy);
        
        const positions = [
            {x: 200, y: 150}, {x: 600, y: 150},
            {x: 200, y: 350}, {x: 600, y: 350},
            {x: 400, y: 100}, {x: 400, y: 400}
        ];
        let lastPosIndex = 4;
        
        toy.on('pointerdown', () => {
            if (this.isToyMoving || toy.consumed || this.activityCompleting) return;
            this.isToyMoving = true;
            this.resetActivityHint();
            playCustomSound('pop');
            
            this.tweens.add({ targets: toy, scaleX: 1.2, scaleY: 0.8, duration: 100, yoyo: true });
            this.tweens.add({ targets: this.activityCat, y: this.activityCat.y - 20, duration: 150, yoyo: true });
            
            let nextIndex = Phaser.Math.Between(0, positions.length - 1);
            while (nextIndex === lastPosIndex) {
                nextIndex = Phaser.Math.Between(0, positions.length - 1);
            }
            lastPosIndex = nextIndex;
            let nextPos = positions[nextIndex];
            
            let easeType = 'Sine.easeInOut';
            if (selectedToy === '⚽') easeType = 'Bounce.easeOut';
            else if (selectedToy === '🪶') easeType = 'Quad.easeInOut';
            
            this.tweens.add({
                targets: toy,
                x: nextPos.x,
                y: nextPos.y,
                angle: (selectedToy === '🪶' ? '+=45' : '+=180'),
                duration: (selectedToy === '🪶' ? 600 : 400),
                ease: easeType,
                onComplete: () => {
                    this.isToyMoving = false;
                    this.activityProgress++;
                    if (this.activityProgress >= 3) {
                        toy.consumed = true;
                        toy.disableInteractive();
                        this.finishCareActivity('play');
                    }
                }
            });
        });
        
        const title = this.add.text(400, 50, '¡Vamos a jugar!', { fontSize: '30px', color: '#000' }).setOrigin(0.5);
        this.activityContainer.add(title);
        this.tweens.add({targets: title, alpha: 0, delay: 1500, duration: 500});
    }

    setupBathActivity() {
        this.activityCat.setPosition(400, 250);
        
        const bubbleOffsets = [
            {x: -120, y: -80}, {x: 120, y: -60},
            {x: -90, y: 80}, {x: 100, y: 90},
            {x: 0, y: -130}
        ];
        
        bubbleOffsets.forEach(off => {
            const bx = 400 + off.x;
            const by = 250 + off.y;
            
            const bCont = this.add.container(bx, by);
            const bVisual = this.add.text(0, 0, '🫧', { fontSize: '70px' }).setOrigin(0.5);
            const bHit = this.add.rectangle(0, 0, 100, 100, 0xffffff, 0).setInteractive({useHandCursor: true});
            
            bCont.add([bVisual, bHit]);
            bCont.consumed = false;
            bCont.visual = bVisual;
            
            this.tweens.add({ targets: bVisual, y: -10, duration: 1000 + Phaser.Math.Between(0,500), yoyo: true, repeat: -1 });
            
            bHit.on('pointerdown', () => {
                if (bCont.consumed || this.activityCompleting) return;
                bCont.consumed = true;
                bHit.disableInteractive();
                this.resetActivityHint();
                playCustomSound('bath');
                
                this.showParticles(bCont.x, bCont.y, '💧', 3);
                
                this.tweens.add({
                    targets: bVisual,
                    scale: 1.3,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => {
                        bCont.setVisible(false);
                        this.activityProgress++;
                        
                        this.tweens.add({targets: this.activityCat, angle: {from: -5, to: 5}, duration: 100, yoyo: true});
                        if (this.activityProgress >= 5) {
                            this.startDryStage();
                        }
                    }
                });
            });
            this.activityItems.push(bCont);
            this.activityContainer.add(bCont);
        });
        
        const title = this.add.text(400, 50, '¡Explota las burbujas!', { fontSize: '30px', color: '#000' }).setOrigin(0.5);
        this.activityContainer.add(title);
        this.tweens.add({targets: title, alpha: 0, delay: 1500, duration: 500});
    }

    startDryStage() {
        this.activityItems = [];
        this.activityProgress = 0;
        
        const towel = this.add.text(600, 250, '🧻', { fontSize: '100px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        towel.consumed = false;
        
        this.activityItems.push(towel);
        this.activityContainer.add(towel);
        this.resetActivityHint();
        
        towel.on('pointerdown', () => {
            if (this.activityCompleting) return;
            this.resetActivityHint();
            playCustomSound('pet');
            
            this.tweens.add({ targets: towel, scale: 1.2, duration: 100, yoyo: true });
            this.tweens.add({ targets: this.activityCat, angle: {from: -10, to: 10}, duration: 100, yoyo: true, repeat: 1 });
            
            this.activityProgress++;
            if (this.activityProgress >= 2) {
                towel.disableInteractive();
                this.finishCareActivity('bath');
            }
        });
        
        const title = this.add.text(400, 50, '¡Sécate!', { fontSize: '30px', color: '#000' }).setOrigin(0.5);
        this.activityContainer.add(title);
        this.tweens.add({targets: title, alpha: 0, duration: 500});
    }

    setupDrinkActivity() {
        this.activityCat.setPosition(400, 320);
        
        const bowl = this.add.text(400, 420, '🥣', { fontSize: '80px' }).setOrigin(0.5);
        this.activityContainer.add(bowl);
        
        const dropPositions = [
            {x: 250, y: 150},
            {x: 400, y: 100},
            {x: 550, y: 150}
        ];
        
        dropPositions.forEach((pos) => {
            const drop = this.add.text(pos.x, pos.y, '💧', { fontSize: '70px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
            drop.consumed = false;
            
            this.tweens.add({ targets: drop, y: pos.y + 10, duration: 1000 + Phaser.Math.Between(0,500), yoyo: true, repeat: -1 });
            
            drop.on('pointerdown', () => {
                if (drop.consumed || this.activityCompleting) return;
                drop.consumed = true;
                drop.disableInteractive();
                this.resetActivityHint();
                playCustomSound('drink');
                
                this.tweens.add({
                    targets: drop,
                    x: bowl.x,
                    y: bowl.y,
                    scale: 0.5,
                    duration: 300,
                    onComplete: () => {
                        drop.setVisible(false);
                        this.activityProgress++;
                        bowl.scale += 0.1; 
                        
                        if (this.activityProgress >= 3) {
                            this.finishCareActivity('drink');
                        }
                    }
                });
            });
            this.activityItems.push(drop);
            this.activityContainer.add(drop);
        });
        
        const title = this.add.text(400, 50, '¡Llena el bowl!', { fontSize: '30px', color: '#000' }).setOrigin(0.5);
        this.activityContainer.add(title);
        this.tweens.add({targets: title, alpha: 0, delay: 1500, duration: 500});
    }

    setupSleepActivity() {
        this.activityCat.setPosition(200, 350);
        
        const bed = this.add.text(600, 380, '🛏️', { fontSize: '120px' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        const blanket = this.add.text(600, 380, '🧸', { fontSize: '60px' }).setOrigin(0.5).setAlpha(0);
        const moon = this.add.text(400, 100, '🌙', { fontSize: '80px' }).setOrigin(0.5).setAlpha(0);
        
        this.activityContainer.add([bed, blanket, moon]);
        
        bed.consumed = false;
        blanket.consumed = false;
        moon.consumed = false;
        
        this.activityItems.push(bed);
        
        bed.on('pointerdown', () => {
            if (bed.consumed || this.activityCompleting) return;
            bed.consumed = true;
            bed.disableInteractive();
            this.resetActivityHint();
            playCustomSound('pop');
            
            this.tweens.add({
                targets: this.activityCat,
                x: 600,
                y: 360,
                duration: 500,
                onComplete: () => {
                    this.activityItems = [blanket];
                    blanket.setAlpha(1).setInteractive({useHandCursor: true});
                    this.resetActivityHint();
                }
            });
        });
        
        blanket.on('pointerdown', () => {
            if (blanket.consumed || this.activityCompleting) return;
            blanket.consumed = true;
            blanket.disableInteractive();
            this.resetActivityHint();
            playCustomSound('pet');
            
            this.tweens.add({ targets: blanket, scale: 1.5, duration: 200, yoyo: true });
            this.activityCat.setAlpha(0.6);
            
            this.activityItems = [moon];
            moon.setAlpha(1).setInteractive({useHandCursor: true});
            this.resetActivityHint();
        });
        
        moon.on('pointerdown', () => {
            if (moon.consumed || this.activityCompleting) return;
            moon.consumed = true;
            moon.disableInteractive();
            this.resetActivityHint();
            playCustomSound('pop');
            
            this.tweens.add({ targets: moon, scale: 1.2, duration: 200, yoyo: true });
            
            this.finishCareActivity('sleep');
        });
        
        const title = this.add.text(400, 50, '¡A dormir!', { fontSize: '30px', color: '#fff' }).setOrigin(0.5);
        this.activityContainer.add(title);
        this.tweens.add({targets: title, alpha: 0, delay: 1500, duration: 500});
    }

    actionEat() {
        this.startCareActivity('eat');
    }
    actionDrink() {
        this.startCareActivity('drink');
    }

    actionPlay() {
        this.startCareActivity('play');
    }

    actionBath() {
        this.startCareActivity('bath');
    }

    actionSleep() {
        if (this.currentState === 'SLEEPING') {
            this.wakeUp();
            return;
        }
        this.startCareActivity('sleep');
    }

    actionLove() {
        if (this.isAlbumOpen) return;
        if (this.currentState === 'SLEEPING') {
            this.wakeUp();
            return;
        }
        if (this.currentState !== 'IDLE') return;
        
        this.clearCatInitiative();
        
        this.currentState = 'PETTING';
        playCustomSound('pet');
        this.reactTo('love');
        
        this.time.delayedCall(400, () => {
            catState.diversion = Math.min(100, catState.diversion + 15);
            updateDOMBars();
            saveCatState();
            recordCatCareAction();
            unlockCatMemory('first-love');
            this.showParticles(this.cat.x, this.cat.y - 50, '❤️', 3);
            this.currentState = 'IDLE';
        });
    }
}

SofiApp.navigation.registerView('game4', {
    onEnter: () => {
        loadCatState();
        const adoptionScreen = document.getElementById('adoption-screen');
        if (!catState.adopted) {
            if (adoptionScreen) adoptionScreen.classList.remove('hidden');
        } else {
            if (adoptionScreen) adoptionScreen.classList.add('hidden');
            applyTimeDecay();
            updateDOMBars();
            startDecay();
            initPhaser();
        }
    },
    onExit: () => {
        if (typeof catGameInstance !== 'undefined' && catGameInstance) {
            catGameInstance.destroy(true);
            catGameInstance = null;
        }
        if (typeof decayInterval !== 'undefined' && decayInterval) {
            clearInterval(decayInterval);
            decayInterval = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
});


// --- DEV VALIDATION ---
function validateCatMemories() {
    console.log('Validando CAT_MEMORIES...');
    const ids = new Set();
    let hasError = false;
    for (const mem of CAT_MEMORIES) {
        if (!mem.id || typeof mem.id !== 'string') { console.error('Memory id inválido', mem); hasError = true; }
        if (ids.has(mem.id)) { console.error('Memory id duplicado:', mem.id); hasError = true; }
        ids.add(mem.id);
        if (!mem.emoji || typeof mem.emoji !== 'string') { console.error('Memory emoji inválido', mem); hasError = true; }
        if (!mem.title || typeof mem.title !== 'string') { console.error('Memory title inválido', mem); hasError = true; }
        if (!mem.description || typeof mem.description !== 'string') { console.error('Memory description inválida', mem); hasError = true; }
    }
    if (!hasError) console.log('✅ CAT_MEMORIES validados correctamente. (' + CAT_MEMORIES.length + ' recuerdos)');
}

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    validateCatMemories();
}
