# Contexto del Proyecto: Juegos Sofi

Este documento es la fuente de verdad técnica actualizada y confiable para trabajar en este proyecto (Antigravity/Codex).

## Resumen y Arquitectura Global
- **Propósito:** Minijuegos educativos y entretenidos adaptados a una niña pequeña, con feedback positivo, interacción amigable táctil y sin castigos ni penalizaciones.
- **Arquitectura Híbrida:** 
  - **SPA y Navegación:** Single Page Application en Vanilla HTML, CSS y JavaScript clásico.
  - **Experiencia de Juego:** Minijuegos implementados en **Phaser 3**. Phaser maneja renderizado, interacción y animaciones. Las instancias se destruyen al cambiar de juego (`game.destroy(true)`).
- **Core (`app-core.js`):** Singleton `window.SofiApp` que gestiona navegación unificada (`SofiApp.navigation` y `registerView`), progresos, colecciones y audio.
- **Audio y Feedback:** Uso de Web Audio API (síntesis en tiempo real) y Web Speech API (`speechSynthesis`) unificado en `SofiApp.audio`. Evita descargar archivos.
- **Hosting y Despliegue:** Firebase Hosting (`gaming-eb091`).
- **Mundo Vivo / Progresión:** Acciones exitosas otorgan estrellas/stickers (`localStorage`). Al regresar al Home, el personaje guía reacciona al progreso reciente y genera "discoveries" contextuales.

## Estructura Actual del Proyecto
```text
public/
├── index.html
├── styles.css
├── app-core.js
├── script.js
├── game1.js (Diferencias)
├── game2.js (Pintar)
├── drawings.js (Assets Pintar)
├── game3.js (Laberinto)
├── game4.js (Mi Gatito)
├── game5.js (Memoria)
└── assets/
    └── characters/
        ├── sofi-guide/
        └── caramelo/
```

## Evolución Global (Fases Documentadas)
- **FASE 6A–6D:** Home vivo y continuidad, sorpresas (discoveries), conexiones contextuales y variedad entre sesiones.
- **FASE 7A–7D:** Design system, Home 2.0, identidad visual propia por juego y microinteracciones (polish).
- **FASE 8A.1:** Guía propio.
- **FASE 8A.2:** Integración de Caramelo en Laberinto.
- **FASE 8B — Iconografía propia:**
  - **8B.1:** Cinco iconos principales oficiales integrados en las cards de juegos del Home.
  - **8B.2:** Seis assets compartidos integrados en estrellas, rewards, decoraciones persistentes y Mis Cosas.
  - **8B.2A:** Estrella oficial integrada en los contadores persistentes de Home y Mis Cosas, y en el reward principal (`public/assets/icons/shared/icon-star.png`).
  - **8B.2B:** Corazón, flor y huella oficiales integrados selectivamente en Mis Cosas; el corazón también representa el recuerdo persistente “Mimos” de Mi Gatito.

## Iconografía Oficial
- **Juegos (`public/assets/icons/games/`):** `icon-differences.png`, `icon-painting.png`, `icon-maze.png`, `icon-cat.png`, `icon-memory.png`.
- **Compartidos (`public/assets/icons/shared/`):** `icon-star.png`, `icon-heart.png`, `icon-flower.png`, `icon-paw.png`, `icon-rainbow.png`, `icon-sparkle.png`.
- Los PNG oficiales se reservan para UI persistente, protagonistas y rewards importantes. Los emojis continúan en texto, partículas, feedback efímero y detalles secundarios.
- Las huellas repetitivas del movimiento y del path/hint de Laberinto permanecen como emoji por rendimiento y simplicidad; `icon-paw.png` se limita a usos persistentes y singulares.

## Home Actual y Componentes Visuales
- **Componentes CSS:** `.game-card` (Home), `.drawing-card` / `.selection-card` (Pintar), `.cat-choice-card` (Gatito). **CRÍTICO:** Son componentes distintos. No reutilizar geometría del Home para los selectores internos de los juegos.
- **Home UI:** Despliega game cards, ambientación inmersiva, estado de "Mis Cosas", "session flavor" aleatorio, stars UI.
- **Personaje Guía (`public/assets/characters/sofi-guide/`):** Estados reales: `normal`, `happy`, `surprised`, `thinking`, `celebrate`. Altamente integrado con `SofiApp.world`, discoveries y las recompensas (globos de diálogo / reacciones).

## Juegos y Arquitectura Específica

### 1. Encuentra la Diferencia (`game1.js` - Fase 5)
- **Motor de Aventuras:** Crea sesiones únicas (`buildAdventure()`) desde un `challengePool`, previniendo repetición inmediata (persistencia vía localStorage).
- **Mecánicas Variadas:** Incluye modos `memory`, `pattern` y `findAll`.
- **Lógica Unificada:** Hit-testing afirmativo (`isCorrect`).

