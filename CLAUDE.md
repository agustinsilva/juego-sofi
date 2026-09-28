# Juegos Sofi

Contexto operativo para Claude Code. Auditado contra el código el 2026-09-28 (versión `v1.22.2`, tras 8C.3 + migración a WebP).
Historial de fases y contexto previo: `GEMINI.md` (histórico, puede estar desactualizado).

## Project Overview

Minijuegos para una niña de ~4 años (Sofi). Feedback siempre positivo, táctil, sin castigos ni penalizaciones.
Textos y voz en español rioplatense (`es-AR`). SPA estática sin build step, hosteada en Firebase Hosting.

## Source of Truth

**Código actual > `GEMINI.md` / skills > suposiciones.**
- Si la documentación contradice el código, NO modificar el código para que coincida: preservar el comportamiento y reportar la diferencia.
- No documentar ni asumir arquitectura que no se pueda verificar en el código.
- No hay repositorio git: no hay historial ni rollback. Ser conservador con cambios destructivos.

## Architecture

- Vanilla HTML/CSS/JS con scripts clásicos (sin módulos, sin bundler, sin `package.json`). Todo comparte scope global.
- Phaser `3.60.0` desde CDN (`cdn.jsdelivr.net`) en `index.html`.
- Orden de carga (`public/index.html`): `drawings.js` → `app-core.js` → `script.js` → `game1.js` … `game5.js`.
- Cada pantalla es un `<div id="<view>-container">` que se muestra/oculta con la clase `hidden`.
- Cada vista registra `onEnter`/`onExit` con `SofiApp.navigation.registerView(name, config)`. Vistas registradas: `menu` (app-core), `collection`, `drawing-selector`, `game2` (script.js), `game1`, `game3`, `game4`, `game5` (cada game*.js).
- Cada juego crea su propia instancia `Phaser.Game` en `onEnter` y la destruye con `destroy(true)` en `onExit`.
- Bootstrap: `DOMContentLoaded` en app-core → `progress.init()`, `world.init()`, `world.onHomeEnter()`, inyecta `#app-version`, `refreshProgressUI()`. `script.js` además llama `SofiApp.navigation.goTo('menu', { silent: true })` al final.

## Main Files

| Archivo | Responsabilidad |
|---|---|
| `public/index.html` | Todos los contenedores de vistas, Home, Mis Cosas, UI DOM de Pintar y Gatito |
| `public/styles.css` | Design system (tokens `--color-*`, `--space-*`, `--radius-*`, `--motion-*`), Home, juegos, responsive |
| `public/app-core.js` | `window.SofiApp` + constantes de Home (`HOME_DISCOVERIES`, `HOME_SESSION_FLAVORS`, `HOME_CONTEXT_CONNECTIONS`, `SOFI_GUIDE_ASSETS`) |
| `public/script.js` | Crea el único `AudioContext`, wrappers legacy (`playSuccessSound`, `showMenu`…), `refreshProgressUI()`, vistas `collection` / `drawing-selector` / `game2` |
| `public/drawings.js` | `gameDrawings` (SVG de Pintar): `bitsy`, `buddy`, `sparks` (+ `originalImage` en `public/images/`) |
| `public/game1.js` … `game5.js` | Un juego por archivo (ver Games) |
| `firebase.json` / `.firebaserc` | Hosting de `public/`, proyecto `gaming-eb091` |
| `.agents/skills/juegos-sofi-*` | Skills propias del proyecto (versioning, drawings) |

No productivos (no tocar sin pedido): `scratch_*.js` y los PNG de referencia en raíz (`guia-estilo-gatito.png`, `hoja-personaje-caramelo.png`), `drawings_to_convert/`.

## Games

| Juego | Archivo | Vista | Instancia Phaser | Reward |
|---|---|---|---|---|
| Diferencias | `game1.js` | `game1` | `game1Instance` | `recordEvent('differences-level-N')`, sticker `detective` |
| Pintar | `game2.js` + `drawings.js` | `drawing-selector` → `game2` | `game2Instance` | `recordEvent('painting-<id>')`, sticker `artista` |
| Laberinto | `game3.js` | `game3` | `mazeGameInstance` | `recordEvent('maze-level-N')`, sticker `exploradora` |
| Mi Gatito | `game4.js` | `game4` | `catGameInstance` | `recordEvent('cat-milestone-N')` cada 5 cuidados, sticker `amiga` a los 15 |
| Memoria | `game5.js` | `game5` | `game5Instance` | `recordEvent('memory-level-N')` (sin sticker) |

- **Diferencias:** `challengePool` con tipos `object`, `color`, `orientation`, `size`, `category`, `memory`, `pattern`, `findAll`. `buildAdventure()` evita repetir los desafíos recientes (`juegosSofi_game1_adventure_v1`).
- **Memoria:** `MEMORY_CHALLENGES` + `MEMORY_ROUND_TYPES` (`pairs`, `visualRecall`, `sequenceRecall`) → `buildMemoryAdventure()` arma 5 rondas de dificultad 1..5, evita repetir el tema anterior y la aventura anterior. Tiene hints propios. Canvas 800x800 FIT. Cartas en `createCard`: `Container` [frente, emoji, cover=[dorso, `coverIcon`]] con `hitArea` rectangular del tamaño de la carta; el giro tweenea `scaleX` del container y la pista, `container.scale` y `cover.alpha`.
  - **Visual (8C.3):** `MEMORY_ASSETS` (`memory-bg.webp`, `memory-card-back.webp`, `memory-card-front.webp` en `public/assets/backgrounds/memory/`), cargados en `MemoryScene.preload()` con guarda `textures.exists`. Fondo: imagen 800x800 en profundidad -10 (el color de cámara del tema queda como fallback). Dorso y frente: `image.setDisplaySize(size)` en lugar de los `Graphics`; el `coverIcon` y el emoji siguen encima. Emparejada: `showCardMatchedVisual()` → `setAlpha(0.7)` en la imagen (o el redibujo legacy si es `Graphics`). Si falta una textura, se usa el `Graphics` legacy. Los paneles de `visualRecall` / `sequenceRecall` y `FinalMemoryScene` no cambiaron.
