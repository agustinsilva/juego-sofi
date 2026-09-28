// game1.js - JUEGO 1: ENCUENTRA LA DIFERENCIA (Phaser Version Phase 5)

const levelTitle1 = document.getElementById('level-title');

const challengePool = [
    // OBJECT (Grid)
    { id: 'obj-apple', type: 'object', presentation: 'grid', normal: '🍎', different: '🍒', cols: 2, rows: 3, difficulty: 1 },
    { id: 'obj-car', type: 'object', presentation: 'grid', normal: '🚗', different: '🚒', cols: 2, rows: 3, difficulty: 1 },
    { id: 'obj-animal', type: 'object', presentation: 'grid', normal: '🐘', different: '🦏', cols: 3, rows: 4, difficulty: 2 },
    { id: 'obj-flower', type: 'object', presentation: 'grid', normal: '🌸', different: '🌺', cols: 4, rows: 4, difficulty: 3 },
    
    // COLOR (Grid)
    { id: 'col-circle', type: 'color', presentation: 'grid', shape: 'circle', normalColor: 0x64b5f6, differentColor: 0xab47bc, cols: 3, rows: 3, difficulty: 1 },
    { id: 'col-circle-2', type: 'color', presentation: 'grid', shape: 'circle', normalColor: 0x81c784, differentColor: 0xffb74d, cols: 3, rows: 4, difficulty: 2 },
    
    // ORIENTATION (Grid)
    { id: 'ori-arrow', type: 'orientation', presentation: 'grid', symbol: '➔', normalRotation: 0, differentRotation: 180, cols: 3, rows: 3, difficulty: 2 },
    { id: 'ori-fish', type: 'orientation', presentation: 'grid', symbol: '🐟', normalRotation: 0, differentRotation: 180, cols: 3, rows: 3, difficulty: 1 },

    // SIZE (Grid)
    { id: 'size-star', type: 'size', presentation: 'grid', symbol: '⭐', normalScale: 1, differentScale: 0.65, cols: 3, rows: 4, difficulty: 2 },
    { id: 'size-tree', type: 'size', presentation: 'grid', symbol: '🌳', normalScale: 1, differentScale: 0.7, cols: 3, rows: 3, difficulty: 1 },

    // CATEGORY (Scene)
    { id: 'cat-ocean', type: 'category', presentation: 'scene', theme: 'ocean', items: [
        { symbol: '🐟', isCorrect: false }, { symbol: '🐠', isCorrect: false }, { symbol: '🐙', isCorrect: false }, { symbol: '🐡', isCorrect: false }, { symbol: '🚗', isCorrect: true }
    ], difficulty: 1 },
    { id: 'cat-park', type: 'category', presentation: 'scene', theme: 'park', items: [
        { symbol: '🐶', isCorrect: false }, { symbol: '🐶', isCorrect: false }, { symbol: '🐶', isCorrect: false }, { symbol: '🦊', isCorrect: true }, { symbol: '🦊', isCorrect: true }
    ], difficulty: 2 }, 
    { id: 'cat-space', type: 'category', presentation: 'scene', theme: 'space', items: [
        { symbol: '🚀', isCorrect: false }, { symbol: '🪐', isCorrect: false }, { symbol: '🌙', isCorrect: false }, { symbol: '⭐', isCorrect: false }, { symbol: '🐄', isCorrect: true }, { symbol: '🚗', isCorrect: true }
    ], difficulty: 3 },
    
    // MEMORY
    { id: 'mem-fruit', type: 'memory', presentation: 'memory', observationTime: 3000, items: [
        { symbol: '🍎', isCorrect: true } 
    ], options: [
        { symbol: '🍎', isCorrect: true }, { symbol: '🍌', isCorrect: false }, { symbol: '🍓', isCorrect: false }
    ], instruction: { visual: '🧠 ¿Cuál viste?', speech: '¿Cuál viste antes?' }, hintSpeech: 'Recuerda lo que viste.', difficulty: 1 },
    
    { id: 'mem-animal', type: 'memory', presentation: 'memory', observationTime: 3000, items: [
        { symbol: '🐶', isCorrect: true }
    ], options: [
        { symbol: '🐱', isCorrect: false }, { symbol: '🐶', isCorrect: true }, { symbol: '🐰', isCorrect: false }
    ], instruction: { visual: '🧠 ¿Cuál viste?', speech: '¿Cuál viste antes?' }, hintSpeech: 'Recuerda lo que viste.', difficulty: 1 },
    
    { id: 'mem-vehic', type: 'memory', presentation: 'memory', observationTime: 3000, items: [
        { symbol: '🚗', isCorrect: true }, { symbol: '🚕', isCorrect: true }
    ], options: [
        { symbol: '🚌', isCorrect: false }, { symbol: '🚕', isCorrect: true }, { symbol: '🚗', isCorrect: true }, { symbol: '🚒', isCorrect: false }
    ], instruction: { visual: '🧠 ¿Cuáles viste?', speech: '¿Cuáles viste antes?' }, hintSpeech: 'Recuerda lo que viste.', difficulty: 3 },

    // PATTERN (ABAB)
    { id: 'pat-fruit', type: 'pattern', presentation: 'pattern', sequence: ['🍎', '🍌', '🍎', '🍌'], options: [
        { symbol: '🍎', isCorrect: true }, { symbol: '🚗', isCorrect: false }, { symbol: '🌳', isCorrect: false }
    ], instruction: { visual: '🧩 ¿Cuál sigue?', speech: '¿Cuál sigue?' }, hintSpeech: 'Mira cómo se repiten.', difficulty: 1 },
    
    { id: 'pat-color', type: 'pattern', presentation: 'pattern', sequence: ['🔵', '🟣', '🔵', '🟣'], options: [
        { symbol: '🔵', isCorrect: true }, { symbol: '⭐', isCorrect: false }, { symbol: '🟢', isCorrect: false }
    ], instruction: { visual: '🧩 ¿Cuál sigue?', speech: '¿Cuál sigue?' }, hintSpeech: 'Mira cómo se repiten.', difficulty: 1 },
    
    { id: 'pat-animal', type: 'pattern', presentation: 'pattern', sequence: ['🐶', '🐱', '🐶', '🐱'], options: [
        { symbol: '🐰', isCorrect: false }, { symbol: '🐶', isCorrect: true }, { symbol: '🐸', isCorrect: false }
    ], instruction: { visual: '🧩 ¿Cuál sigue?', speech: '¿Cuál sigue?' }, hintSpeech: 'Mira cómo se repiten.', difficulty: 2 },

    // FINDALL
    { id: 'find-animal', type: 'findAll', presentation: 'grid', cols: 3, rows: 2, items: [
        { symbol: '🐶', isCorrect: true }, { symbol: '🐱', isCorrect: true }, { symbol: '🍎', isCorrect: false }, { symbol: '🚗', isCorrect: false }, { symbol: '🌳', isCorrect: false }, { symbol: '⭐', isCorrect: false }
    ], instruction: { visual: '🔎 ¡Encuentra los animales!', speech: '¡Encuentra todos los animales!' }, hintSpeech: 'Busca uno por uno.', difficulty: 2 },
    
    { id: 'find-fruit', type: 'findAll', presentation: 'grid', cols: 3, rows: 2, items: [
        { symbol: '🍎', isCorrect: true }, { symbol: '🍌', isCorrect: true }, { symbol: '🍓', isCorrect: true }, { symbol: '🚗', isCorrect: false }, { symbol: '🐶', isCorrect: false }, { symbol: '🪐', isCorrect: false }
    ], instruction: { visual: '🔎 ¡Encuentra las frutas!', speech: '¡Encuentra todas las frutas!' }, hintSpeech: 'Busca uno por uno.', difficulty: 2 },
    
    { id: 'find-stars', type: 'findAll', presentation: 'grid', cols: 3, rows: 3, items: [
        { symbol: '⭐', isCorrect: true }, { symbol: '⭐', isCorrect: true }, { symbol: '⭐', isCorrect: true }, { symbol: '🚗', isCorrect: false }, { symbol: '🐶', isCorrect: false }, { symbol: '🪐', isCorrect: false }, { symbol: '🍎', isCorrect: false }, { symbol: '🌸', isCorrect: false }, { symbol: '🌳', isCorrect: false }
    ], instruction: { visual: '🔎 ¡Encuentra las estrellas!', speech: '¡Encuentra todas las estrellas!' }, hintSpeech: 'Busca uno por uno.', difficulty: 3 }
];

