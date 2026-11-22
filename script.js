/* =====================================================================
   SAGOMU · script.js
   Vanilla JS · sin dependencias externas
   ===================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =================================================================
     CONFIG · WhatsApp Business
     ================================================================= */
  // Número en formato internacional, SIN "+", espacios ni guiones (ej. Colombia: 573001234567)
  const WHATSAPP_NUMERO = '525611309741'; // WhatsApp Business · México (+52 56 1130 9741)

  function numeroWhatsAppValido() {
    return /^[1-9]\d{9,14}$/.test(WHATSAPP_NUMERO); // E.164 sin "+"
  }

  // Enlaces de WhatsApp (footer + CTA final): se activan solo si hay número configurado
  const enlacesWa = ['footer-whatsapp', 'cta-whatsapp', 'cta-whatsapp-alt'];
  if (numeroWhatsAppValido()) {
    const waURL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola, me interesa certificarme en el Centro Certificador Sagomu. ¿Me pueden dar información?')}`;
    enlacesWa.forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.href = waURL; el.hidden = false; }
    });
  } else {
    enlacesWa.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
  }

  /* =================================================================
     TEMA (toggle manual; el init anti-FOUC ya corría en <head>)
     ================================================================= */
  const themeToggle = $('#theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const actual = document.documentElement.getAttribute('data-theme');
      const nuevo  = actual === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nuevo);
      try { localStorage.setItem('tema-preferido', nuevo); } catch (e) {}
    });
  }

  /* =================================================================
     HEADER · scroll state + barra de progreso + back-to-top
     ================================================================= */
  const header   = $('.site-header');
  const progress = $('#scroll-progress');
  const backTop  = $('#back-to-top');

  let scrollTicking = false;
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (header)   header.classList.toggle('scrolled', y > 20);
    if (backTop) {
      const show = y > 500;
      backTop.classList.toggle('show', show);
      backTop.hidden = !show;
    }
    if (progress) {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      progress.style.width = pct + '%';
    }
  }
  function onScrollRaf() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => { onScroll(); scrollTicking = false; });
  }
  window.addEventListener('scroll', onScrollRaf, { passive: true });
  window.addEventListener('resize', onScrollRaf, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* =================================================================
     MENÚ MOBILE (drawer)
     ================================================================= */
  const navToggle = $('#nav-toggle');
  const navClose  = $('#nav-close');
  const mainNav   = $('#main-nav');
  const backdrop  = $('#nav-backdrop');

  function openNav() {
    if (!mainNav) return;
    mainNav.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    if (backdrop) { backdrop.hidden = false; requestAnimationFrame(() => backdrop.classList.add('show')); }
    document.body.classList.add('no-scroll');
    const firstLink = $('.nav-link', mainNav);
    if (firstLink) firstLink.focus();
  }
  function closeNav() {
    if (!mainNav) return;
    mainNav.classList.remove('open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    if (backdrop) { backdrop.classList.remove('show'); setTimeout(() => { backdrop.hidden = true; }, 300); }
    document.body.classList.remove('no-scroll');
    if (navToggle) navToggle.focus();
  }
  if (navToggle) navToggle.addEventListener('click', openNav);
  if (navClose)  navClose.addEventListener('click', closeNav);
  if (backdrop)  backdrop.addEventListener('click', closeNav);
  $$('.nav-link', mainNav || document).forEach(l => l.addEventListener('click', () => {
    if (mainNav && mainNav.classList.contains('open')) closeNav();
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav && mainNav.classList.contains('open')) closeNav();
  });

  /* =================================================================
     SCROLL REVEAL · un único IntersectionObserver reutilizable
     ================================================================= */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  function observeReveals(root = document) {
    $$('.reveal, .reveal-left, .reveal-right, .reveal-zoom', root)
      .forEach((el) => {
        if (!el.classList.contains('is-visible')) revealObserver.observe(el);
      });
  }

  /* =================================================================
     CONTADORES (count-up con requestAnimationFrame)
     ================================================================= */
  function formatValue(val, opts) {
    const decimals = parseInt(opts.decimals || '0', 10);
    if (opts.format === 'k') {
      const k = val / 1000;
      const kStr = (k % 1 === 0) ? k.toString() : k.toFixed(1);
      return kStr + 'K';
    }
    return val.toFixed(decimals);
  }

  function animateCount(el) {
    const to       = parseFloat(el.dataset.countTo || '0');
    const decimals = el.dataset.countDecimals;
    const prefix   = el.dataset.countPrefix || '';
    const suffix   = el.dataset.countSuffix || '';
    const format   = el.dataset.countFormat;
    const duration = prefersReducedMotion ? 1 : 2000;
    const start    = performance.now();

    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + formatValue(to * eased, { decimals, format }) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + formatValue(to, { decimals, format }) + suffix;
    }
    requestAnimationFrame(frame);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  function observeCounters() {
    $$('.counter-num[data-count-to]').forEach((el) => counterObserver.observe(el));
  }

  /* =================================================================
     PARTNERS · marquee de logos (duplicado para loop continuo)
     + logos del footer
     ================================================================= */
  // Cada partner lleva `marca` = la marca del catálogo que se preseleccionará al hacer clic
  const PARTNERS = [
    { src: 'assets/logos/Adobe_Certified_Professional_badge.svg', alt: 'Adobe Certified Professional', marca: 'Adobe' },
    { src: 'assets/logos/microsoft_office_specialist_badge.svg',  alt: 'Microsoft Office Specialist', marca: 'Microsoft' },
    { src: 'assets/logos/cisco.svg',                               alt: 'Cisco', marca: 'Cisco' },
    { src: 'assets/logos/pmi.svg',                                 alt: 'PMI', marca: 'PMI' },
    { src: 'assets/logos/unity.svg',                               alt: 'Unity', marca: 'Unity' },
    { src: 'assets/logos/meta.svg',                                alt: 'Meta', marca: 'Meta' },
    { src: 'assets/logos/Autodesk_certified_User_logo.svg',        alt: 'Autodesk Certified User', marca: 'Autodesk' },
    { src: 'assets/logos/ic3.svg',                                 alt: 'IC3', marca: 'IC3' },
    { src: 'assets/logos/intuit.svg',                              alt: 'Intuit', marca: 'Intuit' },
    { src: 'assets/logos/microsoft_fundamentals_badge.svg',        alt: 'Microsoft Fundamentals', marca: 'Microsoft' },
  ];

  function buildPartners() {
    const track = $('#partners-track');
    if (!track) return;
    const itemHTML = (p) => `<a href="#certificaciones" class="partner-logo" data-marca="${escapeAttr(p.marca || '')}" aria-label="Ver certificaciones de ${escapeAttr(p.alt)}"><img src="${p.src}" alt="${p.alt}" loading="lazy" /></a>`;
    // duplicar para loop continuo (translateX -50%)
    track.innerHTML = PARTNERS.map(itemHTML).join('') + PARTNERS.map(itemHTML).join('');

    // footer: subconjunto
    const footer = $('#footer-logos');
    if (footer) {
      footer.innerHTML = PARTNERS.slice(0, 9).map(
        (p) => `<a href="#certificaciones" class="footer-logo" data-marca="${escapeAttr(p.marca || '')}" aria-label="${p.alt}"><img src="${p.src}" alt="${p.alt}" loading="lazy" /></a>`
      ).join('');
    }
  }

  // Clic en un logo de partner (marquee o footer): ir al catálogo con esa marca ya seleccionada
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-marca]');
    if (!link) return;
    const base = link.getAttribute('data-marca');
    if (!base) return;
    const chip = $$('.brand-chip', rail).find((c) => baseMarca(c.dataset.marca) === base);
    // Si la marca ya está activa no se deselecciona (se mantiene el catálogo abierto)
    if (chip && !chip.classList.contains('is-active')) activarMarca(chip);
  });

  /* =================================================================
     CERTIFICACIONES · fetch, render, filtro, modal, acordeón
     ================================================================= */
  let allCertificaciones = [];
  let marcaActiva = null;
  let modalTrigger = null; // último elemento que abrió el modal (para devolver foco)

  const grid        = $('#courses-grid');
  const rail        = $('#brand-rail');
  const browser     = $('#courses-browser');
  const modal       = $('#course-detail-modal');
  const modalBg     = $('#course-backdrop');

  async function cargarCertificaciones() {
    try {
      const res = await fetch('data/certificaciones.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      let certificaciones = Array.isArray(data) ? data : (data.certificaciones || []);
      if (!certificaciones.length) throw new Error('Sin certificaciones');

      // Adaptar estructura anidada temario.* a estructura plana
      allCertificaciones = certificaciones.map(adaptarCertificacion);

      validarPorcentajes(allCertificaciones);
      construirMarcas();
      renderCertificaciones(allCertificaciones);
    } catch (err) {
      console.error('No se pudieron cargar las certificaciones:', err);
      mostrarErrorCarga();
    }
  }

  // Adaptar estructura anidada temario.* a estructura plana para compatibilidad
  function adaptarCertificacion(cert) {
    if (!cert.temario) return cert; // Ya tiene estructura plana

    const temario = cert.temario;
    return {
      ...cert,
      // Mover propiedades de temario al nivel principal
      objetivos: temario.objetivos || [],
      modulos: (temario.modulos || []).map(m => ({
        nombre: m.titulo || m.nombre,
        temas: m.temas || [],
        porcentaje: m.porcentaje || 0  // Usar 0 si no hay porcentaje definido
      })),
      requisitos: temario.requisitos || [],
      // Adaptar infoExamen de certificacion a infoExamen plano
      infoExamen: temario.certificacion ? {
        duracion: temario.certificacion.duracionExamen || temario.certificacion.duracion || 'N/A',
        formato: temario.certificacion.formato || 'Examen oficial',
        notaAprobacion: temario.certificacion.puntuacionMinima ? `${temario.certificacion.puntuacionMinima}/1000` : 'N/A',
        numeroIntentos: temario.certificacion.numeroIntentos || 'Ilimitados',
        periodoEspera: temario.certificacion.periodoEspera || '24 horas',
        // Guardar opciones originales para el modal de venta
        opcionesCompra: temario.certificacion.opciones || []
      } : {},
      // Guardar duración total
      duracionTotal: temario.duracionTotal || null
    };
  }

  function validarPorcentajes(lista) {
    lista.forEach((c) => {
      if (!Array.isArray(c.modulos) || !c.modulos.length) return;
      // Sin pesos definidos (todos en 0/ausentes): no hay nada que validar
      if (c.modulos.every((m) => !Number(m.porcentaje))) return;
      const suma = c.modulos.reduce((acc, m) => acc + (Number(m.porcentaje) || 0), 0);
      if (suma !== 100) {
        console.warn(`[Sagomu] "${c.nombreExamen}" suma ${suma}% en sus módulos (esperado 100%).`);
      }
    });
  }

  function mostrarErrorCarga() {
    if (!grid) return;
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML =
      '<div class="courses-error">' +
      '<p>No pudimos cargar las certificaciones en este momento.</p>' +
      '<p style="margin-top:10px"><button class="btn btn-primary" id="retry-courses">Reintentar</button></p>' +
      '</div>';
    const retry = $('#retry-courses');
    if (retry) retry.addEventListener('click', () => {
      grid.setAttribute('aria-busy', 'true');
      grid.innerHTML = '<p class="courses-loading">Cargando certificaciones…</p>';
      cargarCertificaciones();
    });
  }

  // Marcas del catálogo: nombre corto para el chip + logo de marca preferido
  const NOMBRES_CORTOS_MARCA = {
    'Communication Skills for Business': 'CSB',
    'Entrepreneurship and Small Business': 'ESB',
    'Information Technology Specialist': 'ITS'
  };
  const LOGOS_MARCA = {
    'Adobe': 'assets/logos/Adobe_Certified_Professional_badge.svg',
    'Apple': 'assets/logos/App_Development_Swift_Badge.svg',
    'Autodesk': 'assets/logos/Autodesk_certified_User_logo.svg',
    'Cisco': 'assets/logos/cisco.svg',
    'Communication Skills for Business': 'assets/logos/Communication_Skills_for_Business_badge.svg',
    'Entrepreneurship and Small Business': 'assets/logos/esb.svg',
    'IC3': 'assets/logos/ic3.svg',
    'Information Technology Specialist': 'assets/logos/Information_Technology_Specialist_badge.svg',
    'Intuit': 'assets/logos/intuit.svg',
    'Meta': 'assets/logos/meta.svg',
    'Microsoft': 'assets/logos/microsoft_fundamentals_badge.svg',
    'PMI': 'assets/logos/pmi.svg',
    'Unity': 'assets/logos/unity.svg'
  };
  // Logos muy horizontales que necesitan una caja más ancha para verse bien
  const LOGOS_AMPLIOS = new Set(['Adobe', 'Autodesk', 'Intuit', 'PMI']);
  function baseMarca(marca) {
    return String(marca || '').split(' / ')[0].trim();
  }
  function nombreMarca(marca) {
    const base = baseMarca(marca);
    return NOMBRES_CORTOS_MARCA[base] || base;
  }

  function construirMarcas() {
    if (!rail) return;
    const marcas = [...new Set(allCertificaciones.map((c) => c.marca).filter(Boolean))];
    rail.innerHTML = marcas.map((m) => {
      const base = baseMarca(m);
      const logo = LOGOS_MARCA[base] || (allCertificaciones.find((c) => c.marca === m) || {}).imagenLogo || '';
      const claseLogo = LOGOS_AMPLIOS.has(base) ? ' chip-logo-amplio' : '';
      return `<button class="brand-chip${claseLogo}" role="tab" aria-selected="false" data-marca="${escapeAttr(m)}" title="${escapeAttr(m)}">` +
        (logo ? `<img src="${escapeAttr(logo)}" alt="" loading="lazy" onerror="this.style.display='none';" />` : '') +
        `<span>${escapeHTML(nombreMarca(m))}</span></button>`;
    }).join('');

    $$('.brand-chip', rail).forEach((chip) => {
      chip.addEventListener('click', () => activarMarca(chip));
    });
  }

  function activarMarca(chip) {
    const marca = chip.dataset.marca;
    const yaActiva = chip.classList.contains('is-active');

    $$('.brand-chip', rail).forEach((c) => {
      c.classList.remove('is-active');
      c.setAttribute('aria-selected', 'false');
    });

    // Segundo clic sobre la marca activa: volver al estado inicial (solo fila de iconos)
    if (yaActiva) {
      marcaActiva = null;
      if (browser) browser.classList.remove('has-selection');
      return;
    }

    chip.classList.add('is-active');
    chip.setAttribute('aria-selected', 'true');
    marcaActiva = marca;
    if (browser) browser.classList.add('has-selection');

    // Animación de intercambio: desvanecer la lista, re-renderizar y entrar
    grid.classList.add('is-swapping');
    setTimeout(() => {
      renderCertificaciones(allCertificaciones.filter((c) => c.marca === marca));
      grid.classList.remove('is-swapping');
    }, 200);
  }

  function truncar(texto, max = 120) {
    if (!texto) return '';
    return texto.length > max ? texto.slice(0, max).trim() + '…' : texto;
  }
  function escapeHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }
  function escapeAttr(str) { return escapeHTML(str); }

  function renderCertificaciones(lista) {
    if (!grid) return;
    grid.setAttribute('aria-busy', 'false');

    if (!lista.length) {
      grid.innerHTML = '<p class="courses-loading">No hay certificaciones de esta marca.</p>';
      return;
    }

    grid.innerHTML = lista.map((c) => tarjetaCertificacion(c)).join('');

    // stagger + re-observar reveal de las tarjetas nuevas
    $$('.course-card', grid).forEach((card, i) => {
      card.classList.add('reveal');
      card.style.transitionDelay = `${Math.min(i, 6) * 0.08}s`;
      revealObserver.observe(card);
    });

    // delegación única de click para "Ver temario" (escalable a N certificaciones)
    if (!grid.dataset.clickBound) {
      grid.dataset.clickBound = '1';
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-abrir-detalle]');
        if (!btn) return;
        e.preventDefault();
        const id = btn.getAttribute('data-abrir-detalle');
        const cert = allCertificaciones.find((x) => x.id === id);
        if (cert) abrirDetalle(cert, btn);
      });
    }
  }

  function tarjetaCertificacion(c) {
    // Logo centrado en parte superior - Sin portada, sin badges
    const logoSrc = c.imagenLogo || '';
    const logoAlt = escapeAttr(c.marca || 'Logo de certificación');
    const logoContainer = logoSrc
      ? `<div class="course-logo-container"><img src="${logoSrc}" alt="${logoAlt}" class="course-logo" loading="lazy" onerror="this.onerror=null;this.style.display='none';" /></div>`
      : '';

    return `
      <article class="course-card hover-lift">
        ${logoContainer}
        <div class="course-body">
          <a href="#" class="course-cat" data-abrir-detalle="${escapeAttr(c.id)}">${escapeHTML(c.categoria || '')}</a>
          <h4 class="course-name"><a href="#" data-abrir-detalle="${escapeAttr(c.id)}">${escapeHTML(c.nombreExamen)}</a></h4>
          <p class="course-desc">${escapeHTML(truncar(c.descripcion))}</p>
          <div class="course-footer">
            <button class="course-cta" data-abrir-detalle="${escapeAttr(c.id)}">
              Ver temario <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>
            </button>
          </div>
        </div>
      </article>`;
  }

  /* ---------- MODAL DE DETALLE ---------- */
  function abrirDetalle(cert, trigger) {
    if (!modal) return;
    if (modal._closeTimer) { clearTimeout(modal._closeTimer); modal._closeTimer = null; }
    modal._closeViaAnchor = false;
    modalTrigger = trigger || document.activeElement;
    modal.innerHTML = dialogCertificacion(cert);
    modal.hidden = false;
    modalBg.hidden = false;
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      modalBg.classList.add('show');
    });
    document.body.classList.add('no-scroll');

    // listeners del modal recién creado
    const closeBtn = $('.modal-close', modal);
    if (closeBtn) closeBtn.addEventListener('click', cerrarDetalle);

    // acordeón
    $$('.acc-trigger', modal).forEach((trig) => {
      trig.addEventListener('click', () => {
        const expanded = trig.getAttribute('aria-expanded') === 'true';
        // comportamiento acordeón: solo uno abierto a la vez (opcional)
        trig.setAttribute('aria-expanded', String(!expanded));
      });
    });

    // Botones de contacto en opciones de compra
    $$('.opcion-contacto', modal).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const opcion = btn.getAttribute('data-opcion');
        const certId = cert.id;
        const certNombre = cert.nombreExamen;
        abrirContacto(certId, certNombre, opcion);
      });
    });

    // Botones duales de contacto (voucher vs curso)
    const contactoVoucher = $('.contacto-voucher', modal);
    const contactoCurso = $('.contacto-curso', modal);
    const contactoGeneral = $('.contacto-general', modal);

    if (contactoVoucher) {
      contactoVoucher.addEventListener('click', (e) => {
        e.preventDefault();
        const opcion = contactoVoucher.getAttribute('data-opcion');
        abrirContacto(cert.id, cert.nombreExamen, opcion);
      });
    }

    if (contactoCurso) {
      contactoCurso.addEventListener('click', (e) => {
        e.preventDefault();
        const opcion = contactoCurso.getAttribute('data-opcion');
        abrirContacto(cert.id, cert.nombreExamen, opcion);
      });
    }

    if (contactoGeneral) {
      contactoGeneral.addEventListener('click', (e) => {
        e.preventDefault();
        abrirContacto(cert.id, cert.nombreExamen, 'Información general');
      });
    }

    // foco
    if (closeBtn) closeBtn.focus();
  }

  // Función para abrir formulario de contacto con preselección
  function abrirContacto(certId, certNombre, opcion) {
    // Cerrar el modal actual primero
    cerrarDetalle();

    // Abrir formulario de contacto con preselección
    setTimeout(() => {
      // Crear mensaje según la opción seleccionada
      let mensaje = '';
      switch(opcion) {
        case 'Solo examen':
          mensaje = `Hola, estoy interesado en el VOUCHER DE EXAMEN para la certificación ${certNombre}. ¿Podrían darme más información sobre precios y disponibilidad?`;
          break;
        case 'Curso + examen':
          mensaje = `Hola, estoy interesado en el CURSO COMPLETO + EXAMEN para la certificación ${certNombre}. ¿Podrían darme información sobre temarios, precios y modalidades disponibles?`;
          break;
        default:
          mensaje = `Hola, estoy interesado en la certificación ${certNombre}. ¿Podrían darme más información?`;
      }

      // Aquí puedes:
      // 1. Abrir un modal de contacto con el mensaje pre-configurado
      // 2. Redirigir a una página de contacto con parámetros
      // 3. Abrir WhatsApp con el mensaje pre-configurado

      // Abrir WhatsApp Business con el mensaje prellenado (ver WHATSAPP_NUMERO arriba)
      if (numeroWhatsAppValido()) {
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappURL, '_blank', 'noopener');
      } else {
        // Sin número configurado: ir a la sección de contacto del footer
        const contactoSection = $('#contacto');
        if (contactoSection) contactoSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 400);
  }

  function cerrarDetalle() {
    if (!modal) return;
    if (modal._closeTimer) { clearTimeout(modal._closeTimer); modal._closeTimer = null; }
    modal.classList.remove('is-open');
    modalBg.classList.remove('show');
    document.body.classList.remove('no-scroll');
    const viaAnchor = modal._closeViaAnchor;
    modal._closeTimer = setTimeout(() => {
      modal.hidden = true;
      modalBg.hidden = true;
      modal.innerHTML = '';
      modal._closeTimer = null;
    }, 350);
    // si se cerró por un CTA que navega a un ancla, el foco lo recibe el destino, no el trigger
    if (!viaAnchor && modalTrigger && typeof modalTrigger.focus === 'function') modalTrigger.focus();
  }

  if (modalBg) modalBg.addEventListener('click', cerrarDetalle);
  // click en el área del modal fuera del diálogo también cierra
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) cerrarDetalle(); });

  function dialogCertificacion(c) {
    const info = c.infoExamen || {};
    const opcionesCompra = info.opcionesCompra || [];

    // Crear HTML de opciones de compra
    const opcionesHTML = opcionesCompra.length ? `
      <section class="modal-section">
        <h3>💰 Opciones de Obtención</h3>
        <div class="opciones-compra">
          ${opcionesCompra.map((op, i) => `
            <div class="opcion-card ${i === 0 ? 'featured' : ''}">
              <div class="opcion-header">
                <h4>${escapeHTML(op.tipo)}</h4>
                ${op.costo ? `<span class="opcion-precio-wrap"><span class="opcion-costo">${escapeHTML(op.costo)}</span>${op.costo.includes('$') ? '<span class="opcion-iva">IVA incluido</span>' : ''}</span>` : ''}
              </div>
              <p class="opcion-desc">${escapeHTML(op.descripcion)}</p>
              <div class="opcion-incluye">
                <strong>Incluye:</strong>
                <ul>
                  ${op.incluye.map(inc => `<li>${escapeHTML(inc)}</li>`).join('')}
                </ul>
              </div>
              ${op.modalidades && op.modalidades.length ? `
                <div class="opcion-modalidades">
                  <strong>Modalidades:</strong>
                  <div class="modalidades-grid">
                    ${op.modalidades.map(mod => `
                      <div class="modalidad-item">
                        <span class="modalidad-tipo">${escapeHTML(mod.tipo)}</span>
                        <span class="modalidad-duracion">${escapeHTML(mod.duracion)}</span>
                        <span class="modalidad-costo">${escapeHTML(mod.costo)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              <!-- Botón "Solicitar información" por opción eliminado: el CTA del footer del modal ya lo cubre -->
            </div>
          `).join('')}
        </div>
      </section>
    ` : '';

    // Temario completo (si hay módulos)
    const temarioHTML = Array.isArray(c.modulos) && c.modulos.length ? `
      <section class="modal-section">
        <h3>📚 Temario del Examen</h3>
        <div class="temario-info">
          ${c.duracionTotal ? `<p class="temario-duracion"><strong>⏱️ Duración total:</strong> ${escapeHTML(c.duracionTotal)}</p>` : ''}
          ${Array.isArray(c.requisitos) && c.requisitos.length ? `
            <div class="temario-requisitos">
              <strong>✅ Requisitos previos:</strong>
              <ul class="bullet-list">
                ${c.requisitos.map(r => `<li>${escapeHTML(r)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        <div class="accordion">
          ${c.modulos.map((m, i) => `
            <div class="acc-item">
              <button class="acc-trigger" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="acc-panel-${escapeAttr(c.id)}-${i}" id="acc-trigger-${escapeAttr(c.id)}-${i}">
                <span>${escapeHTML(m.nombre)}</span>
                ${m.porcentaje ? `<span class="acc-bar" aria-hidden="true"><span style="width:${Number(m.porcentaje) || 0}%"></span></span>` : ''}
                ${m.porcentaje ? `<span class="acc-pct">${Number(m.porcentaje) || 0}%</span>` : ''}
                <span class="acc-toggle" aria-hidden="true"><svg class="icon"><use href="#i-chevron"/></svg></span>
              </button>
              <div class="acc-panel" id="acc-panel-${escapeAttr(c.id)}-${i}" role="region" aria-labelledby="acc-trigger-${escapeAttr(c.id)}-${i}">
                <div class="acc-panel-inner">
                  ${Array.isArray(m.temas) && m.temas.length ? `<ul>${m.temas.map((t) => `<li>${escapeHTML(t)}</li>`).join('')}</ul>` : '<p style="padding:8px 18px 18px;color:var(--text-secondary)">Sin temas detallados.</p>'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    ` : '';

    return `
      <div class="modal-dialog" role="document">
        <header class="modal-header">
          ${c.imagenLogo ? `<span class="modal-header-logo"><img src="${escapeAttr(c.imagenLogo)}" alt="" /></span>` : ''}
          <div class="modal-header-titles">
            ${c.marca ? `<p class="modal-marca">${escapeHTML(c.marca)}</p>` : ''}
            <h2 class="modal-nombre" id="modal-title">${escapeHTML(c.nombreExamen)}</h2>
          </div>
          <button class="modal-close" aria-label="Cerrar detalle">
            <svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>
          </button>
        </header>

        <div class="modal-body">
          ${c.descripcion ? `<section class="modal-section"><h3>Descripción</h3><p class="modal-desc">${escapeHTML(c.descripcion)}</p></section>` : ''}

          ${Array.isArray(c.objetivos) && c.objetivos.length ? `
            <section class="modal-section">
              <h3>🎯 Objetivos de Aprendizaje</h3>
              <ul class="bullet-list">
                ${c.objetivos.map((o) => `<li>${escapeHTML(o)}</li>`).join('')}
              </ul>
            </section>` : ''}

          ${temarioHTML}

          ${opcionesHTML}
        </div>

        <footer class="modal-footer">
          <div class="modal-footer-actions">
            ${opcionesCompra.length > 1 ? `
              <div class="dual-cta">
                <button class="btn btn-outline-secondary contacto-voucher" data-cert="${escapeAttr(c.id)}" data-opcion="Solo examen">
                  Solo Voucher
                  <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                </button>
                <button class="btn btn-primary contacto-curso" data-cert="${escapeAttr(c.id)}" data-opcion="Curso + examen">
                  Curso + Examen
                  <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                </button>
              </div>
            ` : `
              <button class="btn btn-primary contacto-general" data-cert="${escapeAttr(c.id)}">
                Solicitar Información
                <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>
              </button>
            `}
          </div>
        </footer>
      </div>`;
  }

  // cierre por Escape + focus trap (cubre modal curso y modal video)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal && modal.classList.contains('is-open')) { cerrarDetalle(); return; }
    if ($('#video-modal') && $('#video-modal').classList.contains('is-open')) { cerrarVideo(); return; }
  });

  // cerrar al hacer click en un CTA interno que lleve a un ancla de la misma página
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cerrar-al-click]');
    if (t && modal && modal.classList.contains('is-open')) {
      modal._closeViaAnchor = true; // el foco va al ancla destino, no al trigger
      setTimeout(cerrarDetalle, 0);
    }
  });

  /* =================================================================
     MODAL DE VIDEO
     ================================================================= */
  const videoModal = $('#video-modal');
  function abrirVideo(trigger) {
    if (!videoModal) return;
    if (videoModal._closeTimer) { clearTimeout(videoModal._closeTimer); videoModal._closeTimer = null; }
    modalTrigger = trigger || document.activeElement;
    videoModal.hidden = false;
    requestAnimationFrame(() => videoModal.classList.add('is-open'));
    document.body.classList.add('no-scroll');
    const closeBtn = $('[data-close-video].modal-close', videoModal);
    if (closeBtn) closeBtn.focus();
  }
  function cerrarVideo() {
    if (!videoModal) return;
    if (videoModal._closeTimer) { clearTimeout(videoModal._closeTimer); videoModal._closeTimer = null; }
    videoModal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    // detener cualquier reproducción (iframe/video) al cerrar para que el audio no siga
    const vf = $('#video-frame');
    if (vf) {
      vf.querySelectorAll('iframe, video').forEach((m) => {
        try {
          if (typeof m.pause === 'function') m.pause();
          // solo vaciar iframes (YouTube/Vimeo); el video local conserva su src para poder reabrirlo
          if (m.tagName === 'IFRAME') m.src = '';
        } catch (e) {}
      });
    }
    videoModal._closeTimer = setTimeout(() => { videoModal.hidden = true; videoModal._closeTimer = null; }, 350);
    if (modalTrigger && typeof modalTrigger.focus === 'function') modalTrigger.focus();
  }
  $$('[data-close-video]', videoModal || document).forEach((el) => el.addEventListener('click', cerrarVideo));
  const openVideoHero = $('#open-video-hero');
  const openVideo2    = $('#open-video-2');
  if (openVideoHero) openVideoHero.addEventListener('click', () => abrirVideo(openVideoHero));
  if (openVideo2)    openVideo2.addEventListener('click', () => abrirVideo(openVideo2));

  /* =================================================================
     TESTIMONIOS · carrusel
     ================================================================= */
  function initTestimonios() {
    const track = $('#testi-track');
    if (!track) return;
    const slides = $$('.testi-slide', track);
    if (!slides.length) return;
    const dotsWrap = $('#testi-dots');
    const prev = $('#testi-prev');
    const next = $('#testi-next');
    let index = 0;

    if (dotsWrap) {
      dotsWrap.innerHTML = slides.map((_, i) =>
        `<button class="testi-dot ${i === 0 ? 'is-active' : ''}" role="tab" aria-selected="${i === 0}" aria-label="Ir al testimonio ${i + 1}" data-i="${i}"></button>`
      ).join('');
      $$('.testi-dot', dotsWrap).forEach((d) => d.addEventListener('click', () => go(parseInt(d.dataset.i, 10))));
    }

    slides.forEach((s, i) => s.classList.toggle('is-active', i === 0));

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === index));
      $$('.testi-dot', dotsWrap).forEach((d, k) => {
        const active = k === index;
        d.classList.toggle('is-active', active);
        d.setAttribute('aria-selected', String(active));
      });
    }
    if (prev) prev.addEventListener('click', () => go(index - 1));
    if (next) next.addEventListener('click', () => go(index + 1));

    // autoplay opcional (respeta reduced-motion y pause en hover)
    if (!prefersReducedMotion) {
      let timer = setInterval(() => go(index + 1), 6000);
      const slider = $('.testi-slider');
      if (slider) {
        slider.addEventListener('mouseenter', () => clearInterval(timer));
        slider.addEventListener('mouseleave', () => { timer = setInterval(() => go(index + 1), 6000); });
      }
    }
  }

  /* =================================================================
     TILT 3D opcional · tarjeta de oferta
     ================================================================= */
  function initTilt() {
    const el = $('#offer-tilt');
    if (!el || prefersReducedMotion || window.matchMedia('(hover: none)').matches) return;
    const strength = 8;
    let tiltFrame = null, lastE = null;
    el.addEventListener('mousemove', (e) => {
      lastE = e;
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        tiltFrame = null;
        const e2 = lastE;
        const r = el.getBoundingClientRect();
        const x = (e2.clientX - r.left) / r.width;
        const y = (e2.clientY - r.top) / r.height;
        const rotY = (x - 0.5) * strength;
        const rotX = (0.5 - y) * strength;
        el.style.transform = `translateY(-8px) perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  }

  /* =================================================================
     FOCUS TRAP para cualquier modal abierto
     ================================================================= */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const open = document.querySelector('.modal.is-open');
    if (!open) return;
    const focusables = $$('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])', open)
      .filter((el) => {
        if (el.offsetParent === null) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0; // excluye paneles de acordeón colapsados (altura 0)
      });
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* =================================================================
     INIT
     ================================================================= */
  function init() {
    observeReveals();
    observeCounters();
    buildPartners();
    cargarCertificaciones();
    initTestimonios();
    initTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
