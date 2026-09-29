# Juegos Sofi

Contexto operativo para Claude Code. Auditado contra el código el 2026-09-29 (versión `v1.24.0`, tras 8C.5).
Historial de fases y contexto previo: `GEMINI.md` (histórico, puede estar desactualizado).

## Project Overview

Minijuegos para una niña de ~4 años (Sofi). Feedback siempre positivo, táctil, sin castigos ni penalizaciones.
Textos y voz en español rioplatense (`es-AR`). SPA estática sin build step, hosteada en Firebase Hosting.

## Source of Truth

**Código actual > `GEMINI.md` / skills > suposiciones.**
- Si la documentación contradice el código, NO modificar el código para que coincida: preservar el comportamiento y reportar la diferencia.
- No documentar ni asumir arquitectura que no se pueda verificar en el código.
- **Git:** el proyecto es un repo git (rama de trabajo `main`, con remoto `origin`). Antes de modificar, correr `git status` / `git diff --stat`: puede haber cambios sin commitear de fases anteriores. No revertirlos ni descartarlos (`reset`, `checkout`, `restore`, `clean`, `stash`) sin pedido explícito, y no commitear ni pushear sin pedido.

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
  - **Regla de fondos de escena:** no pueden tener nada que se confunda con un símbolo de juego (peces, siluetas de peces, pulpos, vehículos, planetas…) ni objetos grandes junto a las posiciones de los objetos. Centro despejado, decoración mínima y en la periferia.
  - **Ocean (8C.5G):** fondo nuevo, solo agua, arena, rayos de luz, burbujas y algas chicas en los costados (sin peces, coral ni rocas). Entregado en 1536x1024 (3:2): se usó el **recorte central 4:5** (819x1024) escalado a 1122x1402, q82 (`magick src -gravity center -crop 819x1024+0+0 +repage -filter Lanczos -resize 1122x1402! -strip -quality 82 -define webp:method=6 out.webp`, ~50 KB; el mismo q82 reproduce byte a byte `diff-scene-park.webp`). Source: `assets-src/differences/diff-scene-ocean.source.png`. Los fondos se dibujan con `setDisplaySize(800,1000)`: un asset que no sea 4:5 se deforma. Contraste medido (ΔE de borde): 🐟 en el agua 22–39 (el más débil, legible por contorno y ojo), 🐡 sobre la arena ~27 (igual que el fondo anterior); 🚗 (la respuesta) 60–78 en todas las posiciones.

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

## Responsive Invariants (8C.5)

Todo en `styles.css`. Los canvas lógicos, `Scale.FIT` y `CENTER_BOTH` no cambian.
- **Un solo centrado (8C.5A):** Phaser (`FIT` + `CENTER_BOTH`) es la **única** capa que centra el canvas (con `margin-left/top`). Los padres `#diff-game-container`, `#maze-game-container` y `#cat-game-container` usan `justify-content/align-items: flex-start`; `#memory-game-container` usa `text-align: left` (el canvas es inline). Centrar también el padre corría el canvas medio margen. No volver a centrar el padre.
- **El padre de un canvas `FIT` necesita tamaño propio (8C.5C / 8C.5D):** si su alto sale del contenido, el alto depende del canvas y el canvas del alto (dependencia circular): se achica al bajar la ventana y **no vuelve a crecer**. Por eso:
  - `#memory-game-container`: `width: 100%; max-width: 800px; aspect-ratio: 1 / 1; min-height: 0; display: flex` (canvas 800x800).
  - `#diff-game-container`: `aspect-ratio: 4 / 5` (canvas 800x1000; **no** usar 1/1). Con `min-height: 0` y `flex-shrink` el tope del `.container` lo sigue achicando.
  - Laberinto (`height: 800px`) y Mi Gatito (`height: 600px`) ya tenían alto propio.
  - No sacar esas reglas. Un canvas `FIT` nuevo debe tener un padre con tamaño propio.
