/**
 * orders.js — PDV de Encomendas (Criar Pedido)
 * Depende de: api.js, guard.js
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Guard ──────────────────────────────────────────────
  if (!RouteGuard.requireApproved()) return;
  RouteGuard.renderNavbar();

  // ── State ──────────────────────────────────────────────
  let clients = [];
  let products = [];
  let cart = []; // { product_id, nome, quantidade, preco_venda, preco_custo }

  // ── DOM refs ───────────────────────────────────────────
  const selectClient      = document.getElementById('selectClient');
  const inputDataEntrega  = document.getElementById('inputDataEntrega');
  const selectTipoEntrega = document.getElementById('selectTipoEntrega');
  const selectPagamento   = document.getElementById('selectPagamento');
  const inputObservacoes  = document.getElementById('inputObservacoes');

  const selectProduct = document.getElementById('selectProduct');
  const inputQtd      = document.getElementById('inputQtd');
  const btnAddItem    = document.getElementById('btnAddItem');

  const cartEmpty  = document.getElementById('cartEmpty');
  const cartTable  = document.getElementById('cartTable');
  const cartBody   = document.getElementById('cartBody');

  const inputTaxaEntrega = document.getElementById('inputTaxaEntrega');
  const inputDesconto    = document.getElementById('inputDesconto');

  const sumSubtotal = document.getElementById('sumSubtotal');
  const sumTaxa     = document.getElementById('sumTaxa');
  const sumDesconto = document.getElementById('sumDesconto');
  const sumTotal    = document.getElementById('sumTotal');
  const sumLucro    = document.getElementById('sumLucro');

  const btnSubmitOrder = document.getElementById('btnSubmitOrder');
  const feedback       = document.getElementById('feedback');

  // ── Init ───────────────────────────────────────────────
  loadData();
  bindEvents();

  // ══════════════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════════════

  async function loadData() {
    try {
      const [clientRes, productRes] = await Promise.all([
        ApiService.getClients(),
        ApiService.getProducts(),
      ]);

      if (clientRes.ok) {
        clients = clientRes.data;
        renderClientSelect();
      }

      if (productRes.ok) {
        products = productRes.data.filter(p => p.ativo !== false && p.ativo !== 0);
        renderProductSelect();
      }
    } catch (err) {
      showFeedback('Erro ao carregar dados. Recarregue a página.', 'error');
    }
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

  // ══════════════════════════════════════════════════════
  //  EVENTS
  // ══════════════════════════════════════════════════════

  function bindEvents() {
    btnAddItem.addEventListener('click', addItemToCart);
    inputTaxaEntrega.addEventListener('input', recalc);
    inputDesconto.addEventListener('input', recalc);
    btnSubmitOrder.addEventListener('click', submitOrder);
  }

  // ══════════════════════════════════════════════════════
  //  CART LOGIC
  // ══════════════════════════════════════════════════════

  function addItemToCart() {
    const productId = Number(selectProduct.value);
    const quantidade = parseInt(inputQtd.value, 10);

    if (!productId) { showFeedback('Selecione um produto.', 'error'); return; }
    if (!quantidade || quantidade < 1) { showFeedback('Quantidade inválida.', 'error'); return; }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Se já existe no carrinho, soma quantidade
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

    // Reset input
    selectProduct.value = '';
    inputQtd.value = 1;
    hideFeedback();

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
        <td>
          <button class="btn-remove" data-idx="${idx}" title="Remover">&times;</button>
        </td>
      </tr>
    `).join('');

    // Bind remove buttons
    cartBody.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(Number(btn.dataset.idx)));
    });
  }

  // ══════════════════════════════════════════════════════
  //  FINANCIAL CALCULATIONS (live)
  // ══════════════════════════════════════════════════════

  function recalc() {
    const subtotal = cart.reduce((sum, i) => sum + (i.preco_venda * i.quantidade), 0);
    const custoTotal = cart.reduce((sum, i) => sum + (i.preco_custo * i.quantidade), 0);
    const taxa = parseFloat(inputTaxaEntrega.value) || 0;
    const desconto = parseFloat(inputDesconto.value) || 0;

    const total = Math.max((subtotal + taxa) - desconto, 0);
    const lucro = (subtotal - custoTotal) - desconto;

    sumSubtotal.textContent = `R$ ${fmt(subtotal)}`;
    sumTaxa.textContent     = `R$ ${fmt(taxa)}`;
    sumDesconto.textContent = `- R$ ${fmt(desconto)}`;
    sumTotal.textContent    = `R$ ${fmt(total)}`;
    sumLucro.textContent    = `R$ ${fmt(lucro)}`;

    // Cor do lucro
    sumLucro.style.color = lucro >= 0 ? 'var(--success)' : 'var(--destructive)';
  }

  // ══════════════════════════════════════════════════════
  //  SUBMIT ORDER
  // ══════════════════════════════════════════════════════

  async function submitOrder() {
    hideFeedback();

    const clientId = Number(selectClient.value);
    if (!clientId) { showFeedback('Selecione um cliente.', 'error'); return; }
    if (cart.length === 0) { showFeedback('Adicione pelo menos um item.', 'error'); return; }

    const payload = {
      client_id: clientId,
      tipo_entrega: selectTipoEntrega.value,
      taxa_entrega: parseFloat(inputTaxaEntrega.value) || 0,
      desconto: parseFloat(inputDesconto.value) || 0,
      items: cart.map(i => ({ product_id: i.product_id, quantidade: i.quantidade })),
    };

    // Opcionais
    const dataEntrega = inputDataEntrega.value;
    if (dataEntrega) payload.data_entrega = dataEntrega;

    const formaPagamento = selectPagamento.value;
    if (formaPagamento) payload.forma_pagamento = formaPagamento;

    const observacoes = inputObservacoes.value.trim();
    if (observacoes) payload.observacoes = observacoes;

    // Loading
    btnSubmitOrder.disabled = true;
    btnSubmitOrder.textContent = 'Enviando…';

    try {
      const res = await ApiService.createOrder(payload);
      if (res.ok) {
        showFeedback('Encomenda criada com sucesso! Redirecionando…', 'success');
        setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);
      } else {
        const msg = res.data?.error || 'Erro ao criar encomenda.';
        showFeedback(msg, 'error');
        btnSubmitOrder.disabled = false;
        btnSubmitOrder.textContent = 'Confirmar Encomenda';
      }
    } catch (err) {
      showFeedback('Erro de conexão. Tente novamente.', 'error');
      btnSubmitOrder.disabled = false;
      btnSubmitOrder.textContent = 'Confirmar Encomenda';
    }
  }

  // ══════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════

  function fmt(value) {
    return Number(value).toFixed(2).replace('.', ',');
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function showFeedback(msg, type) {
    feedback.className = `pdv-feedback ${type}`;
    feedback.textContent = msg;
    feedback.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideFeedback() {
    feedback.style.display = 'none';
    feedback.className = 'pdv-feedback';
  }
});
