// game5.js - JUEGO 5: 🧠 MEMORIA

let game5Instance = null;
let currentMemoryLevel = 1;


let currentMemoryAdventure = [];
let lastMemoryAdventureIds = [];

const MEMORY_CHALLENGES = [
    // PAIRS - ANIMALES 🐾
    { id: 'animals-1', type: 'pairs', theme: 'animals', difficulty: 1, pairCount: 2, coverIcon: '🐾', bgColor: '#e8f5e9', symbols: ['🐶', '🐱', '🐰', '🐼', '🦊', '🐸'] },
    { id: 'animals-2', type: 'pairs', theme: 'animals', difficulty: 2, pairCount: 3, coverIcon: '🐾', bgColor: '#e8f5e9', symbols: ['🐶', '🐱', '🐰', '🐼', '🦊', '🐸'] },
    { id: 'animals-3', type: 'pairs', theme: 'animals', difficulty: 3, pairCount: 4, coverIcon: '🐾', bgColor: '#e8f5e9', symbols: ['🐶', '🐱', '🐰', '🐼', '🦊', '🐸'] },
    // VISUAL - ANIMALES
    { id: 'v-animals-1', type: 'visualRecall', theme: 'animals', difficulty: 1, rememberCount: 2, optionCount: 3, coverIcon: '🐾', bgColor: '#e8f5e9', symbols: ['🐶', '🐱', '🐰', '🐼', '🦊', '🐸'] },
    { id: 'v-animals-2', type: 'visualRecall', theme: 'animals', difficulty: 2, rememberCount: 2, optionCount: 3, coverIcon: '🐾', bgColor: '#e8f5e9', symbols: ['🐶', '🐱', '🐰', '🐼', '🦊', '🐸'] },
    
    // PAIRS - FRUTAS 🍎
    { id: 'fruits-2', type: 'pairs', theme: 'fruits', difficulty: 2, pairCount: 3, coverIcon: '🍃', bgColor: '#fffde7', symbols: ['🍎', '🍓', '🍌', '🍉', '🍊', '🍇'] },
    { id: 'fruits-3', type: 'pairs', theme: 'fruits', difficulty: 3, pairCount: 4, coverIcon: '🍃', bgColor: '#fffde7', symbols: ['🍎', '🍓', '🍌', '🍉', '🍊', '🍇'] },
    { id: 'fruits-4', type: 'pairs', theme: 'fruits', difficulty: 4, pairCount: 5, coverIcon: '🍃', bgColor: '#fffde7', symbols: ['🍎', '🍓', '🍌', '🍉', '🍊', '🍇'] },
    // VISUAL - FRUTAS
    { id: 'v-fruits-2', type: 'visualRecall', theme: 'fruits', difficulty: 2, rememberCount: 2, optionCount: 3, coverIcon: '🍃', bgColor: '#fffde7', symbols: ['🍎', '🍓', '🍌', '🍉', '🍊', '🍇'] },
    { id: 'v-fruits-3', type: 'visualRecall', theme: 'fruits', difficulty: 3, rememberCount: 3, optionCount: 3, coverIcon: '🍃', bgColor: '#fffde7', symbols: ['🍎', '🍓', '🍌', '🍉', '🍊', '🍇'] },
    { id: 'v-fruits-4', type: 'visualRecall', theme: 'fruits', difficulty: 4, rememberCount: 3, optionCount: 4, coverIcon: '🍃', bgColor: '#fffde7', symbols: ['🍎', '🍓', '🍌', '🍉', '🍊', '🍇'] },
    
    // PAIRS - MAR 🌊
    { id: 'sea-3', type: 'pairs', theme: 'sea', difficulty: 3, pairCount: 4, coverIcon: '🌊', bgColor: '#e3f2fd', symbols: ['🐟', '🐙', '🐬', '🦀', '🐳', '🐚'] },
    { id: 'sea-4', type: 'pairs', theme: 'sea', difficulty: 4, pairCount: 5, coverIcon: '🌊', bgColor: '#e3f2fd', symbols: ['🐟', '🐙', '🐬', '🦀', '🐳', '🐚'] },
    { id: 'sea-5', type: 'pairs', theme: 'sea', difficulty: 5, pairCount: 6, coverIcon: '🌊', bgColor: '#e3f2fd', symbols: ['🐟', '🐙', '🐬', '🦀', '🐳', '🐚'] },
    // VISUAL - MAR
    { id: 'v-sea-3', type: 'visualRecall', theme: 'sea', difficulty: 3, rememberCount: 3, optionCount: 3, coverIcon: '🌊', bgColor: '#e3f2fd', symbols: ['🐟', '🐙', '🐬', '🦀', '🐳', '🐚'] },
    { id: 'v-sea-4', type: 'visualRecall', theme: 'sea', difficulty: 4, rememberCount: 3, optionCount: 4, coverIcon: '🌊', bgColor: '#e3f2fd', symbols: ['🐟', '🐙', '🐬', '🦀', '🐳', '🐚'] },
    
    // PAIRS - VEHÍCULOS 🚗
    { id: 'vehicles-2', type: 'pairs', theme: 'vehicles', difficulty: 2, pairCount: 3, coverIcon: '⭐', bgColor: '#eceff1', symbols: ['🚗', '🚕', '🚌', '🚲', '🚜', '🚀'] },
    { id: 'vehicles-4', type: 'pairs', theme: 'vehicles', difficulty: 4, pairCount: 5, coverIcon: '⭐', bgColor: '#eceff1', symbols: ['🚗', '🚕', '🚌', '🚲', '🚜', '🚀'] },
    { id: 'vehicles-5', type: 'pairs', theme: 'vehicles', difficulty: 5, pairCount: 6, coverIcon: '⭐', bgColor: '#eceff1', symbols: ['🚗', '🚕', '🚌', '🚲', '🚜', '🚀'] },
    // VISUAL - VEHÍCULOS
    { id: 'v-vehicles-3', type: 'visualRecall', theme: 'vehicles', difficulty: 3, rememberCount: 3, optionCount: 3, coverIcon: '⭐', bgColor: '#eceff1', symbols: ['🚗', '🚕', '🚌', '🚲', '🚜', '🚀'] },
    { id: 'v-vehicles-5', type: 'visualRecall', theme: 'vehicles', difficulty: 5, rememberCount: 4, optionCount: 4, coverIcon: '⭐', bgColor: '#eceff1', symbols: ['🚗', '🚕', '🚌', '🚲', '🚜', '🚀'] },
    
    // PAIRS - CIELO / ESPACIO ⭐
    { id: 'sky-4', type: 'pairs', theme: 'sky', difficulty: 4, pairCount: 5, coverIcon: '⭐', bgColor: '#f3e5f5', symbols: ['☀️', '🌙', '⭐', '🌈', '☁️', '⚡'] },
    { id: 'sky-5', type: 'pairs', theme: 'sky', difficulty: 5, pairCount: 6, coverIcon: '⭐', bgColor: '#f3e5f5', symbols: ['☀️', '🌙', '⭐', '🌈', '☁️', '⚡'] },
    // VISUAL - CIELO
    { id: 'v-sky-4', type: 'visualRecall', theme: 'sky', difficulty: 4, rememberCount: 3, optionCount: 4, coverIcon: '⭐', bgColor: '#f3e5f5', symbols: ['☀️', '🌙', '⭐', '🌈', '☁️', '⚡'] },
    { id: 'v-sky-5', type: 'visualRecall', theme: 'sky', difficulty: 5, rememberCount: 4, optionCount: 4, coverIcon: '⭐', bgColor: '#f3e5f5', symbols: ['☀️', '🌙', '⭐', '🌈', '☁️', '⚡'] },
    
    // PAIRS - NATURALEZA 🌸
    { id: 'nature-1', type: 'pairs', theme: 'nature', difficulty: 1, pairCount: 2, coverIcon: '🌸', bgColor: '#fce4ec', symbols: ['🌸', '🌻', '🌳', '🍄', '🦋', '🐞'] },
    { id: 'nature-2', type: 'pairs', theme: 'nature', difficulty: 2, pairCount: 3, coverIcon: '🌸', bgColor: '#fce4ec', symbols: ['🌸', '🌻', '🌳', '🍄', '🦋', '🐞'] },
    { id: 'nature-3', type: 'pairs', theme: 'nature', difficulty: 3, pairCount: 4, coverIcon: '🌸', bgColor: '#fce4ec', symbols: ['🌸', '🌻', '🌳', '🍄', '🦋', '🐞'] },
    // VISUAL - NATURALEZA
    { id: 'v-nature-1', type: 'visualRecall', theme: 'nature', difficulty: 1, rememberCount: 2, optionCount: 3, coverIcon: '🌸', bgColor: '#fce4ec', symbols: ['🌸', '🌻', '🌳', '🍄', '🦋', '🐞'] },
    { id: 'v-nature-2', type: 'visualRecall', theme: 'nature', difficulty: 2, rememberCount: 2, optionCount: 3, coverIcon: '🌸', bgColor: '#fce4ec', symbols: ['🌸', '🌻', '🌳', '🍄', '🦋', '🐞'] },
    { id: 'v-nature-5', type: 'visualRecall', theme: 'nature', difficulty: 5, rememberCount: 4, optionCount: 4, coverIcon: '🌸', bgColor: '#fce4ec', symbols: ['🌸', '🌻', '🌳', '🍄', '🦋', '🐞'] },
];

