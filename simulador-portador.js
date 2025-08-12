// Dados dos cursos
const coursesData = {
    names: [
        "GRADUAÇÃO EM ADMINISTRAÇÃO",
        "GRADUAÇÃO EM AGRONOMIA",
        "GRADUAÇÃO EM ARQUITETURA E URBANISMO",
        "GRADUAÇÃO EM BIOMEDICINA",
        "GRADUAÇÃO EM CIÊNCIAS CONTÁBEIS",
        "GRADUAÇÃO EM COMUNICAÇÃO SOCIAL",
        "GRADUAÇÃO EM DIREITO",
        "GRADUAÇÃO EM ENFERMAGEM",
        "GRADUAÇÃO EM ENGENHARIA CIVIL",
        "GRADUAÇÃO EM ENGENHARIA DE SOFTWARE",
        "GRADUAÇÃO EM ENGENHARIA MECÂNICA",
        "GRADUAÇÃO EM FARMÁCIA",
        "GRADUAÇÃO EM FISIOTERAPIA",
        "GRADUAÇÃO EM MEDICINA VETERINÁRIA",
        "GRADUAÇÃO EM NUTRIÇÃO",
        "GRADUAÇÃO EM ODONTOLOGIA",
        "GRADUAÇÃO EM PEDAGOGIA",
        "GRADUAÇÃO EM PSICOLOGIA",
        "SUPERIOR DE TECNOLOGIA EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS",
        "SUPERIOR DE TECNOLOGIA EM ESTÉTICA E COSMÉTICA",
        "SUPERIOR DE TECNOLOGIA EM PROCESSOS GERENCIAIS"
    ],
    matutino: {
        prices: [
            0, 0, 0, 2116.51, 0, 0, 2056.72, 0, 0, 0, 0, 0, 1931.16, 4520.13, 0, 5082.17, 0, 2612.77, 0, 0, 0
        ],
        discounts: [
            0, 0, 0, 60, 0, 0, 60, 0, 0, 0, 0, 0, 60, 60, 0, 60, 0, 60, 0, 0, 0
        ]
    },
    noturno: {
        prices: [
            1028.29, 2200.21, 1937.13, 1841.46, 932.63, 1387.04, 1793.63, 2152.38, 1889.30, 1674.04, 2056.72, 1745.79, 2032.79, 0, 1793.63, 0, 855.26, 2271.96, 956.55, 1291.38, 908.71
        ],
        discounts: [
            60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 0, 60, 0, 60, 60, 60, 60, 60
        ]
    }
};

// Adiciona eventos aos botões de variáveis
document.querySelectorAll('.variable-btn').forEach(button => {
    button.addEventListener('click', function() {
        const textarea = document.getElementById('messageTemplate');
        const variable = this.getAttribute('data-var');
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        
        // Insere a variável na posição do cursor
        textarea.value = textarea.value.substring(0, startPos) + variable + textarea.value.substring(endPos);
        
        // Coloca o foco de volta no textarea
        textarea.focus();
        textarea.selectionStart = startPos + variable.length;
        textarea.selectionEnd = startPos + variable.length;
    });
});

document.getElementById('transferenciaSimulatorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const courseIndex = parseInt(document.getElementById('course').value);
    const shift = document.querySelector('input[name="shift"]:checked').value;
    const messageTemplate = document.getElementById('messageTemplate').value;
    
    // Verificar se o curso está disponível no turno selecionado
    const coursePrice = coursesData[shift].prices[courseIndex];
    if (coursePrice === 0) {
        showError("Não existem valores cadastrados para este curso no turno selecionado.");
        return;
    }
    
    // Obter desconto padrão (60% para transferência)
    const discount = 60;
    const punctualityDiscount = 10;
    
    // Calcular valor final (desconto em cascata)
    let finalPrice = coursePrice * (1 - discount/100);
    finalPrice = finalPrice * (1 - punctualityDiscount/100);
    
    // Formatar valores monetários
    const formattedFullPrice = coursePrice.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    const formattedFinalPrice = finalPrice.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    // Substituir variáveis no template
    let resultMessage = messageTemplate
        .replace(/{course}/g, coursesData.names[courseIndex])
        .replace(/{shift}/g, shift === 'matutino' ? 'Matutino' : 'Noturno')
        .replace(/{fullPrice}/g, formattedFullPrice)
        .replace(/{discount}/g, discount)
        .replace(/{finalPrice}/g, formattedFinalPrice);
    
    // Exibir resultados
    displayResults(resultMessage);
});

function displayResults(message) {
    const resultsDiv = document.getElementById('results');
    const resultContent = document.getElementById('resultContent');
    
    resultContent.innerHTML = `<pre>${message}</pre>`;
    resultsDiv.style.display = 'block';
    
    // Configurar botão de copiar
    document.getElementById('copyButton').addEventListener('click', function() {
        navigator.clipboard.writeText(message).then(function() {
            alert('Mensagem copiada com sucesso!');
        }, function() {
            // Fallback para navegadores mais antigos
            const range = document.createRange();
            range.selectNode(resultContent);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            alert('Texto copiado para a área de transferência!');
        });
    });
}

function showError(message) {
    const resultsDiv = document.getElementById('results');
    const resultContent = document.getElementById('resultContent');
    
    resultContent.innerHTML = `
        <div class="error-message">${message}</div>
    `;
    
    resultsDiv.style.display = 'block';
}