const levelInstructions = {
    'object': { visual: '👀 ¿Cuál es diferente?', speech: '¿Cuál es diferente?' },
    'color': { visual: '🎨 ¿Cuál tiene otro color?', speech: '¿Cuál tiene otro color?' },
    'orientation': { visual: '👀 ¿Cuál mira distinto?', speech: '¿Cuál mira para otro lado?' },
    'size': { visual: '🔎 ¿Cuál tiene otro tamaño?', speech: '¿Cuál tiene otro tamaño?' },
    'special': { visual: '✨ ¡Encuentra los dos!', speech: '¡Encuentra los dos diferentes!' },
    'category': { visual: '👀 ¿Cuál es diferente?', speech: '¿Cuál es diferente?' }
};

let currentAdventure = [];
let currentDiffLevel = 0; // Se mantiene por compatibilidad, actúa como índice en currentAdventure
let game1Instance = null;
let lastCorrectIndex = -1;

function getRecentChallengeIds() {
    try {
        const stored = localStorage.getItem('juegosSofi_game1_adventure_v1');
        return stored ? JSON.parse(stored) : [];
    } catch(e) {
        return [];
    }
}

function saveRecentChallengeIds(ids) {
    try {
        localStorage.setItem('juegosSofi_game1_adventure_v1', JSON.stringify(ids));
    } catch(e) {}
}

function buildAdventure() {
    let recentIds = getRecentChallengeIds();
    let adventure = [];
    
    let pool = [...challengePool];
    // Mezclar el pool
    Phaser.Utils.Array.Shuffle(pool);
    
    // Filtrar un poco los recientes si tenemos muchos, sino relajar
    let freshPool = pool.filter(c => !recentIds.includes(c.id));
    if (freshPool.length < 10) {
        freshPool = pool;
    }
    
    // Estrategia: agarrar 10 challenges balanceados
    let typesAdded = { 'object': 0, 'color': 0, 'orientation': 0, 'size': 0, 'category': 0, 'memory': 0, 'pattern': 0, 'findAll': 0 };
    let lastType = null;
    let consecutiveTypeCount = 0;
    
    for (let c of freshPool) {
        if (adventure.length >= 10) break;
        
        // Regla: no más de 2 seguidos del mismo type
        if (lastType === c.type) {
            consecutiveTypeCount++;
            if (consecutiveTypeCount >= 2) continue;
        } else {
            consecutiveTypeCount = 0;
        }
        
        adventure.push(c);
        typesAdded[c.type] = (typesAdded[c.type] || 0) + 1;
        lastType = c.type;
    }
    
    // Si por filtros no llegamos a 10 (raro), metemos randoms
    while (adventure.length < 10) {
        let fallback = Phaser.Utils.Array.GetRandom(challengePool);
        adventure.push(fallback);
    }
    
    // Ordenar ligeramente por dificultad
    adventure.sort((a, b) => {
        let diffA = a.difficulty || 1;
        let diffB = b.difficulty || 1;
        return diffA - diffB; // Fáciles primero
    });
    
    // Rondas 5 y 10 son especiales
    adventure[4] = { ...adventure[4], special: true };
    adventure[9] = { ...adventure[9], special: true };
    
    // Guardar los nuevos en el historial
    let newRecents = adventure.map(c => c.id);
    saveRecentChallengeIds(newRecents);
    
    return adventure;
}