- **Diferencias ("encontrá el distinto", no dos imágenes):** canvas 800x1000 FIT. Presentaciones `grid` / `memory` / `pattern` (casillas `rectangle` `#f0f0f0`, que son también la capa de feedback: verde `a5d6a7` al acertar, amarillo `fff9c4` al errar) y `scene` (park / ocean / space, con objetos en posiciones fijas y un círculo de toque transparente de `hitSize` 130–140).
  - **Visual (8C.3):** `DIFF_BACKGROUNDS` (`public/assets/backgrounds/differences/`); `preload()` carga solo el fondo de la ronda actual (`getBackgroundConfig()`). `diff-bg.webp` en grid / memory / pattern (profundidad -20, sin interacción; el blanco queda como fallback). En `createSceneLevel`, `addBackgroundImage()` y, si hay fondo, se omite **solo** la decoración emoji de profundidad negativa; posiciones, `hitSize` y objetos no cambian. Sin textura: escena legacy completa (nunca ambas). **Space activado en v1.22.2** con un fondo regenerado sin planetas, lunas ni estrellas grandes, para que no compita con los distractores 🪐 🌙 ⭐ de `cat-space` (se había desactivado en v1.22.0 por eso). Si se regenera, mantener esa restricción.

## SofiApp

`window.SofiApp` (`app-core.js`):
- `version`: string mostrado en el Home (`#app-version`).
- `session`: estado en memoria (no persistido): `recordActivity`, `recentActivities`, `visitedActivities`, `flavor`, `contextualDiscovery`, `pendingHomeReaction`.
- `state`: `currentView`, `previousView`, `transitioning` (bloquea `goTo` durante la transición de 250 ms).
- `navigation`: `registerView`, `goTo(name, options)`, `goHome()`. Al volver a `menu` registra la actividad de la vista que se abandona.
- `audio`: usa el `AudioContext` creado en `script.js` (`audio.init(audioCtx)`). `tap`, `success`, `softError`, `speak` (`speechSynthesis`, `es-AR`). **No crear otro `AudioContext`.**
- `progress`: `localStorage['juegosSofi_progress']` = `{version, stars, stickers[], events[]}`. `recordEvent(id)` es idempotente y otorga una estrella solo la primera vez; `unlockSticker(id)`; `showRewardFeedback(emoji, text, assetSrc)`; `stickersConfig`.
- `world`: guía, burbujas, reactions, ambient, discoveries, `setGuideState` / `resetGuideState`, `onHomeEnter` / `onHomeExit`.

Otras claves de localStorage: `juegosSofi_game1_adventure_v1`, `juegos-sofi-paint-<drawingId>`, `juegosSofi_gatito`, `juegosSofi_paint_regions_v2` (marca de una sola vez: en v1.21.3 se borró el progreso viejo de bitsy y sparks). **No cambiar esquemas.**

## Home

- `#menu-container.container--home`: guía, `#global-stars-counter`, `.menu-grid` con 6 `.game-card` (5 juegos + Mis Cosas).
- Scroll: `body.is-home` (agregado/removido en `onHomeEnter`/`onHomeExit`) activa `overflow-y: auto; overflow-x: hidden`; `.container--home` con `max-height: none` / `overflow-y: visible`.
- Ambient: `startAmbient()` emoji cada 15–35 s según día/noche. Discoveries: el primero a los 8–15 s y después cada 20–45 s. Prioridad: contextual (70%) > flavor (60%) > random; solo en `menu`.
- Todos los timers se limpian en `onHomeExit` (`stopAmbient`, `stopHomeDiscoveries`, `hideBubble`, `resetGuideState`).
- **NO reconstruir el Home durante tareas visuales pequeñas.** Preservar: scroll vertical mobile natural, dimensiones de cards, navegación, touch targets, sin overflow horizontal, sin scroll interno en `.menu-grid`, sin `overflow-y` bloqueado globalmente.
- `.game-card` (Home), `.drawing-card` / `.selection-card` (Pintar), `.cat-choice-card` (Gatito) son componentes distintos: no compartir geometría.

## Painting — Critical Architecture

**REGRESSION-SENSITIVE.** Arquitectura híbrida DOM + Phaser, vigente:

```
#painting-wrapper
└─ #drawing-area               position:relative; aspect-ratio 1/1; overflow:hidden; touch-action:none
   ├─ #painting-phaser-layer     z-index 1, pointer-events:none   ← canvas Phaser (sparkles), transparent
   ├─ #painting-transform-layer  z-index 2, pointer-events:auto   ← SVG inyectado; zoom/pan por CSS transform
   └─ #painting-reference-container z-index 3, pointer-events:none (hijos thumbnail/expanded/backdrop: auto)
#painting-palette (DOM)  #painting-toolbar (DOM: zoom ±, ajustar, original, borrar, deshacer, reiniciar)
```

