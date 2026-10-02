// SofiQA: helpers de QA para validar Juegos Sofi desde el browser (Claude Code).
// Tooling de desarrollo: vive fuera de public/, no se despliega y la app nunca lo carga.
// Se inyecta a mano en la página de prueba (ver CLAUDE.md → QA Harness).
// Mide y devuelve objetos; no decide si algo "está bien". No toca la app salvo los
// helpers explícitos de fixture (storage.setProgress) y navegación.
(function sofiQAFactory() {
    'use strict';

    const PREFIX = '[SofiQA]';
    const RESERVED = '__SofiQA'; // claves de sessionStorage del propio harness (backup/restore las ignora)
    const FRAME_MS = 1000 / 60;

    if (window.SofiQA && typeof window.SofiQA.cleanup === 'function') window.SofiQA.cleanup();

    // Todo lo que instala el harness (observers, patches) se registra acá para cleanup().
    const installed = [];
    const track = (undo) => { installed.push(undo); return undo; };

    const fail = (msg) => { throw new Error(`${PREFIX} ${msg}`); };
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    // Yield que no depende de rAF ni de timers throttleados (pestaña oculta).
    const yieldTask = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
    // Las globales `let` de los juegos (game1Instance…) no son window.*: se leen con eval indirecto.
    const readGlobal = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } };
    const el = (target) => (typeof target === 'string' ? document.querySelector(target) : target) || null;

    async function waitFor(predicate, options = {}) {
        const { timeout = 5000, interval = 50, description = 'condition' } = options;
        const t0 = performance.now();
        let lastError = null;
        while (performance.now() - t0 < timeout) {
            try { const v = await predicate(); if (v) return v; } catch (e) { lastError = e; }
            await wait(interval);
        }
        fail(`waitFor(${description}) timed out after ${timeout}ms${lastError ? ` (last error: ${lastError.message})` : ''}`);
    }

    function nextFrame() {
        // rAF no avanza con la pestaña oculta: se resuelve con lo que llegue primero.
        return new Promise(r => {
            let done = false;
            const finish = () => { if (!done) { done = true; r(document.visibilityState); } };
            requestAnimationFrame(finish);
            setTimeout(finish, 100);
        });
    }

    // ---------------------------------------------------------------- storage
    const dumpStore = (store, skipReserved) => {
        const out = {};
        for (let i = 0; i < store.length; i++) {
            const k = store.key(i);
            if (skipReserved && k.startsWith(RESERVED)) continue;
            out[k] = store.getItem(k);
        }
        return out;
    };
    const writeStore = (store, data, skipReserved) => {
        Object.keys(dumpStore(store, skipReserved)).forEach(k => { if (!(k in data)) store.removeItem(k); });
        Object.keys(data).forEach(k => store.setItem(k, data[k]));
    };
    const sameData = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

    const progressMemory = () => (window.SofiApp && SofiApp.progress ? JSON.stringify(SofiApp.progress.state) : null);

    const storage = {
        // Incluye SofiApp.progress.state en memoria: progress.load() hace Object.assign y no borra lo que un fixture dejó.
        // Otro estado en memoria (catState, aventuras en curso) no se captura: para eso, recargar la página.
        backup() {
            return { localStorage: dumpStore(localStorage, false), sessionStorage: dumpStore(sessionStorage, true),
                progressMemory: progressMemory() };
        },
        // Deja exactamente las claves del snapshot: borra las creadas durante el test y repone las originales.
        restore(snapshot) {
            if (!snapshot || !snapshot.localStorage) fail('storage.restore() needs a snapshot from storage.backup()');
            writeStore(localStorage, snapshot.localStorage, false);
            if (snapshot.sessionStorage) writeStore(sessionStorage, snapshot.sessionStorage, true);
            if (snapshot.progressMemory && window.SofiApp && SofiApp.progress) {
                SofiApp.progress.state = JSON.parse(snapshot.progressMemory);
                if (typeof window.refreshProgressUI === 'function') window.refreshProgressUI();
            }
            return storage.compare(snapshot);
        },
        compare(snapshot) {
            const now = storage.backup();
            const progressMemoryOk = !snapshot.progressMemory || now.progressMemory === snapshot.progressMemory;
            const ok = sameData(now.localStorage, snapshot.localStorage) && progressMemoryOk
                && (!snapshot.sessionStorage || sameData(now.sessionStorage, snapshot.sessionStorage));
            return { ok, progressMemoryOk, localKeys: Object.keys(now.localStorage).sort(), sessionKeys: Object.keys(now.sessionStorage).sort() };
        },
        // Fixture de juegosSofi_progress. Escribe exactamente `state` (sin defaults). Usar siempre con backup/restore.
        // apply:true → SofiApp.progress.load() + refreshProgressUI(). La reconciliación de init() solo corre con una recarga real.
        setProgress(state, options = {}) {
            if (!state || typeof state !== 'object') fail('storage.setProgress() needs an object');
            localStorage.setItem('juegosSofi_progress', JSON.stringify(state));
            if (options.apply && window.SofiApp && SofiApp.progress) {
                SofiApp.progress.load();
                if (typeof window.refreshProgressUI === 'function') window.refreshProgressUI();
            }
            return storage.getProgress();
        },
        getProgress() {
            const raw = localStorage.getItem('juegosSofi_progress');
            try { return raw ? JSON.parse(raw) : null; } catch (e) { return { invalid: raw }; }
        }
    };

    // --------------------------------------------------------------- viewport
    // El tamaño lo controla la herramienta del browser (resize_window); el harness solo mide.
    const presets = Object.freeze({
        mobilePortraitSmall: { width: 390, height: 844 },
        mobilePortrait: { width: 430, height: 932 },
        mobileLandscape: { width: 844, height: 390 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1366, height: 768 }
    });
    const viewport = {
        presets,
        standardMatrix: () => Object.keys(presets).map(name => ({ name, ...presets[name] })),
        current: () => ({ innerWidth, innerHeight, devicePixelRatio }),
        matches(preset) {
            const p = typeof preset === 'string' ? presets[preset] : preset;
            return !!p && innerWidth === p.width && innerHeight === p.height;
        }
    };

    // -------------------------------------------------------------------- dom
    const round1 = (n) => Math.round(n * 10) / 10;
    const dom = {
        rect(target) {
            const e = el(target);
            if (!e) return { found: false };
            const b = e.getBoundingClientRect();
            return { found: true, x: round1(b.x), y: round1(b.y), width: round1(b.width), height: round1(b.height),
                top: round1(b.top), right: round1(b.right), bottom: round1(b.bottom), left: round1(b.left) };
        },
        count: (selector) => document.querySelectorAll(selector).length,
        visible(target) {
            const e = el(target);
            if (!e) return false;
            const cs = getComputedStyle(e);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
            if (e.closest('.hidden')) return false;
            const b = e.getBoundingClientRect();
            return b.width > 0 && b.height > 0;
        },
        // Mide sin tocar estilos. scrollTo prueba el scroll real (scrollWidth puede marcar de más por partículas del Home).
        horizontalOverflow(options = {}) {
            const de = document.documentElement, body = document.body;
            const out = { docClientWidth: de.clientWidth, docScrollWidth: de.scrollWidth,
                bodyClientWidth: body.clientWidth, bodyScrollWidth: body.scrollWidth,
                overflowPx: Math.max(0, de.scrollWidth - de.clientWidth), scrollX: window.scrollX };
            if (options.probe) {
                const x0 = window.scrollX, y0 = window.scrollY;
                window.scrollTo(200, y0);
                out.probeScrollX = window.scrollX;
                window.scrollTo(x0, y0);
            }
            return out;
        },
        // Con la pestaña oculta las animaciones CSS quedan congeladas en el primer frame (p. ej. navEnter: opacity 0
        // y escala reducida): los rects salen del estado inicial. Esto las lleva al final (no toca las infinitas).
        finishAnimations(target) {
            const root = target ? el(target) : document;
            if (!root) return 0;
            const anims = root === document ? document.getAnimations() : root.getAnimations({ subtree: true });
            let n = 0;
            anims.forEach(a => { try { if (a.effect && a.effect.getComputedTiming().iterations !== Infinity) { a.finish(); n++; } } catch (e) { /* ignorar */ } });
            return n;
        },
        // Mientras está activo: máximo simultáneo y total de elementos distintos que coincidieron con `selector`
        // (p. ej. '.reward-overlay': max = cards visibles a la vez, seen = cards mostradas).
        watchMax(selector) {
            const seenEls = new WeakSet();
            let max = 0, seen = 0;
            const scan = () => {
                const all = document.querySelectorAll(selector);
                max = Math.max(max, all.length);
                all.forEach(e => { if (!seenEls.has(e)) { seenEls.add(e); seen++; } });
            };
            scan();
            const obs = new MutationObserver(scan);
            obs.observe(document.body, { childList: true, subtree: true });
            const undo = track(() => obs.disconnect());
            return { stop() { undo(); installed.splice(installed.indexOf(undo), 1); return { selector, max, seen, now: dom.count(selector) }; },
                get max() { return max; }, get seen() { return seen; } };
        }
    };

    // ------------------------------------------------------------- navigation
    // Usa la API de la app (SofiApp.navigation), no clicks: goTo ignora llamadas durante la transición de 250 ms.
    const navigation = {
        current: () => (window.SofiApp ? SofiApp.state.currentView : null),
        async open(view, options = {}, waitOptions = {}) {
            const nav = SofiApp.navigation;
            await waitFor(() => !SofiApp.state.transitioning, { timeout: 2000, description: 'navigation idle' });
            if (SofiApp.state.currentView !== view) nav.goTo(view, options);
            await waitFor(() => SofiApp.state.currentView === view && !SofiApp.state.transitioning,
                { timeout: waitOptions.timeout || 3000, description: `open(${view})` });
            // settle:true termina las animaciones de entrada antes de medir (pestaña oculta; ver dom.finishAnimations).
            const finished = waitOptions.settle ? dom.finishAnimations(`#${view}-container`) : 0;
            return { view, visible: dom.visible(`#${view}-container`), finishedAnimations: finished };
        },
        async home() {
            // Phaser difiere destroy(true) al próximo frame y con la pestaña oculta ese frame no llega: el canvas
            // queda huérfano (la app ya puso la global en null). Se guarda la instancia antes de salir y, si quedó
            // pendiente, un headlessStep ejecuta el destroy que el browser haría en el próximo frame.
            const g = phaser.game(navigation.current());
            const r = await navigation.open('menu');
            let flushedDestroy = false;
            if (g && g.pendingDestroy) { try { g.headlessStep(performance.now(), FRAME_MS); flushedDestroy = true; } catch (e) { /* ya destruido */ } }
            await waitFor(() => dom.count('canvas') === 0, { timeout: 1500, description: 'canvas removed after home' }).catch(() => {});
            return { ...r, flushedDestroy, canvasCount: dom.count('canvas') };
        }
    };

    // ----------------------------------------------------------------- phaser
    // Pintar (game2) no es un juego Phaser puro: el dibujo es SVG DOM; Phaser solo dibuja chispas. Ver `painting`.
    const GAME_GLOBALS = { game1: 'game1Instance', game2: 'game2Instance', game3: 'mazeGameInstance', game4: 'catGameInstance', game5: 'game5Instance' };
    const RUNNING = 5; // Phaser.Scenes.RUNNING
    let virtualTime = 0;

    const phaser = {
        globals: GAME_GLOBALS,
        game: (view) => readGlobal(GAME_GLOBALS[view]) || null,
        instances() {
            return Object.keys(GAME_GLOBALS).map(view => {
                const g = phaser.game(view);
                return { view, global: GAME_GLOBALS[view], exists: !!g, booted: !!(g && g.isBooted),
                    running: g ? phaser.runningScenes(g) : [] };
            });
        },
        runningScenes: (g) => (g && g.scene ? g.scene.scenes.filter(s => s.sys.settings.status === RUNNING).map(s => s.sys.settings.key) : []),
        canvasCount: () => dom.count('canvas'),
        canvases: () => [...document.querySelectorAll('canvas')].map(c => ({
            parent: c.parentElement ? `#${c.parentElement.id || c.parentElement.className}` : null, ...dom.rect(c) })),
        // Espera una escena en RUNNING (después de init/create); medir antes da tamaños del header viejo.
        async waitForScene(view, sceneKey, options = {}) {
            const scene = await waitFor(() => {
                const g = phaser.game(view);
                if (!g || !g.isBooted) return null;
                const s = sceneKey ? g.scene.getScene(sceneKey) : g.scene.scenes.find(x => x.sys.settings.status === RUNNING);
                return s && s.sys.settings.status === RUNNING ? s : null;
            }, { timeout: 8000, ...options, description: options.description || `waitForScene(${view}${sceneKey ? ':' + sceneKey : ''})` });
            return scene;
        },
        // Juego montado, una escena corriendo y canvas con tamaño. Para game1/3/4/5 (no Pintar).
        // Mi Gatito sin gato adoptado muestra la adopción (DOM) y no crea Phaser: devuelve ready:false, blocker:'adoption'.
        async waitForGameReady(view, options = {}) {
            if (view === 'game2') fail('waitForGameReady(game2): Painting is not a Phaser-only game, use SofiQA.painting.ready()');
            if (view === 'game4') {
                const state = await waitFor(() => (dom.visible('#adoption-screen') ? 'adoption'
                    : phaser.runningScenes(phaser.game('game4')).length ? 'game' : null),
                    { timeout: 8000, description: 'waitForGameReady(game4)' });
                if (state === 'adoption') return { view, ready: false, blocker: 'adoption', canvasCount: dom.count('canvas') };
            }
            const scene = await phaser.waitForScene(view, options.sceneKey, options);
            const g = phaser.game(view);
            await waitFor(() => g.canvas && g.canvas.getBoundingClientRect().width > 0, { timeout: 3000, description: `canvas size (${view})` });
            // Con la pestaña oculta el ScaleManager no recalcula FIT cuando cambia el header (lo hace en PRE_STEP y no
            // hay frames): se avanza 1 frame y se despierta el loop. No usar scale.refresh(): mide mal Memoria (−15 px).
            const settledFrames = document.hidden ? (options.settleFrames ?? 1) : 0;
            if (settledFrames) { await phaser.stepFrames(g, settledFrames); phaser.wakeLoop(g); }
            return { view, ready: true, scene: scene.sys.settings.key, settledFrames, canvas: dom.rect(g.canvas) };
        },
        // Reloj virtual para pestaña oculta: en Phaser 3.60 los tweens usan reloj real (TweenManager.getDelta);
        // se reemplaza por un delta fijo hasta cleanup().
        installTweenClock(delta = FRAME_MS) {
            const proto = window.Phaser && Phaser.Tweens && Phaser.Tweens.TweenManager && Phaser.Tweens.TweenManager.prototype;
            if (!proto) fail('installTweenClock(): Phaser not loaded');
            if (proto.__sofiQAClock) return false;
            const original = proto.getDelta;
            proto.getDelta = function () { return delta; };
            proto.__sofiQAClock = true;
            track(() => { proto.getDelta = original; delete proto.__sofiQAClock; });
            return true;
        },
        // Avanza `count` frames a mano. Duerme el loop real mientras tanto. render:true usa game.step()
        // (necesario antes de tocar: el orden topOnly del input usa camera.renderList, que solo se actualiza al renderizar).
        async stepFrames(game, count = 1, delta = FRAME_MS, options = {}) {
            if (!game || !game.loop) fail('stepFrames(): no game');
            if (game.loop.running) game.loop.sleep();
            if (!virtualTime) virtualTime = performance.now();
            for (let i = 0; i < count; i++) {
                virtualTime += delta;
                if (options.render) game.step(virtualTime, delta); else game.headlessStep(virtualTime, delta);
                if (i % 10 === 9) await yieldTask();
            }
            return { frames: count, running: phaser.runningScenes(game) };
        },
        // Avanza frames hasta que `predicate` sea verdadero (máx. maxFrames).
        async stepUntil(game, predicate, options = {}) {
            const { maxFrames = 2400, chunk = 6, description = 'stepUntil' } = options;
            for (let f = 0; f < maxFrames; f += chunk) {
                try { if (predicate()) return { ok: true, frames: f }; } catch (e) { /* escena todavía no lista */ }
                await phaser.stepFrames(game, chunk);
                if (f % 60 === 0) await wait(10); // deja correr timers reales (cargas de assets)
            }
            fail(`${description} not reached after ${maxFrames} frames`);
        },
        wakeLoop(game) { if (game && game.loop && !game.loop.running) game.loop.wake(); }
    };

    // --------------------------------------------------------------- painting
    const painting = {
        ready() {
            const area = document.getElementById('drawing-area');
            const layer = document.getElementById('painting-transform-layer');
            const svg = layer ? layer.querySelector('svg') : null;
            const phaserLayer = document.getElementById('painting-phaser-layer');
            return { view: navigation.current(), drawingArea: dom.rect(area), svg: !!svg,
                regions: svg ? svg.querySelectorAll('.paintable').length : 0,
                canvasInPhaserLayer: phaserLayer ? phaserLayer.querySelectorAll('canvas').length : 0,
                ready: !!(svg && area && dom.visible(area)) };
        },
        async open(drawingId, options = {}) {
            await navigation.open('game2', { drawingId });
            return waitFor(() => { const r = painting.ready(); return r.ready ? r : null; },
                { timeout: 8000, ...options, description: `painting.open(${drawingId})` });
        }
    };

    // -------------------------------------------------------------- listeners
    // Cuenta add/removeEventListener mientras está activo (delta neto por destino:tipo).
    // Límites: no ve listeners previos al start (un remove de uno previo resta), ni handlers on*,
    // ni deduplica un add repetido de la misma función.
    const listeners = {
        start() {
            const proto = EventTarget.prototype;
            if (proto.__sofiQAListeners) fail('listeners.start(): already running');
            const counts = {};
            const origAdd = proto.addEventListener, origRemove = proto.removeEventListener;
            const key = (t, type) => `${t === window ? 'window' : t === document ? 'document' : (t && t.nodeName) || 'other'}:${type}`;
            proto.addEventListener = function (type, fn, opts) { const k = key(this, type); counts[k] = (counts[k] || 0) + 1; return origAdd.call(this, type, fn, opts); };
            proto.removeEventListener = function (type, fn, opts) { const k = key(this, type); counts[k] = (counts[k] || 0) - 1; return origRemove.call(this, type, fn, opts); };
            proto.__sofiQAListeners = true;
            const undo = track(() => { proto.addEventListener = origAdd; proto.removeEventListener = origRemove; delete proto.__sofiQAListeners; });
            return {
                snapshot: () => Object.fromEntries(Object.entries(counts).filter(([, v]) => v !== 0)),
                stop() { undo(); installed.splice(installed.indexOf(undo), 1); return Object.fromEntries(Object.entries(counts).filter(([, v]) => v !== 0)); }
            };
        }
    };

    // -------------------------------------------------------------- lifecycle
    function rewardQueue() {
        const f = window.SofiApp && SofiApp.progress && SofiApp.progress._rewardFeedback;
        if (!f) return null;
        return { batch: f.batch.length, flushPending: !!f.flushTimer, queue: f.queue.length, active: !!f.active, timers: f.timers.length };
    }
    const lifecycle = {
        snapshot: () => ({
            currentView: navigation.current(),
            transitioning: !!(window.SofiApp && SofiApp.state.transitioning),
            canvasCount: dom.count('canvas'),
            rewardOverlayCount: dom.count('.reward-overlay'),
            rewardQueue: rewardQueue(),
            collectionCardCount: dom.count('#collection-container .collection-game'),
            homeCardCount: dom.count('.menu-grid .game-card'),
            guideCount: dom.count('#home-guide-character'),
            overflowPx: dom.horizontalOverflow().overflowPx,
            visibilityState: document.visibilityState
        }),
        // Home → view → listo → Home, `count` veces. Sin gameplay. Para game2 pasar options.drawingId.
        async cycles({ view, count = 1, options = {}, countListeners = false }) {
            const rows = [];
            const lc = countListeners ? listeners.start() : null;
            let listenersNet = null;
            try {
                for (let i = 0; i < count; i++) {
                    await navigation.home();
                    if (view === 'game2') await painting.open(options.drawingId || 'buddy');
                    else {
                        await navigation.open(view, options);
                        if (GAME_GLOBALS[view]) await phaser.waitForGameReady(view);
                    }
                    const open = lifecycle.snapshot();
                    await navigation.home();
                    rows.push({ cycle: i + 1, open, home: lifecycle.snapshot() });
                }
            } finally {
                if (lc) listenersNet = lc.stop();
            }
            return { view, count, results: rows, listenersNet };
        }
    };

    // ---------------------------------------------------------------- rewards
    // Solo observa la cola de rewards: no hace flush, no saca cards ni toca timers.
    // Idle = sin batch, sin flush pendiente, cola vacía y sin card activa.
    const rewardIdle = (q) => !!q && !q.batch && !q.flushPending && !q.queue && !q.active;
    const rewards = {
        state() {
            const q = rewardQueue();
            return q ? { busy: !rewardIdle(q), ...q, overlays: dom.count('.reward-overlay') } : null;
        },
        // Prefiere la fachada pública SofiApp.rewards.whenIdle (8D.2C); si no existe, consulta el estado cada `interval` ms.
        // Nunca lanza: devuelve { ok, elapsedMs, via, state } (ok:false en timeout o sin cola).
        async waitIdle(options = {}) {
            const { timeout = 10000, interval = 50 } = options;
            const t0 = performance.now();
            const done = (ok, via, extra) => ({ ok, elapsedMs: Math.round(performance.now() - t0), via, state: rewards.state(), ...extra });
            const facade = window.SofiApp && SofiApp.rewards && typeof SofiApp.rewards.whenIdle === 'function' ? SofiApp.rewards : null;
            if (facade) {
                let unsubscribe = null, timer = null;
                const ok = await new Promise(resolve => {
                    timer = setTimeout(() => resolve(false), timeout);
                    unsubscribe = facade.whenIdle(() => resolve(true));
                });
                clearTimeout(timer);
                if (!ok && typeof unsubscribe === 'function') unsubscribe();
                return done(ok, 'whenIdle', ok ? {} : { error: `${PREFIX} rewards.waitIdle timed out after ${timeout}ms` });
            }
            if (!rewardQueue()) return done(false, 'none', { error: `${PREFIX} rewards.waitIdle: no reward queue found` });
            await Promise.resolve();
            while (performance.now() - t0 < timeout) {
                if (rewardIdle(rewardQueue())) return done(true, 'poll');
                await wait(interval);
            }
            return done(false, 'poll', { error: `${PREFIX} rewards.waitIdle timed out after ${timeout}ms` });
        }
    };

    // ---------------------------------------------------------------- monitor
    // Registra voz y sonidos de celebración para comprobar "un sonido principal + como mucho una frase" por momento.
    // Envuelve solo lo que existe hoy:
    //   speech: speechSynthesis.speak / cancel (lo que realmente se dice, venga del helper que venga) y, si existe,
    //           SofiApp.voice.say / cancel (pedidos a la API nueva; pueden no producir un speak si la prioridad los ignora).
    //   cues:   SofiApp.audio.success (legacySuccess) y, si existe, SofiApp.audio.cue(level). Un success() llamado
    //           desde adentro de cue() no se cuenta como legacySuccess.
    // Contadores separados por capa (speak/cancel vs voiceSay/voiceCancel): nada se cuenta dos veces.
    // Un solo monitor a la vez: start() con otro activo lanza error. stop() y cleanup() restauran las funciones originales.
    // mute:true no llama a los originales (silencio); por defecto el audio y la voz suenan igual que sin monitor.
    let activeMonitor = null;
    const monitor = {
        active: () => !!activeMonitor,
        start(options = {}) {
            if (activeMonitor) fail('monitor.start(): a monitor is already active; call stop() first');
            const { speech = true, cues = true, mute = false } = options;
            const t0 = performance.now();
            const events = [];
            const counts = { speak: 0, cancel: 0, voiceSay: 0, voiceCancel: 0, cue0: 0, cue1: 0, cue2: 0, cue3: 0, legacySuccess: 0 };
            const restores = [];
            const log = (type, action, data) => events.push({ t: Math.round((performance.now() - t0) * 10) / 10, type, action, view: navigation.current(), ...data });
            const patch = (obj, name, makeWrapper) => {
                if (!obj || typeof obj[name] !== 'function') return false;
                const own = Object.prototype.hasOwnProperty.call(obj, name);
                const original = obj[name];
                obj[name] = makeWrapper(original);
                restores.push(() => { if (own) obj[name] = original; else delete obj[name]; });
                return true;
            };
            const wrapped = [];
            let cueDepth = 0;

            if (speech && window.speechSynthesis) {
                const ss = window.speechSynthesis;
                if (patch(ss, 'speak', orig => function (u) {
                    counts.speak++;
                    log('speech', 'speak', { text: u && u.text, lang: u && u.lang, rate: u && u.rate, pitch: u && u.pitch });
                    return mute ? undefined : orig.call(this, u);
                })) wrapped.push('speechSynthesis.speak');
                if (patch(ss, 'cancel', orig => function () {
                    counts.cancel++; log('speech', 'cancel', {});
                    return orig.call(this);
                })) wrapped.push('speechSynthesis.cancel');
            }
            const voice = window.SofiApp && SofiApp.voice;
            if (speech && voice) {
                if (patch(voice, 'say', orig => function (key, opts) {
                    counts.voiceSay++;
                    const result = orig.apply(this, arguments);
                    log('voice', 'say', { key, level: opts && opts.level, result });
                    return result;
                })) wrapped.push('SofiApp.voice.say');
                if (patch(voice, 'cancel', orig => function () {
                    counts.voiceCancel++; log('voice', 'cancel', {});
                    return orig.apply(this, arguments);
                })) wrapped.push('SofiApp.voice.cancel');
            }
            const audio = window.SofiApp && SofiApp.audio;
            if (cues && audio) {
                if (patch(audio, 'success', orig => function () {
                    if (cueDepth > 0) return mute ? undefined : orig.apply(this, arguments);
                    counts.legacySuccess++; log('cue', 'legacySuccess', {});
                    return mute ? undefined : orig.apply(this, arguments);
                })) wrapped.push('SofiApp.audio.success');
                if (patch(audio, 'cue', orig => function (level) {
                    if (counts[`cue${level}`] !== undefined) counts[`cue${level}`]++;
                    log('cue', 'cue', { level });
                    if (mute) return undefined;
                    cueDepth++;
                    try { return orig.apply(this, arguments); } finally { cueDepth--; }
                })) wrapped.push('SofiApp.audio.cue');
            }

            // stop() y cleanup() usan el mismo undo: restaura en orden inverso y libera el monitor activo.
            const undo = track(() => { while (restores.length) restores.pop()(); activeMonitor = null; });
            const report = (extra) => ({ events: events.slice(), counts: { ...counts }, wrapped, ...extra });
            const handle = {
                wrapped,
                get counts() { return { ...counts }; },
                get events() { return events.slice(); },
                stop() {
                    const i = installed.indexOf(undo);
                    if (i < 0) return report({ alreadyStopped: true });
                    installed.splice(i, 1);
                    undo();
                    return report({ durationMs: Math.round(performance.now() - t0) });
                }
            };
            activeMonitor = handle;
            return handle;
        }
    };

    // ----------------------------------------------------------------- assert
    // Chequeos objetivos; devuelven {ok, ...} y no lanzan (salvo throw:true).
    const check = (ok, detail, throwIt) => { if (!ok && throwIt) fail(`assert failed: ${JSON.stringify(detail)}`); return { ok, ...detail }; };
    const assert = {
        equal: (actual, expected, label = 'equal', throwIt) => check(JSON.stringify(actual) === JSON.stringify(expected), { label, actual, expected }, throwIt),
        zero: (actual, label = 'zero', throwIt) => check(actual === 0, { label, actual }, throwIt),
        noHorizontalOverflow(throwIt) { const o = dom.horizontalOverflow({ probe: true }); return check(o.overflowPx === 0 && o.probeScrollX === 0, { label: 'noHorizontalOverflow', ...o }, throwIt); }
    };

    // ---------------------------------------------------------------- results
    const results = {
        createMatrix() {
            const rows = [];
            return { add(name, data) { rows.push({ name, viewport: viewport.current(), ...data }); return rows.length; },
                rows, toJSON: () => rows.slice() };
        }
    };

    function environment() {
        // zeroViewport: con el panel del browser colapsado innerWidth/innerHeight valen 0 y todos los rects salen en 0.
        return { visibilityState: document.visibilityState, hidden: document.hidden, userAgent: navigator.userAgent,
            viewport: viewport.current(), zeroViewport: innerWidth === 0 || innerHeight === 0,
            phaser: window.Phaser ? Phaser.VERSION : null, appVersion: window.SofiApp ? SofiApp.version : null,
            tweenClock: !!(window.Phaser && Phaser.Tweens.TweenManager.prototype.__sofiQAClock) };
    }

    function snapshot() {
        return { viewport: viewport.current(), environment: { visibilityState: document.visibilityState },
            ...lifecycle.snapshot(), canvases: phaser.canvases(), overflow: dom.horizontalOverflow() };
    }

    // reset(): estado interno del harness (reloj virtual). cleanup(): además deshace patches y observers.
    // Ninguno toca el storage de la app: eso es storage.restore().
    function reset() { virtualTime = 0; return { ok: true }; }
    function cleanup() {
        while (installed.length) { try { installed.pop()(); } catch (e) { /* seguir */ } }
        reset();
        return { ok: true, tweenClock: !!(window.Phaser && Phaser.Tweens.TweenManager.prototype.__sofiQAClock),
            listenerPatch: !!EventTarget.prototype.__sofiQAListeners };
    }

    window.SofiQA = { version: '1.1', storage, viewport, dom, navigation, phaser, painting, listeners, lifecycle,
        rewards, monitor, assert, results, waitFor, nextFrame, wait, environment, snapshot, reset, cleanup };

    // Para reinyectar después de una recarga: eval(sessionStorage.__SofiQA_src)
    try { sessionStorage.setItem(`${RESERVED}_src`, `(${sofiQAFactory.toString()})();`); } catch (e) { /* storage bloqueado */ }
})();