if (typeof btnGame1 !== 'undefined' && btnGame1) {
    btnGame1.addEventListener('click', startGame1);
}

function startGame1() {
    SofiApp.navigation.goTo('game1');
}

function speakDifferenceInstruction(text) {
    if (typeof window.speechSynthesis === 'undefined') return;
    try {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'es-AR';
        msg.rate = 0.9;
        msg.pitch = 1.05;
        
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            let voice = voices.find(v => v.lang.startsWith('es-AR')) || 
                        voices.find(v => v.lang.startsWith('es-ES')) ||
                        voices.find(v => v.lang.startsWith('es'));
            if (voice) {
                msg.voice = voice;
            }
        }
        
        window.speechSynthesis.speak(msg);
    } catch(e) {}
}

function playDifferenceSound(type) {
    if (typeof audioCtx === 'undefined') return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'error') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'levelComplete') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'milestone') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'final') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.2);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.8);
    }
}

function initGame1Phaser() {
    if (game1Instance) {
        game1Instance.destroy(true);
    }
    
    currentAdventure = buildAdventure();
    currentDiffLevel = 0;
    
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 1000,
        parent: 'diff-game-container',
        backgroundColor: '#ffffff',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [AdventureIntroScene, FindDifferenceScene, FinalCelebrationScene1]
    };

    game1Instance = new Phaser.Game(config);
}

function createCardVisual(scene, item, size) {
    if (item.type === 'object' || item.type === 'category' || item.type === 'memory' || item.type === 'pattern' || item.type === 'findAll') {
        const fontSize = Math.floor(size * 0.5) + 'px';
        return scene.add.text(0, 0, item.symbol, { fontSize: fontSize }).setOrigin(0.5);
    } else if (item.type === 'color') {
        const radius = Math.floor(size * 0.35);
        return scene.add.circle(0, 0, radius, item.color);
    } else if (item.type === 'orientation') {
        const fontSize = Math.floor(size * 0.5) + 'px';
        const txt = scene.add.text(0, 0, item.symbol, { fontSize: fontSize, color: '#333' }).setOrigin(0.5);
        txt.angle = item.rotation;
        return txt;
    } else if (item.type === 'size') {
        const fontSize = Math.floor(size * 0.5) + 'px';
        const txt = scene.add.text(0, 0, item.symbol, { fontSize: fontSize }).setOrigin(0.5);
        txt.scale = item.scale;
        return txt;
    }
    return scene.add.text(0, 0, '?', { fontSize: '20px' }).setOrigin(0.5);
}

// =========================================
// PHASER SCENES
// =========================================

class AdventureIntroScene extends Phaser.Scene {
    constructor() {
        super('AdventureIntroScene');
    }
    create() {
        this.cameras.main.setBackgroundColor('#fff');
        const t = this.add.text(400, 500, '🌈 ¡La aventura de Sofi!', {
            fontSize: '50px', color: '#ffb3ba', fontFamily: 'Nunito, sans-serif', stroke: '#fff', strokeThickness: 8, fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0);
        
        speakDifferenceInstruction("¡Vamos de aventura, Sofi!");
        
        this.tweens.add({
            targets: t, scale: 1, duration: 400, ease: 'Back.out', hold: 1000, yoyo: true,
            onComplete: () => {
                this.scene.start('FindDifferenceScene');
            }
        });
    }
}

// Fondos visuales (Fase 8C.3). Solo representación: posiciones, hitSize, casillas y feedback no cambian.
const DIFF_BG_PATH = '/assets/backgrounds/differences/';
const DIFF_BACKGROUNDS = {
    general: { key: 'diff-bg', file: 'diff-bg.webp' },
    park: { key: 'diff-scene-park', file: 'diff-scene-park.webp' },
    ocean: { key: 'diff-scene-ocean', file: 'diff-scene-ocean.webp' },
    // Regenerado sin planetas, lunas ni estrellas grandes: no compite con los distractores 🪐 🌙 ⭐ de cat-space.
    space: { key: 'diff-scene-space', file: 'diff-scene-space.webp' }
};

class FindDifferenceScene extends Phaser.Scene {
    constructor() {
        super('FindDifferenceScene');
    }

    // Fondo de la ronda actual: 'general' para grid/memory/pattern, el tema para las escenas.
    getBackgroundConfig() {
        const presentation = this.levelData.presentation || 'grid';
        return presentation === 'scene' ? DIFF_BACKGROUNDS[this.levelData.theme] : DIFF_BACKGROUNDS.general;
    }

    preload() {
        // La escena se reinicia en cada ronda: se carga solo el fondo que falta.
        const bg = this.getBackgroundConfig();
        if (bg && !this.textures.exists(bg.key)) this.load.image(bg.key, DIFF_BG_PATH + bg.file);
    }

    // Imagen de fondo (no interactiva) detrás de todo. Devuelve false si no hay textura (legacy).
    addBackgroundImage() {
        const bg = this.getBackgroundConfig();
        if (!bg || !this.textures.exists(bg.key)) return false;
        this.add.image(0, 0, bg.key).setOrigin(0, 0).setDisplaySize(800, 1000).setDepth(-20);
        return true;
    }

