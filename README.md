# Academic Workload — KazNUS

Web application for automating academic workload distribution at the Kazakh National University of Sport (KazNUS). Replaces a manual process that took 2–4 hours per curriculum file.

## What it does

1. **Upload** — administrator uploads a curriculum file (RUP) in `.xlsx` or `.xls` format
2. **Assign** — disciplines are automatically grouped by department; instructors are assigned via dropdown menus
3. **Export** — individual workload sheets are generated as `.xlsx` files per instructor, ready for institutional use

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | Python, Flask, SQLAlchemy ORM |
| Database | SQLite |
| File processing | openpyxl, xlrd |
| Frontend | HTML, CSS, vanilla JavaScript |

## Project Structure

```
├── app.py               # Flask app entry point
├── database.py          # SQLAlchemy setup
├── seed.py              # Initial teacher data
├── models/
│   ├── teacher.py       # Teacher model
│   ├── discipline.py    # Discipline model
│   └── assignment.py    # Assignment model
├── routes/
│   ├── teachers.py      # Teacher management API
│   ├── disciplines.py   # Discipline API
│   ├── assignments.py   # Assignment API
│   └── export.py        # Excel export API
├── services/
│   ├── parser.py        # RUP file parser
│   ├── dept_detector.py # Auto department classification
│   └── excel_export.py  # Workload sheet generator
├── static/              # CSS and JS
└── templates/           # HTML templates
```

## Getting Started

```bash
git clone https://github.com/AruzhanYermekbayeva/academic-workload-kaznus.git
cd academic-workload-kaznus

pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000` in your browser.

## How It Works

**RUP Parser** reads uploaded Excel files, identifies educational program blocks, and extracts discipline names, credit values, and contact hours across three academic periods.

**Department Detector** automatically classifies each discipline into one of three departments (DMIS, DSGD, DSOK) based on keyword matching. Unrecognized disciplines are flagged for manual assignment.

**Excel Export** generates formatted workload sheets per instructor following the institutional template, grouped by academic period with credit and hour totals.

## Built During

Industrial internship at KazNUS — Astana IT University, Software Engineering program, March–May 2026.
