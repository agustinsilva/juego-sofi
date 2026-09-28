// game3.js - JUEGO 3: LABERINTO DEL PERRITO (Phaser Version Phase 4)

const levelTitle3 = document.getElementById('level-title-3');
const endScreen3 = document.getElementById('end-screen-3');
const restartBtn3 = document.getElementById('restart-btn-3');

const mazeThemes = {
    forest: { name: 'Bosque', bg: '#aed581', cell: '#dcedc8', wall: '🌳', decor: ['🌿', '🌸', '🍄'] },
    garden: { name: 'Jardín', bg: '#c5e1a5', cell: '#f1f8e9', wall: '🌻', decor: ['🌼', '🌷', '🦋'] },
    beach:  { name: 'Playa', bg: '#ffe082', cell: '#fff8e1', wall: '🪨', decor: ['🐚', '🌴', '🦀'] },
    snow:   { name: 'Nieve', bg: '#b3e5fc', cell: '#e1f5fe', wall: '🌲', decor: ['⛄', '❄️'] },
    night:  { name: 'Noche', bg: '#3949ab', cell: '#7986cb', wall: '🌲', decor: ['✨', '🦉'] },
    magic:  { name: 'Mágico', bg: '#ce93d8', cell: '#f3e5f5', wall: '🍄', decor: ['🌈', '🦄'] }
};

const CARAMELO_TEXTURES = {
    normal: 'caramelo-normal',
    happy: 'caramelo-happy',
    thinking: 'caramelo-thinking',
    celebrate: 'caramelo-celebrate',
    foundBone: 'caramelo-found-bone',
    walk: [
        'caramelo-walk-1',
        'caramelo-walk-2',
        'caramelo-walk-3',
        'caramelo-walk-4'
    ]
};

// Tiles visuales por mundo (Fase 8C.2). Solo representación: layout, zonas de toque y BFS no cambian.
const MAZE_TILE_PATH = '/assets/backgrounds/maze/';
const MAZE_THEME_TILES = {
    forest: { wall: 'maze-wall-forest', floor: 'maze-floor-forest' },
    garden: { wall: 'maze-wall-garden', floor: 'maze-floor-garden' },
    beach: { wall: 'maze-wall-beach', floor: 'maze-floor-beach' },
    snow: { wall: 'maze-wall-snow', floor: 'maze-floor-snow' },
    night: { wall: 'maze-wall-night', floor: 'maze-floor-night' },
    magic: { wall: 'maze-wall-magic', floor: 'maze-floor-magic' }
};