    init() {
        this.levelData = currentAdventure[currentDiffLevel];
        this.cols = this.levelData.cols || 3;
        this.rows = this.levelData.rows || 4;
        
        this.updateProgressIndicator();
        this.isLocked = true;
        this.resetHintTimer();
    }
    
    updateProgressIndicator() {
        if (levelTitle1) {
            const stars = '⭐'.repeat(currentDiffLevel) + '○'.repeat(10 - currentDiffLevel);
            levelTitle1.innerHTML = `Ronda ${currentDiffLevel + 1} / 10<br><span style="font-size: 0.6em; letter-spacing: 2px;">${stars}</span>`;
        }
    }
    
    resetHintTimer() {
        if (this.hintTimer) this.hintTimer.remove();
        this.hintStage = 0;
        // Don't auto start if memory observation
        if (this.levelData.presentation !== 'memory') {
            this.startNextHintTimer();
        }
    }
    
    startNextHintTimer() {
        if (this.hintTimer) this.hintTimer.remove();
        let delay = 8000;
        if (this.hintStage === 1) delay = 7000;
        if (this.hintStage === 2) delay = 10000;
        if (this.hintStage > 2) return;
        
        this.hintTimer = this.time.delayedCall(delay, this.showHint, [], this);
    }
    
    showHint() {
        if (this.isLocked || !this.correctContainers || this.correctContainers.length === 0) return;
        
        this.hintStage++;
        
        if (this.hintStage === 1) {
            // Contextual speech hint
            let speech = this.levelData.hintSpeech;
            if (!speech) {
                if (this.levelData.type === 'size') speech = 'Mira cuál tiene otro tamaño.';
                else if (this.levelData.type === 'pattern') speech = 'Mira cómo se repiten.';
                else if (this.levelData.type === 'findAll') speech = 'Busca uno por uno.';
                else speech = 'Mira con atención.';
            }
            speakDifferenceInstruction(speech);
        }
        
        if (this.levelData.type === 'pattern' && this.hintStage === 1) {
            // Pattern pulse on sequence
            if (this.patternSequenceGroup) {
                this.patternSequenceGroup.getChildren().forEach(c => {
                    this.tweens.add({ targets: c, scale: 1.1, duration: 300, yoyo: true, repeat: 1 });
                });
            }
        } else {
            this.correctContainers.forEach(container => {
                if (container.alreadyFound) return;
                
                if (container.hintTween && container.hintTween.isPlaying()) container.hintTween.stop();
                
                let scaleTarget = 1.04;
                if (this.hintStage >= 2) scaleTarget = 1.08;
                
                container.hintTween = this.tweens.add({
                    targets: container, scale: scaleTarget, duration: 300, yoyo: true, repeat: 1
                });
                
                if (this.hintStage === 2) {
                    const bg = container.list[0];
                    this.tweens.add({ targets: bg, alpha: 0.5, duration: 200, yoyo: true, repeat: 2 });
                }
                
                if (this.hintStage === 3) {
                    this.showParticles(container.x, container.y, '✨', 1);
                }
            });
        }
        
        this.startNextHintTimer();
    }

