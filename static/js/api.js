
const API = {

  // Teachers
  getTeachers:       ()           => fetch('/api/teachers').then(r => r.json()),
  createTeacher:     (data)       => fetch('/api/teachers', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r => r.json()),
  updateTeacher:     (id, data)   => fetch(`/api/teachers/${id}`, { method:'PUT',  headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r => r.json()),
  deleteTeacher:     (id)         => fetch(`/api/teachers/${id}`, { method:'DELETE' }).then(r => r.json()),

  // Disciplines
  getDisciplines:    ()           => fetch('/api/disciplines').then(r => r.json()),
  uploadFile:        (file, opName, replace) => { const fd = new FormData(); fd.append('file', file); fd.append('op_name', opName || ''); fd.append('replace', replace ? 'true' : 'false'); return fetch('/api/disciplines/upload', { method:'POST', body:fd }).then(r => r.json()); },
  updateDiscipline:  (id, data)   => fetch(`/api/disciplines/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r => r.json()),
  clearDisciplines:  ()           => fetch('/api/disciplines', { method:'DELETE' }).then(r => r.json()),

  // Assignments
  getAssignments:    ()           => fetch('/api/assignments').then(r => r.json()),
  setAssignment:     (disc_id, teacher_id) => fetch('/api/assignments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ discipline_id: disc_id, teacher_id }) }).then(r => r.json()),

  // Export / Summary
  getSummary:        ()           => fetch('/api/summary').then(r => r.json()),
  exportUrl:         (teacher_id) => `/api/export/${teacher_id}`,
  exportAllUrl:      ()           => '/api/export-all',
};