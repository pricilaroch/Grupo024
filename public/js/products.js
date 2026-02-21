/**
 * products.js — Gestão de Produtos (CRUD + Inteligência Financeira)
 * Depende de: api.js, guard.js
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Guard ──────────────────────────────────────────────
  if (!RouteGuard.requireApproved()) return;
  RouteGuard.renderNavbar();

  // ── State ──────────────────────────────────────────────
  let products = [];
  let editingId = null;
  let deletingId = null;
  let activeFilter = 'all';

  // ── DOM refs ───────────────────────────────────────────
  const grid          = document.getElementById('productsGrid');
  const emptyState    = document.getElementById('emptyState');
  const loadingState  = document.getElementById('loadingState');
  const productCount  = document.getElementById('productCount');

  const modal         = document.getElementById('productModal');
  const modalTitle    = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const form          = document.getElementById('productForm');
  const formAlert     = document.getElementById('formAlert');
  const profitPreview = document.getElementById('profitPreview');
  const profitValue   = document.getElementById('profitValue');
  const marginValue   = document.getElementById('marginValue');
  const btnSubmit     = document.getElementById('btnSubmit');

  const deleteModal       = document.getElementById('deleteModal');
  const deleteProductName = document.getElementById('deleteProductName');

  // ── Init ───────────────────────────────────────────────
  loadProducts();
  bindEvents();

  // ══════════════════════════════════════════════════════
  //  DATA
  // ══════════════════════════════════════════════════════

  async function loadProducts() {
    showLoading(true);
    try {
      const res = await ApiService.getProducts();
      if (res.ok) {
        products = res.data;
      } else {
        products = [];
      }
    } catch {
      products = [];
    }
    showLoading(false);
    render();
  }

  // ══════════════════════════════════════════════════════
  //  RENDERING
  // ══════════════════════════════════════════════════════

  function render() {
    const filtered = filterProducts(products);
    updateCount(filtered.length, products.length);

    if (products.length === 0) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    grid.style.display = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="products-empty-filter">
          <p>Nenhum produto encontrado com este filtro.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(renderCard).join('');
  }

  function renderCard(p) {
    const lucro  = calcProfit(p.preco_venda, p.preco_custo);
    const margin = calcMargin(p.preco_venda, p.preco_custo);
    const lowMargin = p.preco_custo != null && margin < 20;
    const isActive = Boolean(p.ativo);

    return `
      <div class="product-card ${!isActive ? 'product-card--inactive' : ''}" data-id="${p.id}">
        ${p.imagem_url ? `<div class="product-card-img" style="background-image:url('${escapeHtml(p.imagem_url)}')"></div>` : ''}
        <div class="product-card-body">
          <div class="product-card-top">
            <div>
              <h3 class="product-card-name">${escapeHtml(p.nome)}</h3>
              ${p.categoria ? `<span class="product-card-category">${escapeHtml(p.categoria)}</span>` : ''}
            </div>
            <span class="badge ${isActive ? 'badge-approved' : 'badge-rejected'}">${isActive ? 'Ativo' : 'Inativo'}</span>
          </div>

          <div class="product-card-prices">
            <div class="product-card-price-main">
              <span class="product-card-price-label">Venda</span>
              <span class="product-card-price-value">${formatCurrency(p.preco_venda)}</span>
              ${p.unidade_medida ? `<span class="product-card-unit">/ ${escapeHtml(p.unidade_medida)}</span>` : ''}
            </div>
            ${p.preco_custo != null ? `
            <div class="product-card-profit ${lowMargin ? 'product-card-profit--low' : 'product-card-profit--ok'}">
              <span class="product-card-profit-label">Lucro</span>
              <span class="product-card-profit-value">${formatCurrency(lucro)}</span>
              <span class="product-card-margin-badge ${lowMargin ? 'margin-badge--low' : 'margin-badge--ok'}">${margin.toFixed(1)}%</span>
            </div>` : ''}
          </div>

          ${lowMargin ? `<div class="product-card-alert">&#9888; Margem abaixo de 20%</div>` : ''}

          <div class="product-card-meta">
            ${p.quantidade_estoque != null ? `<span>Estoque: <strong>${p.quantidade_estoque}</strong></span>` : ''}
            ${p.tempo_producao_minutos != null ? `<span>Produção: <strong>${p.tempo_producao_minutos} min</strong></span>` : ''}
          </div>
        </div>

        <div class="product-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="ProductPage.toggleStatus(${p.id})" title="${isActive ? 'Desativar' : 'Ativar'}">
            ${isActive ? '&#9724; Desativar' : '&#9654; Ativar'}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="ProductPage.edit(${p.id})">&#9998; Editar</button>
          <button class="btn btn-ghost btn-sm btn-ghost-danger" onclick="ProductPage.confirmDelete(${p.id})">&#128465; Excluir</button>
        </div>
      </div>`;
  }

  function filterProducts(list) {
    if (activeFilter === 'active')   return list.filter(p => Boolean(p.ativo));
    if (activeFilter === 'inactive') return list.filter(p => !p.ativo);
    return list;
  }

  function updateCount(shown, total) {
    if (total === 0) {
      productCount.textContent = '';
      return;
    }
    productCount.textContent = shown === total
      ? `${total} produto${total !== 1 ? 's' : ''}`
      : `${shown} de ${total}`;
  }

  // ══════════════════════════════════════════════════════
  //  FINANCIAL HELPERS
  // ══════════════════════════════════════════════════════

  function calcProfit(venda, custo) {
    if (custo == null || custo === 0) return null;
    return venda - custo;
  }

  function calcMargin(venda, custo) {
    if (custo == null || venda == null || venda === 0) return 0;
    return ((venda - custo) / venda) * 100;
  }

  function formatCurrency(value) {
    if (value == null) return '—';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // ══════════════════════════════════════════════════════
  //  FORM — Open / Close / Submit
  // ══════════════════════════════════════════════════════

  function openCreateModal() {
    editingId = null;
    modalTitle.textContent = 'Novo Produto';
    modalSubtitle.textContent = 'Preencha os dados do produto.';
    btnSubmit.textContent = 'Salvar Produto';
    form.reset();
    clearFieldErrors();
    hideFormAlert();
    hideProfitPreview();
    modal.style.display = 'flex';
  }

  function openEditModal(product) {
    editingId = product.id;
    modalTitle.textContent = 'Editar Produto';
    modalSubtitle.textContent = `Editando "${product.nome}"`;
    btnSubmit.textContent = 'Atualizar Produto';
    clearFieldErrors();
    hideFormAlert();

    // Fill form
    setValue('nome', product.nome);
    setValue('descricao', product.descricao || '');
    setValue('preco_venda', product.preco_venda);
    setValue('preco_custo', product.preco_custo || '');
    setValue('categoria', product.categoria || '');
    setValue('unidade_medida', product.unidade_medida || '');
    setValue('quantidade_estoque', product.quantidade_estoque ?? '');
    setValue('tempo_producao_minutos', product.tempo_producao_minutos ?? '');
    setValue('imagem_url', product.imagem_url || '');

    updateProfitPreview();
    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.style.display = 'none';
    editingId = null;
  }

  function closeDeleteModal() {
    deleteModal.style.display = 'none';
    deletingId = null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearFieldErrors();
    hideFormAlert();

    const data = collectFormData();

    // Client-side validation matching Zod schema
    const errors = validateProduct(data, editingId != null);
    if (errors.length > 0) {
      errors.forEach(err => showFieldError(err.field, err.message));
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = editingId ? 'Atualizando…' : 'Salvando…';

    try {
      let res;
      if (editingId) {
        res = await ApiService.updateProduct(editingId, data);
      } else {
        res = await ApiService.createProduct(data);
      }

      if (res.ok) {
        closeModal();
        await loadProducts();
      } else {
        // Map API errors to field errors
        handleApiErrors(res.data);
      }
    } catch {
      showFormAlert('Erro de conexão. Tente novamente.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = editingId ? 'Atualizar Produto' : 'Salvar Produto';
    }
  }

  // ══════════════════════════════════════════════════════
  //  TOGGLE STATUS (Soft Delete)
  // ══════════════════════════════════════════════════════

  async function toggleStatus(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      const res = await ApiService.updateProduct(id, { ativo: !product.ativo });
      if (res.ok) {
        await loadProducts();
      }
    } catch {
      // silent
    }
  }

  // ══════════════════════════════════════════════════════
  //  DELETE
  // ══════════════════════════════════════════════════════

  function confirmDelete(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    deletingId = id;
    deleteProductName.textContent = product.nome;
    deleteModal.style.display = 'flex';
  }

  async function executeDelete() {
    if (!deletingId) return;

    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.textContent = 'Excluindo…';

    try {
      const res = await ApiService.deleteProduct(deletingId);
      if (res.ok) {
        closeDeleteModal();
        await loadProducts();
      }
    } catch {
      // silent
    } finally {
      btn.disabled = false;
      btn.textContent = 'Excluir';
    }
  }

  // ══════════════════════════════════════════════════════
  //  VALIDATION (mirrors Zod schemas)
  // ══════════════════════════════════════════════════════

  function validateProduct(data, isUpdate) {
    const errors = [];

    if (!isUpdate || data.nome !== undefined) {
      if (!data.nome || data.nome.length < 3) {
        errors.push({ field: 'nome', message: 'O nome deve ter pelo menos 3 caracteres.' });
      }
    }

    if (!isUpdate || data.descricao !== undefined) {
      if (!isUpdate && (!data.descricao || data.descricao.length < 5)) {
        errors.push({ field: 'descricao', message: 'A descrição deve ter pelo menos 5 caracteres.' });
      }
      if (isUpdate && data.descricao && data.descricao.length < 5) {
        errors.push({ field: 'descricao', message: 'A descrição deve ter pelo menos 5 caracteres.' });
      }
    }

    if (!isUpdate) {
      if (data.preco_venda == null || data.preco_venda <= 0) {
        errors.push({ field: 'preco_venda', message: 'O preço de venda deve ser positivo.' });
      }
    } else if (data.preco_venda !== undefined && data.preco_venda <= 0) {
      errors.push({ field: 'preco_venda', message: 'O preço de venda deve ser positivo.' });
    }

    if (data.preco_custo !== undefined && data.preco_custo !== null && data.preco_custo <= 0) {
      errors.push({ field: 'preco_custo', message: 'O preço de custo deve ser positivo.' });
    }

    if (!isUpdate || data.categoria !== undefined) {
      if (!isUpdate && (!data.categoria || data.categoria.length < 3)) {
        errors.push({ field: 'categoria', message: 'A categoria deve ter pelo menos 3 caracteres.' });
      }
      if (isUpdate && data.categoria && data.categoria.length < 3) {
        errors.push({ field: 'categoria', message: 'A categoria deve ter pelo menos 3 caracteres.' });
      }
    }

    if (data.quantidade_estoque !== undefined && data.quantidade_estoque !== null) {
      if (!Number.isInteger(data.quantidade_estoque) || data.quantidade_estoque < 0) {
        errors.push({ field: 'quantidade_estoque', message: 'Quantidade deve ser inteiro não negativo.' });
      }
    }

    if (data.tempo_producao_minutos !== undefined && data.tempo_producao_minutos !== null) {
      if (!Number.isInteger(data.tempo_producao_minutos) || data.tempo_producao_minutos < 0) {
        errors.push({ field: 'tempo_producao_minutos', message: 'Tempo deve ser inteiro não negativo.' });
      }
    }

    if (data.imagem_url && data.imagem_url !== '') {
      try {
        new URL(data.imagem_url);
      } catch {
        errors.push({ field: 'imagem_url', message: 'URL da imagem inválida.' });
      }
    }

    return errors;
  }

  // ══════════════════════════════════════════════════════
  //  FORM HELPERS
  // ══════════════════════════════════════════════════════

  function collectFormData() {
    const raw = {};
    const fields = ['nome', 'descricao', 'preco_venda', 'preco_custo', 'categoria',
                    'unidade_medida', 'quantidade_estoque', 'tempo_producao_minutos', 'imagem_url'];
    const numberFields = ['preco_venda', 'preco_custo', 'quantidade_estoque', 'tempo_producao_minutos'];

    fields.forEach(f => {
      const el = document.getElementById(`f-${f}`);
      if (!el) return;
      const val = el.value.trim();

      if (val === '') {
        // Only send undefined for optional fields on update
        if (editingId) return;
        if (['preco_custo', 'unidade_medida', 'quantidade_estoque', 'tempo_producao_minutos', 'imagem_url'].includes(f)) return;
      }

      if (numberFields.includes(f)) {
        raw[f] = val === '' ? undefined : Number(val);
      } else {
        raw[f] = val;
      }
    });

    return raw;
  }

  function setValue(field, value) {
    const el = document.getElementById(`f-${field}`);
    if (el) el.value = value ?? '';
  }

  function showFieldError(field, msg) {
    const span = document.querySelector(`.field-error[data-for="${field}"]`);
    if (span) {
      span.textContent = msg;
      span.style.display = 'block';
    }
    const input = document.getElementById(`f-${field}`);
    if (input) input.classList.add('input-error');
  }

  function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  function showFormAlert(msg) {
    formAlert.textContent = msg;
    formAlert.style.display = 'block';
  }

  function hideFormAlert() {
    formAlert.style.display = 'none';
  }

  function handleApiErrors(data) {
    if (!data || !data.error) {
      showFormAlert('Erro inesperado ao salvar.');
      return;
    }

    // Zod errors come as semicolon-separated messages
    const message = data.error;
    const messages = message.split('; ');

    const fieldMap = {
      'nome': 'nome',
      'descricao': 'descricao',
      'descrição': 'descricao',
      'preco_venda': 'preco_venda',
      'preço de venda': 'preco_venda',
      'preco_custo': 'preco_custo',
      'preço de custo': 'preco_custo',
      'categoria': 'categoria',
      'unidade_medida': 'unidade_medida',
      'unidade de medida': 'unidade_medida',
      'quantidade_estoque': 'quantidade_estoque',
      'quantidade': 'quantidade_estoque',
      'estoque': 'quantidade_estoque',
      'tempo_producao_minutos': 'tempo_producao_minutos',
      'tempo de produção': 'tempo_producao_minutos',
      'imagem_url': 'imagem_url',
      'imagem': 'imagem_url',
      'url': 'imagem_url',
    };

    let mapped = false;
    messages.forEach(msg => {
      const lower = msg.toLowerCase();
      for (const [keyword, field] of Object.entries(fieldMap)) {
        if (lower.includes(keyword)) {
          showFieldError(field, msg);
          mapped = true;
          break;
        }
      }
    });

    if (!mapped) {
      showFormAlert(message);
    }
  }

  // ── Profit preview in form ─────────────────────────────
  function updateProfitPreview() {
    const venda = parseFloat(document.getElementById('f-preco_venda').value) || 0;
    const custo = parseFloat(document.getElementById('f-preco_custo').value) || 0;

    if (venda > 0 && custo > 0) {
      const lucro = venda - custo;
      const margem = (lucro / venda) * 100;
      profitValue.textContent = formatCurrency(lucro);
      marginValue.textContent = `${margem.toFixed(1)}%`;

      const isLow = margem < 20;
      profitValue.className = `profit-preview-value ${isLow ? 'profit-preview-value--low' : 'profit-preview-value--ok'}`;
      marginValue.className = `profit-preview-margin ${isLow ? 'profit-preview-margin--low' : 'profit-preview-margin--ok'}`;

      profitPreview.style.display = 'flex';
    } else {
      hideProfitPreview();
    }
  }

  function hideProfitPreview() {
    profitPreview.style.display = 'none';
  }

  // ── Real-time field validation ─────────────────────────
  function onFieldBlur(e) {
    const field = e.target.name;
    if (!field) return;

    const data = collectFormData();
    const errors = validateProduct(data, editingId != null);
    const err = errors.find(er => er.field === field);

    // Clear existing error for the field
    const span = document.querySelector(`.field-error[data-for="${field}"]`);
    if (span) { span.textContent = ''; span.style.display = 'none'; }
    e.target.classList.remove('input-error');

    if (err) {
      showFieldError(err.field, err.message);
    }
  }

  // ══════════════════════════════════════════════════════
  //  UI HELPERS
  // ══════════════════════════════════════════════════════

  function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
    if (show) {
      grid.style.display = 'none';
      emptyState.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ══════════════════════════════════════════════════════
  //  EVENT BINDINGS
  // ══════════════════════════════════════════════════════

  function bindEvents() {
    // New product buttons
    document.getElementById('btnNewProduct').addEventListener('click', openCreateModal);
    document.getElementById('btnEmptyNew').addEventListener('click', openCreateModal);

    // Modal close
    document.getElementById('btnCancelModal').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    // Delete modal
    document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('btnConfirmDelete').addEventListener('click', executeDelete);
    deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

    // Form submit
    form.addEventListener('submit', handleSubmit);

    // Profit preview on price change
    document.getElementById('f-preco_venda').addEventListener('input', updateProfitPreview);
    document.getElementById('f-preco_custo').addEventListener('input', updateProfitPreview);

    // Real-time field validation
    form.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('blur', onFieldBlur);
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.filter;
        render();
      });
    });

    // Keyboard: Escape to close modals
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (deleteModal.style.display !== 'none') closeDeleteModal();
        else if (modal.style.display !== 'none') closeModal();
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  PUBLIC API (for inline onclick handlers)
  // ══════════════════════════════════════════════════════

  window.ProductPage = {
    edit(id) {
      const product = products.find(p => p.id === id);
      if (product) openEditModal(product);
    },
    toggleStatus,
    confirmDelete,
  };
});
