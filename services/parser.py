import os
import openpyxl
from services.dept_detector import detect_dept
from routes.export import generate_all_xlsx
def _h(row, idx):
    try:
        v = row[idx] if idx < len(row) else None
        return float(v) if v not in (None, '') else 0.0
    except (TypeError, ValueError):
        return 0.0

def _read_rows_xlsx(filepath):
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb.active
    return [list(row) for row in ws.iter_rows(values_only=True)]

def _find_op_blocks(rows):
    blocks = []
    current_op = ''
    for i, row in enumerate(rows):
        joined = ' '.join(str(v or '') for v in row)
        if 'Наименование образовательной программы' in joined:
            parts = joined.split(':', 1)    
            if len(parts) == 2:
                current_op = parts[1].strip()
        if any('Наименование дисциплины' in str(v or '') for v in row):
            blocks.append((current_op, i))
    return blocks

def _parse_block(rows, op_name, hrow_idx, end_idx):
    """Парсинг блока ОП из РУП (image_0cbc9a.png)"""
    SKIP_STARTS = ('итого', 'средняя', 'рабочий учебный', 'директор', 'руководитель')
    disciplines_data = []

    for i in range(hrow_idx + 1, end_idx):
        row = rows[i]
        if not row or len(row) < 10: continue
        disc_name = str(row[4] or '').strip()
        if not disc_name or any(disc_name.lower().startswith(s) for s in SKIP_STARTS):
            continue

        try:
            if not str(row[0]).strip().replace('.','').isdigit(): continue
        except: continue

        periods = []
        for p_num, base in [(1, 8), (2, 16), (3, 24)]:
            total_h = _h(row, base)
            if total_h > 0:
                periods.append({
                    'num':   p_num,
                    'total': total_h,
                    'lec':   _h(row, base + 1),
                    'prac':  _h(row, base + 2),
                    'lab':   _h(row, base + 3),
                    'sro':   _h(row, base + 7),
                })

        disciplines_data.append({
            'disc':        disc_name,
            'op':          op_name,
            'code':        str(row[3] or '').strip(),
            'cycle':       str(row[1] or '').strip(), # B
            'comp':        str(row[2] or '').strip(), # C
            'cred':        _h(row, 5),                
            'exam_period': int(_h(row, 7)) if _h(row, 7) else 0, # H (Семестр)
            'total_hours': sum(p['total'] for p in periods),
            'periods':     periods
        })
    return disciplines_data

def parse_rup(filepath, op_name_override=''):
    ext = os.path.splitext(filepath)[1].lower()
    rows = _read_rows_xlsx(filepath) 
    blocks = _find_op_blocks(rows)
    if not blocks: return []
    all_discs = []
    for idx, (op_name, hrow_idx) in enumerate(blocks):
        end_idx = blocks[idx+1][1] if idx+1 < len(blocks) else len(rows)
        name = op_name_override if (op_name_override and len(blocks)==1) else op_name
        all_discs.extend(_parse_block(rows, name, hrow_idx, end_idx))
    return all_discs