- **Landscape bajo (8C.5B.1 / 8C.5E):** `@media (max-height: 600px) and (orientation: landscape)`, con selectores explícitos:
  - `#game1-container`, `#game3-container`, `#game4-container`: `max-height: calc(100vh - 16px)`, `padding: 8px 12px`, título a 1.3rem en una línea (`br` oculto), barras del Gatito compactas.
  - `#game5-container` (Memoria): el mismo tope y padding, título `clamp(1rem, 2.5vw, 1.3rem)` en una línea en todos los niveles. Así el nivel 4/5 no achica el canvas y el título queda a la derecha del 🏠 Menú (F9). No sacar estrellas ni texto.
  - Adopción (`#adoption-screen`): scrolleable, `safe center`, cards en una fila de grilla. Desde 768 px, `.cat-options` usa `repeat(2, minmax(0, 1fr))` (antes desbordaba en 1366).
  - Pintar tiene su propia regla (`safe center`, 8C.4.0) y el Home no se toca. No copiar estas reglas globalmente.

Baseline medido el 2026-09-29 (CSS px; aventura en el nivel 1):

| Pantalla | 390x844 | 430x932 | 844x390 | 768x1024 | 1366x768 |
|---|---|---|---|---|---|
| Diferencias | 322.5x403.1 | 360.5x450.6 | **255.2x319** | 598.1x747.6 | 392.9x491.2 |
| Laberinto | 322.5x370.9 | 360.5x414.6 | **277.4x319** | 648.3x745.6 | 424.5x488.2 |
| Mi Gatito | 322.5x201.6 | 360.5x225.3 | **422.5x264** | 681.6x426 | 710.7x444.2 |
| Memoria | 322.5 | 360.5 | **319** (niveles 1–5) | 681.6 | 488.2 |
| Pintar (`#drawing-area`) | 322.5 | 360.5 | 737 (scroll, `safe center`) | 666.6 | 737 |
| Adopción (alto de card) | 160, 1 col | 160, 1 col | **77, 2x2** | 160, 2 col | 160, 2 col |