const mazeWorlds = [
    {
        id: 'forest', theme: 'forest',
        variants: [
            {
                id: 'forest-a',
                start: { r: 0, c: 0 }, end: { r: 4, c: 4 },
                mission: {
                    instruction: { visual: '🦴 ¡Busca el hueso!', speech: '¡Busca el hueso!' },
                    objectives: [ { id: 'bone1', type: 'bone', emoji: '🦴', position: { r: 0, c: 3 } } ]
                },
                layout: [
                    [0, 0, 1, 0, 0],
                    [1, 0, 1, 0, 1],
                    [0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 0],
                    [0, 0, 0, 1, 0]
                ]
            },
            {
                id: 'forest-b',
                start: { r: 2, c: 2 }, end: { r: 0, c: 0 },
                mission: {
                    instruction: { visual: '🐰 ¡Lleva a tu amigo!', speech: '¡Encuentra a tu amigo y llévalo a casa!' },
                    objectives: [ { id: 'friend1', type: 'friend', emoji: '🐰', position: { r: 4, c: 4 }, follow: true } ]
                },
                layout: [
                    [0, 1, 0, 1, 0],
                    [0, 1, 0, 0, 0],
                    [0, 0, 0, 1, 0],
                    [1, 1, 0, 1, 0],
                    [0, 0, 0, 1, 0]
                ],
                events: [
                    { id: 'ev1', trigger: { r: 1, c: 4 }, type: 'ambient', emoji: '🦋' } // Ambient event!
                ]
            }
        ]
    },
    {
        id: 'garden', theme: 'garden',
        variants: [
            {
                id: 'garden-a',
                start: { r: 4, c: 0 }, end: { r: 0, c: 4 },
                mission: {
                    instruction: { visual: '🦴 🦴 ¡Busca los huesos!', speech: '¡Busca los dos huesos!' },
                    objectives: [ 
                        { id: 'bone1', type: 'bone', emoji: '🦴', position: { r: 4, c: 4 } },
                        { id: 'bone2', type: 'bone', emoji: '🦴', position: { r: 0, c: 0 } }
                    ]
                },
                layout: [
                    [0, 1, 0, 0, 0],
                    [0, 1, 0, 1, 0],
                    [0, 0, 0, 1, 0],
                    [1, 1, 0, 1, 0],
                    [0, 0, 0, 1, 0]
                ]
            },
            {
                id: 'garden-b',
                start: { r: 4, c: 2 }, end: { r: 0, c: 2 },
                mission: {
                    instruction: { visual: '💧 🌱 ¡Ayuda a la flor!', speech: '¡Busca agua para la flor!' },
                    objectives: [ 
                        { id: 'water1', type: 'water', emoji: '💧', position: { r: 4, c: 4 } },
                        { id: 'plant1', type: 'plant', emoji: '🌱', position: { r: 0, c: 4 }, requires: 'water1', transformsTo: '🌷' }
                    ]
                },
                layout: [
                    [1, 1, 0, 1, 0],
                    [0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 0],
                    [0, 0, 0, 1, 0],
                    [1, 1, 0, 0, 0]
                ]
            }
        ]
    },
    {
        id: 'beach', theme: 'beach',
        variants: [
            {
                id: 'beach-a',
                start: { r: 0, c: 0 }, end: { r: 5, c: 5 },
                mission: {
                    instruction: { visual: '⭐ ⭐ ¡Busca las estrellas!', speech: '¡Busca las estrellas!' },
                    objectives: [ 
                        { id: 'star1', type: 'star', emoji: '⭐', position: { r: 0, c: 5 } },
                        { id: 'star2', type: 'star', emoji: '⭐', position: { r: 4, c: 0 } }
                    ]
                },
                layout: [
                    [0, 1, 0, 0, 0, 0],
                    [0, 1, 0, 1, 1, 0],
                    [0, 0, 0, 0, 1, 0],
                    [1, 1, 1, 0, 1, 0],
                    [0, 0, 0, 0, 1, 0],
                    [0, 1, 1, 1, 1, 0]
                ]
            },
            {
                id: 'beach-b',
                start: { r: 5, c: 0 }, end: { r: 0, c: 0 },
                mission: {
                    instruction: { visual: '🪵 🌊 🌉 ¡Construye un puente!', speech: '¡Busca madera para el puente!' },
                    objectives: [ 
                        { id: 'log1', type: 'material', emoji: '🪵', position: { r: 5, c: 5 } },
                        { id: 'river1', type: 'bridgeTarget', emoji: '🌊', position: { r: 2, c: 5 }, requires: 'log1', transformsTo: '🌉', blocksMovement: true }
                    ]
                },
                layout: [
                    [0, 0, 0, 1, 0, 0],
                    [1, 1, 0, 1, 0, 1],
                    [0, 0, 0, 0, 0, 0], // river at 2,5
                    [0, 1, 1, 1, 1, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 1, 0]
                ],
                events: [
                    { id: 'ev1', trigger: { r: 1, c: 2 }, type: 'ambient', emoji: '🐟' }
                ]
            }
        ]
    },
    {
        id: 'snow', theme: 'snow',
        variants: [
            {
                id: 'snow-a',
                start: { r: 0, c: 0 }, end: { r: 5, c: 0 },
                mission: {
                    instruction: { visual: '🦴 🦴 ¡Busca los huesos!', speech: '¡Busca los dos huesos!' },
                    objectives: [ 
                        { id: 'bone1', type: 'bone', emoji: '🦴', position: { r: 0, c: 5 } },
                        { id: 'bone2', type: 'bone', emoji: '🦴', position: { r: 4, c: 5 } }
                    ]
                },
                layout: [
                    [0, 0, 0, 1, 0, 0],
                    [1, 1, 0, 1, 0, 1],
                    [0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 1, 1],
                    [0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 1, 1]
                ]
            },
            {
                id: 'snow-b',
                start: { r: 5, c: 5 }, end: { r: 0, c: 5 },
                mission: {
                    instruction: { visual: '🟢 🚧 ¡Abre el camino!', speech: '¡Busca el botón para abrir el camino!' },
                    objectives: [ 
                        { id: 'switch1', type: 'switch', emoji: '🟢', position: { r: 5, c: 0 } },
                        { id: 'gate1', type: 'gate', emoji: '🚧', position: { r: 2, c: 5 }, requiresActivation: 'switch1' },
                        { id: 'bone1', type: 'bone', emoji: '🦴', position: { r: 0, c: 0 } },
                        { id: 'sec1', type: 'secret', emoji: '💎', position: { r: 0, c: 4 }, optional: true }
                    ]
                },
                layout: [
                    [0, 0, 0, 1, 0, 0],
                    [1, 1, 0, 1, 0, 1],
                    [0, 0, 0, 0, 0, 0], 
                    [0, 1, 1, 1, 1, 0], 
                    [0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 1, 1, 0] 
                ],
                events: [
                    { id: 'ev1', trigger: { r: 4, c: 0 }, type: 'ambient', emoji: '❄️' }
                ]
            }
        ]
    },
    {
        id: 'night', theme: 'night',
        variants: [
            {
                id: 'night-a',
                start: { r: 6, c: 0 }, end: { r: 0, c: 6 },
                mission: {
                    instruction: { visual: '🔑 🚪 ¡Usa la llave!', speech: '¡Busca la llave para abrir la puerta!' },
                    objectives: [ 
                        { id: 'key', type: 'key', emoji: '🔑', position: { r: 6, c: 6 } },
                        { id: 'door', type: 'door', emoji: '🚪', position: { r: 0, c: 2 }, requiresKey: true },
                        { id: 'bone', type: 'bone', emoji: '🦴', position: { r: 0, c: 4 } }
                    ]
                },
                layout: [
                    [0, 0, 0, 0, 0, 1, 0],
                    [1, 1, 0, 1, 0, 1, 0],
                    [0, 0, 0, 0, 0, 1, 0],
                    [0, 1, 1, 1, 1, 1, 0],
                    [0, 0, 0, 0, 1, 0, 0],
                    [1, 1, 1, 0, 1, 0, 1],
                    [0, 0, 0, 0, 0, 0, 0]
                ]
            },
            {
                id: 'night-b',
                start: { r: 6, c: 3 }, end: { r: 0, c: 3 },
                mission: {
                    instruction: { visual: '💡 ⭐ ¡Busca la luz!', speech: '¡Busca la luz y la estrella!' },
                    objectives: [ 
                        { id: 'light1', type: 'light', emoji: '💡', position: { r: 6, c: 6 } },
                        { id: 'star1', type: 'star', emoji: '⭐', position: { r: 0, c: 6 } }
                    ]
                },
                layout: [
                    [1, 1, 1, 0, 1, 1, 0],
                    [0, 0, 0, 0, 0, 1, 0],
                    [0, 1, 1, 1, 0, 1, 0],
                    [0, 0, 0, 1, 0, 0, 0],
                    [1, 1, 0, 1, 1, 1, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 1, 1, 0, 1, 1, 0] 
                ]
            }
        ]
    },
    {
        id: 'magic', theme: 'magic',
        variants: [
            {
                id: 'magic-a',
                start: { r: 6, c: 0 }, end: { r: 0, c: 6 },
                mission: {
                    instruction: { visual: '🔑 ⭐ ¡Busca todo!', speech: '¡Busca la llave y las estrellas!' },
                    objectives: [
                        { id: 'key', type: 'key', emoji: '🔑', position: { r: 4, c: 6 } },
                        { id: 'star1', type: 'star', emoji: '⭐', position: { r: 5, c: 0 } },
                        { id: 'door', type: 'door', emoji: '🚪', position: { r: 3, c: 0 }, requiresKey: true },
                        { id: 'star2', type: 'star', emoji: '⭐', position: { r: 1, c: 0 } }
                    ]
                },
                layout: [
                    [0, 0, 1, 1, 1, 1, 0],
                    [0, 1, 1, 0, 0, 0, 0],
                    [0, 1, 0, 0, 1, 1, 1],
                    [0, 0, 0, 0, 0, 1, 0],
                    [1, 1, 1, 1, 0, 0, 0],
                    [0, 0, 0, 1, 1, 1, 0],
                    [0, 1, 0, 0, 0, 0, 0]
                ]
            },
            {
                id: 'magic-b',
                start: { r: 3, c: 3 }, end: { r: 6, c: 3 },
                mission: {
                    instruction: { visual: '🐱 🟢 🚧 ¡Amigo y barrera!', speech: '¡Lleva a tu amigo y abre el camino!' },
                    objectives: [
                        { id: 'friend1', type: 'friend', emoji: '🐱', position: { r: 0, c: 0 }, follow: true },
                        { id: 'switch1', type: 'switch', emoji: '🟢', position: { r: 0, c: 6 } },
                        { id: 'gate1', type: 'gate', emoji: '🚧', position: { r: 6, c: 2 }, requiresActivation: 'switch1' }
                    ]
                },
                layout: [
                    [0, 0, 0, 1, 0, 0, 0],
                    [1, 1, 0, 1, 0, 1, 0],
                    [0, 0, 0, 0, 0, 1, 0],
                    [0, 1, 1, 0, 1, 1, 0],
                    [0, 0, 0, 0, 1, 0, 0],
                    [1, 1, 1, 0, 1, 0, 1],
                    [0, 0, 0, 0, 0, 0, 0]
                ],
                events: [
                    { id: 'ev1', trigger: { r: 3, c: 2 }, type: 'ambient', emoji: '✨' }
                ]
            }
        ]
    }
];


let currentMazeAdventure = [];

function getAllMazeVariants() {
    let variants = [];
    mazeWorlds.forEach(w => {
        w.variants.forEach(v => {
            variants.push({ ...v, theme: w.theme, worldId: w.id });
        });
    });
    return variants;
}

