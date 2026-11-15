# cuerodetoro-tienda

Scripts propios de la tienda cuerodetoro.com.ar (Empretienda).

- `compra-sugerida.js`: fuente comentada de la compra sugerida por color ("Combinalo con" en la ficha de producto + "Completá el look" en el carrito). Sugiere solo cinturones y zapatillas Panda, del mismo color o que combinen. Los ajustes están arriba de todo.
- `compra-sugerida.min.js`: versión comprimida que carga la tienda vía jsDelivr.

En Etiquetas HTML (head) de Empretienda va una sola línea:
`<script src="https://cdn.jsdelivr.net/gh/tyson2308/cuerodetoro-tienda@COMMIT/compra-sugerida.min.js" defer></script>`
fijada a un commit (jsDelivr deja `@main` en caché por 7 días). Después de cada cambio: minificar, subir a main y cambiar el commit de la línea en el panel.
