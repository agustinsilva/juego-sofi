---
name: juegos-sofi-drawings
description: Guía y flujo de trabajo para añadir nuevos dibujos interactivos para pintar en el proyecto Juegos Sofi. Utilizar cada vez que se agreguen personajes o diseños.
---

# Guía para Añadir Nuevos Dibujos al Juego de Pintar (Juegos Sofi)

Si deseas agregar nuevos dibujos para colorear, sigue este flujo de trabajo comprobado:

### 1. Preparación del SVG (Inkscape)
- **Trazado:** Convierte tu imagen a vectores (Path). Asegúrate de tener las líneas negras bien definidas.
- **Rellenado de Áreas (Cubo de Pintura):** Utiliza la herramienta *Cubo de Pintura* de Inkscape configurada en color **Blanco** (`#ffffff`). Haz clic dentro de todas las áreas que Sofía deba poder pintar. Esto creará formas independientes (`<path>`) para cada espacio en blanco.
- **Guardado:** Guarda el archivo como SVG normal.

### 2. Limpieza y Preparación del Código SVG
Abre el archivo SVG generado en un editor de texto o IDE y realiza las siguientes modificaciones antes de inyectarlo:
- Elimina las etiquetas inútiles que ensucian el código, como `<sodipodi:namedview>` o `<defs>` vacíos.
- Busca todos los elementos `<path>` que tengan relleno blanco (`style="fill:#ffffff"` o `fill="#ffffff"`).
- A esos paths blancos, agrégales: `class="paintable" data-req="any"`. 
  - *Nota:* `class="paintable"` le indica al código que es un área interactiva. `data-req="any"` activa el modo "Dibujo Libre" para que pueda ser pintado con cualquier color, en lugar del modo "Emparejar Símbolos" del Girasol.

### 3. Ajuste de Cámara (viewBox)
Por defecto, Inkscape guarda el SVG con el tamaño total del documento (ej: `viewBox="0 0 156.8 156.8"`). Si tu dibujo es más pequeño que el documento, se verá muy chico en pantalla.
- **Recorte simétrico:** Ajusta el `viewBox` achicando el marco exterior desde el centro para hacerle "zoom" al personaje. 
- *Ejemplo:* Si el `viewBox` original es `0 0 156.8 156.8`, al cambiarlo a `25 25 106.8 106.8` le estarás recortando 25px de todos los bordes, centrando el dibujo perfectamente y haciéndolo un 50% más grande.

### 4. Inserción en `drawings.js`
1. Abre `/public/drawings.js`.
2. Define el string de tu nuevo SVG limpio y ajustado.
3. Agrega un nuevo objeto dentro del diccionario `gameDrawings`:
```javascript
nuevoDibujo: {
    title: "Nombre",
    icon: "🎨", // Emoji representativo
    svg: `<svg viewBox="...">...</svg>`,
    palette: [ // Colores disponibles para este dibujo
        { color: "#ff0000", symbol: "🔴" },
        { color: "#0000ff", symbol: "🔵" },
        // ...
    ]
}
```

### 5. Mecánica de Pintado (`script.js`)
El motor de pintado se basa en el estilo en línea. Cuando la niña toca una zona `.paintable`, el script hace `area.style.fill = currentColor;`. Esto fue una modificación clave, ya que modificar la propiedad `.style.fill` tiene más prioridad que el atributo CSS inline de `fill` que inyecta Inkscape por defecto, garantizando que el color se aplique correctamente.
