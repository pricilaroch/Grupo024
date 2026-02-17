/**
 * ApiService — Singleton que encapsula todas as chamadas fetch ao backend.
 * Trata centralizadamente erros 401 (redireciona para login) e 403.
 */
const ApiService = (() => {
  const BASE_URL = '';

  /**
   * Retorna o token JWT armazenado no sessionStorage.
   */
  function getToken() {
    return sessionStorage.getItem('token') || null;
  }

  /**
   * Armazena o token JWT no sessionStorage.
   */
  function setToken(token) {
    sessionStorage.setItem('token', token);
  }

  /**
   * Remove token e dados de usuário do sessionStorage.
   */
  function clearSession() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }

  /**
   * Realiza uma requisição HTTP genérica.
   * @param {string} endpoint - Caminho da API (ex: '/login')
   * @param {object} options - { method, body, auth }
   * @returns {Promise<{ok: boolean, status: number, data: object}>}
   */
  async function request(endpoint, options = {}) {
    const { method = 'GET', body = null, auth = false } = options;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (auth) {
      const token = getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const fetchOptions = {
      method,
      headers,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

    // Tratamento centralizado de 401
    if (response.status === 401 && auth) {
      clearSession();
      window.location.href = '/login.html';
      return { ok: false, status: 401, data: { error: 'Sessão expirada.' } };
    }

    // Tratamento centralizado de 403
    if (response.status === 403) {
      return { ok: false, status: 403, data: { error: 'Acesso negado.' } };
    }

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  }

  // --- Métodos públicos da API ---

  async function register(userData) {
    return request('/users/register', { method: 'POST', body: userData });
  }

  async function login(cpf_cnpj, senha) {
    const result = await request('/login', { method: 'POST', body: { cpf_cnpj, senha } });
    if (result.ok && result.data.token) {
      setToken(result.data.token);
      sessionStorage.setItem('user', JSON.stringify(result.data.user));
    }
    return result;
  }

  async function getPendingUsers() {
    return request('/admin/users/pending', { method: 'GET', auth: true });
  }

  async function updateUserStatus(id, status, motivo) {
    const body = { status };
    if (motivo) body.motivo = motivo;
    return request(`/admin/users/${id}/status`, { method: 'PATCH', body, auth: true });
  }

  function logout() {
    clearSession();
    window.location.href = '/login.html';
  }

  function getUser() {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  return {
    register,
    login,
    getPendingUsers,
    updateUserStatus,
    logout,
    getToken,
    getUser,
    clearSession,
  };
})();
