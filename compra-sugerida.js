/* =====================================================================
   CUERO DE TORO · Compra sugerida por color (ficha de producto + carrito)
   - En la ficha: "Combinalo con" debajo del botón de compra.
   - En el carrito: "Completá el look".
   Empareja por COLOR y cruza categorías: si mirás o llevás calzado, te
   sugiere el cinturón y la billetera del mismo color (o que combinen).
   Lee el catálogo en vivo (/v4/product), así que los productos nuevos
   entran solos. Ojo: no usar el signo menor en el código; usar \x3c.
   ---------------------------------------------------------------------
   LO ÚNICO QUE HACE FALTA TOCAR ESTÁ EN "AJUSTES".
   ===================================================================== */
(function () {
  if (window.__csColor) return;
  window.__csColor = true;

  /* ============================ AJUSTES ============================ */
  var AJUSTES = {
    sugerenciasFicha: 4,
    sugerenciasCarrito: 3,
    envioGratisDesde: 0,          // 0 = sin barra de envío gratis en el carrito
    tituloFicha: 'Combinalo con',
    tituloCarrito: 'Completá el look'
  };

  /* QUÉ ES CADA PRODUCTO, según palabras del nombre (sin tildes, minúscula).
     Va en orden: la primera que coincide gana. */
  var CATEGORIAS = [
    ['mate',      ['mate']],
    ['combo',     ['promo', '2 x1', '2x1', ' + ']],
    ['cinturon',  ['cinturon', 'cinto']],
    ['billetera', ['billetera']],
    ['pancha',    ['pancha']],
    ['bota',      ['bota', 'borcego', 'polo', 'lucca']],
    ['zapato',    ['zapato']],
    ['zapatilla-mk', ['panda']],   // las "MK" son las Panda
    ['zapatilla', ['zapatilla', 'lupy', 'loopy', 'osaka']]
  ];

  /* QUÉ SUGERIR según lo que se mira o se lleva, en orden de prioridad. */
  var CRUCES = {
    'zapatilla-mk': ['cinturon'],
    zapatilla: ['cinturon', 'zapatilla-mk'],
    zapato:    ['cinturon', 'zapatilla-mk'],
    bota:      ['cinturon', 'zapatilla-mk'],
    pancha:    ['cinturon', 'zapatilla-mk'],
    cinturon:  ['zapatilla-mk'],
    billetera: ['cinturon', 'zapatilla-mk'],
    mate:      ['cinturon', 'zapatilla-mk']
  };

  /* COLORES: color base y las palabras que lo nombran (por raíz:
     'negr' encuentra negro, negra, negras). Se buscan en el nombre
     y en la variante "Color". */
  var COLORES = {
    negro:  ['negr', 'black', 'obscur', 'oscur', 'charol'],
    marron: ['marron', 'chocolate', 'suela', 'roble', 'habano', 'tostad', 'mostaza', 'cognac', 'camel', 'tabaco'],
    beige:  ['arena', 'beige', 'crudo', 'hueso', 'nude'],
    blanco: ['blanc', 'white'],
    azul:   ['azul', 'marino', 'jean'],
    verde:  ['verde'],
    gris:   ['gris']
  };

  /* Productos cuyo color no sale del nombre (la dirección es el final del link). */
  var COLOR_MANUAL = {
    'zapato-roca': ['marron'],
    'zapato-oliva': ['negro'],
    'zapato-oliva-suela': ['marron'],
    'zapato-habano-negro': ['negro'],
    'bota-lucca': ['negro']
  };

  /* QUÉ COMBINA CON QUÉ, además del mismo color (que siempre va primero).
     Regla clásica: cinturón y billetera del mismo tono que el calzado;
     con zapatillas blancas o azules va bien cualquiera de los dos. */
  var COMBINA = {
    negro:  ['blanco', 'gris'],
    marron: ['blanco', 'beige'],
    beige:  ['marron'],
    blanco: ['negro', 'marron'],
    azul:   ['marron', 'negro'],
    verde:  ['marron'],
    gris:   ['negro']
  };

  /* SOLO se sugieren estas categorías (pedido de Nahuel 15/11:
     cinturones y zapatillas MK = Panda). Vacío = se puede sugerir cualquiera. */
  var SOLO_SUGERIR = ['pancha', 'cinturon', 'zapatilla-mk'];

  /* VAN PRIMERO: estas categorías se muestran arriba de todo (hasta
     "maximo" en la ficha y "maximoCarrito" en el carrito), elegidas por
     color; después siguen las demás. Pedido de Nahuel 15/11: panchas. */
  var PRIMERO = { categorias: ['pancha'], maximo: 2, maximoCarrito: 1 };

  /* Nunca sugerir estos (dirección del producto). */
  var NUNCA = [];
  /* ========================== FIN AJUSTES ========================== */

  var PUNTO = { negro: '#111', marron: '#5a3420', beige: '#d6c3a0', blanco: '#fff', azul: '#24406e', verde: '#5b6b3a', gris: '#8a8a8a' };

  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  }
  function slugDe(url) {
    var p = (url || '').split('?')[0].split('#')[0].replace(/\/+$/, '').split('/');
    return p[p.length - 1];
  }
  function categoriaDe(nombre) {
    var n = ' ' + norm(nombre) + ' ';
    for (var i = 0; CATEGORIAS.length > i; i++) {
      if (CATEGORIAS[i][1].some(function (w) { return n.indexOf(w.charAt(0) === ' ' ? w : ' ' + w) >= 0; })) return CATEGORIAS[i][0];
    }
    return 'otro';
  }
  function coloresDe(texto) {
    var n = ' ' + norm(texto).replace(/[^a-z ]/g, ' ') + ' ', out = [];
    Object.keys(COLORES).forEach(function (c) {
      if (COLORES[c].some(function (w) { return n.indexOf(' ' + w) >= 0; })) out.push(c);
    });
    return out;
  }
  function plata(n) {
    return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function esc(s) {
    return String(s).replace(/[&\x3c>"]/g, function (c) { return { '&': '&amp;', '\x3c': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function ajax(opts) {
    opts.headers = { 'X-CSRF-TOKEN': window.csrf_token };
    opts.dataType = 'JSON';
    return window.jQuery.ajax(opts);
  }

  /* ----------------------------- ESTILOS ----------------------------- */
  var CSS =
    '.cs-box{margin:24px 0 6px}' +
    '.cs-tit{font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:15px;margin:0 0 4px}' +
    '.cs-sub{font-size:13px;opacity:.7;margin:0 0 12px}' +
    '.cs-list{display:grid;gap:10px}' +
    '.cs-card{display:grid;grid-template-columns:76px 1fr;gap:12px;align-items:center;padding:8px;border:1px solid #e3e3e3;border-radius:8px;background:#fff}' +
    '.cs-card img{width:76px;height:76px;object-fit:cover;border-radius:6px;display:block}' +
    '.cs-why{font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 2px;display:flex;align-items:center;gap:6px;opacity:.8}' +
    '.cs-dot{width:11px;height:11px;border-radius:50%;border:1px solid rgba(0,0,0,.3);flex:none}' +
    '.cs-name{font-size:14px;font-weight:600;margin:0;line-height:1.25;text-transform:uppercase}' +
    '.cs-name a{color:inherit;text-decoration:none}' +
    '.cs-price{font-size:14px;margin:2px 0 6px}' +
    '.cs-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}' +
    '.cs-sel{font:inherit;font-size:13px;padding:5px 6px;border:1px solid #bbb;border-radius:6px;background:#fff;color:#111}' +
    '.cs-btn{font:inherit;font-size:13px;font-weight:600;padding:7px 14px;border:0;border-radius:20px;background:#111;color:#fff;cursor:pointer}' +
    '.cs-btn[disabled]{opacity:.6;cursor:default}' +
    '.cs-err{font-size:12px;color:#a32}' +
    '.cs-bar{margin:4px 0 14px}.cs-bar p{font-size:13px;margin:0 0 6px}' +
    '.cs-track{height:6px;border-radius:3px;background:#eee;overflow:hidden}' +
    '.cs-fill{height:100%;background:#e8661b;transition:width .4s}' +
    '.cs-listo .cs-fill{background:#2e8b57}' +
    '.cs-cart{display:block!important;list-style:none;padding:6px 0 4px}' +
    '.cs-cart .cs-card{grid-template-columns:56px 1fr}.cs-cart .cs-card img{width:56px;height:56px}';

  function ponerEstilos() {
    if (document.getElementById('cs-css')) return;
    var s = document.createElement('style');
    s.id = 'cs-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ------------------------- CATÁLOGO EN VIVO ------------------------- */
  /* Usa la misma consulta que la página de Productos de Empretienda: trae
     nombre, link, foto, precio y stock con variantes, de 12 en 12. */
  var catalogoPromesa = null;
  function catalogo() {
    if (catalogoPromesa) return catalogoPromesa;
    var todos = [];
    function pagina(n) {
      return ajax({ url: '/v4/product', method: 'GET', data: { filter_page: n, filter_order: 4 } }).then(function (r) {
        var d = (r && r.data) || [];
        todos = todos.concat(d);
        return (d.length >= 12 && 30 > n) ? pagina(n + 1) : todos;
      });
    }
    catalogoPromesa = pagina(0).then(function (lista) {
      return lista.map(armarProducto).filter(function (p) { return p && p.variantes.length; });
    }, function () { catalogoPromesa = null; return []; });
    return catalogoPromesa;
  }

  function armarProducto(x) {
    try {
      var pp = window.product_get_params(x, window.estado_mayorista, window.categorias_flatten, window.uri);
      var slug = x.p_link, nombre = x.p_nombre;
      var colores = coloresDe(nombre);
      var variantes = (x.stock || []).filter(function (s) { return s.s_ilimitado || s.s_cantidad > 0; }).map(function (s) {
        var precio = (s.s_oferta && s.s_precio_oferta) ? s.s_precio_oferta : s.s_precio;
        var at = (s.valoratributo || []);
        var colorTxt = at.filter(function (v) { return /color/i.test(v.at_nombre); }).map(function (v) { return v.valor.vat_valor; }).join(' ');
        return {
          idStock: s.idStock, precio: precio,
          etiqueta: at.map(function (v) { return v.valor.vat_valor; }).join(' / '),
          atributos: at.map(function (v) { return v.valor.vat_valor; }),
          colores: coloresDe(colorTxt)
        };
      });
      variantes.forEach(function (v) { v.colores.forEach(function (c) { if (colores.indexOf(c) === -1) colores.push(c); }); });
      if (COLOR_MANUAL[slug]) colores = COLOR_MANUAL[slug];
      return {
        id: x.idProductos, slug: slug, nombre: nombre, url: pp.link_producto,
        img: x.imagenes && x.imagenes[0] ? window.cdn + x.imagenes[0].i_link : '',
        cat: categoriaDe(nombre), colores: colores, variantes: variantes
      };
    } catch (e) { return null; }
  }

  /* --------------------------- QUÉ SUGERIR --------------------------- */
  /* base: lo que se mira o se lleva [{cat, colores}]. */
  function sugerir(base, todos, excluir, cuantas, tope) {
    var cats = {}, cols = {}, combina = {}, cruce = [];
    base.forEach(function (b) {
      cats[b.cat] = 1;
      b.colores.forEach(function (c) { cols[c] = 1; (COMBINA[c] || []).forEach(function (x) { combina[x] = 1; }); });
      (CRUCES[b.cat] || []).forEach(function (c) { if (cruce.indexOf(c) === -1) cruce.push(c); });
    });
    var hayColor = Object.keys(cols).length > 0;
    var lista = todos.filter(function (p) {
      return !excluir[p.id] && p.cat !== 'combo' && NUNCA.indexOf(p.slug) === -1 &&
        (!SOLO_SUGERIR.length || SOLO_SUGERIR.indexOf(p.cat) >= 0);
    }).map(function (p) {
      var ci = cruce.indexOf(p.cat);
      var mismo = p.colores.filter(function (c) { return cols[c]; })[0];
      var comb = p.colores.filter(function (c) { return combina[c]; })[0];
      var c = { p: p, puntos: 0, color: mismo || comb || null };
      if (ci >= 0) c.puntos = 300 - ci * 30;
      else if (cats[p.cat]) c.puntos = 60;
      else c.puntos = 40;
      if (mismo) { c.puntos += 100; c.motivo = ci >= 0 ? 'A juego, mismo color' : (cats[p.cat] ? 'Otro modelo, mismo color' : 'Mismo color'); }
      else if (comb) { c.puntos += 60; c.motivo = 'Combina en color'; }
      else if (hayColor && p.colores.length) { c.puntos -= 200; c.motivo = 'También te puede gustar'; }
      else c.motivo = ci >= 0 ? 'Va con tu elección' : 'También te puede gustar';
      /* Primero la variante del color elegido (ej. billetera negra). */
      var v = p.variantes;
      if (c.color) {
        var buenas = v.filter(function (x) { return x.colores.indexOf(c.color) >= 0; });
        if (buenas.length) v = buenas.concat(v.filter(function (x) { return buenas.indexOf(x) === -1; }));
      }
      c.variantes = v;
      return c;
    });
    lista.sort(function (a, b) { return b.puntos - a.puntos; });
    /* Sin repetir categoría cruzada dos veces seguidas si hay alternativa. */
    var out = [], usadas = {};
    lista.forEach(function (c) { if (tope > out.length && PRIMERO.categorias.indexOf(c.p.cat) >= 0) out.push(c); });
    lista.forEach(function (c) { if (cuantas > out.length && out.indexOf(c) === -1 && PRIMERO.categorias.indexOf(c.p.cat) === -1 && !usadas[c.p.cat + c.color]) { usadas[c.p.cat + c.color] = 1; out.push(c); } });
    lista.forEach(function (c) { if (cuantas > out.length && out.indexOf(c) === -1) out.push(c); });
    return out;
  }

  /* ----------------------------- TARJETAS ----------------------------- */
  function tarjeta(c) {
    var v = c.variantes, precios = v.map(function (x) { return x.precio; });
    var min = Math.min.apply(null, precios), igual = precios.every(function (x) { return x === min; });
    var sel = '';
    if (v.length > 1 || v[0].etiqueta) {
      sel = '\x3cselect class="cs-sel" aria-label="Elegí talle o medida">' + v.map(function (x) {
        return '\x3coption value="' + x.idStock + '">' + esc(x.etiqueta || 'Única') + '\x3c/option>';
      }).join('') + '\x3c/select>';
    }
    var punto = c.color ? '\x3ci class="cs-dot" style="background:' + PUNTO[c.color] + '">\x3c/i>' : '';
    return '\x3cdiv class="cs-card" data-id="' + c.p.id + '">' +
      '\x3ca href="' + esc(c.p.url) + '">\x3cimg src="' + esc(c.p.img) + '" alt="' + esc(c.p.nombre) + '" loading="lazy">\x3c/a>' +
      '\x3cdiv>\x3cp class="cs-why">' + punto + esc(c.motivo) + '\x3c/p>' +
      '\x3cp class="cs-name">\x3ca href="' + esc(c.p.url) + '">' + esc(c.p.nombre) + '\x3c/a>\x3c/p>' +
      '\x3cp class="cs-price">' + (igual ? '' : 'desde ') + plata(min) + '\x3c/p>' +
      '\x3cdiv class="cs-row">' + sel + '\x3cbutton type="button" class="cs-btn">Agregar\x3c/button>\x3cspan class="cs-msg">\x3c/span>\x3c/div>' +
      '\x3c/div>\x3c/div>';
  }

  function caja(id, titulo, sub, lista) {
    var mapa = {};
    lista.forEach(function (c) { mapa[c.p.id] = c; });
    var el = document.createElement('div');
    el.id = id;
    el.className = 'cs-box';
    el.innerHTML = '\x3cp class="cs-tit">' + esc(titulo) + '\x3c/p>' + (sub ? '\x3cp class="cs-sub">' + sub + '\x3c/p>' : '') +
      '\x3cdiv class="cs-list">' + lista.map(tarjeta).join('') + '\x3c/div>';
    el.querySelectorAll('.cs-card').forEach(function (card) {
      var c = mapa[card.getAttribute('data-id')];
      var btn = card.querySelector('.cs-btn'), sel = card.querySelector('.cs-sel'), msg = card.querySelector('.cs-msg');
      btn.addEventListener('click', function () {
        var idStock = sel ? sel.value : c.variantes[0].idStock;
        var v = c.variantes.filter(function (x) { return String(x.idStock) === String(idStock); })[0];
        var fd = new FormData();
        fd.append('product', c.p.id);
        fd.append('stock', idStock);
        fd.append('quantity', '1');
        v.atributos.forEach(function (a, i) { fd.append('atributos-' + i, a); });
        btn.disabled = true; btn.textContent = 'Agregando…'; msg.className = 'cs-msg'; msg.textContent = '';
        ajax({ url: '/v4/cart/add', method: 'POST', data: fd, contentType: false, processData: false }).done(function (r) {
          window.build_cart(r.data, true, (r.message && r.message.description) || []);
          btn.textContent = 'Agregado ✓';
          if (window.facebook_pixel_tracking && typeof window.fbq === 'function') {
            try { window.fbq('track', 'AddToCart', { content_ids: [String(c.p.id)], content_name: c.p.nombre, content_type: 'product', value: v.precio, currency: 'ARS' }); } catch (e) {}
          }
        }).fail(function () {
          btn.disabled = false; btn.textContent = 'Agregar';
          msg.className = 'cs-msg cs-err'; msg.textContent = 'No se pudo agregar, probá de nuevo.';
        });
      });
    });
    return el;
  }

  /* -------------------------- FICHA DE PRODUCTO -------------------------- */
  /* Color elegido en la ficha, si el producto tiene variante de color. */
  function colorElegido() {
    var t = [];
    document.querySelectorAll('.product-vip__attribute').forEach(function (a) {
      var n = a.querySelector('.product-vip__attribute-name');
      var s = a.querySelector('.product-vip__attribute-item--selected');
      if (n && s && /color/i.test(n.textContent)) t.push(s.getAttribute('data-value') || s.textContent);
    });
    return coloresDe(t.join(' '));
  }

  var vuelta = 0;
  function ficharProducto() {
    var form = document.getElementById('add_to_cart-form');
    var idp = form && form.querySelector('input[name=product]');
    if (!idp) return;
    var mia = ++vuelta;
    catalogo().then(function (todos) {
      if (mia !== vuelta) return;
      var yo = todos.filter(function (p) { return String(p.id) === idp.value; })[0];
      var t = document.querySelector('.product-vip__title');
      var nombre = yo ? yo.nombre : (t ? t.textContent : '');
      var elegido = colorElegido();
      var base = { cat: yo ? yo.cat : categoriaDe(nombre), colores: elegido.length ? elegido : (yo ? yo.colores : coloresDe(nombre)) };
      var excluir = {}; excluir[idp.value] = 1;
      var lista = sugerir([base], todos, excluir, AJUSTES.sugerenciasFicha, PRIMERO.maximo);
      var viejo = document.getElementById('cs-ficha');
      if (viejo) viejo.remove();
      if (!lista.length) return;
      form.parentNode.insertBefore(caja('cs-ficha', AJUSTES.tituloFicha, 'Elegidos para que vayan a juego con este.', lista), form.nextSibling);
    });
  }

  /* Si cambian el color en la ficha, se rearman las sugerencias. */
  function escucharColor() {
    var ultimo = colorElegido().join();
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.product-vip__attribute-item')) return;
      setTimeout(function () {
        var ahora = colorElegido().join();
        if (ahora !== ultimo) { ultimo = ahora; ficharProducto(); }
      }, 150);
    });
  }

  /* ------------------------------ CARRITO ------------------------------ */
  var ultimo = null;
  function dibujarCarrito(data) {
    ultimo = data;
    var ul = document.querySelector('.cart-sidenav__content');
    if (!ul || !data || !data.productos) return;
    var viejo = ul.querySelector('.cs-cart');
    if (viejo) viejo.remove();
    var items = Object.keys(data.productos).map(function (k) { return data.productos[k]; });
    if (!items.length) return;

    var li = document.createElement('li');
    li.className = 'cart-sidenav__item cs-cart';
    if (AJUSTES.envioGratisDesde) {
      var total = 0;
      items.forEach(function (it) { total += it.precio_unitario * it.cantidad; });
      if (data.cupon && data.cupon.id) total -= Number(data.cupon.monto_descuento) || 0;
      var falta = AJUSTES.envioGratisDesde - total;
      li.innerHTML = '\x3cdiv class="cs-bar' + (falta > 0 ? '' : ' cs-listo') + '">\x3cp>' + (falta > 0
        ? 'Te faltan \x3cb>' + plata(falta) + '\x3c/b> para el \x3cb>envío gratis\x3c/b>.'
        : '¡Listo! Tu pedido tiene \x3cb>envío gratis\x3c/b>.') + '\x3c/p>\x3cdiv class="cs-track">\x3cdiv class="cs-fill" style="width:' +
        Math.max(4, Math.min(100, total / AJUSTES.envioGratisDesde * 100)) + '%">\x3c/div>\x3c/div>\x3c/div>';
    }
    var detalle = [].filter.call(ul.children, function (x) { return /Subtotal/.test(x.textContent); })[0];
    if (detalle) ul.insertBefore(li, detalle.nextSibling); else ul.appendChild(li);

    catalogo().then(function (todos) {
      if (ultimo !== data) return;
      var base = [], excluir = {};
      items.forEach(function (it) {
        excluir[it.id] = 1;
        var p = todos.filter(function (x) { return String(x.id) === String(it.id); })[0];
        /* Color de la variante elegida (ej. "Color: Negro"), si tiene. */
        var at = it.info_atributos || {}, txt = '';
        Object.keys(at).forEach(function (k) { if (/color/i.test(at[k].at_nombre)) txt += ' ' + at[k].vat_valor; });
        var cols = coloresDe(txt);
        var b = { cat: p ? p.cat : categoriaDe(it.nombre), colores: cols.length ? cols : (p ? p.colores : coloresDe(it.nombre)) };
        /* Un combo (bota + cinto) cuenta como bota del mismo color. */
        if (b.cat === 'combo') { excluir.__cinto = 1; b.cat = 'bota'; }
        base.push(b);
      });
      /* Si ya lleva un cinturón, no sugerir otro; igual con billetera. */
      var yaLleva = {};
      base.forEach(function (b) { yaLleva[b.cat] = 1; });
      if (excluir.__cinto) yaLleva.cinturon = 1;
      var lista = sugerir(base, todos.filter(function (p) {
        return !((p.cat === 'cinturon' || p.cat === 'billetera') && yaLleva[p.cat]);
      }), excluir, AJUSTES.sugerenciasCarrito, PRIMERO.maximoCarrito);
      if (lista.length) li.appendChild(caja('cs-carrito', AJUSTES.tituloCarrito, '', lista));
      else if (!li.children.length) li.remove();
    });
  }

  function engancharCarrito() {
    if (typeof window.build_cart !== 'function' || window.build_cart.__cs) return false;
    var original = window.build_cart;
    var envuelta = function (data) {
      var r = original.apply(this, arguments);
      try { dibujarCarrito(data); } catch (e) {}
      return r;
    };
    envuelta.__cs = true;
    window.build_cart = envuelta;
    ajax({ url: '/v4/cart', method: 'GET', cache: false }).done(function (r) { try { dibujarCarrito(r.data); } catch (e) {} });
    return true;
  }

  /* ------------------------------ ARRANQUE ------------------------------ */
  function arrancar() {
    if (!window.jQuery || !window.product_get_params) return setTimeout(arrancar, 300);
    ponerEstilos();
    try { ficharProducto(); escucharColor(); } catch (e) {}
    var n = 0;
    (function esperar() { if (engancharCarrito() || ++n > 40) return; setTimeout(esperar, 250); })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
