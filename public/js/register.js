document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const errorDiv = document.getElementById('errorMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    clearInputErrors();

    const nome = getValue('nome');
    const cpf_cnpj = getValue('cpf_cnpj');
    const email = getValue('email');
    const telefone = getValue('telefone');
    const data_nascimento = getValue('data_nascimento');
    const endereco = getValue('endereco');
    const senha = getValue('senha');
    const confirmar_senha = getValue('confirmar_senha');
    const observacao = getValue('observacao');

    // Validações no frontend
    if (!nome || !cpf_cnpj || !email || !telefone || !data_nascimento || !endereco || !senha) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (senha.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres.');
      markError('senha');
      return;
    }

    if (senha !== confirmar_senha) {
      showError('As senhas não coincidem.');
      markError('confirmar_senha');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Por favor, insira um e-mail válido.');
      markError('email');
      return;
    }

    // Desabilitar botão durante o envio
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cadastrando...';

    try {
      const response = await fetch('/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          cpf_cnpj,
          email,
          telefone,
          data_nascimento,
          endereco,
          senha,
          observacao,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirecionar para a página de pendência
        window.location.href = '/pending.html';
      } else {
        showError(data.error || 'Erro ao realizar cadastro. Tente novamente.');
      }
    } catch (err) {
      showError('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cadastrar';
    }
  });

  // --- Funções auxiliares ---

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideError() {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }

  function markError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('input-error');
  }

  function clearInputErrors() {
    document.querySelectorAll('.input-error').forEach((el) => {
      el.classList.remove('input-error');
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});
