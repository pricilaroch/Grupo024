document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const inputDoc = document.getElementById('cpf_cnpj');
    const labelDoc = document.getElementById('labelDoc');
    const radioButtons = document.querySelectorAll('input[name="docType"]');
    const errorMessage = document.getElementById('errorMessage');

    // --- Lógica de Máscara (Igual à do Registo) ---
    const applyMask = (value) => {
        const isCnpj = document.querySelector('input[name="docType"]:checked').value === 'cnpj';
        let v = value.replace(/\D/g, ''); // Remove tudo o que não é número

        if (isCnpj) {
            v = v.slice(0, 14);
            v = v.replace(/^(\d{2})(\d)/, '$1.$2');
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
            v = v.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return v;
    };

    // Aplica a máscara enquanto o utilizador digita
    inputDoc.addEventListener('input', (e) => {
        e.target.value = applyMask(e.target.value);
    });

    // Troca o formato ao mudar entre CPF e CNPJ
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            inputDoc.value = '';
            if (e.target.value === 'cnpj') {
                labelDoc.textContent = 'CNPJ';
                inputDoc.placeholder = '00.000.000/0000-00';
                inputDoc.setAttribute('maxlength', '18');
            } else {
                labelDoc.textContent = 'CPF';
                inputDoc.placeholder = '000.000.000-00';
                inputDoc.setAttribute('maxlength', '14');
            }
        });
    });

    // --- Lógica de Submissão ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.style.display = 'none';

            const formData = new FormData(loginForm);
            let { cpf_cnpj, senha } = Object.fromEntries(formData.entries());

            // Limpa a máscara (pontos, traços, barras) antes de enviar para a API
            const cleanCpfCnpj = cpf_cnpj.replace(/\D/g, '');

            try {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'A verificar...';

                // Utiliza o ApiService para autenticação
                const result = await ApiService.login(cleanCpfCnpj, senha);

                if (result.ok) {
                    const user = ApiService.getUser();
                    // Redireciona com base no perfil do utilizador
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