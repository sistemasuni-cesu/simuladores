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
            0, 0, 0, 65, 0, 0, 65, 0, 0, 0, 0, 0, 65, 65, 0, 65, 0, 65, 0, 0, 0
        ]
    },
    noturno: {
        prices: [
            0, 2200.21, 1937.13, 1841.46, 932.63, 1387.04, 0, 2152.38, 0, 1674.04, 0, 1745.79, 2032.79, 0, 1793.63, 0, 855.26, 0, 956.55, 1291.38, 0
        ],
        discounts: [
            0, 60, 65, 60, 50, 55, 0, 65, 0, 55, 0, 60, 60, 0, 60, 0, 50, 0, 50, 55, 0
        ]
    }
};

document.getElementById('enemSimulatorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const courseIndex = parseInt(document.getElementById('course').value);
    const shift = document.querySelector('input[name="shift"]:checked').value;
    const humanas = parseFloat(document.getElementById('humanas').value);
    const natureza = parseFloat(document.getElementById('natureza').value);
    const linguagens = parseFloat(document.getElementById('linguagens').value);
    const matematica = parseFloat(document.getElementById('matematica').value);
    const redacao = parseFloat(document.getElementById('redacao').value);
    
    // Verificar se o curso está disponível no turno selecionado
    const coursePrice = coursesData[shift].prices[courseIndex];
    if (coursePrice === 0) {
        showError("Não existem valores cadastrados para este curso no turno selecionado.");
        return;
    }
    
    // Calcular média das notas
    const average = (humanas + natureza + linguagens + matematica + redacao) / 5;
    
    // Calcular primeira mensalidade (desconto padrão + 10% em cascata)
    const standardDiscount = coursesData[shift].discounts[courseIndex] / 100;
    let firstInstallment = coursePrice * (1 - standardDiscount);
    firstInstallment = firstInstallment * 0.9; // 10% adicional em cascata
    
    // Calcular segunda mensalidade baseada na média
    let secondInstallmentDiscount = 0;
    
    if (average >= 951 && average <= 1000) {
        secondInstallmentDiscount = 1; // 100%
    } else if (average >= 801 && average <= 950) {
        secondInstallmentDiscount = 0.7 + (0.3 * 0.1); // 70% + 10% em cascata
    } else if (average >= 601 && average <= 800) {
        secondInstallmentDiscount = 0.65 + (0.35 * 0.1); // 65% + 10% em cascata
    } else if (average >= 400 && average <= 600) {
        secondInstallmentDiscount = 0.55 + (0.45 * 0.1); // 55% + 10% em cascata
    }
    
    let secondInstallment = coursePrice * (1 - secondInstallmentDiscount);
    
    // Verificar se a segunda mensalidade é menor que a primeira
    let showBoth = false;
    if (secondInstallment < firstInstallment) {
        showBoth = true;
    }
    
    // Exibir resultados
    displayResults({
        courseName: coursesData.names[courseIndex],
        shift: shift === 'matutino' ? 'Matutino' : 'Noturno',
        average: average.toFixed(1),
        coursePrice: coursePrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}),
        standardDiscount: `${coursesData[shift].discounts[courseIndex]}%`,
        firstInstallment: firstInstallment.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}),
        secondInstallment: secondInstallment.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}),
        showBoth: showBoth
    });
});

function showError(message) {
    const resultsDiv = document.getElementById('results');
    const resultContent = document.getElementById('resultContent');
    
    resultContent.innerHTML = `
        <div class="error-message">${message}</div>
    `;
    
    resultsDiv.style.display = 'block';
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    const resultContent = document.getElementById('resultContent');
    
    let html = `
        <div class="result-item">
            <span class="result-label">Curso:</span>
            <span class="result-value">${data.courseName}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Turno:</span>
            <span class="result-value">${data.shift}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Média das notas:</span>
            <span class="result-value">${data.average}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Valor integral:</span>
            <span class="result-value">${data.coursePrice}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Desconto padrão:</span>
            <span class="result-value">${data.standardDiscount}</span>
        </div>
    `;
    
    if (data.showBoth) {
        html += `
            <div class="highlight">
                <div class="result-item">
                    <span class="result-label">1ª Mensalidade (com desconto padrão + 10%):</span>
                    <span class="result-value">${data.firstInstallment}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Mensalidades seguintes (com desconto por nota):</span>
                    <span class="result-value">${data.secondInstallment}</span>
                </div>
                <p style="margin-top: 1rem;">Você pode pagar a primeira mensalidade por ${data.firstInstallment} e as seguintes por ${data.secondInstallment}!</p>
            </div>
        `;
    } else {
        html += `
            <div class="highlight">
                <div class="result-item">
                    <span class="result-label">Valor da mensalidade:</span>
                    <span class="result-value">${data.firstInstallment}</span>
                </div>
                <p style="margin-top: 1rem;">Este será o valor de todas as suas mensalidades.</p>
            </div>
        `;
    }
    
    resultContent.innerHTML = html;
    resultsDiv.style.display = 'block';

}

