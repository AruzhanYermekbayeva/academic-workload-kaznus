from database import db

class Assignment(db.Model):
    __tablename__ = 'assignments'

    id            = db.Column(db.Integer, primary_key=True)
    discipline_id = db.Column(db.Integer, db.ForeignKey('disciplines.id'), nullable=False, unique=True)
    teacher_id    = db.Column(db.Integer, db.ForeignKey('teachers.id'),    nullable=False)

    def to_dict(self):
        return {
            'id':            self.id,
            'discipline_id': self.discipline_id,
            'teacher_id':    self.teacher_id,
        }