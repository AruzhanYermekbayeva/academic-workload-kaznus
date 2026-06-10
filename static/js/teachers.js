const Teachers = (() => {

  const DEPT_NAMES  = {
    'ДМИС': 'Менеджмент и инновации в спорте',
    'ДСГД': 'Социально-гуманитарных дисциплин',
    'ДСОК': 'Спортивного образования и коучинга',
  };
  const DEPT_ORDER  = ['ДМИС', 'ДСГД', 'ДСОК'];
  const STYPE_ORDER = ['Штатные', 'Совместители', 'Внешние', 'Вакансия'];

  let _teachers  = [];
  let _editingId = null;

  async function open() {
    _teachers = await API.getTeachers();
    _renderList();
    document.getElementById('modal-teachers').classList.add('open');
  }

  function _renderList() {
    const el = document.getElementById('teachers-list');
    let html  = '';

    DEPT_ORDER.forEach(dk => {
      const deptTeachers = _teachers.filter(t => t.dept === dk);
      html += `
        <div style="margin-bottom:18px">
          <div style="display:flex;align-items:center;justify-content:space-between;
                      padding:9px 14px;background:#f8fafc;border:1px solid #e5e7eb;
                      border-radius:6px 6px 0 0">
            <strong style="font-size:13px">🏢 ${DEPT_NAMES[dk]}</strong>
            <button class="btn btn-sm btn-secondary" onclick="Teachers.openAdd('${dk}')">+ Добавить</button>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px">
              <thead><tr style="background:#f8fafc">
                <th style="padding:7px 11px;font-size:11.5px;font-weight:600;color:#6b7280;
                           border-bottom:1px solid #e5e7eb;text-align:left">ФИО</th>
                <th style="padding:7px 11px;font-size:11.5px;font-weight:600;color:#6b7280;
                           border-bottom:1px solid #e5e7eb;text-align:left">Должность</th>
                <th style="padding:7px 11px;font-size:11.5px;font-weight:600;color:#6b7280;
                           border-bottom:1px solid #e5e7eb;text-align:left">Тип</th>
                <th style="padding:7px 11px;border-bottom:1px solid #e5e7eb"></th>
              </tr></thead>
              <tbody>`;

      STYPE_ORDER.forEach(st => {
        const list = deptTeachers.filter(t => t.stype === st);
        if (!list.length) return;

        html += `<tr class="stype-row"><td colspan="4">${st}</td></tr>`;
        list.forEach(t => {
          const isVac = t.stype === 'Вакансия';
          html += `
            <tr class="${isVac ? 'vacancy-row' : ''}" style="border-bottom:1px solid #f1f5f9">
              <td style="padding:8px 11px;font-weight:500">${t.name}</td>
              <td style="padding:8px 11px;color:#6b7280;font-size:12px">${t.pos || '—'}</td>
              <td style="padding:8px 11px">
                <span class="badge b-gray" style="font-size:10.5px">${t.stype}</span>
              </td>
              <td style="padding:8px 11px;white-space:nowrap">
                <button class="btn btn-xs btn-secondary" onclick="Teachers.openEdit(${t.id})">✏️</button>
                <button class="btn btn-xs btn-danger"    onclick="Teachers.remove(${t.id})">✕</button>
              </td>
            </tr>`;
        });
      });

      html += `</tbody></table></div></div>`;
    });

    el.innerHTML = html || '<p style="color:#9ca3af;padding:16px">Преподаватели не найдены.</p>';
  }

  // ── Open add form ──
  function openAdd(deptKey = 'ДМИС') {
    _editingId = null;
    _fillForm({ name:'', pos:'', degree:'', dept: deptKey, stype:'Штатные' });
    document.getElementById('teacher-form-title').textContent = 'Добавить преподавателя';
    document.getElementById('modal-teacher-form').classList.add('open');
  }

  // ── Open edit form ──
  function openEdit(id) {
    const t = _teachers.find(x => x.id === id);
    if (!t) return;
    _editingId = id;
    _fillForm(t);
    document.getElementById('teacher-form-title').textContent = 'Редактировать преподавателя';
    document.getElementById('modal-teacher-form').classList.add('open');
  }

  function _fillForm(t) {
    document.getElementById('tf-name').value   = t.name   || '';
    document.getElementById('tf-pos').value    = t.pos    || '';
    document.getElementById('tf-degree').value = t.degree || '';
    document.getElementById('tf-dept').value   = t.dept   || 'ДМИС';
    document.getElementById('tf-stype').value  = t.stype  || 'Штатные';
  }

  // ── Save (create or update) ──
  async function save() {
    const data = {
      name:   document.getElementById('tf-name').value.trim(),
      pos:    document.getElementById('tf-pos').value.trim(),
      degree: document.getElementById('tf-degree').value.trim(),
      dept:   document.getElementById('tf-dept').value,
      stype:  document.getElementById('tf-stype').value,
    };
    if (!data.name) { toast('Введите ФИО', 'error'); return; }

    if (_editingId) {
      await API.updateTeacher(_editingId, data);
      toast('Сохранено');
    } else {
      await API.createTeacher(data);
      toast('Добавлено');
    }

    document.getElementById('modal-teacher-form').classList.remove('open');
    _teachers = await API.getTeachers();
    _renderList();
  }

  // ── Delete ──
  async function remove(id) {
    const t = _teachers.find(x => x.id === id);
    if (!t) return;
    if (!confirm(`Удалить «${t.name}»?\nВсе назначения этого преподавателя будут сняты.`)) return;
    await API.deleteTeacher(id);
    toast('Удалено');
    _teachers = await API.getTeachers();
    _renderList();
  }

  return { open, openAdd, openEdit, save, remove };
})();