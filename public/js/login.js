document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('errorMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const cpf_cnpj = getValue('cpf_cnpj');
    const senha = getValue('senha');

    if (!cpf_cnpj || !senha) {
      showError('Preencha todos os campos.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';

    try {
      const result = await ApiService.login(cpf_cnpj, senha);

      if (!result.ok) {
        showError(result.data.error || 'Erro ao realizar login.');
        return;
      }

      const user = result.data.user;

      // Redirecionamento baseado no status
      switch (user.status) {
        case 'aprovado':
          window.location.href = '/dashboard.html';
          break;
        case 'pendente':
          window.location.href = '/pending.html';
          break;
        case 'reprovado':
          window.location.href = '/rejected.html';
          break;
        default:
          showError('Status desconhecido. Contate o suporte.');
      }
    } catch (err) {
      showError('Erro de conexão com o servidor. Verifique sua internet.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
    }
  });

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
  }

  function hideError() {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
});