- **Resize:** el tamaño final depende solo del viewport actual, en la misma instancia y partida. Diferencias 392.9 → 255.2 → 392.9 (1366 → 844 → 1366); Memoria 681.6 → 319 → 681.6 (768 → 844 → 768).
- **Scroll:** 0 scroll horizontal del documento en todas las pantallas. El Home tiene scroll vertical natural.

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
- **Layout (8C.4.0):** `#game2-container > main.drawing-main` scrollea en vertical (`overflow: auto` heredado de `.container > main`) y usa `justify-content: safe center` (fallback `flex-start`), en una regla propia de Pintar. Con el `center` genérico, cuando el contenido era más alto que el `main` desbordaba hacia arriba y esa parte no se podía scrollear (en 844x390 se perdían 481 px: Libre/Guía, progreso, Ayuda y más de la mitad del dibujo). No cambiar esa regla a `center`, ni aplicarla a los demás `main`. `main` tiene padding 0 y `overflow-x: auto`: cualquier cosa que salga por los costados de `#drawing-area` se recorta. Las mediciones de la auditoría de 8C.4 están en el reporte de esa fase.
- **Para tests automáticos:** los `PointerEvent` sintéticos hacen fallar `setPointerCapture` / `releasePointerCapture` (con "No active pointer"), y entonces no pinta. En la página de prueba, reemplazar esos dos métodos del transform layer por funciones vacías, o usar clicks reales.
- **Ambientación (8C.4B), solo CSS en `styles.css`, sin DOM, JS ni capas nuevas:**
  - **Fondo:** `.game-view--painting` tiene 2 capas: `url('/assets/backgrounds/painting/painting-bg-tile.webp') 0 0 / 256px 256px repeat` sobre el mismo `linear-gradient` de antes. La declaración anterior, solo con el gradiente, queda como fallback para CSS viejo. Si el tile no carga, se ve el gradiente (probado con un 404).
  - **Marco:** `#drawing-area { box-shadow: inset 0 0 0 6px #e0f7fa, inset 0 0 0 8px #b2ebf2, 0 4px 10px rgba(0,0,0,.1) !important }`. El `!important` es necesario porque el box-shadow original está inline en `index.html`, y la última sombra es esa misma. Una sombra inset se pinta debajo de los hijos (el SVG y el canvas son transparentes), no cambia el box y no intercepta toques: `elementFromPoint` sobre el marco devuelve el transform layer. No reemplazarlo por `border`, `padding` ni pseudo-elementos.
  - **Asset:** WebP real sin pérdida, 512x512 RGBA, 35 KB.
    - 8 motivos del arte entregado: arcoíris, 2 crayones, pincel sin la gota, corazón, estrella de 5 puntas y 2 nubes. Sin círculos, gotas, manchas ni paletas de pintor.
    - Saturación al 80%, alpha máximo 0.53 (50%), cobertura del 7.5%.
    - **Seamless por construcción:** filas y columnas 0 y 511 con alpha 0, a ≥24 px del borde.
    - Source armado: `assets-src/painting/painting-bg-tile.png`. Motivos, variantes al 35/50/70% y posiciones: `assets-src/painting/candidates-8c4b/` (`LAYOUT.txt`). Original entregado: `assets-src/painting/painting-bg-tile.source.png`.
    - Para regenerarlo, repetir con ImageMagick lo que está en `LAYOUT.txt` y exportar con `-define webp:lossless=true -define webp:method=6`.
  - **Visual:** en celular y landscape, algunos motivos quedan detrás del título "PINTA TU DIBUJO"; se sigue leyendo.

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
- **Salto de la intro (8C.5F):** al terminar `showLevelIntro()` se habilita el input y Caramelo salta (tween de `y`, valores absolutos, 800 ms). Se guarda en `this.introHopTween` (`init()` lo pone en `null`; `onComplete` también). `cancelIntroHop()` lo corta y deja a Caramelo en el centro de su celda lógica; se llama al principio de `moveDogTo()` y de `bumpDog()`. **`dogPos` es la fuente de verdad:** un tween decorativo no puede pisar una posición posterior. Antes, un toque temprano movía `dogPos` pero el salto devolvía el sprite a la fila de inicio. El toque temprano sigue permitido (sin bloqueo nuevo). **No usar `this.events` en `MazeScene`:** `init()` lo pisa con `this.levelData.events`.
- **Toque (8C.5H):** cada celda es una `zone` del tamaño completo de la celda, contiguas. Un toque que cae fuera de la celda buscada casi siempre cae en una celda no adyacente o en la propia y se ignora (solo suena el tap): con dispersión simulada no hubo **ningún** movimiento a una celda equivocada. Tolerancia: ±½ celda en línea recta. Un toque durante el movimiento (250 ms) se ignora (`isMoving`).
- `FinalCelebrationScene` usa el emoji `🐶`, no el sprite de Caramelo (estado actual; no cambiarlo sin pedido).

## Mi Gatito

- `catState` global persistido en `juegosSofi_gatito`: `adopted`, `emoji`, `name`, stats `hambre` / `sed` / `energia` / `limpieza` / `diversion` (0–100), `lastUpdate`, `totalActions`, `rugStyle`, `preferences` (`foodCounts`, `toyCounts`, `zoneCounts`, `favoriteFood/Toy/Zone`), `memories` (`unlocked`, `firstUnlockedAt`).
- Decay: `applyTimeDecay()` al entrar (−10/hora, piso 30) + `decayInterval` (`startDecay`) mientras la vista está activa.
- Adopción DOM (`#adoption-screen`, `.adopt-btn` con `data-cat`) → `initPhaser()` → `RoomScene` (800x500).
- Zonas: `room`, `garden`, `playground` (`switchZone`, `buildZone`); `WORLD_OBJECTS` por zona; iniciativas del gato (`initiativeState`, `clearCatInitiative()`); visitas significativas (`startSignificantZoneVisit` / `recordSignificantZoneVisit`).
- Cuidados: `startCareActivity(type)` → `setupEat/Play/Bath/Drink/SleepActivity` → `finishCareActivity` → `applyCareResult` → `recordCatCareAction()`.
- Recuerdos: `CAT_MEMORIES` (15), `unlockCatMemory(id)`, álbum (`openMemoryAlbum` / `closeMemoryAlbum`), toasts en cola.
- `onExit`: destroy de Phaser, `clearInterval(decayInterval)`, `speechSynthesis.cancel()`.
- Canvas lógico 800x500 (16:10), `Scale.FIT` + `CENTER_BOTH`, cámara fija, sin recortes (solo franjas vacías). Escala real: 390x844 → 0.40, 430x932 → 0.45, **844x390 → 0.53 (422.5x264, desde 8C.5B.1; antes 0.22)**, 768x1024 → 0.85, 1366x768 → 0.89.
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

