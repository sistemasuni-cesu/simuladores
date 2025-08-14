import os
import re
from PyPDF2 import PdfReader
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def extract_student_data(text):
    """Extrai dados do aluno do texto do PDF"""
    patterns = {
        'nome': r"Nome completo\s*([^\n]+)",
        'ra': r"Registro Acadêmico\s*([^\n]+)",
        'cpf': r"CPF\s*([^\n]+)",
        'curso': r"Curso\s*([^\n]+)",
        'status': r"Status do processo\s*([^\n]+)"
    }
    
    data = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        data[key] = match.group(1).strip() if match else "Não encontrado"
    
    return data

def extract_disciplines(text):
    """Extrai dados das disciplinas com regex aprimorado"""
    discipline_pattern = r"""
        Número\s+(\d+)\s+
        Código\s+da\s+disciplina\s+([^\n]+)\s+
        Disciplina\s+([^\n]+)\s+
        C\.H\s+(\d+)\s+
        Série\s+(\d+)\s+
        Dispensar\?\s+([^\n]+)\s+
        Adaptação\s+([^\n]+)\s+
        Matricular\s+agora\?\s+([^\n]+)
    """
    
    disciplines = []
    for match in re.finditer(discipline_pattern, text, re.VERBOSE):
        disciplines.append({
            'numero': match.group(1),
            'codigo': match.group(2).strip(),
            'disciplina': match.group(3).strip(),
            'ch': match.group(4),
            'serie': match.group(5),
            'dispensar': match.group(6).strip(),
            'adaptacao': match.group(7).strip(),
            'matricular': match.group(8).strip()
        })
    
    return disciplines

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Apenas arquivos PDF são aceitos'}), 400
    
    try:
        # Ler o PDF
        pdf = PdfReader(file)
        text = "\n".join(page.extract_text() for page in pdf.pages)
        
        # Processar dados
        student_data = extract_student_data(text)
        disciplines = extract_disciplines(text)
        
        return jsonify({
            'student': student_data,
            'disciplines': disciplines,
            'total': len(disciplines),
            'dispensadas': sum(1 for d in disciplines if d['dispensar'] == 'Sim')
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