    create() {
        this.presentation = this.levelData.presentation || 'grid';
        this.cardContainersGroup = this.add.group();
        this.correctContainers = [];
        this.foundCount = 0;
        
        const isSpecial = !!this.levelData.special;
        
        if (this.levelData.type === 'findAll') {
            this.numDifferent = this.levelData.items.filter(it => it.isCorrect).length;
        } else if (this.levelData.type === 'memory' || this.levelData.type === 'pattern') {
            this.numDifferent = 1; // Un hit correcto de las opciones (incluso en multiple memory target, the option clicked is what matters)
            if(this.levelData.type === 'memory') {
               // En memory, necesitamos encontrar todos los targets si hay varios en opciones
               this.numDifferent = this.levelData.options.filter(it => it.isCorrect).length;
            }
        } else {
            this.numDifferent = isSpecial ? 2 : 1;
        }
        
        if (this.presentation === 'scene') {
            this.createSceneLevel();
        } else if (this.presentation === 'memory') {
            this.createMemoryLevel();
        } else if (this.presentation === 'pattern') {
            this.createPatternLevel();
        } else {
            this.createGridLevel();
        }
        
        this.speakerBtn = this.add.text(730, 80, '🔊', { fontSize: '40px' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);
            
        this.speakerBtn.on('pointerdown', () => {
            if (this.isLocked && this.presentation !== 'memory') return; // Allow speaker during memory observation? No, better wait
            const ins = this.levelData.instruction || (isSpecial ? levelInstructions['special'] : levelInstructions[this.levelData.type]);
            speakDifferenceInstruction(ins.speech);
            this.tweens.add({ targets: this.speakerBtn, scale: 1.2, duration: 100, yoyo: true });
        });

        this.startLevelPresentation(isSpecial);
    }
    
    // ... Scene Level
    createSceneLevel() {
        const theme = this.levelData.theme;
        let positions = [];
        let hitSize = 120;
        // 8C.3: con fondo ilustrado se omite SOLO la decoración emoji legacy (profundidad negativa).
        // Posiciones, hitSize y objetos jugables no cambian. Sin textura: escena legacy completa.
        const hasBg = this.addBackgroundImage();

        if (theme === 'park') {
            this.cameras.main.setBackgroundColor('#87ceeb');
            if (!hasBg) {
                this.add.rectangle(400, 800, 800, 500, 0xa5d6a7).setDepth(-10);
                let n1 = this.add.text(200, 180, '☁️', { fontSize: '100px' }).setDepth(-5).setAlpha(0.8);
                let n2 = this.add.text(600, 130, '☁️', { fontSize: '120px' }).setDepth(-5).setAlpha(0.8);
                this.tweens.add({ targets: [n1, n2], x: '+=20', duration: 4000, yoyo: true, repeat: -1 });
                this.add.text(400, 100, '☀️', { fontSize: '150px' }).setDepth(-6);
                this.add.text(120, 650, '🌳', { fontSize: '140px' }).setDepth(-5);
                this.add.text(720, 580, '🌳', { fontSize: '110px' }).setDepth(-5);
                this.add.text(400, 600, '🌸', { fontSize: '60px' }).setDepth(-5);
            }

            positions = [{x: 280, y: 550}, {x: 520, y: 500}, {x: 400, y: 730}, {x: 200, y: 800}, {x: 600, y: 780}];
            hitSize = 140;
        } else if (theme === 'ocean') {
            this.cameras.main.setBackgroundColor('#64b5f6');
            if (!hasBg) {
                for(let i=0; i<6; i++) {
                    let p = this.add.text(Phaser.Math.Between(100, 700), Phaser.Math.Between(300, 800), '🫧', { fontSize: Phaser.Math.Between(40,80)+'px' }).setDepth(-5);
                    this.tweens.add({ targets: p, y: '-=50', duration: Phaser.Math.Between(3000, 5000), yoyo: true, repeat: -1 });
                }
                this.add.text(400, 850, '🌿', { fontSize: '120px' }).setDepth(-5);
                this.add.text(200, 880, '🐚', { fontSize: '80px' }).setDepth(-5);
            }
            positions = [{x: 250, y: 350}, {x: 550, y: 300}, {x: 400, y: 500}, {x: 200, y: 700}, {x: 600, y: 700}];
            hitSize = 140;
        } else if (theme === 'space') {
            this.cameras.main.setBackgroundColor('#1a237e');
            if (!hasBg) {
                for(let i=0; i<15; i++) {
                    let p = this.add.text(Phaser.Math.Between(50,750), Phaser.Math.Between(150,850), '✨', { fontSize: Phaser.Math.Between(20,50)+'px' }).setDepth(-10);
                    this.tweens.add({ targets: p, alpha: 0.2, duration: Phaser.Math.Between(1000, 2000), yoyo: true, repeat: -1 });
                }
                this.add.text(650, 250, '🪐', { fontSize: '100px' }).setDepth(-5);
            }
            positions = [{x: 250, y: 350}, {x: 500, y: 400}, {x: 350, y: 550}, {x: 180, y: 700}, {x: 620, y: 650}, {x: 450, y: 780}];
            hitSize = 130;
        }
        
        let items = [...this.levelData.items];
        Phaser.Utils.Array.Shuffle(items);
        
        for (let i = 0; i < items.length; i++) {
            const itemData = items[i];
            const pos = positions[i];
            const container = this.add.container(pos.x, pos.y);
            const bg = this.add.circle(0, 0, hitSize / 2, 0xffffff, 0); 
            itemData.type = itemData.type || 'category';
            
            // Map isDifferent legacy
            itemData.isCorrect = itemData.isCorrect ?? itemData.isDifferent;
            
            const visual = createCardVisual(this, itemData, hitSize);
            container.add([bg, visual]);
            container.setSize(hitSize, hitSize);
            container.setInteractive({ useHandCursor: true });
            
            if (itemData.isCorrect) this.correctContainers.push(container);
            
            container.alpha = 0;
            container.idleTween = this.tweens.add({
                targets: container, y: pos.y + Phaser.Math.Between(-4, 4), duration: Phaser.Math.Between(1500, 2500), yoyo: true, repeat: -1, ease: 'Sine.inOut'
            });
            container.on('pointerdown', () => this.handleAnswer(container, bg, itemData.isCorrect));
            this.cardContainersGroup.add(container);
        }
    }
    
    createGridLevel() {
        this.cameras.main.setBackgroundColor('#ffffff');
        this.addBackgroundImage(); // 8C.3: fondo ilustrado; el blanco queda como fallback
        
        let items = [];
        if (this.levelData.type === 'findAll') {
            items = [...this.levelData.items];
        } else {
            let totalCards = this.cols * this.rows;
            for (let i = 0; i < totalCards - this.numDifferent; i++) items.push(this.createItemData(false));
            for (let i = 0; i < this.numDifferent; i++) items.push(this.createItemData(true));
        }
        
        Phaser.Utils.Array.Shuffle(items);

        const totalW = 800; const totalH = 800; const startYBase = 200;
        const cardWidth = Math.min(200, (totalW - 100) / this.cols);
        const cardHeight = Math.min(200, totalH / this.rows);
        const size = Math.min(cardWidth, cardHeight) - 10;
        const spacingX = size + 10; const spacingY = size + 10;
        const gridWidth = (this.cols - 1) * spacingX; const gridHeight = (this.rows - 1) * spacingY;
        const startX = (800 - gridWidth) / 2; const startY = startYBase + (totalH - gridHeight) / 2 - 50;

        let index = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (index >= items.length) break;
                const itemData = items[index];
                itemData.type = itemData.type || this.levelData.type;
                itemData.isCorrect = itemData.isCorrect ?? itemData.isDifferent;
                
                const x = startX + (c * spacingX); const y = startY + (r * spacingY);
                const container = this.add.container(x, y);
                const bg = this.add.rectangle(0, 0, size - 10, size - 10, 0xf0f0f0, 1);
                bg.setStrokeStyle(4, 0xdddddd);
                const visual = createCardVisual(this, itemData, size);
                container.add([bg, visual]);
                container.setSize(size - 10, size - 10);
                container.setInteractive({ useHandCursor: true });
                
                if (itemData.isCorrect) this.correctContainers.push(container);
                
                container.alpha = 0;
                let floatAmp = (this.cols >= 4) ? 2 : 5;
                container.idleTween = this.tweens.add({
                    targets: container, y: y + Phaser.Math.Between(-floatAmp, floatAmp), duration: Phaser.Math.Between(1500, 2500), yoyo: true, repeat: -1, ease: 'Sine.inOut'
                });
                container.on('pointerdown', () => this.handleAnswer(container, bg, itemData.isCorrect));
                this.cardContainersGroup.add(container);
                index++;
            }
        }
    }
    