- **8C.5** (responsive, resize y usabilidad): **cerrada y desplegada en v1.24.0** (checkpoint 2026-09-29).
  - **A:** un solo centrado del canvas.
  - **B.1:** landscape bajo en Diferencias, Laberinto, Mi Gatito y Adopción.
  - **C:** recuperación de tamaño de Memoria al redimensionar.
  - **D:** lo mismo en Diferencias.
  - **E:** landscape bajo de Memoria + F9.
  - **F:** carrera del salto de Caramelo.
  - **G:** fondo de Ocean (F5).
  - **H:** auditoría de F18, aceptada con deuda.
  - Detalle en Responsive Invariants, Diferencias, Maze y Known Issues.
  - **8D:** no definida; no empezar sin pedido.
- **8A** (personajes propios): completada. Guía integrado en el Home; Caramelo integrado en el Laberinto.
- **8B.1** (5 iconos de juegos): completada.
- **8B.2A** (`icon-star`): completada.
- **8B.2B** (`icon-heart`, `icon-flower`, `icon-paw`): **completada (v1.18.0).** Auditoría completa de usos: los persistentes ya estaban integrados (stickers, cards del Home, "Mimos"). El único uso nuevo migrado es el decor ❤️ de la card NARANJA de adopción. Flower y paw no tenían usos persistentes pendientes; todo lo demás es texto, efímero o gameplay y queda como emoji.
- **8C.3** (Memoria + Diferencias): **implementada (v1.22.0)**; el fondo de Space se reactivó en v1.22.2. Memoria: fondo + dorso + frente. Diferencias: fondo general + Park + Ocean. Validado: aventuras completas de Memoria (3 tipos de ronda) y de Diferencias (10 rondas, sorpresas, hitos, final), con el mismo feedback que la línea base, fallback con 404 reales y las 5 resoluciones.
- **8C.4** (ambientación de Pintar): **completa y desplegada en v1.23.0.** Tiene 2 partes:
  - 8C.4.0: fix responsive.
  - 8C.4B: patrón de fondo y marco inset (ver Painting → Ambientación).
  - Validado en las 5 resoluciones: los rects de área, transform layer, capa de Phaser, canvas y SVG, el scroll y el alcance son idénticos al baseline, con 0 scroll horizontal. El toque, contorno, margen, drag, zoom, pan, `focusRegion`, chispa, referencia, paleta, toolbar, Libre/Guía, pistas, persistencia y 10 entradas y salidas se comportan igual. En 844x390 también con un click real.
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

Baseline (2026-09-29): los 8 JS pasan.

```bash
for f in public/*.js; do node --check "$f" || echo "FAIL $f"; done
```

Browser: servir `public/` en la raíz (las rutas `/assets/...` son absolutas), por ejemplo `firebase serve` / `firebase emulators:start --only hosting` o cualquier servidor estático con raíz en `public/`. Esperado: 0 errores de consola (SyntaxError, ReferenceError, TypeError, Phaser, 404 de assets), sin timers fantasma y navegación completa ida y vuelta a cada juego.

Responsive a validar: `390x844`, `430x932`, `844x390`, `768x1024`, `1366x768` (y `932x430` si se toca el landscape). Pantallas: Home, Mis Cosas, Diferencias, Pintar, Laberinto, Adopción, Mi Gatito y Memoria. Comparar contra la tabla de Responsive Invariants. Sin scroll horizontal (probarlo con `scrollTo(200, 0)` y leer `scrollX`, porque `scrollWidth` puede marcar de más por partículas transitorias del Home). El Home tiene scroll vertical natural.

