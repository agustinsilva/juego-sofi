// collection.js - MIS COSAS 2.0 (8D.1C)
// Modelo derivado + render + interacciones de la colección. No guarda nada, no otorga premios y no lee catState:
// todo sale de SofiApp.progress.state ({stars, stickers[], events[]}).

// Catálogo fijo de la colección. Los IDs de eventos y stickers son los que ya usan los juegos.
// Pintar: dibujos de drawings.js (bitsy, buddy, sparks). Laberinto: orden de mazeWorlds en game3.js
// (buildMazeAdventure recorre los mundos en orden, así que maze-level-N es siempre el mundo N).
const COLLECTION_GAMES = [
    {
        id: 'differences', name: 'Diferencias', icon: '/assets/icons/games/icon-differences.webp', sticker: 'detective',
        tokens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({ kind: 'star', event: `differences-level-${n}` }))
    },
    {
        id: 'painting', name: 'Pintar', icon: '/assets/icons/games/icon-painting.webp', sticker: 'artista',
        tokens: ['bitsy', 'buddy', 'sparks'].map(ref => ({ kind: 'drawing', ref, event: `painting-${ref}`, image: `/images/${ref}.jpg` }))
    },
    {
        id: 'maze', name: 'Laberinto', icon: '/assets/icons/games/icon-maze.webp', sticker: 'exploradora',
        tokens: ['forest', 'garden', 'beach', 'snow', 'night', 'magic'].map((ref, i) => ({
            kind: 'world', ref, event: `maze-level-${i + 1}`, image: `/assets/backgrounds/maze/maze-floor-${ref}.webp`
        }))
    },
    {
        // Solo los hitos 5, 10 y 15 (amiga llega a los 15). Los siguientes (20, 25…) no se muestran.
        id: 'cat', name: 'Mi Gatito', icon: '/assets/icons/games/icon-cat.webp', sticker: 'amiga',
        tokens: [5, 10, 15].map(n => ({ kind: 'star', event: `cat-milestone-${n}` }))
    },
    {
        id: 'memory', name: 'Memoria', icon: '/assets/icons/games/icon-memory.webp', sticker: 'memoriosa',
        tokens: [1, 2, 3, 4, 5].map(n => ({ kind: 'star', event: `memory-level-${n}` }))
    }
];

const COLLECTION_SPECIAL = {
    id: 'arcoiris',
    requires: ['detective', 'artista', 'exploradora', 'amiga', 'memoriosa']
};

// Visual de cada sticker cuando stickersConfig no trae asset (Detective, Artista y Memoriosa, 8D.1D).
// El emoji queda como respaldo si la imagen no carga (ver el listener de 'error').
const COLLECTION_STICKER_FALLBACK = {
    detective: { name: 'Detective', emoji: '🔍', asset: '/assets/icons/stickers/sticker-detective.webp' },
    artista: { name: 'Artista', emoji: '🎨', asset: '/assets/icons/stickers/sticker-artista.webp' },
    exploradora: { name: 'Exploradora', emoji: '🐾', asset: '/assets/icons/shared/icon-paw.webp' },
    amiga: { name: 'Amiga', emoji: '❤️', asset: '/assets/icons/shared/icon-heart.webp' },
    memoriosa: { name: 'Memoriosa', emoji: '🦉', asset: '/assets/icons/stickers/sticker-memoriosa.webp' },
    arcoiris: { name: 'Arcoíris', emoji: '🌈', asset: '/assets/icons/shared/icon-rainbow.webp' }
};

const COLLECTION_STAR_ICON = '/assets/icons/shared/icon-star.webp';
const COLLECTION_SPARKLE_ICON = '/assets/icons/shared/icon-sparkle.webp';

function getCollectionSticker(id, owned) {
    const config = (SofiApp.progress && SofiApp.progress.stickersConfig && SofiApp.progress.stickersConfig[id]) || {};
    const fallback = COLLECTION_STICKER_FALLBACK[id] || {};
    return {
        id,
        name: config.name || fallback.name || id,
        emoji: config.emoji || fallback.emoji || '✨',
        asset: config.asset || fallback.asset || null,
        unlocked: owned.includes(id)
    };
}

