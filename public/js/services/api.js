// ATENÇÃO: Este arquivo define o objeto que os outros arquivos usam.
const ApiService = {
    BASE_URL: 'http://localhost:3000',

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error("Erro na API:", error);
            throw error;
        }
    },

    async register(userData) {
        return await this.post('/users/register', userData);
    },

    async login(cpf, senha) {
        const result = await this.post('/login', { cpf, senha });
        if (result.ok && result.data.token) {
            sessionStorage.setItem('token', result.data.token);
            sessionStorage.setItem('user', JSON.stringify(result.data.user));
        }
        return result;
    },

    async getPendingUsers() {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/admin/users/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error("Erro ao buscar usuários pendentes:", error);
            throw error;
        }
    },

    async updateUserStatus(userId, status, motivo = '') {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, motivo })
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error(`Erro ao atualizar status do usuário ${userId}:`, error);
            throw error;
        }
    },


    // ─── Products ────────────────────────────────────

    async getProducts() {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/products/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            throw error;
        }
    },

    async createProduct(productData) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            throw error;
        }
    },

    async updateProduct(id, productData) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/products/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            // PATCH may return 204 with no body
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    },

    async deleteProduct(id) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // DELETE returns 204 with no body
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            throw error;
        }
    },

    getUser() {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    logout() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/index.html';
    },

    clearSession() {
        sessionStorage.clear();
    }
};