const PREVIEW_BY_DIFFICULTY = {
    1: 2000,
    2: 1600,
    3: 1300,
    4: 1100,
    5: 1000
};

function validateMemoryChallenges() {
    MEMORY_CHALLENGES.forEach(c => {
        if (!c.id || !c.theme || !c.difficulty || !c.bgColor || !c.coverIcon) {
            console.error('Challenge missing field:', c);
        }
        const isVisual = (c.type === 'visualRecall');
        if (isVisual) {
            if (!c.rememberCount || !c.optionCount) console.error('Visual missing count:', c.id);
            if (c.symbols.length < c.rememberCount + c.optionCount - 1) console.error('Not enough symbols in visual:', c.id);
        } else {
            if (!c.pairCount) console.error('Pairs missing pairCount:', c.id);
            if (c.symbols.length < c.pairCount) console.error('Not enough symbols in pairs:', c.id);
        }
        const uniqueSymbols = new Set(c.symbols);
        if (uniqueSymbols.size !== c.symbols.length) {
            console.error('Duplicate symbols in challenge:', c.id);
        }
    });
}
validateMemoryChallenges();


let memoryVisualIntroShown = false;

const MEMORY_ROUND_TYPES = [
    'pairs',
    'visualRecall',
    'pairs',
    'visualRecall',
    'pairs'
];

