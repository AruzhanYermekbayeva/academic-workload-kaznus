from flask import Blueprint, jsonify, request
from database import db
from models.teacher import Teacher

teachers_bp = Blueprint('teachers', __name__)


@teachers_bp.get('/teachers')
def get_teachers():
    teachers = Teacher.query.order_by(Teacher.dept, Teacher.stype, Teacher.name).all()
    return jsonify([t.to_dict() for t in teachers])


@teachers_bp.post('/teachers')
def create_teacher():
    data = request.json
    if not data.get('name') or not data.get('dept'):
        return jsonify({'error': 'name и dept обязательны'}), 400
    t = Teacher(
        name   = data['name'].strip(),
        pos    = data.get('pos', '').strip(),
        degree = data.get('degree', '').strip(),
        dept   = data['dept'],
        stype  = data.get('stype', 'Штатные'),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201


@teachers_bp.put('/teachers/<int:tid>')
def update_teacher(tid):
    t = Teacher.query.get_or_404(tid)
    data = request.json
    t.name   = data.get('name',   t.name).strip()
    t.pos    = data.get('pos',    t.pos).strip()
    t.degree = data.get('degree', t.degree).strip()
    t.dept   = data.get('dept',   t.dept)
    t.stype  = data.get('stype',  t.stype)
    db.session.commit()
    return jsonify(t.to_dict())


@teachers_bp.delete('/teachers/<int:tid>')
def delete_teacher(tid):
    t = Teacher.query.get_or_404(tid)
    db.session.delete(t)
    db.session.commit()
    return jsonify({'ok': True})