function validateMazeMissionSolvability(variant) {
    let errors = [];
    
    // 1. Structural validation
    if (!variant.start) errors.push('Missing start');
    if (!variant.end) errors.push('Missing end');
    if (!variant.mission || !variant.mission.objectives) errors.push('Missing objectives');
    if (variant.layout[variant.start.r][variant.start.c] === 1) errors.push('Start is on a wall');
    if (variant.layout[variant.end.r][variant.end.c] === 1) errors.push('End is on a wall');
    
    // Check overlaps
    variant.mission.objectives.forEach(obj => {
        if (obj.position.r === variant.end.r && obj.position.c === variant.end.c) {
            errors.push(`Objective ${obj.id} is on the end cell`);
        }
        if (variant.layout[obj.position.r][obj.position.c] === 1) {
            errors.push(`Objective ${obj.id} is on a wall`);
        }
    });

    // 2. Solvability BFS
    let state = {
        r: variant.start.r,
        c: variant.start.c,
        collected: new Set(),
        activated: new Set(),
        opened: new Set(),
        transformed: new Set()
    };
    
    // Helper to get blockers based on current state
    const getBlockers = (currentState) => {
        let blockers = new Set();
        variant.mission.objectives.filter(o => {
            if (o.type === 'door' && !currentState.opened.has(o.id)) return true;
            if (o.type === 'gate' && !currentState.opened.has(o.id)) return true;
            if (o.type === 'bridgeTarget' && !currentState.transformed.has(o.id)) return true;
            return false;
        }).forEach(o => blockers.add(`${o.position.r},${o.position.c}`));
        return blockers;
    };

    // Helper to get reachable cells and objects from a start pos
    const explore = (startState) => {
        let queue = [{ r: startState.r, c: startState.c }];
        let visited = new Set([`${startState.r},${startState.c}`]);
        let reachableObjectives = [];
        let blockers = getBlockers(startState);
        let canReachEnd = false;
        
        while (queue.length > 0) {
            let curr = queue.shift();
            
            if (curr.r === variant.end.r && curr.c === variant.end.c) {
                canReachEnd = true;
            }
            
            // Check objectives on this cell
            let objs = variant.mission.objectives.filter(o => o.position.r === curr.r && o.position.c === curr.c);
            objs.forEach(o => {
                if (!startState.collected.has(o.id) && !startState.activated.has(o.id) && !startState.opened.has(o.id) && !startState.transformed.has(o.id)) {
                    reachableObjectives.push(o);
                }
            });

            const dirs = [[0,1], [1,0], [0,-1], [-1,0]];
            for (let [dr, dc] of dirs) {
                let nr = curr.r + dr;
                let nc = curr.c + dc;
                if (nr >= 0 && nr < variant.layout.length && nc >= 0 && nc < variant.layout[0].length) {
                    if (variant.layout[nr][nc] === 0) {
                        let key = `${nr},${nc}`;
                        if (!visited.has(key) && !blockers.has(key)) {
                            visited.add(key);
                            queue.push({ r: nr, c: nc });
                        }
                    }
                }
            }
        }
        return { reachableObjectives, canReachEnd };
    };

    let missionComplete = false;
    let stuck = false;
    
    // Simulate playing the level by grabbing/interacting with anything we can
    while (!missionComplete && !stuck) {
        let { reachableObjectives, canReachEnd } = explore(state);
        
        let changed = false;
        reachableObjectives.forEach(obj => {
            // Check if we meet requirements to interact
            let reqMet = true;
            if (obj.requires && !state.collected.has(obj.requires)) reqMet = false;
            if (obj.requiresActivation && !state.activated.has(obj.requiresActivation)) reqMet = false;
            if (obj.requiresKey) {
                let hasKey = Array.from(state.collected).some(id => variant.mission.objectives.find(o => o.id === id && o.type === 'key'));
                if (!hasKey) reqMet = false;
            }
            
            if (reqMet) {
                if (obj.type === 'switch' || obj.type === 'light') state.activated.add(obj.id);
                else if (obj.type === 'door' || obj.type === 'gate') state.opened.add(obj.id);
                else if (obj.type === 'bridgeTarget' || obj.type === 'plant') state.transformed.add(obj.id);
                else state.collected.add(obj.id); // bone, star, friend, key, water, material, secret
                
                changed = true;
            }
        });
        
        if (!changed) {
            stuck = true;
        } else {
            // Check if mission is complete
            missionComplete = variant.mission.objectives.every(o => {
                if (o.optional) return true;
                if (o.type === 'switch' || o.type === 'light') return state.activated.has(o.id);
                if (o.type === 'door' || o.type === 'gate') return state.opened.has(o.id);
                if (o.type === 'bridgeTarget' || o.type === 'plant') return state.transformed.has(o.id);
                return state.collected.has(o.id);
            });
        }
    }
    
    if (!missionComplete) {
        errors.push('Mission is not completable');
    } else {
        // One final check from current state to home
        let finalExplore = explore(state);
        if (!finalExplore.canReachEnd) {
            errors.push('Cannot reach end after completing mission');
        }
    }

    return errors;
}

let validMazeVariants = [];

function validateMazeWorlds() {
    let allVariants = getAllMazeVariants();
    let validCount = 0;
    let invalidCount = 0;
    
    allVariants.forEach(variant => {
        let errors = validateMazeMissionSolvability(variant);
        if (errors.length > 0) {
            console.error(`[Maze Validation] Variant ${variant.id} is unsolvable:`, errors);
            invalidCount++;
        } else {
            validMazeVariants.push(variant);
            validCount++;
        }
    });
    
    console.log(`Maze variants: ${allVariants.length}\nValid: ${validCount}\nInvalid: ${invalidCount}`);
}
validateMazeWorlds();


let currentMazeLevel = 0;
let lastAdventureVariantIds = [];

let mazeGameInstance = null;

if (typeof btnGame3 !== 'undefined' && btnGame3) btnGame3.addEventListener('click', startGame3);
if (restartBtn3) restartBtn3.addEventListener('click', startGame3);

function startGame3() { SofiApp.navigation.goTo('game3'); }

function buildMazeAdventure() {
    currentMazeAdventure = [];
    let newIds = [];
    mazeWorlds.forEach(world => {
        let available = world.variants;
        if (world.variants.length > 1) {
            let filtered = world.variants.filter(v => !lastAdventureVariantIds.includes(v.id));
            if (filtered.length > 0) available = filtered;
        }
        let chosen = available[Math.floor(Math.random() * available.length)];
        newIds.push(chosen.id);
        currentMazeAdventure.push(chosen);
    });
    lastAdventureVariantIds = newIds;
}

function speakMaze(text) {
    if (typeof window.speechSynthesis === 'undefined') return;
    try {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'es-AR'; msg.rate = 0.9; msg.pitch = 1.05;
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            let voice = voices.find(v => v.lang.startsWith('es-AR')) || voices.find(v => v.lang.startsWith('es'));
            if (voice) msg.voice = voice;
        }
        window.speechSynthesis.speak(msg);
    } catch(e) {}
}

function stopMazeSpeech() {
    if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
}

function isObjectiveBlocking(obj, missionState) {
    if (obj.type === 'door' || obj.type === 'gate' || (obj.type === 'bridgeTarget' && obj.blocksMovement)) {
        return !missionState.opened.has(obj.id) && !missionState.transformed.has(obj.id);
    }
    return false;
}

function areRequirementsMet(obj, missionState) {
    if (obj.requires) {
        return missionState.collected.has(obj.requires);
    }
    if (obj.requiresActivation) {
        return missionState.collected.has(obj.requiresActivation) || missionState.activated.has(obj.requiresActivation);
    }
    if (obj.requiresKey) {
        return missionState.collected.has('key');
    }
    return true;
}

function isObjectiveComplete(obj, missionState) {
    if (obj.optional) return true;
    if (obj.type === 'door' || obj.type === 'gate') return missionState.opened.has(obj.id);
    if (obj.type === 'plant' || obj.type === 'bridgeTarget') return missionState.transformed.has(obj.id);
    if (obj.type === 'light') return missionState.activated.has(obj.id);
    if (obj.type === 'friend' && obj.follow) return missionState.companions.has(obj.id) || missionState.collected.has(obj.id);
    return missionState.collected.has(obj.id);
}

