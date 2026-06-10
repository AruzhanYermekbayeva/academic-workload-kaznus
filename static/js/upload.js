const Upload = (() => {

  function init() {
    const zone  = document.getElementById('upload-zone');
    const input = document.getElementById('file-input');

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', ()  => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) _showDialog(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', () => {
      if (input.files[0]) _showDialog(input.files[0]);
      input.value = '';
    });

    renderSavedInfo();
  }

  async function renderSavedInfo() {
    const discs = await API.getDisciplines();
    if (!discs.length) return;
    const assigns = await API.getAssignments();
    const card    = document.getElementById('saved-card');
    card.style.display = '';
    const ops = [...new Set(discs.map(d => d.op).filter(Boolean))];
    document.getElementById('saved-info').innerHTML =
      `${discs.length} дисциплин · ${assigns.length} назначений` +
      (ops.length ? `<br><small style="color:#9ca3af">ОП: ${ops.join(', ')}</small>` : '');
  }

  function _showDialog(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      toast('Только .xlsx и .xls файлы', 'error'); return;
    }
    _doUpload(file);
  }

  async function _doUpload(file) {
    const zone = document.getElementById('upload-zone');
    zone.innerHTML = `<div class="icon">⏳</div><p>Загружаем и обрабатываем файл…</p>`;

    const res = await API.uploadFile(file, '', false);

    if (res.error) {
      toast(res.error, 'error');
      zone.innerHTML = `
        <div class="icon">📄</div>
        <p><strong>Нажмите, чтобы выбрать файл</strong> или перетащите сюда</p>
        <p style="margin-top:6px;font-size:12px">Поддерживаются .xlsx и .xls</p>`;
      return;
    }

    toast(`Загружено ${res.count} дисциплин`, 'success');
    renderSavedInfo();
    App.goTo('assign');
  }

  return { init };
})();