document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inscricaoForm');
    const successMessage = document.getElementById('successMessage');
    
    // Substitua esta URL pela URL do seu Google Apps Script
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbyWoTUyr8M0JZZZkmeOU_7k0B5hE00cjzM9EzoY6mIGXW-sK0IOXPqNeuMIy8seq2x9eg/exec';
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar CPF
        if (!validarCPF(document.getElementById('cpf').value)) {
            alert('CPF inválido!');
            return;
        }
        
        // Validar CEP
        if (!validarCEP(document.getElementById('cep').value)) {
            alert('CEP inválido!');
            return;
        }
        
        // Coletar dados do formulário
        const formData = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            dataNascimento: document.getElementById('dataNascimento').value,
            sexo: document.querySelector('input[name="sexo"]:checked').value,
            rg: document.getElementById('rg').value,
            ufRg: document.getElementById('ufRg').value,
            deficiencia: document.getElementById('deficiencia').value,
            nacionalidade: document.getElementById('nacionalidade').value,
            paisNascimento: document.getElementById('paisNascimento').value,
            cep: document.getElementById('cep').value,
            endereco: document.getElementById('endereco').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            bairro: document.getElementById('bairro').value,
            uf: document.getElementById('uf').value,
            cidade: document.getElementById('cidade').value,
            treineiro: document.getElementById('treineiro').value,
            ensinoMedio: document.querySelector('input[name="ensinoMedio"]:checked').value,
            anoConclusao: document.getElementById('anoConclusao').value,
            tipoInscricao: document.getElementById('tipoInscricao').value,
            cursoOpcao1: document.getElementById('cursoOpcao1').value,
            cupomPromocional: document.getElementById('cupomPromocional').value,
            analista: document.getElementById('analista').value 
        };
        
        // Enviar dados para o Google Sheets
        fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(() => {
            form.style.display = 'none';
            successMessage.style.display = 'block';
            window.scrollTo(0, 0);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.');
        });
    });
    
    // Máscaras para os campos
    document.getElementById('cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });
    
    document.getElementById('telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });
    
    document.getElementById('cep').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
    
    // Funções de validação
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }
    
    function validarCEP(cep) {
        cep = cep.replace(/\D/g, '');
        return cep.length === 8;
    }
});