function getMazePath(start, end, layout, blocked = new Set()) {
    let queue = [[start.r, start.c]];
    let visited = new Set([`${start.r},${start.c}`]);
    let parent = {};
    let dr = [-1, 1, 0, 0]; let dc = [0, 0, -1, 1];
    while(queue.length > 0) {
        let [r, c] = queue.shift();
        if (r === end.r && c === end.c) {
            let path = []; let curr = `${r},${c}`;
            while(curr) {
                let [cr, cc] = curr.split(',').map(Number);
                path.push({r: cr, c: cc});
                curr = parent[curr];
            }
            return path.reverse();
        }
        for(let i=0; i<4; i++) {
            let nr = r + dr[i]; let nc = c + dc[i];
            if (nr >= 0 && nr < layout.length && nc >= 0 && nc < layout[0].length) {
                if (layout[nr][nc] !== 1 && !blocked.has(`${nr},${nc}`) && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    parent[`${nr},${nc}`] = `${r},${c}`;
                    queue.push([nr, nc]);
                } else if (nr === end.r && nc === end.c) {
                    visited.add(`${nr},${nc}`);
                    parent[`${nr},${nc}`] = `${r},${c}`;
                    queue.push([nr, nc]);
                }
            }
        }
    }
    return null;
}

function initMazePhaser() {
    if (mazeGameInstance) mazeGameInstance.destroy(true);
    const config = {
        type: Phaser.AUTO, width: 800, height: 920,
        parent: 'maze-game-container', backgroundColor: '#aed581',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [MazeScene, FinalCelebrationScene]
    };
    mazeGameInstance = new Phaser.Game(config);
}

class MazeScene extends Phaser.Scene {
    constructor() { super('MazeScene'); }

    init() {
        this.levelData = currentMazeAdventure[currentMazeLevel];
        let worldConfig = mazeWorlds.find(w => w.variants.some(v => v.id === this.levelData.id));
        this.theme = mazeThemes[worldConfig.theme];
        this.tiles = MAZE_THEME_TILES[worldConfig.theme] || null;
        this.layout = this.levelData.layout;
        this.mission = this.levelData.mission;
        this.events = this.levelData.events || [];
        this.rows = this.layout.length; this.cols = this.layout[0].length;
        this.cellSize = 800 / this.cols;
        this.dogPos = { r: this.levelData.start.r, c: this.levelData.start.c };
        
        this.missionState = {
            collected: new Set(),
            activated: new Set(),
            opened: new Set(),
            transformed: new Set(),
            companions: new Set()
        };
        this.triggeredEvents = new Set();
        this.isLevelCompleting = false;
        
        this.objectiveObjects = new Map();
        this.companionSprites = new Map();
        this.isMoving = false;
        this.inputLocked = true;
        
        if(levelTitle3) {
            const stars = '⭐'.repeat(currentMazeLevel) + '○'.repeat(6 - currentMazeLevel);
            levelTitle3.innerHTML = `${this.theme.wall} ${this.theme.name} <br><span style="font-size: 0.6em; letter-spacing: 2px;">${stars}</span>`;
        }
    }

    preload() {
        this.load.image(CARAMELO_TEXTURES.normal, `/assets/characters/caramelo/${CARAMELO_TEXTURES.normal}.webp`);
        this.load.image(CARAMELO_TEXTURES.happy, `/assets/characters/caramelo/${CARAMELO_TEXTURES.happy}.webp`);
        this.load.image(CARAMELO_TEXTURES.thinking, `/assets/characters/caramelo/${CARAMELO_TEXTURES.thinking}.webp`);
        this.load.image(CARAMELO_TEXTURES.celebrate, `/assets/characters/caramelo/${CARAMELO_TEXTURES.celebrate}.webp`);
        this.load.image(CARAMELO_TEXTURES.foundBone, `/assets/characters/caramelo/${CARAMELO_TEXTURES.foundBone}.webp`);
        CARAMELO_TEXTURES.walk.forEach(w => this.load.image(w, `/assets/characters/caramelo/${w}.webp`));

        // Solo los tiles del mundo actual (cada PNG pesa ~1.3 MB); la escena se reinicia en cada nivel.
        if (this.tiles) {
            [this.tiles.floor, this.tiles.wall].forEach(key => {
                if (!this.textures.exists(key)) this.load.image(key, `${MAZE_TILE_PATH}${key}.webp`);
            });
        }
    }

