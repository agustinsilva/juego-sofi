// app-core.js - CORE SYSTEM FOR SOFI APP


const HOME_DISCOVERIES = [
    { id: 'butterfly', emoji: '🦋', type: 'interactive', time: 'day', reaction: '¡Una mariposa! 🦋' },
    { id: 'rainbow', emoji: '🌈', type: 'ambient', time: 'day', reaction: null },
    { id: 'balloon', emoji: '🎈', type: 'interactive', time: 'day', reaction: '¡Un globo! 🎈' },
    { id: 'flower', emoji: '🌸', type: 'interactive', time: 'day', reaction: '¡Una flor! 🌸' },
    { id: 'cloud', emoji: '☁️', type: 'ambient', time: 'both', reaction: null },
    { id: 'star', emoji: '⭐', type: 'interactive', time: 'night', reaction: '¡Mirá cómo brilla! ⭐' },
    { id: 'firefly', emoji: '✨', type: 'interactive', time: 'night', reaction: '¡Qué lindo brillo! ✨' },
    { id: 'moon-glow', emoji: '🌙', type: 'ambient', time: 'night', reaction: null },
    { id: 'paw', emoji: '🐾', type: 'interactive', time: 'both', reaction: '¡Huellitas! 🐾' },
    { id: 'sparkle', emoji: '✨', type: 'ambient', time: 'both', reaction: null },
    { id: 'puzzle', emoji: '🧩', type: 'interactive', time: 'both', reaction: '¡Una pieza! 🧩' },
    { id: 'magnifier', emoji: '🔍', type: 'interactive', time: 'both', reaction: '¡Para mirar mejor! 🔍' },
    { id: 'heart', emoji: '❤️', type: 'interactive', time: 'both', reaction: '¡Mucho amor! ❤️' },
    { id: 'yarn', emoji: '🧶', type: 'interactive', time: 'both', reaction: '¡Un ovillo! 🧶' },
    { id: 'gift', emoji: '🎁', type: 'interactive', time: 'both', reaction: '¡Una sorpresa! 🎁' },
    { id: 'eyes', emoji: '👀', type: 'ambient', time: 'both', reaction: null },
    { id: 'paint-spark', emoji: '🎨', type: 'ambient', time: 'both', reaction: null },
    { id: 'leaf', emoji: '🌿', type: 'ambient', time: 'both', reaction: null },
    { id: 'thought', emoji: '💭', type: 'ambient', time: 'both', reaction: null }
];


const HOME_SESSION_FLAVORS = {
    sunny: { ambient: ['☀️', '☁️', '✨'], preferredDiscoveries: ['balloon', 'flower', 'butterfly'] },
    garden: { ambient: ['🌸', '🦋', '🍃'], preferredDiscoveries: ['flower', 'butterfly', 'paw'] },
    magic: { ambient: ['✨', '🌈', '⭐'], preferredDiscoveries: ['rainbow', 'star', 'firefly', 'gift'] },
    cloudy: { ambient: ['☁️', '☁️', '✨'], preferredDiscoveries: ['cloud', 'rainbow', 'balloon'] },
    starry: { ambient: ['⭐', '🌙', '✨'], preferredDiscoveries: ['star', 'firefly', 'thought'] }
};

const HOME_CONTEXT_CONNECTIONS = {
    differences: { discoveries: ['magnifier', 'eyes', 'sparkle'] },
    painting: { discoveries: ['rainbow', 'flower', 'paint-spark', 'sparkle'] },
    maze: { discoveries: ['paw', 'butterfly', 'leaf'] },
    cat: { discoveries: ['heart', 'yarn', 'paw', 'sparkle'] },
    memory: { discoveries: ['star', 'puzzle', 'sparkle', 'thought'] },
    collection: { discoveries: ['gift', 'star', 'sparkle'] }
};


const SOFI_GUIDE_ASSETS = {
    normal: '/assets/characters/sofi-guide/guide-normal.webp',
    happy: '/assets/characters/sofi-guide/guide-happy.webp',
    surprised: '/assets/characters/sofi-guide/guide-surprised.webp',
    thinking: '/assets/characters/sofi-guide/guide-thinking.webp',
    celebrate: '/assets/characters/sofi-guide/guide-celebrate.webp'
};

Object.values(SOFI_GUIDE_ASSETS).forEach(src => {
    const img = new Image();
    img.src = src;
});