const VISUAL_PREVIEW_BY_DIFFICULTY = {
    1: 2800,
    2: 2500,
    3: 2300,
    4: 2100,
    5: 2000
};

function buildMemoryAdventure() {
    let adventure = [];
    let usedThemes = [];
    
    for (let diff = 1; diff <= 5; diff++) {
        const requiredType = MEMORY_ROUND_TYPES[diff - 1];
        
        let candidates = MEMORY_CHALLENGES.filter(c => 
            c.difficulty === diff && 
            (c.type || 'pairs') === requiredType
        );
        
        // If we don't have exact difficulty match for this type, search near difficulty
        if (candidates.length === 0) {
            candidates = MEMORY_CHALLENGES.filter(c => (c.type || 'pairs') === requiredType);
        }
        
        const lastTheme = usedThemes.length > 0 ? usedThemes[usedThemes.length - 1] : null;
        let preferred = candidates.filter(c => c.theme !== lastTheme);
        
        let filtered = preferred.filter(c => !lastMemoryAdventureIds.includes(c.id));
        
        if (filtered.length === 0) filtered = preferred;
        if (filtered.length === 0) filtered = candidates;
        
        const chosen = filtered[Math.floor(Math.random() * filtered.length)];
        
        let round = { ...chosen };
        
        let symbolPool = [...chosen.symbols];
        Phaser.Utils.Array.Shuffle(symbolPool);
        
        if (requiredType === 'pairs') {
            round.previewMs = PREVIEW_BY_DIFFICULTY[diff] || 1500;
            round.pairs = symbolPool.slice(0, chosen.pairCount);
        } else {
            round.previewMs = VISUAL_PREVIEW_BY_DIFFICULTY[diff] || 2500;
        }
        
        adventure.push(round);
        usedThemes.push(round.theme);
    }
    
    lastMemoryAdventureIds = adventure.map(a => a.id);
    return adventure;
}


class MemoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MemoryScene' });
    }

    init() {
        if (!currentMemoryAdventure || currentMemoryAdventure.length === 0) {
            currentMemoryAdventure = buildMemoryAdventure();
        }
        this.levelData = currentMemoryAdventure[currentMemoryLevel - 1];
    }

    create() {
        this.cameras.main.setBackgroundColor(this.levelData.bgColor);
        
        this.inputLocked = true;
        this.isLevelCompleting = false;

        // UI Title
        const titleEl = document.getElementById('memory-level-title');
        if (titleEl) {
            let progressDots = Array(5).fill('○');
            for(let i=0; i<currentMemoryLevel; i++) progressDots[i] = '⭐';
            const typeIcon = (this.levelData.type === 'visualRecall') ? '👀' : '🃏';
            titleEl.innerText = `${typeIcon} ${this.levelData.coverIcon} Nivel ${currentMemoryLevel} / 5  ${progressDots.join(' ')}`;
        }

        const type = this.levelData.type || 'pairs';
        if (type === 'pairs') {
            this.setupPairsRound();
        } else {
            this.setupVisualRecallRound();
        }
    }

    setupPairsRound() {
        this.firstCard = null;
        this.secondCard = null;
        this.matchedPairs = 0;
        this.totalPairs = this.levelData.pairs.length;
        
        this.cards = [];
        this.hintTimer = null;
        this.lastHintPairId = null;
        this.hintTweens = [];

        let deck = [...this.levelData.pairs, ...this.levelData.pairs];
        Phaser.Utils.Array.Shuffle(deck);

        this.createGrid(deck);

        if (currentMemoryLevel === 1) {
            SofiApp.audio.speak('¡Encuentra las parejas!');
        } else {
            SofiApp.audio.speak('¡Mira bien!');
        }

        if (this.levelData.previewMs > 0) {
            this.time.delayedCall(this.levelData.previewMs, () => {
                this.hideAllCards();
                this.inputLocked = false;
                this.resetHintTimer();
            });
        } else {
            this.hideAllCards();
            this.inputLocked = false;
            this.resetHintTimer();
        }
    }


    setupVisualRecallRound() {
        this.recallObjects = [];
        this.recallRecallsPerRound = (this.levelData.difficulty >= 3) ? 3 : 2;
        this.currentRecallIndex = 0;
        
        if (!memoryVisualIntroShown) {
            memoryVisualIntroShown = true;
            this.time.delayedCall(300, () => {
                const cx = this.scale.width / 2;
                const cy = this.scale.height / 2;
                const txt = this.add.text(cx, cy, '👀 ¡Mira bien!', {
                    fontSize: '48px',
                    fontFamily: 'Nunito, sans-serif',
                    color: '#333333',
                    fontWeight: 'bold'
                }).setOrigin(0.5);
                
                SofiApp.audio.speak('¡Mira bien y recuerda!');
                
                this.time.delayedCall(1200, () => {
                    txt.destroy();
                    this.startNextVisualRecall();
                });
            });
        } else {
            this.startNextVisualRecall();
        }
    }

    buildVisualRecallQuestion() {
        let pool = [...this.levelData.symbols];
        Phaser.Utils.Array.Shuffle(pool);
        
        const remCount = this.levelData.rememberCount;
        const optCount = this.levelData.optionCount;
        
        const shownSymbols = pool.slice(0, remCount);
        const targetSymbol = shownSymbols[Math.floor(Math.random() * shownSymbols.length)];
        
        const remainingPool = pool.slice(remCount);
        const distractors = remainingPool.slice(0, optCount - 1);
        
        let options = [targetSymbol, ...distractors];
        Phaser.Utils.Array.Shuffle(options);
        
        return { shownSymbols, targetSymbol, options };
    }

    startNextVisualRecall() {
        if (this.currentRecallIndex >= this.recallRecallsPerRound) {
            this.completeLevel();
            return;
        }
        
        this.clearVisualObjects();
        this.inputLocked = true;
        
        this.currentQuestion = this.buildVisualRecallQuestion();
        
        // Show preview
        this.showVisualPreview(this.currentQuestion.shownSymbols);
        
        if (!memoryVisualIntroShown && this.currentRecallIndex === 0) {
            SofiApp.audio.speak('¡Mira bien!');
        }
        
        const previewTime = this.levelData.previewMs + (memoryVisualIntroShown === false ? 600 : 0);
        
        this.time.delayedCall(previewTime, () => {
            this.transitionToVisualOptions();
        });
    }

    showVisualPreview(symbols) {
        const gw = this.scale.width;
        const gh = this.scale.height;
        const count = symbols.length;
        
        let cols = count, rows = 1;
        if (count === 4) { cols = 2; rows = 2; }
        
        const padding = 60;
        const availableW = gw - (padding * 2);
        const availableH = (gh * 0.6) - padding;
        const cellW = availableW / cols;
        const cellH = availableH / rows;
        const size = Math.min(cellW, cellH) * 0.9;
        const finalSize = Math.min(size, 160);
        
        const startX = (gw - (cols * cellW)) / 2 + (cellW / 2);
        const startY = (gh * 0.45 - (rows * cellH)) / 2 + (cellH / 2);
        
        symbols.forEach((sym, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * cellW;
            const y = startY + row * cellH;
            
            const bg = this.add.graphics();
            bg.fillStyle(0xffffff, 1);
            bg.fillRoundedRect(-finalSize/2, -finalSize/2, finalSize, finalSize, 20);
            bg.lineStyle(4, 0xcccccc, 1);
            bg.strokeRoundedRect(-finalSize/2, -finalSize/2, finalSize, finalSize, 20);
            
            const txt = this.add.text(0, 0, sym, { fontSize: `${finalSize * 0.6}px` }).setOrigin(0.5);
            
            const container = this.add.container(x, y, [bg, txt]);
            this.recallObjects.push(container);
        });
    }

    transitionToVisualOptions() {
        this.recallObjects.forEach(obj => {
            this.tweens.add({
                targets: obj,
                scale: 0,
                alpha: 0,
                duration: 300
            });
        });
        
        this.time.delayedCall(300, () => {
            this.clearVisualObjects();
            
            const cx = this.scale.width / 2;
            const qMark = this.add.text(cx, this.scale.height * 0.25, '❓', { fontSize: '80px' }).setOrigin(0.5);
            this.recallObjects.push(qMark);
            
            SofiApp.audio.speak('¿Cuál estaba?');
            
            this.showVisualOptions(this.currentQuestion.options);
        });
    }

    showVisualOptions(options) {
        const gw = this.scale.width;
        const gh = this.scale.height;
        const count = options.length;
        
        let cols = count, rows = 1;
        if (count === 4) { cols = 2; rows = 2; }
        
        const padding = 40;
        const availableW = gw - (padding * 2);
        const availableH = (gh * 0.5) - padding;
        const cellW = availableW / cols;
        const cellH = availableH / rows;
        const size = Math.min(cellW, cellH) * 0.85;
        const finalSize = Math.min(size, 150);
        
        const startX = (gw - (cols * cellW)) / 2 + (cellW / 2);
        const startY = this.scale.height * 0.6 + (availableH - (rows * cellH)) / 2;
        
        options.forEach((sym, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * cellW;
            const y = startY + row * cellH;
            
            const bg = this.add.graphics();
            bg.fillStyle(0xffffff, 1);
            bg.fillRoundedRect(-finalSize/2, -finalSize/2, finalSize, finalSize, 24);
            bg.lineStyle(4, 0x84b6f4, 1);
            bg.strokeRoundedRect(-finalSize/2, -finalSize/2, finalSize, finalSize, 24);
            
            const txt = this.add.text(0, 0, sym, { fontSize: `${finalSize * 0.5}px` }).setOrigin(0.5);
            
            const container = this.add.container(x, y, [bg, txt]);
            
            const hitArea = new Phaser.Geom.Rectangle(-finalSize/2, -finalSize/2, finalSize, finalSize);
            container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            
            container.on('pointerdown', () => this.handleVisualOptionTap(sym, container));
            
            this.recallObjects.push(container);
            
            // For hints
            if (sym === this.currentQuestion.targetSymbol) {
                this.recallTargetContainer = container;
            }
        });
        
        this.inputLocked = false;
        this.recallAnswerLocked = false;
        
        // Start hint timer
        this.hintTimer = this.time.delayedCall(12000, () => {
            if (!this.recallAnswerLocked && this.recallTargetContainer) {
                this.hintTweens.push(this.tweens.add({
                    targets: this.recallTargetContainer,
                    scale: 1.05,
                    yoyo: true,
                    repeat: -1,
                    duration: 600
                }));
            }
        });
    }

    handleVisualOptionTap(sym, container) {
        if (this.inputLocked || this.recallAnswerLocked) return;
        
        SofiApp.audio.tap();
        
        if (sym === this.currentQuestion.targetSymbol) {
            this.recallAnswerLocked = true;
            this.inputLocked = true;
            if (this.hintTimer) this.hintTimer.destroy();
            this.hintTweens.forEach(t => t.stop());
            
            this.createMatchSparkles(container.x, container.y);
            SofiApp.audio.success();
            
            this.time.delayedCall(1200, () => {
                this.currentRecallIndex++;
                this.startNextVisualRecall();
            });
        } else {
            // Distractor
            this.tweens.add({
                targets: container,
                scale: 0.9,
                yoyo: true,
                duration: 150
            });
            
            // Gentle hint on target
            if (this.recallTargetContainer) {
                this.createMatchSparkles(this.recallTargetContainer.x, this.recallTargetContainer.y);
                this.tweens.add({
                    targets: this.recallTargetContainer,
                    scale: 1.1,
                    yoyo: true,
                    duration: 300
                });
            }
            this.recallAnswerLocked = true;
            this.inputLocked = true;
            if (this.hintTimer) this.hintTimer.destroy();
            this.hintTweens.forEach(t => t.stop());
            
            this.time.delayedCall(1500, () => {
                this.currentRecallIndex++;
                this.startNextVisualRecall();
            });
        }
    }

    clearVisualObjects() {
        if (this.hintTimer) this.hintTimer.destroy();
        this.hintTweens.forEach(t => t.stop());
        this.hintTweens = [];
        this.recallTargetContainer = null;
        
        this.recallObjects.forEach(obj => obj.destroy());
        this.recallObjects = [];
    }

    createGrid(deck) {
        const gw = this.scale.width;
        const gh = this.scale.height;
        const isPortrait = gh > gw;

        let cols, rows;
        const count = deck.length;

        if (count === 4) {
            cols = 2; rows = 2;
        } else if (count === 6) {
            cols = isPortrait ? 2 : 3;
            rows = isPortrait ? 3 : 2;
        } else if (count === 8) {
            cols = isPortrait ? 2 : 4;
            rows = isPortrait ? 4 : 2;
        } else if (count === 10) {
            cols = isPortrait ? 2 : 5;
            rows = isPortrait ? 5 : 2;
        } else if (count === 12) {
            cols = isPortrait ? 3 : 4;
            rows = isPortrait ? 4 : 3;
        }

        const padding = 40;
        const availableW = gw - (padding * 2);
        const availableH = gh - (padding * 2);
        
        const cellW = availableW / cols;
        const cellH = availableH / rows;
        
        const cardSize = Math.min(cellW, cellH) * 0.85;
        const finalCardSize = Math.min(cardSize, 140);

        const startX = (gw - (cols * cellW)) / 2 + (cellW / 2);
        const startY = (gh - (rows * cellH)) / 2 + (cellH / 2);

        deck.forEach((emoji, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * cellW;
            const y = startY + row * cellH;

            this.createCard(x, y, emoji, finalCardSize);
        });
    }

    createCard(x, y, emoji, size) {
        const container = this.add.container(x, y);
        container.setSize(size, size);
        
        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(-size/2, -size/2, size, size, 16);
        bg.lineStyle(4, 0xdddddd, 1);
        bg.strokeRoundedRect(-size/2, -size/2, size, size, 16);
        
        const content = this.add.text(0, 0, emoji, { fontSize: `${size * 0.5}px` })
            .setOrigin(0.5);

        const coverBg = this.add.graphics();
        coverBg.fillStyle(0x84b6f4, 1);
        coverBg.fillRoundedRect(-size/2, -size/2, size, size, 16);
        coverBg.lineStyle(4, 0x4a90e2, 1);
        coverBg.strokeRoundedRect(-size/2, -size/2, size, size, 16);
        
        const iconStr = this.levelData.coverIcon || '⭐';
        const coverIcon = this.add.text(0, 0, iconStr, { fontSize: `${size * 0.4}px` })
            .setOrigin(0.5);

        const cover = this.add.container(0, 0, [coverBg, coverIcon]);

        container.add([bg, content, cover]);

        const hitArea = new Phaser.Geom.Rectangle(-size/2, -size/2, size, size);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        const cardState = {
            container: container,
            cover: cover,
            content: content,
            bgGraphics: bg,
            pairId: emoji,
            isRevealed: true,
            isMatched: false,
            size: size
        };

        container.on('pointerdown', () => this.handleCardTap(cardState));

        this.cards.push(cardState);
    }

    hideAllCards() {
        this.cards.forEach(c => {
            if (!c.isMatched) {
                this.hideCard(c, false);
            }
        });
    }

    revealCard(card, animate = true) {
        if (card.isRevealed) return;
        card.isRevealed = true;
        
        if (animate) {
            SofiApp.audio.tap();
            this.tweens.add({
                targets: card.container,
                scaleX: 0,
                duration: 150,
                onComplete: () => {
                    card.cover.setVisible(false);
                    this.tweens.add({
                        targets: card.container,
                        scaleX: 1,
                        duration: 150
                    });
                }
            });
        } else {
            card.cover.setVisible(false);
        }
    }

    hideCard(card, animate = true) {
        if (!card.isRevealed) return;
        card.isRevealed = false;

        if (animate) {
            this.tweens.add({
                targets: card.container,
                scaleX: 0,
                duration: 150,
                onComplete: () => {
                    card.cover.setVisible(true);
                    this.tweens.add({
                        targets: card.container,
                        scaleX: 1,
                        duration: 150
                    });
                }
            });
        } else {
            card.cover.setVisible(true);
        }
    }

    handleCardTap(card) {
        if (this.inputLocked || card.isRevealed || card.isMatched) return;

        this.clearHint();
        this.revealCard(card, true);

        if (!this.firstCard) {
            this.firstCard = card;
            this.resetHintTimer();
        } else {
            this.secondCard = card;
            this.checkMatch();
        }
    }

    checkMatch() {
        this.inputLocked = true;

        if (this.firstCard.pairId === this.secondCard.pairId) {
            this.firstCard.isMatched = true;
            this.secondCard.isMatched = true;
            this.matchedPairs++;

            SofiApp.audio.success();
            this.createMatchSparkles(this.firstCard.container.x, this.firstCard.container.y);
            this.createMatchSparkles(this.secondCard.container.x, this.secondCard.container.y);

            this.tweens.add({
                targets: [this.firstCard.container, this.secondCard.container],
                y: '-=15',
                yoyo: true,
                duration: 200,
                onComplete: () => {
                    this.firstCard.bgGraphics.clear();
                    this.firstCard.bgGraphics.fillStyle(0xffffff, 0.7);
                    this.firstCard.bgGraphics.fillRoundedRect(-this.firstCard.size/2, -this.firstCard.size/2, this.firstCard.size, this.firstCard.size, 16);
                    
                    this.secondCard.bgGraphics.clear();
                    this.secondCard.bgGraphics.fillStyle(0xffffff, 0.7);
                    this.secondCard.bgGraphics.fillRoundedRect(-this.secondCard.size/2, -this.secondCard.size/2, this.secondCard.size, this.secondCard.size, 16);

                    this.firstCard = null;
                    this.secondCard = null;

                    if (this.matchedPairs === this.totalPairs) {
                        this.completeLevel();
                    } else {
                        this.inputLocked = false;
                        this.resetHintTimer();
                    }
                }
            });
        } else {
            this.time.delayedCall(1000, () => {
                this.hideCard(this.firstCard, true);
                this.hideCard(this.secondCard, true);
                this.firstCard = null;
                this.secondCard = null;
                this.inputLocked = false;
                this.resetHintTimer();
            });
        }
    }

    
    createMatchSparkles(x, y) {
        const types = ['⭐', '❤️', '✨'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        for (let i = 0; i < 3; i++) {
            const offsetX = Phaser.Math.Between(-20, 20);
            const offsetY = Phaser.Math.Between(-20, 20);
            const particle = this.add.text(x + offsetX, y + offsetY, type, { fontSize: '24px' }).setOrigin(0.5).setAlpha(0.8);
            
            this.tweens.add({
                targets: particle,
                scale: 2,
                alpha: 0,
                angle: 180,
                duration: 800,
                onComplete: () => particle.destroy()
            });
        }
    }


    resetHintTimer() {
        this.clearHint();
        if (this.isLevelCompleting) return;

        this.hintTimer = this.time.delayedCall(12000, this.showHint, [], this);
    }

    clearHint() {
        if (this.hintTimer) {
            this.hintTimer.destroy();
            this.hintTimer = null;
        }
        this.hintTweens.forEach(t => t.stop());
        this.hintTweens = [];
        this.cards.forEach(c => {
            if (!c.isMatched && !c.isRevealed) {
                c.container.setScale(1);
                c.cover.setAlpha(1);
            }
        });
    }

    showHint() {
        if (this.isLevelCompleting || this.inputLocked || this.firstCard) return;

        
        const unmatched = this.cards.filter(c => !c.isMatched && !c.isRevealed);
        if (unmatched.length < 2) return;

        // Group by pairId
        const pairsMap = {};
        unmatched.forEach(c => {
            if (!pairsMap[c.pairId]) pairsMap[c.pairId] = [];
            pairsMap[c.pairId].push(c);
        });

        const validPairIds = Object.keys(pairsMap).filter(id => pairsMap[id].length === 2);
        if (validPairIds.length === 0) return;

        let targetId = validPairIds[0];
        if (validPairIds.length > 1 && this.lastHintPairId) {
            const alternative = validPairIds.find(id => id !== this.lastHintPairId);
            if (alternative) targetId = alternative;
        }
        this.lastHintPairId = targetId;
        
        const pair = pairsMap[targetId];


        if (pair.length === 2) {
            pair.forEach(c => {
                const tw = this.tweens.add({
                    targets: c.container,
                    scale: 1.08,
                    yoyo: true,
                    repeat: 2,
                    duration: 400
                });
                this.hintTweens.push(tw);
                
                const twAlpha = this.tweens.add({
                    targets: c.cover,
                    alpha: 0.7,
                    yoyo: true,
                    repeat: 2,
                    duration: 400
                });
                this.hintTweens.push(twAlpha);
            });
        }
        
        this.hintTimer = this.time.delayedCall(15000, this.showHint, [], this);
    }

    completeLevel() {
        if (this.isLevelCompleting) return;
        this.isLevelCompleting = true;
        this.clearHint();

        SofiApp.audio.speak('¡Muy bien!');

        for (let i = 0; i < 15; i++) {
            this.time.delayedCall(i * 100, () => {
                const x = Phaser.Math.Between(50, this.scale.width - 50);
                const y = Phaser.Math.Between(50, this.scale.height - 50);
                const star = this.add.star(x, y, 5, 10, 20, 0xffeb3b).setAlpha(0);
                this.tweens.add({
                    targets: star,
                    alpha: 1,
                    scale: 2,
                    y: y - 100,
                    angle: 360,
                    duration: 1000,
                    onComplete: () => star.destroy()
                });
            });
        }

        
        
        this.time.delayedCall(2000, () => {
            if (!this.scene.isActive()) return;
            
            if (SofiApp.progress && SofiApp.progress.recordEvent) {
                SofiApp.progress.recordEvent('memory-level-' + currentMemoryLevel);
            }
            
            if (currentMemoryLevel < 5) {
                if (currentMemoryLevel === 3) {
                    SofiApp.audio.speak('¡Mitad de la aventura!');
                }
                currentMemoryLevel++;
                this.scene.restart();
            } else {
                this.scene.start('FinalMemoryScene');
            }
        });


    }
}

class FinalMemoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FinalMemoryScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#f3e5f5');
        
        SofiApp.audio.speak('¡Excelente Sofi! ¡Qué buena memoria!');
        SofiApp.audio.success();

        // Reward given via recordEvent in completeLevel

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const mainText = this.add.text(cx, cy - 80, '🎉 ¡Excelente Sofi! 🎉', {
            fontSize: '48px',
            fontFamily: 'Nunito, sans-serif',
            color: '#ff4081',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        const subText = this.add.text(cx, cy - 20, '¡Qué buena memoria!', {
            fontSize: '28px',
            fontFamily: 'Nunito, sans-serif',
            color: '#333333',
            align: 'center'
        }).setOrigin(0.5);

        const replayBtn = this.add.graphics();
        replayBtn.fillStyle(0x84b6f4, 1);
        replayBtn.fillRoundedRect(cx - 120, cy + 60, 240, 60, 30);
        replayBtn.setInteractive(new Phaser.Geom.Rectangle(cx - 120, cy + 60, 240, 60), Phaser.Geom.Rectangle.Contains);
        
        const replayText = this.add.text(cx, cy + 90, '🌈 OTRA AVENTURA', {
            fontSize: '20px',
            fontFamily: 'Nunito, sans-serif',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        replayBtn.on('pointerdown', () => {
            SofiApp.audio.tap();
            currentMemoryLevel = 1;
            currentMemoryAdventure = buildMemoryAdventure();
            this.scene.start('MemoryScene');
        });
    }
}

// --- INTEGRACIÓN NAVEGACIÓN ---

const btnGame5 = document.getElementById('btn-game5');
if (btnGame5) {
    btnGame5.addEventListener('click', () => {
        SofiApp.navigation.goTo('game5');
    });
}

window.initGame5Phaser = function() {
    const config = {
        type: Phaser.AUTO,
        parent: 'memory-game-container',
        width: 800,
        height: 800,
        backgroundColor: '#ffffff',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [MemoryScene, FinalMemoryScene],
        transparent: true
    };

    if (!game5Instance) {
        currentMemoryLevel = 1;
        currentMemoryAdventure = buildMemoryAdventure();
        game5Instance = new Phaser.Game(config);
    }
};

SofiApp.navigation.registerView('game5', {
    onEnter: () => {
        if (window.initGame5Phaser) {
            window.initGame5Phaser();
        }
    },
    onExit: () => {
        if (game5Instance) {
            game5Instance.destroy(true);
            game5Instance = null;
        }
    }
});