- No existe `#painting-svg-layer` en el HTML: el código lo usa solo como fallback (`painting-transform-layer || painting-svg-layer`).
- Hit testing: listeners `pointerdown/move/up/cancel` en el transform layer; en un tap sin drag (umbral de 10 px) → `document.elementFromPoint` → `.closest('.paintable')` → `region.style.fill = color`.
- Cada `.paintable` recibe `data-region-id`, `style.pointerEvents = 'all'` (**no** `visiblePainted`, como dice GEMINI.md) y transición de fill. El SVG tiene `pointer-events: auto`.
- Estado de la escena `PaintingScene`: `paintedRegions` (persistido), `history` (undo), `activeColor`, `paintMode` (`free` / `guided`), `zoomState {scale, panX, panY}`, `hintTimers`.
- Evento DOM→Phaser: `eventEmitter` `'region-painted'` → history, save, progreso, completitud, sparkle.
- **Ciclo de vida (v1.21.3):** `PaintingScene.shutdown()` es la única limpieza (timers de pista, listeners del transform layer, miniatura y cerrar de la referencia, botones `mode-free` / `mode-guided`, `region-painted`). Es idempotente y se engancha con `this.events.once('shutdown' | 'destroy')` en `create()`. `window.destroyGame2Phaser()` llama a ese `shutdown` **de forma síncrona antes de `destroy(true)`**, porque Phaser difiere el destroy al próximo frame y el shutdown tardío de la escena vieja borraría el listener `region-painted` de la nueva. La usan `initGame2Phaser`, el `showMenu` override y `game2.onExit` en `script.js`. `FinalCelebrationScene2` oculta `#painting-transform-layer` (antes buscaba `#painting-svg-layer`, que no existe, y el dibujo tapaba la celebración); `destroyGame2Phaser` e `initGame2Phaser` lo restauran.
- **Dibujos:** la completitud exige pintar **todas** las `.paintable`. Una región tapada por otra (típico del cubo de pintura de Inkscape al hacer clic dos veces en la misma zona) deja el dibujo imposible de terminar. Al agregar un dibujo, verificar en el browser que cada región sea el elemento de arriba en algún punto (`document.elementFromPoint`). Los IDs de región son por orden (`<id>-region-<n>`): sacar una región corre el progreso guardado de ese dibujo.
- Reglas: no usar input de Phaser para las regiones vectoriales; no cambiar z-index, pointer-events ni touch-action; no romper zoom/pan/undo/eraser/reset/Original ni la persistencia por dibujo.

## Maze — Critical Architecture

**REGRESSION-SENSITIVE.** La lógica está separada del render. **El asset se adapta al juego, no el juego al asset.**
- Los niveles NO se generan proceduralmente: `mazeWorlds` tiene 6 mundos (`forest`, `garden`, `beach`, `snow`, `night`, `magic`), cada uno con 2 `variants` hechas a mano (`layout`: 0 = camino, 1 = pared; `start`, `end`, `mission.objectives` con posiciones fijas).
- **Grilla variable:** 5x5 (forest, garden), 6x6 (beach, snow), 7x7 (night, magic). `cellSize = 800 / cols` (160 / 133.3 / 114.3). Canvas lógico **800x920**, `Scale.FIT` + `CENTER_BOTH`. La grilla ocupa siempre x 0–800, y 0–800; la franja y 800–920 es el HUD (`hudContainer` en (20,830), 🔊 en (730,860)). `#maze-game-container` tiene `height: 800px` y fondo `#aed581`: ese verde se ve en las franjas vacías laterales en todos los mundos.
- **Render actual:** cada celda (camino o pared) es un `rectangle(cellSize-4)` del mismo color `theme.cell` (profundidad 0), con separaciones de 4px donde se ve el color de cámara `theme.bg`. La pared es un emoji de texto `theme.wall` al 70% de la celda, guardado en `this.obstacles[r,c]` (lo usa la animación de choque). Encima de cada celda hay una `zone` interactiva que recibe el toque. Objetivos al 60% y casa al 80% de la celda, como texto. `mazeThemes` define `bg`, `cell`, `wall` y `decor` por mundo; `theme.wall` también aparece en el título DOM y en la intro del nivel.
- **Capas:** color de cámara < decor (-1) < celdas / paredes / zonas / objetivos / casa / 🐾 de la pista (0) < 🐾 del rastro (5) < compañero (9) < Caramelo (10) < partículas y eventos (20) < HUD y 🔊 (50) < overlay de la intro (100/101). En night-b, la luz 💡 cambia el color de cámara a `#5c6bc0`.
- **Tiles (8C.2):** `MAZE_THEME_TILES` (mundo → `{wall, floor}`) + `MAZE_TILE_PATH = '/assets/backgrounds/maze/'`. `init()` fija `this.tiles`, y `preload()` carga **solo los 2 tiles del mundo actual** si `!this.textures.exists(key)` (la escena se reinicia en cada nivel; cada tile se pide una sola vez por partida). Piso: `image(floorKey).setDisplaySize(cellSize-4)` en lugar del `rectangle`. Pared: `createWallVisual()` devuelve un **`Container` a escala 1** con la imagen a `cellSize × 0.86`; se guarda en `this.obstacles[r,c]` para que el tween de choque (`scale: 1.1` **absoluto**) funcione igual. **Nunca tweenear `scale` directamente sobre una imagen reducida con `setDisplaySize`.** Pisos y paredes **no son interactivos**; el toque sigue en las `zone` por celda. **Fallback:** si falta una textura, se usa el rectángulo o el emoji legacy. No cambiaron `layout`, `cellSize`, BFS, validadores, bloqueadores, objetivos, casa, Caramelo, pistas, HUD ni `theme.wall` (sigue como emoji en el título DOM y en la intro). La decoración procedural sigue oculta, fuera de alcance. Sin fondo ilustrado: el color de cámara `theme.bg` sigue en las separaciones y en el HUD.
- Assets: `public/assets/backgrounds/maze/maze-{wall,floor}-{forest,garden,beach,snow,night,magic}.webp` (12), **256x256**, ~460 KB en total (v1.22.2; ver Visual Assets → Formato). Paredes WebP sin pérdida con transparencia, pisos WebP q85 opacos. **Originales en alta resolución (1254x1254, ~17 MB) en `assets-src/maze/`**, fuera de `public/`, así que no se despliegan.
- `validateMazeWorlds()` / `validateMazeMissionSolvability()` validan al cargar (con BFS de estado) → `validMazeVariants`.
- `buildMazeAdventure()` elige una variante por mundo evitando las de la aventura anterior.
- Movimiento: `handleCellClick(r,c)` solo acepta celdas adyacentes (4 direcciones); pared → bump; blockers (`door`, `gate`, `bridgeTarget`) con `isObjectiveBlocking` / `areRequirementsMet`.
- Objetivos: `bone`, `friend` (`follow` → companions), `key`, `door`, `gate`, `light`, `plant`, `bridgeTarget`… Completitud con `isObjectiveComplete` / `isMissionComplete`; se llega a casa (`end`) con la misión completa → `recordEvent` → siguiente nivel o `FinalCelebrationScene`.
- `getMazePath(start, end, layout, blocked)`: BFS en grilla. Solo lo usa el hint.
- Hints (`resetHintTimers`): 10 s → pulso sobre el objetivo; 20 s → voz; 30 s → **un único** `🐾` (texto Phaser de 40 px) en la siguiente celda del camino BFS, con fade in/out y destroy. Idle a los 6 s → Caramelo `thinking` + `❓`.
- Rastro de movimiento: en cada paso, con 50% de probabilidad, un `🐾` de texto de 20 px con alpha 0.5 que se desvanece en 800 ms y se destruye.
- `FinalCelebrationScene` usa el emoji `🐶`, no el sprite de Caramelo (estado actual; no cambiarlo sin pedido).

