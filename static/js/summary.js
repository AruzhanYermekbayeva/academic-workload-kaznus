const Summary = (() => {

  const DEPT_NAMES = {
    'ДМИС': 'Департамент менеджмента и инноваций в спорте',
    'ДСГД': 'Департамент социально-гуманитарных дисциплин',
    'ДСОК': 'Департамент спортивного образования и коучинга',
  };

  let _summary     = [];
  let _disciplines = [];
  let _assigns     = {};
  let _selectedId  = null;

  async function render() {
    [_summary, _disciplines] = await Promise.all([
      API.getSummary(),
      API.getDisciplines(),
    ]);

    const rawAssigns = await API.getAssignments();
    _assigns = {};
    rawAssigns.forEach(a => { _assigns[a.discipline_id] = a.teacher_id; });

    _renderStats();
    _fillSelect();
    _renderAllSummary();
  }

  function _renderStats() {
    const unassigned = _disciplines.filter(d => !_assigns[d.id]).length;
    const totalH     = _summary.reduce((s, t) => s + t.total_hours, 0);
    document.getElementById('sum-teachers').textContent = _summary.length;
    document.getElementById('sum-assigned').textContent = _disciplines.length - unassigned;
    document.getElementById('sum-unassigned').textContent = unassigned;
    document.getElementById('sum-hours').textContent = totalH;
  }

  function _fillSelect() {
    const sel = document.getElementById('export-sel');
    sel.innerHTML = '<option value="">— выберите преподавателя —</option>';
    _summary
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      .forEach(t => {
        sel.innerHTML += `<option value="${t.id}">${t.name} (${t.total_hours} ч / ${t.total_cred} кр.)</option>`;
      });

    if (_selectedId) {
      sel.value = String(_selectedId);
      _renderPreview(_selectedId);
    }
  }

  function onSelect(val) {
    _selectedId = val ? parseInt(val) : null;
    document.getElementById('btn-export').disabled = !_selectedId;
    if (_selectedId) _renderPreview(_selectedId);
    else document.getElementById('preview-content').innerHTML = '';
  }

  function _renderPreview(tid) {
    const t     = _summary.find(x => x.id === tid);
    if (!t) return;

    const discs = _disciplines.filter(d => _assigns[d.id] === tid);
    if (!discs.length) {
      document.getElementById('preview-content').innerHTML =
        '<div class="alert alert-warn">У этого преподавателя нет назначенных дисциплин.</div>';
      return;
    }

    // Group by period
    const byPeriod = {};
    discs.forEach(d => {
      (d.periods || []).forEach(p => {
        (byPeriod[p.num] = byPeriod[p.num] || []).push({ d, p });
      });
    });

    const deptNames = [...new Set(discs.map(d => DEPT_NAMES[d.dept] || d.dept))];
    const multiDept = deptNames.length > 1;

    let html = `
      <div class="teacher-card">
        <div class="teacher-card-head">
          <div>
            <div class="t-name">${t.name}</div>
            <div class="t-meta">${t.pos || ''}${t.degree ? ' · ' + t.degree : ''}</div>
            <div class="t-tags">
              ${deptNames.map(n => `<span class="badge b-blue" style="font-size:11px">${n}</span>`).join('')}
              ${multiDept ? '<span class="badge b-purple" style="font-size:11px">Межкафедральная нагрузка</span>' : ''}
            </div>
          </div>
          <div class="t-total">
            <div class="big">${t.total_hours}</div>
            <div class="lbl">часов итого</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px">${t.total_cred} кредитов</div>
          </div>
        </div>
        <div class="tbl-wrap"><table>
          <thead><tr>
            <th>Дисциплина</th>
            <th>ОП</th>
            <th class="tc">Кред.</th>
            <th class="tc">Период</th>
            <th class="tc">∑ Часов</th>
            <th class="tc">Лекции</th>
            <th class="tc">Практика</th>
            <th class="tc">СРО</th>
            <th>Департамент</th>
          </tr></thead>
          <tbody>`;

    Object.keys(byPeriod).sort((a, b) => a - b).forEach(pnum => {
      html += `<tr class="period-row"><td colspan="8">📅 Академический период ${pnum}</td></tr>`;
      let periodTotal = 0;
      byPeriod[pnum].forEach(({ d, p }) => {
        periodTotal += p.total;
        html += `
          <tr>
            <td style="font-weight:500;max-width:290px">${d.disc}</td>
            <td style="font-size:11.5px;color:#718096;max-width:110px">${d.op || '—'}</td>
            <td class="tc num">${d.cred}</td>
            <td class="tc"><span class="badge b-blue">${pnum}</span></td>
            <td class="tc mono">${p.total}</td>
            <td class="tc">${p.lec  || '—'}</td>
            <td class="tc">${p.prac || '—'}</td>
            <td class="tc">${p.sro  || '—'}</td>
            <td style="font-size:12px;color:#6b7280">${DEPT_NAMES[d.dept] || d.dept}</td>
          </tr>`;
      });
      html += `
        <tr class="total-row">
          <td colspan="4" style="text-align:right">Итого за период ${pnum}:</td>
          <td class="tc mono">${periodTotal}</td>
          <td colspan="4"></td>
        </tr>`;
    });

    html += `
      <tr class="grand-row">
        <td colspan="4" style="text-align:right">ИТОГО:</td>
        <td class="tc mono">${t.total_hours}</td>
        <td colspan="3"></td>
        <td style="font-size:12px">${t.total_cred} кред.</td>
      </tr>
    </tbody></table></div></div>`;

    document.getElementById('preview-content').innerHTML = html;
  }


  function _renderAllSummary() {
    const el = document.getElementById('all-summary');
    if (!_summary.length) {
      el.innerHTML = '<div class="alert alert-warn">Нет назначений.</div>';
      return;
    }

    const unassigned = _disciplines.filter(d => !_assigns[d.id]);

    let html = `<div class="tbl-wrap"><table>
      <thead><tr>
        <th>Преподаватель</th>
        <th>Должность</th>
        <th>Тип</th>
        <th>Департаменты</th>
        <th class="tc">Дисциплин</th>
        <th class="tc">∑ Часов</th>
        <th class="tc">∑ Кредитов</th>
      </tr></thead>
      <tbody>`;

    _summary
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      .forEach(t => {
        const depts = (t.depts || []).map(d => DEPT_NAMES[d] || d).join(', ');
        const multi = (t.depts || []).length > 1;
        html += `
          <tr>
            <td>
              <b>${t.name}</b>
              ${multi ? '<span class="badge b-purple" style="font-size:10px;margin-left:4px">межкафедр.</span>' : ''}
            </td>
            <td style="font-size:12px;color:#6b7280">${t.pos || '—'}</td>
            <td><span class="badge b-gray" style="font-size:10.5px">${t.stype}</span></td>
            <td style="font-size:12px">${depts}</td>
            <td class="tc">${t.disc_count}</td>
            <td class="tc num">${t.total_hours}</td>
            <td class="tc num">${t.total_cred}</td>
          </tr>`;
      });

    html += '</tbody></table></div>';

    if (unassigned.length) {
      html += `
        <div style="margin-top:16px">
          <div style="font-weight:600;font-size:13px;color:#b45309;margin-bottom:8px">
            ⚠ Не назначено: ${unassigned.length} дисциплин
          </div>
          <div class="tbl-wrap"><table>
            <thead><tr>
              <th>Дисциплина</th><th class="tc">Кредиты</th><th>Департамент</th>
            </tr></thead>
            <tbody>
              ${unassigned.map(d => `
                <tr>
                  <td>${d.disc}</td>
                  <td class="tc num">${d.cred}</td>
                  <td style="font-size:12px;color:#6b7280">${DEPT_NAMES[d.dept] || d.dept}</td>
                </tr>`).join('')}
            </tbody>
          </table></div>
        </div>`;
    }

    el.innerHTML = html;
  }


  function exportTeacher() {
    if (!_selectedId) return;
    window.location.href = API.exportUrl(_selectedId);
  }

  return { render, onSelect, exportTeacher };
})();