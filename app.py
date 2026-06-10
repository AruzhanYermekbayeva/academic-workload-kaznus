from flask import Flask, send_from_directory
from database import db
from routes.teachers import teachers_bp
from routes.disciplines import disciplines_bp
from routes.assignments import assignments_bp
from routes.export import export_bp
from seed import seed_teachers
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ngruzka.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)

app.register_blueprint(teachers_bp,    url_prefix='/api')
app.register_blueprint(disciplines_bp, url_prefix='/api')
app.register_blueprint(assignments_bp, url_prefix='/api')
app.register_blueprint(export_bp,      url_prefix='/api')

@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_teachers()
    app.run(debug=True, port=5000)