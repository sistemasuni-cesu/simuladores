document.addEventListener('DOMContentLoaded', function() {
    const processButton = document.getElementById('processButton');
    const pdfUpload = document.getElementById('pdfUpload');
    
    processButton.addEventListener('click', async function() {
        const file = pdfUpload.files[0];
        if (!file) {
            alert('Por favor, selecione um arquivo PDF.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.error) {
                alert('Erro: ' + data.error);
                return;
            }

            // Exibe os dados do aluno
            document.getElementById('studentData').innerHTML = `
                <h3>Dados do Aluno</h3>
                <p><strong>Nome:</strong> ${data.student.nome}</p>
                <p><strong>RA:</strong> ${data.student.ra}</p>
                <p><strong>Curso:</strong> ${data.student.curso}</p>
            `;

            // Exibe as disciplinas
            let html = '<table><tr><th>Disciplina</th><th>CH</th><th>Série</th><th>Status</th></tr>';
            data.disciplines.forEach(d => {
                html += `
                    <tr>
                        <td>${d.disciplina}</td>
                        <td>${d.ch}</td>
                        <td>${d.serie}</td>
                        <td style="color: ${d.dispensar === 'Sim' ? 'green' : 'red'}">
                            ${d.dispensar === 'Sim' ? 'Dispensada' : 'Não dispensada'}
                        </td>
                    </tr>
                `;
            });
            html += '</table>';
            
            document.getElementById('organizedResults').innerHTML = html;
            document.getElementById('resultsSection').style.display = 'block';

        } catch (error) {
            console.error('Erro:', error);
            alert('Falha ao processar o arquivo.');
        }
    });
});
