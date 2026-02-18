document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const inputCpf = document.getElementById('cpf');
    const inputCnpj = document.getElementById('cnpj');
    const inputTelefone = document.getElementById('telefone');
    const errorMessage = document.getElementById('errorMessage');

    // 1. Máscara para CPF: 000.000.000-00
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

    // 2. Máscara para CNPJ: 00.000.000/0000-00
    if (inputCnpj) {
        inputCnpj.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            v = v.slice(0, 14);
            v = v.replace(/^(\d{2})(\d)/, '$1.$2')
                 .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                 .replace(/\.(\d{3})(\d)/, '.$1/$2')
                 .replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = v;
        });
    }

    // 3. Máscara para Telefone: (00) 00000-0000
    if (inputTelefone) {
        inputTelefone.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, ''); 
            v = v.slice(0, 11);
            if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
            if (v.length > 7) v = v.replace(/(\d{5})(\d)/g, '$1-$2');
            e.target.value = v;
        });
    }

    // 4. Lógica de Envio
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.style.display = 'none';

            const formData = new FormData(registerForm);
            const userData = Object.fromEntries(formData.entries());

            // LIMPEZA: Remove máscaras para o banco de dados
            userData.cpf = userData.cpf.replace(/\D/g, '');
            if (userData.cnpj) {
                userData.cnpj = userData.cnpj.replace(/\D/g, '');
            }
            if (userData.telefone) {
                userData.telefone = userData.telefone.replace(/\D/g, '');
            }

            try {
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processando...';

                const result = await ApiService.register(userData);

                if (result.ok) {
                    window.location.href = '/pending.html';
                } else {
                    throw new Error(result.data.error || 'Erro no cadastro');
                }
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
                
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar Conta';
            }
        });
    }
});