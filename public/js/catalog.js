/* ================================================================
   CATALOG — Vitrine Digital Pública
   Sem autenticação. Slug extraído da URL.
   API: GET /public/catalog/:slug
   ================================================================ */

(() => {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────────── */
  const $ = id => document.getElementById(id);

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value) || 0);
  }

  /* ── Extrai o slug da URL (/catalog/<slug>) ──────────────────── */
  function extractSlug() {
    const parts = window.location.pathname.split('/catalog/');
    if (parts.length < 2) return null;
    const slug = parts[1].split('/')[0].trim();
    return slug || null;
  }

  /* ── Estado global ───────────────────────────────────────────── */
  let SLUG       = extractSlug();
  let ALL_PRODUCTS = [];   // todos os produtos carregados
  let ACTIVE_CAT = 'all';  // categoria ativa

  /* ── Locale storage cart ─────────────────────────────────────── */
  const cartKey = () => `catalog_cart_${SLUG}`;

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(cartKey()) || '[]');
    } catch { return []; }
  }

  function saveCart(items) {
    localStorage.setItem(cartKey(), JSON.stringify(items));
  }

  function cartTotal(items) {
    return items.reduce((sum, i) => sum + i.preco_venda * i.qty, 0);
  }

  function addItem(id, nome, preco_venda) {
    const items = getCart();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      items[idx].qty += 1;
    } else {
      items.push({ id, nome, preco_venda, qty: 1 });
    }
    saveCart(items);
    updateBadge();
    renderCart();
    showToast(`${nome} adicionado ao carrinho`);
  }

  function removeItem(id) {
    const items = getCart().filter(i => i.id !== id);
    saveCart(items);
    updateBadge();
    renderCart();
  }

  function updateQty(id, delta) {
    const items = getCart();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    items[idx].qty += delta;
    if (items[idx].qty <= 0) {
      items.splice(idx, 1);
    }
    saveCart(items);
    updateBadge();
    renderCart();
  }

  function clearCart() {
    saveCart([]);
    updateBadge();
    renderCart();
  }

  function updateBadge() {
    const items = getCart();
    const count = items.reduce((s, i) => s + i.qty, 0);
    const badge = $('cartBadge');
    const fab   = $('cartFab');
    if (!badge || !fab) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.style.display = 'flex';
      fab.style.display   = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ── Carrinho — renderização ─────────────────────────────────── */
  function renderCart() {
    const body    = $('cartBody');
    const footer  = $('cartFooter');
    const empty   = $('cartEmpty');
    const total   = $('cartTotal');
    if (!body) return;

    const items = getCart();

    if (items.length === 0) {
      body.innerHTML   = '';
      footer.style.display = 'none';
      empty.style.display  = 'flex';
      return;
    }

    empty.style.display  = 'none';
    footer.style.display = 'flex';

    if (total) total.textContent = formatCurrency(cartTotal(items));

    body.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <span class="cart-item-name">${escapeHtml(item.nome)}</span>
        <div class="cart-item-qty-controls">
          <button class="cart-qty-btn btn-qty-minus" data-id="${item.id}" aria-label="Diminuir">−</button>
          <span class="cart-qty-value">${item.qty}</span>
          <button class="cart-qty-btn btn-qty-plus"  data-id="${item.id}" aria-label="Aumentar">+</button>
        </div>
        <span class="cart-item-price">${formatCurrency(item.preco_venda * item.qty)}</span>
      </div>
    `).join('');
  }

  /* ── Checkout via WhatsApp ───────────────────────────────────── */
  function handleCheckout() {
    const items = getCart();
    if (items.length === 0) return;

    const storeName = $('storeName')?.textContent || SLUG;
    const lines = items.map(i =>
      `• ${i.qty}x ${i.nome} — ${formatCurrency(i.preco_venda * i.qty)}`
    );
    const total = formatCurrency(cartTotal(items));

    const msg = [
      `Olá! Gostaria de fazer um pedido na loja *${storeName}*:`,
      '',
      ...lines,
      '',
      `*Total: ${total}*`,
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  /* ── Toast ───────────────────────────────────────────────────── */
  let toastTimer = null;

  function showToast(msg, isError = false) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.background     = isError ? '#7f1d1d' : '';
    el.style.borderColor    = isError ? '#f97373' : '';
    el.style.display        = 'block';
    el.style.animation      = 'none';
    void el.offsetWidth; // reflow
    el.style.animation      = 'fadeInUp 0.2s ease-out';

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 2200);
  }

  /* ── Cart drawer ─────────────────────────────────────────────── */
  function openCart() {
    const overlay = $('cartOverlay');
    if (!overlay) return;
    renderCart();
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    const overlay = $('cartOverlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ── Fetch catálogo API ──────────────────────────────────────── */
  async function fetchCatalog(slug) {
    const res = await fetch(`/public/catalog/${encodeURIComponent(slug)}`);
    if (res.status === 404) throw Object.assign(new Error('not_found'), { code: 'not_found' });
    if (!res.ok) throw new Error('server_error');
    return res.json();
  }

  /* ── Render loja (header + page meta) ───────────────────── */
  function renderStore(slug, user) {
    const nameEl   = $('storeName');
    const avatarEl = $('storeAvatarLetter');
    const catEl    = $('storeCategory');

    const displayName = (user && user.nome_fantasia) ? user.nome_fantasia : slug;
    const displayCat  = (user && user.categoria_producao) ? user.categoria_producao : 'Vitrine digital';

    if (nameEl) {
      nameEl.textContent = displayName;
      nameEl.classList.remove('skeleton-line');
    }
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
    if (catEl) {
      catEl.textContent = displayCat;
      catEl.classList.remove('skeleton-line', 'skeleton-line--sm');
    }

    // Update browser tab title + meta (JS-side, complements SSR)
    document.title = `${displayName} — Vitrine Digital`;
    const descMeta = document.getElementById('metaDescription');
    if (descMeta) descMeta.content = `Catálogo de ${displayName}. Categoria: ${displayCat}.`;
  }

  /* ── Render categorias ───────────────────────────────────────── */
  function renderCategories(products) {
    const nav = $('categoryPills');
    if (!nav) return;

    const cats = ['all', ...new Set(
      products.map(p => p.categoria).filter(Boolean)
    )];

    if (cats.length <= 1) {
      nav.closest('.category-nav').style.display = 'none';
      return;
    }

    nav.innerHTML = cats.map(cat => `
      <button class="pill${cat === ACTIVE_CAT ? ' active' : ''}"
              data-cat="${escapeHtml(cat)}">
        ${cat === 'all' ? 'Todos' : escapeHtml(cat)}
      </button>
    `).join('');
  }

  /* ── Filtra e re-renderiza produtos ─────────────────────────── */
  function filterProducts(cat) {
    ACTIVE_CAT = cat;
    // update active pill
    document.querySelectorAll('.pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });

    const visible = cat === 'all'
      ? ALL_PRODUCTS
      : ALL_PRODUCTS.filter(p => p.categoria === cat);

    renderProducts(visible);
  }

  /* ── Render produtos ─────────────────────────────────────────── */
  function renderProducts(products) {
    const grid  = $('productGrid');
    const empty = $('emptyState');
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }

    if (empty) empty.style.display = 'none';
    grid.innerHTML = products.map(buildProductCard).join('');
  }

  function buildProductCard(p) {
    const imageHtml = p.imagem_url
      ? `<img class="product-img" src="${escapeHtml(p.imagem_url)}"
             alt="${escapeHtml(p.nome)}" loading="lazy">`
      : `<div class="product-img-placeholder" aria-hidden="true">🛒</div>`;

    const catBadge = p.categoria
      ? `<span class="product-category-badge">${escapeHtml(p.categoria)}</span>`
      : '';

    const descHtml = p.descricao
      ? `<p class="product-desc">${escapeHtml(p.descricao)}</p>`
      : '';

    return `
      <article class="product-card">
        <div class="product-img-wrap">${imageHtml}</div>
        <div class="product-card-body">
          ${catBadge}
          <h3 class="product-name">${escapeHtml(p.nome)}</h3>
          ${descHtml}
          <div class="product-footer">
            <span class="product-price">${formatCurrency(p.preco_venda)}</span>
            <button class="btn-add"
                    data-id="${p.id}"
                    data-nome="${escapeHtml(p.nome)}"
                    data-preco="${p.preco_venda}"
                    aria-label="Adicionar ${escapeHtml(p.nome)} ao carrinho">
              + Adicionar
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /* ── XSS guard ───────────────────────────────────────────────── */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Skeleton ────────────────────────────────────────────────── */
  function showSkeleton() {
    const sk = $('skeletonGrid');
    const pg = $('productGrid');
    if (sk) sk.style.display = 'flex';
    if (pg) pg.style.display = 'none';
  }

  function hideSkeleton() {
    const sk = $('skeletonGrid');
    const pg = $('productGrid');
    if (sk) sk.style.display = 'none';
    if (pg) pg.style.display = 'flex';
  }

  /* ── Estados de erro ─────────────────────────────────────────── */
  function showNotFound() {
    hideSkeleton();
    const el = $('notFoundState');
    if (el) el.style.display = 'flex';
  }

  function showError() {
    hideSkeleton();
    const el = $('errorState');
    if (el) el.style.display = 'flex';
  }

  /* ── Inicialização ───────────────────────────────────────────── */
  async function init() {
    if (!SLUG) {
      showError();
      return;
    }

    showSkeleton();

    try {
      const data = await fetchCatalog(SLUG);
      ALL_PRODUCTS = data.produtos || [];

      renderStore(SLUG, data.loja || null);
      renderCategories(ALL_PRODUCTS);
      hideSkeleton();
      renderProducts(ALL_PRODUCTS);
      updateBadge();

      // Mostra FAB somente se há produtos
      if (ALL_PRODUCTS.length > 0) {
        const fab = $('cartFab');
        if (fab) fab.style.display = 'flex';
      }

    } catch (err) {
      if (err.code === 'not_found') {
        showNotFound();
      } else {
        showError();
      }
    }
  }

  /* ── Event delegation ────────────────────────────────────────── */
  document.addEventListener('click', e => {
    /* Add to cart */
    const addBtn = e.target.closest('.btn-add');
    if (addBtn) {
      addItem(
        Number(addBtn.dataset.id),
        addBtn.dataset.nome,
        Number(addBtn.dataset.preco)
      );
      return;
    }

    /* Category pill */
    const pill = e.target.closest('.pill');
    if (pill) {
      filterProducts(pill.dataset.cat);
      return;
    }

    /* Cart FAB */
    if (e.target.closest('#cartFab')) {
      openCart();
      return;
    }

    /* Close cart — overlay background */
    if (e.target.id === 'cartOverlay') {
      closeCart();
      return;
    }

    /* Close cart — button */
    if (e.target.closest('#btnCloseCart')) {
      closeCart();
      return;
    }

    /* Qty − */
    const minusBtn = e.target.closest('.btn-qty-minus');
    if (minusBtn) {
      updateQty(Number(minusBtn.dataset.id), -1);
      return;
    }

    /* Qty + */
    const plusBtn = e.target.closest('.btn-qty-plus');
    if (plusBtn) {
      updateQty(Number(plusBtn.dataset.id), +1);
      return;
    }

    /* Checkout (WhatsApp) */
    if (e.target.closest('#btnCheckout')) {
      handleCheckout();
      return;
    }

    /* Clear cart */
    if (e.target.closest('#btnClearCart')) {
      clearCart();
      return;
    }

    /* Retry */
    if (e.target.closest('#btnRetry')) {
      $('errorState').style.display = 'none';
      init();
      return;
    }
  });

  /* Fechar drawer com Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCart();
  });

  /* ── Boot ─────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
