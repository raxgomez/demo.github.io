/* =====================================================================
   ASISTENTES DEL SITIO · dúo "Ing. Bot-dinez" 🤖 + "Ing. Glor-IA" ✨
   =====================================================================
   - Flujos deterministas (sin IA de pago): burbujas + chips de opción.
   - Precios y nombres SIEMPRE leídos de data/certificaciones.json (catálogo vivo).
   - Nunca pide datos personales: el cierre es siempre WhatsApp.
   - Reparto de roles: Bot-dinez = técnico (precios, catálogo, cotizador,
     vigencias, proceso) · Glor-IA = promos, FAQ de atención y cierre a WhatsApp.
   - Guion v1 aprobado (guion-asistente.html) + decisiones 2026-11-20:
     horarios L-V 9-18 / Sáb 9-16, examen en línea.
   ===================================================================== */
(function () {
  'use strict';

  /* ================== CONFIGURACIÓN (editable) ================== */
  const PERSONAS = {
    bd: { nombre: 'Ing. Bot-dinez', emoji: '🤖' },
    gl: { nombre: 'Ing. Glor-IA', emoji: '✨' }
  };
  const WHATSAPP_NUMERO = '525611309741'; // mantener sincronizado con script.js
  const DESCUENTO_2 = 5;  // % con 2 certificaciones
  const DESCUENTO_3 = 10; // % con 3 o más
  const HORARIOS = 'Lunes a viernes de 9:00 a 18:00 y sábados de 9:00 a 16:00.';
  const VIGENCIA_VOUCHER = '6 meses';
  const VIGENCIA_CERT = '5 años';

  /* ================== ESTADO ================== */
  let cat = [];            // [{id, nombre, familia, corto, precio(Number|null), costoTxt}]
  let paquete = [];        // certs del cotizador
  let btn = null, panel = null, msgs = null, input = null, abierto = false;
  let quienHabla = null;   // último emisor (para la etiqueta de nombre)
  let activo = null;       // asistente de la sesión: lo define la primera pregunta; luego no cambia

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  /* ================== CATÁLOGO ================== */
  function parseCosto(txt) {
    const m = /\$([\d,]+)/.exec(txt || '');
    return m ? Number(m[1].replace(/,/g, '')) : null;
  }

  function familiaDe(c) {
    const m = c.marca.split(' / ')[0];
    const n = c.nombreExamen;
    if (m === 'Adobe') return 'Adobe';
    if (m === 'Autodesk') return 'Autodesk';
    if (m === 'Unity') return 'Unity';
    if (m === 'Apple') return 'Swift (Apple)';
    if (m === 'Cisco') return 'Cisco';
    if (m === 'Intuit') return 'Intuit';
    if (m === 'Meta') return 'Meta';
    if (m === 'PMI') return 'PMI';
    if (/^IC3/.test(n)) return 'IC3';
    if (/^IT Specialist/.test(n)) return 'IT Specialist';
    if (/Entrepreneurship and Small Business/.test(n)) return 'ESB';
    if (/English for IT/.test(n)) return 'English for IT';
    if (/Professional Communication|Generative AI/.test(n)) return 'Skills For Business';
    if (/Certified Educator/.test(n)) return 'Microsoft Educator';
    if (m === 'Microsoft') return 'Microsoft Office';
    return m;
  }

  function nombreCorto(c) {
    let s = c.nombreExamen
      .replace(/^Microsoft (Word|Excel|PowerPoint|Outlook|Access)( Expert)?\b.*$/i, (mm, app, exp) => app + (exp ? ' Expert' : ''))
      .replace(/^IT Specialist - /, '')
      .replace(/^Cisco Certified Support Technician \(CCST\) /, 'CCST ')
      .replace(/^Unity Certified User: /, 'Unity ')
      .replace(/^App Development with Swift - /, 'Swift ')
      .replace(/^Autodesk Certified User - /, '')
      .replace(/^Adobe Certified Professional - .* Using Adobe /, '')
      .replace(/^Entrepreneurship and Small Business \(ESB\)\s*—?\s*/i, 'ESB ')
      .replace(/^Intuit Design for Delight \(D4D\) Innovator$/i, 'Design for Delight (D4D)')
      .replace(/^Meta Certified Digital Marketing Associate$/i, 'Digital Marketing Associate')
      .replace(/^PMI Project Management Ready.*$/i, 'Project Management Ready')
      .replace(/^Microsoft Certified Educator \(MCE\).*$/i, 'Microsoft Certified Educator');
    if (s.length > 34) s = s.slice(0, 32).trim() + '…';
    return s;
  }

  function cargarCatalogo() {
    return fetch('data/certificaciones.json', { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((data) => {
        const lista = Array.isArray(data) ? data : (data.certificaciones || []);
        cat = lista.map((c) => {
          const opts = (c.temario && c.temario.certificacion && c.temario.certificacion.opciones) || [];
          const costoTxt = opts[0] ? opts[0].costo : 'Consultar';
          return {
            id: c.id,
            nombre: c.nombreExamen,
            familia: familiaDe(c),
            corto: nombreCorto(c),
            precio: parseCosto(costoTxt),
            costoTxt: costoTxt
          };
        });
      });
  }

  const familias = () => [...new Set(cat.map((c) => c.familia))];
  const fmt = (n) => '$' + n.toLocaleString('es-MX');

  /* ================== RENDER ================== */
  function burbuja(html, quien, delay) {
    const b = document.createElement('div');
    b.className = 'asb asb-bot asb-' + quien;
    let prefix = '';
    if (quienHabla !== quien) {
      prefix = '<div class="as-quien">' + PERSONAS[quien].emoji + ' ' + PERSONAS[quien].nombre + '</div>';
      quienHabla = quien;
    }
    b.innerHTML = prefix + '<p>' + html + '</p>';
    const mostrar = () => { msgs.appendChild(b); msgs.scrollTop = msgs.scrollHeight; };
    if (delay) setTimeout(mostrar, delay); else mostrar();
    return delay ? 500 : 0;
  }

  function chips(lista, delay) {
    const wrap = document.createElement('div');
    wrap.className = 'as-chips';
    lista.forEach((ch) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'as-chip';
      b.textContent = ch.label;
      b.addEventListener('click', () => {
        if (ch.eco) {
          const u = document.createElement('div');
          u.className = 'asb asb-user';
          u.innerHTML = '<p>' + ch.eco + '</p>';
          msgs.appendChild(u);
          msgs.scrollTop = msgs.scrollHeight;
        }
        limpiarChips();
        ch.fn();
      });
      wrap.appendChild(b);
    });
    const mostrar = () => { msgs.appendChild(wrap); msgs.scrollTop = msgs.scrollHeight; };
    if (delay) setTimeout(mostrar, delay); else mostrar();
  }

  function limpiarChips() { $$('.as-chips', msgs).forEach((c) => c.remove()); }

  function escribir(html, listaChips, quien, noLock) {
    // indicador de "escribiendo…" y luego burbuja + chips.
    // El saludo NO fija al asistente: lo fija la PRIMERA pregunta del visitante
    // (promoción/atención → Glor-IA · técnico → Bot-dinez) y luego no cambia.
    const s = activo || quien || 'bd';
    if (!noLock) activo = s;
    const t = document.createElement('div');
    t.className = 'as-typing' + (s === 'gl' ? ' as-typing-gl' : '');
    t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
      t.remove();
      burbuja(html, s);
      if (listaChips) chips(listaChips, 250);
    }, 480);
  }

  /* ================== WHATSAPP ================== */
  function abrirWA(mensaje) {
    escribir('¡Perfecto! Te abrí WhatsApp con tu mensaje ya escrito — solo presiona enviar 📲', null, 'gl');
    window.open(waURL(mensaje), '_blank', 'noopener');
  }
  function waURL(mensaje) {
    return 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensaje);
  }

  /* ================== FLUJOS ================== */
  function menuPrincipal(corto, saludoDe) {
    paquete = [];
    if (corto) {
      escribir('¿En qué te ayudo ahora? 🙂', MENU_CHIPS, activo || saludoDe || 'gl', !activo);
    } else {
      // saluda UN solo asistente, elegido al azar; la primera pregunta del visitante
      // decide quién atiende el resto de la conversación
      const s = saludoDe || 'bd';
      const saludo = s === 'bd'
        ? '¡Hola! 👋 Soy el <strong>' + PERSONAS.bd.nombre + '</strong>, asistente técnico de Sagomu: precios, catálogo, cotizador de paquetes y el proceso para certificarte. ¿Por dónde empezamos?'
        : '¡Hola! 💜 Soy la <strong>' + PERSONAS.gl.nombre + '</strong>, de Sagomu. Te ayudo con promos, horarios y todo lo que necesitas para certificarte. ¿Qué te muestro?';
      escribir(saludo, MENU_CHIPS, s, true);
    }
  }
  const MENU_CHIPS = [
    { label: '💵 Ver precios', fn: preciosFamilias, eco: '💵 Ver precios' },
    { label: '🎁 Promo por paquetes', fn: promoIntro, eco: '🎁 Promo por paquetes' },
    { label: '⏳ Vigencias', fn: vigencias, eco: '⏳ Vigencias' },
    { label: '📝 ¿Cómo aplico?', fn: comoAplico, eco: '📝 ¿Cómo aplico?' },
    { label: '💬 Hablar con un asesor', fn: asesor, eco: '💬 Hablar con un asesor' }
  ];

  function preciosFamilias() {
    escribir('¡Claro! ¿Qué familia te interesa?',
      familias().map((f) => ({ label: f, fn: () => preciosFamilia(f), eco: f }))
        .concat([{ label: '🏠 Menú', fn: () => menuPrincipal(true) }]), 'bd');
  }

  function preciosFamilia(f) {
    const exs = cat.filter((c) => c.familia === f);
    if (!exs.length) { menuPrincipal(true); return; }
    if (exs[0].precio === null) {
      escribir('<strong>' + f + '</strong> se cotiza según tu caso 👇 Te llevo con el equipo:', [
        { label: '💬 Cotizar por WhatsApp', fn: () => abrirWA('Hola, vengo del sitio de Sagomu. Me interesa ' + f + '. ¿Me pueden cotizar?'), eco: '💬 Cotizar por WhatsApp' },
        { label: '⬅️ Otra familia', fn: preciosFamilias, eco: '⬅️ Otra familia' }
      ], 'bd');
      return;
    }
    const precios = [...new Set(exs.map((c) => c.costoTxt))];
    const precioTxt = precios.length === 1 ? precios[0] : precios.join(' / ');
    const listaTxt = exs.length <= 6 ? '<br>' + exs.map((c) => '• ' + c.corto).join('<br>') : '';
    escribir('<strong>' + f + '</strong> — ' + (exs.length > 1 ? 'Cada una a ' : '') + '<strong class="as-precio">' + precioTxt + '</strong> (IVA incluido ✔)' + listaTxt + '<br>¿Cuál te interesa?',
      exs.map((c) => ({ label: c.corto, fn: () => ficha(c), eco: c.corto }))
        .concat([{ label: '⬅️ Otra familia', fn: preciosFamilias, eco: '⬅️ Otra familia' }]), 'bd');
  }

  function ficha(c) {
    escribir(
      '📋 <strong>' + c.nombre + '</strong><br>💵 <strong class="as-precio">' + c.costoTxt + '</strong> — IVA incluido<br>⏳ Voucher: ' + VIGENCIA_VOUCHER + ' para agendar · 🎓 Certificado: ' + VIGENCIA_CERT,
      [
        { label: '💬 Lo quiero por WhatsApp', fn: () => abrirWA('Hola, vengo del sitio de Sagomu. Me interesa el examen ' + c.nombre + ' (' + c.costoTxt + '). ¿Me ayudan con el proceso?'), eco: '💬 Lo quiero por WhatsApp' },
        { label: '🎁 ¿Descuento por paquete?', fn: promoIntro, eco: '🎁 ¿Descuento por paquete?' },
        { label: '📋 Otro examen', fn: preciosFamilias, eco: '📋 Otro examen' },
        { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }
      ], 'bd');
  }

  function promoIntro() {
    escribir('¡Simple: juntas, ahorras! 🎁<br><strong>2 certificaciones = ' + DESCUENTO_2 + '%</strong> · <strong>3 o más = ' + DESCUENTO_3 + '%</strong>. Y puedes mezclar programas (Word + Unity, por ejemplo).', [
      { label: '🧮 Armar mi paquete', fn: cotInicio, eco: '🧮 Armar mi paquete' },
      { label: '💵 Ver precios', fn: preciosFamilias, eco: '💵 Ver precios' },
      { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }
    ], 'gl');
  }

  function cotInicio() {
    paquete = [];
    cotPedir();
  }
  function cotPedir() {
    escribir(paquete.length ? '¡Va! Elige tu siguiente certificación:' : '¡Va! Elige tu primera certificación:',
      familias().map((f) => ({ label: f, fn: () => cotFamilia(f), eco: f }))
        .concat([{ label: paquete.length ? '✅ Eso es todo' : '🏠 Menú', fn: paquete.length ? cotTotal : () => menuPrincipal(true), eco: paquete.length ? '✅ Eso es todo' : '🏠 Menú' }]), 'bd');
  }
  function cotFamilia(f) {
    const exs = cat.filter((c) => c.familia === f && c.precio !== null);
    escribir('<strong>' + f + '</strong> — ¿cuál agregas?',
      exs.map((c) => ({ label: c.corto, fn: () => cotAgregar(c), eco: c.corto }))
        .concat([{ label: '⬅️ Otra familia', fn: cotPedir, eco: '⬅️ Otra familia' }]), 'bd');
  }
  function cotAgregar(c) {
    paquete.push(c);
    escribir('<strong>' + c.corto + '</strong> ✔ agregada. ¿Otra?', [
      { label: '➕ Agregar otra', fn: cotPedir, eco: '➕ Agregar otra' },
      { label: '✅ Eso es todo', fn: cotTotal, eco: '✅ Eso es todo' }
    ], 'bd');
  }
  function cotTotal() {
    if (!paquete.length) { menuPrincipal(true); return; }
    const subtotal = paquete.reduce((a, c) => a + (c.precio || 0), 0);
    const pct = paquete.length >= 3 ? DESCUENTO_3 : (paquete.length === 2 ? DESCUENTO_2 : 0);
    const total = subtotal * (1 - pct / 100);
    const ahorro = subtotal - total;
    let html = 'Tu paquete 🎁<br>' + paquete.map((c) => '• ' + c.corto + ' — <strong class="as-precio">' + fmt(c.precio) + '</strong>').join('<br>');
    html += '<br><br>Subtotal: ' + fmt(subtotal);
    html += pct
      ? ' · Descuento (' + paquete.length + ' certs): −' + pct + '%<br><strong>Total: <span class="as-precio">' + fmt(Number(total.toFixed(2))) + ' MXN</span></strong> — IVA incluido · Ahorras ' + fmt(Number(ahorro.toFixed(2)))
      : '<br><em>Con una sola certificación no hay descuento — suma otra y ahorras ' + DESCUENTO_2 + '% 😉</em>';
    const listaWA = paquete.map((c) => c.nombre).join(' + ');
    escribir(html, [
      { label: '💬 Confirmar por WhatsApp', fn: () => abrirWA('Hola, vengo del sitio de Sagomu. Quiero el paquete: ' + listaWA + ' — total con descuento: ' + fmt(Number(total.toFixed(2))) + ' MXN. ¿Lo confirmamos?'), eco: '💬 Confirmar por WhatsApp' },
      { label: '➕ Agregar otra', fn: cotPedir, eco: '➕ Agregar otra' },
      { label: '🔄 Empezar de nuevo', fn: cotInicio, eco: '🔄 Empezar de nuevo' },
      { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }
    ], 'gl');
  }

  function vigencias() {
    escribir('Tus tiempos clave ⏳<br>• Tu voucher sirve para agendar tu examen durante <strong>' + VIGENCIA_VOUCHER + '</strong> desde que lo adquieres.<br>• Tu certificado aprobado es válido por <strong>' + VIGENCIA_CERT + '</strong>.', [
      { label: '📝 ¿Cómo aplico?', fn: comoAplico, eco: '📝 ¿Cómo aplico?' },
      { label: '💵 Ver precios', fn: preciosFamilias, eco: '💵 Ver precios' },
      { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }
    ], 'bd');
  }

  function comoAplico() {
    escribir('El camino es corto:<br><br>1️⃣ Eliges tu certificación<br>2️⃣ Adquieres tu voucher<br>3️⃣ Agendas tu examen (dentro de los ' + VIGENCIA_VOUCHER + ' de tu voucher)<br>4️⃣ Presentas tu examen <strong>en línea</strong> o en la modalidad que acordemos<br>5️⃣ Recibes tu certificado digital, válido ' + VIGENCIA_CERT + ' 🎓', [
      { label: '💵 Ver precios', fn: preciosFamilias, eco: '💵 Ver precios' },
      { label: '🎁 Promo por paquetes', fn: promoIntro, eco: '🎁 Promo por paquetes' },
      { label: '💬 Hablar con un asesor', fn: asesor, eco: '💬 Hablar con un asesor' },
      { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }
    ], 'bd');
  }

  function faqMenu() {
    escribir('¿Cuál es tu duda?', [
      { label: '🕘 Horarios', fn: () => faqResp('horarios'), eco: '🕘 Horarios' },
      { label: '💻 ¿Es en línea?', fn: () => faqResp('enlinea'), eco: '💻 ¿Es en línea?' },
      { label: '🔁 ¿Y si no apruebo?', fn: () => faqResp('noaprobe'), eco: '🔁 ¿Y si no apruebo?' },
      { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }
    ], 'gl');
  }
  function faqResp(k) {
    if (k === 'horarios') escribir('Atendemos <strong>' + HORARIOS + '</strong> 🕘<br>Fuera de esos horarios déjanos tu mensaje por WhatsApp y te respondemos al inicio del siguiente turno.', [{ label: '💬 Escribir por WhatsApp', fn: asesor, eco: '💬 Escribir por WhatsApp' }, { label: '❓ Otras dudas', fn: faqMenu, eco: '❓ Otras dudas' }, { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }], 'gl');
    else if (k === 'enlinea') escribir('¡Sí! Los exámenes se presentan <strong>en línea</strong>, o en la modalidad que acordemos contigo al registrar.<br>Para examen en línea necesitas: computadora con internet estable, cámara y micrófono, y una identificación oficial vigente 🪪', [{ label: '📝 ¿Cómo aplico?', fn: comoAplico, eco: '📝 ¿Cómo aplico?' }, { label: '❓ Otras dudas', fn: faqMenu, eco: '❓ Otras dudas' }, { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }], 'gl');
    else escribir('Si no apruebas, puedes reagendar y presentar de nuevo tras un breve periodo de espera (varía según el programa). Además armamos contigo un <strong>plan de refuerzo</strong> de los temas que más se te dificultaron 💪', [{ label: '💵 Ver precios', fn: preciosFamilias, eco: '💵 Ver precios' }, { label: '❓ Otras dudas', fn: faqMenu, eco: '❓ Otras dudas' }, { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }], 'gl');
  }

  const FUERA = [
    'Jaja, esa se me escapa 😄 Nosotras solo dominamos de certificaciones: precios, promos, vigencias y el proceso. ¿Te ayudo con algo de eso?',
    'Ups, eso está fuera de nuestro menú 😅 De certificaciones sí sabemos un montón — ¿te mostramos precios o promos?',
    'Esa se la dejo a los expertos en comida 🍜. Nosotras somos de certificaciones: ¿qué te muestro?'
  ];
  let fueraIdx = 0;

  // Alias por familia: tokens que la gente escribe en frases completas
  const ALIAS_FAMILIA = {
    'Microsoft Office': ['microsoft office', 'office', 'microsoft', 'mos', 'word', 'excel', 'powerpoint', 'outlook', 'access'],
    'Adobe': ['adobe', 'photoshop', 'illustrator', 'indesign'],
    'Autodesk': ['autodesk', 'autocad', '3ds max', 'fusion 360', 'fusion'],
    'Unity': ['unity'],
    'Swift (Apple)': ['swift', 'apple'],
    'Cisco': ['cisco', 'ccst'],
    'IC3': ['ic3'],
    'IT Specialist': ['it specialist', 'it especialista'],
    'PMI': ['pmi', 'project management'],
    'Intuit': ['intuit'],
    'Meta': ['meta'],
    'ESB': ['esb', 'entrepreneurship'],
    'Skills For Business': ['skills for business', 'skills', 'generative ai', 'professional communication'],
    'English for IT': ['english for it', 'english'],
    'Microsoft Educator': ['educator', 'mce']
  };
  function escapeRE(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* ================== MOTOR DE ENTENDIMIENTO ==================
     Normaliza acentos/espacios, une palabras separadas ("in design" →
     "indesign") y tolera errores de escritura (Levenshtein). */
  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD')
      .replace(/[́̈]/g, '')          // quita acentos pero NO la ñ
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function dist(a, b) { // distancia de Levenshtein
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m || !n) return m + n;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }
  const umbral = (len) => (len <= 5 ? 1 : len <= 8 ? 2 : 3); // typos tolerados por longitud

  // alias de examen: palabras sueltas que apuntan a un examen específico
  const ALIAS_EXAMEN = [
    { re: /Unity Certified User: VR/i, tokens: ['vr', 'vr developer', 'realidad virtual', 'rv'] },
    { re: /Unity Certified User: Artist/i, tokens: ['artist', 'artista'] },
    { re: /Unity Certified User: Programmer/i, tokens: ['programmer', 'programador'] },
    { re: /Cybersecurity/i, tokens: ['ciberseguridad', 'cybersecurity'] },
    { re: /Meta Certified Digital Marketing/i, tokens: ['digital marketing', 'marketing digital'] }
  ];

  function candidatos(tn) {
    const tokens = tn.split(' ').filter(Boolean);
    const bigramas = [];
    for (let i = 0; i < tokens.length - 1; i++) bigramas.push(tokens[i] + tokens[i + 1]);
    const examenes = cat.map((c) => ({ c, key: norm(c.corto), joined: norm(c.corto).replace(/ /g, '') }));
    const famAlias = [];
    for (const [f, list] of Object.entries(ALIAS_FAMILIA)) {
      if (!familias().includes(f)) continue;
      list.forEach((a) => famAlias.push({ f, key: norm(a) }));
    }
    return { tokens, bigramas, examenes, famAlias };
  }

  // mejor coincidencia tolerante a typos entre tokens/bigramas y el catálogo
  function mejorCoincidencia(tokens, bigramas, examenes, famAlias) {
    let mejor = null;
    const considerar = (tipo, obj, key, tok, dExtra) => {
      const d = dist(tok, key) + (dExtra || 0);
      if (!mejor || d < mejor.d || (d === mejor.d && key.length > mejor.key.length)) {
        mejor = { tipo, obj, key, d };
      }
    };
    const pares = [];
    tokens.forEach((tk) => { if (tk.length >= 4) pares.push([tk, false]); });
    bigramas.forEach((bj) => { if (bj.length >= 6) pares.push([bj, true]); });
    for (const [tok, esBigrama] of pares) {
      for (const e of examenes) {
        considerar('examen', e.c, e.key, tok, esBigrama ? 1 : 0);
      }
      for (const fa of famAlias) considerar('familia', fa.f, fa.key, tok, esBigrama ? 1 : 0);
    }
    return mejor;
  }

  // palabras clave de intención tolerantes a typos
  const INTENTS = [
    { palabras: ['informacion', 'info', 'catalogo', 'catalog', 'certificaciones', 'certificados', 'certificacion', 'lista'], fn: 'precios' },
    { palabras: ['precios', 'precio', 'cuesta', 'costo', 'cuanto', 'vale'], fn: 'precios' },
    { palabras: ['promo', 'promocion', 'descuento', 'paquete', 'paquetes', 'barato', 'oferta'], fn: 'promo' },
    { palabras: ['vigencia', 'vigencias', 'vence', 'caduca', 'voucher'], fn: 'vigencias' },
    { palabras: ['proceso', 'pasos', 'aplico', 'inscripcion', 'inscribirme', 'registro', 'certificarme', 'aplicar'], fn: 'aplico' },
    { palabras: ['horario', 'horarios', 'atienden', 'atencion'], fn: 'horarios' },
    { palabras: ['enlinea', 'online', 'remoto', 'ubicacion', 'ubicados', 'oficina', 'oficinas', 'presencial', 'direccion'], fn: 'enlinea' },
    { palabras: ['apruebo', 'aprueba', 'reprobado', 'reintento', 'repetir'], fn: 'noaprobe' },
    { palabras: ['factura', 'facturacion', 'facturan'], fn: 'factura' },
    { palabras: ['asesor', 'humano', 'persona', 'contacto', 'whatsapp', 'hablar'], fn: 'asesor' }
  ];
  function mejorIntent(tn, tokens) {
    for (const it of INTENTS) {
      for (const p of it.palabras) {
        if (tn.includes(' ' + p + ' ') || tn === p) return it.fn;
        const u = umbral(Math.max(p.length, 5));
        if (tokens.some((tk) => dist(tk, p) <= u)) return it.fn;
      }
    }
    return null;
  }
  function irAIntent(fn) {
    if (fn === 'precios') preciosFamilias();
    else if (fn === 'promo') promoIntro();
    else if (fn === 'vigencias') vigencias();
    else if (fn === 'aplico') comoAplico();
    else if (fn === 'horarios') faqResp('horarios');
    else if (fn === 'enlinea') faqResp('enlinea');
    else if (fn === 'noaprobe') faqResp('noaprobe');
    else if (fn === 'factura') escribir('Lo de la facturación te la resuelve el equipo humano en un minuto 🧾', [{ label: '💬 Preguntar por WhatsApp', fn: () => abrirWA('Hola, vengo del sitio de Sagomu. ¿Manejan facturación? Quisiera información.'), eco: '💬 Preguntar por WhatsApp' }, { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }], 'gl');
    else if (fn === 'asesor') asesor();
  }

  function mencionanFamilia(t) {
    for (const [fam, alias] of Object.entries(ALIAS_FAMILIA)) {
      if (!familias().includes(fam)) continue;
      if (alias.some((a) => new RegExp('\\b' + escapeRE(a) + '\\b', 'i').test(t))) return fam;
    }
    return null;
  }
  function asesor() {
    abrirWA('Hola, vengo del sitio de Sagomu y quiero hablar con un asesor.');
  }

  function interpretar(texto) {
    const t = texto.toLowerCase();
    const tn = norm(texto);
    const tnp = ' ' + tn + ' ';
    if (/hola|buenas|hey|qué tal|que tal|saludos/.test(t)) { menuPrincipal(true); return; }
    // 1) examen o familia exactos (palabra completa, o unión "in design" → "indesign")
    const { tokens, bigramas, examenes, famAlias } = candidatos(tn);
    const exExact = examenes.find((e) => tnp.includes(' ' + e.key + ' ') || bigramas.includes(e.joined));
    if (exExact) { ficha(exExact.c); return; }
    const faExact = famAlias.find((fa) => tnp.includes(' ' + fa.key + ' '));
    if (faExact) { preciosFamilia(faExact.f); return; }
    // 2) alias de examen sueltos (vr, ciberseguridad…)
    for (const { re, tokens: tks } of ALIAS_EXAMEN) {
      if (tks.some((tk) => new RegExp('\\b' + tk + '\\b', 'i').test(t))) {
        const c = cat.find((x) => re.test(x.nombre));
        if (c) { ficha(c); return; }
      }
    }
    // 3) intenciones exactas
    if (/promo|descuento|paquete|barato|oferta/.test(t)) { promoIntro(); return; }
    if (/vigencia|vence|caduca|voucher|cuánto dura|cuanto dura/.test(t)) { vigencias(); return; }
    if (/cómo aplico|como aplico|proceso|pasos|registro|inscrib|certificarme/.test(t)) { comoAplico(); return; }
    if (/horario|atienden|abiertos|atención|atencion/.test(t)) { faqResp('horarios'); return; }
    if (/en línea|en linea|online|en casa|remoto|dónde están|dónde se|dónde aplic|dónde present|ubicad|oficina|dirección|direccion|presencial/.test(t)) { faqResp('enlinea'); return; }
    if (/aprueb|reprobr|reintento|reinteg|fallé|falle|no pasé|no pase/.test(t)) { faqResp('noaprobe'); return; }
    if (/factur/.test(t)) { escribir('Lo de la facturación te la resuelve el equipo humano en un minuto 🧾', [{ label: '💬 Preguntar por WhatsApp', fn: () => abrirWA('Hola, vengo del sitio de Sagomu. ¿Manejan facturación? Quisiera información.'), eco: '💬 Preguntar por WhatsApp' }, { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }], 'gl'); return; }
    if (/asesor|humano|persona|hablar|contact|whatsapp|whats/.test(t)) { asesor(); return; }
    if (/faq|pregunta|duda/.test(t)) { faqMenu(); return; }
    if (/informaci|info\b|catalogo|catálogo|certificaci/.test(t)) { preciosFamilias(); return; }
    // 4) tolerante a typos: exámenes, familias e intenciones
    if (cat.length) {
      const mejor = mejorCoincidencia(tokens, bigramas, examenes, famAlias);
      if (mejor) {
        if (mejor.d <= umbral(mejor.key.length)) {
          mejor.tipo === 'examen' ? ficha(mejor.obj) : preciosFamilia(mejor.obj);
          return;
        }
        if (mejor.d <= umbral(mejor.key.length) + 1) {
          const nombre = mejor.tipo === 'examen' ? mejor.obj.corto : mejor.obj;
          escribir('¿Quisiste decir <strong>' + nombre + '</strong>? 🤔', [
            { label: '✔ Sí, ese', fn: () => (mejor.tipo === 'examen' ? ficha(mejor.obj) : preciosFamilia(mejor.obj)), eco: '✔ Sí, ' + nombre },
            { label: '❌ No, ver familias', fn: preciosFamilias, eco: '❌ No, ver familias' }
          ], 'bd');
          return;
        }
      }
      const intent = mejorIntent(tn, tokens);
      if (intent) { irAIntent(intent); return; }
    }
    escribir(FUERA[fueraIdx++ % FUERA.length], [
      { label: '💵 Ver precios', fn: preciosFamilias, eco: '💵 Ver precios' },
      { label: '🎁 Promo por paquetes', fn: promoIntro, eco: '🎁 Promo por paquetes' },
      { label: '🏠 Menú', fn: () => menuPrincipal(true), eco: '🏠 Menú' }
    ], 'gl');
  }

  /* ================== UI (DOM) ================== */
  function construirUI() {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'as-btn';
    btn.setAttribute('aria-label', 'Abrir asistente de Sagomu');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

    panel = document.createElement('div');
    panel.className = 'as-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat con los asistentes de Sagomu');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="as-head">' +
        '<span class="as-avatar" aria-hidden="true">🤖</span>' +
        '<span class="as-head-txt"><strong>Asistentes Sagomu</strong><small>' + PERSONAS.bd.nombre + ' &amp; ' + PERSONAS.gl.nombre + '</small></span>' +
        '<button type="button" class="as-close" aria-label="Cerrar asistente">&times;</button>' +
      '</div>' +
      '<div class="as-msgs" aria-live="polite"></div>' +
      '<form class="as-form">' +
        '<input type="text" class="as-input" placeholder="Escribe tu pregunta…" autocomplete="off" aria-label="Escribe tu pregunta" />' +
        '<button type="submit" class="as-send" aria-label="Enviar">➤</button>' +
      '</form>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    msgs = $('.as-msgs', panel);
    input = $('.as-input', panel);

    btn.addEventListener('click', abrir);
    $('.as-close', panel).addEventListener('click', cerrar);

    $('.as-form', panel).addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = input.value.trim();
      if (!txt) return;
      const u = document.createElement('div');
      u.className = 'asb asb-user';
      u.innerHTML = '<p>' + txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
      msgs.appendChild(u);
      msgs.scrollTop = msgs.scrollHeight;
      input.value = '';
      limpiarChips();
      quienHabla = 'user';
      setTimeout(() => interpretar(txt), 350);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && abierto && !document.querySelector('.modal.is-open')) cerrar();
    });
  }

  function abrir() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-open'));
    abierto = true;
    btn.setAttribute('aria-label', 'Cerrar asistente');
    if (!sessionStorage.getItem('asistente-saludo')) {
      sessionStorage.setItem('asistente-saludo', '1');
      menuPrincipal(false, Math.random() < 0.5 ? 'bd' : 'gl');
    } else {
      menuPrincipal(true);
    }
    // el auto-enfoque solo con puntero fino (mouse): en móvil evita que el
    // teclado suba de inmediato al abrir el chat
    if (window.matchMedia && matchMedia('(pointer: fine)').matches) setTimeout(() => input.focus(), 300);
  }
  function cerrar() {
    panel.classList.remove('is-open');
    abierto = false;
    btn.setAttribute('aria-label', 'Abrir asistente de Sagomu');
    setTimeout(() => { panel.hidden = true; }, 280);
  }

  /* ================== INIT ================== */
  function init() {
    construirUI();
    cargarCatalogo().catch(() => {
      escribir('Ups, no pude cargar el catálogo en este momento 😔', [
        { label: '💬 Hablar con un asesor', fn: asesor, eco: '💬 Hablar con un asesor' }
      ], 'bd');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
