# 🎨 Carpeta para Nuevos Dibujos

¡Hola! Has creado esta carpeta para guardar imágenes que quieras convertir en nuevos niveles para el Juego 2 (Pintar).

## ¿Qué formato deben respetar las imágenes?

Para que pueda transformarlas fácilmente en dibujos interactivos para Sofía, sigue estas reglas:

### 1. Formato Ideal: Archivos Vectoriales (.SVG)
- **Por qué:** El juego usa tecnología SVG para detectar las distintas partes del dibujo (pétalos, hojas) y rellenarlas de color sin pixelarse.
- **Cómo debe estar hecho:**
  - Debe ser un dibujo de **"Línea" (Line Art)**, es decir, contornos negros con fondo blanco o transparente.
  - Las distintas partes a colorear deben estar compuestas por formas cerradas (`<path>`, `<circle>`, `<rect>`, etc.).
  - No uses imágenes rasterizadas incrustadas dentro del SVG.

### 2. Formato Aceptable: Imágenes de Alta Calidad (.PNG o .JPG)
- Si no sabes cómo hacer un SVG, puedes dejar imágenes normales (.png o .jpg).
- **Cómo deben ser:**
  - Dibujos estilo "libro para colorear".
  - Líneas negras bien gruesas y definidas.
  - Zonas completamente cerradas (sin huecos en los bordes) para que el color no se "escape".
  - Fondo puramente blanco.
- **¿Qué haré yo con ellas?:** Me encargaré de vectorizarlas, limpiar el código, agregarles las clases `.paintable` y los símbolos de los colores (⭐, 🔵, 🔺) para inyectarlas directamente en el código de tu juego.

## ¿Cómo es el proceso?
Simplemente suelta tus archivos aquí adentro y dime en el chat: *"Dejé un dibujo nuevo llamado casita.png en la carpeta, conviértelo para el juego de pintar"*. Yo me ocuparé de todo el proceso técnico.