## Mi Gatito

- `catState` global persistido en `juegosSofi_gatito`: `adopted`, `emoji`, `name`, stats `hambre` / `sed` / `energia` / `limpieza` / `diversion` (0–100), `lastUpdate`, `totalActions`, `rugStyle`, `preferences` (`foodCounts`, `toyCounts`, `zoneCounts`, `favoriteFood/Toy/Zone`), `memories` (`unlocked`, `firstUnlockedAt`).
- Decay: `applyTimeDecay()` al entrar (−10/hora, piso 30) + `decayInterval` (`startDecay`) mientras la vista está activa.
- Adopción DOM (`#adoption-screen`, `.adopt-btn` con `data-cat`) → `initPhaser()` → `RoomScene` (800x500).
- Zonas: `room`, `garden`, `playground` (`switchZone`, `buildZone`); `WORLD_OBJECTS` por zona; iniciativas del gato (`initiativeState`, `clearCatInitiative()`); visitas significativas (`startSignificantZoneVisit` / `recordSignificantZoneVisit`).
- Cuidados: `startCareActivity(type)` → `setupEat/Play/Bath/Drink/SleepActivity` → `finishCareActivity` → `applyCareResult` → `recordCatCareAction()`.
- Recuerdos: `CAT_MEMORIES` (15), `unlockCatMemory(id)`, álbum (`openMemoryAlbum` / `closeMemoryAlbum`), toasts en cola.
- `onExit`: destroy de Phaser, `clearInterval(decayInterval)`, `speechSynthesis.cancel()`.
- Canvas lógico 800x500 (16:10), `Scale.FIT` + `CENTER_BOTH`, cámara fija, sin recortes (solo franjas vacías). Escala real: 390x844 → 0.40, 430x932 → 0.45, **844x390 → 0.22 (179x112)**, 768x1024 → 0.85, 1366x768 → 0.89.
- Capas: color de cámara < `zoneContainer` (profundidad 0: fondo, overlay de noche, suelo legacy, objetos, objetos temporales) < `cat` < hint/reaction < partículas < `navContainer` (50) < actividad de cuidado (100) < toast (200) < álbum (300) < detalle (310).
- Movimiento libre: `this.input.on('pointerdown')` solo camina si `targets.length === 0`, con límites x 100–700, y 320–480. **Nada decorativo puede usar `setInteractive`.**
- **Escenarios (8C.1):** `CAT_ZONE_BACKGROUNDS` (zona → `{key, path, night}`) se carga en `preload()`. `addZoneBackground(zoneKey, isNight)` agrega el PNG como **primer hijo** de `zoneContainer` (`setOrigin(0,0)`, `setDisplaySize(800,500)`, **no interactivo**) y, si `isNight`, un rectángulo translúcido como segundo hijo (room/garden `0x1a237e` a 0.28/0.30; playground `0x4a2c6d` a 0.24). Con fondo, `buildZone` no dibuja el rectángulo de suelo legacy. **Fallback:** si la textura no existe, se usa el escenario legacy completo. La regla `isNight` (18–6 h) no cambió. La ventana de Room (vidrio, marco, ☀️/🌙), la alfombra, los objetos de cuidado, `WORLD_OBJECTS`, sol/luna/estrellas del jardín y todos los eventos siguen siendo Phaser por encima del fondo.
- Assets: `public/assets/backgrounds/cat/cat-{room,garden,playground}.webp`, **1200x750 WebP calidad 82** (35–75 KB cada uno, ~174 KB en total), optimizados en v1.21.2 (`magick in.png -filter Lanczos -resize 1200x750! -strip -quality 82 -define webp:method=6 out.webp`). Son opacos, así que WebP no pierde nada. Requiere navegadores actuales (Safari 14+); si no carga, se usa el escenario legacy. **Originales PNG 1586x992 en `assets-src/cat/`** (no se despliegan). Un fondo nuevo se agrega como una entrada en `CAT_ZONE_BACKGROUNDS`, y el arte no puede incluir nada interactivo ni dinámico.

