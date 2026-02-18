document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const inputCpf = document.getElementById('cpf');
    const errorMessage = document.getElementById('errorMessage');

    // --- Máscara para CPF: 000.000.000-00 ---
    if (inputCpf) {
        inputCpf.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2')
                 .replace(/(\d{3})(\d)/, '$1.$2')
                 .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = v;
        });
    }

    // --- Lógica de Submissão ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.style.display = 'none';

            const formData = new FormData(loginForm);
            const { cpf, senha } = Object.fromEntries(formData.entries());

            // Limpa a máscara antes de enviar para a API
            const cleanCpf = cpf.replace(/\D/g, '');

            try {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'A verificar...';

                const result = await ApiService.login(cleanCpf, senha);

                if (result.ok) {
                    const user = ApiService.getUser();
                    window.location.href = (user && user.role === 'admin') ? '/admin.html' : '/dashboard.html';
                } else {
                    throw new Error(result.data.error || 'Falha na autenticação.');
                }
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
            }
        });
    }
});