    createMemoryLevel() {
        this.cameras.main.setBackgroundColor('#ffffff');
        this.addBackgroundImage(); // 8C.3: fondo ilustrado; el blanco queda como fallback
        
        // Memory has two phases: Observation and Options
        // For observation, we show `items` directly in the center
        this.memoryObservationGroup = this.add.group();
        let obsItems = this.levelData.items;
        
        let startX = 400 - ((obsItems.length - 1) * 150) / 2;
        for(let i=0; i<obsItems.length; i++) {
            let itemData = { type: 'memory', symbol: obsItems[i].symbol };
            let visual = createCardVisual(this, itemData, 150);
            visual.setPosition(startX + i * 150, 450);
            visual.alpha = 0;
            this.memoryObservationGroup.add(visual);
        }
        
        // We also prepare the options (but hidden)
        let options = [...this.levelData.options];
        Phaser.Utils.Array.Shuffle(options);
        
        let cols = options.length;
        let startXOpt = 400 - ((cols - 1) * 200) / 2;
        
        for(let i=0; i<options.length; i++) {
            let itemData = options[i];
            itemData.type = 'memory';
            let container = this.add.container(startXOpt + i * 200, 500);
            const bg = this.add.rectangle(0, 0, 160, 160, 0xf0f0f0, 1);
            bg.setStrokeStyle(4, 0xdddddd);
            const visual = createCardVisual(this, itemData, 150);
            container.add([bg, visual]);
            container.setSize(160, 160);
            container.setInteractive({ useHandCursor: true });
            
            if (itemData.isCorrect) this.correctContainers.push(container);
            
            container.alpha = 0;
            container.on('pointerdown', () => this.handleAnswer(container, bg, itemData.isCorrect));
            this.cardContainersGroup.add(container);
        }
    }
    
    createPatternLevel() {
        this.cameras.main.setBackgroundColor('#ffffff');
        this.addBackgroundImage(); // 8C.3: fondo ilustrado; el blanco queda como fallback
        
        // Pattern Sequence at top
        this.patternSequenceGroup = this.add.group();
        let seq = this.levelData.sequence;
        let startX = 400 - (seq.length * 120) / 2;
        
        for(let i=0; i<seq.length; i++) {
            let txt = this.add.text(startX + i * 120, 300, seq[i], { fontSize: '80px' }).setOrigin(0.5);
            txt.alpha = 0;
            this.patternSequenceGroup.add(txt);
        }
        // Question mark
        let qm = this.add.text(startX + seq.length * 120, 300, '❓', { fontSize: '80px' }).setOrigin(0.5);
        qm.alpha = 0;
        this.patternSequenceGroup.add(qm);
        
        // Options below
        let options = [...this.levelData.options];
        Phaser.Utils.Array.Shuffle(options);
        
        let cols = options.length;
        let startXOpt = 400 - ((cols - 1) * 200) / 2;
        
        for(let i=0; i<options.length; i++) {
            let itemData = options[i];
            itemData.type = 'pattern';
            let container = this.add.container(startXOpt + i * 200, 600);
            const bg = this.add.rectangle(0, 0, 160, 160, 0xf0f0f0, 1);
            bg.setStrokeStyle(4, 0xdddddd);
            const visual = createCardVisual(this, itemData, 150);
            container.add([bg, visual]);
            container.setSize(160, 160);
            container.setInteractive({ useHandCursor: true });
            
            if (itemData.isCorrect) this.correctContainers.push(container);
            
            container.alpha = 0;
            container.on('pointerdown', () => this.handleAnswer(container, bg, itemData.isCorrect));
            this.cardContainersGroup.add(container);
        }
    }
    
    createItemData(isCorrect) {
        let ld = this.levelData;
        if (ld.type === 'object') {
            return { type: 'object', symbol: isCorrect ? ld.different : ld.normal, isCorrect: isCorrect };
        } else if (ld.type === 'color') {
            return { type: 'color', color: isCorrect ? ld.differentColor : ld.normalColor, isCorrect: isCorrect };
        } else if (ld.type === 'orientation') {
            return { type: 'orientation', symbol: ld.symbol, rotation: isCorrect ? ld.differentRotation : ld.normalRotation, isCorrect: isCorrect };
        } else if (ld.type === 'size') {
            return { type: 'size', symbol: ld.symbol, scale: isCorrect ? ld.differentScale : ld.normalScale, isCorrect: isCorrect };
        }
        return { type: 'object', symbol: '?', isCorrect: isCorrect };
    }
    
    startLevelPresentation(isSpecial) {
        const cx = 400;
        if (isSpecial) {
            const specialText = this.add.text(cx, 400, '✨ ¡RONDA SORPRESA! ✨', {
                fontSize: '50px', color: '#ab47bc', fontFamily: 'Nunito, sans-serif', stroke: '#fff', strokeThickness: 8, fontStyle: 'bold'
            }).setOrigin(0.5).setScale(0);
            
            this.tweens.add({
                targets: specialText, scale: 1, duration: 400, ease: 'Back.out',
                onComplete: () => {
                    this.time.delayedCall(800, () => {
                        this.tweens.add({
                            targets: specialText, scale: 0, duration: 300, ease: 'Back.in',
                            onComplete: () => { specialText.destroy(); this.showInstruction(); }
                        });
                    });
                }
            });
        } else {
            this.time.delayedCall(200, () => this.showInstruction());
        }
    }
    