    create() {
        this.cameras.main.setBackgroundColor(this.theme.bg);
        this.obstacles = {};
        
        const missionEmojis = new Set();
        this.mission.objectives.forEach(o => {
            missionEmojis.add(o.emoji);
            if (o.transformsTo) missionEmojis.add(o.transformsTo);
        });
        this.events.forEach(e => missionEmojis.add(e.emoji));
        
        const safeDecor = this.theme.decor.filter(d => !missionEmojis.has(d));
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.cellSize + this.cellSize / 2;
                const y = r * this.cellSize + this.cellSize / 2;
                
                const floorKey = this.tiles && this.tiles.floor;
                if (floorKey && this.textures.exists(floorKey)) {
                    this.add.image(x, y, floorKey).setDisplaySize(this.cellSize - 4, this.cellSize - 4);
                } else {
                    this.add.rectangle(x, y, this.cellSize - 4, this.cellSize - 4, Phaser.Display.Color.HexStringToColor(this.theme.cell).color);
                }

                if (this.layout[r][c] === 1) {
                    let obs = this.createWallVisual(x, y);
                    this.obstacles[`${r},${c}`] = obs;
                } else if (this.layout[r][c] === 0 && Math.random() > 0.7 && !(r === this.dogPos.r && c === this.dogPos.c) && safeDecor.length > 0) {
                    let hasObj = this.mission.objectives.some(o => o.position.r === r && o.position.c === c);
                    let isHome = r === this.levelData.end.r && c === this.levelData.end.c;
                    if (!hasObj && !isHome) {
                        const decEmoji = safeDecor[Math.floor(Math.random() * safeDecor.length)];
                        this.add.text(x, y, decEmoji, { fontSize: Math.floor(this.cellSize*0.4)+'px' }).setOrigin(0.5).setAlpha(0.6).setDepth(-1);
                    }
                }
                
                const hitZone = this.add.zone(x, y, this.cellSize, this.cellSize).setInteractive({ useHandCursor: true });
                hitZone.on('pointerdown', () => this.handleCellClick(r, c));
            }
        }
        
        this.mission.objectives.forEach(obj => {
            const x = obj.position.c * this.cellSize + this.cellSize / 2;
            const y = obj.position.r * this.cellSize + this.cellSize / 2;
            const t = this.add.text(x, y, obj.emoji, { fontSize: Math.floor(this.cellSize*0.6)+'px' }).setOrigin(0.5);
            
            if (!isObjectiveBlocking(obj, this.missionState) && obj.type !== 'light' && obj.type !== 'plant') {
                this.tweens.add({ targets: t, y: y - 10, duration: 500, yoyo: true, repeat: -1 });
            } else if (obj.type === 'light') {
                this.tweens.add({ targets: t, scale: 1.1, duration: 1500, yoyo: true, repeat: -1 });
            }
            this.objectiveObjects.set(obj.id, t);
        });

        const endX = this.levelData.end.c * this.cellSize + this.cellSize / 2;
        const endY = this.levelData.end.r * this.cellSize + this.cellSize / 2;
        this.homeObj = this.add.text(endX, endY, '🏠', { fontSize: Math.floor(this.cellSize*0.8)+'px' }).setOrigin(0.5);
        
        const startX = this.dogPos.c * this.cellSize + this.cellSize / 2;
        const startY = this.dogPos.r * this.cellSize + this.cellSize / 2;
        
        // Cargar Caramelo en vez del emoji 🐶
        this.dogObj = this.add.image(startX, startY, 'caramelo-normal').setOrigin(0.5).setDepth(10);
        
        // Ajustar escala visual
        const targetHeight = this.cellSize * 0.80; // 80% de la celda
        this.dogObj.setScale(targetHeight / this.dogObj.height);
        
        this.speakerBtn = this.add.text(730, 860, '🔊', { fontSize: '50px' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(50);
        this.speakerBtn.on('pointerdown', () => {
            if (this.inputLocked && !this.isMoving) return;
            this.tweens.add({ targets: this.speakerBtn, scale: 1.2, duration: 100, yoyo: true });
            speakMaze(this.getCurrentSpeech());
        });
        
        this.createHUD();
        this.showIntro();
    }
    
    createWallVisual(x, y) {
        const wallKey = this.tiles && this.tiles.wall;
        if (wallKey && this.textures.exists(wallKey)) {
            // Container a escala 1: el tween de choque (scale 1.1 absoluto) se comporta igual que con el emoji.
            const size = this.cellSize * 0.86;
            return this.add.container(x, y, [this.add.image(0, 0, wallKey).setDisplaySize(size, size)]);
        }
        return this.add.text(x, y, this.theme.wall, { fontSize: Math.floor(this.cellSize*0.7)+'px' }).setOrigin(0.5);
    }

    createHUD() {
        this.hudContainer = this.add.container(20, 830).setDepth(50);
        const bg = this.add.rectangle(0, 0, 200, 60, 0xffffff, 0.8).setOrigin(0).setStrokeStyle(2, 0x000000);
        this.hudContainer.add(bg);
        
        this.hudItems = [];
        let xOff = 25;
        this.mission.objectives.forEach(obj => {
            if (!obj.optional) {
                let text = this.add.text(xOff, 15, obj.emoji, { fontSize: '30px' });
                this.hudContainer.add(text);
                this.hudItems.push({ obj, text });
                xOff += 40;
            }
        });
        bg.width = xOff + 10;
        this.updateHUD();
    }
    
    updateHUD() {
        let currentObj = this.getCurrentObjectiveObj();
        this.hudItems.forEach(item => {
            let isComplete = isObjectiveComplete(item.obj, this.missionState);
            
            if (isComplete) {
                item.text.setAlpha(1);
                item.text.setScale(1.2);
                if (item.obj.transformsTo && item.text.text !== item.obj.transformsTo) {
                    item.text.setText(item.obj.transformsTo);
                }
            } else {
                item.text.setAlpha(0.35);
                item.text.setScale(1);
            }
            
            if (currentObj && item.obj.id === currentObj.id && !isComplete) {
                item.text.setAlpha(1);
            }
        });
    }

    setCarameloState(textureKey) {
        if (!this.dogObj || !this.dogObj.active) return;
        
        const isFlipped = this.dogObj.flipX;
        
        // Asignar textura
        this.dogObj.setTexture(textureKey);
        
        // Reaplicar escala visual
        const targetHeight = this.cellSize * 0.80; 
        this.dogObj.setScale(targetHeight / this.dogObj.height);
        
        // Preservar estado
        this.dogObj.setFlipX(isFlipped);
        this.dogObj.setOrigin(0.5);
    }

    startCarameloWalk(direction) {
        if (this.carameloWalkTimer) {
            this.carameloWalkTimer.destroy();
            this.carameloWalkTimer = null;
        }

        if (direction === 'left') {
            this.dogObj.setFlipX(true);
        } else if (direction === 'right') {
            this.dogObj.setFlipX(false);
        }

        let frameIndex = 0;
        this.setCarameloState(CARAMELO_TEXTURES.walk[frameIndex]);

        this.carameloWalkTimer = this.time.addEvent({
            delay: 100, // approx 10 FPS
            loop: true,
            callback: () => {
                if (!this.dogObj || !this.dogObj.active) {
                    if (this.carameloWalkTimer) this.carameloWalkTimer.destroy();
                    return;
                }
                frameIndex = (frameIndex + 1) % CARAMELO_TEXTURES.walk.length;
                this.setCarameloState(CARAMELO_TEXTURES.walk[frameIndex]);
            }
        });
    }

    stopCarameloWalk() {
        if (this.carameloWalkTimer) {
            this.carameloWalkTimer.destroy();
            this.carameloWalkTimer = null;
        }
        this.setCarameloState(CARAMELO_TEXTURES.normal);
    }

    setCarameloEmotion(emotionKey, duration = null) {
        if (this.carameloEmotionTimer) {
            this.carameloEmotionTimer.destroy();
            this.carameloEmotionTimer = null;
        }
        
        // Stop walk if active
        this.stopCarameloWalk();
        
        // Set new emotion
        this.setCarameloState(emotionKey);

        if (duration) {
            this.carameloEmotionTimer = this.time.addEvent({
                delay: duration,
                callback: () => {
                    if (!this.dogObj || !this.dogObj.active) return;
                    this.setCarameloState(CARAMELO_TEXTURES.normal);
                    this.carameloEmotionTimer = null;
                }
            });
        }
    }

    getCurrentObjectiveObj() {
        // Priority 1: Unmet requirements (keys, switches, water, material)
        let requirement = this.mission.objectives.find(o => 
            (o.type === 'key' || o.type === 'switch' || o.type === 'water' || o.type === 'material') 
            && !isObjectiveComplete(o, this.missionState)
        );
        if (requirement) return requirement;
        
        // Priority 2: Blockers that can be opened/transformed (doors, gates, bridges)
        let blocker = this.mission.objectives.find(o => 
            isObjectiveBlocking(o, this.missionState) && areRequirementsMet(o, this.missionState)
        );
        if (blocker) return blocker;
        
        // Priority 3: Regular objectives (plant, friend, star, bone, light)
        let regular = this.mission.objectives.find(o => 
            !isObjectiveComplete(o, this.missionState) && !o.optional
        );
        if (regular) return regular;
        
        return null;
    }

    isMissionComplete() {
        return this.mission.objectives.every(o => isObjectiveComplete(o, this.missionState));
    }

    getCurrentSpeech() {
        let obj = this.getCurrentObjectiveObj();
        if (!obj) return "¡Ahora vamos a casa!";
        if (obj.type === 'key') return "¿Dónde está la llave?";
        if (obj.type === 'door') return "¡Abre la puerta con la llave!";
        if (obj.type === 'switch') return "¿Dónde está el botón?";
        if (obj.type === 'gate') return "¡Pasa por el camino abierto!";
        if (obj.type === 'friend') return "¿Dónde está tu amigo?";
        if (obj.type === 'star') return "¿Dónde está la estrella?";
        if (obj.type === 'water') return "¡Busca el agua!";
        if (obj.type === 'plant') return "¡Lleva el agua a la planta!";
        if (obj.type === 'material') return "¡Busca la madera!";
        if (obj.type === 'bridgeTarget') return "¡Construye el puente!";
        if (obj.type === 'light') return "¡Busca la luz!";
        return "¿Dónde está el hueso?";
    }

    showIntro() {
        let introKey = 'juegosSofi_maze_intro_shown';
        let shown = sessionStorage.getItem(introKey);
        
        if (!shown && currentMazeLevel === 0) {
            sessionStorage.setItem(introKey, 'true');
            const overlay = this.add.rectangle(400, 400, 800, 800, 0x000000, 0.5).setDepth(100);
            const introText = this.add.text(400, 400, `🐾\n¡LA AVENTURA\nDEL PERRITO!`, {
                fontSize: '60px', color: '#fff', fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', align: 'center'
            }).setOrigin(0.5).setDepth(101).setScale(0);
            
            this.tweens.add({
                targets: introText, scale: 1, duration: 400, ease: 'Back.out', hold: 1000, yoyo: true,
                onComplete: () => {
                    overlay.destroy(); introText.destroy();
                    this.showLevelIntro();
                }
            });
        } else {
            this.showLevelIntro();
        }
    }
    
    showLevelIntro() {
        const overlay = this.add.rectangle(400, 400, 800, 800, 0x000000, 0.5).setDepth(100);
        const introText = this.add.text(400, 400, `${this.theme.wall} ${this.theme.name.toUpperCase()}\n${this.mission.instruction.visual}`, {
            fontSize: '50px', color: '#fff', fontFamily: 'Nunito, sans-serif', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5).setDepth(101).setScale(0);
        
        this.tweens.add({
            targets: introText, scale: 1, duration: 400, ease: 'Back.out', hold: 1200, yoyo: true,
            onComplete: () => {
                overlay.destroy(); introText.destroy();
                this.inputLocked = false;
                if (this.mission.introSpeech) {
                    speakMaze(this.mission.introSpeech);
                    setTimeout(() => speakMaze(this.mission.instruction.speech), 2500);
                } else {
                    speakMaze(this.mission.instruction.speech);
                }
                this.tweens.add({ targets: this.dogObj, y: this.dogObj.y - 10, duration: 200, yoyo: true, repeat: 1 });
                this.resetHintTimers();
            }
        });
    }

    handleCellClick(r, c) {
        if (this.isMoving || this.inputLocked) return;
        this.resetIdleTimer();
        
        const rowDiff = Math.abs(this.dogPos.r - r);
        const colDiff = Math.abs(this.dogPos.c - c);
        
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Pared
            if (this.layout[r][c] === 1) {
                if(SofiApp.audio) SofiApp.audio.tap();
                let obs = this.obstacles[`${r},${c}`];
                if(obs) this.tweens.add({ targets: obs, scale: 1.1, duration: 100, yoyo: true });
                this.bumpDog(r, c);
                return;
            }
            
            // Blockers: door, gate, bridgeTarget
            let blocker = this.mission.objectives.find(o => o.position.r === r && o.position.c === c && isObjectiveBlocking(o, this.missionState));
            
            if (blocker) {
                if (!areRequirementsMet(blocker, this.missionState)) {
                    if(SofiApp.audio) SofiApp.audio.softError();
                    if (blocker.type === 'door') speakMaze("¡Primero busca la llave!");
                    else if (blocker.type === 'gate') speakMaze("¡Busca el botón!");
                    else if (blocker.type === 'bridgeTarget') speakMaze("¡Necesitamos un puente!");
                    
                    let bobj = this.objectiveObjects.get(blocker.id);
                    if(bobj) this.tweens.add({ targets: bobj, angle: {from: -10, to: 10}, duration: 100, yoyo: true, repeat: 2 });
                    
                    let reqId = blocker.requires || blocker.requiresActivation || (blocker.requiresKey ? 'key' : null);
                    if (reqId) {
                        let reqObj = this.objectiveObjects.get(reqId);
                        if (reqObj) this.tweens.add({ targets: reqObj, scale: 1.5, duration: 200, yoyo: true, repeat: 2 });
                    }
                    this.bumpDog(r, c);
                    return;
                } else {
                    this.inputLocked = true;
                    if (typeof playSuccessSound === 'function') playSuccessSound();
                    
                    let bobj = this.objectiveObjects.get(blocker.id);
                    
                    if (blocker.type === 'bridgeTarget') {
                        speakMaze("¡Construimos un puente!");
                        this.missionState.transformed.add(blocker.id);
                        if (bobj) {
                            bobj.setText(blocker.transformsTo);
                            this.showParticles(bobj.x, bobj.y, '✨', 5);
                            this.tweens.add({ targets: bobj, scale: 1.3, duration: 300, yoyo: true, onComplete: () => {
                                this.inputLocked = false;
                                this.updateHUD();
                                this.moveDogTo(r, c);
                            }});
                        }
                    } else {
                        // door or gate
                        speakMaze(blocker.type === 'door' ? "¡Se abrió la puerta!" : "¡Pasamos!");
                        this.missionState.opened.add(blocker.id);
                        if (bobj) {
                            this.showParticles(bobj.x, bobj.y, '✨', 5);
                            this.tweens.add({ targets: bobj, alpha: 0, scale: 0, duration: 500, onComplete: () => {
                                bobj.destroy();
                                this.inputLocked = false;
                                this.updateHUD();
                                this.moveDogTo(r, c);
                            }});
                        }
                    }
                    return;
                }
            }
            
            // Interaction sin bloqueo: Plant (requiere agua pero no bloquea paso por diseño)
            let plant = this.mission.objectives.find(o => o.type === 'plant' && o.position.r === r && o.position.c === c && !isObjectiveComplete(o, this.missionState));
            if (plant && !areRequirementsMet(plant, this.missionState)) {
                // Not blocking, just contextual feedback
                if(SofiApp.audio) SofiApp.audio.softError();
                speakMaze("¡Primero busca el agua!");
                let pobj = this.objectiveObjects.get(plant.id);
                if(pobj) this.tweens.add({ targets: pobj, angle: {from: -10, to: 10}, duration: 100, yoyo: true, repeat: 2 });
                let reqObj = this.objectiveObjects.get(plant.requires);
                if (reqObj) this.tweens.add({ targets: reqObj, scale: 1.5, duration: 200, yoyo: true, repeat: 2 });
                // We DON'T return. The dog can walk over it!
            }
            
            // Casa prematura
            if (r === this.levelData.end.r && c === this.levelData.end.c && !this.isMissionComplete()) {
                const now = Date.now();
                if (!this.lastHomePrematureTime || now - this.lastHomePrematureTime > 5000) {
                    this.lastHomePrematureTime = now;
                    if(SofiApp.audio) SofiApp.audio.softError();
                    let missingObj = this.getCurrentObjectiveObj();
                    if (missingObj) {
                        speakMaze(this.getCurrentSpeech()); // contextual
                        let m = this.objectiveObjects.get(missingObj.id);
                        if (m) this.tweens.add({ targets: m, scale: 1.5, duration: 200, yoyo: true, repeat: 2 });
                    }
                    this.tweens.add({ targets: this.homeObj, angle: {from: -10, to: 10}, duration: 100, yoyo: true, repeat: 2 });
                }
                // DO NOT BUMP. DO NOT RETURN. Allow transit!
            }

            this.resetHintTimers();
            this.moveDogTo(r, c);
        } else {
            if (this.dogPos.r !== r || this.dogPos.c !== c) {
                if(SofiApp.audio) SofiApp.audio.tap();
            }
        }
    }
    
    bumpDog(r, c) {
        this.tweens.add({
            targets: this.dogObj,
            x: this.dogObj.x + (c > this.dogPos.c ? 10 : (c < this.dogPos.c ? -10 : 0)),
            y: this.dogObj.y + (r > this.dogPos.r ? 10 : (r < this.dogPos.r ? -10 : 0)),
            duration: 100, yoyo: true, repeat: 1
        });
    }

    moveDogTo(r, c) {
        this.isMoving = true;
        
        let prevDogPos = { r: this.dogPos.r, c: this.dogPos.c };
        let prevDogXY = { x: this.dogObj.x, y: this.dogObj.y };
        
        this.dogPos = { r, c };
        
        if (typeof playTone === 'function') {
            if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            playTone(600, 'sine', 0.1, audioCtx ? audioCtx.currentTime : 0);
        }

        const targetX = c * this.cellSize + this.cellSize / 2;
        const targetY = r * this.cellSize + this.cellSize / 2;
        
        let direction = 'down';
        if (targetX < this.dogObj.x) direction = 'left';
        else if (targetX > this.dogObj.x) direction = 'right';
        else if (targetY < this.dogObj.y) direction = 'up';
        
        this.startCarameloWalk(direction);
        
        if(Math.random() > 0.5) {
            let footprint = this.add.text(this.dogObj.x, this.dogObj.y, '🐾', {fontSize:'20px'}).setOrigin(0.5).setAlpha(0.5).setDepth(5);
            this.tweens.add({ targets: footprint, alpha: 0, duration: 800, onComplete: ()=>footprint.destroy() });
        }
        
        this.tweens.add({
            targets: this.dogObj, x: targetX, y: targetY, duration: 250,
            onComplete: () => {
                this.stopCarameloWalk();
                this.isMoving = false;
                
                // Move companions
                this.missionState.companions.forEach(compId => {
                    let compSprite = this.companionSprites.get(compId);
                    if (compSprite) {
                        if (prevDogXY.x < compSprite.x) compSprite.flipX = true;
                        else if (prevDogXY.x > compSprite.x) compSprite.flipX = false;
                        
                        this.tweens.add({ targets: compSprite, x: prevDogXY.x, y: prevDogXY.y, duration: 200 });
                    }
                });
                
                this.checkAmbientEvents();
                this.checkCellEvents();
            }
        });
    }

    checkAmbientEvents() {
        const { r, c } = this.dogPos;
        if (!this.events) return;
        this.events.forEach(e => {
            if (!this.triggeredEvents.has(e.id)) {
                const rowDiff = Math.abs(e.trigger.r - r);
                const colDiff = Math.abs(e.trigger.c - c);
                // Trigger if adjacent or on it
                if (rowDiff <= 1 && colDiff <= 1) {
                    this.triggeredEvents.add(e.id);
                    const tx = e.trigger.c * this.cellSize + this.cellSize / 2;
                    const ty = e.trigger.r * this.cellSize + this.cellSize / 2;
                    
                    if (e.type === 'discovery') {
                        if (SofiApp.audio) SofiApp.audio.success();
                        if (e.speech) speakMaze(e.speech);
                        let p = this.add.text(tx, ty, e.emoji, { fontSize: '40px' }).setOrigin(0.5).setDepth(20);
                        this.tweens.add({ targets: p, y: ty - 50, scale: 1.5, duration: 800, yoyo: true, onComplete: () => p.destroy() });
                        this.showParticles(tx, ty, '✨', 5);
                    } else if (e.type === 'surprise') {
                        this.showParticles(tx, ty, e.emoji || '🌸', 8);
                    } else {
                        // ambient
                        let p = this.add.text(tx, ty, e.emoji, { fontSize: '30px' }).setOrigin(0.5).setDepth(20);
                        this.tweens.add({ targets: p, y: ty - 50, alpha: 0, scale: 1.5, duration: 1500, onComplete: () => p.destroy() });
                    }
                }
            }
        });
    }

    checkCellEvents() {
        const { r, c } = this.dogPos;
        // Non-blocking objectives to interact with here
        let obj = this.mission.objectives.find(o => 
            o.position.r === r && o.position.c === c && 
            !isObjectiveComplete(o, this.missionState) && 
            !isObjectiveBlocking(o, this.missionState)
        );
        
        if (obj) {
            // Check requirements for plant
            if (obj.type === 'plant' && !areRequirementsMet(obj, this.missionState)) {
                return; // Interaction is handled in bump logic above, nothing to complete here.
            }
            
            this.inputLocked = true;
            if (typeof playSuccessSound === 'function') playSuccessSound();
            let vis = this.objectiveObjects.get(obj.id);
            let delayAfter = 1500;
            
            if (obj.type === 'switch') {
                this.missionState.collected.add(obj.id); // Or activated
                if (vis) {
                    vis.setText('✅');
                    this.tweens.add({ targets: vis, scale: 1.5, duration: 300, yoyo: true });
                }
                speakMaze("¡Se abrió el camino!");
                let gate = this.mission.objectives.find(o => o.type === 'gate' && o.requiresActivation === obj.id);
                if (gate) {
                    this.missionState.opened.add(gate.id);
                    let gVis = this.objectiveObjects.get(gate.id);
                    if (gVis) {
                        this.showParticles(gVis.x, gVis.y, '✨', 5);
                        this.tweens.add({ targets: gVis, alpha: 0, scale: 0, duration: 500, delay: 500, onComplete: () => gVis.destroy() });
                    }
                }
            } else if (obj.type === 'light') {
                this.missionState.activated.add(obj.id);
                speakMaze("¡Ahora hay luz!");
                if (vis) {
                    vis.setText('✨');
                    this.tweens.add({ targets: vis, y: vis.y - 50, alpha: 0, scale: 2, duration: 1000, onComplete: () => vis.destroy() });
                }
                // Environmental transformation
                this.cameras.main.setBackgroundColor('#5c6bc0'); // Lighter night
                delayAfter = 1000;
            } else if (obj.type === 'plant') {
                this.missionState.transformed.add(obj.id);
                speakMaze("¡La flor creció!");
                if (vis) {
                    vis.setText(obj.transformsTo);
                    this.showParticles(vis.x, vis.y, '✨', 5);
                    this.tweens.add({ targets: vis, scale: 1.3, duration: 400, yoyo: true });
                }
            } else if (obj.type === 'friend' && obj.follow) {
                this.missionState.companions.add(obj.id);
                this.showParticles(this.dogObj.x, this.dogObj.y, '❤️', 5);
                speakMaze(this.isMissionComplete() ? "¡Encontraste a tu amigo! Vamos a casa." : "¡Encontraste a tu amigo!");
                if (vis) {
                    this.tweens.killTweensOf(vis);
                    vis.setDepth(9);
                    this.companionSprites.set(obj.id, vis);
                }
            } else if (obj.type === 'secret') {
                this.missionState.collected.add(obj.id);
                speakMaze("¡Encontraste un secreto!");
                if (vis) {
                    this.tweens.add({ targets: vis, y: vis.y - 50, alpha: 0, scale: 2, duration: 500, onComplete: () => vis.destroy() });
                }
                this.showParticles(this.dogObj.x, this.dogObj.y, '✨', 5);
            } else {
                this.missionState.collected.add(obj.id);
                if (vis) {
                    this.tweens.add({ targets: vis, y: vis.y - 50, alpha: 0, scale: 2, duration: 500, onComplete: () => vis.destroy() });
                }
                
                let isComplete = this.isMissionComplete();
                
                if (obj.type === 'key') {
                    speakMaze("¡Encontraste la llave!");
                    let door = this.objectiveObjects.get('door');
                    if (door) this.tweens.add({targets: door, scale: 1.3, duration: 300, yoyo: true, repeat: 1, delay: 1000});
                } else if (obj.type === 'friend') {
                    this.showParticles(this.dogObj.x, this.dogObj.y, '❤️', 5);
                    speakMaze(isComplete ? "¡Encontraste a tu amigo! Vamos a casa." : "¡Encontraste a tu amigo!");
                } else if (obj.type === 'star') {
                    speakMaze(isComplete ? "¡Encontraste todas las estrellas! Vamos a casa." : "¡Una estrella!");
                } else if (obj.type === 'water') {
                    speakMaze("¡Encontraste agua!");
                } else if (obj.type === 'material') {
                    speakMaze("¡Encontraste madera!");
                } else {
                    speakMaze(isComplete ? "¡Encontraste todos! Ahora vamos a casa." : "¡Encontraste uno! Falta otro.");
                }
                
                if (obj.type !== 'secret') {
                    this.showParticles(this.dogObj.x, this.dogObj.y, obj.emoji, 5);
                }
            }
            
            let emotion = CARAMELO_TEXTURES.happy;
            if (obj.type === 'bone') emotion = CARAMELO_TEXTURES.foundBone;
            this.setCarameloEmotion(emotion, 1500);
            
            this.tweens.add({ targets: this.dogObj, y: this.dogObj.y - 15, duration: 150, yoyo: true, repeat: 2 });
            this.updateHUD();
            
            this.time.delayedCall(delayAfter, () => {
                if (this.isMissionComplete()) {
                    this.tweens.add({ targets: this.homeObj, scale: 1.2, duration: 300, yoyo: true, repeat: 1 });
                    this.showParticles(this.homeObj.x, this.homeObj.y, '✨', 5);
                    speakMaze("¡Ahora vamos a casa!");
                }
                this.inputLocked = false;
                this.resetHintTimers();
            });
        }
        
        else if (r === this.levelData.end.r && c === this.levelData.end.c && this.isMissionComplete()) {
            if (this.isLevelCompleting) return;
            this.isLevelCompleting = true;
            this.inputLocked = true;
            if (typeof playSuccessSound === 'function') playSuccessSound();
            
            this.setCarameloEmotion(CARAMELO_TEXTURES.celebrate);
            
            this.tweens.add({ targets: this.homeObj, scale: 1.3, duration: 300, yoyo: true, repeat: 1 });
            this.tweens.add({ targets: this.dogObj, y: this.dogObj.y - 20, duration: 200, yoyo: true, repeat: 3 });
            this.showParticles(this.homeObj.x, this.homeObj.y, '✨', 8);
            speakMaze("¡Llegamos a casa!");
            
            // Move companions to home too
            this.missionState.companions.forEach(compId => {
                let compSprite = this.companionSprites.get(compId);
                if (compSprite) {
                    this.tweens.add({ targets: compSprite, x: this.homeObj.x, y: this.homeObj.y, duration: 500 });
                }
            });
            
            this.time.delayedCall(2000, () => {
                if (SofiApp.progress) SofiApp.progress.recordEvent(`maze-level-${currentMazeLevel + 1}`);
                currentMazeLevel++;
                if (currentMazeLevel < currentMazeAdventure.length) this.scene.restart();
                else {
                    if (SofiApp.progress) SofiApp.progress.unlockSticker('exploradora');
                    this.scene.start('FinalCelebrationScene');
                }
            });
        }
    }

    getBlockedCells() {
        let blocked = new Set();
        this.mission.objectives.filter(o => isObjectiveBlocking(o, this.missionState)).forEach(o => {
            blocked.add(`${o.position.r},${o.position.c}`);
        });
        return blocked;
    }

    resetIdleTimer() {
        if (this.idleTimer) this.idleTimer.remove();
        if (this.inputLocked) return;
        
        this.idleTimer = this.time.delayedCall(6000, () => {
            if (this.inputLocked || this.isMoving) return;
            this.setCarameloEmotion(CARAMELO_TEXTURES.thinking, 1500);
            this.tweens.add({ targets: this.dogObj, angle: {from: -15, to: 15}, duration: 200, yoyo: true, repeat: 1 });
            let mark = this.add.text(this.dogObj.x + 20, this.dogObj.y - 30, '❓', {fontSize:'30px'}).setOrigin(0.5);
            this.tweens.add({ targets: mark, alpha: 0, y: mark.y - 20, duration: 1000, onComplete: ()=>mark.destroy() });
        });
    }

    resetHintTimers() {
        this.resetIdleTimer();
        if (this.hintTimer1) this.hintTimer1.remove();
        if (this.hintTimer2) this.hintTimer2.remove();
        if (this.hintTimer3) this.hintTimer3.remove();
        if (this.inputLocked) return;
        
        this.hintTimer1 = this.time.delayedCall(10000, () => {
            let obj = this.getCurrentObjectiveObj();
            let target = obj ? this.objectiveObjects.get(obj.id) : this.homeObj;
            if(target) this.tweens.add({ targets: target, scale: 1.3, duration: 400, yoyo: true, repeat: 1 });
        });
        
        this.hintTimer2 = this.time.delayedCall(20000, () => {
            speakMaze(this.getCurrentSpeech());
        });
        
        this.hintTimer3 = this.time.delayedCall(30000, () => {
            let obj = this.getCurrentObjectiveObj();
            let targetPos = obj ? obj.position : this.levelData.end;
            if(targetPos) {
                let path = getMazePath(this.dogPos, targetPos, this.layout, this.getBlockedCells());
                if(path && path.length > 1) {
                    let nextStep = path[1];
                    let nx = nextStep.c * this.cellSize + this.cellSize / 2;
                    let ny = nextStep.r * this.cellSize + this.cellSize / 2;
                    let hintFoot = this.add.text(nx, ny, '🐾', {fontSize:'40px'}).setOrigin(0.5).setAlpha(0);
                    this.tweens.add({ targets: hintFoot, alpha: 1, yoyo: true, duration: 800, repeat: 2, onComplete: ()=>hintFoot.destroy() });
                }
            }
        });
    }

    showParticles(x, y, emoji, count) {
        for (let i = 0; i < count; i++) {
            const p = this.add.text(x, y, emoji, { fontSize: '30px' }).setOrigin(0.5);
            p.setDepth(20);
            this.tweens.add({
                targets: p, x: x + Phaser.Math.Between(-50, 50), y: y - Phaser.Math.Between(50, 150),
                alpha: 0, scale: 1.5, duration: 1000, onComplete: () => p.destroy()
            });
        }
    }
}

