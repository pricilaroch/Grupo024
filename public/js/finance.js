/**
 * finance.js — Livro Caixa (CRUD de Vendas)
 * Depende de: api.js, guard.js
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Guard ──────────────────────────────────────────────
  if (!RouteGuard.requireApproved()) return;
  RouteGuard.renderNavbar();

  // ── State ──────────────────────────────────────────────
  let allSales = [];
  let clients = [];
  let clientsMap = {};
  let activeFilter = 'all';
  let editingSaleId = null;
  let deletingSaleId = null;

  // ── DOM refs ───────────────────────────────────────────
  const loadingState   = document.getElementById('loadingState');
  const salesTableWrap = document.getElementById('salesTableWrap');
  const salesBody      = document.getElementById('salesBody');
  const emptyState     = document.getElementById('emptyState');
  const saleCount      = document.getElementById('saleCount');
  const searchInput    = document.getElementById('searchInput');

  // Summary
  const summaryCount   = document.getElementById('summaryCount');
  const summaryRevenue = document.getElementById('summaryRevenue');
  const summaryProfit  = document.getElementById('summaryProfit');
  const summaryMargin  = document.getElementById('summaryMargin');

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

  // Delete modal
  const deleteModal    = document.getElementById('deleteModal');

  // ── Init ───────────────────────────────────────────────
  bindEvents();
  loadData();

  // ══════════════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════════════

  async function loadData() {
    showLoading(true);
    try {
      const [salesRes, clientsRes] = await Promise.all([
        ApiService.getSales(),
        ApiService.getClients()
      ]);

      if (salesRes.ok) allSales = salesRes.data;
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
    render();
  }

  function showLoading(show) {
    loadingState.style.display = show ? '' : 'none';
    if (show) {
      salesTableWrap.style.display = 'none';
      emptyState.style.display = 'none';
    }
  }

  // ══════════════════════════════════════════════════════
  //  RENDERING
  // ══════════════════════════════════════════════════════

  function render() {
    const filtered = getFilteredSales();
    updateSummary(filtered);

    if (filtered.length === 0) {
      salesTableWrap.style.display = 'none';
      emptyState.style.display = '';
      saleCount.textContent = '';
      return;
    }

    emptyState.style.display = 'none';
    salesTableWrap.style.display = '';
    saleCount.textContent = `${filtered.length} venda${filtered.length !== 1 ? 's' : ''}`;

    salesBody.innerHTML = filtered.map(sale => {
      const client = sale.client_id ? clientsMap[sale.client_id] : null;
      const clientName = client ? client.nome : '—';
      const dateStr = formatDate(sale.data_venda);
      const desc = sale.descricao || (sale.order_id ? `Encomenda #${sale.order_id}` : 'Venda manual');
      const isFromOrder = !!sale.order_id;
      const originBadge = isFromOrder
        ? '<span class="badge badge-delivered">Encomenda</span>'
        : '<span class="badge badge-pending">Manual</span>';
      const payBadge = getPaymentBadge(sale.forma_pagamento);
      const profitPct = sale.valor_total > 0
        ? ((sale.valor_lucro / sale.valor_total) * 100).toFixed(0)
        : 0;

      return `
        <tr>
          <td class="td-mono">${sale.id}</td>
          <td>${escapeHtml(clientName)}</td>
          <td>${dateStr}</td>
          <td>${escapeHtml(desc)} ${originBadge}</td>
          <td>${payBadge}</td>
          <td class="td-right td-mono">${formatCurrency(sale.valor_total)}</td>
          <td class="td-right td-mono" style="color: var(--success)">${formatCurrency(sale.valor_lucro)} <small style="color: var(--muted-foreground); font-weight:400">${profitPct}%</small></td>
          <td>
            <div class="row-actions">
              <button class="btn-row btn-row--edit" title="Editar" data-edit="${sale.id}">&#9998;</button>
              <button class="btn-row btn-row--delete" title="Excluir" data-delete="${sale.id}">&#128465;</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function getFilteredSales() {
    let list = [...allSales];

    // Type filter
    if (activeFilter === 'manual') list = list.filter(s => !s.order_id);
    if (activeFilter === 'order') list = list.filter(s => !!s.order_id);

    // Search
    const q = (searchInput.value || '').trim().toLowerCase();
    if (q) {
      list = list.filter(s => {
        const clientName = s.client_id && clientsMap[s.client_id] ? clientsMap[s.client_id].nome : '';
        const haystack = [
          s.descricao || '',
          clientName,
          s.forma_pagamento || '',
          s.order_id ? `encomenda #${s.order_id}` : 'manual',
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    return list;
  }

  function updateSummary(sales) {
    const count = sales.length;
    const revenue = sales.reduce((acc, s) => acc + s.valor_total, 0);
    const profit = sales.reduce((acc, s) => acc + s.valor_lucro, 0);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    summaryCount.textContent = count;
    summaryRevenue.textContent = formatCurrency(revenue);
    summaryProfit.textContent = formatCurrency(profit);
    summaryMargin.textContent = `${margin.toFixed(1)}%`;
  }

  // ══════════════════════════════════════════════════════
  //  EVENTS
  // ══════════════════════════════════════════════════════

  function bindEvents() {
    // New sale
    document.getElementById('btnNewSale').addEventListener('click', () => openSaleModal());
    document.getElementById('btnEmptyNew')?.addEventListener('click', () => openSaleModal());

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        render();
      });
    });

    // Search
    searchInput.addEventListener('input', () => render());

    // Sale form
    saleForm.addEventListener('submit', handleSaleSubmit);
    document.getElementById('btnCancelSale').addEventListener('click', closeSaleModal);
    saleModal.addEventListener('click', e => { if (e.target === saleModal) closeSaleModal(); });

    // Delete modal
    document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('btnConfirmDelete').addEventListener('click', handleDelete);
    deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

    // Table actions (delegation)
    salesBody.addEventListener('click', e => {
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn) {
        const id = Number(editBtn.dataset.edit);
        openEditModal(id);
        return;
      }
      const deleteBtn = e.target.closest('[data-delete]');
      if (deleteBtn) {
        deletingSaleId = Number(deleteBtn.dataset.delete);
        deleteModal.style.display = 'flex';
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  SALE MODAL (Create & Edit)
  // ══════════════════════════════════════════════════════

  function populateClientSelect() {
    const opts = clients.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    fClient.innerHTML = `<option value="">Venda anônima</option>${opts}`;
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

  function openEditModal(id) {
    const sale = allSales.find(s => s.id === id);
    if (!sale) return;

    editingSaleId = id;
    modalTitle.textContent = `Editar Venda #${id}`;
    modalSubtitle.textContent = sale.order_id ? `Originada da Encomenda #${sale.order_id}` : 'Venda manual';

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

    const valorTotal = parseFloat(fValorTotal.value);
    if (!valorTotal || valorTotal <= 0) {
      showFieldError('valor_total', 'Informe um valor maior que zero.');
      return;
    }

    const data = {
      valor_total: valorTotal,
      forma_pagamento: fFormaPgto.value,
    };

    const lucro = fValorLucro.value !== '' ? parseFloat(fValorLucro.value) : undefined;
    if (lucro !== undefined) data.valor_lucro = lucro;

    const clientId = fClient.value ? Number(fClient.value) : null;
    if (clientId) data.client_id = clientId;

    if (fDataVenda.value) data.data_venda = fDataVenda.value;
    if (fDescricao.value.trim()) data.descricao = fDescricao.value.trim();

    const btn = document.getElementById('btnSaveSale');
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    try {
      let res;
      if (editingSaleId) {
        res = await ApiService.updateSale(editingSaleId, data);
      } else {
        res = await ApiService.createSale(data);
      }

      if (res.ok) {
        closeSaleModal();
        await loadData();
      } else {
        const msg = res.data?.error || res.data?.message || 'Erro ao salvar venda.';
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
  //  DELETE
  // ══════════════════════════════════════════════════════

  function closeDeleteModal() {
    deleteModal.style.display = 'none';
    deletingSaleId = null;
  }

  async function handleDelete() {
    if (!deletingSaleId) return;
    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;

    try {
      const res = await ApiService.deleteSale(deletingSaleId);
      if (res.ok) {
        closeDeleteModal();
        await loadData();
      } else {
        alert(res.data?.error || 'Erro ao excluir venda.');
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
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatPayment(fp) {
    const map = {
      pix: 'PIX',
      dinheiro: 'Dinheiro',
      cartao_credito: 'Crédito',
      cartao_debito: 'Débito',
    };
    return map[fp] || fp;
  }

  function getPaymentBadge(fp) {
    const map = {
      pix:             '<span class="badge badge-approved">PIX</span>',
      dinheiro:        '<span class="badge badge-pending">Dinheiro</span>',
      cartao_credito:  '<span class="badge badge-delivered">Crédito</span>',
      cartao_debito:   '<span class="badge badge-delivered">Débito</span>',
    };
    return map[fp] || `<span class="badge">${fp}</span>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function clearErrors() {
    formAlert.style.display = 'none';
    formAlert.textContent = '';
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  }

  function showFieldError(field, msg) {
    const el = document.querySelector(`.field-error[data-for="${field}"]`);
    if (el) el.textContent = msg;
  }

  function showFormAlert(msg) {
    formAlert.textContent = msg;
    formAlert.style.display = '';
  }
});
