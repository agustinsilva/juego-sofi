const fs = require('fs');

const svgString = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path class="paintable" data-req="⭐" d="M10,10 L90,10 L50,90 Z" fill="#ffffff" stroke="#000" />
  <circle class="paintable" data-req="🔵" cx="50" cy="50" r="20" fill="#ffffff" stroke="#000" />
  <text x="50" y="50">⭐</text>
</svg>`;

// We'll use jsdom to simulate browser DOMParser
const { JSDOM } = require("jsdom");
const dom = new JSDOM("");
const DOMParser = dom.window.DOMParser;

function parseSVG(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const viewBox = doc.documentElement.getAttribute('viewBox') || "0 0 800 800";
    
    const paintables = doc.querySelectorAll('.paintable');
    let regions = [];
    
    paintables.forEach((el, i) => {
        const req = el.getAttribute('data-req');
        const regionId = `region-${i}`;
        
        // Isolate this element
        const newSvg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute("viewBox", viewBox);
        newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        
        const defs = doc.querySelector('defs');
        if (defs) newSvg.appendChild(defs.cloneNode(true));
        
        // We need to keep any <g> wrapper if it has transforms? Yes.
        // Actually, easiest way is to clone the whole document and remove others!
        const clonedDoc = parser.parseFromString(svgString, "image/svg+xml");
        clonedDoc.querySelectorAll('text').forEach(t => t.remove());
        
        // Keep ONLY the target element in terms of fill
        clonedDoc.querySelectorAll('*').forEach(node => {
            if (node.tagName === 'svg' || node.tagName === 'g' || node.tagName === 'defs' || node.tagName === 'style') {
                return; // keep structural
            }
            if (node.classList && node.classList.contains('paintable')) {
                // If it's the target, make it white fill and no stroke
                // To identify the target, we can add a temporary ID in the original doc
                node.setAttribute('stroke', 'none');
            } else {
                // Background elements: we remove them so they don't block alpha
                node.remove();
            }
        });
        
        // But how to identify the target?
        // Add a temp ID
    });
}
