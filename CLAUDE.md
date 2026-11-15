# cuerodetoro-tienda · notas para Claude

Scripts propios de la tienda **cuerodetoro.com.ar** (Empretienda, calzado masculino). Hoy hay uno solo: la compra sugerida por color.

## Qué está en vivo
- `compra-sugerida.js` (fuente comentada, se edita) y `compra-sugerida.min.js` (se genera con `npx terser@5 compra-sugerida.js -c -m -o compra-sugerida.min.js`; no editar a mano).
- Se carga desde Empretienda → `panel.empretienda.com/etiquetas-html` (no figura en el menú del panel) → campo **head** (`textarea[name=t_script_head]`), con una línea:
  `<script src="https://cdn.jsdelivr.net/gh/tyson2308/cuerodetoro-tienda@COMMIT/compra-sugerida.min.js" defer></script>`
  Antes de esa línea está la verificación de dominio de Facebook: no borrarla.
- La línea va fijada a un **commit**, no a `@main` (jsDelivr cachea `@main` hasta 7 días). Después de cada cambio: minificar, commit y push a `main`, y reemplazar el hash en el panel.

## Reglas de negocio actuales (pedidas por el dueño, nov 2026)
- En la ficha ("Combinalo con", 4 tarjetas) y en el carrito ("Completá el look", 3 tarjetas) se sugieren **solo panchas (Pax y Junior) y cinturones**, emparejando por color.
- Las panchas van primero (hasta 2 en la ficha, 1 en el carrito); si sobra lugar se completa con más panchas.
- Las zapatillas Panda (las "MK") están reconocidas como categoría `zapatilla-mk` pero hoy NO se sugieren.
- Las Panchitas (de lona) no entran porque su nombre dice "panchita" (y están sin stock).
- Todo se configura en el bloque AJUSTES al principio del archivo: `CATEGORIAS`, `CRUCES`, `COLORES`, `COLOR_MANUAL`, `COMBINA`, `SOLO_SUGERIR`, `PRIMERO`, `NUNCA`.

## Cómo funciona por dentro (Empretienda)
- Catálogo: `GET /v4/product` con `{filter_page: N, filter_order: 4}` (12 por página), header `X-CSRF-TOKEN: window.csrf_token`. Trae `idProductos`, `p_nombre`, `p_link`, `imagenes[].i_link`, `stock[]` con `valoratributo` (talle/color) y precios.
- Link de cada producto: `product_get_params(producto, estado_mayorista, categorias_flatten, uri).link_producto`. Foto: `window.cdn + imagenes[0].i_link`. Todas son globales de la plantilla.
- El color sale casi siempre del **nombre**; el atributo "Color" está cargado de forma despareja. Los que no lo dicen van en `COLOR_MANUAL` (por `p_link`).
- Agregar al carrito: `POST /v4/cart/add` con FormData `product`, `stock` (idStock), `quantity`, `atributos-N`; después `build_cart(resp.data, true, errores)`.
- Carrito: se envuelve `window.build_cart` para dibujar las sugerencias debajo del subtotal (`.cart-sidenav__content`). Los ítems traen `id` (= idProductos) e `info_atributos`.
- Ficha: el bloque va después de `#add_to_cart-form`; el color elegido se lee de `.product-vip__attribute-item--selected` en el atributo cuyo nombre dice "Color".

## Cuidados
- En Etiquetas HTML, Empretienda rechaza algunos `<` dentro de scripts: en el código usar `\x3c` (el fuente ya lo hace).
- Guardar Etiquetas HTML por código funciona con el setter nativo de `value` + evento `input` + click en "Guardar" (responde "guardados con éxito"). Verificar recargando.
- Probar cambios sin publicar: inyectar el script en la tienda desde la consola del navegador, o cargar el `.min.js` del commit nuevo con un `<script>` creado a mano.
- Manual para el dueño (PDF): explica todo esto en lenguaje simple.
