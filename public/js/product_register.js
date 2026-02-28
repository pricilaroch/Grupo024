document.addEventListener('DOMContentLoaded', () => {
  RouteGuard.requireApproved && RouteGuard.requireApproved();

  const form = document.getElementById('productRegisterForm');
  const pv = document.getElementById('preco_venda');
  const pc = document.getElementById('preco_custo');
  const profitPreview = document.getElementById('profitPreview');
  const profitValue = document.getElementById('profitValue');
  const marginValue = document.getElementById('marginValue');
  const errorMessage = document.getElementById('errorMessage');

  function updateProfit() {
    const venda = parseFloat(pv.value) || 0;
    const custo = parseFloat(pc.value) || 0;
    if (venda > 0) {
      const lucro = venda - custo;
      const margem = venda > 0 ? ((lucro / venda) * 100) : 0;
      profitValue.textContent = 'R$ ' + lucro.toFixed(2).replace('.', ',');
      marginValue.textContent = margem.toFixed(1) + '%';
      profitPreview.style.display = 'block';
    } else {
      profitPreview.style.display = 'none';
    }
  }

  if (pv) pv.addEventListener('input', updateProfit);
  if (pc) pc.addEventListener('input', updateProfit);

  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    errorMessage.style.display = 'none';

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // Convert numeric fields
    if (data.preco_venda) data.preco_venda = parseFloat(data.preco_venda) || 0;
    if (data.preco_custo) data.preco_custo = parseFloat(data.preco_custo) || 0;
    if (data.quantidade_estoque) data.quantidade_estoque = parseInt(data.quantidade_estoque) || 0;
    if (data.tempo_producao_minutos) data.tempo_producao_minutos = parseInt(data.tempo_producao_minutos) || 0;

    try {
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      const res = await ApiService.createProduct(data);
      if (res.ok) {
        window.location.href = '/products.html';
      } else {
        throw new Error(res.data && res.data.error ? res.data.error : 'Erro ao salvar produto');
      }
    } catch (err) {
      errorMessage.textContent = err.message || 'Erro desconhecido';
      errorMessage.style.display = 'block';
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = false;
      btn.textContent = 'Salvar Produto';
    }
  });
});
