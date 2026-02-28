// ATENÇÃO: Este arquivo define o objeto que os outros arquivos usam.
const ApiService = {
    BASE_URL: 'http://localhost:3000',
    //BASE_URL: 'http://192.168.100.167:3000',

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
            const response = await fetch(`${this.BASE_URL}/products`, {
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

    // ─── Clients ─────────────────────────────────────

    async getClients() {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            throw error;
        }
    },

    async createClient(clientData) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(clientData)
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw error;
        }
    },

    async updateClient(id, clientData) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/clients/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(clientData)
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            throw error;
        }
    },

    async deleteClient(id) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/clients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            throw error;
        }
    },

    // ─── Orders ──────────────────────────────────────

    async getOrders() {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar encomendas:', error);
            throw error;
        }
    },

    async createOrder(orderData) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao criar encomenda:', error);
            throw error;
        }
    },

    async updateOrder(id, orderData) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao atualizar encomenda:', error);
            throw error;
        }
    },

    async getOrdersByStatus(statuses = []) {
        const token = sessionStorage.getItem('token');
        try {
            const params = statuses.map(s => `status=${encodeURIComponent(s)}`).join('&');
            const response = await fetch(`${this.BASE_URL}/orders/status?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar encomendas por status:', error);
            throw error;
        }
    },

    async getOrderItems(orderId) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/orders/${orderId}/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar itens da encomenda:', error);
            throw error;
        }
    },

    async updateOrderStatus(id, status) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/orders/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao atualizar status da encomenda:', error);
            throw error;
        }
    },

    async updatePaymentStatus(id, status_pagamento) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/orders/${id}/payment`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status_pagamento })
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao atualizar pagamento da encomenda:', error);
            throw error;
        }
    },

    async deleteOrder(id) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/orders/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao excluir encomenda:', error);
            throw error;
        }
    },

    // ─── Sales (Livro Caixa) ─────────────────────────

    async getSales() {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/sales`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
            throw error;
        }
    },

    async createSale(saleData) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(saleData)
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao criar venda:', error);
            throw error;
        }
    },

    async updateSale(id, saleData) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/sales/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(saleData)
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao atualizar venda:', error);
            throw error;
        }
    },

    async deleteSale(id) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/sales/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao excluir venda:', error);
            throw error;
        }
    },

    // ─── Expenses (Despesas / Contas a Pagar) ────────

    async getExpenses(status) {
        const token = sessionStorage.getItem('token');
        try {
            const qs = status ? `?status=${status}` : '';
            const response = await fetch(`${this.BASE_URL}/expenses${qs}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar despesas:', error);
            throw error;
        }
    },

    async createExpense(data) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao criar despesa:', error);
            throw error;
        }
    },

    async updateExpense(id, data) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/expenses/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao atualizar despesa:', error);
            throw error;
        }
    },

    async payExpense(id) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/expenses/${id}/pay`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao pagar despesa:', error);
            throw error;
        }
    },

    async deleteExpense(id) {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/expenses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 204) return { ok: true, data: {} };
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao excluir despesa:', error);
            throw error;
        }
    },

    async getExpenseSummary() {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/expenses/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar resumo de despesas:', error);
            throw error;
        }
    },

    async getFollowUp() {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${this.BASE_URL}/sales/follow-up`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            return { ok: response.ok, data: result };
        } catch (error) {
            console.error('Erro ao buscar follow-up:', error);
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