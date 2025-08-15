document.addEventListener('DOMContentLoaded', function() {
    const processButton = document.getElementById('processButton');
    const finalizeButton = document.getElementById('finalizeButton');
    const downloadButton = document.getElementById('downloadButton');
    const finalDownloadButton = document.getElementById('finalDownloadButton');
    const dataInput = document.getElementById('dataInput');
    const organizedResults = document.getElementById('organizedResults');
    const pendingResults = document.getElementById('pendingResults');
    const finalResultsContent = document.getElementById('finalResultsContent');
    const resultsSection = document.getElementById('resultsSection');
    const finalResults = document.getElementById('finalResults');
    
    let processedData = {
        dispensed: [],
        organized: {},
        pending: []
    };
    
    // Tab functionality
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
    
    // Process data button
    processButton.addEventListener('click', function() {
        const inputText = dataInput.value;
        if (!inputText) {
            alert('Por favor, cole os dados da planilha de aproveitamento.');
            return;
        }
        
        const initialSeries = parseInt(document.getElementById('initialSeries').value);
        const isInverted = document.querySelector('input[name="inverted"]:checked').value === 'true';
        
        processData(inputText, initialSeries, isInverted);
        displayResults();
        
        resultsSection.style.display = 'block';
    });
    
    // Finalize adjustments button
    finalizeButton.addEventListener('click', function() {
        finalizeAdjustments();
    });
    
    // Download PDF buttons
    downloadButton.addEventListener('click', function() {
        downloadPDF('organizedTab');
    });
    
    finalDownloadButton.addEventListener('click', function() {
        downloadPDF('finalResults');
    });
    
    function processData(inputText, initialSeries, isInverted) {
        // Reset processed data
        processedData = {
            dispensed: [],
            organized: {},
            pending: []
        };
        
        // Split lines and filter relevant ones
        const lines = inputText.split('\n');
        let startProcessing = false;
        let endProcessing = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if we should start processing
            if (line.startsWith('Análise de dispensas')) {
                startProcessing = true;
                continue;
            }
            
            // Check if we should stop processing
            if (line.startsWith('Instância do Processo')) {
                endProcessing = true;
                continue;
            }
            
            if (!startProcessing || endProcessing) continue;
            
            // Process discipline lines
            if (line.match(/^\d+/)) {
                const disciplineData = extractDisciplineData(lines, i);
                if (disciplineData) {
                    i = disciplineData.newIndex;
                    
                    if (disciplineData.dispense === 'Sim') {
                        processedData.dispensed.push(disciplineData);
                    } else {
                        if (!processedData.organized[disciplineData.series]) {
                            processedData.organized[disciplineData.series] = [];
                        }
                        processedData.organized[disciplineData.series].push(disciplineData);
                    }
                }
            }
        }
        
        // Organize data by series according to rules
        organizeBySeries(initialSeries, isInverted);
    }
    
    function extractDisciplineData(lines, startIndex) {
        const numberMatch = lines[startIndex].match(/^(\d+)/);
        if (!numberMatch) return null;
        
        const number = numberMatch[1];
        let code = '', name = '', hours = '', series = '', dispense = 'Não', adaptation = 'Não', enrollNow = 'Não';
        let year = '', semester = '';
        
        // Find code, name, hours, series
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes('Código da disciplina') && !code) {
                code = lines[i+1].trim();
            }
            
            if (line.includes('Disciplina') && !name) {
                name = lines[i+1].trim();
            }
            
            if (line.includes('C.H') && !hours) {
                hours = lines[i+1].trim();
            }
            
            if (line.includes('Série') && !series) {
                series = lines[i+1].trim();
            }
            
            if (line.includes('Dispensar?')) {
                dispense = lines[i+1].trim();
            }
            
            if (line.includes('Adaptação')) {
                adaptation = lines[i+1].trim();
            }
            
            if (line.includes('Matricular agora?')) {
                enrollNow = lines[i+1].trim();
            }
            
            if (line.includes('Ano') && !year) {
                year = lines[i+1].trim();
            }
            
            if (line.includes('Semestre') && !semester) {
                semester = lines[i+1].trim();
            }
            
            // If we've found all the data or reached the next discipline, break
            if ((code && name && hours && series && dispense && adaptation && enrollNow) || 
                (i > startIndex && lines[i].match(/^\d+/))) {
                return {
                    number,
                    code,
                    name,
                    hours,
                    series,
                    dispense,
                    adaptation,
                    enrollNow,
                    year,
                    semester,
                    newIndex: i - 1
                };
            }
        }
        
        return null;
    }
    
    function organizeBySeries(initialSeries, isInverted) {
        // First, separate dispensed disciplines
        processedData.dispensed = processedData.dispensed.filter(d => d.dispense === 'Sim');
        
        // Then, organize the rest by series
        const allSeries = Object.keys(processedData.organized).map(Number).sort((a, b) => a - b);
        const result = {};
        
        // Determine the order of series processing
        let currentSeries = initialSeries;
        const seriesOrder = [];
        
        while (currentSeries <= 10) {
            seriesOrder.push(currentSeries);
            currentSeries++;
        }
        
        // If inverted, we need to process from initialSeries down to 1
        if (isInverted) {
            seriesOrder.length = 0;
            currentSeries = initialSeries;
            
            while (currentSeries >= 1) {
                seriesOrder.push(currentSeries);
                currentSeries--;
            }
        }
        
        // Process each series in order
        for (const series of seriesOrder) {
            if (!result[series]) {
                result[series] = [];
            }
            
            // Add disciplines from this series
            if (processedData.organized[series]) {
                result[series] = result[series].concat(processedData.organized[series]);
            }
            
            // Add adaptation disciplines with enrollNow = 'Sim' for the initial series
            if (series === initialSeries) {
                for (const s in processedData.organized) {
                    if (s !== series.toString()) {
                        const adaptations = processedData.organized[s].filter(d => 
                            d.adaptation === 'Sim' && d.enrollNow === 'Sim'
                        );
                        result[series] = result[series].concat(adaptations);
                    }
                }
            }
            
            // For subsequent series, add adaptations with year and semester = 2026.1
            if (series > initialSeries || (isInverted && series < initialSeries)) {
                for (const s in processedData.organized) {
                    if (s !== series.toString()) {
                        const adaptations = processedData.organized[s].filter(d => 
                            d.adaptation === 'Sim' && d.year === '2026' && d.semester === '1'
                        );
                        result[series] = result[series].concat(adaptations);
                    }
                }
            }
        }
        
        processedData.organized = result;
        
        // Find pending disciplines (those not in organized or dispensed)
        processedData.pending = [];
        for (const s in processedData.organized) {
            for (const discipline of processedData.organized[s]) {
                if (discipline.dispense === 'Não' && discipline.adaptation === 'Não') {
                    processedData.pending.push(discipline);
                }
            }
        }
    }
    
    function displayResults() {
        // Display organized results
        organizedResults.innerHTML = '';
        
        const seriesOrder = Object.keys(processedData.organized).map(Number).sort((a, b) => a - b);
        
        for (const series of seriesOrder) {
            const disciplines = processedData.organized[series];
            if (disciplines.length === 0) continue;
            
            const seriesDiv = document.createElement('div');
            seriesDiv.className = 'series-section';
            
            const seriesTitle = document.createElement('h3');
            seriesTitle.textContent = `${series}ª Série`;
            seriesDiv.appendChild(seriesTitle);
            
            const table = document.createElement('table');
            table.className = 'discipline-table';
            
            // Create table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            ['Código', 'Disciplina', 'C.H.', 'Status'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create table body
            const tbody = document.createElement('tbody');
            
            disciplines.forEach(discipline => {
                const row = document.createElement('tr');
                
                // Code
                const codeCell = document.createElement('td');
                codeCell.textContent = discipline.code;
                row.appendChild(codeCell);
                
                // Name
                const nameCell = document.createElement('td');
                nameCell.textContent = discipline.name;
                row.appendChild(nameCell);
                
                // Hours
                const hoursCell = document.createElement('td');
                hoursCell.textContent = discipline.hours;
                row.appendChild(hoursCell);
                
                // Status
                const statusCell = document.createElement('td');
                let statusText = '';
                let statusClass = '';
                
                if (discipline.dispense === 'Sim') {
                    statusText = 'Dispensada';
                    statusClass = 'status-dispensed';
                } else if (discipline.adaptation === 'Sim') {
                    statusText = 'Adaptação';
                    statusClass = 'status-adaptation';
                } else if (discipline.enrollNow === 'Sim') {
                    statusText = 'Matricular';
                    statusClass = 'status-enroll';
                } else {
                    statusText = 'Regular';
                    statusClass = 'status-regular';
                }
                
                statusCell.textContent = statusText;
                statusCell.className = statusClass;
                row.appendChild(statusCell);
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            seriesDiv.appendChild(table);
            organizedResults.appendChild(seriesDiv);
        }
        
        // Display pending disciplines
        pendingResults.innerHTML = '';
        
        if (processedData.pending.length === 0) {
            pendingResults.innerHTML = '<p>Não há disciplinas pendentes.</p>';
            return;
        }
        
        const pendingTable = document.createElement('table');
        pendingTable.className = 'pending-table';
        
        // Create table header
        const pendingThead = document.createElement('thead');
        const pendingHeaderRow = document.createElement('tr');
        
        ['Código', 'Disciplina', 'C.H.', 'Série', 'Ação'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            pendingHeaderRow.appendChild(th);
        });
        
        pendingThead.appendChild(pendingHeaderRow);
        pendingTable.appendChild(pendingThead);
        
        // Create table body
        const pendingTbody = document.createElement('tbody');
        
        processedData.pending.forEach(discipline => {
            const row = document.createElement('tr');
            
            // Code
            const codeCell = document.createElement('td');
            codeCell.textContent = discipline.code;
            row.appendChild(codeCell);
            
            // Name
            const nameCell = document.createElement('td');
            nameCell.textContent = discipline.name;
            row.appendChild(nameCell);
            
            // Hours
            const hoursCell = document.createElement('td');
            hoursCell.textContent = discipline.hours;
            row.appendChild(hoursCell);
            
            // Series
            const seriesCell = document.createElement('td');
            seriesCell.textContent = discipline.series;
            row.appendChild(seriesCell);
            
            // Action (select)
            const actionCell = document.createElement('td');
            const select = document.createElement('select');
            select.className = 'pending-action';
            
            const options = [
                { value: 'keep', text: 'Manter' },
                { value: 'dispense', text: 'Dispensar' },
                { value: 'adapt', text: 'Adaptar' }
            ];
            
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                select.appendChild(option);
            });
            
            actionCell.appendChild(select);
            row.appendChild(actionCell);
            
            pendingTbody.appendChild(row);
        });
        
        pendingTable.appendChild(pendingTbody);
        pendingResults.appendChild(pendingTable);
    }
    
    function finalizeAdjustments() {
        const pendingRows = document.querySelectorAll('.pending-table tbody tr');
        
        pendingRows.forEach(row => {
            const select = row.querySelector('.pending-action');
            const action = select.value;
            const code = row.cells[0].textContent;
            
            // Find the discipline in the organized data
            for (const series in processedData.organized) {
                const index = processedData.organized[series].findIndex(d => d.code === code);
                if (index !== -1) {
                    const discipline = processedData.organized[series][index];
                    
                    if (action === 'dispense') {
                        // Move to dispensed
                        discipline.dispense = 'Sim';
                        processedData.dispensed.push(discipline);
                        processedData.organized[series].splice(index, 1);
                    } else if (action === 'adapt') {
                        // Mark as adaptation
                        discipline.adaptation = 'Sim';
                        discipline.enrollNow = 'Sim';
                    }
                    break;
                }
            }
        });
        
        // Update the display
        displayResults();
        
        // Show final results
        finalResultsContent.innerHTML = organizedResults.innerHTML;
        finalResults.style.display = 'block';
    }
    
    function downloadPDF(sectionId) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get the HTML content to convert to PDF
        let content;
        if (sectionId === 'organizedTab') {
            content = organizedResults.innerHTML;
        } else {
            content = finalResultsContent.innerHTML;
        }
        
        // Add title
        const course = document.getElementById('course').options[document.getElementById('course').selectedIndex].text;
        const shift = document.querySelector('input[name="shift"]:checked').value === 'matutino' ? 'Matutino' : 'Noturno';
        const initialSeries = document.getElementById('initialSeries').value;
        const isInverted = document.querySelector('input[name="inverted"]:checked').value === 'true';
        
        doc.setFontSize(16);
        doc.text(`Aproveitamento de Estudos - ${course}`, 10, 15);
        doc.setFontSize(12);
        doc.text(`Turno: ${shift} | Série Inicial: ${initialSeries}ª | Grade Invertida: ${isInverted ? 'Sim' : 'Não'}`, 10, 22);
        
        // Add organized content
        const seriesOrder = Object.keys(processedData.organized).map(Number).sort((a, b) => a - b);
        let yPosition = 30;
        
        for (const series of seriesOrder) {
            const disciplines = processedData.organized[series];
            if (disciplines.length === 0) continue;
            
            // Add series title
            doc.setFontSize(14);
            doc.text(`${series}ª Série`, 10, yPosition);
            yPosition += 10;
            
            // Prepare table data
            const tableData = disciplines.map(discipline => {
                let status = '';
                
                if (discipline.dispense === 'Sim') {
                    status = 'Dispensada';
                } else if (discipline.adaptation === 'Sim') {
                    status = 'Adaptação';
                } else if (discipline.enrollNow === 'Sim') {
                    status = 'Matricular';
                } else {
                    status = 'Regular';
                }
                
                return [
                    discipline.code,
                    discipline.name,
                    discipline.hours,
                    status
                ];
            });
            
            // Add table
            doc.autoTable({
                startY: yPosition,
                head: [['Código', 'Disciplina', 'C.H.', 'Status']],
                body: tableData,
                margin: { top: yPosition },
                styles: { fontSize: 10 },
                headStyles: { fillColor: [220, 220, 220] }
            });
            
            yPosition = doc.lastAutoTable.finalY + 10;
            
            // Add new page if needed
            if (yPosition > 250 && series !== seriesOrder[seriesOrder.length - 1]) {
                doc.addPage();
                yPosition = 20;
            }
        }
        
        // Add dispensed disciplines
        if (processedData.dispensed.length > 0) {
            if (yPosition > 200) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(14);
            doc.text('Disciplinas Dispensadas', 10, yPosition);
            yPosition += 10;
            
            const dispensedData = processedData.dispensed.map(discipline => {
                return [
                    discipline.code,
                    discipline.name,
                    discipline.hours,
                    'Dispensada'
                ];
            });
            
            doc.autoTable({
                startY: yPosition,
                head: [['Código', 'Disciplina', 'C.H.', 'Status']],
                body: dispensedData,
                margin: { top: yPosition },
                styles: { fontSize: 10 },
                headStyles: { fillColor: [220, 220, 220] }
            });
        }
        
        // Save the PDF
        doc.save(`Aproveitamento_${course.replace(/\s+/g, '_')}.pdf`);
    }
});
