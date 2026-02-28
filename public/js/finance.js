/**
 * finance.js — Livro Caixa (Entradas + Saídas + Extrato)
 * Depende de: api.js, guard.js
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Guard ──────────────────────────────────────────────
  if (!RouteGuard.requireApproved()) return;
  RouteGuard.renderNavbar();

  // ── State ──────────────────────────────────────────────
  let allSales = [];
  let allExpenses = [];
  let allMovements = [];
  let balanceData = null; // { total_vendas, despesas_pagas, despesas_pendentes, saldo_real, saldo_projetado }
  let clients = [];
  let clientsMap = {};
  let activeSection = 'entradas'; // 'entradas' | 'saidas' | 'extrato'
  let activeFilter = 'all';
  let activeExpFilter = 'all';
  let editingSaleId = null;
  let editingExpenseId = null;
  let deletingId = null;
  let deletingType = null; // 'sale' | 'expense'

  // ── DOM refs ───────────────────────────────────────────
  const loadingState = document.getElementById('loadingState');

  // Summary
  const summaryRevenue     = document.getElementById('summaryRevenue');
  const summaryCount       = document.getElementById('summaryCount');
  const summaryPaidExp     = document.getElementById('summaryPaidExp');
  const summaryRealBalance = document.getElementById('summaryRealBalance');
  const summaryBalance     = document.getElementById('summaryBalance');
  const summaryPendingHint = document.getElementById('summaryPendingHint');

  // Sections
  const sectionEntradas = document.getElementById('sectionEntradas');
  const sectionSaidas   = document.getElementById('sectionSaidas');
  const sectionExtrato  = document.getElementById('sectionExtrato');

  // Sales
  const salesTableWrap = document.getElementById('salesTableWrap');
  const salesBody      = document.getElementById('salesBody');
  const emptyState     = document.getElementById('emptyState');
  const saleCount      = document.getElementById('saleCount');
  const searchInput    = document.getElementById('searchInput');

  // Expenses
  const expTableWrap  = document.getElementById('expTableWrap');
  const expBody       = document.getElementById('expBody');
  const expEmptyState = document.getElementById('expEmptyState');
  const expCount      = document.getElementById('expCount');
  const expSearchInput = document.getElementById('expSearchInput');

  // Movements (extrato)
  const movTableWrap  = document.getElementById('movTableWrap');
  const movBody       = document.getElementById('movBody');
  const movEmptyState = document.getElementById('movEmptyState');

  // Sale modal
  const saleModal      = document.getElementById('saleModal');
  const modalTitle     = document.getElementById('modalTitle');
  const modalSubtitle  = document.getElementById('modalSubtitle');
  const saleForm       = document.getElementById('saleForm');
  const formAlert      = document.getElementById('formAlert');
  const fValorTotal    = document.getElementById('f-valor-total');
  const fValorLucro    = document.getElementById('f-valor-lucro');
  const fFormaPgto     = document.getElementById('f-forma-pagamento');
  const fClient        = document.getElementById('f-client');
  const fDataVenda     = document.getElementById('f-data-venda');
  const fDescricao     = document.getElementById('f-descricao');

  // Expense modal
  const expenseModal      = document.getElementById('expenseModal');
  const expModalTitle     = document.getElementById('expModalTitle');
  const expModalSubtitle  = document.getElementById('expModalSubtitle');
  const expenseForm       = document.getElementById('expenseForm');
  const expFormAlert      = document.getElementById('expFormAlert');
  const expValor          = document.getElementById('exp-valor');
  const expCategoria      = document.getElementById('exp-categoria');
  const expDescricao      = document.getElementById('exp-descricao');
  const expDataEmissao    = document.getElementById('exp-data-emissao');
  const expDataVencimento = document.getElementById('exp-data-vencimento');

  // Delete modal
  const deleteModal = document.getElementById('deleteModal');

  // ── Init ───────────────────────────────────────────────
  bindEvents();
  loadData();

  // ══════════════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════════════

  async function loadData() {
    showLoading(true);
    try {
      const [salesRes, clientsRes, expensesRes, balanceRes, movRes] = await Promise.all([
        ApiService.getSales(),
        ApiService.getClients(),
        ApiService.getExpenses(),
        ApiService.getBalance(),
        ApiService.getMovements(),
      ]);

      if (salesRes.ok) allSales = salesRes.data;
      if (expensesRes.ok) allExpenses = expensesRes.data;
      if (balanceRes.ok) balanceData = balanceRes.data;
      if (movRes.ok) allMovements = movRes.data;
      if (clientsRes.ok) {
        clients = clientsRes.data;
        clientsMap = {};
        clients.forEach(c => { clientsMap[c.id] = c; });
        populateClientSelect();
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
    showLoading(false);
    renderAll();
  }

  function showLoading(show) {
    loadingState.style.display = show ? '' : 'none';
    if (show) {
      salesTableWrap.style.display = 'none';
      emptyState.style.display = 'none';
      expTableWrap.style.display = 'none';
      expEmptyState.style.display = 'none';
      movTableWrap.style.display = 'none';
      movEmptyState.style.display = 'none';
    }
  }

  // ══════════════════════════════════════════════════════
  //  RENDERING
  // ══════════════════════════════════════════════════════

  function renderAll() {
    updateSummary();
    renderSales();
    renderExpenses();
    renderMovements();
  }

  // ── Summary (from backend-calculated balance) ──────────

  function updateSummary() {
    if (balanceData) {
      summaryRevenue.textContent = formatCurrency(balanceData.total_vendas);
      summaryCount.textContent = allSales.length + ' venda' + (allSales.length !== 1 ? 's' : '');
      summaryPaidExp.textContent = formatCurrency(balanceData.despesas_pagas);

      summaryRealBalance.textContent = formatCurrency(balanceData.saldo_real);
      summaryRealBalance.classList.remove('finance-value--success', 'finance-value--danger');
      summaryRealBalance.classList.add(balanceData.saldo_real >= 0 ? 'finance-value--success' : 'finance-value--danger');

      summaryBalance.textContent = formatCurrency(balanceData.saldo_projetado);
      summaryBalance.classList.remove('finance-value--success', 'finance-value--danger');
      summaryBalance.classList.add(balanceData.saldo_projetado >= 0 ? 'finance-value--success' : 'finance-value--danger');

      summaryPendingHint.textContent = formatCurrency(balanceData.despesas_pendentes) + ' pendentes';
    } else {
      // Fallback: calculate client-side
      var revenue = allSales.reduce(function(s, v) { return s + (v.valor_total || 0); }, 0);
      var paidExp = allExpenses.filter(function(e) { return e.status === 'pago'; }).reduce(function(s, e) { return s + (e.valor || 0); }, 0);
      var pendExp = allExpenses.filter(function(e) { return e.status === 'pendente'; }).reduce(function(s, e) { return s + (e.valor || 0); }, 0);

      summaryRevenue.textContent = formatCurrency(revenue);
      summaryCount.textContent = allSales.length + ' venda' + (allSales.length !== 1 ? 's' : '');
      summaryPaidExp.textContent = formatCurrency(paidExp);
      summaryRealBalance.textContent = formatCurrency(revenue - paidExp);
      summaryBalance.textContent = formatCurrency(revenue - paidExp - pendExp);
      summaryPendingHint.textContent = formatCurrency(pendExp) + ' pendentes';
    }
  }

  // ── Sales Rendering ────────────────────────────────────

  function renderSales() {
    const filtered = getFilteredSales();

    if (filtered.length === 0) {
      salesTableWrap.style.display = 'none';
      emptyState.style.display = activeSection === 'entradas' ? '' : 'none';
      saleCount.textContent = '';
      return;
    }

    emptyState.style.display = 'none';
    salesTableWrap.style.display = activeSection === 'entradas' ? '' : 'none';
    saleCount.textContent = filtered.length + ' venda' + (filtered.length !== 1 ? 's' : '');

    salesBody.innerHTML = filtered.map(function(sale) {
      var client = sale.client_id ? clientsMap[sale.client_id] : null;
      var clientName = client ? client.nome : '\u2014';
      var dateStr = formatDate(sale.data_venda);
      var desc = sale.descricao || (sale.order_id ? 'Encomenda #' + sale.order_id : 'Venda manual');
      var isFromOrder = !!sale.order_id;
      var originBadge = isFromOrder
        ? '<span class="badge badge-delivered">Encomenda</span>'
        : '<span class="badge badge-pending">Manual</span>';
      var payBadge = getPaymentBadge(sale.forma_pagamento);
      var profitPct = sale.valor_total > 0
        ? ((sale.valor_lucro / sale.valor_total) * 100).toFixed(0)
        : 0;

      return '<tr>' +
        '<td class="td-mono">' + sale.id + '</td>' +
        '<td>' + escapeHtml(clientName) + '</td>' +
        '<td>' + dateStr + '</td>' +
        '<td>' + escapeHtml(desc) + ' ' + originBadge + '</td>' +
        '<td>' + payBadge + '</td>' +
        '<td class="td-right td-mono">' + formatCurrency(sale.valor_total) + '</td>' +
        '<td class="td-right td-mono" style="color: var(--success)">' + formatCurrency(sale.valor_lucro) + ' <small style="color: var(--muted-foreground); font-weight:400">' + profitPct + '%</small></td>' +
        '<td><div class="row-actions">' +
          '<button class="btn-row btn-row--edit" title="Editar" data-edit="' + sale.id + '">&#9998;</button>' +
          '<button class="btn-row btn-row--delete" title="Excluir" data-delete="' + sale.id + '">&#128465;</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function getFilteredSales() {
    var list = allSales.slice();

    if (activeFilter === 'manual') list = list.filter(function(s) { return !s.order_id; });
    if (activeFilter === 'order') list = list.filter(function(s) { return !!s.order_id; });

    var q = (searchInput.value || '').trim().toLowerCase();
    if (q) {
      list = list.filter(function(s) {
        var clientName = s.client_id && clientsMap[s.client_id] ? clientsMap[s.client_id].nome : '';
        var haystack = [
          s.descricao || '',
          clientName,
          s.forma_pagamento || '',
          s.order_id ? 'encomenda #' + s.order_id : 'manual',
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    return list;
  }

  // ── Expenses Rendering ─────────────────────────────────

  function renderExpenses() {
    var filtered = getFilteredExpenses();

    if (filtered.length === 0) {
      expTableWrap.style.display = 'none';
      expEmptyState.style.display = activeSection === 'saidas' ? '' : 'none';
      expCount.textContent = '';
      return;
    }

    expEmptyState.style.display = 'none';
    expTableWrap.style.display = activeSection === 'saidas' ? '' : 'none';
    expCount.textContent = filtered.length + ' despesa' + (filtered.length !== 1 ? 's' : '');

    expBody.innerHTML = filtered.map(function(exp) {
      var categLabel = getCategoryLabel(exp.categoria);
      var dueDate = exp.data_vencimento ? formatDate(exp.data_vencimento) : '\u2014';
      var statusBadge = getExpenseStatusBadge(exp);
      var desc = exp.descricao || '\u2014';
      var payBtn = exp.status === 'pendente'
        ? '<button class="btn-row btn-row--pay" title="Dar baixa" data-exp-pay="' + exp.id + '">&#10003;</button>'
        : '';

      return '<tr>' +
        '<td class="td-mono">' + exp.id + '</td>' +
        '<td>' + categLabel + '</td>' +
        '<td>' + escapeHtml(desc) + '</td>' +
        '<td>' + dueDate + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td class="td-right td-mono">' + formatCurrency(exp.valor) + '</td>' +
        '<td><div class="row-actions">' +
          payBtn +
          '<button class="btn-row btn-row--edit" title="Editar" data-exp-edit="' + exp.id + '">&#9998;</button>' +
          '<button class="btn-row btn-row--delete" title="Excluir" data-exp-delete="' + exp.id + '">&#128465;</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function getFilteredExpenses() {
    var list = allExpenses.slice();
    var today = new Date().toISOString().slice(0, 10);

    if (activeExpFilter === 'pendente') list = list.filter(function(e) { return e.status === 'pendente'; });
    if (activeExpFilter === 'pago') list = list.filter(function(e) { return e.status === 'pago'; });
    if (activeExpFilter === 'atrasado') {
      list = list.filter(function(e) { return e.status === 'pendente' && e.data_vencimento && e.data_vencimento < today; });
    }

    var q = (expSearchInput.value || '').trim().toLowerCase();
    if (q) {
      list = list.filter(function(e) {
        var haystack = [e.descricao || '', e.categoria || ''].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    return list;
  }

  // ── Movements (Extrato) Rendering ──────────────────────

  function renderMovements() {
    if (allMovements.length === 0) {
      movTableWrap.style.display = 'none';
      movEmptyState.style.display = activeSection === 'extrato' ? '' : 'none';
      return;
    }

    movEmptyState.style.display = 'none';
    movTableWrap.style.display = activeSection === 'extrato' ? '' : 'none';

    movBody.innerHTML = allMovements.map(function(m) {
      var tipoBadge = m.tipo === 'entrada'
        ? '<span class="badge badge-approved">Entrada</span>'
        : '<span class="badge badge-rejected">Saída</span>';
      var valorClass = m.tipo === 'entrada' ? 'color: var(--success)' : 'color: var(--destructive)';
      var prefix = m.tipo === 'entrada' ? '+ ' : '- ';

      return '<tr>' +
        '<td>' + formatDate(m.data) + '</td>' +
        '<td>' + tipoBadge + '</td>' +
        '<td>' + escapeHtml(m.descricao) + '</td>' +
        '<td class="td-right td-mono" style="' + valorClass + '">' + prefix + formatCurrency(m.valor) + '</td>' +
      '</tr>';
    }).join('');
  }

  // ══════════════════════════════════════════════════════
  //  EVENTS
  // ══════════════════════════════════════════════════════

  function bindEvents() {
    // New sale / expense buttons
    document.getElementById('btnNewSale').addEventListener('click', function() { openSaleModal(); });
    document.getElementById('btnNewExpense').addEventListener('click', function() { openExpenseModal(); });
    var btnEmptyNew = document.getElementById('btnEmptyNew');
    if (btnEmptyNew) btnEmptyNew.addEventListener('click', function() { openSaleModal(); });
    var btnExpEmptyNew = document.getElementById('btnExpEmptyNew');
    if (btnExpEmptyNew) btnExpEmptyNew.addEventListener('click', function() { openExpenseModal(); });

    // Section tabs
    document.querySelectorAll('.section-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.section-tab').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeSection = btn.dataset.section;
        sectionEntradas.style.display = activeSection === 'entradas' ? '' : 'none';
        sectionSaidas.style.display   = activeSection === 'saidas' ? '' : 'none';
        sectionExtrato.style.display  = activeSection === 'extrato' ? '' : 'none';
        renderSales();
        renderExpenses();
        renderMovements();
      });
    });

    // Sale filter tabs
    document.querySelectorAll('.filter-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-tab').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderSales();
      });
    });

    // Expense filter tabs
    document.querySelectorAll('.exp-filter').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.exp-filter').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeExpFilter = btn.dataset.expFilter;
        renderExpenses();
      });
    });

    // Search
    searchInput.addEventListener('input', function() { renderSales(); });
    expSearchInput.addEventListener('input', function() { renderExpenses(); });

    // Sale form
    saleForm.addEventListener('submit', handleSaleSubmit);
    document.getElementById('btnCancelSale').addEventListener('click', closeSaleModal);
    saleModal.addEventListener('click', function(e) { if (e.target === saleModal) closeSaleModal(); });

    // Expense form
    expenseForm.addEventListener('submit', handleExpenseSubmit);
    document.getElementById('btnCancelExpense').addEventListener('click', closeExpenseModal);
    expenseModal.addEventListener('click', function(e) { if (e.target === expenseModal) closeExpenseModal(); });

    // Delete modal
    document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('btnConfirmDelete').addEventListener('click', handleDelete);
    deleteModal.addEventListener('click', function(e) { if (e.target === deleteModal) closeDeleteModal(); });

    // Sales table actions (delegation)
    salesBody.addEventListener('click', function(e) {
      var editBtn = e.target.closest('[data-edit]');
      if (editBtn) { openEditSaleModal(Number(editBtn.dataset.edit)); return; }
      var deleteBtn = e.target.closest('[data-delete]');
      if (deleteBtn) { openDeleteConfirm(Number(deleteBtn.dataset.delete), 'sale'); }
    });

    // Expenses table actions (delegation)
    expBody.addEventListener('click', function(e) {
      var payBtn = e.target.closest('[data-exp-pay]');
      if (payBtn) { handlePayExpense(Number(payBtn.dataset.expPay)); return; }
      var editBtn = e.target.closest('[data-exp-edit]');
      if (editBtn) { openEditExpenseModal(Number(editBtn.dataset.expEdit)); return; }
      var deleteBtn = e.target.closest('[data-exp-delete]');
      if (deleteBtn) { openDeleteConfirm(Number(deleteBtn.dataset.expDelete), 'expense'); }
    });
  }

  // ══════════════════════════════════════════════════════
  //  SALE MODAL (Create & Edit)
  // ══════════════════════════════════════════════════════

  function populateClientSelect() {
    var opts = clients.map(function(c) { return '<option value="' + c.id + '">' + c.nome + '</option>'; }).join('');
    fClient.innerHTML = '<option value="">Venda anônima</option>' + opts;
  }

  function openSaleModal() {
    editingSaleId = null;
    modalTitle.textContent = 'Venda Rápida';
    modalSubtitle.textContent = 'Registre uma venda de feira ou balcão.';
    saleForm.reset();
    fDataVenda.value = new Date().toISOString().slice(0, 10);
    clearErrors();
    saleModal.style.display = 'flex';
    fValorTotal.focus();
  }

  function openEditSaleModal(id) {
    var sale = allSales.find(function(s) { return s.id === id; });
    if (!sale) return;

    editingSaleId = id;
    modalTitle.textContent = 'Editar Venda #' + id;
    modalSubtitle.textContent = sale.order_id ? 'Originada da Encomenda #' + sale.order_id : 'Venda manual';

    fValorTotal.value = sale.valor_total;
    fValorLucro.value = sale.valor_lucro;
    fFormaPgto.value = sale.forma_pagamento;
    fClient.value = sale.client_id || '';
    fDataVenda.value = sale.data_venda ? sale.data_venda.slice(0, 10) : '';
    fDescricao.value = sale.descricao || '';

    clearErrors();
    saleModal.style.display = 'flex';
    fValorTotal.focus();
  }

  function closeSaleModal() {
    saleModal.style.display = 'none';
    editingSaleId = null;
  }

  async function handleSaleSubmit(e) {
    e.preventDefault();
    clearErrors();

    var valorTotal = parseFloat(fValorTotal.value);
    if (!valorTotal || valorTotal <= 0) {
      showFieldError('valor_total', 'Informe um valor maior que zero.');
      return;
    }

    var data = {
      valor_total: valorTotal,
      forma_pagamento: fFormaPgto.value,
    };

    var lucro = fValorLucro.value !== '' ? parseFloat(fValorLucro.value) : undefined;
    if (lucro !== undefined) data.valor_lucro = lucro;

    var clientId = fClient.value ? Number(fClient.value) : null;
    if (clientId) data.client_id = clientId;

    if (fDataVenda.value) data.data_venda = fDataVenda.value;
    if (fDescricao.value.trim()) data.descricao = fDescricao.value.trim();

    var btn = document.getElementById('btnSaveSale');
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    try {
      var res;
      if (editingSaleId) {
        res = await ApiService.updateSale(editingSaleId, data);
      } else {
        res = await ApiService.createSale(data);
      }

      if (res.ok) {
        closeSaleModal();
        await loadData();
      } else {
        var msg = res.data?.error || res.data?.message || 'Erro ao salvar venda.';
        showFormAlert(msg);
      }
    } catch (err) {
      showFormAlert('Erro de conexão ao salvar venda.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  }

  // ══════════════════════════════════════════════════════
  //  EXPENSE MODAL (Create & Edit)
  // ══════════════════════════════════════════════════════

  function openExpenseModal() {
    editingExpenseId = null;
    expModalTitle.textContent = 'Nova Despesa';
    expModalSubtitle.textContent = 'Registre uma saída fixa ou variável.';
    expenseForm.reset();
    expDataEmissao.value = new Date().toISOString().slice(0, 10);
    clearExpErrors();
    expenseModal.style.display = 'flex';
    expValor.focus();
  }

  function openEditExpenseModal(id) {
    var exp = allExpenses.find(function(e) { return e.id === id; });
    if (!exp) return;

    editingExpenseId = id;
    expModalTitle.textContent = 'Editar Despesa #' + id;
    expModalSubtitle.textContent = getCategoryLabel(exp.categoria);

    expValor.value = exp.valor;
    expCategoria.value = exp.categoria;
    expDescricao.value = exp.descricao || '';
    expDataEmissao.value = exp.data_emissao ? exp.data_emissao.slice(0, 10) : '';
    expDataVencimento.value = exp.data_vencimento ? exp.data_vencimento.slice(0, 10) : '';

    clearExpErrors();
    expenseModal.style.display = 'flex';
    expValor.focus();
  }

  function closeExpenseModal() {
    expenseModal.style.display = 'none';
    editingExpenseId = null;
  }

  async function handleExpenseSubmit(e) {
    e.preventDefault();
    clearExpErrors();

    var valor = parseFloat(expValor.value);
    if (!valor || valor <= 0) {
      showExpFieldError('exp_valor', 'Informe um valor maior que zero.');
      return;
    }

    var data = {
      valor: valor,
      categoria: expCategoria.value,
    };

    if (expDescricao.value.trim()) data.descricao = expDescricao.value.trim();
    if (expDataEmissao.value) data.data_emissao = expDataEmissao.value;
    if (expDataVencimento.value) data.data_vencimento = expDataVencimento.value;

    var btn = document.getElementById('btnSaveExpense');
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    try {
      var res;
      if (editingExpenseId) {
        res = await ApiService.updateExpense(editingExpenseId, data);
      } else {
        res = await ApiService.createExpense(data);
      }

      if (res.ok) {
        closeExpenseModal();
        await loadData();
      } else {
        var msg = res.data?.error || res.data?.message || 'Erro ao salvar despesa.';
        showExpFormAlert(msg);
      }
    } catch (err) {
      showExpFormAlert('Erro de conexão ao salvar despesa.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  }

  // ── Pay Expense (instantly refreshes balance) ──────────

  async function handlePayExpense(id) {
    try {
      var res = await ApiService.payExpense(id);
      if (res.ok) {
        // Full reload to refresh balance + movements + expenses
        await loadData();
      } else {
        alert(res.data?.error || 'Erro ao dar baixa na despesa.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  }

  // ══════════════════════════════════════════════════════
  //  DELETE
  // ══════════════════════════════════════════════════════

  function openDeleteConfirm(id, type) {
    deletingId = id;
    deletingType = type;
    var title = type === 'sale' ? 'Excluir Venda' : 'Excluir Despesa';
    var msg = type === 'sale'
      ? 'Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.'
      : 'Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.';
    document.getElementById('deleteModalTitle').textContent = title;
    document.getElementById('deleteMsg').textContent = msg;
    deleteModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    deleteModal.style.display = 'none';
    deletingId = null;
    deletingType = null;
  }

  async function handleDelete() {
    if (!deletingId || !deletingType) return;
    var btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;

    try {
      var res;
      if (deletingType === 'sale') {
        res = await ApiService.deleteSale(deletingId);
      } else {
        res = await ApiService.deleteExpense(deletingId);
      }
      if (res.ok) {
        closeDeleteModal();
        await loadData();
      } else {
        alert(res.data?.error || 'Erro ao excluir.');
        closeDeleteModal();
      }
    } catch (err) {
      alert('Erro de conexão.');
      closeDeleteModal();
    } finally {
      btn.disabled = false;
    }
  }

  // ══════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════

  function formatCurrency(value) {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDate(iso) {
    if (!iso) return '\u2014';
    var d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getPaymentBadge(fp) {
    var map = {
      pix:             '<span class="badge badge-approved">PIX</span>',
      dinheiro:        '<span class="badge badge-pending">Dinheiro</span>',
      cartao_credito:  '<span class="badge badge-delivered">Crédito</span>',
      cartao_debito:   '<span class="badge badge-delivered">Débito</span>',
    };
    return map[fp] || ('<span class="badge">' + fp + '</span>');
  }

  function getExpenseStatusBadge(exp) {
    if (exp.status === 'pago') {
      return '<span class="badge badge-approved">Pago</span>';
    }
    var today = new Date().toISOString().slice(0, 10);
    if (exp.data_vencimento && exp.data_vencimento < today) {
      return '<span class="badge badge-rejected">Atrasado</span>';
    }
    if (exp.data_vencimento && exp.data_vencimento.slice(0, 10) === today) {
      return '<span class="badge badge-pending">Vence Hoje</span>';
    }
    return '<span class="badge badge-pending">Pendente</span>';
  }

  var CATEGORY_LABELS = {
    materia_prima: 'Matéria-prima',
    embalagem: 'Embalagem',
    transporte: 'Transporte',
    aluguel: 'Aluguel',
    energia: 'Energia',
    agua: 'Água',
    internet: 'Internet',
    marketing: 'Marketing',
    equipamento: 'Equipamento',
    manutencao: 'Manutenção',
    impostos: 'Impostos',
    salarios: 'Salários',
    outros: 'Outros',
  };

  function getCategoryLabel(cat) {
    return CATEGORY_LABELS[cat] || cat;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function clearErrors() {
    formAlert.style.display = 'none';
    formAlert.textContent = '';
    document.querySelectorAll('#saleForm .field-error').forEach(function(el) { el.textContent = ''; });
  }

  function showFieldError(field, msg) {
    var el = document.querySelector('.field-error[data-for="' + field + '"]');
    if (el) el.textContent = msg;
  }

  function showFormAlert(msg) {
    formAlert.textContent = msg;
    formAlert.style.display = '';
  }

  function clearExpErrors() {
    expFormAlert.style.display = 'none';
    expFormAlert.textContent = '';
    document.querySelectorAll('#expenseForm .field-error').forEach(function(el) { el.textContent = ''; });
  }

  function showExpFieldError(field, msg) {
    var el = document.querySelector('.field-error[data-for="' + field + '"]');
    if (el) el.textContent = msg;
  }

  function showExpFormAlert(msg) {
    expFormAlert.textContent = msg;
    expFormAlert.style.display = '';
  }
});