window.SofiApp = {
    version: 'v1.26.0',
    profile: {
        name: 'Sofi'
    },
    

    session: {
        startedAt: Date.now(),
        lastActivity: null,
        pendingHomeReaction: null,
        hasShownFirstVisit: false,
        contextualDiscovery: { activity: null, available: false, consumed: false },
        flavor: null,
        recentActivities: [],
        visitedActivities: new Set(),
        recentHomePhrases: [],
        sessionWrapShown: false,
        
        recordActivity(activityId) {
            this.lastActivity = activityId;
            this.setPendingHomeReaction(activityId);
            if (activityId !== 'painting-selector') {
                this.contextualDiscovery = { activity: activityId, available: true, consumed: false };
            }
            if (activityId !== 'painting-selector' && activityId !== 'collection') {
                this.visitedActivities.add(activityId);
                this.recentActivities.unshift(activityId);
                if (this.recentActivities.length > 5) this.recentActivities.pop();
            }
        },
        
        setPendingHomeReaction(activityId) {
            this.pendingHomeReaction = activityId;
        },
        
        consumePendingHomeReaction() {
            const reaction = this.pendingHomeReaction;
            this.pendingHomeReaction = null;
            return reaction;
        }
    },

    state: {
        currentView: 'menu',
        previousView: null,
        transitioning: false
    },
    
    // Vista -> Configuración de lifecycle
    _views: {},
    
    navigation: {
        registerView(name, config) {
            SofiApp._views[name] = config;
        },
        
        goTo(targetViewName, options = {}) {
            if (SofiApp.state.transitioning) return;
            
            const currentViewName = SofiApp.state.currentView;
            if (currentViewName === targetViewName) return;
            
            SofiApp.state.transitioning = true;

            // 8D.2C: al salir de una vista no sigue su celebración ni su voz (la cola de rewards sí sigue).
            if (SofiApp.celebration) SofiApp.celebration.cancel();
            if (SofiApp.voice) SofiApp.voice.cancel();
            // 8D.3C: los premios ya están guardados; su feedback retenido no puede quedar bloqueado al salir.
            // Va después de celebration.cancel(): con el lote retenido la cola está ocupada y las cards siguen sin voz (carryover).
            if (SofiApp.progress) SofiApp.progress.releaseAllRewardFeedback();

            // Execute onExit of current view if exists
            const currentViewConfig = SofiApp._views[currentViewName];
            if (currentViewConfig && currentViewConfig.onExit) {
                try {
                    currentViewConfig.onExit();
                } catch (e) {
                    console.error('[SofiApp] Error in onExit for', currentViewName, e);
                }
            }
            
            if (targetViewName === 'menu') {
                const viewToActivityMap = {
                    'game1': 'differences',
                    'game2': 'painting',
                    'drawing-selector': 'painting-selector',
                    'game3': 'maze',
                    'game4': 'cat',
                    'game5': 'memory',
                    'collection': 'collection'
                };
                const activity = viewToActivityMap[currentViewName];
                if (activity) {
                    SofiApp.session.recordActivity(activity);
                }
            }
            
            // Audio feedback
            if (!options.silent) {
                SofiApp.audio.tap();
            }
            
            const currentContainer = document.getElementById(currentViewName + '-container');
            const targetContainer = document.getElementById(targetViewName + '-container');
            
            if (currentContainer && !currentContainer.classList.contains('hidden')) {
                currentContainer.classList.remove('ui-enter');
                currentContainer.classList.add('ui-exit');
            }
            
            setTimeout(() => {
                // Hide current containers
                Object.keys(SofiApp._views).forEach(vName => {
                    const el = document.getElementById(vName + '-container');
                    if (el) { el.classList.add('hidden'); el.classList.remove('ui-exit'); }
                });
                
                const legacyContainers = ['game1', 'game2', 'game3', 'game4', 'game5', 'drawing-selector', 'collection'];
                legacyContainers.forEach(id => {
                    const el = document.getElementById(id + '-container');
                    if (el) { el.classList.add('hidden'); el.classList.remove('ui-exit'); }
                });
                
                const homeBtn = document.getElementById('home-btn');
                if (homeBtn) {
                    if (targetViewName === 'menu') {
                        homeBtn.classList.add('hidden');
                    } else {
                        homeBtn.classList.remove('hidden');
                    }
                }
                
                if (targetContainer) {
                    targetContainer.classList.remove('hidden', 'ui-exit');
                    void targetContainer.offsetWidth; // force reflow
                    targetContainer.classList.add('ui-enter');
                    targetContainer.style.opacity = ''; // cleanup inline
                } else {
                    console.warn('[SofiApp] Target container not found for:', targetViewName);
                }
                
                SofiApp.state.previousView = currentViewName;
                SofiApp.state.currentView = targetViewName;
                
                // Execute onEnter of target view
                const targetViewConfig = SofiApp._views[targetViewName];
                if (targetViewConfig && targetViewConfig.onEnter) {
                    try {
                        targetViewConfig.onEnter(options);
                    } catch (e) {
                        console.error('[SofiApp] Error in onEnter for', targetViewName, e);
                    }
                }
                
                SofiApp.state.transitioning = false;
            }, 250);
        },
        
        goHome() {
            SofiApp.navigation.goTo('menu');
        }
    },
    
    audio: {
        enabled: true,
        // ctx will reference the one in script.js to avoid duplicates
        _ctx: null,
        
        init(audioCtxRef) {
            this._ctx = audioCtxRef;
        },
        
        _resume() {
            if (this._ctx && this._ctx.state === 'suspended') {
                this._ctx.resume();
            }
        },
        
        tap() {
            if (!this.enabled || !this._ctx) return;
            this._resume();
            
            // Same as playMenuSelectSound()
            const oscillator = this._ctx.createOscillator();
            const gainNode = this._ctx.createGain();
            oscillator.type = 'sine';
            
            oscillator.frequency.setValueAtTime(600, this._ctx.currentTime);
            oscillator.frequency.setValueAtTime(800, this._ctx.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0, this._ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this._ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.15);
            
            oscillator.connect(gainNode);
            gainNode.connect(this._ctx.destination);
            oscillator.start(this._ctx.currentTime);
            oscillator.stop(this._ctx.currentTime + 0.15);
        },
        _playTone(freq, type, duration, startTimeOffset = 0, peak = 0.1) {
            if (!this._ctx) return;
            const startTime = this._ctx.currentTime + startTimeOffset;
            const oscillator = this._ctx.createOscillator();
            const gainNode = this._ctx.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(freq, startTime);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(peak, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this._ctx.destination);
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        },
        
        success() {
            if (!this.enabled || !this._ctx) return;
            this._resume();
            this._playTone(523.25, 'sine', 0.3, 0);       
            this._playTone(659.25, 'sine', 0.3, 0.1); 
            this._playTone(783.99, 'sine', 0.4, 0.2); 
        },
        
        // 8D.2C: un sonido por nivel de celebración (0 micro, 1 progreso, 2 logro, 3 colección), todo sintetizado.
        // Los niveles 1-3 los pide SofiApp.celebration (prioridad); el 0 lo pueden usar los juegos para el feedback chico.
        cue(level) {
            if (!this.enabled || !this._ctx) return;
            this._resume();
            if (level === 0) {
                // Blip suave (~200 ms), más liviano que success()
                this._playTone(880, 'sine', 0.12, 0, 0.05);
                this._playTone(1174.66, 'sine', 0.14, 0.06, 0.04);
            } else if (level === 1) {
                this.success(); // el C-E-G de siempre (~600 ms)
            } else if (level === 2) {
                // C-E-G-C' más lleno (sine + triangle), ~0.8 s
                [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                    const d = i === 3 ? 0.45 : 0.3;
                    this._playTone(f, 'sine', d, i * 0.12, 0.08);
                    this._playTone(f, 'triangle', d, i * 0.12, 0.05);
                });
            } else if (level === 3) {
                // Arpegio que sube + acorde sostenido con destellos agudos, ~1.4 s. Se distingue del 2 por duración y
                // cantidad de notas, no por volumen: el acorde va más suave (8D.2E: pico 0.227 → 0.155, como el cue 2).
                [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => this._playTone(f, 'sine', 0.25, i * 0.1, 0.08));
                [1046.5, 1318.51, 1567.98].forEach(f => {
                    this._playTone(f, 'sine', 0.85, 0.55, 0.035);
                    this._playTone(f, 'triangle', 0.85, 0.55, 0.02);
                });
                this._playTone(2093, 'sine', 0.15, 0.75, 0.04);
                this._playTone(2637.02, 'sine', 0.15, 0.95, 0.03);
            }
        },

        softError() {
            if (!this.enabled || !this._ctx) return;
            this._resume();
            this._playTone(150, 'sine', 0.3, 0);
        },
        
        speak(text) {
            if (!this.enabled || !('speechSynthesis' in window)) return;
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'es-AR';
            msg.rate = 0.9;
            msg.pitch = 1.2;
            window.speechSynthesis.speak(msg);
        }
    },
    
    feedback: {
        show(options) {
            // Placeholder for generic DOM feedback (Fase 3B or later uses)
            console.log('[SofiApp Feedback]', options.message);
        },
        
        celebrate() {
            // Wrapper around speak
            SofiApp.audio.speak(`¡Felicidades ${SofiApp.profile.name}, has ganado!`);
        }
    },
    
    progress: {
        _storageKey: 'juegosSofi_progress',
        state: {
            version: 1,
            stars: 0,
            stickers: [], 
            events: []
        },
        
        stickersConfig: {
            detective: { emoji: '🔍', name: 'Detective', asset: '/assets/icons/stickers/sticker-detective.webp' },
            artista: { emoji: '🎨', name: 'Artista', asset: '/assets/icons/stickers/sticker-artista.webp' },
            exploradora: { emoji: '🐾', name: 'Exploradora', asset: '/assets/icons/shared/icon-paw.webp' },
            amiga: { emoji: '❤️', name: 'Amiga', asset: '/assets/icons/shared/icon-heart.webp' },
            memoriosa: { emoji: '🦉', name: 'Memoriosa', asset: '/assets/icons/stickers/sticker-memoriosa.webp' },
            arcoiris: { emoji: '🌈', name: 'Arcoíris', asset: '/assets/icons/shared/icon-rainbow.webp' },
            flor: { emoji: '🌸', name: 'Flor', asset: '/assets/icons/shared/icon-flower.webp' } // inactivo (8D.1B): no se otorga ni se muestra
        },

        // 8D.1E: un sticker por juego; con los 5 se gana Arcoíris. Flor no participa.
        mainStickers: ['detective', 'artista', 'exploradora', 'amiga', 'memoriosa'],
        completionSticker: 'arcoiris',

        init() {
            this.load();
            // Premios que se derivan de progreso ya guardado (antes de que el Home o Mis Cosas se dibujen)
            if (this.reconcileProgressRewards()) this.save();
        },

        // Silenciosa e idempotente: solo agrega stickers derivados que faltan. Sin feedback, estrellas ni eventos.
        // Memoriosa si ya se terminó la Memoria (memory-level-5); después Arcoíris si están los 5 stickers de juego.
        reconcileProgressRewards() {
            const { stickers, events } = this.state;
            if (!Array.isArray(stickers) || !Array.isArray(events)) return false;
            let changed = false;
            if (events.includes('memory-level-5') && !stickers.includes('memoriosa')) {
                stickers.push('memoriosa');
                changed = true;
            }
            if (this.hasAllMainStickers() && !stickers.includes(this.completionSticker)) {
                stickers.push(this.completionSticker);
                changed = true;
            }
            return changed;
        },

        hasAllMainStickers() {
            return this.mainStickers.every(id => this.state.stickers.includes(id));
        },
    
        load() {
            try {
                const data = localStorage.getItem(this._storageKey);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed.version) {
                        this.state = Object.assign(this.state, parsed);
                    }
                }
            } catch (e) {
                console.warn('[SofiApp] Progress load failed', e);
            }
        },
    
        save() {
            try {
                localStorage.setItem(this._storageKey, JSON.stringify(this.state));
            } catch (e) {
                console.warn('[SofiApp] Progress save failed', e);
            }
        },
    
        recordEvent(eventId) {
            if (this.state.events.includes(eventId)) {
                return false; 
            }
            
            this.state.events.push(eventId);
            const source = eventId.split('-')[0];
            this.awardStar(source);
            this.save();
            if (SofiApp.world) SofiApp.world.notify({ type: 'completed', priority: 1, source: source });
            return true;
        },
    
        awardStar(source = null) {
            this.state.stars++;
            this.save();
            this.enqueueRewardFeedback({ type: 'star' });
            if (typeof refreshProgressUI === 'function') refreshProgressUI();
            if (SofiApp.world) SofiApp.world.notify({ type: 'star', priority: 2, source: source });
        },
    
        unlockSticker(stickerId) {
            if (!this.stickersConfig[stickerId]) return false;
            if (this.state.stickers.includes(stickerId)) return false;

            this.state.stickers.push(stickerId);
            this.save();

            const st = this.stickersConfig[stickerId];
            this.enqueueRewardFeedback({
                type: 'sticker', id: stickerId, name: st.name, emoji: st.emoji, asset: st.asset || null,
                special: stickerId === this.completionSticker
            });
            // 8D.2C: Arcoíris avisa como 'collection' (prioridad 4) para que el guía diga "¡Juntaste todo!"
            if (SofiApp.world) SofiApp.world.notify(stickerId === this.completionSticker
                ? { type: 'collection', priority: 4, emoji: st.emoji }
                : { type: 'sticker', priority: 3, emoji: st.emoji });
            // 8D.1E: el quinto sticker de juego (cualquiera) desbloquea Arcoíris. Arcoíris no vuelve a chequear.
            if (stickerId !== this.completionSticker) this.checkCollectionCompletion();
            return true;
        },

        checkCollectionCompletion() {
            if (!this.hasAllMainStickers()) return false;
            return this.unlockSticker(this.completionSticker);
        },
    
        // --- 8D.1F: cola de feedback de premios (solo runtime, nunca se guarda) ---
        // Antes cada premio creaba su propia card y se superponían (estrella + sticker + Arcoíris a la vez).
        // Ahora los premios de una misma acción (que los juegos otorgan en el mismo call stack) se juntan en un lote,
        // se combinan y se muestran de a una card por vez.
        _rewardFeedback: { batch: [], flushTimer: null, queue: [], active: null, timers: [] },
        REWARD_CARD_VISIBLE_MS: 1500,
        REWARD_CARD_FADE_MS: 400,

        // Compatibilidad: una card suelta con emoji / texto / imagen, que también pasa por la cola.
        showRewardFeedback(emoji, text, assetSrc = null) {
            this.enqueueRewardFeedback({ type: 'custom', emoji, text, asset: assetSrc });
        },

        enqueueRewardFeedback(reward) {
            const fb = this._rewardFeedback;
            fb.batch.push(reward);
            this._scheduleRewardFlush();
        },

        // Único lugar que programa el flush. setTimeout 0: se junta todo lo que el mismo stack síncrono otorgue
        // (evento → sticker → Arcoíris). Con un hold activo no se programa: el lote espera a que se libere.
        _scheduleRewardFlush() {
            const fb = this._rewardFeedback;
            if (fb.flushTimer || !fb.batch.length || this._rewardHolds.size) return;
            fb.flushTimer = setTimeout(() => this._flushRewardBatch(), 0);
        },

        // --- 8D.3C: hold del feedback de premios (solo runtime, nunca se guarda) ---
        // El hold controla CUÁNDO se muestra el feedback, nunca cuándo se guarda el premio: recordEvent / unlockSticker
        // persisten en el momento, y sus cards quedan en el lote (sin card, sin cue) hasta que se libera el último hold.
        // El lote retenido cuenta como ocupado (isBusy / whenIdle esperan). Cada hold es un handle propio: soltar uno no
        // suelta otros y soltarlo dos veces no hace nada. La navegación los suelta todos (releaseAllRewardFeedback) y
        // cada hold se suelta solo a los REWARD_HOLD_SAFETY_MS si nadie lo soltó (red de seguridad, no flujo normal).
        REWARD_HOLD_SAFETY_MS: 6000,
        _rewardHolds: new Map(), // handle → timer de seguridad

        // Devuelve un handle opaco para releaseRewardFeedback(handle).
        holdRewardFeedback() {
            const handle = Object.freeze({ rewardHold: true });
            const timer = setTimeout(() => this.releaseRewardFeedback(handle), this.REWARD_HOLD_SAFETY_MS);
            this._rewardHolds.set(handle, timer);
            return handle;
        },

        // Suelta ese hold. true si estaba activo; false si ya se había soltado o no es un handle conocido.
        // Al soltar el último, programa el mismo flush de siempre (si hay algo en el lote).
        releaseRewardFeedback(handle) {
            if (!this._rewardHolds.has(handle)) return false;
            clearTimeout(this._rewardHolds.get(handle));
            this._rewardHolds.delete(handle);
            this._scheduleRewardFlush();
            return true;
        },

        // Red de seguridad de la navegación: suelta todos los holds sin perder ni duplicar el lote. Devuelve cuántos soltó.
        releaseAllRewardFeedback() {
            const count = this._rewardHolds.size;
            this._rewardHolds.forEach(timer => clearTimeout(timer));
            this._rewardHolds.clear();
            this._scheduleRewardFlush();
            return count;
        },

        _flushRewardBatch() {
            const fb = this._rewardFeedback;
            fb.flushTimer = null;
            // Un hold tomado con el flush ya programado: el lote sigue esperando (nada se muestra mientras hay un hold).
            if (this._rewardHolds.size) return;
            const cards = this._buildRewardSequence(fb.batch);
            fb.batch = [];
            fb.queue.push(...cards);
            if (!fb.active) this._showNextReward();
        },

        // Lote → como mucho 2 cards: [sticker (+⭐), Arcoíris]. El sticker es protagonista y la estrella va de insignia.
        _buildRewardSequence(batch) {
            const seen = new Set();
            const stickers = [];
            let star = false;
            const custom = [];
            batch.forEach(r => {
                if (r.type === 'star') star = true;
                else if (r.type === 'sticker' && !seen.has(r.id)) { seen.add(r.id); stickers.push(r); }
                else if (r.type === 'custom') custom.push(r);
            });
            const normal = stickers.filter(s => !s.special);
            const special = stickers.find(s => s.special);

            const cards = [];
            if (normal.length) cards.push({ ...normal[0], withStar: star });
            else if (star && !special) cards.push({ type: 'star' });
            if (special) cards.push({ ...special, withStar: star && !normal.length });
            // Dos stickers normales en la misma acción no pasa hoy; si pasara, el segundo ocupa el lugar libre.
            if (cards.length < 2 && normal.length > 1) cards.push({ ...normal[1], withStar: false });
            return cards.concat(custom);
        },

        _showNextReward() {
            const fb = this._rewardFeedback;
            const card = fb.queue.shift();
            if (!card) { fb.active = null; this._notifyRewardIdle(); return; }
            const el = this._renderRewardCard(card);
            fb.active = el;
            document.body.appendChild(el);
            void el.offsetWidth; // aparece por transición de CSS (sin requestAnimationFrame: funciona con la pestaña oculta)
            el.classList.add('reward-overlay--visible');
            // 8D.2C: la card ya no toca al guía (reacciona en el Home) y su sonido lo decide SofiApp.celebration:
            // estrella = nivel 1, sticker = 2, Arcoíris = 3. Si ya hay una celebración de nivel igual o mayor, suena esa sola.
            const level = card.type === 'sticker' ? (card.special ? 3 : 2) : 1;
            if (SofiApp.celebration) {
                SofiApp.celebration.play({ level, event: card.special ? 'collectionComplete' : null, source: 'rewards' });
            } else if (SofiApp.audio) {
                SofiApp.audio.success();
            }

            const hide = setTimeout(() => {
                el.classList.remove('reward-overlay--visible');
                const remove = setTimeout(() => {
                    fb.timers = [];
                    if (el.parentNode) el.parentNode.removeChild(el);
                    this._showNextReward(); // la siguiente entra recién cuando la anterior ya no está
                }, this.REWARD_CARD_FADE_MS);
                fb.timers = [remove];
            }, this.REWARD_CARD_VISIBLE_MS);
            fb.timers = [hide];
        },

        // 8D.2C: avisos de "cola libre" para SofiApp.rewards.whenIdle (una sola vez cada uno)
        _idleSubscribers: new Set(),

        _isRewardBusy() {
            const fb = this._rewardFeedback;
            return fb.batch.length > 0 || !!fb.flushTimer || fb.queue.length > 0 || !!fb.active;
        },

        _notifyRewardIdle() {
            if (this._isRewardBusy() || this._idleSubscribers.size === 0) return;
            const subscribers = Array.from(this._idleSubscribers);
            this._idleSubscribers.clear();
            subscribers.forEach(cb => {
                try { cb(); } catch (e) { console.error('[SofiApp] Error in rewards.whenIdle callback', e); }
            });
        },

        _renderRewardCard(card) {
            const el = document.createElement('div');
            el.className = 'reward-overlay';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');

            let asset, emoji, text, name = null;
            if (card.type === 'star') {
                asset = '/assets/icons/shared/icon-star.webp'; emoji = '⭐'; text = '¡Una estrella!';
            } else if (card.type === 'custom') {
                asset = card.asset; emoji = card.emoji; text = card.text;
            } else {
                asset = card.asset; emoji = card.emoji; name = card.name;
                text = card.special ? '¡Juntaste todo!' : '¡Nuevo sticker!';
                el.classList.add(card.special ? 'reward-overlay--special' : 'reward-overlay--sticker');
            }

            const visual = document.createElement('div');
            visual.className = 'reward-overlay__visual';
            const emojiNode = () => {
                const span = document.createElement('span');
                span.className = 'reward-overlay__emoji';
                span.setAttribute('aria-hidden', 'true');
                span.textContent = emoji || '✨';
                return span;
            };
            if (asset) {
                const img = document.createElement('img');
                img.src = asset;
                img.alt = '';
                img.setAttribute('aria-hidden', 'true');
                img.className = 'reward-overlay__icon-image';
                img.onerror = () => img.replaceWith(emojiNode()); // sin imagen, queda el emoji: la card nunca queda vacía
                visual.appendChild(img);
            } else {
                visual.appendChild(emojiNode());
            }
            if (card.withStar) {
                const badge = document.createElement('img');
                badge.src = '/assets/icons/shared/icon-star.webp';
                badge.alt = '';
                badge.setAttribute('aria-hidden', 'true');
                badge.className = 'reward-overlay__badge';
                visual.appendChild(badge);
            }
            if (card.special) {
                const sparkle = document.createElement('img');
                sparkle.src = '/assets/icons/shared/icon-sparkle.webp';
                sparkle.alt = '';
                sparkle.setAttribute('aria-hidden', 'true');
                sparkle.className = 'reward-overlay__sparkle';
                visual.appendChild(sparkle);
            }
            el.appendChild(visual);

            const msg = document.createElement('div');
            msg.className = 'reward-overlay__text';
            msg.textContent = text;
            el.appendChild(msg);
            if (name) {
                const nameEl = document.createElement('div');
                nameEl.className = 'reward-overlay__name';
                nameEl.textContent = name;
                el.appendChild(nameEl);
            }
            return el;
        }
    },

    // 8D.2C: lectura mínima de la cola de rewards para coordinar otras capas (guía, celebraciones). No la modifica.
    rewards: {
        isBusy() {
            return SofiApp.progress._isRewardBusy();
        },

        // Llama a cb una sola vez cuando la cola queda libre (en el próximo tick si ya lo está). Devuelve unsubscribe.
        whenIdle(cb) {
            const progress = SofiApp.progress;
            let done = false;
            const fire = () => {
                if (done) return;
                if (progress._isRewardBusy()) { progress._idleSubscribers.add(fire); return; }
                done = true;
                try { cb(); } catch (e) { console.error('[SofiApp] Error in rewards.whenIdle callback', e); }
            };
            if (progress._isRewardBusy()) progress._idleSubscribers.add(fire);
            else setTimeout(fire, 0);
            return () => { done = true; progress._idleSubscribers.delete(fire); };
        }
    },

    world: {
        pendingReaction: null,
        _reactionWait: null, // 8D.2C: unsubscribe mientras la reacción espera a que terminen las cards
        ambientTimer: null,
        ambientComposition: [],
        guideTimer: null,
        discoveryState: {
            active: null,
            timer: null,
            lastDiscoveryId: null,
            seenThisSession: new Set(),
            interactionLocked: false
        },
        lastSpokenPhrase: null,
        reactions: {
            generic: ['¡Hola Sofi! 💕', '¿A qué jugamos? ⭐', '¡Hola! 🐱', '¡Vamos a jugar! 🌈'],
            firstVisit: ['¡Hola Sofi! 💕', '¡Vamos a jugar! 🌈', '¡El mundo te espera! 🌍'],
            differences: ['¡Viste un montón de cosas! 🔍', '¡Qué atenta estuviste! 👀', '¡Encontraste todo! ✨'],
            painting: ['¡Qué lindo pintaste! 🎨', '¡Cuántos colores! 🌈', '¡Estuvimos pintando! 🖍️'],
            'painting-selector': ['¡A elegir colores! 🎨', '¡Vamos a pintar! 🖍️', '¿Qué pintamos hoy? 🌈'],
            maze: ['¡Qué aventura! 🐶', '¡Ayudamos al perrito! 🐾', '¡Qué camino tan largo! 🌿'],
            cat: ['¡Tu gatito estuvo feliz de verte! 🐾', '¡Le encantan tus mimos! ❤️', '¡Qué lindo gatito! 🐱'],
            memory: ['¡Qué buena memoria! 🧠', '¡Te acordaste de todo! ⭐', '¡Hicimos muchas parejas! 🧩'],
            collection: ['¡Cuántas cosas lindas! 🎁', '¡Mirá tus stickers! ⭐', '¡Qué linda colección! 🌈']
        },
        
        init() {
            this.setupGuide();
            const flavorKeys = Object.keys(HOME_SESSION_FLAVORS);
            SofiApp.session.flavor = flavorKeys[Math.floor(Math.random() * flavorKeys.length)];
        },
        
        
        chooseNonRepeatingMessage(messages) {
            let available = messages.filter(m => !SofiApp.session.recentHomePhrases.includes(m));
            if (available.length === 0) available = messages;
            
            const chosen = available[Math.floor(Math.random() * available.length)];
            SofiApp.session.recentHomePhrases.push(chosen);
            if (SofiApp.session.recentHomePhrases.length > 3) SofiApp.session.recentHomePhrases.shift();
            
            this.lastSpokenPhrase = chosen;
            return chosen;
        },
        
        canShowSessionWrapReaction() {
            if (SofiApp.session.sessionWrapShown) return false;
            if (this.pendingReaction) return false;
            if (SofiApp.session.visitedActivities.size >= 3) return true;
            return false;
        },

        resetGuideState() {
            if (this.guideStateTimer) {
                clearTimeout(this.guideStateTimer);
                this.guideStateTimer = null;
            }
            this.guideState = 'normal';
            const img = document.getElementById('home-guide-image');
            if (img) {
                img.src = SOFI_GUIDE_ASSETS['normal'];
            }
        },

        setGuideState(state, options = {}) {
            if (!SOFI_GUIDE_ASSETS[state]) state = 'normal';
            
            // Priority checking
            const priorities = { 'normal': 0, 'thinking': 1, 'happy': 2, 'surprised': 3, 'celebrate': 4 };
            if (options.priorityCheck && this.guideStateTimer && this.guideState !== state) {
                if (priorities[this.guideState] > priorities[state]) {
                    return; // Do not override higher priority state
                }
            }

            if (this.guideState === state && !options.force) {
                if (options.duration) {
                    if (this.guideStateTimer) clearTimeout(this.guideStateTimer);
                    this.guideStateTimer = setTimeout(() => this.resetGuideState(), options.duration);
                }
                return;
            }

            this.guideState = state;
            const img = document.getElementById('home-guide-image');
            if (img) {
                img.src = SOFI_GUIDE_ASSETS[state];
            }

            if (this.guideStateTimer) {
                clearTimeout(this.guideStateTimer);
                this.guideStateTimer = null;
            }

            if (options.duration) {
                this.guideStateTimer = setTimeout(() => this.resetGuideState(), options.duration);
            }
        },

        setupGuide() {
            const guide = document.getElementById('home-guide-character');
            if (guide) {
                guide.addEventListener('click', () => {
                    SofiApp.audio.tap();
                    SofiApp.audio.speak('Hola Sofi, ¿a qué querés jugar?');
                    this.setGuideState('happy', { duration: 2500, priorityCheck: true });
                    guide.classList.add('is-reacting');
                    this.showTemporaryParticle(guide, '❤️');
                    setTimeout(() => { if (guide && guide.isConnected) guide.classList.remove('is-reacting') }, 500);
                });
            }
        },
        
        notify(event) {
            // Keep the most important reaction
            if (!this.pendingReaction || this.pendingReaction.priority < event.priority) {
                this.pendingReaction = event;
            }
        },
        
        onHomeEnter() {
            this.resetGuideState();
            this.startAmbient();
            this.scheduleNextDiscovery(true);
            
            document.body.classList.add('is-home');
            window.scrollTo(0, 0);

            if (this.pendingReaction) {
                // 8D.2C: si todavía hay cards de premio, el guía espera a que terminen (y solo si seguimos en el Home).
                // Si Sofi se va antes, la reacción queda pendiente para la próxima vez.
                if (SofiApp.rewards && SofiApp.rewards.isBusy()) {
                    if (!this._reactionWait) {
                        this._reactionWait = SofiApp.rewards.whenIdle(() => {
                            this._reactionWait = null;
                            if (SofiApp.state.currentView !== 'menu' || !this.pendingReaction) return;
                            this.playReaction(this.pendingReaction);
                            this.pendingReaction = null;
                        });
                    }
                } else {
                    this.playReaction(this.pendingReaction);
                    this.pendingReaction = null;
                }
            } else {
                const recentActivity = SofiApp.session.consumePendingHomeReaction();
                if (recentActivity) {
                    const msgs = this.reactions[recentActivity] || this.reactions.generic;
                    this.showBubble(this.chooseNonRepeatingMessage(msgs));
                } else if (this.canShowSessionWrapReaction()) {
                    SofiApp.session.sessionWrapShown = true;
                    const wrapMsgs = ['¡Qué lindo jugar juntos! 💕', '¡Cuántas aventuras! 🌈', '¡Qué divertido estuvo todo! ✨'];
                    this.setGuideState('happy', { duration: 3000 });
                    this.showBubble(this.chooseNonRepeatingMessage(wrapMsgs));
                } else if (!SofiApp.session.hasShownFirstVisit) {
                    SofiApp.session.hasShownFirstVisit = true;
                    this.setGuideState('happy', { duration: 3000 });
                    this.showBubble(this.chooseNonRepeatingMessage(this.reactions.firstVisit));
                } else {
                    let msgs = this.reactions.generic;
                    if (SofiApp.progress.state.stars >= 6 && Math.random() > 0.5) {
                        msgs = ['¡Mirá tus estrellas! ⭐'].concat(msgs);
                    }
                    this.showBubble(this.chooseNonRepeatingMessage(msgs));
                }
            }
        },
        
        onHomeExit() {
            if (this._reactionWait) { this._reactionWait(); this._reactionWait = null; }
            this.stopAmbient();
            this.stopHomeDiscoveries();
            this.hideBubble();
            this.resetGuideState();
            document.body.classList.remove('is-home');
            if (SofiApp.session.contextualDiscovery) {
                SofiApp.session.contextualDiscovery.available = false;
            }
        },
        
        playReaction(reaction) {
            const guide = document.getElementById('home-guide-character');
            if (!guide) return;
            
            guide.classList.add('is-celebrating');
            setTimeout(() => { if (guide && guide.isConnected) guide.classList.remove('is-celebrating') }, 1000);
            
            const sourceToCard = {
                'differences': 'game1',
                'painting': 'game2',
                'maze': 'game3',
                'cat': 'game4',
                'memory': 'game5',
                'collection': 'collection'
            };
            const cardId = sourceToCard[reaction.source];
            
            if (reaction.type === 'collection') {
                this.setGuideState('celebrate', { duration: 3000 });
                this.showBubble('¡Juntaste todo! 🌈');
                this.showTemporaryParticle(guide, reaction.emoji || '🌈', 'particle-special');
                this.animateCard('btn-collection');
            } else if (reaction.type === 'sticker') {
                this.setGuideState('celebrate', { duration: 3000 });
                this.showBubble('¡Algo nuevo! 🎁');
                this.showTemporaryParticle(guide, reaction.emoji || '✨', 'particle-special');
                this.animateCard('btn-collection');
            } else if (reaction.type === 'star') {
                this.setGuideState('celebrate', { duration: 3000 });
                this.showBubble('¡Una estrella! ⭐');
                this.showTemporaryParticle(guide, '⭐', 'particle-star');
                this.animateGlobalStars();
                if (cardId) this.animateCard('btn-' + cardId);
            } else if (reaction.type === 'completed') {
                this.setGuideState('happy', { duration: 3000 });
                const msgs = this.reactions[reaction.source] || this.reactions.generic;
                this.showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
                if (cardId) this.animateCard('btn-' + cardId);
            }
        },
        
        showBubble(text) {
            const bubble = document.getElementById('home-guide-bubble');
            const guide = document.getElementById('home-guide-character');
            if (bubble) {
                if (this.guideTimer) {
                    clearTimeout(this.guideTimer);
                    this.guideTimer = null;
                }
                bubble.textContent = text;
                bubble.classList.add('visible');
                if (guide) {
                    guide.classList.add('is-reacting-soft');
                    setTimeout(() => { if (guide && guide.isConnected) guide.classList.remove('is-reacting-soft') }, 500);
                }
                
                const duration = Math.min(Math.max(text.length * 80, 2500), 4000);
                this.guideTimer = setTimeout(() => {
                    this.hideBubble();
                }, duration);
            }
        },
        
        hideBubble() {
            if (this.guideTimer) {
                clearTimeout(this.guideTimer);
                this.guideTimer = null;
            }
            const bubble = document.getElementById('home-guide-bubble');
            if (bubble) bubble.classList.remove('visible');
        },
        
        animateCard(id) {
            const card = document.getElementById(id);
            if (card) {
                card.classList.add('is-highlighted');
                setTimeout(() => card.classList.remove('is-highlighted'), 800);
            }
        },
        
        animateGlobalStars() {
            const counter = document.getElementById('global-stars-counter');
            if (counter) {
                counter.style.transform = 'scale(1.2)';
                setTimeout(() => counter.style.transform = 'scale(1)', 400);
            }
        },
        
        showTemporaryParticle(parent, emoji, customClass = '') {
            if (!parent || !parent.parentNode) return;
            const p = document.createElement('div');
            p.textContent = emoji;
            p.className = 'home-temporary-particle ' + customClass;
            parent.parentNode.appendChild(p);
            
            p.addEventListener('animationend', () => {
                if (p.parentNode) p.parentNode.removeChild(p);
            });
            // Fallback
            setTimeout(() => {
                if (p.parentNode) p.parentNode.removeChild(p);
            }, 2000);
        },
        
        startAmbient() {
            this.stopAmbient();
            
            // Initial daytime check
            const hour = new Date().getHours();
            const isNight = (hour < 6 || hour >= 18);
            
            const scheduleNext = () => {
                const delay = 15000 + Math.random() * 20000;
                this.ambientTimer = setTimeout(() => {
                    this.triggerAmbientSurprise(isNight);
                    scheduleNext();
                }, delay);
            };
            scheduleNext();
        },

        // --- PHASE 6B: HOME DISCOVERIES ---
        canStartHomeDiscovery() {
            if (SofiApp.state.currentView !== 'menu' || SofiApp.state.transitioning) return false;
            if (this.discoveryState.active) return false;
            if (this.pendingReaction) return false;
            
            const guide = document.getElementById('home-guide-character');
            if (guide && (guide.classList.contains('is-celebrating') || guide.classList.contains('is-reacting'))) return false;
            
            return true;
        },
        
        chooseHomeDiscovery(isNight) {
            const timeStr = isNight ? 'night' : 'day';
            let candidates = HOME_DISCOVERIES.filter(d => d.time === timeStr || d.time === 'both');
            
            const ctx = SofiApp.session.contextualDiscovery;
            let filteredCandidates = null;
            
            // 1. Contextual
            if (ctx && ctx.available && !ctx.consumed && Math.random() < 0.7 && HOME_CONTEXT_CONNECTIONS[ctx.activity]) {
                const preferredIds = HOME_CONTEXT_CONNECTIONS[ctx.activity].discoveries;
                const ctxCandidates = candidates.filter(d => preferredIds.includes(d.id));
                if (ctxCandidates.length > 0) filteredCandidates = ctxCandidates;
            }
            
            // 2. Flavor (if not contextual)
            if (!filteredCandidates && SofiApp.session.flavor && Math.random() < 0.6) {
                const flavorIds = HOME_SESSION_FLAVORS[SofiApp.session.flavor].preferredDiscoveries;
                const flavorCandidates = candidates.filter(d => flavorIds.includes(d.id));
                if (flavorCandidates.length > 0) filteredCandidates = flavorCandidates;
            }
            
            if (filteredCandidates) candidates = filteredCandidates;
            
            // Prefer unseen
            let available = candidates.filter(d => !this.discoveryState.seenThisSession.has(d.id));
            if (available.length === 0) {
                this.discoveryState.seenThisSession.clear();
                available = candidates.filter(d => d.id !== this.discoveryState.lastDiscoveryId);
            }
            if (available.length === 0) available = candidates; // fallback
            
            return available[Math.floor(Math.random() * available.length)];
        },
        
        spawnHomeDiscovery() {
            if (!this.canStartHomeDiscovery()) return;
            
            const hour = new Date().getHours();
            const isNight = (hour < 6 || hour >= 18);
            const discovery = this.chooseHomeDiscovery(isNight);
            if (!discovery) return;
            
            this.discoveryState.seenThisSession.add(discovery.id);
            this.discoveryState.lastDiscoveryId = discovery.id;
            this.discoveryState.interactionLocked = false;
            this.discoveryState.active = discovery;
            
            const ctx = SofiApp.session.contextualDiscovery;
            if (ctx && ctx.available && !ctx.consumed) {
                if (HOME_CONTEXT_CONNECTIONS[ctx.activity] && HOME_CONTEXT_CONNECTIONS[ctx.activity].discoveries.includes(discovery.id)) {
                    ctx.consumed = true;
                }
            }
            
            let layer = document.getElementById('home-discovery-layer');
            if (!layer) {
                const menuContainer = document.getElementById('menu-container');
                if (!menuContainer) return;
                layer = document.createElement('div');
                layer.id = 'home-discovery-layer';
                layer.style.position = 'absolute';
                layer.style.top = '0';
                layer.style.left = '0';
                layer.style.width = '100%';
                layer.style.height = '100%';
                layer.style.pointerEvents = 'none';
                layer.style.zIndex = '1'; // Above ambient, below buttons
                menuContainer.insertBefore(layer, menuContainer.firstChild.nextSibling); 
            }
            
            const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'home-discovery home-discovery--' + discovery.type;
            if (!isReducedMotion) {
                el.classList.add('home-discovery--' + discovery.id);
            } else {
                el.classList.add('home-discovery--fade-in'); // Fallback for reduced motion
            }
            
            el.setAttribute('aria-label', discovery.reaction || 'Sorpresa');
            el.innerHTML = '<span class="discovery-content" style="pointer-events: none; font-size: 3rem;">' + discovery.emoji + '</span>';
            
            // Safe Pos Presets
            const posPresets = [
                { top: (5 + Math.random()*15) + '%', left: (5 + Math.random()*15) + '%' }, // top-left
                { top: (5 + Math.random()*15) + '%', left: (75 + Math.random()*15) + '%' }, // top-right
                { top: (40 + Math.random()*20) + '%', left: (2 + Math.random()*8) + '%' }, // center-left edge
                { top: (40 + Math.random()*20) + '%', left: (85 + Math.random()*8) + '%' }, // center-right edge
                { top: (75 + Math.random()*15) + '%', left: (5 + Math.random()*15) + '%' }, // bottom-left
                { top: (75 + Math.random()*15) + '%', left: (75 + Math.random()*15) + '%' } // bottom-right
            ];
            const safePos = posPresets[Math.floor(Math.random() * posPresets.length)];
            el.style.left = safePos.left;
            el.style.top = safePos.top;
            
            layer.appendChild(el);
            this.discoveryState.domElement = el;
            
            if (discovery.type === 'interactive') {
                el.style.pointerEvents = 'auto';
                el.addEventListener('click', () => {
                    if (this.discoveryState.interactionLocked) return;
                    this.discoveryState.interactionLocked = true;
                    
                    SofiApp.audio.tap();
                    this.showTemporaryParticle(el.firstChild, '✨', 'particle-discovery');
                    
                    if (discovery.reaction) {
                        this.setGuideState('surprised', { duration: 2500, priorityCheck: true });
                    this.showBubble(discovery.reaction);
                    }
                    
                    el.style.opacity = '0';
                    setTimeout(() => {
                        this.clearHomeDiscovery();
                    }, 500);
                });
            }
            
            // Expiration
            const duration = discovery.type === 'ambient' ? 12000 : (6000 + Math.random() * 4000);
            this.discoveryState.timer = setTimeout(() => {
                if (el && el.parentNode) {
                    el.style.opacity = '0';
                    setTimeout(() => this.clearHomeDiscovery(), 500);
                }
            }, duration);
        },
        
        clearHomeDiscovery() {
            if (this.discoveryState.timer) {
                clearTimeout(this.discoveryState.timer);
                this.discoveryState.timer = null;
            }
            if (this.discoveryState.domElement && this.discoveryState.domElement.parentNode) {
                this.discoveryState.domElement.parentNode.removeChild(this.discoveryState.domElement);
            }
            this.discoveryState.domElement = null;
            this.discoveryState.active = null;
            this.discoveryState.interactionLocked = false;
        },
        
        scheduleNextDiscovery(isFirst = false) {
            if (this.discoveryState.nextTimer) {
                clearTimeout(this.discoveryState.nextTimer);
            }
            const delay = isFirst ? (8000 + Math.random() * 7000) : (20000 + Math.random() * 25000);
            this.discoveryState.nextTimer = setTimeout(() => {
                if (SofiApp.state.currentView === 'menu') {
                    this.spawnHomeDiscovery();
                    this.scheduleNextDiscovery(); // Schedule the following one
                }
            }, delay);
        },

        stopHomeDiscoveries() {
            this.clearHomeDiscovery();
            if (this.discoveryState.nextTimer) {
                clearTimeout(this.discoveryState.nextTimer);
                this.discoveryState.nextTimer = null;
            }
        },

        
        stopAmbient() {
            if (this.ambientTimer) {
                clearTimeout(this.ambientTimer);
                this.ambientTimer = null;
            }
            this.ambientComposition.forEach(el => {
                if (el.parentNode) el.parentNode.removeChild(el);
            });
            this.ambientComposition = [];
        },
        
        triggerAmbientSurprise(isNight) {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }
            const container = document.getElementById('home-ambient-layer');
            if (!container) return;
            
            this.ambientComposition.forEach(el => {
                if (el.parentNode) el.parentNode.removeChild(el);
            });
            this.ambientComposition = [];
            
            const numItems = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
            const items = isNight ? [
                { emoji: '☁️', animation: 'home-drift', type: 'sky' },
                { emoji: '⭐', animation: 'home-twinkle', type: 'sky' },
                { emoji: '✨', animation: 'home-twinkle', type: 'both' },
                { emoji: '🌙', animation: 'home-float', type: 'sky' }
            ] : [
                { emoji: '☁️', animation: 'home-drift', type: 'sky' },
                { emoji: '☁️', animation: 'home-float', type: 'sky' },
                { emoji: '🦋', animation: 'home-wander', type: 'ground' },
                { emoji: '🌸', animation: 'home-bob', type: 'ground' },
                { emoji: '✨', animation: 'home-twinkle', type: 'both' }
            ];
            
            for (let i = 0; i < numItems; i++) {
                const def = items[Math.floor(Math.random() * items.length)];
                const el = document.createElement('div');
                el.textContent = def.emoji;
                el.className = 'ambient-item ' + def.animation;
                el.style.position = 'absolute';
                el.style.pointerEvents = 'none';
                el.style.fontSize = (20 + Math.random() * 30) + 'px';
                
                el.style.left = (5 + Math.random() * 90) + '%';
                if (def.type === 'sky') {
                    el.style.top = (5 + Math.random() * 25) + '%';
                } else if (def.type === 'ground') {
                    el.style.top = (25 + Math.random() * 60) + '%';
                } else {
                    el.style.top = (5 + Math.random() * 80) + '%';
                }
                
                container.appendChild(el);
                this.ambientComposition.push(el);
            }
        }
    }
};

// Register the main menu
SofiApp.navigation.registerView('menu', {
    onEnter: () => { SofiApp.world.onHomeEnter(); },
    onExit: () => { SofiApp.world.onHomeExit(); }
});

// Setup global home button behavior once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SofiApp.progress.init();
    SofiApp.world.init();
    SofiApp.world.onHomeEnter();
    
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => SofiApp.navigation.goHome());
    }
    
    // Inject version dynamically
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer && SofiApp.version) {
        const verDiv = document.createElement('div');
        verDiv.id = 'app-version';
        verDiv.textContent = SofiApp.version;
        verDiv.style.textAlign = 'center';
        verDiv.style.color = 'rgba(0, 0, 0, 0.3)';
        verDiv.style.fontSize = '0.9rem';
        verDiv.style.fontWeight = 'bold';
        verDiv.style.marginTop = '20px';
        menuContainer.appendChild(verDiv);
    }
    
    if (typeof refreshProgressUI === 'function') {
        refreshProgressUI();
    }
});
