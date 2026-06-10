from flask import Blueprint, jsonify, request
from database import db
from models.assignment import Assignment
from models.discipline import Discipline
from models.teacher import Teacher

assignments_bp = Blueprint('assignments', __name__)


@assignments_bp.get('/assignments')
def get_assignments():
    rows = Assignment.query.all()
    return jsonify([a.to_dict() for a in rows])


@assignments_bp.post('/assignments')
def set_assignment():
    """Create or update assignment for a discipline."""
    data = request.json
    disc_id    = data.get('discipline_id')
    teacher_id = data.get('teacher_id')

    if not disc_id:
        return jsonify({'error': 'discipline_id обязателен'}), 400

    Discipline.query.get_or_404(disc_id)
    if teacher_id:
        Teacher.query.get_or_404(teacher_id)

    existing = Assignment.query.filter_by(discipline_id=disc_id).first()

    if teacher_id:
        if existing:
            existing.teacher_id = teacher_id
        else:
            db.session.add(Assignment(discipline_id=disc_id, teacher_id=teacher_id))
    else:
    
        if existing:
            db.session.delete(existing)

    db.session.commit()
    return jsonify({'ok': True})