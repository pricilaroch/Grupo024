/**
 * RouteGuard — Funções de proteção de rota no frontend.
 * Deve ser incluído APÓS api.js e chamado no início de cada página.
 */
const RouteGuard = (() => {
  const user = ApiService.getUser();

  /**
   * Página pública (login, register): se já logado, redireciona.
   */
  function publicOnly() {
    if (!user) return true;
    if (user.role === 'admin') {
      window.location.href = '/admin.html';
      return false;
    }
    switch (user.status) {
      case 'aprovado': window.location.href = '/dashboard.html'; return false;
      case 'pendente': window.location.href = '/pending.html'; return false;
      case 'reprovado': window.location.href = '/rejected.html'; return false;
    }
    return true;
  }

  /**
   * Exige que o usuário esteja logado como produtor aprovado.
   */
  function requireApproved() {
    if (!user) { _goLogin(); return false; }
    if (user.status !== 'aprovado') { publicOnly(); return false; }
    return true;
  }

  /**
   * Exige que o usuário esteja logado com status pendente.
   */
  function requirePending() {
    if (!user) { _goLogin(); return false; }
    if (user.status !== 'pendente') { publicOnly(); return false; }
    return true;
  }

  /**
   * Exige que o usuário esteja logado com status reprovado.
   */
  function requireRejected() {
    if (!user) { _goLogin(); return false; }
    if (user.status !== 'reprovado') { publicOnly(); return false; }
    return true;
  }

  /**
   * Exige que o usuário esteja logado como admin.
   */
  function requireAdmin() {
    if (!user || user.role !== 'admin') {
      publicOnly();
      return false;
    }
    return true;
  }

  function _goLogin() {
    ApiService.clearSession();
    window.location.href = '/login.html';
  }

  /**
   * Renderiza a navbar padrão no elemento #navbar (se existir).
   */
  function renderNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    if (!user) {
      nav.innerHTML = `
        <div class="navbar-inner">
          <a href="/index.html" class="navbar-brand">Gestão de Encomendas</a>
          <div class="navbar-links">
            <a href="/login.html" class="navbar-link">Entrar</a>
            <a href="/register.html" class="navbar-link navbar-link-outline">Cadastrar</a>
          </div>
        </div>`;
      return;
    }

    const isAdmin = user.role === 'admin';
    const displayName = user.nome.split(' ')[0];

    nav.innerHTML = `
      <div class="navbar-inner">
        <a href="${isAdmin ? '/admin.html' : '/dashboard.html'}" class="navbar-brand">Gestão de Encomendas</a>
        <div class="navbar-links">
          ${!isAdmin ? '<a href="/products.html" class="navbar-link">Produtos</a>' : ''}
          ${!isAdmin ? '<a href="/clients.html" class="navbar-link">Clientes</a>' : ''}
          <span class="navbar-user">${displayName}</span>
          <button id="navLogoutBtn" class="navbar-link navbar-link-outline">Sair</button>
        </div>
      </div>`;

    document.getElementById('navLogoutBtn').addEventListener('click', () => {
      ApiService.logout();
    });
  }

  return {
    publicOnly,
    requireApproved,
    requirePending,
    requireRejected,
    requireAdmin,
    renderNavbar,
  };
})();
