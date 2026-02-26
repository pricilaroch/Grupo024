/**
 * dashboard.js — Painel de Controle (Kanban + Inteligência Financeira)
 * Depende de: api.js, guard.js
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Guard ──────────────────────────────────────────────
  if (!RouteGuard.requireApproved()) return;
  RouteGuard.renderNavbar();

  // ── State ──────────────────────────────────────────────
  let allOrders = [];
  let clients = [];          // { id → client } map built after load
  let clientsMap = {};
  let activeFilter = 'all';  // all | today | tomorrow | overdue

  // ── DOM refs ───────────────────────────────────────────
  const welcomeMsg     = document.getElementById('welcomeMsg');
  const loadingState   = document.getElementById('loadingState');
  const kanbanBoard    = document.getElementById('kanbanBoard');
  const emptyState     = document.getElementById('emptyState');
  const emptyFilter    = document.getElementById('emptyFilter');

  const colPending     = document.getElementById('colPending');
  const colProduction  = document.getElementById('colProduction');
  const colDone        = document.getElementById('colDone');

  const countPending   = document.getElementById('countPending');
  const countProduction = document.getElementById('countProduction');
  const countDone      = document.getElementById('countDone');
  const kanbanCount    = document.getElementById('kanbanCount');

  // Financial
  const metricRevenue      = document.getElementById('metricRevenue');
  const metricRevenueHint  = document.getElementById('metricRevenueHint');
  const metricProfit       = document.getElementById('metricProfit');
  const metricProfitMargin = document.getElementById('metricProfitMargin');
  const metricTicket       = document.getElementById('metricTicket');
  const metricTicketHint   = document.getElementById('metricTicketHint');
  const metricPaid         = document.getElementById('metricPaid');
  const metricPaidHint     = document.getElementById('metricPaidHint');

  // Modals
  const detailModal    = document.getElementById('detailModal');
  const detailTitle    = document.getElementById('detailTitle');
  const detailContent  = document.getElementById('detailContent');
  const detailWhatsApp = document.getElementById('detailWhatsApp');
  const whatsappModal  = document.getElementById('whatsappModal');
  const waMessage      = document.getElementById('waMessage');
  const btnSendWA      = document.getElementById('btnSendWA');

  // ── Init ───────────────────────────────────────────────
  setWelcomeMessage();
  bindEvents();
  loadData();

  // ══════════════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════════════

  async function loadData() {
    showLoading(true);
    try {
      const [ordersRes, clientsRes] = await Promise.all([
        ApiService.getOrders(),
        ApiService.getClients()
      ]);

      if (ordersRes.ok) allOrders = ordersRes.data || [];
      if (clientsRes.ok) {
        clients = clientsRes.data || [];
        clientsMap = {};
        clients.forEach(c => { clientsMap[c.id] = c; });
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }

    showLoading(false);
    renderAll();
  }

  // ══════════════════════════════════════════════════════
  //  RENDERING
  // ══════════════════════════════════════════════════════

  function renderAll() {
    const filtered = applyTemporalFilter(allOrders);
    renderFinancialCards(allOrders); // financials always use ALL orders
    renderKanban(filtered);
  }

  // ── Financial Cards ────────────────────────────────────

  function renderFinancialCards(orders) {
    const concluded = orders.filter(o => o.status === 'concluida');
    const totalRevenue = concluded.reduce((s, o) => s + (o.valor_total || 0), 0);
    const totalProfit = concluded.reduce((s, o) => s + (o.valor_lucro_total || 0), 0);
    const avgTicket = concluded.length ? totalRevenue / concluded.length : 0;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

    const paidCount = orders.filter(o => o.status_pagamento === 'pago').length;
    const totalCount = orders.length;

    metricRevenue.textContent = formatCurrency(totalRevenue);
    metricRevenueHint.textContent = `${concluded.length} pedido${concluded.length !== 1 ? 's' : ''} finalizado${concluded.length !== 1 ? 's' : ''}`;

    metricProfit.textContent = formatCurrency(totalProfit);
    metricProfitMargin.textContent = `Margem: ${margin.toFixed(1)}%`;

    // Color profit based on value
    metricProfit.classList.toggle('finance-value--success', totalProfit >= 0);
    metricProfit.classList.toggle('finance-value--danger', totalProfit < 0);

    metricTicket.textContent = formatCurrency(avgTicket);
    metricTicketHint.textContent = concluded.length ? 'por pedido finalizado' : 'sem dados';

    metricPaid.textContent = `${paidCount} / ${totalCount}`;
    metricPaidHint.textContent = paidCount === totalCount && totalCount > 0
      ? '✓ Todos pagos!'
      : `${totalCount - paidCount} pendente${(totalCount - paidCount) !== 1 ? 's' : ''}`;
  }

  // ── Kanban Board ───────────────────────────────────────

  function renderKanban(orders) {
    const pending = orders.filter(o => o.status === 'pendente');
    const production = orders.filter(o => o.status === 'concluida');
    const done = orders.filter(o => o.status === 'cancelada');

    countPending.textContent = pending.length;
    countProduction.textContent = production.length;
    countDone.textContent = done.length;
    kanbanCount.textContent = `${orders.length} encomenda${orders.length !== 1 ? 's' : ''}`;

    colPending.innerHTML = pending.length
      ? pending.map(o => renderOrderCard(o)).join('')
      : columnEmpty('Nenhum pedido pendente', '&#9996;');

    colProduction.innerHTML = production.length
      ? production.map(o => renderOrderCard(o)).join('')
      : columnEmpty('Nenhum pedido concluído', '&#10003;');

    colDone.innerHTML = done.length
      ? done.map(o => renderOrderCard(o)).join('')
      : columnEmpty('Nenhum pedido cancelado', '&#128161;');

    // Show/hide states
    const hasOrders = orders.length > 0;
    const hasAnyOrders = allOrders.length > 0;

    kanbanBoard.style.display = hasAnyOrders ? '' : 'none';
    emptyState.style.display = !hasAnyOrders ? '' : 'none';
    emptyFilter.style.display = hasAnyOrders && !hasOrders ? '' : 'none';
  }

  function renderOrderCard(order) {
    const client = clientsMap[order.client_id];
    const clientName = client ? client.nome : `Cliente #${order.client_id}`;
    const clientPhone = client ? client.telefone : '';

    const deliveryDate = order.data_entrega ? parseDate(order.data_entrega) : null;
    const urgencyBadge = getUrgencyBadge(deliveryDate, order.status);
    const statusBadge = getStatusBadge(order.status);
    const paymentBadge = getPaymentBadge(order.status_pagamento);

    const dateStr = deliveryDate
      ? deliveryDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      : 'Sem data';

    const actionButtons = getActionButtons(order);

    return `
      <div class="kanban-card" data-order-id="${order.id}">
        <div class="kanban-card-top">
          <span class="kanban-card-id">#${order.id}</span>
          <div class="kanban-card-badges">
            ${urgencyBadge}
            ${paymentBadge}
          </div>
        </div>

        <div class="kanban-card-client">${escapeHtml(clientName)}</div>

        <div class="kanban-card-meta-row">
          <span class="kanban-card-date">&#128197; ${dateStr}</span>
          <span class="kanban-card-value">${formatCurrency(order.valor_total || 0)}</span>
        </div>

        ${order.observacoes ? `<div class="kanban-card-obs">${escapeHtml(truncate(order.observacoes, 60))}</div>` : ''}

        <div class="kanban-card-footer">
          ${statusBadge}
          <div class="kanban-card-actions">
            ${clientPhone ? `<button class="btn-card btn-card--wa" title="WhatsApp" data-order-id="${order.id}">&#128172;</button>` : ''}
            <button class="btn-card btn-card--detail" title="Detalhes" data-order-id="${order.id}">&#128065;</button>
            ${actionButtons}
          </div>
        </div>
      </div>`;
  }

  function getActionButtons(order) {
    if (order.status === 'pendente') {
      return `
        <button class="btn-card btn-card--advance" title="Concluir" data-order-id="${order.id}" data-next-status="concluida">&#10003;</button>
        <button class="btn-card btn-card--cancel" title="Cancelar" data-order-id="${order.id}" data-next-status="cancelada">&times;</button>`;
    }
    if (order.status === 'concluida') {
      return ''; // Final state – no action
    }
    return ''; // cancelada – no action
  }

  function getUrgencyBadge(deliveryDate, status) {
    if (!deliveryDate || status === 'concluida' || status === 'cancelada') return '';

    const today = startOfDay(new Date());
    const delivery = startOfDay(deliveryDate);
    const diffDays = Math.ceil((delivery - today) / 86400000);

    if (diffDays < 0) return '<span class="badge badge-rejected">Atrasado</span>';
    if (diffDays === 0) return '<span class="badge badge-pending">Hoje</span>';
    if (diffDays === 1) return '<span class="badge badge-delivered">Amanhã</span>';
    return '';
  }

  function getStatusBadge(status) {
    const map = {
      pendente:  '<span class="badge badge-pending">Pendente</span>',
      concluida: '<span class="badge badge-approved">Concluída</span>',
      cancelada: '<span class="badge badge-rejected">Cancelada</span>',
    };
    return map[status] || `<span class="badge">${status}</span>`;
  }

  function getPaymentBadge(status) {
    if (status === 'pago') return '<span class="badge badge-approved">Pago</span>';
    if (status === 'pendente') return '<span class="badge badge-pending">A pagar</span>';
    return '';
  }

  function columnEmpty(text, icon) {
    return `
      <div class="kanban-col-empty">
        <span class="kanban-col-empty-icon">${icon}</span>
        <p>${text}</p>
      </div>`;
  }

  // ══════════════════════════════════════════════════════
  //  TEMPORAL FILTERS
  // ══════════════════════════════════════════════════════

  function applyTemporalFilter(orders) {
    if (activeFilter === 'all') return orders;

    const today = startOfDay(new Date());

    return orders.filter(order => {
      if (!order.data_entrega) return false;
      const delivery = startOfDay(parseDate(order.data_entrega));
      const diffDays = Math.ceil((delivery - today) / 86400000);

      switch (activeFilter) {
        case 'today':    return diffDays === 0;
        case 'tomorrow': return diffDays === 1;
        case 'overdue':  return diffDays < 0 && order.status === 'pendente';
        default:         return true;
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  STATUS UPDATE (Optimistic)
  // ══════════════════════════════════════════════════════

  async function updateOrderStatus(orderId, newStatus) {
    // Optimistic update
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const prevStatus = order.status;
    order.status = newStatus;
    renderAll();

    try {
      const res = await ApiService.updateOrderStatus(orderId, newStatus);
      if (!res.ok) {
        // Rollback
        order.status = prevStatus;
        renderAll();
        console.error('Falha ao atualizar status:', res.data);
      }
    } catch (err) {
      // Rollback
      order.status = prevStatus;
      renderAll();
      console.error('Erro na atualização de status:', err);
    }
  }

  // ══════════════════════════════════════════════════════
  //  ORDER DETAIL MODAL
  // ══════════════════════════════════════════════════════

  async function openDetail(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const client = clientsMap[order.client_id];
    const clientName = client ? client.nome : `Cliente #${order.client_id}`;
    const clientPhone = client ? client.telefone : '';
    const clientAddr = client ? client.endereco : '';

    detailTitle.textContent = `Encomenda #${order.id}`;

    // Fetch items
    let itemsHtml = '<p class="detail-loading">Carregando itens...</p>';
    detailContent.innerHTML = buildDetailHtml(order, clientName, clientAddr, itemsHtml);

    // Show modal
    detailModal.style.display = '';

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

    // WhatsApp link
    if (clientPhone) {
      const waUrl = buildWhatsAppUrl(clientPhone, order, clientName);
      detailWhatsApp.href = waUrl;
      detailWhatsApp.style.display = '';
    } else {
      detailWhatsApp.style.display = 'none';
    }
  }

  function buildDetailHtml(order, clientName, clientAddr, itemsHtml) {
    const deliveryDate = order.data_entrega
      ? parseDate(order.data_entrega).toLocaleDateString('pt-BR')
      : 'Não definida';

    const createdDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString('pt-BR')
      : '—';

    return `
      <div class="detail-section">
        <span class="detail-section-label">Cliente</span>
        <p class="detail-section-value">${escapeHtml(clientName)}</p>
        ${clientAddr ? `<p class="detail-section-sub">&#128205; ${escapeHtml(clientAddr)}</p>` : ''}
      </div>

      <div class="detail-row">
        <div class="detail-field">
          <span class="detail-field-label">Status</span>
          ${getStatusBadge(order.status)}
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Pagamento</span>
          ${getPaymentBadge(order.status_pagamento)}
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-field">
          <span class="detail-field-label">Entrega</span>
          <span>${deliveryDate}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Tipo</span>
          <span>${escapeHtml(order.tipo_entrega || '—')}</span>
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-field">
          <span class="detail-field-label">Forma Pgto</span>
          <span>${escapeHtml(order.forma_pagamento || '—')}</span>
        </div>
        <div class="detail-field">
          <span class="detail-field-label">Criado em</span>
          <span>${createdDate}</span>
        </div>
      </div>

      ${order.observacoes ? `
      <div class="detail-section">
        <span class="detail-section-label">Observações</span>
        <p class="detail-section-value">${escapeHtml(order.observacoes)}</p>
      </div>` : ''}

      <div class="detail-section">
        <span class="detail-section-label">Itens do Pedido</span>
        ${itemsHtml}
      </div>

      <div class="detail-totals">
        <div class="detail-total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(order.valor_subtotal || 0)}</span>
        </div>
        <div class="detail-total-row">
          <span>Taxa de entrega</span>
          <span>${formatCurrency(order.taxa_entrega || 0)}</span>
        </div>
        <div class="detail-total-row">
          <span>Desconto</span>
          <span>-${formatCurrency(order.desconto || 0)}</span>
        </div>
        <div class="detail-total-row detail-total-row--main">
          <span>Total</span>
          <span>${formatCurrency(order.valor_total || 0)}</span>
        </div>
        <div class="detail-total-row detail-total-row--profit">
          <span>Lucro</span>
          <span>${formatCurrency(order.valor_lucro_total || 0)}</span>
        </div>
      </div>`;
  }

  function renderOrderItems(items) {
    if (!items || items.length === 0) return '<p class="detail-no-items">Nenhum item.</p>';

    return `
      <table class="detail-items-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Preço Unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>#${item.product_id}</td>
              <td>${item.quantidade}</td>
              <td>${formatCurrency(item.preco_venda_unitario)}</td>
              <td>${formatCurrency(item.preco_venda_unitario * item.quantidade)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function closeDetail() {
    detailModal.style.display = 'none';
  }

  // ══════════════════════════════════════════════════════
  //  WHATSAPP MESSAGE GENERATOR
  // ══════════════════════════════════════════════════════

  function openWhatsAppModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const client = clientsMap[order.client_id];
    if (!client || !client.telefone) return;

    const message = buildWhatsAppMessage(order, client);
    waMessage.value = message;

    const phone = cleanPhone(client.telefone);
    btnSendWA.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    whatsappModal.style.display = '';
  }

  function buildWhatsAppMessage(order, client) {
    const user = ApiService.getUser();
    const senderName = user ? user.nome.split(' ')[0] : 'Produtor';

    const deliveryDate = order.data_entrega
      ? parseDate(order.data_entrega).toLocaleDateString('pt-BR')
      : 'a combinar';

    const statusMap = {
      pendente: 'Em preparo',
      concluida: 'Pronto para entrega/retirada',
      cancelada: 'Cancelado',
    };

    const lines = [
      `Olá, ${client.nome.split(' ')[0]}! 👋`,
      ``,
      `Aqui é ${senderName}, seu pedido *#${order.id}* está com status: *${statusMap[order.status] || order.status}*`,
      ``,
      `📅 Entrega: ${deliveryDate}`,
      `🚚 Tipo: ${order.tipo_entrega || 'A combinar'}`,
      `💰 Total: ${formatCurrency(order.valor_total || 0)}`,
    ];

    if (order.observacoes) {
      lines.push(`📝 Obs: ${order.observacoes}`);
    }

    lines.push('', `Qualquer dúvida, estou à disposição! 😊`);

    return lines.join('\n');
  }

  function buildWhatsAppUrl(phone, order, clientName) {
    const client = clientsMap[order.client_id];
    const message = client ? buildWhatsAppMessage(order, client) : '';
    const cleanNum = cleanPhone(phone);
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
  }

  function closeWhatsApp() {
    whatsappModal.style.display = 'none';
  }

  // ══════════════════════════════════════════════════════
  //  EVENT BINDING
  // ══════════════════════════════════════════════════════

  function bindEvents() {
    // Temporal filters
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderAll();
      });
    });

    // Kanban card action delegation
    document.addEventListener('click', (e) => {
      const target = e.target;

      // Status advance / cancel
      if (target.closest('.btn-card--advance') || target.closest('.btn-card--cancel')) {
        const btn = target.closest('.btn-card--advance') || target.closest('.btn-card--cancel');
        const orderId = Number(btn.dataset.orderId);
        const nextStatus = btn.dataset.nextStatus;
        if (orderId && nextStatus) {
          updateOrderStatus(orderId, nextStatus);
        }
        return;
      }

      // Detail
      if (target.closest('.btn-card--detail')) {
        const btn = target.closest('.btn-card--detail');
        const orderId = Number(btn.dataset.orderId);
        if (orderId) openDetail(orderId);
        return;
      }

      // WhatsApp from card
      if (target.closest('.btn-card--wa')) {
        const btn = target.closest('.btn-card--wa');
        const orderId = Number(btn.dataset.orderId);
        if (orderId) openWhatsAppModal(orderId);
        return;
      }

      // Close detail modal
      if (target.id === 'btnCloseDetail' || target.id === 'detailBtnClose' || (target.classList.contains('modal-overlay') && target.id === 'detailModal')) {
        closeDetail();
        return;
      }

      // Close WA modal
      if (target.id === 'btnCloseWA' || (target.classList.contains('modal-overlay') && target.id === 'whatsappModal')) {
        closeWhatsApp();
        return;
      }
    });

    // Copy WA message
    document.getElementById('btnCopyWA').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(waMessage.value);
        const btn = document.getElementById('btnCopyWA');
        const orig = btn.innerHTML;
        btn.innerHTML = '&#10003; Copiado!';
        setTimeout(() => { btn.innerHTML = orig; }, 1500);
      } catch {
        waMessage.select();
        document.execCommand('copy');
      }
    });

    // WhatsApp from detail modal
    detailWhatsApp.addEventListener('click', (e) => {
      // default link behavior opens wa.me
    });
  }

  // ══════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════

  function setWelcomeMessage() {
    const user = ApiService.getUser();
    if (user) {
      welcomeMsg.textContent = `Olá, ${user.nome.split(' ')[0]}!`;
    }
  }

  function showLoading(show) {
    loadingState.style.display = show ? '' : 'none';
    if (show) {
      kanbanBoard.style.display = 'none';
      emptyState.style.display = 'none';
      emptyFilter.style.display = 'none';
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  function cleanPhone(phone) {
    const digits = (phone || '').replace(/\D/g, '');
    // If starts with 0, remove leading 0
    // If doesn't start with 55 (Brazil), prepend 55
    if (digits.startsWith('55')) return digits;
    if (digits.startsWith('0')) return '55' + digits.slice(1);
    return '55' + digits;
  }

  function parseDate(dateStr) {
    if (!dateStr) return null;
    // Handle ISO string or YYYY-MM-DD
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
});