### 2. Pintar (`game2.js` y `drawings.js`)
- **Arquitectura Híbrida DOM + Phaser (CRÍTICO):** No romper.
  - El `<svg>` interactivo (DOM, `painting-svg-layer`) es la capa interactiva principal para hit testing hiper-rápido (`pointer-events`).
  - Phaser (`painting-phaser-layer`) funciona como capa invisible que renderiza destellos/feedback por debajo del DOM.
- **Funcionalidad:** Coloreado directo por regiones (DOM `fill`), zoom/pan, deshacer (`undo`), borrador, reset, modo "Original" (referencia), y persistencia en localStorage.

### 3. El Laberinto del Perrito (`game3.js` - Fase 8A.2)
- **Regla Crítica:** EL ASSET SE ADAPTA AL JUEGO. EL JUEGO NO SE ADAPTA AL ASSET. La lógica estricta matemática (BFS, Grid, object/bone/house placement, walkability y validación) está separada del render visual.
- **Caramelo (`public/assets/characters/caramelo/`):** Estados oficiales implementados: `normal`, `happy`, `thinking`, `celebrate`, `walk-1..4`, `found-bone`.
- **Integración Visual:** Helper `setCarameloState` normaliza el scale y baseline de los sprites sin deformarlos. Animaciones de walk contextuales.

### 4. Mi Gatito (`game4.js`)
- **Ecosistema Tamagotchi:** Manejo complejo de zonas, actividades y un ciclo de vida con iniciativas propias.
- **Persistencia Avanzada:** Guarda memorias, preferencias (gustos) y un álbum de recuerdos en localStorage, evolucionando en fases 5 y 6.
- **Bugfix v1.15.1:** `clearCatInitiative()` restablece el estado y cancela su timer al iniciar cuidados, cambiar de zona, abrir el álbum o cerrar la escena.
- **Bugfix v1.17.0:** Se restauraron el cleanup de objetos temporales y el registro de visitas significativas al cambiar de zona, abrir el álbum o cerrar la escena.

### 5. Memoria (`game5.js`)
- **Mecánicas Dinámicas:** Combina `pair matching` clásico, `visual recall` y `sequence recall` orquestados en una progresión/aventura adaptable que incluye un sistema de hints.

## Reglas Responsive Críticas
- El Home en mobile debe permitir **scroll vertical natural**.
- **No bloquear** `overflow-y` globalmente ni crear scrolls internos en contenedores como `menu-grid`.
- Evitar por completo el *horizontal scroll*.
- Resoluciones base a validar ante cualquier cambio: `390x844`, `844x390`, `768x1024`, `1366x768`.

## Reglas de No Regresión
- **Global:** No romper `SofiApp.navigation`, no duplicar `AudioContext`, no dejar timers "stale" (limpiar todo al salir de una vista) y destruir Phaser limpiamente.
- **Home:** Preservar scroll vertical nativo, ciclo de vida del personaje guía, discoveries y el "flavor" aleatorio.
- **Pintar:** Preservar hit testing SVG (no reintroducir Phaser input para vectores densos), preservar zoom/pan y `pointer-events: visiblePainted`.
- **Laberinto:** Preservar BFS solver, grilla matemática y lógica de completitud/bloqueos.
- **Mi Gatito:** Preservar memorias, iniciativas y preferencias (persistencia a largo plazo).
- **Memoria:** Preservar el flujo dinámico de desafíos.

## Workflow Obligatorio para Modificaciones (Agentes)
1. Leer `GEMINI.md` y auditar el archivo real de código.
2. Leer la skill obligatoria si aplica.
3. Ejecutar `node --check` del *baseline* aplicable.
4. Identificar el *lifecycle* de los elementos afectados.
5. **Implementación Incremental:** Utilizar Checkpoints y Gates. (Ej. Cambio de asset visual -> validar -> Agregar animación -> validar -> Modificar lógica de estado). Crucial en Laberinto, Pintar y Home.
6. Validar reglas de No Regresión y Responsive.
7. Validar `node checks` finales de cada `.js`.
8. Lograr 0 errores en browser (SyntaxError, ReferenceError, TypeError, Phaser, 404 assets, timers fantasma, navigation).
9. Ejecutar script de versión y deploy.

## Skills Obligatorias (`.agents/skills/`)
- **`juegos-sofi-versioning`:** Debe ejecutarse SIEMPRE al cerrar una fase o aplicar un bugfix crítico. Se encarga de guiar en el update de `SofiApp.version` y deploy.
- **`juegos-sofi-drawings`:** Documenta el flujo y la preparación técnica para introducir nuevos SVG (dibujos) al archivo `drawings.js`.

## Deuda Técnica / Pendientes
- Migración o limpieza de legacy CSS no utilizado en Fases 7/8.

## Próximos Pasos (Opcionales)
- Añadir nuevos dibujos para Pintar utilizando `juegos-sofi-drawings`.
- Expandir el catálogo creando nuevos minijuegos Phaser enrutados a la arquitectura base.