Logs esperados en consola (no son errores): `Maze variants: …`, `[Painting] …`, y `CAT_MEMORIES validados` en localhost.
Errores de consola PREEXISTENTES en cada carga (baseline 2026-09-28, igual el 2026-09-29; no son regresiones): `[Maze Validation] Variant beach-b|snow-b|night-a|magic-a|magic-b is unsolvable` (5 de 12, falsos negativos del validador; ver Known Issues) y `Not enough symbols in visual: v-vehicles-5|v-sky-5|v-nature-5`. Comparar contra este baseline.

Servidor local: `.claude/launch.json` → `juegos-sofi-local` (`firebase serve --only hosting --port 5050`). Tras editar CSS/HTML, recargar sin caché (el navegador cachea `styles.css`).

Trampas conocidas del entorno de prueba (no son bugs de la app):
- **Arranque del servidor:** si la página abre antes de que `firebase serve` esté listo, `styles.css` falla (`ERR_CONNECTION_REFUSED`, status 0) y todas las vistas se ven a la vez. Recargar.
- **Pestaña oculta:** usar el reloj virtual descripto en Known Issues. `headlessStep` no renderiza: para una captura, avanzar con `game.step()` (la primera captura puede mostrar el frame anterior).
- **Esperas:** en Diferencias, Laberinto y Memoria el título del header se fija en `init()` / `create()`, y los assets cargan en tiempo real. Medir el canvas recién después de que la escena esté corriendo, o el tamaño sale del header viejo.
- **Globales `let`:** `catState`, `game1Instance`, `currentMazeLevel`… no son `window.*`. Leerlas por nombre o con `(0, eval)('catState')`.
- **Adopción:** para volver a verla, borrar `juegosSofi_gatito` y poner `catState.adopted = false`.
- **Datos:** el harness debe guardar y restaurar `localStorage`. "Reiniciar" en Pintar borra el progreso del dibujo.

## Versioning / Deploy

Fuente: `.agents/skills/juegos-sofi-versioning/SKILL.md`.
- La versión está en `public/app-core.js` → `SofiApp.version` (hoy `v1.24.0`); se renderiza sola en el Home.
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
- Fondos de Mi Gatito: peso resuelto en v1.21.2 (WebP, ~174 KB). Siguen apartándose de la especificación de 8C.1: horizonte en ~58%, suelo naranja en Room (🐈 contrasta poco de día), flores y arbustos en primer plano en Garden y Playground, y una estantería detrás de 🛁.
- `playTone` se invoca en `game2.js` y `game3.js` (protegido con `typeof playTone === 'function'`), pero no está definido en ningún archivo: esos tonos nunca suenan.
- **Resuelto en v1.21.3 (Pintar):** la instancia no se destruía al volver al Home; los listeners del transform layer y de los botones Libre/Guía se acumulaban entre sesiones (cada toque se procesaba una vez por escena vieja y pintaba con el color viejo); la celebración quedaba tapada por el dibujo; y bitsy y sparks no se podían completar (4 y 5 regiones tapadas; ahora 30 regiones cada uno). Copia de los archivos previos en `assets-src/code-backup-v1.21.2/`.
- **Pendiente (Pintar):** el botón "Volver a Jugar" de `FinalCelebrationScene2` no se puede tocar, porque el canvas está dentro de `#painting-phaser-layer` con `pointer-events: none` (a propósito, para que los toques lleguen al SVG). Hoy la celebración solo se cierra con 🏠 Menú. Arreglarlo implica activar `pointer-events` en esa capa solo durante la celebración: requiere aprobación, porque es un área sensible. Los dibujos bitsy y sparks conservan algunas regiones reales muy chicas (30–120 px² en tablet), difíciles de acertar en celular. El `end-screen-2` DOM y `showEndScreen2` (script.js) no se usan.
- **Resuelto en 8C.4B (asset de Pintar):** el tile entregado era un PNG con extensión `.webp` (1254x1254, 916 KB), no era seamless (un crayón cortado en el borde derecho) y era demasiado denso, con círculos que se confundían con la paleta. Se reemplazó por un tile armado con sus propios motivos (ver Painting → Ambientación).
- **Resuelto en 8C.4.0 (Pintar, solo CSS):** el contenido que desbordaba hacia arriba y no se podía alcanzar (ver Painting → Layout). Copia del CSS anterior en `assets-src/code-backup-v1.22.2/styles.css`. Desplegado en v1.23.0.
- **Pendiente (Pintar, detectado en 8C.4.0, no corregido):**
  - El botón ✨ Ayuda (`executeManualHelp`) llama a `executeHint(3)` y enseguida a `resetPaintingHintTimers()` → `clearPaintingHintTimers()` → `clearRegionHighlight()`: el resaltado naranja se borra al instante y solo queda el zoom o centrado. Las pistas automáticas (12, 22 y 35 s) sí resaltan.
  - `highlightRegion()` pone `activeHintRegionId` en `null`: la región resaltada queda en `lastHintRegionId`.
  - `focusRegion()` no centra con precisión: `buddy-region-25` queda a (−24, 82) px del centro con zoom 2, medido en reposo en 768x1024. Lee los rects antes de que termine la `transition` de 0.1 s del transform layer. La región queda visible (`isRegionVisible` da `true`).
  - **Primera entrada a Guía oculta el Original** (`setPaintMode`, `game2.js:296-301`): el comentario dice que lo "muestra", pero llama a `toggleReference()` y el Original ya está visible por defecto, así que lo oculta. Se vuelve a ver con 👁️ Original.
  - **Para tests:** las pistas automáticas (12, 22 y 35 s) siguen corriendo durante las pruebas; la de 35 s llama a `focusRegion()` y mueve el zoom. En mediciones de zoom, llamar antes a `scene.clearPaintingHintTimers()`.
  - La posición de scroll del `main` se conserva entre visitas: al volver a Pintar, puede abrir scrolleado.
  - `pointercancel` usa el mismo handler que `pointerup`, así que un toque cancelado sin drag igual pinta.
