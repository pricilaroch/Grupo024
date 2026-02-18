document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const inputDoc = document.getElementById('cpf_cnpj');
    const inputTelefone = document.getElementById('telefone');
    const errorMessage = document.getElementById('errorMessage');

    // 1. Máscara e restrição para CPF/CNPJ (Apenas números)
    inputDoc.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, ''); 
        const isCnpj = document.querySelector('input[name="docType"]:checked').value === 'cnpj';

        if (isCnpj) {
            v = v.slice(0, 14);
            v = v.replace(/^(\d{2})(\d)/, '$1.$2')
                 .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                 .replace(/\.(\d{3})(\d)/, '.$1/$2')
                 .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2')
                 .replace(/(\d{3})(\d)/, '$1.$2')
                 .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        e.target.value = v;
    });

    // 2. Máscara para Telefone: (00) 00000-0000
    if (inputTelefone) {
        inputTelefone.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, ''); 
            v = v.slice(0, 11); // Limita a 11 dígitos
            if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
            if (v.length > 7) v = v.replace(/(\d{5})(\d)/g, '$1-$2');
            e.target.value = v;
        });
    }

    // 3. Lógica de Envio
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.style.display = 'none';

            // Captura todos os campos do formulário (incluindo data e endereço)
            const formData = new FormData(registerForm);
            const userData = Object.fromEntries(formData.entries());

            // LIMPEZA: Remove máscaras para o banco de dados (Zod espera números puros)
            userData.cpf_cnpj = userData.cpf_cnpj.replace(/\D/g, '');
            if (userData.telefone) {
                userData.telefone = userData.telefone.replace(/\D/g, '');
            }

            try {
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processando...';

                // Envia para o endereço correto descoberto no userRoutes.ts
                const result = await ApiService.register(userData);

                if (result.ok) {
                    // Sucesso! Usuário vai para a fila de aprovação
                    window.location.href = '/pending.html';
                } else {
                    // Trata erros vindos do Zod (ex: "O campo telefone é obrigatório")
                    throw new Error(result.data.error || 'Erro no cadastro');
                }
            } catch (error) {
                // Se o erro vier em formato de lista (vários campos), tratamos aqui
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
                
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar Conta';
            }
        });
    }
});