Usos de ❤️ / 🌸 / 🐾 en `game4.js` (estado actual, **no reemplazar sin pedido**):
- **Persistente (PNG oficial):** memoria `first-love` "Mimos" → `assetKey: 'shared-heart'` (`icon-heart.webp`, cargado en `preload`). `createMemoryVisual()` usa la imagen en el álbum y en el detalle, con fallback al emoji. El toast (`showMemoryToast`) sigue usando el emoji.
- **Efímero (emoji, correcto así):** ❤️ en `showCatReaction` y en `showParticles` (cuidados, amor, actividades) y en el pool de reacciones `['❤️','💕','😻','✨']`; 🐾 como partícula suelta (flor, girasol, sugerencias); `🌸?` como hint.
- **Objeto de gameplay (emoji):** 🌸 `WORLD_OBJECTS` id `flower` en `garden` (interacción `flower`).

## Guide Character

- Assets: `public/assets/characters/sofi-guide/guide-{normal,happy,surprised,thinking,celebrate}.webp`, mapeados en `SOFI_GUIDE_ASSETS` y precargados al cargar el script.
- DOM: `#home-guide-character` > `#home-guide-image`; burbuja `#home-guide-bubble`.
- `SofiApp.world.setGuideState(state, {duration, priorityCheck, force})`, con prioridad `normal < thinking < happy < surprised < celebrate`; `resetGuideState()` limpia `guideStateTimer` y vuelve a `normal`.
- Usos: tap en el guía → `happy` + voz + partícula ❤️; discovery interactivo → `surprised`; star / sticker → `celebrate` (también desde `showRewardFeedback`); completed / primera visita / cierre de sesión → `happy`.
- **Los PNG del guía ya incluyen flores rosas (oreja y collar). No superponer `icon-flower.webp` sobre el personaje.**

## Caramelo

- Assets: `public/assets/characters/caramelo/caramelo-{normal,happy,thinking,celebrate,found-bone,walk-1..4}.webp` (texture keys = nombre sin extensión, en `CARAMELO_TEXTURES`). Se cargan en `MazeScene.preload()`.
- Helpers (`MazeScene`): `setCarameloState(key)` (normaliza la escala al 80% de la celda y preserva `flipX` / origin), `startCarameloWalk(dir)` (loop de 100 ms sobre walk-1..4, flip left/right), `stopCarameloWalk()`, `setCarameloEmotion(key, duration)`.
- Estados: walk al moverse; `happy` / `found-bone` al recoger (hueso → `found-bone`); `celebrate` al llegar a casa; `thinking` en idle.
- **Estabilizado. NO MODIFICAR durante cambios visuales no relacionados.**

## Visual Assets

- Juegos: `public/assets/icons/games/icon-{differences,painting,maze,cat,memory}.webp`, integrados en las 5 `.game-card` del Home (`.game-card__icon-image`). Mis Cosas usa el emoji 🎁.
- Compartidos: `public/assets/icons/shared/icon-{star,heart,flower,paw,rainbow,sparkle}.webp`.
- **Formato (v1.22.2):** todos los assets de `public/assets/` son WebP real (~20 MB → ~2 MB). Estrategia por grupo (ImageMagick 7, `-strip -define webp:method=6`):
  - Iconos de juegos y compartidos: sin pérdida (`-define webp:lossless=true`), máximo 256 px (`-resize '256x256>'`). Con pérdida bajaban a 27–35 dB de PSNR en los bordes.
  - Guía y Caramelo: q90 (`-define webp:alpha-quality=100`), dimensiones originales.
  - Laberinto: paredes sin pérdida y pisos q85, 256x256.
  - Memoria: `memory-bg` 1200 px y cartas 256x256. Diferencias: 1122x1402. Mi Gatito: 1200x750 q82 (v1.21.2).
  - Transparencia idéntica al original. PSNR de los WebP con pérdida: 35–44 dB.
  - **Originales** (44 archivos, ~20 MB) en `assets-src/originals-v1.22/assets/...`, con la misma estructura de carpetas. No se despliegan.
  - Pintar: las referencias `public/images/{bitsy,buddy,sparks}.jpg` (28–36 KB) quedan en JPG.
  - Un asset nuevo debe entrar como WebP: no referenciar `.png` desde el código.
- Clases CSS (una por componente, patrón BEM `<componente>__…-image`, siempre `object-fit: contain`): `.stars-pill__icon-image`, `.game-card__icon-image`, `.game-card__decor-image`, `.collection-card__icon-image` (64 px), `.reward-overlay__icon-image`, `.cat-choice-card__decor-image` (30 px + margin para igualar la caja del emoji decor). Para pseudo-elementos CSS (sin DOM), el equivalente es `background: url(...) center / contain no-repeat` dentro de la misma caja que ocupaba el glifo (ver `.home-guide-avatar::after`).
- Patrón DOM: `<img src="/assets/icons/shared/…" alt="" aria-hidden="true" class="…">` para decorativos. Dentro de botones cuyo listener lee `e.target`, la imagen debe tener `pointer-events: none`.
- Caché: `styles.css` no tiene cache-busting. Si una imagen nueva depende de CSS para su tamaño, agregar también los atributos `width`/`height` como fallback (un HTML nuevo con un CSS viejo en caché mostraría la imagen a su tamaño natural).
- No hay un helper JS central de iconos: cada uso referencia el path directo (HTML, `stickersConfig[].asset`, `this.load.image` en Phaser).
- Las rutas son absolutas (`/assets/...`): requieren servir `public/` como raíz.