- **Validador con falsos negativos:** `validateMazeMissionSolvability()` marca como imposibles exactamente las 5 variantes con bloqueadores (beach-b 🌊 puente, snow-b 🚧, night-a 🚪, magic-a 🚪, magic-b 🚧). Su BFS nunca entra en la celda del bloqueador, así que nunca lo "alcanza" ni lo abre; el juego, en cambio, lo abre desde la celda adyacente (`handleCellClick`). Una simulación de solo lectura por adyacencia confirma que las 5 se pueden completar. `buildMazeAdventure()` usa todas las variantes, no solo `validMazeVariants`, así que en la práctica no hay niveles rotos. Hay que arreglar el validador, no los niveles.
- Tiles del Laberinto: resuelto en v1.21.1 (256x256, ~1 MB en total, ~3 MB de GPU). Observaciones visuales que siguen vigentes: la pared de Noche tiene estrellas amarillas y la roca de Playa una estrellita de mar (⭐ es objetivo en night-b, beach-a y magic-a). En el juego se distinguen bien, pero conviene evitarlo si se regeneran. En Nieve, 🦴 sobre el hielo tiene menos contraste.
- Validación en el browser con la pestaña oculta: Phaser baja a ~3 fps y `destroy(true)` (diferido) puede dejar un canvas viejo unos instantes. Para tests automáticos: detener `game.loop` y avanzar con `game.headlessStep()`, con el `TweenManager.getDelta` parcheado en la página de prueba (en 3.60 los tweens usan reloj real) y yields por `MessageChannel`.
- v1.22.0 salió sin los assets de Memoria (la carpeta quedó vacía por un movimiento de archivos externo); se restauraron y publicaron en v1.22.1.
- Assets de 8C.3: resuelto en v1.22.2 (WebP real). Los 39 PNG legacy de `public/assets/` se borraron en v1.23.0 (~13 MB), después de verificar que ningún archivo los referenciaba y que cada uno tenía una copia idéntica en `assets-src/originals-v1.22/`. `public/` ya no tiene ningún `.png`.
- Memoria: el frente de carta tiene ~5% de margen transparente (el dorso ~1%): al girar se ve un poco más chico. La carta emparejada (alpha 0.7) se distingue poco de una abierta a 34 px.
- La decoración aleatoria del Laberinto (30% de las celdas libres, profundidad -1) queda debajo del rectángulo opaco de su celda (profundidad 0), así que **nunca se ve**. Si se sube su profundidad, puede tapar los caminos.
- `.cat-choice-card .card-decor` (hoy solo el emoji ⭐ de GRIS) tiene `pointer-events: auto`, y el listener de adopción lee `e.target.getAttribute('data-cat')`: un toque justo sobre esos decor adopta con `emoji = null` (**verificado en el browser** con ⭐ de GRIS: el gato queda sin representación). NARANJA, NEGRO y BLANCO ya no lo tienen (sus img usan `pointer-events: none`); GRIS sigue afectada.
- Los stickers `arcoiris` y `flor` están en `stickersConfig`, pero ningún juego llama `unlockSticker` con esos IDs: hoy son imposibles de desbloquear.
- Muchos `console.log` de debug en Pintar.
- CSS legacy posiblemente sin uso (fases 7/8) y abundante estilo inline en `index.html` (Pintar).

