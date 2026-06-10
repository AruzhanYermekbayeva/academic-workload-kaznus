from database import db
import json

class Discipline(db.Model):
    __tablename__ = 'disciplines'

    id          = db.Column(db.Integer, primary_key=True)
    disc        = db.Column(db.String(300), nullable=False)  
    op          = db.Column(db.String(200), default='')      
    code        = db.Column(db.String(50),  default='')
    cycle       = db.Column(db.String(20),  default='')       
    comp        = db.Column(db.String(20),  default='')      
    cred        = db.Column(db.Float, default=0)
    exam_period = db.Column(db.Integer, default=0)
    total_hours = db.Column(db.Float, default=0)
    dept        = db.Column(db.String(10), default='')       
    periods_json = db.Column(db.Text, default='[]')
    

    assignment  = db.relationship('Assignment', backref='discipline', uselist=False,
                                  cascade='all, delete-orphan')

    @property
    def periods(self):
        return json.loads(self.periods_json or '[]')

    @periods.setter
    def periods(self, val):
        self.periods_json = json.dumps(val, ensure_ascii=False)

    def to_dict(self):
        return {
            'id':          self.id,
            'disc':        self.disc,
            'op':          self.op,
            'code':        self.code,
            'cycle':       self.cycle,
            'comp':        self.comp,
            'cred':        self.cred,
            'exam_period': self.exam_period,
            'total_hours': self.total_hours,
            'dept':        self.dept,
            'periods':     self.periods,
        }