Integración actual verificada:

| Asset | Dónde |
|---|---|
| `icon-star` | Contadores del Home y de Mis Cosas (`.stars-pill__icon-image`), overlay de `awardStar` (`showRewardFeedback`), decoración de las cards Memoria y Mis Cosas |
| `icon-heart` | Sticker `amiga`, decoración de la card Mi Gatito, memoria "Mimos" en el álbum del Gatito, decor de la card NARANJA en la pantalla de adopción (8B.2B) |
| `icon-flower` | Sticker `flor`, decoración de la card Pintar |
| `icon-paw` | Sticker `exploradora`, decoración de la card Laberinto |
| `icon-rainbow` | Sticker `arcoiris`, decoración de la card Pintar, decor de la card BLANCO de adopción (8B.2C) |
| `icon-sparkle` | Decoración de las cards Diferencias y Mis Cosas, decor de la card NEGRO de adopción (8B.2C), acento fijo del avatar del guía en el Home (`.home-guide-avatar::after`, 8B.2C) |

## Shared Asset Policy

- **PNG oficial** → UI persistente, identidad visual, protagonistas, collection / Mis Cosas, badges, rewards importantes.
- **Emoji / representación ligera** → texto, burbujas, voz, partículas, feedback efímero, elementos repetitivos o masivos de gameplay.
- **No reemplazar emojis globalmente** solo porque exista un PNG oficial.
- **Decisión (8B.2B): las huellas repetitivas del path/hint del Laberinto permanecen como representación ligera; `icon-paw.webp` se reserva para usos persistentes/singulares.** El 🐾 de la card BLANCO de adopción es la identidad del gato (`data-cat` → `catState.emoji`, dibujado así en el juego) y queda como emoji.
- **`icon-paw.webp`: NO convertirlo en el sistema de huellas del Laberinto.** El rastro de movimiento y el hint BFS usan `🐾` como `this.add.text` efímero y así deben quedar. No crear decenas de `<img>` / `Phaser.Image` / `Sprite` / instancias PNG para el path. No tocar BFS / pathfinding para acomodar el asset. `icon-paw` es para UI persistente, badges, collection, indicadores singulares y rewards.
- **`icon-flower.webp`:** es un asset independiente; nunca superponerlo sobre el guía, que ya tiene flores integradas.
- **`icon-rainbow.webp` (8B.2C):** uso especial y persistente: pocos lugares, alto impacto. No usarlo como partícula, ni en todas las cards/rewards/headers. Los textos con 🌈 siguen siendo emoji.
- **`icon-sparkle.webp` (8B.2C):** solo para acentos persistentes/protagonistas. **Los sparkles efímeros siguen siendo ligeros:** partículas ✨ (`showParticles`, `showTemporaryParticle`, `createMatchSparkles`), ambient/discoveries del Home, reacciones del guía y los sparkles Phaser de Pintar (`createSparkle` / `showHintSparkle` con `this.add.star`) NO se migran a PNG.
- **`icon-heart.webp`:** para vínculo, cariño, mascotas, collection y UI persistente. Los corazones como partículas, feedback, texto o animaciones efímeras quedan como emoji.

## Current Phase

- **8A** (personajes propios): completada. Guía integrado en el Home; Caramelo integrado en el Laberinto.
- **8B.1** (5 iconos de juegos): completada.
- **8B.2A** (`icon-star`): completada.
- **8B.2B** (`icon-heart`, `icon-flower`, `icon-paw`): **completada (v1.18.0).** Auditoría completa de usos: los persistentes ya estaban integrados (stickers, cards del Home, "Mimos"). El único uso nuevo migrado es el decor ❤️ de la card NARANJA de adopción. Flower y paw no tenían usos persistentes pendientes; todo lo demás es texto, efímero o gameplay y queda como emoji.
- **8C.3** (Memoria + Diferencias): **implementada (v1.22.0)**; el fondo de Space se reactivó en v1.22.2. Memoria: fondo + dorso + frente. Diferencias: fondo general + Park + Ocean. Validado: aventuras completas de Memoria (3 tipos de ronda) y de Diferencias (10 rondas, sorpresas, hitos, final), con el mismo feedback que la línea base, fallback con 404 reales y las 5 resoluciones. La 8C.4 no está definida: no empezar sin pedido.
- **8C.2** (identidad visual propia del Laberinto): **implementada (v1.21.0).** 6 mundos con pared y piso propios (ver Maze). Validado: las 12 variantes se completan con input real, los 184 caminos `getMazePath` son idénticos, el validador mantiene su baseline (7 OK / 5 falsos negativos), el choque, la pista y la celda no adyacente se comportan igual, y el fallback funciona.
- **8C.1** (escenarios propios de Mi Gatito): **implementada (v1.20.0).** Room, Garden y Playground con fondo ilustrado, overlay nocturno y fallback legacy (ver Mi Gatito).
- **8B.2C** (`icon-rainbow`, `icon-sparkle`): **completada (v1.19.0).** Ya estaban integrados: el sticker `arcoiris`, la card Pintar (rainbow) y las cards Diferencias / Mis Cosas (sparkle). Migrados ahora: los decor 🌈 (BLANCO) y ✨ (NEGRO) de adopción, y el ✨ del avatar del guía. **Fase 8B completa.** 
- Candidatos evaluados y NO migrados (decisión deliberada; solo revisar si se pide): hito 🌈 del nivel 5 en Diferencias (`showMilestone`, Phaser efímero; los otros hitos ⭐ / 🎁 son emoji), memoria `firefly` ✨ del Gatito (es la luciérnaga que se ve como ✨ en el jardín), ✨ `.card-decor` repetido en cada card del selector de dibujos, decor ⭐ de GRIS (sería un uso nuevo de star).

