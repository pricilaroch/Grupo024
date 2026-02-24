/**
 * clients.js — Gestão de Clientes (Agenda WhatsApp Inteligente)
 * Depende de: api.js, guard.js
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Guard ──────────────────────────────────────────────
  if (!RouteGuard.requireApproved()) return;
  RouteGuard.renderNavbar();

  // ── State ──────────────────────────────────────────────
  let clients = [];
  let editingId = null;
  let deletingId = null;
  let searchTerm = '';

  // ── DOM refs ───────────────────────────────────────────
  const grid          = document.getElementById('clientsGrid');
  const emptyState    = document.getElementById('emptyState');
  const loadingState  = document.getElementById('loadingState');
  const clientCount   = document.getElementById('clientCount');
  const searchInput   = document.getElementById('searchInput');

  const modal         = document.getElementById('clientModal');
  const modalTitle    = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const form          = document.getElementById('clientForm');
  const formAlert     = document.getElementById('formAlert');
  const btnSubmit     = document.getElementById('btnSubmit');

  const deleteModal       = document.getElementById('deleteModal');
  const deleteClientName  = document.getElementById('deleteClientName');

  // ── Init ───────────────────────────────────────────────
  loadClients();
  bindEvents();

  // ══════════════════════════════════════════════════════
  //  DATA
  // ══════════════════════════════════════════════════════

  async function loadClients() {
    showLoading(true);
    try {
      const res = await ApiService.getClients();
      if (res.ok) {
        clients = res.data;
      } else {
        clients = [];
      }
    } catch {
      clients = [];
    }
    showLoading(false);
    render();
  }

  // ══════════════════════════════════════════════════════
  //  RENDERING
  // ══════════════════════════════════════════════════════

  function render() {
    const filtered = filterClients(clients);
    updateCount(filtered.length, clients.length);

    if (clients.length === 0) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    grid.style.display = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="products-empty-filter">
          <p>Nenhum cliente encontrado com esta busca.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(renderCard).join('');
  }

  function renderCard(c) {
    const phone = sanitizePhone(c.telefone);
    const whatsappUrl = `https://wa.me/55${phone}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco)}`;

    return `
      <div class="client-card" data-id="${c.id}">
        <div class="client-card-body">
          <div class="client-card-top">
            <div>
              <h3 class="client-card-name">${escapeHtml(c.nome)}</h3>
              ${c.email ? `<span class="client-card-email">${escapeHtml(c.email)}</span>` : ''}
            </div>
          </div>

          <div class="client-card-info">
            <div class="client-card-field">
              <span class="client-card-field-icon" aria-hidden="true">&#128222;</span>
              <span class="client-card-field-value">${escapeHtml(formatPhone(c.telefone))}</span>
            </div>
            <div class="client-card-field">
              <span class="client-card-field-icon" aria-hidden="true">&#128205;</span>
              <span class="client-card-field-value">${escapeHtml(c.endereco)}</span>
            </div>
          </div>

          <!-- Smart Actions -->
          <div class="client-card-smart-actions">
            <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" title="Abrir WhatsApp">
              &#128172; WhatsApp
            </a>
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-maps btn-sm" title="Abrir no Google Maps">
              &#127758; Mapas
            </a>
          </div>
        </div>

        <div class="product-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="ClientPage.edit(${c.id})">&#9998; Editar</button>
          <button class="btn btn-ghost btn-sm btn-ghost-danger" onclick="ClientPage.confirmDelete(${c.id})">&#128465; Excluir</button>
        </div>
      </div>`;
  }

  function filterClients(list) {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(c =>
      c.nome.toLowerCase().includes(term) ||
      c.telefone.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }

  function updateCount(shown, total) {
    if (total === 0) {
      clientCount.textContent = '';
      return;
    }
    clientCount.textContent = shown === total
      ? `${total} cliente${total !== 1 ? 's' : ''}`
      : `${shown} de ${total}`;
  }

  // ══════════════════════════════════════════════════════
  //  PHONE HELPERS
  // ══════════════════════════════════════════════════════

  /** Remove tudo que não é dígito */
  function sanitizePhone(phone) {
    return (phone || '').replace(/\D/g, '');
  }

  /** Formata para (XX) 9XXXX-XXXX */
  function formatPhone(phone) {
    const digits = sanitizePhone(phone);
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }

  /** Máscara de telefone em tempo real */
  function applyPhoneMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }

    input.value = value;
  }

  // ══════════════════════════════════════════════════════
  //  FORM — Open / Close / Submit
  // ══════════════════════════════════════════════════════

  function openCreateModal() {
    editingId = null;
    modalTitle.textContent = 'Novo Cliente';
    modalSubtitle.textContent = 'Preencha os dados do cliente.';
    btnSubmit.textContent = 'Salvar Cliente';
    form.reset();
    clearFieldErrors();
    hideFormAlert();
    modal.style.display = 'flex';
  }

  function openEditModal(client) {
    editingId = client.id;
    modalTitle.textContent = 'Editar Cliente';
    modalSubtitle.textContent = `Editando "${client.nome}"`;
    btnSubmit.textContent = 'Atualizar Cliente';
    clearFieldErrors();
    hideFormAlert();

    setValue('nome', client.nome);
    setValue('telefone', formatPhone(client.telefone));
    setValue('email', client.email || '');
    setValue('endereco', client.endereco);

    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.style.display = 'none';
    editingId = null;
  }

  function closeDeleteModal() {
    deleteModal.style.display = 'none';
    deletingId = null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearFieldErrors();
    hideFormAlert();

    const data = collectFormData();

    // Client-side validation
    const errors = validateClient(data, editingId != null);
    if (errors.length > 0) {
      errors.forEach(err => showFieldError(err.field, err.message));
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = editingId ? 'Atualizando…' : 'Salvando…';

    try {
      let res;
      if (editingId) {
        res = await ApiService.updateClient(editingId, data);
      } else {
        res = await ApiService.createClient(data);
      }

      if (res.ok) {
        closeModal();
        await loadClients();
      } else {
        handleApiErrors(res.data);
      }
    } catch {
      showFormAlert('Erro de conexão. Tente novamente.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = editingId ? 'Atualizar Cliente' : 'Salvar Cliente';
    }
  }

  // ══════════════════════════════════════════════════════
  //  DELETE
  // ══════════════════════════════════════════════════════

  function confirmDelete(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    deletingId = id;
    deleteClientName.textContent = client.nome;
    deleteModal.style.display = 'flex';
  }

  async function executeDelete() {
    if (!deletingId) return;

    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.textContent = 'Excluindo…';

    try {
      const res = await ApiService.deleteClient(deletingId);
      if (res.ok) {
        closeDeleteModal();
        await loadClients();
      }
    } catch {
      // silent
    } finally {
      btn.disabled = false;
      btn.textContent = 'Excluir';
    }
  }

  // ══════════════════════════════════════════════════════
  //  VALIDATION (mirrors Zod schema)
  // ══════════════════════════════════════════════════════

  function validateClient(data, isUpdate) {
    const errors = [];

    if (!isUpdate || data.nome !== undefined) {
      if (!data.nome || data.nome.length < 3) {
        errors.push({ field: 'nome', message: 'Nome deve ter pelo menos 3 caracteres.' });
      }
    }

    if (!isUpdate || data.telefone !== undefined) {
      const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
      if (!data.telefone || !phoneRegex.test(data.telefone)) {
        errors.push({ field: 'telefone', message: 'Telefone inválido. Use (XX) 9XXXX-XXXX.' });
      }
    }

    if (data.email && data.email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({ field: 'email', message: 'E-mail inválido.' });
      }
    }

    if (!isUpdate || data.endereco !== undefined) {
      if (!data.endereco || data.endereco.length < 5) {
        errors.push({ field: 'endereco', message: 'Endereço muito curto (mínimo 5 caracteres).' });
      }
    }

    return errors;
  }

  // ══════════════════════════════════════════════════════
  //  FORM HELPERS
  // ══════════════════════════════════════════════════════

  function collectFormData() {
    const raw = {};
    const fields = ['nome', 'telefone', 'email', 'endereco'];

    fields.forEach(f => {
      const el = document.getElementById(`f-${f}`);
      if (!el) return;
      const val = el.value.trim();

      if (val === '' && editingId) return;
      raw[f] = val;
    });

    return raw;
  }

  function setValue(field, value) {
    const el = document.getElementById(`f-${field}`);
    if (el) el.value = value ?? '';
  }

  function showFieldError(field, msg) {
    const span = document.querySelector(`.field-error[data-for="${field}"]`);
    if (span) {
      span.textContent = msg;
      span.style.display = 'block';
    }
    const input = document.getElementById(`f-${field}`);
    if (input) input.classList.add('input-error');
  }

  function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  function showFormAlert(msg) {
    formAlert.textContent = msg;
    formAlert.style.display = 'block';
  }

  function hideFormAlert() {
    formAlert.style.display = 'none';
  }

  function handleApiErrors(data) {
    if (!data || !data.error) {
      showFormAlert('Erro inesperado ao salvar.');
      return;
    }

    const message = data.error;
    const messages = message.split('; ');

    const fieldMap = {
      'nome': 'nome',
      'telefone': 'telefone',
      'phone': 'telefone',
      'email': 'email',
      'e-mail': 'email',
      'endereco': 'endereco',
      'endereço': 'endereco',
      'address': 'endereco',
    };

    let mapped = false;
    messages.forEach(msg => {
      const lower = msg.toLowerCase();
      for (const [keyword, field] of Object.entries(fieldMap)) {
        if (lower.includes(keyword)) {
          showFieldError(field, msg);
          mapped = true;
          break;
        }
      }
    });

    if (!mapped) {
      showFormAlert(message);
    }
  }

  // ── Real-time field validation ─────────────────────────
  function onFieldBlur(e) {
    const field = e.target.name;
    if (!field) return;

    const data = collectFormData();
    const errors = validateClient(data, editingId != null);
    const err = errors.find(er => er.field === field);

    const span = document.querySelector(`.field-error[data-for="${field}"]`);
    if (span) { span.textContent = ''; span.style.display = 'none'; }
    e.target.classList.remove('input-error');

    if (err) {
      showFieldError(err.field, err.message);
    }
  }

  // ══════════════════════════════════════════════════════
  //  UI HELPERS
  // ══════════════════════════════════════════════════════

  function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
    if (show) {
      grid.style.display = 'none';
      emptyState.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ══════════════════════════════════════════════════════
  //  EVENT BINDINGS
  // ══════════════════════════════════════════════════════

  function bindEvents() {
    // New client buttons
    document.getElementById('btnNewClient').addEventListener('click', openCreateModal);
    document.getElementById('btnEmptyNew').addEventListener('click', openCreateModal);

    // Modal close
    document.getElementById('btnCancelModal').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    // Delete modal
    document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('btnConfirmDelete').addEventListener('click', executeDelete);
    deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

    // Form submit
    form.addEventListener('submit', handleSubmit);

    // Phone mask
    document.getElementById('f-telefone').addEventListener('input', function () {
      applyPhoneMask(this);
    });

    // Real-time field validation
    form.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('blur', onFieldBlur);
    });

    // Search
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.trim();
      render();
    });

    // Keyboard: Escape to close modals
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (deleteModal.style.display !== 'none') closeDeleteModal();
        else if (modal.style.display !== 'none') closeModal();
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  PUBLIC API (for inline onclick handlers)
  // ══════════════════════════════════════════════════════

  window.ClientPage = {
    edit(id) {
      const client = clients.find(c => c.id === id);
      if (client) openEditModal(client);
    },
    confirmDelete,
  };
});
