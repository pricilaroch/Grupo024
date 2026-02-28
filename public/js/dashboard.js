/**
 * dashboard.js — Painel de Controle (Kanban 3-col + Histórico + Inteligência Financeira)
 * Fluxo: pendente → em_producao → pronto → entregue (ou cancelado)
 * Depende de: api.js, guard.js
 *
 * Previsão  = orders entregues excluindo status_pagamento === 'pago'
 * Realizado = sales (GET /sales — livro caixa real)
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Guard ──────────────────────────────────────────────
  if (!RouteGuard.requireApproved()) return;
  RouteGuard.renderNavbar();

  // ── State ──────────────────────────────────────────────
  let allOrders = [];
  let allSales  = [];      // from GET /sales
  let goalData  = null;    // from GET /analytics/goal
  let balanceData = null;  // from GET /analytics/balance
  let followUpData = null; // from GET /sales/follow-up
  let clients = [];
  let clientsMap = {};
  let productsMap = {};   // id → product (for materials summary)
  let activeFilter = 'all';
  let financeMode = 'previsao'; // 'previsao' or 'realizado'
  let dateRange   = 'month';   // 'today' | 'month' | 'total'
  let activeTab = 'production'; // 'production' or 'history'
  let currentDetailOrderId = null;

  // Goal meta (persisted in localStorage)
  const META_KEY = 'dashboard_meta_mensal';
  let metaMensal = parseFloat(localStorage.getItem(META_KEY)) || 0;

  // ── DOM refs ───────────────────────────────────────────
  const welcomeMsg     = document.getElementById('welcomeMsg');
  const loadingState   = document.getElementById('loadingState');
  const kanbanBoard    = document.getElementById('kanbanBoard');
  const emptyState     = document.getElementById('emptyState');
  const emptyFilter    = document.getElementById('emptyFilter');

  const colPending     = document.getElementById('colPending');
  const colProduction  = document.getElementById('colProduction');
  const colReady       = document.getElementById('colReady');

  const countPending    = document.getElementById('countPending');
  const countProduction = document.getElementById('countProduction');
  const countReady      = document.getElementById('countReady');
  const kanbanCount     = document.getElementById('kanbanCount');

  // Financial
  const metricRevenue      = document.getElementById('metricRevenue');
  const metricRevenueHint  = document.getElementById('metricRevenueHint');
  const metricProfit       = document.getElementById('metricProfit');
  const metricProfitMargin = document.getElementById('metricProfitMargin');
  const metricTicket       = document.getElementById('metricTicket');
  const metricTicketHint   = document.getElementById('metricTicketHint');
  const metricPaid         = document.getElementById('metricPaid');
  const metricPaidHint     = document.getElementById('metricPaidHint');

  // Pending Payments
  const pendingPayments     = document.getElementById('pendingPayments');
  const pendingPaymentTotal = document.getElementById('pendingPaymentTotal');
  const pendingPaymentsList = document.getElementById('pendingPaymentsList');

  // Goal / Caixinha
  const metaFill      = document.getElementById('metaFill');
  const metaRealized  = document.getElementById('metaRealized');
  const metaTarget    = document.getElementById('metaTarget');
  const metaPct       = document.getElementById('metaPct');
  const caixinhaValue = document.getElementById('caixinhaValue');

  // Performance
  const perfFollowUp       = document.getElementById('perfFollowUp');
  const perfFollowUpHint   = document.getElementById('perfFollowUpHint');
  const perfRecompra       = document.getElementById('perfRecompra');
  const perfRecompraHint   = document.getElementById('perfRecompraHint');
  const perfSalesMonth     = document.getElementById('perfSalesMonth');
  const perfSalesMonthHint = document.getElementById('perfSalesMonthHint');

  // Charts
  const chartSalesMonth = document.getElementById('chartSalesMonth');
  const pieRepurchase   = document.getElementById('pieRepurchase');
  const pieLegend       = document.getElementById('pieLegend');

  // Materials
  const materialsSummary = document.getElementById('materialsSummary');
  const materialsList    = document.getElementById('materialsList');

  // Tabs & History
  const tabProduction   = document.getElementById('tabProduction');
  const tabHistory      = document.getElementById('tabHistory');
  const historyContent  = document.getElementById('historyContent');
  const historyCount    = document.getElementById('historyCount');
  const historyEmpty    = document.getElementById('historyEmpty');

  // Modals
  const detailModal    = document.getElementById('detailModal');
  const detailTitle    = document.getElementById('detailTitle');
  const detailContent  = document.getElementById('detailContent');
  const detailWhatsApp = document.getElementById('detailWhatsApp');
  const whatsappModal  = document.getElementById('whatsappModal');
  const waMessage      = document.getElementById('waMessage');
  const btnSendWA      = document.getElementById('btnSendWA');

  // Edit modal
  const editModal       = document.getElementById('editModal');
  const editTitle       = document.getElementById('editTitle');
  const editForm        = document.getElementById('editForm');
  const editDataEntrega = document.getElementById('editDataEntrega');
  const editDesconto    = document.getElementById('editDesconto');
  const editObservacoes = document.getElementById('editObservacoes');
  const editFeedback    = document.getElementById('editFeedback');

  let editingOrderId = null;

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
      const [ordersRes, clientsRes, productsRes, salesRes, balanceRes, followUpRes] = await Promise.all([
        ApiService.getOrders(),
        ApiService.getClients(),
        ApiService.getProducts(),
        ApiService.getSales(),
        ApiService.getBalance(),
        ApiService.getFollowUp(),
      ]);

      if (ordersRes.ok) allOrders = ordersRes.data || [];
      if (salesRes.ok)  allSales  = salesRes.data || [];
      if (balanceRes.ok) balanceData = balanceRes.data;
      if (followUpRes.ok) followUpData = followUpRes.data;
      if (clientsRes.ok) {
        clients = clientsRes.data || [];
        clientsMap = {};
        clients.forEach(c => { clientsMap[c.id] = c; });
      }
      if (productsRes.ok) {
        const prods = productsRes.data || [];
        productsMap = {};
        prods.forEach(p => { productsMap[p.id] = p; });
      }

      // Fetch goal from server (meta stored in localStorage)
      try {
        const goalRes = await ApiService.getGoalSummary(metaMensal);
        if (goalRes.ok) goalData = goalRes.data;
      } catch (_) { /* ignore */ }
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
    renderGoalAndCaixinha();
    renderFinancialCards();
    renderPerformanceIndicators();
    renderCharts();
    renderPendingPayments(allOrders);
    renderMaterialsSummary(allOrders);
    renderKanban(filtered);
    renderHistory(allOrders);
  }

  // ── Date Range Helpers ─────────────────────────────────

  function getDateRangeBounds() {
    const now = new Date();
    if (dateRange === 'today') {
      const s = startOfDay(now);
      const e = new Date(s); e.setDate(e.getDate() + 1);
      return { start: s, end: e };
    }
    if (dateRange === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start: s, end: e };
    }
    return { start: null, end: null }; // total — no filter
  }

  function filterByDateRange(items, dateField) {
    const { start, end } = getDateRangeBounds();
    if (!start) return items; // total
    return items.filter(item => {
      const d = item[dateField] ? new Date(item[dateField]) : null;
      return d && d >= start && d < end;
    });
  }

  // ── Goal + Caixinha ────────────────────────────────────

  function renderGoalAndCaixinha() {
    // Use server-calculated goal data when available
    if (goalData) {
      var realized = goalData.realizado;
      var pct = goalData.percentual;
      var caixinha = goalData.caixinha;

      metaFill.style.width = pct.toFixed(1) + '%';
      metaRealized.textContent = formatCurrency(realized);
      metaTarget.textContent = metaMensal > 0 ? 'Meta: ' + formatCurrency(metaMensal) : 'Meta: não definida';
      metaPct.textContent = metaMensal > 0 ? pct.toFixed(0) + '%' : '—';

      metaFill.classList.remove('goal-fill--ok', 'goal-fill--warn', 'goal-fill--danger');
      if (pct >= 80) metaFill.classList.add('goal-fill--ok');
      else if (pct >= 40) metaFill.classList.add('goal-fill--warn');
      else metaFill.classList.add('goal-fill--danger');

      caixinhaValue.textContent = formatCurrency(caixinha);
      return;
    }

    // Fallback: client-side calculation
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var monthSales = allSales.filter(s => {
      var d = s.data_venda ? new Date(s.data_venda) : null;
      return d && d >= monthStart && d < monthEnd;
    });

    var fbRealized = monthSales.reduce((s, v) => s + (v.valor_total || 0), 0);
    var fbRealizedProfit = monthSales.reduce((s, v) => s + (v.valor_lucro || 0), 0);

    var fbPct = metaMensal > 0 ? Math.min((fbRealized / metaMensal) * 100, 100) : 0;
    metaFill.style.width = fbPct.toFixed(1) + '%';
    metaRealized.textContent = formatCurrency(fbRealized);
    metaTarget.textContent = metaMensal > 0 ? `Meta: ${formatCurrency(metaMensal)}` : 'Meta: não definida';
    metaPct.textContent = metaMensal > 0 ? `${fbPct.toFixed(0)}%` : '—';

    metaFill.classList.remove('goal-fill--ok', 'goal-fill--warn', 'goal-fill--danger');
    if (fbPct >= 80) metaFill.classList.add('goal-fill--ok');
    else if (fbPct >= 40) metaFill.classList.add('goal-fill--warn');
    else metaFill.classList.add('goal-fill--danger');

    caixinhaValue.textContent = formatCurrency(fbRealizedProfit * 0.1);
  }

  // ── Financial Cards ────────────────────────────────────

  function renderFinancialCards() {
    let totalRevenue, totalProfit, count, modeLabel;

    if (financeMode === 'realizado') {
      // Realizado: dados do Livro Caixa (GET /sales)
      const filtered = filterByDateRange(allSales, 'data_venda');
      totalRevenue = filtered.reduce((s, v) => s + (v.valor_total || 0), 0);
      totalProfit  = filtered.reduce((s, v) => s + (v.valor_lucro || 0), 0);
      count = filtered.length;
      modeLabel = 'vendas';
    } else {
      // Previsão: orders entregues EXCLUINDO as já pagas (evita overlap)
      const delivered = allOrders.filter(o => o.status === 'entregue' && o.status_pagamento !== 'pago');
      const filtered = filterByDateRange(delivered, 'updated_at');
      totalRevenue = filtered.reduce((s, o) => s + (o.valor_total || 0), 0);
      totalProfit  = filtered.reduce((s, o) => s + (o.valor_lucro_total || 0), 0);
      count = filtered.length;
      modeLabel = 'previstos';
    }

    const avgTicket = count ? totalRevenue / count : 0;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

    const paidCount = allOrders.filter(o => o.status_pagamento === 'pago').length;
    const totalCount = allOrders.filter(o => o.status !== 'cancelado').length;

    metricRevenue.textContent = formatCurrency(totalRevenue);
    metricRevenueHint.textContent = `${count} ${modeLabel}`;

    metricProfit.textContent = formatCurrency(totalProfit);
    metricProfitMargin.textContent = `Margem: ${margin.toFixed(1)}%`;
    metricProfit.classList.toggle('finance-value--success', totalProfit >= 0);
    metricProfit.classList.toggle('finance-value--danger', totalProfit < 0);

    metricTicket.textContent = formatCurrency(avgTicket);
    metricTicketHint.textContent = count ? `por ${financeMode === 'realizado' ? 'venda' : 'pedido'}` : 'sem dados';

    metricPaid.textContent = `${paidCount} / ${totalCount}`;
    const pendingPayment = totalCount - paidCount;
    metricPaidHint.textContent = paidCount === totalCount && totalCount > 0
      ? '✓ Todos pagos!'
      : `${pendingPayment} pendente${pendingPayment !== 1 ? 's' : ''}`;
  }

  // ── Performance Indicators ─────────────────────────────

  function renderPerformanceIndicators() {
    // 1) Follow-up: use server JOIN endpoint data when available
    if (followUpData && followUpData.count > 0) {
      var avg = followUpData.avg_days;
      perfFollowUp.textContent = avg < 1 ? '< 1 dia' : avg.toFixed(1) + ' dias';
      perfFollowUpHint.textContent = 'baseado em ' + followUpData.count + ' vendas';
    } else {
      perfFollowUp.textContent = '— dias';
      perfFollowUpHint.textContent = 'sem dados';
    }

    // 2) Índice de Recompra: % clientes com >1 venda finalizada
    const clientSalesCount = {};
    let uniqueClients = 0;
    let repeatClients = 0;
    allSales.forEach(s => {
      if (s.client_id) {
        clientSalesCount[s.client_id] = (clientSalesCount[s.client_id] || 0) + 1;
      }
    });
    Object.values(clientSalesCount).forEach(cnt => {
      uniqueClients++;
      if (cnt > 1) repeatClients++;
    });
    const repurchasePct = uniqueClients > 0 ? (repeatClients / uniqueClients * 100) : 0;
    perfRecompra.textContent = `${repurchasePct.toFixed(0)}%`;
    perfRecompraHint.textContent = `${repeatClients} de ${uniqueClients} clientes`;

    // 3) Vendas do mês
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthSales = allSales.filter(s => {
      const d = s.data_venda ? new Date(s.data_venda) : null;
      return d && d >= monthStart && d < monthEnd;
    });
    perfSalesMonth.textContent = monthSales.length;
    const monthRevenue = monthSales.reduce((s, v) => s + (v.valor_total || 0), 0);
    perfSalesMonthHint.textContent = `${formatCurrency(monthRevenue)} este mês`;
  }

  // ── Charts ─────────────────────────────────────────────

  function renderCharts() {
    renderBarChart();
    renderPieChart();
  }

  function renderBarChart() {
    // Last 6 months of sales
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
        revenue: 0,
      });
    }

    allSales.forEach(s => {
      const d = s.data_venda ? new Date(s.data_venda) : null;
      if (!d) return;
      const bucket = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (bucket) {
        bucket.count++;
        bucket.revenue += s.valor_total || 0;
      }
    });

    const maxRevenue = Math.max(...months.map(m => m.revenue), 1);

    chartSalesMonth.innerHTML = months.map(m => {
      const pct = (m.revenue / maxRevenue * 100).toFixed(1);
      return `
        <div class="chart-bar-col">
          <div class="chart-bar-value">${formatCurrency(m.revenue)}</div>
          <div class="chart-bar" style="height:${Math.max(pct, 2)}%"></div>
          <span class="chart-bar-label">${m.label}</span>
        </div>`;
    }).join('');
  }

  function renderPieChart() {
    // Pie: "Novos" vs "Recorrentes"
    const clientSalesCount = {};
    allSales.forEach(s => {
      if (s.client_id) clientSalesCount[s.client_id] = (clientSalesCount[s.client_id] || 0) + 1;
    });

    let newClients = 0, repeatClients = 0;
    Object.values(clientSalesCount).forEach(cnt => {
      if (cnt > 1) repeatClients++; else newClients++;
    });

    // Also count anonymous sales
    const anonCount = allSales.filter(s => !s.client_id).length;

    const total = newClients + repeatClients + (anonCount > 0 ? 1 : 0);
    if (total === 0) {
      pieRepurchase.parentElement.innerHTML = '<p class="chart-empty">Sem dados de clientes</p>';
      return;
    }

    // Draw SVG pie (simple 2-3 segment)
    const segments = [];
    if (repeatClients > 0) segments.push({ label: 'Recorrentes', value: repeatClients, color: '#16a34a' });
    if (newClients > 0)    segments.push({ label: 'Novos', value: newClients, color: '#3b82f6' });
    if (anonCount > 0)     segments.push({ label: 'Anônimos', value: anonCount, color: '#a1a1aa' });

    const segTotal = segments.reduce((s, seg) => s + seg.value, 0);

    // Canvas pie
    const canvas = pieRepurchase;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2, r = 65;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
      const slice = (seg.value / segTotal) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      startAngle += slice;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(segTotal, cx, cy - 6);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('clientes', cx, cy + 10);

    // Legend
    pieLegend.innerHTML = segments.map(seg => {
      const pct = (seg.value / segTotal * 100).toFixed(0);
      return `<span class="chart-legend-item"><span class="chart-legend-dot" style="background:${seg.color}"></span>${seg.label}: ${seg.value} (${pct}%)</span>`;
    }).join('');
  }

  // ── Pending Payments ───────────────────────────────────

  function renderPendingPayments(orders) {
    const pending = orders.filter(o =>
      o.status !== 'cancelado' && o.status_pagamento !== 'pago'
    );

    if (pending.length === 0) {
      pendingPayments.style.display = 'none';
      return;
    }

    const totalPending = pending.reduce((s, o) => s + (o.valor_total || 0), 0);
    pendingPaymentTotal.textContent = formatCurrency(totalPending);
    pendingPayments.style.display = '';

    pendingPaymentsList.innerHTML = pending.map(o => {
      const client = clientsMap[o.client_id];
      const clientName = client ? client.nome : `#${o.client_id}`;
      const dateStr = o.data_entrega
        ? parseDate(o.data_entrega).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        : '—';
      return `
        <div class="pending-payment-item">
          <div class="pending-payment-info">
            <span class="pending-payment-id">#${o.id}</span>
            <span class="pending-payment-client">${escapeHtml(clientName)}</span>
            <span class="pending-payment-date">${dateStr}</span>
          </div>
          <div class="pending-payment-right">
            <span class="pending-payment-value">${formatCurrency(o.valor_total || 0)}</span>
            <button class="btn-card btn-card--pay" title="Confirmar Pagamento" data-order-id="${o.id}">&#128176;</button>
          </div>
        </div>`;
    }).join('');
  }

  // ── Materials Summary ──────────────────────────────────

  function renderMaterialsSummary(orders) {
    const today = startOfDay(new Date());

    // Orders that are pendente or em_producao with today's delivery date
    const todayActive = orders.filter(o => {
      if (o.status !== 'pendente' && o.status !== 'em_producao') return false;
      if (!o.data_entrega) return false;
      const delivery = startOfDay(parseDate(o.data_entrega));
      return delivery && delivery.getTime() === today.getTime();
    });

    if (todayActive.length === 0) {
      materialsSummary.style.display = 'none';
      return;
    }

    // Aggregate product quantities from the items embedded in orders
    const productTotals = {};
    for (const order of todayActive) {
      const items = order.items || [];
      for (const item of items) {
        const pid = item.product_id;
        if (!productTotals[pid]) {
          const prod = productsMap[pid];
          productTotals[pid] = {
            nome: item.produto_nome || (prod ? prod.nome : `Produto #${pid}`),
            unidade: prod ? (prod.unidade_medida || 'un') : 'un',
            quantidade: 0,
          };
        }
        productTotals[pid].quantidade += item.quantidade;
      }
    }

    const entries = Object.values(productTotals);
    if (entries.length === 0) {
      materialsSummary.style.display = 'none';
      return;
    }

    materialsSummary.style.display = '';
    materialsList.innerHTML = entries.map(e => `
      <div class="material-item">
        <span class="material-name">${escapeHtml(e.nome)}</span>
        <span class="material-qty">${e.quantidade} ${escapeHtml(e.unidade)}</span>
      </div>`).join('');
  }

  // ── Kanban Board ───────────────────────────────────────

  function renderKanban(orders) {
    // Only active statuses in Kanban (3 columns)
    const activeOrders = orders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado');
    const pending    = activeOrders.filter(o => o.status === 'pendente');
    const production = activeOrders.filter(o => o.status === 'em_producao');
    const ready      = activeOrders.filter(o => o.status === 'pronto');

    countPending.textContent    = pending.length;
    countProduction.textContent = production.length;
    countReady.textContent      = ready.length;
    kanbanCount.textContent     = `${activeOrders.length} encomenda${activeOrders.length !== 1 ? 's' : ''}`;

    colPending.innerHTML = pending.length
      ? pending.map(o => renderOrderCard(o)).join('')
      : columnEmpty('Nenhum pedido pendente', '&#128203;');

    colProduction.innerHTML = production.length
      ? production.map(o => renderOrderCard(o)).join('')
      : columnEmpty('Nenhum pedido em produção', '&#9881;');

    colReady.innerHTML = ready.length
      ? ready.map(o => renderOrderCard(o)).join('')
      : columnEmpty('Nenhum pedido pronto', '&#10003;');

    const hasActiveOrders = activeOrders.length > 0;
    const hasAnyOrders = allOrders.length > 0;

    kanbanBoard.style.display   = hasAnyOrders ? '' : 'none';
    emptyState.style.display    = !hasAnyOrders ? '' : 'none';
    emptyFilter.style.display   = hasAnyOrders && !hasActiveOrders ? '' : 'none';
  }

  // ── History Tab ────────────────────────────────────────

  function renderHistory(orders) {
    const finalized = orders.filter(o => o.status === 'entregue' || o.status === 'cancelado');

    historyCount.textContent = `${finalized.length} pedido${finalized.length !== 1 ? 's' : ''}`;

    if (finalized.length === 0) {
      historyContent.innerHTML = '';
      historyEmpty.style.display = '';
      return;
    }
    historyEmpty.style.display = 'none';

    // Sort by most recent first
    const sorted = [...finalized].sort((a, b) => {
      const da = a.updated_at || a.created_at || '';
      const db = b.updated_at || b.created_at || '';
      return db.localeCompare(da);
    });

    historyContent.innerHTML = `
      <div class="history-table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Pagamento</th>
              <th class="td-right">Total</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(o => {
              const client = clientsMap[o.client_id];
              const clientName = client ? client.nome : `#${o.client_id}`;
              const dateStr = (o.updated_at || o.created_at)
                ? new Date(o.updated_at || o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
              return `
                <tr>
                  <td class="td-mono">${o.id}</td>
                  <td>${escapeHtml(clientName)}</td>
                  <td>${getStatusBadge(o.status)}</td>
                  <td>${getPaymentBadge(o.status_pagamento)}</td>
                  <td class="td-right td-mono">${formatCurrency(o.valor_total || 0)}</td>
                  <td>${dateStr}</td>
                  <td><button class="btn-card btn-card--detail" title="Detalhes" data-order-id="${o.id}">&#128065;</button></td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
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
    const paymentButton = getPaymentButton(order);

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
            ${paymentButton}
            ${actionButtons}
          </div>
        </div>
      </div>`;
  }

  // Status flow: pendente → em_producao → pronto → entregue (or cancelado at any stage)
  function getActionButtons(order) {
    const id = order.id;
    switch (order.status) {
      case 'pendente':
        return `
          <button class="btn-card btn-card--advance" title="Iniciar Produção" data-order-id="${id}" data-next-status="em_producao">&#9654;</button>
          <button class="btn-card btn-card--cancel" title="Cancelar" data-order-id="${id}" data-next-status="cancelado">&times;</button>`;
      case 'em_producao':
        return `
          <button class="btn-card btn-card--advance" title="Marcar como Pronto" data-order-id="${id}" data-next-status="pronto">&#10003;</button>
          <button class="btn-card btn-card--cancel" title="Cancelar" data-order-id="${id}" data-next-status="cancelado">&times;</button>`;
      case 'pronto':
        return `
          <button class="btn-card btn-card--advance" title="Marcar como Entregue" data-order-id="${id}" data-next-status="entregue">&#128666;</button>
          <button class="btn-card btn-card--cancel" title="Cancelar" data-order-id="${id}" data-next-status="cancelado">&times;</button>`;
      default:
        return ''; // entregue or cancelado — final states
    }
  }

  function getPaymentButton(order) {
    if (order.status === 'cancelado') return '';
    if (order.status_pagamento === 'pago') return '';
    return `<button class="btn-card btn-card--pay" title="Confirmar Pagamento" data-order-id="${order.id}">&#128176;</button>`;
  }

  function getUrgencyBadge(deliveryDate, status) {
    if (!deliveryDate || status === 'entregue' || status === 'cancelado') return '';

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
      pendente:     '<span class="badge badge-pending">Pendente</span>',
      em_producao:  '<span class="badge badge-production">Em Produção</span>',
      pronto:       '<span class="badge badge-delivered">Pronto</span>',
      entregue:     '<span class="badge badge-approved">Entregue</span>',
      cancelado:    '<span class="badge badge-rejected">Cancelado</span>',
    };
    return map[status] || `<span class="badge">${status}</span>`;
  }

  function getPaymentBadge(status) {
    if (status === 'pago') return '<span class="badge badge-approved">Pago</span>';
    if (status === 'pendente') return '<span class="badge badge-pending">A pagar</span>';
    if (status === 'parcial') return '<span class="badge badge-pending">Parcial</span>';
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
        case 'overdue':  return diffDays < 0 && order.status !== 'entregue' && order.status !== 'cancelado';
        default:         return true;
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  STATUS UPDATE (Optimistic)
  // ══════════════════════════════════════════════════════

  async function updateOrderStatus(orderId, newStatus) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const prevStatus = order.status;
    order.status = newStatus;
    renderAll();

    try {
      const res = await ApiService.updateOrderStatus(orderId, newStatus);
      if (!res.ok) {
        order.status = prevStatus;
        renderAll();
        console.error('Falha ao atualizar status:', res.data);
      }
    } catch (err) {
      order.status = prevStatus;
      renderAll();
      console.error('Erro na atualização de status:', err);
    }
  }

  // ══════════════════════════════════════════════════════
  //  PAYMENT UPDATE (Optimistic)
  // ══════════════════════════════════════════════════════

  async function confirmPayment(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const prevPayment = order.status_pagamento;
    order.status_pagamento = 'pago';
    renderAll();

    try {
      const res = await ApiService.updatePaymentStatus(orderId, 'pago');
      if (!res.ok) {
        order.status_pagamento = prevPayment;
        renderAll();
        console.error('Falha ao confirmar pagamento:', res.data);
      }
    } catch (err) {
      order.status_pagamento = prevPayment;
      renderAll();
      console.error('Erro ao confirmar pagamento:', err);
    }
  }

  // ══════════════════════════════════════════════════════
  //  ORDER DETAIL MODAL
  // ══════════════════════════════════════════════════════

  async function openDetail(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    currentDetailOrderId = orderId;

    const client = clientsMap[order.client_id];
    const clientName = client ? client.nome : `Cliente #${order.client_id}`;
    const clientPhone = client ? client.telefone : '';
    const clientAddr = client ? client.endereco : '';

    detailTitle.textContent = `Encomenda #${order.id}`;

    let itemsHtml = '<p class="detail-loading">Carregando itens...</p>';
    detailContent.innerHTML = buildDetailHtml(order, clientName, clientAddr, itemsHtml);
    detailModal.style.display = '';

    // Show/hide edit button based on status
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

    if (clientPhone) {
      const waUrl = buildWhatsAppUrl(clientPhone, order);
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
          ${items.map(item => {
            const prod = productsMap[item.product_id];
            const nome = item.produto_nome || (prod ? prod.nome : `#${item.product_id}`);
            return `
            <tr>
              <td>${escapeHtml(nome)}</td>
              <td>${item.quantidade}</td>
              <td>${formatCurrency(item.preco_venda_unitario)}</td>
              <td>${formatCurrency(item.preco_venda_unitario * item.quantidade)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  function closeDetail() {
    detailModal.style.display = 'none';
    currentDetailOrderId = null;
  }

  // ══════════════════════════════════════════════════════
  //  EDIT ORDER MODAL
  // ══════════════════════════════════════════════════════

  function openEdit(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    editingOrderId = orderId;
    editTitle.textContent = `Editar Encomenda #${order.id}`;

    // Pre-fill fields
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

    if (Object.keys(data).length === 0) {
      editFeedback.className = 'pdv-feedback error';
      editFeedback.textContent = 'Nenhum campo alterado.';
      return;
    }

    const btnSave = document.getElementById('btnSaveEdit');
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando...';

    try {
      const res = await ApiService.updateOrder(editingOrderId, data);
      if (res.ok) {
        // Update local state
        const idx = allOrders.findIndex(o => o.id === editingOrderId);
        if (idx !== -1) {
          Object.assign(allOrders[idx], res.data || data);
        }
        renderAll();
        closeEdit();
      } else {
        editFeedback.className = 'pdv-feedback error';
        editFeedback.textContent = res.data?.error || 'Erro ao salvar alterações.';
      }
    } catch (err) {
      editFeedback.className = 'pdv-feedback error';
      editFeedback.textContent = 'Erro de conexão ao salvar.';
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
    }
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
      pendente:    'Recebido e aguardando produção',
      em_producao: 'Em produção',
      pronto:      'Pronto para entrega/retirada',
      entregue:    'Entregue',
      cancelado:   'Cancelado',
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

  function buildWhatsAppUrl(phone, order) {
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
    // Dashboard tabs (Produção | Histórico)
    document.querySelectorAll('.dashboard-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dashboard-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        tabProduction.style.display = activeTab === 'production' ? '' : 'none';
        tabHistory.style.display   = activeTab === 'history' ? '' : 'none';
      });
    });

    // Finance mode toggle (Previsão | Realizado)
    document.querySelectorAll('.finance-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.finance-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        financeMode = btn.dataset.financeMode;
        renderFinancialCards();
      });
    });

    // Date range filter (Hoje | Mês | Total)
    document.querySelectorAll('.date-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.date-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        dateRange = btn.dataset.range;
        renderFinancialCards();
      });
    });

    // Meta edit button
    document.getElementById('btnEditMeta').addEventListener('click', async () => {
      const input = prompt('Defina sua Meta Mensal (R$):', metaMensal || '');
      if (input === null) return;
      const val = parseFloat(input.replace(',', '.'));
      if (!isNaN(val) && val >= 0) {
        metaMensal = val;
        localStorage.setItem(META_KEY, val);
        // Re-fetch goal from server with new meta value
        try {
          const goalRes = await ApiService.getGoalSummary(metaMensal);
          if (goalRes.ok) goalData = goalRes.data;
        } catch (_) { /* ignore */ }
        renderGoalAndCaixinha();
      }
    });

    // Temporal filters
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderAll();
      });
    });

    // Edit form
    editForm.addEventListener('submit', saveEdit);
    document.getElementById('btnCancelEdit').addEventListener('click', closeEdit);
    document.getElementById('btnCloseEdit').addEventListener('click', closeEdit);

    // Detail modal edit button
    document.getElementById('detailBtnEdit').addEventListener('click', () => {
      if (currentDetailOrderId) openEdit(currentDetailOrderId);
    });

    // Global delegation for card buttons
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

      // Payment confirmation
      if (target.closest('.btn-card--pay')) {
        const btn = target.closest('.btn-card--pay');
        const orderId = Number(btn.dataset.orderId);
        if (orderId) confirmPayment(orderId);
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

      // Close modals by clicking overlay
      if (target.classList.contains('modal-overlay')) {
        if (target.id === 'detailModal') closeDetail();
        else if (target.id === 'whatsappModal') closeWhatsApp();
        else if (target.id === 'editModal') closeEdit();
        return;
      }

      // Close detail modal buttons
      if (target.id === 'btnCloseDetail' || target.id === 'detailBtnClose') {
        closeDetail();
        return;
      }

      // Close WA modal
      if (target.id === 'btnCloseWA') {
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
    if (digits.startsWith('55')) return digits;
    if (digits.startsWith('0')) return '55' + digits.slice(1);
    return '55' + digits;
  }

  function parseDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
});