    showInstruction() {
        const isSpecial = !!this.levelData.special;
        
        let ins = this.levelData.instruction || (isSpecial ? levelInstructions['special'] : levelInstructions[this.levelData.type]);
        
        if (this.presentation === 'memory') {
            ins = { visual: '👀 ¡Mira bien!', speech: 'Mira bien.' };
        }
        
        const cx = 400;
        const insText = this.add.text(cx, 400, ins.visual, {
            fontSize: '55px', color: '#333', fontFamily: 'Nunito, sans-serif', stroke: '#fff', strokeThickness: 8, fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0);
        
        speakDifferenceInstruction(ins.speech);
        
        this.tweens.add({
            targets: insText, scale: 1, duration: 400, ease: 'Back.out',
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    this.tweens.add({
                        targets: insText, y: 80, scale: 0.6, duration: 500, ease: 'Cubic.out',
                        onComplete: () => {
                            if (this.presentation !== 'memory') {
                                this.tweens.add({ targets: this.speakerBtn, alpha: 1, duration: 300 });
                            }
                            this.revealLevel(insText);
                        }
                    });
                });
            }
        });
    }
    
    revealLevel(insText) {
        if (this.presentation === 'memory') {
            // Memory Observation Phase
            let obsItems = this.memoryObservationGroup.getChildren();
            this.tweens.add({ targets: obsItems, alpha: 1, scale: {from: 0, to: 1}, duration: 400, ease: 'Back.out', delay: this.tweens.stagger(100) });
            
            this.time.delayedCall(this.levelData.observationTime || 3000, () => {
                this.tweens.add({
                    targets: obsItems, alpha: 0, scale: 0, duration: 300,
                    onComplete: () => {
                        this.memoryObservationGroup.clear(true, true);
                        // Change Instruction
                        let actualIns = this.levelData.instruction;
                        insText.setText(actualIns.visual);
                        speakDifferenceInstruction(actualIns.speech);
                        
                        this.tweens.add({ targets: this.speakerBtn, alpha: 1, duration: 300 });
                        
                        // Reveal options
                        let opts = this.cardContainersGroup.getChildren();
                        this.tweens.add({ targets: opts, alpha: 1, scale: {from: 0, to: 1}, duration: 400, ease: 'Back.out', delay: this.tweens.stagger(100) });
                        
                        this.time.delayedCall(opts.length * 100 + 400, () => {
                            this.isLocked = false;
                            this.startNextHintTimer();
                        });
                    }
                });
            });
            
        } else if (this.presentation === 'pattern') {
            let seq = this.patternSequenceGroup.getChildren();
            this.tweens.add({ targets: seq, alpha: 1, scale: {from: 0, to: 1}, duration: 400, ease: 'Back.out', delay: this.tweens.stagger(100) });
            
            let opts = this.cardContainersGroup.getChildren();
            this.tweens.add({ targets: opts, alpha: 1, scale: {from: 0, to: 1}, duration: 400, ease: 'Back.out', delay: seq.length * 100 + this.tweens.stagger(100) });
            
            this.time.delayedCall(seq.length * 100 + opts.length * 100 + 400, () => {
                this.isLocked = false;
                this.startNextHintTimer();
            });
            
        } else {
            let index = 0;
            this.cardContainersGroup.getChildren().forEach(container => {
                this.tweens.add({ targets: container, alpha: 1, duration: 200, delay: index * 50 });
                container.setScale(0);
                this.tweens.add({ targets: container, scale: 1, duration: 400, ease: 'Back.out', delay: index * 50 });
                index++;
            });
            
            this.time.delayedCall(index * 50 + 400, () => {
                this.isLocked = false;
                this.resetHintTimer();
            });
        }
    }

    handleAnswer(container, bg, isCorrect) {
        if (this.isLocked || container.alreadyFound) return;
        playDifferenceSound('tap');

        if (isCorrect) {
            container.alreadyFound = true;
            this.foundCount++;
            
            if (this.hintTimer) this.hintTimer.remove();
            
            bg.setFillStyle(0xa5d6a7, 1);
            if (this.presentation === 'grid' || this.presentation === 'memory' || this.presentation === 'pattern') {
                bg.setStrokeStyle(6, 0x4caf50);
            }
            bg.alpha = 1;
            
            if (container.hintTween && container.hintTween.isPlaying()) container.hintTween.stop();
            if (container.idleTween && container.idleTween.isPlaying()) container.idleTween.stop();
            if (container.errorTween && container.errorTween.isPlaying()) container.errorTween.stop();
            
            this.tweens.add({ targets: container, scale: 1.3, angle: 10, duration: 400, yoyo: true, ease: 'Bounce.out' });
            this.showParticles(container.x, container.y, '⭐', 8);
            
            let isLevelComplete = (this.foundCount === this.numDifferent);
            
            if (isLevelComplete) {
                this.isLocked = true;
                playDifferenceSound('success');
                if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
                
                const messages = ['¡MUY BIEN!', '¡GENIAL!', '¡EXCELENTE!', '¡BRAVO!', '¡QUÉ BIEN!', '¡LO ENCONTRASTE!'];
                const randomMsg = Phaser.Math.RND.pick(messages);
                
                const msg = this.add.text(400, 500, randomMsg, {
                    fontSize: '80px', color: '#ffb3ba', fontFamily: 'Nunito, sans-serif', stroke: '#fff', strokeThickness: 10, fontStyle: 'bold'
                }).setOrigin(0.5).setScale(0);
                msg.setDepth(100);
                
                this.tweens.add({
                    targets: msg, scale: 1, duration: 500, ease: 'Back.out', yoyo: true, hold: 1200,
                    onComplete: () => {
                        playDifferenceSound('levelComplete');
                        const isMilestone = (currentDiffLevel === 2 || currentDiffLevel === 5 || currentDiffLevel === 8);
                        if (isMilestone) {
                            this.showMilestone(currentDiffLevel, () => this.advanceLevel());
                        } else {
                            this.advanceLevel();
                        }
                    }
                });
            } else {
                playDifferenceSound('success');
                this.resetHintTimer();
            }
        } else {
            if (container.errorTween && container.errorTween.isPlaying()) return;
            
            playDifferenceSound('error');
            bg.setFillStyle(0xfff9c4, 1);
            bg.alpha = 1;
            
            container.errorTween = this.tweens.add({
                targets: container, x: container.x + 10, duration: 50, yoyo: true, repeat: 3,
                onComplete: () => {
                    if (this.presentation === 'scene') {
                        bg.setFillStyle(0xffffff, 0); 
                        bg.alpha = 1;
                    } else {
                        bg.setFillStyle(0xf0f0f0, 1);
                    }
                }
            });
            this.resetHintTimer();
        }
    }
    
    advanceLevel() {
        if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
        
        if (SofiApp.progress) {
            SofiApp.progress.recordEvent(`differences-level-${currentDiffLevel + 1}`);
        }
        
        currentDiffLevel++;
        if (currentDiffLevel < currentAdventure.length) {
            this.scene.restart();
        } else {
            if (SofiApp.progress) {
                SofiApp.progress.unlockSticker('detective');
            }
            this.scene.start('FinalCelebrationScene1');
        }
    }
    
    showMilestone(levelNumber, onComplete) {
        playDifferenceSound('milestone');
        let icon = '⭐';
        if (levelNumber === 5) icon = '🌈';
        if (levelNumber === 8) icon = '🎁';
        
        const milestone = this.add.text(400, 500, icon, { fontSize: '150px' }).setOrigin(0.5).setScale(0);
        milestone.setDepth(150);
        
        this.tweens.add({
            targets: milestone, scale: 1.5, duration: 600, yoyo: true, hold: 800, ease: 'Back.out', onComplete: onComplete
        });
    }
    
    showParticles(x, y, emoji, count) {
        for (let i = 0; i < count; i++) {
            const p = this.add.text(x, y, emoji, { fontSize: '40px' }).setOrigin(0.5);
            p.setDepth(50);
            this.tweens.add({
                targets: p, x: x + Phaser.Math.Between(-100, 100), y: y - Phaser.Math.Between(100, 200), alpha: 0, scale: 1.5, duration: 1000,
                onComplete: () => p.destroy()
            });
        }
    }
}

