import io
from flask import Blueprint, send_file, jsonify
from models.teacher import Teacher
from models.discipline import Discipline
from models.assignment import Assignment
from services.excel_export import generate_teacher_xlsx, generate_all_xlsx

export_bp = Blueprint('export', __name__)


def _teacher_disciplines(teacher_id):
    """Return list of Discipline objects assigned to a teacher."""
    assignments = Assignment.query.filter_by(teacher_id=teacher_id).all()
    disc_ids    = [a.discipline_id for a in assignments]
    return Discipline.query.filter(Discipline.id.in_(disc_ids)).all()


def _find_director(dept):
    """Return director Teacher for a department, or None."""
    return Teacher.query.filter(
        Teacher.dept  == dept,
        Teacher.stype == 'Штатные',
        Teacher.pos.ilike('%директор%')
    ).first()


@export_bp.get('/summary')
def get_summary():
    teachers = Teacher.query.order_by(Teacher.name).all()
    result   = []
    for t in teachers:
        discs = _teacher_disciplines(t.id)
        if not discs:
            continue
        result.append({
            **t.to_dict(),
            'disc_count':  len(discs),
            'total_hours': sum(d.total_hours for d in discs),
            'total_cred':  sum(d.cred for d in discs),
            'depts':       list({d.dept for d in discs}),
        })
    return jsonify(result)


@export_bp.get('/export/<int:teacher_id>')
def export_teacher(teacher_id):
    teacher = Teacher.query.get_or_404(teacher_id)
    discs   = _teacher_disciplines(teacher_id)
    if not discs:
        return jsonify({'error': 'Нет назначенных дисциплин'}), 400

    director      = _find_director(teacher.dept)
    director_name = director.name if director else ''
    xlsx_bytes    = generate_teacher_xlsx(teacher, discs, director_name)

    safe_name = ''.join(c for c in teacher.name if c.isalnum() or c in ' _-').strip()
    return send_file(
        io.BytesIO(xlsx_bytes),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'нагрузка_{safe_name}_2025-2026.xlsx'
    )


@export_bp.get('/export-all')
def export_all():
    teachers      = Teacher.query.order_by(Teacher.name).all()
    summary_data  = []
    for t in teachers:
        discs = _teacher_disciplines(t.id)
        if discs:
            summary_data.append({'teacher': t, 'disciplines': discs})

    if not summary_data:
        return jsonify({'error': 'Нет назначений'}), 400

    xlsx_bytes = generate_all_xlsx(summary_data)
    return send_file(
        io.BytesIO(xlsx_bytes),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='общая_нагрузка_ППС_2025-2026.xlsx'
    )