class FinalCelebrationScene extends Phaser.Scene {
    constructor() { super('FinalCelebrationScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#ffb3ba');
        const cx = 400; const cy = 400;
        
        if(levelTitle3) levelTitle3.classList.add('hidden');
        
        this.add.text(cx, cy - 150, '🎉 ¡Terminaste la aventura! 🎉', { fontSize: '50px', color: '#fff', fontFamily: 'Nunito, sans-serif', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
        this.add.text(cx, cy - 50, '¡El perrito llegó a casa!', { fontSize: '40px', color: '#fff', fontFamily: 'Nunito, sans-serif', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        
        const dog = this.add.text(cx - 100, cy + 100, '🐶', { fontSize: '100px' }).setOrigin(0.5);
        const home = this.add.text(cx + 100, cy + 100, '🏠', { fontSize: '120px' }).setOrigin(0.5);
        this.tweens.add({ targets: [dog, home], y: cy + 50, duration: 500, yoyo: true, repeat: -1 });
        
        this.time.addEvent({
            delay: 300, loop: true,
            callback: () => {
                const emojis = ['⭐', '❤️', '🎉', '🦴', '🌈', '✨', '🔑', '🐰', '🌷', '🌉'];
                const p = this.add.text(Phaser.Math.Between(50, 750), 950, Phaser.Math.RND.pick(emojis), { fontSize: '40px' }).setOrigin(0.5);
                this.tweens.add({ targets: p, y: -50, x: p.x + Phaser.Math.Between(-100, 100), duration: 3000, angle: 360, onComplete: () => p.destroy() });
            }
        });
        
        speakMaze("¡Muy bien Sofi! ¡Terminaste la aventura!");
        
        const btnBg = this.add.rectangle(cx, cy + 250, 300, 80, 0x4caf50, 1).setInteractive({ useHandCursor: true });
        btnBg.setStrokeStyle(4, 0xffffff);
        const btnText = this.add.text(cx, cy + 250, '🐾 OTRA AVENTURA', { fontSize: '30px', fontFamily: 'Nunito, sans-serif', color: '#ffffff' }).setOrigin(0.5);
        
        btnBg.on('pointerdown', () => {
            this.tweens.add({
                targets: [btnBg, btnText], scale: 0.9, duration: 100, yoyo: true,
                onComplete: () => {
                    stopMazeSpeech();
                    currentMazeLevel = 0;
                    buildMazeAdventure();
                    if(levelTitle3) levelTitle3.classList.remove('hidden');
                    this.scene.start('MazeScene');
                }
            });
        });
    }
}

SofiApp.navigation.registerView('game3', {
    onEnter: () => {
        if(levelTitle3) levelTitle3.classList.remove('hidden');
        currentMazeLevel = 0;
        buildMazeAdventure();
        initMazePhaser();
    },
    onExit: () => {
        stopMazeSpeech();
        if (mazeGameInstance) {
            mazeGameInstance.destroy(true);
            mazeGameInstance = null;
        }
    }
});