class FinalCelebrationScene1 extends Phaser.Scene {
    constructor() {
        super('FinalCelebrationScene1');
    }

    create() {
        if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
        
        this.cameras.main.setBackgroundColor('#ffdfba');
        
        const cx = 400; const cy = 500;
        if (levelTitle1) levelTitle1.classList.add('hidden');
        
        this.add.text(cx, cy - 200, '🎉 ¡Terminaste tu aventura! 🎉', { 
            fontSize: '50px', color: '#fff', fontFamily: 'Nunito, sans-serif', stroke: '#000', strokeThickness: 6, fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const apple = this.add.text(cx - 150, cy - 50, '🍒', { fontSize: '120px' }).setOrigin(0.5);
        const dog = this.add.text(cx, cy - 50, '🦊', { fontSize: '120px' }).setOrigin(0.5);
        const sun = this.add.text(cx + 150, cy - 50, '🚀', { fontSize: '120px' }).setOrigin(0.5);
        
        this.tweens.add({
            targets: [apple, dog, sun], y: cy - 80, duration: 500, yoyo: true, repeat: -1, delay: this.tweens.stagger(200)
        });
        
        this.time.addEvent({
            delay: 200,
            callback: () => {
                const emojis = ['⭐', '❤️', '🎉', '🌸', '✨'];
                const p = this.add.text(Phaser.Math.Between(50, 750), 1050, Phaser.Math.RND.pick(emojis), { fontSize: '50px' }).setOrigin(0.5);
                this.tweens.add({
                    targets: p, y: -50, x: p.x + Phaser.Math.Between(-150, 150), duration: 3000, angle: 360, onComplete: () => p.destroy()
                });
            },
            callbackScope: this, loop: true
        });
        
        speakDifferenceInstruction("¡Muy bien Sofi! ¡Terminaste la aventura!");

        const btnBg = this.add.rectangle(cx, cy + 250, 320, 80, 0x4caf50, 1).setInteractive({ useHandCursor: true });
        btnBg.setStrokeStyle(4, 0xffffff);
        
        const btnText = this.add.text(cx, cy + 250, 'OTRA AVENTURA', { 
            fontSize: '30px', fontFamily: 'Nunito, sans-serif', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        btnBg.on('pointerdown', () => {
            this.tweens.add({
                targets: [btnBg, btnText], scale: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    currentAdventure = buildAdventure();
                    currentDiffLevel = 0;
                    if(levelTitle1) levelTitle1.classList.remove('hidden');
                    this.scene.start('AdventureIntroScene');
                }
            });
        });
    }
}

SofiApp.navigation.registerView('game1', {
    onEnter: () => {
        if (levelTitle1) levelTitle1.classList.remove('hidden');
        initGame1Phaser();
    },
    onExit: () => {
        if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
        if (game1Instance) {
            game1Instance.destroy(true);
            game1Instance = null;
        }
    }
});
