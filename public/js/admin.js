document.addEventListener('DOMContentLoaded', () => {
  const usersList = document.getElementById('usersList');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('emptyState');

  // Modal elements
  const modalOverlay = document.getElementById('rejectModal');
  const modalUserName = document.getElementById('modalUserName');
  const tipoSelect = document.getElementById('tipoReprovacao');
  const motivoTextarea = document.getElementById('motivoReprovacao');
  const modalError = document.getElementById('modalError');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');

  let currentRejectId = null;

  // --- Carregar usuários pendentes ---
  loadPendingUsers();

  async function loadPendingUsers() {
    showLoading(true);
    try {
      const res = await fetch('/admin/users/pending');
      const data = await res.json();

      showLoading(false);

      if (!data.users || data.users.length === 0) {
        showEmpty(true);
        return;
      }

      showEmpty(false);
      renderUsers(data.users);
    } catch (err) {
      showLoading(false);
      usersList.innerHTML =
        '<p class="admin-error">Erro ao carregar usuários. Verifique a conexão.</p>';
    }
  }

  function renderUsers(users) {
    usersList.innerHTML = '';
    users.forEach((user) => {
      const card = createUserCard(user);
      usersList.appendChild(card);
    });
  }

  function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.dataset.id = user.id;

    const dataNasc = formatDate(user.data_nascimento);
    const dataCad = user.created_at ? formatDateTime(user.created_at) : '—';

    card.innerHTML = `
      <div class="user-card-header">
        <h3 class="user-card-name">${escapeHtml(user.nome)}</h3>
        <span class="badge badge-pending">Pendente</span>
      </div>
      <div class="user-card-body">
        <div class="user-card-field">
          <span class="field-label">CPF/CNPJ:</span>
          <span class="field-value">${escapeHtml(user.cpf_cnpj)}</span>
        </div>
        <div class="user-card-field">
          <span class="field-label">E-mail:</span>
          <span class="field-value">${escapeHtml(user.email)}</span>
        </div>
        <div class="user-card-field">
          <span class="field-label">Telefone:</span>
          <span class="field-value">${escapeHtml(user.telefone)}</span>
        </div>
        <div class="user-card-field">
          <span class="field-label">Nascimento:</span>
          <span class="field-value">${dataNasc}</span>
        </div>
        <div class="user-card-field">
          <span class="field-label">Endereço:</span>
          <span class="field-value">${escapeHtml(user.endereco)}</span>
        </div>
        ${user.observacao ? `
        <div class="user-card-field">
          <span class="field-label">Observação:</span>
          <span class="field-value">${escapeHtml(user.observacao)}</span>
        </div>` : ''}
        <div class="user-card-field">
          <span class="field-label">Cadastro em:</span>
          <span class="field-value">${dataCad}</span>
        </div>
      </div>
      <div class="user-card-actions">
        <button class="btn btn-approve" data-id="${user.id}">Aprovar</button>
        <button class="btn btn-reject" data-id="${user.id}" data-name="${escapeHtml(user.nome)}">Reprovar</button>
      </div>
    `;

    // Event listeners
    card.querySelector('.btn-approve').addEventListener('click', () => approveUser(user.id, card));
    card.querySelector('.btn-reject').addEventListener('click', () => openRejectModal(user.id, user.nome));

    return card;
  }

  // --- Aprovar Usuário ---
  async function approveUser(id, cardEl) {
    const btn = cardEl.querySelector('.btn-approve');
    btn.disabled = true;
    btn.textContent = 'Aprovando...';

    try {
      const res = await fetch(`/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aprovado' }),
      });

      const data = await res.json();

      if (res.ok) {
        animateRemoveCard(cardEl);
      } else {
        alert(data.error || 'Erro ao aprovar usuário.');
        btn.disabled = false;
        btn.textContent = 'Aprovar';
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
      btn.disabled = false;
      btn.textContent = 'Aprovar';
    }
  }

  // --- Modal de Reprovação ---
  function openRejectModal(id, name) {
    currentRejectId = id;
    modalUserName.textContent = name;
    tipoSelect.value = '';
    motivoTextarea.value = '';
    hideModalError();
    modalOverlay.style.display = 'flex';
  }

  function closeRejectModal() {
    modalOverlay.style.display = 'none';
    currentRejectId = null;
  }

  modalCancelBtn.addEventListener('click', closeRejectModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeRejectModal();
  });

  modalConfirmBtn.addEventListener('click', async () => {
    const tipo = tipoSelect.value;
    const detalhe = motivoTextarea.value.trim();

    if (!tipo) {
      showModalError('Selecione o tipo de reprovação.');
      return;
    }

    const motivo = detalhe ? `${tipo} - ${detalhe}` : tipo;

    modalConfirmBtn.disabled = true;
    modalConfirmBtn.textContent = 'Reprovando...';

    try {
      const res = await fetch(`/admin/users/${currentRejectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reprovado', motivo }),
      });

      const data = await res.json();

      if (res.ok) {
        closeRejectModal();
        const card = document.querySelector(`.user-card[data-id="${currentRejectId}"]`);
        if (card) animateRemoveCard(card);
      } else {
        showModalError(data.error || 'Erro ao reprovar usuário.');
      }
    } catch (err) {
      showModalError('Erro de conexão com o servidor.');
    } finally {
      modalConfirmBtn.disabled = false;
      modalConfirmBtn.textContent = 'Confirmar Reprovação';
    }
  });

  // --- UI Helpers ---
  function animateRemoveCard(cardEl) {
    cardEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'translateX(30px)';
    setTimeout(() => {
      cardEl.remove();
      // Check if list is empty
      if (usersList.children.length === 0) {
        showEmpty(true);
      }
    }, 400);
  }

  function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
  }

  function showEmpty(show) {
    emptyState.style.display = show ? 'block' : 'none';
  }

  function showModalError(msg) {
    modalError.textContent = msg;
    modalError.style.display = 'block';
  }

  function hideModalError() {
    modalError.textContent = '';
    modalError.style.display = 'none';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  function formatDateTime(dtStr) {
    if (!dtStr) return '—';
    try {
      const d = new Date(dtStr + 'Z');
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dtStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
