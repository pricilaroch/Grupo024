document.addEventListener('DOMContentLoaded', () => {
  RouteGuard.requireApproved && RouteGuard.requireApproved();

  const form = document.getElementById('clientRegisterForm');
  const telefone = document.getElementById('telefone');
  const errorMessage = document.getElementById('errorMessage');

  if (telefone) {
    telefone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      v = v.slice(0, 11);
      if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      if (v.length > 7) v = v.replace(/(\d{5})(\d)/g, '$1-$2');
      e.target.value = v;
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    errorMessage.style.display = 'none';

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    if (data.telefone) data.telefone = data.telefone.replace(/\D/g, '');

    try {
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      const res = await ApiService.createClient(data);
      if (res.ok) {
        window.location.href = '/clients.html';
      } else {
        throw new Error(res.data && res.data.error ? res.data.error : 'Erro ao salvar cliente');
      }
    } catch (err) {
      errorMessage.textContent = err.message || 'Erro desconhecido';
      errorMessage.style.display = 'block';
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = false;
      btn.textContent = 'Salvar Cliente';
    }
  });
});