window.buildCollectionModel = function () {
    const state = (SofiApp.progress && SofiApp.progress.state) || {};
    const events = Array.isArray(state.events) ? state.events : [];
    const stickers = Array.isArray(state.stickers) ? state.stickers : [];
    const stars = Number.isFinite(state.stars) ? state.stars : 0;

    const games = COLLECTION_GAMES.map(game => {
        const tokens = game.tokens.map(token => ({ ...token, done: events.includes(token.event) }));
        return {
            id: game.id,
            name: game.name,
            icon: game.icon,
            tokens,
            sticker: getCollectionSticker(game.sticker, stickers),
            complete: tokens.every(t => t.done)
        };
    });

    const specialSticker = getCollectionSticker(COLLECTION_SPECIAL.id, stickers);
    const special = {
        ...specialSticker,
        requires: COLLECTION_SPECIAL.requires.map(id => ({
            id,
            icon: (games.find(g => g.sticker.id === id) || {}).icon,
            unlocked: stickers.includes(id)
        }))
    };

    const activeStickers = [...COLLECTION_SPECIAL.requires, COLLECTION_SPECIAL.id];
    return {
        stars,
        games,
        special,
        collectionComplete: activeStickers.every(id => stickers.includes(id))
    };
};

function renderCollectionStickerVisual(sticker, extraClass) {
    const visual = sticker.asset
        ? `<img src="${sticker.asset}" alt="" aria-hidden="true" class="collection-sticker__image collection-sticker__image--${sticker.id}" data-fallback-emoji="${sticker.emoji}" draggable="false">`
        : `<span class="collection-sticker__emoji" aria-hidden="true">${sticker.emoji}</span>`;
    const sparkle = sticker.unlocked
        ? ''
        : `<img src="${COLLECTION_SPARKLE_ICON}" alt="" aria-hidden="true" class="collection-sticker__hint" draggable="false">`;
    const name = sticker.unlocked ? `<span class="collection-sticker__name">${sticker.name}</span>` : '';
    return `<span class="collection-sticker ${sticker.unlocked ? 'is-earned' : 'is-pending'} ${extraClass || ''}">`
        + `<span class="collection-sticker__visual">${visual}${sparkle}</span>${name}</span>`;
}

function renderCollectionToken(token) {
    const state = token.done ? 'is-done' : 'is-pending';
    if (token.kind === 'star') {
        return `<span class="collection-token collection-token--star ${state}">`
            + `<img src="${COLLECTION_STAR_ICON}" alt="" aria-hidden="true" draggable="false"></span>`;
    }
    const badge = token.done
        ? `<img src="${COLLECTION_STAR_ICON}" alt="" aria-hidden="true" class="collection-token__badge" draggable="false">`
        : '';
    return `<span class="collection-token collection-token--${token.kind} ${state}">`
        + `<img src="${token.image}" alt="" aria-hidden="true" class="collection-token__image" draggable="false">${badge}</span>`;
}

function renderCollectionGameCard(game, index) {
    const doneCount = game.tokens.filter(t => t.done).length;
    const classes = ['collection-game', `collection-game--${game.id}`, game.sticker.unlocked ? 'is-earned' : 'is-pending'];
    if (game.complete) classes.push('is-complete');
    const label = `${game.name}: ${doneCount} de ${game.tokens.length}. ${game.sticker.name}, ${game.sticker.unlocked ? 'obtenido' : 'pendiente'}`;
    return `<button type="button" class="${classes.join(' ')}" data-collection-game="${game.id}" style="--i:${index}" aria-label="${label}">`
        + `<span class="collection-game__identity"><img src="${game.icon}" alt="" aria-hidden="true" class="collection-game__icon" draggable="false"></span>`
        + `<span class="collection-game__progress collection-progress--${game.id}">${game.tokens.map(renderCollectionToken).join('')}</span>`
        + renderCollectionStickerVisual(game.sticker)
        + `</button>`;
}