## Regression-Sensitive Areas

1. `SofiApp.navigation` (lifecycle `onEnter` / `onExit`, `transitioning`, mapeo vista→actividad).
2. Único `AudioContext` (`script.js`).
3. Limpieza de timers y destroy de Phaser al salir de cada vista.
4. Home: scroll, `body.is-home`, guía, discoveries, flavor, ambient.
5. Pintar: capas, z-index, pointer-events, touch-action, hit testing SVG, zoom/pan, undo, eraser, persistencia.
6. Laberinto: layouts, validación, BFS, movimiento, blockers, completitud, hints, Caramelo.
7. Mi Gatito: `catState` / persistencia, decay, memorias, preferencias, iniciativas, `clearCatInitiative`.
8. Esquemas de localStorage (todas las claves listadas en SofiApp).
9. Progreso: `recordEvent` idempotente, IDs de eventos y stickers.

**Política de no regresión:** una tarea visual NO debe alterar gameplay, dificultad, score, progresión, lógica de rewards, esquema de localStorage, BFS / pathfinding, colisiones, movimiento, completitud ni comportamiento de personajes. Si una tarea visual parece requerirlo: **DETENERSE y explicar por qué antes de tocar nada.**

## Validation

Baseline (2026-09-28): todos pasan.

```bash
for f in public/*.js; do node --check "$f" || echo "FAIL $f"; done
```

Browser: servir `public/` en la raíz (las rutas `/assets/...` son absolutas), por ejemplo `firebase serve` / `firebase emulators:start --only hosting` o cualquier servidor estático con raíz en `public/`. Esperado: 0 errores de consola (SyntaxError, ReferenceError, TypeError, Phaser, 404 de assets), sin timers fantasma y navegación completa ida y vuelta a cada juego.

Responsive a validar: `390x844`, `430x932`, `844x390`, `768x1024`, `1366x768`, con foco en Home, Mis Cosas, Pintar y las pantallas modificadas. Sin scroll horizontal; Home con scroll vertical natural.

Logs esperados en consola (no son errores): `Maze variants: …`, `[Painting] …`, y `CAT_MEMORIES validados` en localhost.
Errores de consola PREEXISTENTES en cada carga (baseline 2026-09-28; no son regresiones): `[Maze Validation] Variant beach-b|snow-b|night-a|magic-a|magic-b is unsolvable` (5 de 12, falsos negativos del validador; ver Known Issues) y `Not enough symbols in visual: v-vehicles-5|v-sky-5|v-nature-5`. Comparar contra este baseline.

Servidor local: `.claude/launch.json` → `juegos-sofi-local` (`firebase serve --only hosting --port 5050`). Tras editar CSS/HTML, recargar sin caché (el navegador cachea `styles.css`).

## Versioning / Deploy

Fuente: `.agents/skills/juegos-sofi-versioning/SKILL.md`.
- La versión está en `public/app-core.js` → `SofiApp.version` (hoy `v1.22.2`); se renderiza sola en el Home.
- Formato `vMAJOR.MINOR.PATCH`: MAJOR = cambio de framework o estructura; MINOR = fase nueva o minijuego nuevo; PATCH = bugfix o mejora visual pequeña.
- Cada deploy a Firebase debe incrementar la versión. Informar al usuario el número nuevo.
- Deploy: `firebase deploy` (Hosting, proyecto `gaming-eb091`). **Solo cuando el usuario lo pida explícitamente**; es una acción externa.

Nuevos dibujos para Pintar: seguir `.agents/skills/juegos-sofi-drawings/SKILL.md`. Nota: la lógica de pintado vive en `game2.js`, no en `script.js` como dice la skill.

## Agent Workflow

Antes de cualquier modificación:
1. Leer este `CLAUDE.md`.
2. Leer la documentación o skill específica relevante (`.agents/skills/juegos-sofi-*`, secciones de `GEMINI.md`).
3. Inspeccionar el código real de los archivos afectados; no confiar solo en la documentación.
4. Identificar el conjunto mínimo de archivos a tocar y el lifecycle de los elementos afectados (timers, listeners, instancias Phaser).
5. Establecer el baseline (`node --check`).
6. Hacer el cambio mínimo, incremental, con checkpoints (asset → validar → animación → validar → lógica).
7. Validar sintaxis (`node --check`).
8. Validar en el browser cuando corresponda (consola limpia, responsive).
9. Probar las áreas sensibles a regresión afectadas.
10. Reportar exactamente qué cambió (archivos y comportamiento) y qué no se pudo verificar.

No hacer refactors, cambios de gameplay, ediciones a `GEMINI.md` ni deploys sin pedido explícito. Reportar la deuda técnica en lugar de corregirla de paso.

## Known Issues / Tech Debt (no corregidos)

