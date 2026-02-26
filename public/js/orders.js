/**
 * orders.js — Gerenciador de Encomendas (CRUD + PDV)
 * Padrão similar a clients.js / products.js
 * Depende de: api.js, guard.js
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Guard ──────────────────────────────────────────────
  if (!RouteGuard.requireApproved()) return;
  RouteGuard.renderNavbar();

  // ── State ──────────────────────────────────────────────
  let allOrders = [];
  let clients = [];
  let products = [];
  let clientsMap = {};
  let productsMap = {};
  let cart = [];
  let activeFilter = 'all';
  let searchTerm = '';
  let editingOrderId = null;
  let deletingOrderId = null;
  let currentDetailOrderId = null;

  // ── DOM refs: List ─────────────────────────────────────
  const ordersTableWrap = document.getElementById('ordersTableWrap');
  const ordersBody      = document.getElementById('ordersBody');
  const emptyState      = document.getElementById('emptyState');
  const emptyFilter     = document.getElementById('emptyFilter');
  const loadingState    = document.getElementById('loadingState');
  const orderCount      = document.getElementById('orderCount');
  const searchInput     = document.getElementById('searchInput');

  // ── DOM refs: Create Modal ─────────────────────────────
  const orderModal       = document.getElementById('orderModal');
  const modalTitle       = document.getElementById('modalTitle');
  const modalFeedback    = document.getElementById('modalFeedback');
  const selectClient     = document.getElementById('selectClient');
  const inputDataEntrega = document.getElementById('inputDataEntrega');
  const selectTipoEntrega= document.getElementById('selectTipoEntrega');
  const selectPagamento  = document.getElementById('selectPagamento');
  const inputObservacoes = document.getElementById('inputObservacoes');
  const selectProduct    = document.getElementById('selectProduct');
  const inputQtd         = document.getElementById('inputQtd');
  const cartEmpty        = document.getElementById('cartEmpty');
  const cartTable        = document.getElementById('cartTable');
  const cartBody         = document.getElementById('cartBody');
  const inputTaxaEntrega = document.getElementById('inputTaxaEntrega');
  const inputDesconto    = document.getElementById('inputDesconto');
  const sumSubtotal      = document.getElementById('sumSubtotal');
  const sumTaxa          = document.getElementById('sumTaxa');
  const sumDesconto      = document.getElementById('sumDesconto');
  const sumTotal         = document.getElementById('sumTotal');
  const sumLucro         = document.getElementById('sumLucro');
  const btnSubmitOrder   = document.getElementById('btnSubmitOrder');

  // ── DOM refs: Edit Modal ───────────────────────────────
  const editModal       = document.getElementById('editModal');
  const editTitle       = document.getElementById('editTitle');
  const editForm        = document.getElementById('editForm');
  const editDataEntrega = document.getElementById('editDataEntrega');
  const editDesconto    = document.getElementById('editDesconto');
  const editObservacoes = document.getElementById('editObservacoes');
  const editFeedback    = document.getElementById('editFeedback');

  // ── DOM refs: Detail Modal ─────────────────────────────
  const detailModal   = document.getElementById('detailModal');
  const detailTitle   = document.getElementById('detailTitle');
  const detailContent = document.getElementById('detailContent');

  // ── DOM refs: Delete Modal ─────────────────────────────
  const deleteModal     = document.getElementById('deleteModal');
  const deleteOrderName = document.getElementById('deleteOrderName');

  // ── Init ───────────────────────────────────────────────
  loadData();
  bindEvents();

  // ══════════════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════════════

  async function loadData() {
    showLoading(true);
    try {
      const [ordersRes, clientsRes, productsRes] = await Promise.all([
        ApiService.getOrders(),
        ApiService.getClients(),
        ApiService.getProducts(),
      ]);
      if (ordersRes.ok) allOrders = ordersRes.data || [];
      if (clientsRes.ok) {
        clients = clientsRes.data || [];
        clientsMap = {};
        clients.forEach(c => { clientsMap[c.id] = c; });
      }
      if (productsRes.ok) {
        products = (productsRes.data || []).filter(p => p.ativo !== false && p.ativo !== 0);
        productsMap = {};
        (productsRes.data || []).forEach(p => { productsMap[p.id] = p; });
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
    showLoading(false);
    render();
  }

  // ══════════════════════════════════════════════════════
  //  RENDERING — TABLE
  // ══════════════════════════════════════════════════════

  function render() {
    const filtered = filterOrders(allOrders);
    updateCount(filtered.length, allOrders.length);

    if (allOrders.length === 0) {
      ordersTableWrap.style.display = 'none';
      emptyFilter.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    if (filtered.length === 0) {
      ordersTableWrap.style.display = 'none';
      emptyFilter.style.display = 'flex';
      return;
    }

    emptyFilter.style.display = 'none';
    ordersTableWrap.style.display = '';

    ordersBody.innerHTML = filtered.map(renderRow).join('');
  }

  function renderRow(order) {
    const client = clientsMap[order.client_id];
    const clientName = client ? client.nome : `#${order.client_id}`;

    const deliveryDate = order.data_entrega
      ? new Date(order.data_entrega).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    const statusBadge = getStatusBadge(order.status);
    const paymentBadge = getPaymentBadge(order.status_pagamento);
    const isFinal = order.status === 'entregue' || order.status === 'cancelado';

    return `
      <tr data-order-id="${order.id}">
        <td class="td-mono">${order.id}</td>
        <td>${esc(clientName)}</td>
        <td>${deliveryDate}</td>
        <td>${statusBadge}</td>
        <td>${paymentBadge}</td>
        <td class="td-right td-mono">${formatCurrency(order.valor_total || 0)}</td>
        <td>
          <div class="row-actions">
            <button class="btn-row btn-row--detail" title="Detalhes" data-action="detail" data-id="${order.id}">&#128065;</button>
            ${!isFinal && order.status_pagamento !== 'pago' ? `<button class="btn-row btn-row--pay" title="Marcar como Pago" data-action="pay" data-id="${order.id}">&#128176;</button>` : ''}
            ${!isFinal ? `<button class="btn-row btn-row--edit" title="Editar" data-action="edit" data-id="${order.id}">&#9998;</button>` : ''}
            <button class="btn-row btn-row--delete" title="Excluir" data-action="delete" data-id="${order.id}">&#128465;</button>
          </div>
        </td>
      </tr>`;
  }

  function filterOrders(orders) {
    let filtered = orders;

    // Status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(o => o.status === activeFilter);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => {
        const client = clientsMap[o.client_id];
        const clientName = client ? client.nome.toLowerCase() : '';
        return (
          String(o.id).includes(term) ||
          clientName.includes(term) ||
          (o.observacoes && o.observacoes.toLowerCase().includes(term))
        );
      });
    }

    return filtered;
  }

  function updateCount(shown, total) {
    if (total === 0) { orderCount.textContent = ''; return; }
    orderCount.textContent = shown === total
      ? `${total} encomenda${total !== 1 ? 's' : ''}`
      : `${shown} de ${total}`;
  }

  // ══════════════════════════════════════════════════════
  //  CREATE MODAL (PDV)
  // ══════════════════════════════════════════════════════

  function openCreateModal() {
    cart = [];
    modalTitle.textContent = 'Nova Encomenda';
    hideModalFeedback();
    renderClientSelect();
    renderProductSelect();
    selectClient.value = '';
    inputDataEntrega.value = '';
    selectTipoEntrega.value = 'retirada';
    selectPagamento.value = '';
    inputObservacoes.value = '';
    inputTaxaEntrega.value = '0';
    inputDesconto.value = '0';
    renderCart();
    recalc();
    btnSubmitOrder.disabled = true;
    btnSubmitOrder.textContent = 'Confirmar Encomenda';
    orderModal.style.display = '';
  }

  function closeCreateModal() {
    orderModal.style.display = 'none';
  }

  function renderClientSelect() {
    selectClient.innerHTML = '<option value="">Selecione um cliente</option>';
    clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nome;
      selectClient.appendChild(opt);
    });
  }

  function renderProductSelect() {
    selectProduct.innerHTML = '<option value="">Selecione um produto</option>';
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.nome} — R$ ${fmt(p.preco_venda)}`;
      selectProduct.appendChild(opt);
    });
  }

  function addItemToCart() {
    const productId = Number(selectProduct.value);
    const quantidade = parseInt(inputQtd.value, 10);
    if (!productId) { showModalFeedback('Selecione um produto.', 'error'); return; }
    if (!quantidade || quantidade < 1) { showModalFeedback('Quantidade inválida.', 'error'); return; }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(i => i.product_id === productId);
    if (existing) {
      existing.quantidade += quantidade;
    } else {
      cart.push({
        product_id: productId,
        nome: product.nome,
        quantidade,
        preco_venda: product.preco_venda,
        preco_custo: product.preco_custo || 0,
      });
    }

    selectProduct.value = '';
    inputQtd.value = 1;
    hideModalFeedback();
    renderCart();
    recalc();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    recalc();
  }

  function renderCart() {
    if (cart.length === 0) {
      cartEmpty.style.display = '';
      cartTable.style.display = 'none';
      btnSubmitOrder.disabled = true;
      return;
    }
    cartEmpty.style.display = 'none';
    cartTable.style.display = '';
    btnSubmitOrder.disabled = false;

    cartBody.innerHTML = cart.map((item, idx) => `
      <tr>
        <td>${esc(item.nome)}</td>
        <td>${item.quantidade}</td>
        <td>R$ ${fmt(item.preco_venda)}</td>
        <td class="td-right">R$ ${fmt(item.preco_venda * item.quantidade)}</td>
        <td><button class="btn-remove" data-idx="${idx}" title="Remover">&times;</button></td>
      </tr>`).join('');

    cartBody.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(Number(btn.dataset.idx)));
    });
  }

  function recalc() {
    const subtotal = cart.reduce((s, i) => s + (i.preco_venda * i.quantidade), 0);
    const custoTotal = cart.reduce((s, i) => s + (i.preco_custo * i.quantidade), 0);
    const taxa = parseFloat(inputTaxaEntrega.value) || 0;
    const desconto = parseFloat(inputDesconto.value) || 0;
    const total = Math.max((subtotal + taxa) - desconto, 0);
    const lucro = (subtotal - custoTotal) - desconto;

    sumSubtotal.textContent = `R$ ${fmt(subtotal)}`;
    sumTaxa.textContent     = `R$ ${fmt(taxa)}`;
    sumDesconto.textContent = `- R$ ${fmt(desconto)}`;
    sumTotal.textContent    = `R$ ${fmt(total)}`;
    sumLucro.textContent    = `R$ ${fmt(lucro)}`;
    sumLucro.style.color    = lucro >= 0 ? 'var(--success)' : 'var(--destructive)';
  }

  async function submitOrder() {
    hideModalFeedback();
    const clientId = Number(selectClient.value);
    if (!clientId) { showModalFeedback('Selecione um cliente.', 'error'); return; }
    if (cart.length === 0) { showModalFeedback('Adicione pelo menos um item.', 'error'); return; }

    const payload = {
      client_id: clientId,
      tipo_entrega: selectTipoEntrega.value,
      taxa_entrega: parseFloat(inputTaxaEntrega.value) || 0,
      desconto: parseFloat(inputDesconto.value) || 0,
      items: cart.map(i => ({ product_id: i.product_id, quantidade: i.quantidade })),
    };
    if (inputDataEntrega.value) payload.data_entrega = inputDataEntrega.value;
    if (selectPagamento.value) payload.forma_pagamento = selectPagamento.value;
    const obs = inputObservacoes.value.trim();
    if (obs) payload.observacoes = obs;

    btnSubmitOrder.disabled = true;
    btnSubmitOrder.textContent = 'Enviando…';

    try {
      const res = await ApiService.createOrder(payload);
      if (res.ok) {
        allOrders.unshift(res.data);
        render();
        closeCreateModal();
      } else {
        showModalFeedback(res.data?.error || 'Erro ao criar encomenda.', 'error');
      }
    } catch {
      showModalFeedback('Erro de conexão.', 'error');
    } finally {
      btnSubmitOrder.disabled = false;
      btnSubmitOrder.textContent = 'Confirmar Encomenda';
    }
  }

  // ══════════════════════════════════════════════════════
  //  EDIT MODAL
  // ══════════════════════════════════════════════════════

  function openEdit(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    editingOrderId = orderId;
    editTitle.textContent = `Editar Encomenda #${order.id}`;
    editDataEntrega.value = order.data_entrega ? order.data_entrega.split('T')[0] : '';
    editDesconto.value = order.desconto || 0;
    editObservacoes.value = order.observacoes || '';
    editFeedback.className = 'pdv-feedback';
    editFeedback.textContent = '';
    closeDetail();
    editModal.style.display = '';
  }

  function closeEdit() {
    editModal.style.display = 'none';
    editingOrderId = null;
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editingOrderId) return;

    const data = {};
    const newDate = editDataEntrega.value;
    const newDesconto = parseFloat(editDesconto.value);
    const newObs = editObservacoes.value.trim();

    if (newDate) data.data_entrega = newDate;
    if (!isNaN(newDesconto) && newDesconto >= 0) data.desconto = newDesconto;
    data.observacoes = newObs;

    const btnSave = document.getElementById('btnSaveEdit');
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando...';

    try {
      const res = await ApiService.updateOrder(editingOrderId, data);
      if (res.ok) {
        const idx = allOrders.findIndex(o => o.id === editingOrderId);
        if (idx !== -1) Object.assign(allOrders[idx], res.data || data);
        render();
        closeEdit();
      } else {
        editFeedback.className = 'pdv-feedback error';
        editFeedback.textContent = res.data?.error || 'Erro ao salvar.';
      }
    } catch {
      editFeedback.className = 'pdv-feedback error';
      editFeedback.textContent = 'Erro de conexão.';
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
    }
  }

  // ══════════════════════════════════════════════════════
  //  DETAIL MODAL
  // ══════════════════════════════════════════════════════

  async function openDetail(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    currentDetailOrderId = orderId;

    const client = clientsMap[order.client_id];
    const clientName = client ? client.nome : `Cliente #${order.client_id}`;
    const clientAddr = client ? client.endereco : '';

    detailTitle.textContent = `Encomenda #${order.id}`;
    let itemsHtml = '<p class="detail-loading">Carregando itens...</p>';
    detailContent.innerHTML = buildDetailHtml(order, clientName, clientAddr, itemsHtml);
    detailModal.style.display = '';

    const btnEdit = document.getElementById('detailBtnEdit');
    btnEdit.style.display = (order.status === 'entregue' || order.status === 'cancelado') ? 'none' : '';

    try {
      const itemsRes = await ApiService.getOrderItems(orderId);
      if (itemsRes.ok && itemsRes.data) {
        itemsHtml = renderOrderItems(itemsRes.data);
      } else {
        itemsHtml = '<p class="detail-no-items">Nenhum item encontrado.</p>';
      }
    } catch {
      itemsHtml = '<p class="detail-no-items">Erro ao carregar itens.</p>';
    }
    detailContent.innerHTML = buildDetailHtml(order, clientName, clientAddr, itemsHtml);
  }

  function buildDetailHtml(order, clientName, clientAddr, itemsHtml) {
    const deliveryDate = order.data_entrega
      ? new Date(order.data_entrega).toLocaleDateString('pt-BR')
      : 'Não definida';
    const createdDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString('pt-BR')
      : '—';

    return `
      <div class="detail-section">
        <span class="detail-section-label">Cliente</span>
        <p class="detail-section-value">${esc(clientName)}</p>
        ${clientAddr ? `<p class="detail-section-sub">&#128205; ${esc(clientAddr)}</p>` : ''}
      </div>
      <div class="detail-row">
        <div class="detail-field"><span class="detail-field-label">Status</span>${getStatusBadge(order.status)}</div>
        <div class="detail-field"><span class="detail-field-label">Pagamento</span>${getPaymentBadge(order.status_pagamento)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-field"><span class="detail-field-label">Entrega</span><span>${deliveryDate}</span></div>
        <div class="detail-field"><span class="detail-field-label">Tipo</span><span>${esc(order.tipo_entrega || '—')}</span></div>
      </div>
      <div class="detail-row">
        <div class="detail-field"><span class="detail-field-label">Forma Pgto</span><span>${esc(order.forma_pagamento || '—')}</span></div>
        <div class="detail-field"><span class="detail-field-label">Criado em</span><span>${createdDate}</span></div>
      </div>
      ${order.observacoes ? `<div class="detail-section"><span class="detail-section-label">Observações</span><p class="detail-section-value">${esc(order.observacoes)}</p></div>` : ''}
      <div class="detail-section"><span class="detail-section-label">Itens do Pedido</span>${itemsHtml}</div>
      <div class="detail-totals">
        <div class="detail-total-row"><span>Subtotal</span><span>${formatCurrency(order.valor_subtotal || 0)}</span></div>
        <div class="detail-total-row"><span>Taxa de entrega</span><span>${formatCurrency(order.taxa_entrega || 0)}</span></div>
        <div class="detail-total-row"><span>Desconto</span><span>-${formatCurrency(order.desconto || 0)}</span></div>
        <div class="detail-total-row detail-total-row--main"><span>Total</span><span>${formatCurrency(order.valor_total || 0)}</span></div>
        <div class="detail-total-row detail-total-row--profit"><span>Lucro</span><span>${formatCurrency(order.valor_lucro_total || 0)}</span></div>
      </div>`;
  }

  function renderOrderItems(items) {
    if (!items || items.length === 0) return '<p class="detail-no-items">Nenhum item.</p>';
    return `
      <table class="detail-items-table">
        <thead><tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${items.map(item => {
            const prod = productsMap[item.product_id];
            const nome = item.produto_nome || (prod ? prod.nome : `#${item.product_id}`);
            return `<tr><td>${esc(nome)}</td><td>${item.quantidade}</td><td>${formatCurrency(item.preco_venda_unitario)}</td><td>${formatCurrency(item.preco_venda_unitario * item.quantidade)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  function closeDetail() {
    detailModal.style.display = 'none';
    currentDetailOrderId = null;
  }

  // ══════════════════════════════════════════════════════
  //  DELETE
  // ══════════════════════════════════════════════════════

  function confirmDelete(orderId) {
    deletingOrderId = orderId;
    deleteOrderName.textContent = `#${orderId}`;
    deleteModal.style.display = '';
  }

  function closeDelete() {
    deleteModal.style.display = 'none';
    deletingOrderId = null;
  }

  async function executeDelete() {
    if (!deletingOrderId) return;
    const id = deletingOrderId;
    try {
      const res = await ApiService.deleteOrder(id);
      if (res.ok) {
        allOrders = allOrders.filter(o => o.id !== id);
        render();
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
    closeDelete();
  }

  // ══════════════════════════════════════════════════════
  //  PAYMENT (Optimistic)
  // ══════════════════════════════════════════════════════

  async function confirmPayment(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    const prev = order.status_pagamento;
    order.status_pagamento = 'pago';
    render();
    try {
      const res = await ApiService.updatePaymentStatus(orderId, 'pago');
      if (!res.ok) { order.status_pagamento = prev; render(); }
    } catch { order.status_pagamento = prev; render(); }
  }

  // ══════════════════════════════════════════════════════
  //  EVENT BINDING
  // ══════════════════════════════════════════════════════

  function bindEvents() {
    // New order buttons
    document.getElementById('btnNewOrder').addEventListener('click', openCreateModal);
    document.getElementById('btnEmptyNew').addEventListener('click', openCreateModal);

    // Create modal
    document.getElementById('btnCloseModal').addEventListener('click', closeCreateModal);
    document.getElementById('btnAddItem').addEventListener('click', addItemToCart);
    inputTaxaEntrega.addEventListener('input', recalc);
    inputDesconto.addEventListener('input', recalc);
    btnSubmitOrder.addEventListener('click', submitOrder);

    // Edit modal
    editForm.addEventListener('submit', saveEdit);
    document.getElementById('btnCancelEdit').addEventListener('click', closeEdit);
    document.getElementById('btnCloseEdit').addEventListener('click', closeEdit);

    // Delete modal
    document.getElementById('btnCancelDelete').addEventListener('click', closeDelete);
    document.getElementById('btnConfirmDelete').addEventListener('click', executeDelete);

    // Detail modal
    document.getElementById('detailBtnEdit').addEventListener('click', () => {
      if (currentDetailOrderId) openEdit(currentDetailOrderId);
    });

    // Filters
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        render();
      });
    });

    // Search
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.trim();
      render();
    });

    // Table row actions (delegation)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) {
        // Modal overlays
        if (e.target.classList.contains('modal-overlay')) {
          if (e.target.id === 'orderModal') closeCreateModal();
          else if (e.target.id === 'editModal') closeEdit();
          else if (e.target.id === 'detailModal') closeDetail();
          else if (e.target.id === 'deleteModal') closeDelete();
        }
        if (e.target.id === 'btnCloseDetail' || e.target.id === 'detailBtnClose') closeDetail();
        return;
      }

      const id = Number(btn.dataset.id);
      if (!id) return;

      switch (btn.dataset.action) {
        case 'detail': openDetail(id); break;
        case 'edit':   openEdit(id); break;
        case 'delete': confirmDelete(id); break;
        case 'pay':    confirmPayment(id); break;
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  BADGES & HELPERS
  // ══════════════════════════════════════════════════════

  function getStatusBadge(status) {
    const map = {
      pendente:    '<span class="badge badge-pending">Pendente</span>',
      em_producao: '<span class="badge badge-production">Em Produção</span>',
      pronto:      '<span class="badge badge-delivered">Pronto</span>',
      entregue:    '<span class="badge badge-approved">Entregue</span>',
      cancelado:   '<span class="badge badge-rejected">Cancelado</span>',
    };
    return map[status] || `<span class="badge">${status}</span>`;
  }

  function getPaymentBadge(status) {
    if (status === 'pago') return '<span class="badge badge-approved">Pago</span>';
    if (status === 'pendente') return '<span class="badge badge-pending">A pagar</span>';
    if (status === 'parcial') return '<span class="badge badge-pending">Parcial</span>';
    return '';
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function fmt(value) {
    return Number(value).toFixed(2).replace('.', ',');
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function showLoading(show) {
    loadingState.style.display = show ? '' : 'none';
    if (show) {
      ordersTableWrap.style.display = 'none';
      emptyState.style.display = 'none';
      emptyFilter.style.display = 'none';
    }
  }

  function showModalFeedback(msg, type) {
    modalFeedback.className = `pdv-feedback ${type}`;
    modalFeedback.textContent = msg;
    modalFeedback.style.display = 'block';
  }

  function hideModalFeedback() {
    modalFeedback.style.display = 'none';
    modalFeedback.className = 'pdv-feedback';
  }
});