function renderCollectionSpecialCard(special, index) {
    const classes = ['collection-game', 'collection-game--special', special.unlocked ? 'is-earned' : 'is-pending'];
    const label = `${special.name}, ${special.unlocked ? 'obtenido' : 'pendiente'}`;
    const requires = special.requires.map(req =>
        `<span class="collection-special__req ${req.unlocked ? 'is-done' : 'is-pending'}">`
        + `<img src="${req.icon}" alt="" aria-hidden="true" draggable="false"></span>`
    ).join('');
    return `<button type="button" class="${classes.join(' ')}" data-collection-special="${special.id}" style="--i:${index}" aria-label="${label}">`
        + renderCollectionStickerVisual(special, 'collection-sticker--special')
        + `<span class="collection-special__requires">${requires}</span>`
        + `</button>`;
}

window.renderCollection = function () {
    const gamesEl = document.getElementById('collection-games');
    const specialEl = document.getElementById('collection-special');
    if (!gamesEl || !specialEl) return;

    const model = window.buildCollectionModel();
    const starsText = document.getElementById('collection-stars-text');
    if (starsText) starsText.innerText = model.stars;

    gamesEl.innerHTML = model.games.map(renderCollectionGameCard).join('');
    specialEl.innerHTML = renderCollectionSpecialCard(model.special, model.games.length);

    const container = document.getElementById('collection-container');
    if (container) container.classList.toggle('is-collection-complete', model.collectionComplete);
};

// Reinicia una animación CSS de un solo uso (la clase se saca sola al terminar).
function playCollectionAnimation(el, className, delayMs) {
    if (!el) return;
    el.classList.remove(className);
    el.style.animationDelay = delayMs ? `${delayMs}ms` : '';
    void el.offsetWidth;
    el.classList.add(className);
    el.addEventListener('animationend', () => {
        el.classList.remove(className);
        el.style.animationDelay = '';
    }, { once: true });
}

function showCollectionSparkles(card) {
    const visual = card.querySelector('.collection-sticker__visual');
    if (!visual) return;
    ['-28px, -30px', '30px, -24px', '0px, -40px'].forEach((offset, i) => {
        const sparkle = document.createElement('span');
        sparkle.className = 'collection-sparkle';
        sparkle.textContent = '✨';
        sparkle.setAttribute('aria-hidden', 'true');
        sparkle.style.setProperty('--collection-sparkle-to', `translate(${offset})`);
        sparkle.style.animationDelay = `${i * 60}ms`;
        sparkle.addEventListener('animationend', () => sparkle.remove(), { once: true });
        visual.appendChild(sparkle);
    });
}

function handleCollectionTap(card) {
    if (SofiApp.audio) SofiApp.audio.tap();
    const earned = card.classList.contains('is-earned');
    const sticker = card.querySelector('.collection-sticker');

    if (earned) {
        playCollectionAnimation(sticker, 'is-popped');
        showCollectionSparkles(card);
        return;
    }

    playCollectionAnimation(sticker, 'is-shining');
    if (card.dataset.collectionSpecial) {
        // Arcoíris pendiente: los 5 juegos que hacen falta saltan en secuencia.
        document.querySelectorAll('#collection-games .collection-game__icon')
            .forEach((icon, i) => playCollectionAnimation(icon, 'is-hopping', i * 120));
    } else {
        playCollectionAnimation(card.querySelector('.collection-game__icon'), 'is-hopping');
    }
}

// Un solo listener delegado, registrado una vez: re-renderizar no acumula listeners.
(function bindCollectionInteractions() {
    const main = document.getElementById('collection-main');
    if (!main) return;
    main.addEventListener('click', (e) => {
        const card = e.target.closest('.collection-game');
        if (card && main.contains(card)) handleCollectionTap(card);
    });
    // 'error' no burbujea: se escucha en captura. Si un sticker no carga, se reemplaza por su emoji.
    main.addEventListener('error', (e) => {
        const img = e.target;
        if (!(img instanceof HTMLImageElement) || !img.classList.contains('collection-sticker__image')) return;
        const emoji = document.createElement('span');
        emoji.className = 'collection-sticker__emoji';
        emoji.setAttribute('aria-hidden', 'true');
        emoji.textContent = img.dataset.fallbackEmoji || '✨';
        img.replaceWith(emoji);
    }, true);
})();

SofiApp.navigation.registerView('collection', {
    onEnter: () => {
        if (typeof window.refreshHomeProgress === 'function') window.refreshHomeProgress();
        window.renderCollection();
    },
    onExit: () => {}
});