- Mi Gatito: `WORLD_OBJECTS` define `window` y `yarn_dec` para Room, pero `buildZone('room')` nunca los construye. 6 recuerdos (`butterfly`, `bird`, `ladybug`, `firefly`, `box-surprise`, `moon-window`) no tienen ningún `unlockCatMemory`. `initiativeState.active` nunca se pone en `true`: el sistema de iniciativas existe pero nunca se dispara.
- Mi Gatito en 844x390: el canvas se ve a 179x112 (escala 0.22), por la altura fija de 600px del contenedor y FIT (ya pasaba antes de 8C.1).
- Fondos de Mi Gatito: peso resuelto en v1.21.2 (WebP, ~174 KB). Siguen apartándose de la especificación de 8C.1: horizonte en ~58%, suelo naranja en Room (🐈 contrasta poco de día), flores y arbustos en primer plano en Garden y Playground, y una estantería detrás de 🛁.
- `playTone` se invoca en `game2.js` y `game3.js` (protegido con `typeof playTone === 'function'`), pero no está definido en ningún archivo: esos tonos nunca suenan.
- **Resuelto en v1.21.3 (Pintar):** la instancia no se destruía al volver al Home; los listeners del transform layer y de los botones Libre/Guía se acumulaban entre sesiones (cada toque se procesaba una vez por escena vieja y pintaba con el color viejo); la celebración quedaba tapada por el dibujo; y bitsy y sparks no se podían completar (4 y 5 regiones tapadas; ahora 30 regiones cada uno). Copia de los archivos previos en `assets-src/code-backup-v1.21.2/`.
- **Pendiente (Pintar):** el botón "Volver a Jugar" de `FinalCelebrationScene2` no se puede tocar, porque el canvas está dentro de `#painting-phaser-layer` con `pointer-events: none` (a propósito, para que los toques lleguen al SVG). Hoy la celebración solo se cierra con 🏠 Menú. Arreglarlo implica activar `pointer-events` en esa capa solo durante la celebración: requiere aprobación, porque es un área sensible. Los dibujos bitsy y sparks conservan algunas regiones reales muy chicas (30–120 px² en tablet), difíciles de acertar en celular. El `end-screen-2` DOM y `showEndScreen2` (script.js) no se usan.
- **Validador con falsos negativos:** `validateMazeMissionSolvability()` marca como imposibles exactamente las 5 variantes con bloqueadores (beach-b 🌊 puente, snow-b 🚧, night-a 🚪, magic-a 🚪, magic-b 🚧). Su BFS nunca entra en la celda del bloqueador, así que nunca lo "alcanza" ni lo abre; el juego, en cambio, lo abre desde la celda adyacente (`handleCellClick`). Una simulación de solo lectura por adyacencia confirma que las 5 se pueden completar. `buildMazeAdventure()` usa todas las variantes, no solo `validMazeVariants`, así que en la práctica no hay niveles rotos. Hay que arreglar el validador, no los niveles.
- Tiles del Laberinto: resuelto en v1.21.1 (256x256, ~1 MB en total, ~3 MB de GPU). Observaciones visuales que siguen vigentes: la pared de Noche tiene estrellas amarillas y la roca de Playa una estrellita de mar (⭐ es objetivo en night-b, beach-a y magic-a). En el juego se distinguen bien, pero conviene evitarlo si se regeneran. En Nieve, 🦴 sobre el hielo tiene menos contraste.
- Validación en el browser con la pestaña oculta: Phaser baja a ~3 fps y `destroy(true)` (diferido) puede dejar un canvas viejo unos instantes. Para tests automáticos: detener `game.loop` y avanzar con `game.headlessStep()`, con el `TweenManager.getDelta` parcheado en la página de prueba (en 3.60 los tweens usan reloj real) y yields por `MessageChannel`.
- v1.22.0 salió sin los assets de Memoria (la carpeta quedó vacía por un movimiento de archivos externo); se restauraron y publicaron en v1.22.1.
- Assets de 8C.3: resuelto en v1.22.2 (WebP real). **PNG legacy en `public/assets/` (transición de caché):** los `.png` viejos siguen en `public/` para clientes con HTML/CSS/JS de v1.22.1 en caché (`max-age=3600`). El código ya no los referencia. **Borrarlos en el próximo deploy** (los originales están en `assets-src/originals-v1.22/`).
- **Ocean (8C.3):** el fondo tiene cardúmenes de peces lejanos (siluetas, y≈100–240) y mucho coral junto a los objetos; 🐟 (azul) contrasta poco con el agua. Se juega bien, pero conviene suavizarlo si se regenera. El frente de carta de Memoria tiene ~5% de margen transparente (el dorso ~1%): al girar se ve un poco más chico. La carta emparejada (alpha 0.7) se distingue poco de una abierta a 34 px.
- **`#memory-game-container` sin CSS:** el canvas de Memoria solo se achica al rotar o redimensionar, y no vuelve a crecer hasta volver a entrar al juego (ya pasaba antes de 8C.3).
- La decoración aleatoria del Laberinto (30% de las celdas libres, profundidad -1) queda debajo del rectángulo opaco de su celda (profundidad 0), así que **nunca se ve**. Si se sube su profundidad, puede tapar los caminos.
- Laberinto en 844x390: canvas 143x164 (escala 0.18); en 7x7 las celdas miden ~20px y Caramelo ~16px.
- `.cat-choice-card .card-decor` (hoy solo el emoji ⭐ de GRIS) tiene `pointer-events: auto`, y el listener de adopción lee `e.target.getAttribute('data-cat')`: un toque justo sobre esos decor adopta con `emoji = null` (**verificado en el browser** con ⭐ de GRIS: el gato queda sin representación). NARANJA, NEGRO y BLANCO ya no lo tienen (sus img usan `pointer-events: none`); GRIS sigue afectada.
- En 1366x768 las `.cat-choice-card` (3 columnas) desbordan el contenedor de adopción a la derecha (ya pasaba antes de 8B.2B). La card NEGRO queda parcialmente recortada por `#game4-container { overflow: hidden }`: su decor no se ve ni se puede tocar.
- Los stickers `arcoiris` y `flor` están en `stickersConfig`, pero ningún juego llama `unlockSticker` con esos IDs: hoy son imposibles de desbloquear.
- Muchos `console.log` de debug en Pintar.
- CSS legacy posiblemente sin uso (fases 7/8) y abundante estilo inline en `index.html` (Pintar).
- Sin control de versiones (git).