### Resuelto en 8C.5

F1 doble centrado · F2 Diferencias en landscape bajo · F3 Memoria no recuperaba tamaño · F3-b Diferencias no recuperaba tamaño · F4 cards de adopción recortadas o desbordadas · F5 Ocean ambiguo (peces y coral en el fondo) · F9 🏠 Menú tapaba el título de Memoria · carrera del salto de intro de Caramelo · Mi Gatito y Laberinto chicos en 844x390 (0.22 / 0.18 → 0.53 / 0.35). F16 (la documentación decía que no había git) se corrigió en este archivo.

### Deuda aceptada (no corregir sin pedido)

- **F18, Laberinto en landscape bajo: ACEPTADO CON DEUDA; no bloquea 8D.**
  - En 844x390 la celda 7x7 mide ≈39.6 px (≈6.6 mm en un iPhone), 6x6 46.2 y 5x5 55.5; en portrait 390 el 7x7 mide 46.1.
  - Con toques imprecisos simulados, parte se ignora (7x7, σ 12 px: 83% aciertos; σ 18 px: 45%). Nunca movió a una celda equivocada.
  - Confirmar con Sofi en el dispositivo.
  - Opción futura de menor riesgo (solo CSS en landscape bajo): título al costado del canvas + menos margen y padding, ≈46.5 px por celda.
  - Observaciones: los íconos del HUD miden ~8 px; la 🐾 de la pista se dibuja sobre el objetivo cuando el próximo paso es el objetivo; 💡 marginal; 🦴 sobre la nieve con poco contraste.
- **Pintar:**
  - F6: la primera entrada a Guía oculta el Original.
  - F7: Ayuda no deja el resaltado.
  - `focusRegion` no centra con precisión.
  - La posición de scroll se conserva entre visitas.
  - `pointercancel` pinta.
  - Detalle en "Pendiente (Pintar)".
- **Voz:**
  - F8: la voz puede seguir después de salir de un juego.
  - A futuro: un `SofiApp.voice` con audio grabado primero y TTS de fallback (inventario en `docs/voice-audit.csv`, sin trackear).
  - F15: mezcla de "quieres" / "querés" en los textos.
- **Laberinto:**
  - F11: los símbolos decorativos de algunos tiles (estrellas en la pared de Noche, estrellita en la roca de Playa) pueden confundirse con objetivos.
  - F12: `walk-4` nunca se ve (el paso dura 250 ms y el cuadro 100 ms).
  - F13: falsos negativos del validador (ver arriba).
  - `preload()` chequea `textures.exists` pero no las cargas en curso: reiniciar la escena antes de que terminen da "Texture key already in use".
  - Los demás saltos de Caramelo (recolección −15 px, llegada −20 px) también usan valores absolutos. Hoy corren con el input bloqueado.
- **Mi Gatito:**
  - F10: transparencia en la adopción.
  - F17: objetos decorativos.
  - Además, lo ya listado arriba.
- **General:**
  - F14: pedidos repetidos de texturas ya cacheadas.
  - Phaser `VisibilityHandler` deja **+1 listener `visibilitychange`** en `document` por cada juego abierto y cerrado (medido 6 en 6 ciclos).
  - Sin probar: landscape angosto (< ~640 px de ancho, ahí el título puede volver a tocar el 🏠) y `orientationchange` real en un dispositivo (solo se emuló el viewport).
