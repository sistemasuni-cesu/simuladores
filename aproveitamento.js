// aproveitamento.js
document.addEventListener('DOMContentLoaded', function() {
    const { jsPDF } = window.jspdf;
    
    // Elementos do DOM
    const processButton = document.getElementById('processButton');
    const dataInput = document.getElementById('dataInput');
    const organizedResults = document.getElementById('organizedResults');
    const pendingResults = document.getElementById('pendingResults');
    const finalResultsContent = document.getElementById('finalResultsContent');
    const resultsSection = document.getElementById('resultsSection');
    const finalResults = document.getElementById('finalResults');
    const downloadButton = document.getElementById('downloadButton');
    const finalDownloadButton = document.getElementById('finalDownloadButton');
    const finalizeButton = document.getElementById('finalizeButton');
    
    // Variáveis globais
    let currentYear = new Date().getFullYear();
    let currentSemester = new Date().getMonth() < 6 ? 1 : 2;
    let disciplines = [];
    let pendingDisciplines = [];
    
    // Configuração das abas
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe active de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Adiciona a classe active ao botão clicado e ao conteúdo correspondente
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
    
    // Evento para processar os dados
    processButton.addEventListener('click', processData);
    
    // Evento para finalizar ajustes
    finalizeButton.addEventListener('click', finalizeAdjustments);
    
    // Evento para baixar PDF da grade organizada
    downloadButton.addEventListener('click', () => generatePDF('organized'));
    
    // Evento para baixar PDF final
    finalDownloadButton.addEventListener('click', () => generatePDF('final'));
    
    // Função principal para processar os dados
    function processData() {
        const inputText = dataInput.value.trim();
        if (!inputText) {
            alert('Por favor, cole os dados da planilha de aproveitamento.');
            return;
        }
        
        // Parse dos dados
        const lines = inputText.split('\n').filter(line => line.trim() !== '');
        disciplines = [];
        pendingDisciplines = [];
        
        // Estrutura esperada: 9 campos por disciplina
        for (let i = 0; i < lines.length; i += 9) {
            const discipline = {
                code: lines[i]?.trim() || '',
                name: lines[i+1]?.trim() || '',
                hours: lines[i+2]?.trim() || '',
                series: parseInt(lines[i+3]?.trim()) || 0,
                dispense: lines[i+4]?.trim() || '',
                adaptation: lines[i+5]?.trim() || '',
                enrollNow: lines[i+6]?.trim() || '',
                year: lines[i+7]?.trim().toLowerCase() === 'vazio' ? '' : lines[i+7]?.trim(),
                semester: lines[i+8]?.trim().toLowerCase() === 'vazio' ? '' : lines[i+8]?.trim(),
                equivalent: '' // Não está no input, mas pode ser preenchido depois
            };
            
            disciplines.push(discipline);
        }
        
        // Organizar as disciplinas
        organizeDisciplines();
        
        // Mostrar os resultados
        resultsSection.style.display = 'block';
        finalResults.style.display = 'none';
    }
    
    // Função para organizar as disciplinas conforme a lógica especificada
    function organizeDisciplines() {
        const initialSeries = parseInt(document.getElementById('initialSeries').value);
        const organizedBySeries = {};
        const dispensedDisciplines = [];
        
        // Determinar o ano/semestre atual para "Matricular agora"
        const enrollNowYear = currentYear;
        const enrollNowSemester = currentSemester;
        const nextYearSemester = currentSemester === 1 ? 
            { year: currentYear, semester: 2 } : 
            { year: currentYear + 1, semester: 1 };
        
        // Classificar cada disciplina
        disciplines.forEach(discipline => {
            // Disciplinas marcadas como "Dispensar = Sim" sem adaptação vão para a lista de dispensadas
            if (discipline.dispense === 'Sim' && discipline.adaptation === 'Não') {
                dispensedDisciplines.push(discipline);
                return;
            }
            
            // Disciplinas com adaptação
            if (discipline.adaptation === 'Sim') {
                // Verificar se é para matricular agora
                if (discipline.enrollNow === 'Sim' && discipline.year && discipline.semester) {
                    const targetSeries = getTargetSeriesForAdaptation(discipline, initialSeries);
                    if (!organizedBySeries[targetSeries]) {
                        organizedBySeries[targetSeries] = {
                            regular: [],
                            adaptation: []
                        };
                    }
                    organizedBySeries[targetSeries].adaptation.push(discipline);
                } 
                // Disciplinas com adaptação mas não para matricular agora
                else if (discipline.year && discipline.semester) {
                    // Verificar se o ano/semestre é futuro
                    const isFuture = isFutureSemester(discipline.year, discipline.semester);
                    if (isFuture) {
                        const targetSeries = getTargetSeriesForAdaptation(discipline, initialSeries);
                        if (!organizedBySeries[targetSeries]) {
                            organizedBySeries[targetSeries] = {
                                regular: [],
                                adaptation: []
                            };
                        }
                        organizedBySeries[targetSeries].adaptation.push(discipline);
                    } else {
                        // Se for passado, considerar como pendente para revisão
                        pendingDisciplines.push(discipline);
                    }
                } else {
                    // Sem informação de ano/semestre, vai para pendente
                    pendingDisciplines.push(discipline);
                }
            } 
            // Disciplinas regulares (não dispensadas, sem adaptação)
            else {
                // Só incluir se a série for >= série inicial
                if (discipline.series >= initialSeries) {
                    if (!organizedBySeries[discipline.series]) {
                        organizedBySeries[discipline.series] = {
                            regular: [],
                            adaptation: []
                        };
                    }
                    organizedBySeries[discipline.series].regular.push(discipline);
                } else {
                    // Disciplinas de séries anteriores sem adaptação vão para pendentes
                    pendingDisciplines.push(discipline);
                }
            }
        });
        
        // Ordenar as séries
        const sortedSeries = Object.keys(organizedBySeries).sort((a, b) => a - b);
        
        // Gerar HTML para as disciplinas organizadas
        let organizedHTML = '<div class="results-container">';
        
        // Adicionar disciplinas dispensadas no início
        if (dispensedDisciplines.length > 0) {
            organizedHTML += `
                <div class="series-section">
                    <h3>Disciplinas Dispensadas</h3>
                    <table class="discipline-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Disciplina</th>
                                <th>C.H.</th>
                                <th>Série Original</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dispensedDisciplines.map(d => `
                                <tr class="status-dispensed">
                                    <td>${d.code}</td>
                                    <td>${d.name}</td>
                                    <td>${d.hours}</td>
                                    <td>${d.series}ª</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Adicionar disciplinas por série
        sortedSeries.forEach(series => {
            const seriesData = organizedBySeries[series];
            organizedHTML += `
                <div class="series-section">
                    <h3>${series}ª Série</h3>
                    
                    <h4>Disciplinas Regulares</h4>
                    ${seriesData.regular.length > 0 ? `
                        <table class="discipline-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Disciplina</th>
                                    <th>C.H.</th>
                                    <th>Série Original</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${seriesData.regular.map(d => `
                                    <tr>
                                        <td>${d.code}</td>
                                        <td>${d.name}</td>
                                        <td>${d.hours}</td>
                                        <td>${d.series}ª</td>
                                        <td class="status-regular">Regular</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Nenhuma disciplina regular nesta série.</p>'}
                    
                    <h4>Disciplinas com Adaptação</h4>
                    ${seriesData.adaptation.length > 0 ? `
                        <table class="discipline-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Disciplina</th>
                                    <th>C.H.</th>
                                    <th>Série Original</th>
                                    <th>Ano/Semestre</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${seriesData.adaptation.map(d => `
                                    <tr class="status-adaptation">
                                        <td>${d.code}</td>
                                        <td>${d.name}</td>
                                        <td>${d.hours}</td>
                                        <td>${d.series}ª</td>
                                        <td>${d.year}/${d.semester}</td>
                                        <td>Adaptação</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Nenhuma disciplina com adaptação nesta série.</p>'}
                </div>
            `;
        });
        
        organizedHTML += '</div>';
        organizedResults.innerHTML = organizedHTML;
        
        // Gerar HTML para disciplinas pendentes
        let pendingHTML = '<div class="pending-container">';
        
        if (pendingDisciplines.length > 0) {
            pendingHTML += `
                <h3>Disciplinas Pendentes (Revisão Necessária)</h3>
                <p>As seguintes disciplinas não se enquadraram automaticamente na grade. Por favor, ajuste manualmente:</p>
                
                <table class="pending-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Disciplina</th>
                            <th>C.H.</th>
                            <th>Série Original</th>
                            <th>Dispensar?</th>
                            <th>Adaptação?</th>
                            <th>Ano</th>
                            <th>Semestre</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendingDisciplines.map((d, index) => `
                            <tr data-index="${index}">
                                <td>${d.code}</td>
                                <td>${d.name}</td>
                                <td>${d.hours}</td>
                                <td>${d.series}ª</td>
                                <td>
                                    <select class="pending-dispense">
                                        <option value="Sim" ${d.dispense === 'Sim' ? 'selected' : ''}>Sim</option>
                                        <option value="Não" ${d.dispense === 'Não' ? 'selected' : ''}>Não</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="pending-adaptation">
                                        <option value="Sim" ${d.adaptation === 'Sim' ? 'selected' : ''}>Sim</option>
                                        <option value="Não" ${d.adaptation === 'Não' ? 'selected' : ''}>Não</option>
                                    </select>
                                </td>
                                <td>
                                    <input type="text" class="pending-year" value="${d.year || ''}" placeholder="2025">
                                </td>
                                <td>
                                    <select class="pending-semester">
                                        <option value="">--</option>
                                        <option value="1" ${d.semester === '1' ? 'selected' : ''}>1</option>
                                        <option value="2" ${d.semester === '2' ? 'selected' : ''}>2</option>
                                    </select>
                                </td>
                                <td>
                                    <button class="btn-save-pending">Salvar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            pendingHTML += '<p>Nenhuma disciplina pendente para revisão.</p>';
        }
        
        pendingHTML += '</div>';
        pendingResults.innerHTML = pendingHTML;
        
        // Adicionar eventos aos botões de salvar das disciplinas pendentes
        document.querySelectorAll('.btn-save-pending').forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const index = parseInt(row.getAttribute('data-index'));
                const discipline = pendingDisciplines[index];
                
                // Atualizar os valores da disciplina
                discipline.dispense = row.querySelector('.pending-dispense').value;
                discipline.adaptation = row.querySelector('.pending-adaptation').value;
                discipline.year = row.querySelector('.pending-year').value;
                discipline.semester = row.querySelector('.pending-semester').value;
                
                // Se for marcada como dispensada, remover da lista de pendentes
                if (discipline.dispense === 'Sim' && discipline.adaptation === 'Não') {
                    pendingDisciplines.splice(index, 1);
                    row.remove();
                } else {
                    alert('Disciplina atualizada. Clique em "Finalizar Ajustes" para reprocessar a grade.');
                }
            });
        });
    }
    
    // Função para finalizar os ajustes e reprocessar
    function finalizeAdjustments() {
        // Adicionar as disciplinas pendentes de volta à lista principal para reprocessamento
        pendingDisciplines.forEach(d => {
            if (!disciplines.some(discipline => discipline.code === d.code)) {
                disciplines.push(d);
            }
        });
        
        // Reprocessar a organização
        organizeDisciplines();
        
        // Gerar o resultado final
        generateFinalResults();
        
        // Mostrar a seção de resultados finais
        resultsSection.style.display = 'none';
        finalResults.style.display = 'block';
    }
    
    // Função para gerar os resultados finais
    function generateFinalResults() {
        // Similar à organização inicial, mas sem a seção de pendentes
        const initialSeries = parseInt(document.getElementById('initialSeries').value);
        const organizedBySeries = {};
        const dispensedDisciplines = [];
        
        disciplines.forEach(discipline => {
            if (discipline.dispense === 'Sim' && discipline.adaptation === 'Não') {
                dispensedDisciplines.push(discipline);
                return;
            }
            
            if (discipline.adaptation === 'Sim' && discipline.year && discipline.semester) {
                const targetSeries = getTargetSeriesForAdaptation(discipline, initialSeries);
                if (!organizedBySeries[targetSeries]) {
                    organizedBySeries[targetSeries] = {
                        regular: [],
                        adaptation: []
                    };
                }
                organizedBySeries[targetSeries].adaptation.push(discipline);
            } else if (discipline.series >= initialSeries) {
                if (!organizedBySeries[discipline.series]) {
                    organizedBySeries[discipline.series] = {
                        regular: [],
                        adaptation: []
                    };
                }
                organizedBySeries[discipline.series].regular.push(discipline);
            }
        });
        
        const sortedSeries = Object.keys(organizedBySeries).sort((a, b) => a - b);
        
        let finalHTML = '<div class="final-results-container">';
        
        if (dispensedDisciplines.length > 0) {
            finalHTML += `
                <div class="series-section">
                    <h3>Disciplinas Dispensadas</h3>
                    <table class="discipline-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Disciplina</th>
                                <th>C.H.</th>
                                <th>Série Original</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dispensedDisciplines.map(d => `
                                <tr class="status-dispensed">
                                    <td>${d.code}</td>
                                    <td>${d.name}</td>
                                    <td>${d.hours}</td>
                                    <td>${d.series}ª</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        sortedSeries.forEach(series => {
            const seriesData = organizedBySeries[series];
            finalHTML += `
                <div class="series-section">
                    <h3>${series}ª Série</h3>
                    
                    <h4>Disciplinas Regulares</h4>
                    ${seriesData.regular.length > 0 ? `
                        <table class="discipline-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Disciplina</th>
                                    <th>C.H.</th>
                                    <th>Série Original</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${seriesData.regular.map(d => `
                                    <tr>
                                        <td>${d.code}</td>
                                        <td>${d.name}</td>
                                        <td>${d.hours}</td>
                                        <td>${d.series}ª</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Nenhuma disciplina regular nesta série.</p>'}
                    
                    <h4>Disciplinas com Adaptação</h4>
                    ${seriesData.adaptation.length > 0 ? `
                        <table class="discipline-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Disciplina</th>
                                    <th>C.H.</th>
                                    <th>Série Original</th>
                                    <th>Ano/Semestre</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${seriesData.adaptation.map(d => `
                                    <tr class="status-adaptation">
                                        <td>${d.code}</td>
                                        <td>${d.name}</td>
                                        <td>${d.hours}</td>
                                        <td>${d.series}ª</td>
                                        <td>${d.year}/${d.semester}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Nenhuma disciplina com adaptação nesta série.</p>'}
                </div>
            `;
        });
        
        finalHTML += '</div>';
        finalResultsContent.innerHTML = finalHTML;
    }
    
    // Função para gerar PDF
    function generatePDF(type) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const content = type === 'organized' ? organizedResults : finalResultsContent;
    const title = type === 'organized' ? 'Grade Organizada' : 'Grade Final de Aproveitamento de Estudos';
    
    // Configurações gerais
    doc.setFont('helvetica', 'normal');
    
    // Adicionar cabeçalho
    doc.setFontSize(16);
    doc.setTextColor(0, 86, 179); // Azul UNICESUMAR
    doc.text(title, 105, 20, { align: 'center' });
    
    // Adicionar informações do curso
    const courseName = document.getElementById('course').options[document.getElementById('course').selectedIndex].text;
    const initialSeries = document.getElementById('initialSeries').value;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Curso: ${courseName}`, 15, 30);
    doc.text(`Série Inicial: ${initialSeries}ª`, 15, 36);
    
    // Adicionar data de geração
    const today = new Date();
    doc.text(`Data de geração: ${today.toLocaleDateString('pt-BR')}`, 15, 42);
    
    let yPosition = 50;
    
    // Processar cada seção de série
    const seriesSections = content.querySelectorAll('.series-section');
    
    seriesSections.forEach(section => {
        const sectionTitle = section.querySelector('h3').textContent;
        const isDispensedSection = sectionTitle.includes('Dispensadas');
        
        // Adicionar título da seção
        doc.setFontSize(14);
        doc.setTextColor(0, 86, 179); // Azul UNICESUMAR
        doc.text(sectionTitle, 15, yPosition);
        yPosition += 8;
        
        // Processar subseções (Regulares e Adaptação)
        const subsections = section.querySelectorAll('h4');
        
        subsections.forEach(subsection => {
            const subsectionTitle = subsection.textContent;
            const table = subsection.nextElementSibling;
            
            if (table && table.tagName === 'TABLE') {
                // Adicionar título da subseção
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(subsectionTitle, 20, yPosition);
                yPosition += 6;
                
                // Processar tabela
                const headers = [];
                const rows = [];
                
                // Cabeçalhos
                table.querySelectorAll('thead th').forEach(th => {
                    headers.push({
                        content: th.textContent,
                        styles: {
                            fillColor: [0, 96, 179], // Azul UNICESUMAR
                            textColor: 255,
                            fontStyle: 'bold'
                        }
                    });
                });
                
                // Linhas
                table.querySelectorAll('tbody tr').forEach(tr => {
                    const row = [];
                    tr.querySelectorAll('td').forEach((td, colIndex) => {
                        const cellContent = td.textContent;
                        const cellStyles = {};
                        
                        // Aplicar estilos baseados nas classes
                        if (tr.classList.contains('status-dispensed')) {
                            cellStyles.textColor = [40, 167, 69]; // Verde
                        } else if (tr.classList.contains('status-adaptation')) {
                            cellStyles.textColor = [255, 193, 7]; // Amarelo
                        } else if (tr.classList.contains('status-regular')) {
                            cellStyles.textColor = [0, 123, 255]; // Azul claro
                        }
                        
                        // Para células de status, aplicar negrito
                        if (colIndex === headers.length - 1 && headers[colIndex]?.content === 'Status') {
                            cellStyles.fontStyle = 'bold';
                        }
                        
                        row.push({
                            content: cellContent,
                            styles: cellStyles
                        });
                    });
                    rows.push(row);
                });
                
                // Configurações da tabela
                const tableConfig = {
                    head: [headers],
                    body: rows,
                    startY: yPosition,
                    margin: { left: 15 },
                    headStyles: {
                        fillColor: [0, 96, 179], // Azul UNICESUMAR
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [0, 0, 0],
                        fontSize: 10
                    },
                    alternateRowStyles: {
                        fillColor: [240, 240, 240]
                    },
                    styles: {
                        fontSize: 9,
                        cellPadding: 3,
                        overflow: 'linebreak',
                        halign: 'left',
                        valign: 'middle'
                    },
                    columnStyles: {
                        0: { cellWidth: 25 }, // Código
                        1: { cellWidth: 'auto' }, // Disciplina
                        2: { cellWidth: 15 }, // C.H.
                        3: { cellWidth: 20 }, // Série Original
                        4: { cellWidth: 25 }, // Ano/Semestre ou Status
                        5: { cellWidth: 20 }  // Status (se existir)
                    }
                };
                
                // Ajustar largura das colunas para seções específicas
                if (isDispensedSection) {
                    tableConfig.columnStyles = {
                        0: { cellWidth: 25 }, // Código
                        1: { cellWidth: 'auto' }, // Disciplina
                        2: { cellWidth: 15 }, // C.H.
                        3: { cellWidth: 20 }  // Série Original
                    };
                }
                
                // Gerar a tabela
                doc.autoTable(tableConfig);
                yPosition = doc.lastAutoTable.finalY + 10;
                
                // Verificar se precisa de nova página
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                    
                    // Adicionar cabeçalho secundário em páginas adicionais
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Continuação: ${title} - ${sectionTitle}`, 15, 15);
                }
            } else {
                // Se não houver tabela (quando não há disciplinas)
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text('Nenhuma disciplina nesta seção.', 20, yPosition);
                yPosition += 10;
            }
        });
    });
    
    // Adicionar rodapé
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Gerado pelo Sistema de Aproveitamento de Estudos - UNICESUMAR', 105, 285, { align: 'center' });
    
    // Salvar o PDF
    doc.save(`Aproveitamento_Estudos_${courseName.replace(/ /g, '_')}_${today.toISOString().split('T')[0]}.pdf`);
}
    
    // Funções auxiliares
    function getTargetSeriesForAdaptation(discipline, initialSeries) {
        // Se a disciplina é para matricular agora, vai para a série inicial
        if (discipline.enrollNow === 'Sim') {
            return initialSeries;
        }
        
        // Se não, determinar a série com base no ano/semestre
        const currentYear = new Date().getFullYear();
        const currentSemester = new Date().getMonth() < 6 ? 1 : 2;
        
        const yearDiff = parseInt(discipline.year) - currentYear;
        const semesterDiff = parseInt(discipline.semester) - currentSemester;
        
        let seriesOffset = yearDiff * 2;
        if (semesterDiff < 0) seriesOffset -= 1;
        if (semesterDiff > 0) seriesOffset += 1;
        
        return Math.max(initialSeries, initialSeries + seriesOffset);
    }
    
    function isFutureSemester(year, semester) {
        const currentYear = new Date().getFullYear();
        const currentSemester = new Date().getMonth() < 6 ? 1 : 2;
        
        if (parseInt(year) > currentYear) return true;
        if (parseInt(year) === currentYear && parseInt(semester) > currentSemester) return true;
        return false;
    }
});