from database import db

class Teacher(db.Model):
    __tablename__ = 'teachers'

    id     = db.Column(db.Integer, primary_key=True)
    name   = db.Column(db.String(200), nullable=False)
    pos    = db.Column(db.String(200), default='')  
    degree = db.Column(db.String(100), default='')   
    dept   = db.Column(db.String(10),  nullable=False)  
    stype  = db.Column(db.String(30),  default='Штатные')


    assignments = db.relationship('Assignment', backref='teacher', lazy=True,
                                  cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':     self.id,
            'name':   self.name,
            'pos':    self.pos,
            'degree': self.degree,
            'dept':   self.dept,
            'stype':  self.stype,
        }