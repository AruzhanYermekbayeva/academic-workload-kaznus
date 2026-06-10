import os
from flask import Blueprint, jsonify, request, current_app
from database import db
from models.discipline import Discipline
from models.assignment import Assignment
from services.parser import parse_rup

disciplines_bp = Blueprint('disciplines', __name__)

@disciplines_bp.get('/disciplines')
def get_disciplines():
    discs = Discipline.query.all()
    result = []
    for d in discs:
        item = d.to_dict()
        item['teacher_id'] = d.assignment.teacher_id if d.assignment else None
        result.append(item)
    return jsonify(result)


@disciplines_bp.post('/disciplines/upload')
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Файл не прикреплён'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'Пустое имя файла'}), 400

    ext = os.path.splitext(f.filename)[1].lower()
    if ext not in ('.xlsx', '.xls'):
        return jsonify({'error': 'Недопустимый формат. Загрузите .xlsx или .xls файл.'}), 400
    
    upload_dir = current_app.config['UPLOAD_FOLDER']
    saved_path = os.path.join(upload_dir, 'rup' + ext)
    f.save(saved_path)


    try:
        op_name_override = request.form.get('op_name', '').strip()
        parsed = parse_rup(saved_path, op_name_override=op_name_override)
    except Exception as e:
        return jsonify({'error': f'Ошибка парсинга: {e}'}), 500

    if not parsed:
        if request.form.get('replace') == 'true':
            Assignment.query.delete()
            Discipline.query.delete()
            db.session.commit()
        return jsonify({'error': 'Не удалось распарсить дисциплины из файла'}), 400

    Assignment.query.delete()
    Discipline.query.delete()
    db.session.commit()

    # Insert new
    for item in parsed:
        d = Discipline(
            disc        = item['disc'],
            op          = item['op'],
            code        = item['code'],
            cycle       = item['cycle'],
            comp        = item['comp'],
            cred        = item['cred'],
            exam_period = item['exam_period'],
            total_hours = item['total_hours'],
            dept        = item['dept'],
        )
        d.periods = item['periods']
        db.session.add(d)

    db.session.commit()
    count = Discipline.query.count()
    return jsonify({'ok': True, 'count': count})


@disciplines_bp.patch('/disciplines/<int:did>')
def update_discipline(did):
    """Allows updating dept (for unmatched disciplines)."""
    d = Discipline.query.get_or_404(did)
    data = request.json
    if 'dept' in data:
        d.dept = data['dept']
    db.session.commit()
    return jsonify(d.to_dict())


@disciplines_bp.delete('/disciplines')
def clear_disciplines():
    Assignment.query.delete()
    Discipline.query.delete()
    db.session.commit()
    return jsonify({'ok': True})