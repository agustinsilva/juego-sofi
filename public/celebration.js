// 8D.2C — Celebration Core.
// Coordina, jerarquiza y temporiza las celebraciones que ya existen (juegos, cola de rewards, guía).
// No otorga premios, no guarda nada y no dibuja partículas: eso sigue siendo de cada dueño.
//
// Niveles: 0 micro (local, no pasa por acá) · 1 progreso · 2 logro · 3 colección completa.
// Una sola celebración global a la vez: mientras está activa, un pedido de nivel igual o menor se ignora
// y uno mayor la reemplaza (corta su voz y suena el suyo). Sin cola propia: la cola de premios ya existe.
// Se carga después de app-core.js y antes de script.js.
(function () {
    'use strict';
    if (!window.SofiApp) return;

    // ------------------------------------------------------------------ copy
    // Una frase corta por momento, en español rioplatense (voseo). Un array = variantes al azar.
    // A futuro la resolución puede ser: key → grabación (si existe) → TTS. Hoy es solo TTS.
    const CELEBRATION_COPY = {
        'differences.roundComplete': ['¡Muy bien!', '¡Genial!', '¡Bravo!', '¡Lo encontraste!'],
        'memory.levelComplete': '¡Muy bien!',
        'memory.halfway': '¡Ya vamos por la mitad!',
        'maze.worldComplete': '¡Llegamos a casa!',
        'differences.adventureComplete': '¡Terminaste la aventura, Sofi!',
        'maze.adventureComplete': '¡Lo logramos, Sofi!',
        'memory.adventureComplete': '¡Qué buena memoria, Sofi!',
        'painting.drawingComplete': '¡Qué lindo te quedó!',
        'cat.friendship': '¡Qué buena amiga sos!',
        'collectionComplete': '¡Juntaste todo!'
    };

    function resolveCopy(key) {
        const entry = key ? CELEBRATION_COPY[key] : null;
        if (!entry) return null;
        return Array.isArray(entry) ? entry[Math.floor(Math.random() * entry.length)] : entry;
    }

    const hasSpeech = () => 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

    // ----------------------------------------------------------------- voice
    // Una frase a la vez, sin backlog. Una frase de nivel igual o mayor corta la anterior; una menor se ignora
    // mientras la anterior sigue sonando.
    SofiApp.voice = {
        _utterance: null,
        _level: -1,

        _isSpeaking() {
            if (!this._utterance || !hasSpeech()) return false;
            return window.speechSynthesis.speaking || window.speechSynthesis.pending;
        },

        // Devuelve la frase dicha (o la que se diría si no hay TTS), o null si no hay copy o la prioridad la ignora.
        say(key, options = {}) {
            const level = typeof options.level === 'number' ? options.level : 0;
            const text = resolveCopy(key);
            if (!text) return null;
            if (this._isSpeaking() && level < this._level) return null;
            this.cancel();
            if (!hasSpeech() || !SofiApp.audio.enabled) return text;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-AR';
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            const release = () => {
                if (this._utterance === utterance) { this._utterance = null; this._level = -1; }
            };
            utterance.onend = release;
            utterance.onerror = release;
            this._utterance = utterance;
            this._level = level;
            window.speechSynthesis.speak(utterance);
            return text;
        },

        // Corta todo lo que se esté diciendo (también la voz de los juegos): lo usa la navegación.
        cancel() {
            this._utterance = null;
            this._level = -1;
            if (hasSpeech()) window.speechSynthesis.cancel();
        },

        // Corta solo si la frase en curso es de este helper (para no pisar la voz propia de un juego).
        _stopOwn() {
            if (this._isSpeaking()) this.cancel();
        }
    };

    // ---------------------------------------------------------------- motion
    // Lectura en vivo (sin cache) de prefers-reduced-motion. Sin matchMedia: false.
    SofiApp.motion = {};
    Object.defineProperty(SofiApp.motion, 'reduced', {
        enumerable: true,
        get() {
            try {
                return typeof window.matchMedia === 'function'
                    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            } catch (e) {
                return false;
            }
        }
    });

    // ----------------------------------------------------------- celebration
    const ACTIVE_WINDOW_MS = { 1: 1500, 2: 3000, 3: 4000 };
    // Voz de las cards de premio (8D.2E): una card habla solo si reemplaza a una celebración que pidió un juego
    // (Arcoíris sobre el L2 del juego que dio el 5.º sticker) y nunca después de navegar (carryover). Las cards de
    // estrella y de sticker no tienen frase (event: null): su texto ya se ve y la frase del momento es la del juego.
    // Antes había un switch REWARD_CARD_VOICE (siempre false); con los 5 juegos migrados no cambiaba nada y se sacó.

    const state = { active: false, level: 0, event: null, source: null, timer: null, carryover: false };
    let carryoverWait = null;

    function resetState() {
        if (state.timer) clearTimeout(state.timer);
        state.active = false;
        state.level = 0;
        state.event = null;
        state.source = null;
        state.timer = null;
    }

    SofiApp.celebration = {
        // { level: 1|2|3, event: copy key | null, source } → { text, level, event, source } o null si se ignora.
        play(request = {}) {
            const level = request.level;
            if (level !== 1 && level !== 2 && level !== 3) return null;
            if (state.active && level <= state.level) return null;

            const event = request.event || null;
            const source = request.source || null;
            const supersededGameMoment = state.active && state.source !== 'rewards';
            if (state.active) SofiApp.voice._stopOwn(); // reemplaza a una celebración menor
            resetState();
            state.active = true;
            state.level = level;
            state.event = event;
            state.source = source;
            state.timer = setTimeout(resetState, ACTIVE_WINDOW_MS[level]);

            if (SofiApp.audio && SofiApp.audio.cue) SofiApp.audio.cue(level);

            let text = null;
            if (event) {
                // Las cards que siguen a Sofi después de navegar (carryover) nunca hablan.
                const fromRewards = source === 'rewards';
                const mayTalk = !fromRewards || (!state.carryover && supersededGameMoment);
                text = mayTalk ? SofiApp.voice.say(event, { level }) : resolveCopy(event);
            }
            return { text, level, event, source };
        },

        // Corta la celebración en curso y su voz. No toca la cola de premios ni la reacción pendiente del guía.
        // Si quedan cards en la cola, las que siguen se muestran y suenan, pero sin voz (carryover).
        cancel() {
            resetState();
            if (SofiApp.voice) SofiApp.voice.cancel();
            if (SofiApp.rewards && SofiApp.rewards.isBusy()) {
                state.carryover = true;
                if (!carryoverWait) {
                    carryoverWait = SofiApp.rewards.whenIdle(() => { carryoverWait = null; state.carryover = false; });
                }
            }
        },

        currentLevel() {
            return state.active ? state.level : 0;
        }
    };
})();
