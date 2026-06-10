const Assign = (() => {

  const DEPT_NAMES = {
    'ДМИС': 'Департамент менеджмента и инноваций в спорте',
    'ДСГД': 'Департамент социально-гуманитарных дисциплин',
    'ДСОК': 'Департамент спортивного образования и коучинга',
  };
  const DEPT_ORDER = ['ДМИС', 'ДСГД', 'ДСОК'];

  let _disciplines = [];
  let _teachers    = [];
  let _assigns     = {};  

  async function render() {
    const el = document.getElementById('assign-content');
    el.innerHTML = '<p style="color:#9ca3af;padding:20px">Загрузка…</p>';

    [_disciplines, _teachers] = await Promise.all([
      API.getDisciplines(),
      API.getTeachers(),
    ]);

    const rawAssigns = await API.getAssignments();
    _assigns = {};
    rawAssigns.forEach(a => { _assigns[a.discipline_id] = a.teacher_id; });

    if (!_disciplines.length) {
      el.innerHTML = `<div class="alert alert-warn">⚠ Сначала загрузите файл ОП на шаге 1.</div>`;
      return;
    }

    _render(el);
  }

  function _render(el) {
    const teacherOpts = _buildTeacherOpts();

    const byDept = {};
    _disciplines.forEach(d => {
      const k = d.dept || 'unmatched';
      (byDept[k] = byDept[k] || []).push(d);
    });

    const totalD = _disciplines.length;
    const totalA = Object.keys(_assigns).length;

    let html = `
      <div class="stats" style="margin-bottom:18px">
        <div class="stat"><div class="v">${totalD}</div><div class="l">Дисциплин</div></div>
        <div class="stat"><div class="v" style="color:var(--success)">${totalA}</div><div class="l">Назначено</div></div>
        <div class="stat"><div class="v" style="color:var(--warn)">${totalD - totalA}</div><div class="l">Без назначения</div></div>
      </div>`;

    if (byDept['unmatched']) html += _renderUnmatched(byDept['unmatched'], teacherOpts);
    DEPT_ORDER.forEach(dk => { if (byDept[dk]) html += _renderDept(dk, byDept[dk], teacherOpts); });

    el.innerHTML = html;
    el.querySelectorAll('select.tsel[data-disc]').forEach(sel => {
      const tid = _assigns[parseInt(sel.dataset.disc)];
      if (tid) sel.value = String(tid);
    });
    el.querySelectorAll('select.tsel').forEach(sel => {
      sel.addEventListener('change', async () => {
        const discId    = parseInt(sel.dataset.disc);
        const teacherId = sel.value ? parseInt(sel.value) : null;
        sel.className   = 'tsel' + (teacherId ? ' ok' : '');
        await API.setAssignment(discId, teacherId);
        if (teacherId) _assigns[discId] = teacherId;
        else delete _assigns[discId];
        _updateStats();
      });
    });
    el.querySelectorAll('select.dept-fix').forEach(sel => {
      sel.addEventListener('change', async () => {
        const discId = parseInt(sel.dataset.disc);
        const dept   = sel.value;
        if (!dept) return;
        await API.updateDiscipline(discId, { dept });
        const d = _disciplines.find(x => x.id === discId);
        if (d) d.dept = dept;
        _render(el);
      });
    });
  }

  function _renderDept(deptKey, discs, teacherOpts) {
    const assigned = discs.filter(d => _assigns[d.id]).length;
    const allDone  = assigned === discs.length;
    return `
      <div class="dept-block">
        <div class="dept-head">
          <h3>🏢 ${DEPT_NAMES[deptKey]}</h3>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="badge b-gray">${discs.length} дисц.</span>
            <span class="badge ${allDone ? 'b-green' : 'b-yellow'}">${assigned}/${discs.length} назначено</span>
          </div>
        </div>
        <div class="dept-body">
          <div class="tbl-wrap"><table>
            <thead><tr>
              <th style="width:32px">№</th>
              <th>Дисциплина</th>
              <th>ОП</th>
              <th class="tc">Кредиты</th>
              <th class="tc">∑ Часов</th>
              <th class="tc">Экз.</th>
              <th>Преподаватель</th>
            </tr></thead>
            <tbody>${discs.map((d, i) => _discRow(d, i + 1, teacherOpts)).join('')}</tbody>
          </table></div>
        </div>
      </div>`;
  }

  function _renderUnmatched(discs, teacherOpts) {
    return `
      <div class="dept-block">
        <div class="dept-head unmatched">
          <h3>⚠ Департамент не определён (${discs.length})</h3>
          <span class="badge b-yellow">Выберите вручную</span>
        </div>
        <div class="dept-body">
          <div class="tbl-wrap"><table>
            <thead><tr>
              <th>Дисциплина</th>
              <th class="tc">Кредиты</th>
              <th>Департамент</th>
              <th>Преподаватель</th>
            </tr></thead>
            <tbody>
              ${discs.map(d => `
                <tr>
                  <td style="font-weight:500">${d.disc}</td>
                  <td class="tc num">${d.cred}</td>
                  <td>
                    <select class="dept-fix" data-disc="${d.id}">
                      <option value="">— выберите —</option>
                      <option value="ДМИС">Менеджмент и инновации</option>
                      <option value="ДСГД">Социально-гуманитарных дисциплин</option>
                      <option value="ДСОК">Спортивного образования и коучинга</option>
                    </select>
                  </td>
                  <td>
                    <select class="tsel" data-disc="${d.id}">
                      <option value="">— не назначен —</option>
                      ${teacherOpts}
                    </select>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table></div>
        </div>
      </div>`;
  }

  function _discRow(d, rowNum, teacherOpts) {
    const periods = (d.periods || []).map(p =>
      `<span class="badge b-gray" style="font-size:10px;margin-right:2px">П${p.num}: ${p.total}ч</span>`
    ).join('');
    return `
      <tr>
        <td class="tc mono" style="color:#9ca3af">${rowNum}</td>
        <td>
          <div style="font-weight:500;max-width:310px">${d.disc}</div>
          <div style="margin-top:3px">${periods}</div>
        </td>
        <td style="font-size:11.5px;color:#718096;max-width:120px">${d.op || '—'}</td>
        <td class="tc num">${d.cred}</td>
        <td class="tc mono">${d.total_hours}</td>
        <td class="tc">${d.exam_period ? `<span class="badge b-blue">${d.exam_period}</span>` : '—'}</td>
        <td>
          <select class="tsel" data-disc="${d.id}">
            <option value="">— не назначен —</option>
            ${teacherOpts}
          </select>
        </td>
      </tr>`;
  }

  function _buildTeacherOpts() {
    const byDept = {};
    _teachers.forEach(t => { (byDept[t.dept] = byDept[t.dept] || []).push(t); });

    let html = '';
    DEPT_ORDER.forEach(dk => {
      const list = byDept[dk];
      if (!list) return;
      html += `<optgroup label="${DEPT_NAMES[dk]}">`;
      list
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        .forEach(t => {
          html += `<option value="${t.id}">${t.stype === 'Вакансия' ? '📋 ' : ''}${t.name}</option>`;
        });
      html += '</optgroup>';
    });
    return html;
  }

  function _updateStats() {
    const total    = _disciplines.length;
    const assigned = Object.keys(_assigns).length;
    const stats    = document.querySelectorAll('.stat .v');
    if (stats.length >= 3) {
      stats[1].textContent = assigned;
      stats[2].textContent = total - assigned;
    }
  }

  return { render };
})();