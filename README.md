# Basilico · La Gazzetta Italovalenciana

Web estática (HTML + CSS + JS, sin frameworks) de Basilico Tavernetta (Beniarbeig) y Basilico&Spritz (Benimeli).

## Publicar

Hay que subir solo estos archivos a cualquier hosting estático:

```
index.html
spritz.html
favicon.svg
assets/
```

`data/`, `tools/`, `docs/` y `.playwright-mcp/` son material de trabajo y no se publican. `.playwright-mcp/` contiene las fotos originales y las capturas de la investigación.

## Actualizar el menú de la semana

1. Edita `data/menus.json`: platos, precio, `validFrom` y `validTo` (AAAA-MM-DD).
2. Ejecuta `node tools/build.mjs`.

Si un menú caduca y no se actualiza, la web lo marca automáticamente como *Edición anterior* y remite a Instagram.

## Cambiar la carta

Edita `data/carta-tavernetta.json` o `data/carta-spritz.json` y ejecuta `node tools/build.mjs`.

Etiquetas disponibles por plato:

- `"tags": ["fav"]`: Favorito
- `"tags": ["iv"]`: Italovalenciano

## Horarios

Están en `assets/js/main.js` (constante `HOURS`, para el estado en vivo y la reserva) y en las tablas `.hours` y el JSON-LD de cada HTML.

## Fotos

`node tools/images.mjs <carpeta-origen>` genera los WebP responsive (requiere `sharp`).
