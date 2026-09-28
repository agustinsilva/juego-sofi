---
name: juegos-sofi-versioning
description: Guía y flujo de trabajo para actualizar la versión de Juegos Sofi en cada despliegue o cambio importante de fase.
---

# Versioning & Deployment Workflow

Esta skill define cómo debe manejarse la versión de Juegos Sofi cada vez que se realice un nuevo despliegue o se implemente una nueva fase de un juego.

## 1. Dónde se encuentra la versión
La versión global de la aplicación se encuentra en `public/app-core.js` dentro del objeto `SofiApp.version`.

## 2. Cuándo actualizar
- **Despliegues (Deploy a Firebase):** Siempre que vayas a correr `firebase deploy` o sugerir un despliegue, DEBES incrementar la versión.
- **Cambios de Fase:** Cada vez que se complete e implemente una nueva "Fase" (Ej. "Fase 4 de Mi Gatito"), se debe subir la minor version.
- **Bugfixes:** Subir la patch version.

## 3. Convención de Versionado (SemVer Simplificado)
Sigue un esquema `vMAJOR.MINOR.PATCH`:
- **MAJOR:** Cambios masivos a la estructura o framework (ej. migración a otro motor).
- **MINOR:** Nueva fase implementada o minijuego nuevo (ej. `v1.6.0` a `v1.7.0`).
- **PATCH:** Correcciones de errores o mejoras visuales pequeñas (ej. `v1.6.0` a `v1.6.1`).

## 4. Instrucciones para el Agente
Si el usuario pide hacer un despliegue, actualizar versión, o implementar una fase completa:
1. Usa `replace_file_content` en `public/app-core.js` para incrementar `SofiApp.version`.
2. Asegúrate de que el número incrementado se refleje en la UI (el core de la app ya se encarga de renderizar `SofiApp.version` en el menú principal).
3. Infórmale al usuario cuál es el nuevo número de versión.
