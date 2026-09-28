const eventEmitter = new Phaser.Events.EventEmitter();

// v1.21.3: bitsy y sparks dejaron de marcar como pintables regiones tapadas por otras (imposibles de
// tocar, impedían completar el dibujo). Los IDs de región son por orden, así que el progreso viejo de
// esos dos dibujos quedaría corrido: se descarta una sola vez.
(function resetShiftedPaintingProgress() {
    const FLAG = 'juegosSofi_paint_regions_v2';
    try {
        if (localStorage.getItem(FLAG)) return;
        ['bitsy', 'sparks'].forEach(id => localStorage.removeItem(`juegos-sofi-paint-${id}`));
        localStorage.setItem(FLAG, '1');
    } catch (e) {
        console.warn('[Painting] progress reset skipped', e);
    }
})();

class PaintingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PaintingScene' });
    }

    create() {
        // Phaser no llama solo a un método "shutdown": se engancha a los eventos de la escena.
        this.isShutDown = false;
        this.events.once('shutdown', this.shutdown, this);
        this.events.once('destroy', this.shutdown, this);

        this.progressKey = `juegos-sofi-paint-${currentDrawingId}`;
        let savedProgress = localStorage.getItem(this.progressKey);
        this.paintedRegions = savedProgress ? JSON.parse(savedProgress) : {};
        this.history = [];
        this.activeColor = null;
        this.drawingData = gameDrawings[currentDrawingId];
        this.paintMode = 'free';
        
        this.zoomState = { scale: 1, panX: 0, panY: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastPan = { x: 0, y: 0 };
        
        this.referenceState = { visible: true, expanded: false };
        this.referenceNode = null;
        
        this.isCompleted = false;
        this.hintStage = 0;
        this.lastHintRegionId = null;
        this.activeHintRegionId = null;
        this.hintTimers = [];
        this.originalRegionStyle = null;
        
        // --- UI y Paleta ---
        this.createPaletteUI();
        
        // --- Eventos de comunicación DOM <-> Phaser ---
        eventEmitter.removeAllListeners('region-painted');
        eventEmitter.on('region-painted', (data) => {
            if (typeof playTone === 'function' && audioCtx) {
                if(audioCtx.state === 'suspended') audioCtx.resume();
                if (data.specialFeedback) {
                    playTone(880, 'triangle', 0.15, audioCtx.currentTime);
                } else {
                    playTone(800, 'sine', 0.1, audioCtx.currentTime);
                }
            }
            
            this.history.push(data);
            this.paintedRegions[data.regionId] = data.newColor;
            this.saveProgress();
            this.updateProgressUI();
            this.checkCompletion();
            
            // Sparkles!
            this.createSparkle(data.x, data.y, data.specialFeedback);
        });
        
        // --- Montar el SVG en el DOM ---
        this.mountSVG();
    }
    
    createSparkle(x, y, special = false) {
        const color = special ? 0xffb6c1 : 0xffd700;
        const numStars = special ? 3 : 1;
        
        for (let i = 0; i < numStars; i++) {
            const offsetX = special ? Phaser.Math.Between(-20, 20) : 0;
            const offsetY = special ? Phaser.Math.Between(-20, 20) : 0;
            
            const star = this.add.star(x + offsetX, y + offsetY, 5, 5, special ? 20 : 15, color).setAlpha(0.8);
            this.tweens.add({
                targets: star,
                scale: special ? 3 : 2,
                alpha: 0,
                angle: 180 + (special ? Phaser.Math.Between(0, 180) : 0),
                duration: special ? 800 : 600,
                onComplete: () => star.destroy()
            });
        }
    }

    createPaletteUI() {
        const paletteContainer = document.getElementById('painting-palette');
        if (paletteContainer) paletteContainer.innerHTML = '';
        
        this.colorButtons = [];
        this.paletteButtonsByColor = new Map();
        
        const BASE_COLORS = ['#ff5252', '#ff9100', '#ffea00', '#4caf50', '#2979ff', '#9c27b0', '#ff4081', '#8d6e63', '#ffffff', '#111111'];

        let rawColors = [];
        if (this.drawingData.palette) {
            rawColors = this.drawingData.palette.map(p => p.color.toLowerCase());
        }
        rawColors = [...rawColors, ...BASE_COLORS];

        // Deduplicate ignoring case
        const finalColors = [];
        const seen = new Set();
        for(let hex of rawColors) {
            let lowerHex = hex.toLowerCase();
            if (!seen.has(lowerHex)) {
                seen.add(lowerHex);
                finalColors.push(hex);
            }
        }
        
        // Re-order white and black to the very end
        const nonWhiteBlack = finalColors.filter(c => c.toLowerCase() !== '#ffffff' && c.toLowerCase() !== '#111111' && c.toLowerCase() !== '#000000');
        const sortedColors = [...nonWhiteBlack, '#ffffff', '#111111'];

        sortedColors.forEach((color, index) => {
            const btn = document.createElement('button');
            btn.style.width = 'clamp(48px, 7vw, 64px)';
            btn.style.height = 'clamp(48px, 7vw, 64px)';
            btn.style.borderRadius = '50%';
            btn.style.backgroundColor = color;
            btn.style.border = '4px solid #ffffff';
            btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
            btn.style.cursor = 'pointer';
            btn.style.flexShrink = '0';
            btn.style.transition = 'transform 0.2s, border 0.2s';
            btn.dataset.defaultBorder = (color.toLowerCase() === '#ffffff') ? '4px solid #dddddd' : '4px solid #ffffff';
            
            // White button visibility
            if (color.toLowerCase() === '#ffffff') {
                btn.style.border = '4px solid #dddddd'; // Better contrast on white background
            }
            
            btn.addEventListener('click', () => this.selectColor(color, btn));
            paletteContainer.appendChild(btn);
            this.colorButtons.push(btn);
            this.paletteButtonsByColor.set(color.toLowerCase(), btn);
        });
        
        // Mode toggle DOM events
        const btnFree = document.getElementById('mode-free');
        const btnGuided = document.getElementById('mode-guided');
        if (btnFree && btnGuided) {
            // Guardados para quitarlos en shutdown(): estos botones no se clonan como los de la toolbar.
            this.modeFreeHandler = () => this.setPaintMode('free');
            this.modeGuidedHandler = () => this.setPaintMode('guided');
            btnFree.addEventListener('click', this.modeFreeHandler);
            btnGuided.addEventListener('click', this.modeGuidedHandler);
        }

        // Toolbar DOM events
        const setupToolBtn = (id, eventType, callback) => {
            const originalBtn = document.getElementById(id);
            if (!originalBtn) return;
            const clone = originalBtn.cloneNode(true);
            originalBtn.parentNode.replaceChild(clone, originalBtn);
            
            // Basic styling
            clone.style.padding = '10px 20px';
            clone.style.borderRadius = '20px';
            clone.style.border = '3px solid #dddddd';
            clone.style.fontSize = '18px';
            clone.style.fontWeight = 'bold';
            clone.style.color = '#333';
            clone.style.cursor = 'pointer';
            clone.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            clone.style.transition = 'transform 0.1s';
            
            clone.addEventListener(eventType, (e) => {
                callback(e);
                if (eventType === 'click' || eventType === 'pointerdown') {
                    clone.style.transform = 'scale(0.9)';
                    setTimeout(() => clone.style.transform = 'scale(1)', 100);
                }
            });
            return clone;
        };
        
        const btnOrig = setupToolBtn('tool-original', 'click', () => this.toggleReference());
        
        setupToolBtn('tool-eraser', 'click', () => {
             this.activeColor = '#ffffff';
             this.colorButtons.forEach(b => {
            b.style.border = b.dataset.defaultBorder || '4px solid #ffffff';
            b.style.transform = 'scale(1)';
        });
             if (typeof playTone === 'function' && audioCtx) {
                 if(audioCtx.state === 'suspended') audioCtx.resume();
                 playTone(400, 'sine', 0.1, audioCtx.currentTime);
             }
        });
        
        setupToolBtn('tool-undo', 'click', () => this.undoAction());
        setupToolBtn('tool-reset', 'click', () => this.resetDrawing());
        
        setupToolBtn('tool-zoom-in', 'click', () => this.changeZoom(1));
        setupToolBtn('tool-zoom-out', 'click', () => this.changeZoom(-1));
        setupToolBtn('tool-zoom-fit', 'click', () => this.resetZoom());
        
        setupToolBtn('tool-help', 'click', () => this.executeManualHelp());
    }

    changeZoom(dir) {
        const step = 0.5;
        let newScale = this.zoomState.scale + (dir * step);
        newScale = Phaser.Math.Clamp(newScale, 1, 3);
        
        if (newScale === 1) {
            this.zoomState.panX = 0;
            this.zoomState.panY = 0;
        } else {
            this.clampPan(newScale);
        }
        this.zoomState.scale = newScale;
        this.applyPaintingTransform();
    }
    
    resetZoom() {
        this.zoomState.scale = 1;
        this.zoomState.panX = 0;
        this.zoomState.panY = 0;
        this.applyPaintingTransform();
    }
    
    clampPan(scale = this.zoomState.scale) {
        if (scale === 1) {
            this.zoomState.panX = 0;
            this.zoomState.panY = 0;
            return;
        }
        const area = document.getElementById('drawing-area');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        
        const maxPanX = (rect.width * scale - rect.width) / 2;
        const maxPanY = (rect.height * scale - rect.height) / 2;
        
        this.zoomState.panX = Phaser.Math.Clamp(this.zoomState.panX, -maxPanX, maxPanX);
        this.zoomState.panY = Phaser.Math.Clamp(this.zoomState.panY, -maxPanY, maxPanY);
    }
    
    applyPaintingTransform() {
        const layer = document.getElementById('painting-transform-layer');
        if (!layer) return;
        layer.style.transform = `translate(${this.zoomState.panX}px, ${this.zoomState.panY}px) scale(${this.zoomState.scale})`;
    }

    // --- Phase 4 Mode Helpers ---
    setPaintMode(mode) {
        this.paintMode = mode;
        const btnFree = document.getElementById('mode-free');
        const btnGuided = document.getElementById('mode-guided');
        if (mode === 'free') {
            if (btnFree) {
                btnFree.setAttribute('aria-pressed', 'true');
                btnFree.style.backgroundColor = '#a2d2ff';
                btnFree.style.border = '3px solid #333';
                btnFree.style.transform = 'scale(1.05)';
            }
            if (btnGuided) {
                btnGuided.setAttribute('aria-pressed', 'false');
                btnGuided.style.backgroundColor = '#ffffff';
                btnGuided.style.border = '3px solid #dddddd';
                btnGuided.style.transform = 'scale(1)';
                btnGuided.style.color = '#555';
            }
            this.clearRecommendedColorHighlight();
        } else if (mode === 'guided') {
            if (btnGuided) {
                btnGuided.setAttribute('aria-pressed', 'true');
                btnGuided.style.backgroundColor = '#a2d2ff';
                btnGuided.style.border = '3px solid #333';
                btnGuided.style.transform = 'scale(1.05)';
                btnGuided.style.color = '#333';
            }
            if (btnFree) {
                btnFree.setAttribute('aria-pressed', 'false');
                btnFree.style.backgroundColor = '#ffffff';
                btnFree.style.border = '3px solid #dddddd';
                btnFree.style.transform = 'scale(1)';
            }
            // Muestra el original la primera vez que se entra a guiado
            if (!this.guidedModeEnteredOnce) {
                this.guidedModeEnteredOnce = true;
                if (!this.referenceState.expanded) {
                    this.toggleReference();
                }
            }
        }
        
        // Ensure hint logic resets to apply the new mode's rules
        this.resetPaintingHintTimers();
    }

    normalizeColor(color) {
        if (!color) return null;
        let c = color.trim().toLowerCase();
        if (c.length === 4) { // Convert #rgb to #rrggbb
            c = '#' + c[1]+c[1] + c[2]+c[2] + c[3]+c[3];
        }
        return c;
    }

    getRecommendedColorForRegion(regionElement) {
        if (!regionElement) return null;
        const req = regionElement.getAttribute('data-req');
        if (!req || req === 'any') return null;
        if (!this.drawingData.palette) return null;
        
        const mapping = this.drawingData.palette.find(p => p.symbol === req);
        if (!mapping) return null;
        
        return this.normalizeColor(mapping.color);
    }

    isRecommendedColor(regionElement, selectedColor) {
        const recommended = this.getRecommendedColorForRegion(regionElement);
        if (!recommended) return false;
        
        return this.normalizeColor(selectedColor) === recommended;
    }

    highlightRecommendedColor(color) {
        this.clearRecommendedColorHighlight();
        if (!color) return;
        
        const btn = this.paletteButtonsByColor.get(color);
        if (btn) {
            btn.classList.add('recommended-pulse');
            btn.style.boxShadow = '0 0 15px 5px rgba(255, 215, 0, 0.8)';
            this.activeRecommendedBtn = btn;
            
            // Add keyframes if not exists
            if (!document.getElementById('pulse-anim')) {
                const style = document.createElement('style');
                style.id = 'pulse-anim';
                style.innerHTML = `
                    @keyframes palettePulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.15); }
                        100% { transform: scale(1); }
                    }
                    .recommended-pulse {
                        animation: palettePulse 1s infinite;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    clearRecommendedColorHighlight() {
        if (this.activeRecommendedBtn) {
            this.activeRecommendedBtn.classList.remove('recommended-pulse');
            this.activeRecommendedBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
            this.activeRecommendedBtn = null;
        }
    }

    // --- Phase 3 Helpers ---
    isRegionPainted(regionId) {
        return this.paintedRegions[regionId] && this.paintedRegions[regionId] !== '#ffffff';
    }

    getUnpaintedRegionIds() {
        if (!this.regionElements) return [];
        return Object.keys(this.regionElements).filter(id => !this.isRegionPainted(id));
    }

    getPaintingProgress() {
        if (!this.regionElements) return { painted: 0, total: 0, remaining: 0, percent: 0 };
        const total = Object.keys(this.regionElements).length;
        const painted = total - this.getUnpaintedRegionIds().length;
        const percent = total > 0 ? (painted / total) : 0;
        return { painted, total, remaining: total - painted, percent };
    }

    updateProgressUI() {
        const progress = this.getPaintingProgress();
        const barSpan = document.getElementById('painting-progress-bar');
        if (barSpan && progress.total > 0) {
            const numBlocks = 10;
            const filled = Math.round(progress.percent * numBlocks);
            const empty = numBlocks - filled;
            
            let barStr = '';
            for (let i = 0; i < filled; i++) barStr += '█';
            for (let i = 0; i < empty; i++) barStr += '░';
            
            if (progress.remaining <= 3 && progress.remaining > 0) {
                barStr += ` ✨ Faltan ${progress.remaining}`;
            }
            
            barSpan.innerText = barStr;
        }
    }

    resetPaintingHintTimers() {
        this.clearPaintingHintTimers();
        if (this.isCompleted) return;
        if (this.referenceState && this.referenceState.expanded) return;

        this.hintTimers.push(
            this.time.delayedCall(12000, () => this.executeHint(1), [], this)
        );
        this.hintTimers.push(
            this.time.delayedCall(22000, () => this.executeHint(2), [], this)
        );
        this.hintTimers.push(
            this.time.delayedCall(35000, () => this.executeHint(3), [], this)
        );
    }

    clearPaintingHintTimers() {
        this.hintTimers.forEach(t => t.destroy());
        this.hintTimers = [];
        this.clearRegionHighlight();
    }
    
    executeManualHelp() {
        if (this.isCompleted) return;
        this.clearPaintingHintTimers();
        this.executeHint(3);
        this.resetPaintingHintTimers();
    }

    executeHint(stage) {
        if (this.isCompleted) return;
        if (this.referenceState && this.referenceState.expanded) return;
        
        const unpainted = this.getUnpaintedRegionIds();
        if (unpainted.length === 0) return;
        
        this.hintStage = stage;
        this.chooseHintRegion(unpainted);
        if (!this.activeHintRegionId) return;
        
        const el = this.regionElements[this.activeHintRegionId];
        if (!el) return;
        
        if (stage === 1) {
            this.highlightRegion(el);
        } else if (stage === 2) {
            this.highlightRegion(el);
            this.showHintSparkle(el);
        } else if (stage === 3) {
            this.focusRegion(el);
            this.highlightRegion(el);
            
            if (this.paintMode === 'guided') {
                const recommendedColor = this.getRecommendedColorForRegion(el);
                if (recommendedColor) {
                    this.highlightRecommendedColor(recommendedColor);
                }
            }
        }
    }

    chooseHintRegion(unpainted) {
        if (unpainted.length === 0) {
            this.activeHintRegionId = null;
            return;
        }
        
        let candidates = unpainted;
        if (unpainted.length > 1 && this.lastHintRegionId) {
            candidates = unpainted.filter(id => id !== this.lastHintRegionId);
        }
        
        candidates.sort((a, b) => {
            const elA = this.regionElements[a];
            const elB = this.regionElements[b];
            if (!elA || !elB) return 0;
            const bbA = elA.getBoundingClientRect();
            const bbB = elB.getBoundingClientRect();
            return (bbB.width * bbB.height) - (bbA.width * bbA.height);
        });
        
        this.activeHintRegionId = candidates[0];
        this.lastHintRegionId = this.activeHintRegionId;
    }

    highlightRegion(el) {
        this.clearRegionHighlight();
        
        this.originalRegionStyle = {
            element: el,
            stroke: el.style.stroke,
            strokeWidth: el.style.strokeWidth,
            transition: el.style.transition
        };
        
        el.style.transition = 'stroke 0.2s, stroke-width 0.2s';
        el.style.stroke = '#ff9800';
        el.style.strokeWidth = '4px';
        
        this.hintPulseTween = this.tweens.add({
            targets: { val: 0 },
            val: 1,
            duration: 600,
            yoyo: true,
            repeat: 1,
            onUpdate: (tween) => {
                if (this.originalRegionStyle && this.originalRegionStyle.element === el) {
                    el.style.strokeWidth = `${4 + (4 * tween.getValue())}px`;
                }
            },
            onComplete: () => {
                this.clearRegionHighlight();
            }
        });
    }
    
    clearRegionHighlight() {
        this.clearRecommendedColorHighlight();
        
        if (this.hintPulseTween) {
            this.hintPulseTween.stop();
            this.hintPulseTween = null;
        }
        if (this.originalRegionStyle) {
            const { element, stroke, strokeWidth, transition } = this.originalRegionStyle;
            if (element) {
                element.style.stroke = stroke || '';
                element.style.strokeWidth = strokeWidth || '';
                element.style.transition = transition || '';
            }
            this.originalRegionStyle = null;
        }
        this.activeHintRegionId = null;
    }

    clientToPhaser(clientX, clientY) {
        const phaserLayer = document.getElementById('painting-phaser-layer');
        if (!phaserLayer) return { x: 0, y: 0 };
        const rect = phaserLayer.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    showHintSparkle(el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const phaserPos = this.clientToPhaser(centerX, centerY);
        
        const sparkle = this.add.star(phaserPos.x, phaserPos.y, 5, 10, 20, 0xffd700);
        this.tweens.add({
            targets: sparkle,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            angle: 180,
            duration: 1000,
            onComplete: () => sparkle.destroy()
        });
    }

    isSmallRegion(rect) {
        const viewport = document.getElementById('drawing-area');
        if (!viewport) return false;
        const vRect = viewport.getBoundingClientRect();
        return (rect.width < vRect.width * 0.1) || (rect.height < vRect.height * 0.1);
    }
    
    isRegionVisible(rect) {
        const viewport = document.getElementById('drawing-area');
        if (!viewport) return true;
        const vRect = viewport.getBoundingClientRect();
        
        const overlapX = Math.max(0, Math.min(rect.right, vRect.right) - Math.max(rect.left, vRect.left));
        const overlapY = Math.max(0, Math.min(rect.bottom, vRect.bottom) - Math.max(rect.top, vRect.top));
        const overlapArea = overlapX * overlapY;
        const rectArea = rect.width * rect.height;
        
        return (overlapArea / rectArea) > 0.6;
    }

    focusRegion(el) {
        const viewport = document.getElementById('drawing-area');
        const svgLayer = document.getElementById('painting-transform-layer');
        if (!viewport || !svgLayer) return;
        
        const vRect = viewport.getBoundingClientRect();
        
        const thumbContainer = document.getElementById('reference-thumbnail');
        if (thumbContainer && thumbContainer.style.display !== 'none') {
            thumbContainer.style.opacity = '0';
            setTimeout(() => { if (thumbContainer) thumbContainer.style.opacity = '1'; }, 2000);
        }
        
        let targetScale = this.zoomState.scale;
        const rectBeforeZoom = el.getBoundingClientRect();
        if (this.isSmallRegion(rectBeforeZoom)) {
            targetScale = Phaser.Math.Clamp(this.zoomState.scale + 0.5, 2, 3);
        }
        
        this.zoomState.scale = targetScale;
        
        const elRect = el.getBoundingClientRect();
        const elCenterX = elRect.left + elRect.width / 2;
        const elCenterY = elRect.top + elRect.height / 2;
        const vCenterX = vRect.left + vRect.width / 2;
        const vCenterY = vRect.top + vRect.height / 2;
        
        const dx = vCenterX - elCenterX;
        const dy = vCenterY - elCenterY;
        
        this.zoomState.panX += dx / this.zoomState.scale;
        this.zoomState.panY += dy / this.zoomState.scale;
        
        this.clampPan();
        this.applyPaintingTransform();
    }

    createReferenceElement() {
        if (this.drawingData.originalImage) {
            const refImg = document.createElement('img');
            refImg.id = 'reference-svg-node';
            refImg.src = this.drawingData.originalImage;
            return refImg;
        } else {
            const parser = new DOMParser();
            const refDoc = parser.parseFromString(this.drawingData.svg, 'image/svg+xml');
            const refSvg = refDoc.documentElement;
            refSvg.id = 'reference-svg-node';
            refSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            
            refSvg.querySelectorAll('text').forEach(t => t.remove());
            refSvg.querySelectorAll('.paintable').forEach(el => {
                const req = el.getAttribute('data-req');
                const colorObj = this.drawingData.palette.find(p => p.symbol === req);
                if (colorObj) {
                    el.style.fill = colorObj.color;
                } else {
                    el.style.fill = '#ffffff';
                }
                el.style.pointerEvents = 'none';
                el.style.stroke = 'none';
            });
            return refSvg;
        }
    }

    toggleReference() {
        this.referenceState.visible = !this.referenceState.visible;
        const container = document.getElementById('painting-reference-container');
        if (container) {
            container.style.display = this.referenceState.visible ? 'block' : 'none';
        }
        
        const btn = document.getElementById('tool-original');
        if (btn) {
            btn.style.backgroundColor = this.referenceState.visible ? '#84b6f4' : '#e6e6fa';
        }
    }
    
    expandReference() {
        this.referenceState.expanded = true;
        this.clearPaintingHintTimers();
        const expandedContainer = document.getElementById('reference-expanded');
        const backdrop = document.getElementById('reference-backdrop');
        const thumbContainer = document.getElementById('reference-thumbnail');
        const expandedContent = document.getElementById('reference-expanded-content');
        
        if (expandedContainer && backdrop && expandedContent && this.referenceNode) {
            expandedContent.innerHTML = '';
            expandedContent.appendChild(this.referenceNode);
            
            expandedContainer.style.display = 'flex';
            backdrop.style.display = 'block';
            thumbContainer.style.display = 'none';
        }
    }
    
    collapseReference() {
        this.referenceState.expanded = false;
        this.resetPaintingHintTimers();
        const expandedContainer = document.getElementById('reference-expanded');
        const backdrop = document.getElementById('reference-backdrop');
        const thumbContainer = document.getElementById('reference-thumbnail');
        
        if (expandedContainer && backdrop && thumbContainer && this.referenceNode) {
            thumbContainer.innerHTML = '';
            thumbContainer.appendChild(this.referenceNode);
            
            expandedContainer.style.display = 'none';
            backdrop.style.display = 'none';
            thumbContainer.style.display = 'flex';
        }
    }

    selectColor(hexColor, btnElement) {
        this.activeColor = hexColor;
        
        this.colorButtons.forEach(b => {
                 b.style.border = b.dataset.defaultBorder || '4px solid #ffffff';
                 b.style.transform = 'scale(1)';
             });
        
        if (btnElement) {
            btnElement.style.border = '4px solid #333333';
            btnElement.style.transform = 'scale(1.1)';
        }
        console.log('[Painting] selected color', hexColor);
        
        if (typeof playTone === 'function' && audioCtx) {
            if(audioCtx.state === 'suspended') audioCtx.resume();
            playTone(400, 'sine', 0.1, audioCtx.currentTime);
        }
    }

    mountSVG() {
        const svgLayer = document.getElementById('painting-transform-layer') || document.getElementById('painting-svg-layer');
        if (!svgLayer) return;
        
        // Limpiamos cualquier rastro anterior
        svgLayer.innerHTML = '';
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.drawingData.svg, 'image/svg+xml');
        const svgElement = doc.documentElement;
        
        // Configurar SVG para escalar bonito dentro del layer
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.style.pointerEvents = 'auto'; // Modificado por petición: auto en lugar de none
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Eliminar textos (iconos) del DOM
        svgElement.querySelectorAll('text').forEach(t => t.remove());
        
        // Configurar cada paintable y aplicar estado guardado
        let regionIndex = 0;
        this.totalRegions = 0;
        
        // Guardar referencia limpia de las regiones por ID para contar y verificar finalización
        this.regionElements = {};
        
        const paintablesList = svgElement.querySelectorAll('.paintable');
        console.log('[Painting] paintables found', paintablesList.length);
        let paintablesWithoutReq = 0;
        
        paintablesList.forEach(el => {
            const req = el.getAttribute('data-req');
            if (!req) {
                paintablesWithoutReq++;
                // Ya NO ignorar silenciosamente, si no tiene req, puede pintarse con cualquiera pero debe recibir ID
                console.warn('[Painting] region without data-req', el);
            }
            
            const regionId = `${currentDrawingId}-region-${regionIndex++}`;
            el.setAttribute('data-region-id', regionId);
            el.style.pointerEvents = 'all'; // Modificado por petición: all en lugar de visiblePainted
            el.style.cursor = 'pointer';
            
            // Transición suave al pintar
            el.style.transition = 'fill 0.2s';
            
            // Color inicial (blanco o guardado)
            let color = '#ffffff';
            if (this.paintedRegions[regionId]) {
                color = this.paintedRegions[regionId];
            } else {
                this.paintedRegions[regionId] = '#ffffff'; // Iniciar en blanco
            }
            el.style.fill = color;
            // el.setAttribute('stroke', 'none'); // Eliminado por petición para no borrar contornos
            
            this.regionElements[regionId] = el;
            this.totalRegions++;
        });
        
        console.log('[Painting] registered regions', this.totalRegions);
        if (paintablesWithoutReq > 0) {
            console.log('[Painting] count of paintables without data-req:', paintablesWithoutReq);
        }
        
        svgLayer.appendChild(svgElement);
        
        // Crear y montar referencia interactiva (Fase 2)
        this.referenceNode = this.createReferenceElement();
        if (this.referenceNode) {
            this.referenceNode.style.width = '100%';
            this.referenceNode.style.height = '100%';
            this.referenceNode.style.maxWidth = '100%';
            this.referenceNode.style.maxHeight = '100%';
            this.referenceNode.style.objectFit = 'contain';
            this.referenceNode.style.pointerEvents = 'none';
            
            const thumbContainer = document.getElementById('reference-thumbnail');
            const closeBtn = document.getElementById('reference-close');
            const backdrop = document.getElementById('reference-backdrop');
            
            if (thumbContainer && closeBtn && backdrop) {
                this.referenceState.visible = true;
                this.referenceState.expanded = false;
                
                const container = document.getElementById('painting-reference-container');
                if (container) container.style.display = 'block';
                
                const btnOrig = document.getElementById('tool-original');
                if (btnOrig) btnOrig.style.backgroundColor = '#84b6f4';
                
                thumbContainer.style.display = 'flex';
                thumbContainer.innerHTML = '';
                thumbContainer.appendChild(this.referenceNode);
                
                this.thumbClickHandler = (e) => {
                    e.stopPropagation();
                    this.expandReference();
                };
                this.thumbPointerDownHandler = (e) => e.stopPropagation();
                
                this.closeClickHandler = (e) => {
                    e.stopPropagation();
                    this.collapseReference();
                };
                
                thumbContainer.addEventListener('click', this.thumbClickHandler);
                thumbContainer.addEventListener('pointerdown', this.thumbPointerDownHandler);
                
                closeBtn.addEventListener('click', this.closeClickHandler);
                backdrop.addEventListener('click', this.closeClickHandler);
            }
        }
        
        // Bind event handler (Usamos delegation en el transform layer)
        const transformLayer = svgLayer;
        
        this.pointerDownHandler = (e) => {
            this.isDragging = false;
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.lastPan = { x: this.zoomState.panX, y: this.zoomState.panY };
            transformLayer.setPointerCapture(e.pointerId);
        };
        
        this.pointerMoveHandler = (e) => {
            if (e.buttons !== 1) return;
            
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            
            if (!this.isDragging && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
                this.isDragging = true;
            }
            
            if (this.isDragging && this.zoomState.scale > 1) {
                this.zoomState.panX = this.lastPan.x + dx;
                this.zoomState.panY = this.lastPan.y + dy;
                this.clampPan();
                this.applyPaintingTransform();
            }
        };
        
        this.pointerUpHandler = (e) => {
            transformLayer.releasePointerCapture(e.pointerId);
            if (!this.isDragging) {
                this.handleSVGTap(e);
            }
            this.isDragging = false;
        };
        
        transformLayer.addEventListener('pointerdown', this.pointerDownHandler);
        transformLayer.addEventListener('pointermove', this.pointerMoveHandler);
        transformLayer.addEventListener('pointerup', this.pointerUpHandler);
        transformLayer.addEventListener('pointercancel', this.pointerUpHandler);
        
        this.resetZoom();
        this.updateProgressUI();
        this.resetPaintingHintTimers();
    }
    
    handleSVGTap(e) {
        console.log('[Painting] SVG tap', {
            activeColor: this.activeColor,
            target: e.target,
            class: e.target?.getAttribute?.('class')
        });

        if (!this.activeColor) return;
        
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        const region = targetElement ? targetElement.closest('.paintable') : null;
        console.log('[Painting] resolved region', region);

        if (!region) return;
        
        const regionId = region.getAttribute('data-region-id');
        if (!regionId) return;
        
        const oldColor = this.paintedRegions[regionId] || '#ffffff';
        const newColor = this.activeColor;
        
        if (oldColor === newColor) return;
        
        // Cambiar color en el DOM
        region.style.fill = newColor;
        
        this.clearRegionHighlight();
        this.resetPaintingHintTimers();
        
        let specialFeedback = false;
        if (this.paintMode === 'guided' && newColor.toLowerCase() !== '#ffffff') {
            if (this.isRecommendedColor(region, newColor)) {
                specialFeedback = true;
            }
        }
        
        // Mapear coordenadas del click (DOM) a Phaser para los Sparkles
        const phaserLayer = document.getElementById('painting-phaser-layer');
        if (!phaserLayer) return;
        
        const rect = phaserLayer.getBoundingClientRect();
        
        // Calcula la escala de Phaser (el canvas scale ratio vs rect real)
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        
        const phaserX = (e.clientX - rect.left) * scaleX;
        const phaserY = (e.clientY - rect.top) * scaleY;
        
        // Emitir a Phaser
        eventEmitter.emit('region-painted', {
            regionId,
            oldColor,
            newColor,
            x: phaserX,
            y: phaserY,
            specialFeedback
        });
    }

    undoAction() {
        if (this.history.length === 0) return;
        const lastAction = this.history.pop();
        
        const el = this.regionElements[lastAction.regionId];
        if (el) {
            el.style.fill = lastAction.oldColor;
            this.paintedRegions[lastAction.regionId] = lastAction.oldColor;
            this.saveProgress();
            this.updateProgressUI();
            this.resetPaintingHintTimers();
            
            if (typeof playTone === 'function' && audioCtx) {
                if(audioCtx.state === 'suspended') audioCtx.resume();
                playTone(300, 'sine', 0.1, audioCtx.currentTime);
            }
        }
    }

    resetDrawing() {
        this.history = [];
        Object.keys(this.regionElements).forEach(regionId => {
            const el = this.regionElements[regionId];
            el.style.fill = '#ffffff';
            this.paintedRegions[regionId] = '#ffffff';
        });
        this.saveProgress();
        this.updateProgressUI();
        this.resetPaintingHintTimers();
    }


    
    saveProgress() {
        localStorage.setItem(this.progressKey, JSON.stringify(this.paintedRegions));
    }

    checkCompletion() {
        if (this.isCompleted) return;
        const unpainted = this.getUnpaintedRegionIds();
        
        if (this.totalRegions > 0 && unpainted.length === 0) {
            this.isCompleted = true;
            this.clearPaintingHintTimers();
            const refContainer = document.getElementById('painting-reference-container');
            if (refContainer) refContainer.style.display = 'none';
            if (SofiApp.progress) {
                if (SofiApp.progress.recordEvent(`painting-${currentDrawingId}`)) {
                    // First time we complete any drawing, unlock artist sticker
                    SofiApp.progress.unlockSticker('artista');
                }
            }
            this.time.delayedCall(500, () => {
                this.scene.start('FinalCelebrationScene2');
            });
        }
    }
    
    // Limpieza de listeners DOM y timers de esta escena. Idempotente: se llama desde los eventos
    // 'shutdown'/'destroy' de Phaser y desde destroyGame2Phaser(). Sin esto, las escenas viejas
    // seguían recibiendo los toques del transform layer (y pintaban con su color viejo).
    shutdown() {
        if (this.isShutDown) return;
        this.isShutDown = true;

        this.clearPaintingHintTimers();

        const transformLayer = document.getElementById('painting-transform-layer') || document.getElementById('painting-svg-layer');
        if (transformLayer && this.pointerDownHandler) {
            transformLayer.removeEventListener('pointerdown', this.pointerDownHandler);
            transformLayer.removeEventListener('pointermove', this.pointerMoveHandler);
            transformLayer.removeEventListener('pointerup', this.pointerUpHandler);
            transformLayer.removeEventListener('pointercancel', this.pointerUpHandler);
        }

        const thumbContainer = document.getElementById('reference-thumbnail');
        const closeBtn = document.getElementById('reference-close');
        const backdrop = document.getElementById('reference-backdrop');
        if (thumbContainer && this.thumbClickHandler) {
            thumbContainer.removeEventListener('click', this.thumbClickHandler);
            thumbContainer.removeEventListener('pointerdown', this.thumbPointerDownHandler);
        }
        if (closeBtn && this.closeClickHandler) {
            closeBtn.removeEventListener('click', this.closeClickHandler);
            if (backdrop) backdrop.removeEventListener('click', this.closeClickHandler);
        }

        const btnFree = document.getElementById('mode-free');
        const btnGuided = document.getElementById('mode-guided');
        if (btnFree && this.modeFreeHandler) btnFree.removeEventListener('click', this.modeFreeHandler);
        if (btnGuided && this.modeGuidedHandler) btnGuided.removeEventListener('click', this.modeGuidedHandler);

        const refContainer = document.getElementById('painting-reference-container');
        if (refContainer) refContainer.style.display = 'none';
        this.referenceNode = null;

        eventEmitter.removeAllListeners('region-painted');
    }
}

class FinalCelebrationScene2 extends Phaser.Scene {
    constructor() {
        super({ key: 'FinalCelebrationScene2' });
    }
    
    create() {
        // En esta escena ocultamos el SVG porque vamos a celebrar (el transform layer, z-index 2,
        // tapaba el canvas de la celebración y su botón "Volver a Jugar").
        const svgLayer = document.getElementById('painting-transform-layer') || document.getElementById('painting-svg-layer');
        if (svgLayer) {
            svgLayer.style.display = 'none'; // Lo ocultamos temporalmente
        }
        
        this.cameras.main.setBackgroundColor('#ffeb3b');
        
        const emojis = ['🎈', '🎉', '🌟', '🏆', '🎊'];
        for (let i = 0; i < 30; i++) {
            let x = Phaser.Math.Between(0, 800);
            let y = Phaser.Math.Between(-100, 1000);
            let emoji = Phaser.Math.RND.pick(emojis);
            
            let p = this.add.text(x, y, emoji, { fontSize: '40px' }).setOrigin(0.5);
            
            this.tweens.add({
                targets: p,
                y: p.y - Phaser.Math.Between(300, 600),
                x: p.x + Phaser.Math.Between(-100, 100),
                alpha: 0,
                angle: Phaser.Math.Between(-180, 180),
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Cubic.easeOut'
            });
        }
        
        if (typeof playTone === 'function' && audioCtx) {
            if(audioCtx.state === 'suspended') audioCtx.resume();
            playTone(500, 'sine', 0.1, audioCtx.currentTime);
            setTimeout(() => playTone(600, 'sine', 0.1, audioCtx.currentTime + 0.1), 100);
            setTimeout(() => playTone(800, 'sine', 0.2, audioCtx.currentTime + 0.2), 200);
        }
        
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance('¡Qué hermoso dibujo Sofía! ¡Felicidades!');
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
        }
        
        // Botón volver
        const btn = this.add.rectangle(400, 500, 250, 80, 0xff9800, 1).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(4, 0xffffff);
        this.add.text(400, 500, 'Volver a Jugar', { fontSize: '28px', fontFamily: 'Nunito, sans-serif', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            this.tweens.add({
                targets: btn,
                scale: 0.9,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    if (svgLayer) svgLayer.style.display = 'flex'; // Restaurar
                    window.showMenu();
                }
            });
        });
    }
}

// Interfaz global para montar y desmontar el juego
let game2Instance = null;

// Destruye la instancia de Pintar. El shutdown de PaintingScene se llama de forma SÍNCRONA antes del
// destroy (que Phaser difiere al próximo frame): así la limpieza de la escena vieja no puede correr
// después de que se cree la nueva (y borrar su listener 'region-painted' u ocultar su referencia).
window.destroyGame2Phaser = function() {
    if (!game2Instance) return;
    const scene = game2Instance.scene.getScene('PaintingScene');
    if (scene) scene.shutdown();
    game2Instance.destroy(true);
    game2Instance = null;

    const svgLayer = document.getElementById('painting-transform-layer') || document.getElementById('painting-svg-layer');
    if (svgLayer) {
        svgLayer.innerHTML = '';
        svgLayer.style.display = 'flex'; // por si se salió durante la celebración
        svgLayer.style.transform = 'translate(0px, 0px) scale(1)';
    }
};

window.initGame2Phaser = function(drawingId) {
    window.destroyGame2Phaser();

    // Asegurarse de limpiar el DOM SVG si existía
    const svgLayer = document.getElementById('painting-transform-layer') || document.getElementById('painting-svg-layer');
    if (svgLayer) {
        svgLayer.innerHTML = '';
        svgLayer.style.display = 'flex'; // Reset display just in case
        svgLayer.style.transform = 'translate(0px, 0px) scale(1)'; // Reset transform
    }
    
    window.currentDrawingId = drawingId;
    
    const config = {
        type: Phaser.AUTO,
        parent: 'painting-phaser-layer',
        width: 800,
        height: 800, // Ajustado a 1:1 para coincidir con el aspect-ratio del contenedor
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        backgroundColor: '#ffffff',
        transparent: true, // Importante para que el body no tape si z-index cambia
        scene: [PaintingScene, FinalCelebrationScene2]
    };
    
    game2Instance = new Phaser.Game(config);
};

// Modificar showMenu para limpiar el juego Phaser si está activo
const origShowMenu2 = window.showMenu;
window.showMenu = function() {
    if (origShowMenu2) origShowMenu2();
    window.destroyGame2Phaser();
};
