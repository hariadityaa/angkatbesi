/* Gym Companion — all data stored in this browser via localStorage. No server. */

const STORAGE_KEY = 'gymCompanionData_v1';

function defaultState() {
  return {
    version: 1,
    unit: 'kg',
    routine: {
      name: 'My Routine',
      sessions: []
    },
    history: [],
    activeWorkoutDraft: null,
    ui: {
      activeTab: 'train',
      expandedSessionIds: [],
      expandedHistoryIds: [],
      historyViewMode: 'sessions',
      historyExerciseFilter: ''
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      routine: { ...base.routine, ...(parsed.routine || {}) },
      ui: { ...base.ui, ...(parsed.ui || {}) }
    };
  } catch (e) {
    console.error('Failed to load saved data, starting fresh.', e);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// If there's an in-progress workout, always land on the Train tab so it's not missed.
if (state.activeWorkoutDraft) state.ui.activeTab = 'train';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function unitLabel() {
  return escapeHtml(state.unit || 'kg');
}

// Find the most recent logged sets for an exercise (by id, falling back to name)
// so a new workout can be pre-filled with the last weight used.
function lastLoggedSets(exerciseId, name) {
  for (const entry of state.history) {
    const ex = entry.exercises.find(e => e.exerciseId === exerciseId) ||
      entry.exercises.find(e => e.name === name);
    if (ex) return ex.sets;
  }
  return null;
}

function allKnownExerciseNames() {
  const names = new Set();
  for (const s of state.routine.sessions) {
    for (const e of s.exercises) names.add(e.name.trim());
  }
  for (const h of state.history) {
    for (const e of h.exercises) names.add(e.name.trim());
  }
  return Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ---------- Rendering ----------

function render() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === state.ui.activeTab);
  });
  const app = document.getElementById('app');
  switch (state.ui.activeTab) {
    case 'train': app.innerHTML = renderTrainTab(); break;
    case 'routine': app.innerHTML = renderRoutineTab(); break;
    case 'history': app.innerHTML = renderHistoryTab(); break;
    case 'settings': app.innerHTML = renderSettingsTab(); break;
    default: app.innerHTML = renderTrainTab();
  }
}

function renderTrainTab() {
  if (state.activeWorkoutDraft) return renderActiveWorkout(state.activeWorkoutDraft);

  const sessions = state.routine.sessions;
  if (sessions.length === 0) {
    return `
      <div class="top-bar"><h1>Train</h1></div>
      <div class="empty-state">
        <p>No sessions set up yet.</p>
        <p>Go to the <strong>Routine</strong> tab to add your first session and exercises.</p>
      </div>`;
  }

  return `
    <div class="top-bar"><h1>Train</h1></div>
    ${sessions.map(s => `
      <div class="card">
        <div class="card-header">
          <div>
            <h3>${escapeHtml(s.name)}</h3>
            <p class="muted">${s.exercises.length} exercise${s.exercises.length === 1 ? '' : 's'}</p>
          </div>
          <button class="btn primary" data-action="start-session" data-session-id="${s.id}">Start</button>
        </div>
      </div>
    `).join('')}
  `;
}

function renderActiveWorkout(draft) {
  return `
    <div class="top-bar">
      <div>
        <h1>${escapeHtml(draft.sessionName)}</h1>
        <p class="muted">Started ${formatDate(draft.startedAt)}</p>
      </div>
      <button class="btn ghost" data-action="cancel-workout">Cancel</button>
    </div>
    <div class="card">
      ${draft.exercises.map(ex => `
        <div class="exercise-row">
          <div class="row between">
            <h3>${escapeHtml(ex.name)}</h3>
            <span class="pill">target ${ex.targetSets}x${ex.targetReps}</span>
          </div>
          <div class="row muted" style="margin: 6px 0 8px;">
            <span style="width:28px;text-align:center;">#</span>
            <span class="grow">Reps</span>
            <span class="grow">Weight (${unitLabel()})</span>
            <span style="width:40px;"></span>
          </div>
          ${ex.sets.map((set, i) => `
            <div class="set-row ${set.done ? 'done' : ''}">
              <div class="set-num">${i + 1}</div>
              <input type="number" inputmode="numeric" min="0" placeholder="reps"
                data-field="set-reps" data-exercise-id="${ex.exerciseId}" data-set-index="${i}"
                value="${escapeHtml(set.reps)}">
              <input type="number" inputmode="decimal" min="0" step="0.5" placeholder="${unitLabel()}"
                data-field="set-weight" data-exercise-id="${ex.exerciseId}" data-set-index="${i}"
                value="${escapeHtml(set.weight)}">
              <button class="check-btn ${set.done ? 'checked' : ''}"
                data-action="toggle-set-done" data-exercise-id="${ex.exerciseId}" data-set-index="${i}">✓</button>
            </div>
          `).join('')}
          <div class="row" style="margin-top:6px;">
            <button class="btn small" data-action="add-set" data-exercise-id="${ex.exerciseId}">+ Add set</button>
            <button class="btn small ghost" data-action="remove-set" data-exercise-id="${ex.exerciseId}">− Remove set</button>
          </div>
        </div>
      `).join('')}
    </div>
    <button class="btn primary block" data-action="finish-workout">Finish Session</button>
  `;
}

function renderRoutineTab() {
  const r = state.routine;
  return `
    <div class="top-bar"><h1>Routine</h1></div>
    <div class="card">
      <label class="field-label">Routine name</label>
      <input type="text" data-field="routine-name" value="${escapeHtml(r.name)}">
    </div>
    ${r.sessions.map((s, sIdx) => renderSessionCard(s, sIdx, r.sessions.length)).join('')}
    <button class="btn primary block" data-action="add-session">+ Add Session</button>
  `;
}

function renderSessionCard(s, sIdx, total) {
  const expanded = state.ui.expandedSessionIds.includes(s.id);
  return `
    <div class="card">
      <div class="row between">
        <input type="text" class="grow" data-field="session-name" data-session-id="${s.id}" value="${escapeHtml(s.name)}">
        <div class="reorder-btns">
          <button class="icon-btn" data-action="move-session-up" data-session-id="${s.id}" ${sIdx === 0 ? 'disabled' : ''}>▲</button>
          <button class="icon-btn" data-action="move-session-down" data-session-id="${s.id}" ${sIdx === total - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <button class="icon-btn" data-action="toggle-session-expand" data-session-id="${s.id}">${expanded ? '▾' : '▸'}</button>
        <button class="icon-btn" data-action="delete-session" data-session-id="${s.id}">🗑</button>
      </div>
      ${expanded ? `
        <hr class="divider">
        ${s.exercises.map((ex, eIdx) => `
          <div class="exercise-row">
            <div class="row wrap">
              <input type="text" class="grow" style="min-width:120px;" placeholder="Exercise name"
                data-field="exercise-name" data-session-id="${s.id}" data-exercise-id="${ex.id}" value="${escapeHtml(ex.name)}">
              <div style="width:60px;">
                <label class="field-label">Sets</label>
                <input type="number" min="1" data-field="target-sets" data-session-id="${s.id}" data-exercise-id="${ex.id}" value="${ex.targetSets}">
              </div>
              <div style="width:60px;">
                <label class="field-label">Reps</label>
                <input type="number" min="1" data-field="target-reps" data-session-id="${s.id}" data-exercise-id="${ex.id}" value="${ex.targetReps}">
              </div>
              <div class="reorder-btns">
                <button class="icon-btn" data-action="move-exercise-up" data-session-id="${s.id}" data-exercise-id="${ex.id}" ${eIdx === 0 ? 'disabled' : ''}>▲</button>
                <button class="icon-btn" data-action="move-exercise-down" data-session-id="${s.id}" data-exercise-id="${ex.id}" ${eIdx === s.exercises.length - 1 ? 'disabled' : ''}>▼</button>
              </div>
              <button class="icon-btn" data-action="delete-exercise" data-session-id="${s.id}" data-exercise-id="${ex.id}">🗑</button>
            </div>
          </div>
        `).join('')}
        <button class="btn small" style="margin-top:10px;" data-action="add-exercise" data-session-id="${s.id}">+ Add Exercise</button>
      ` : `<p class="muted">${s.exercises.length} exercise${s.exercises.length === 1 ? '' : 's'}</p>`}
    </div>
  `;
}

function renderHistoryTab() {
  const mode = state.ui.historyViewMode;
  const toggle = `
    <div class="tabs-toggle">
      <button class="${mode === 'sessions' ? 'active' : ''}" data-action="history-view" data-mode="sessions">By Session</button>
      <button class="${mode === 'exercise' ? 'active' : ''}" data-action="history-view" data-mode="exercise">By Exercise</button>
    </div>
  `;

  if (state.history.length === 0) {
    return `<div class="top-bar"><h1>History</h1></div>${toggle}<div class="empty-state"><p>No sessions logged yet.</p><p>Finish a workout from the Train tab and it'll show up here.</p></div>`;
  }

  if (mode === 'exercise') {
    const names = allKnownExerciseNames();
    const selected = names.includes(state.ui.historyExerciseFilter) ? state.ui.historyExerciseFilter : (names[0] || '');
    const rows = [];
    // oldest first, so progression reads top-to-bottom
    for (let i = state.history.length - 1; i >= 0; i--) {
      const entry = state.history[i];
      const ex = entry.exercises.find(e => e.name === selected);
      if (ex) rows.push({ date: entry.date, sets: ex.sets });
    }
    return `
      <div class="top-bar"><h1>History</h1></div>
      ${toggle}
      <div class="card">
        <label class="field-label">Exercise</label>
        <select id="exercise-filter">
          ${names.map(n => `<option value="${escapeHtml(n)}" ${n === selected ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('')}
        </select>
      </div>
      ${rows.length === 0 ? '<p class="muted">No logged sets for this exercise yet.</p>' : rows.map(r => `
        <div class="card">
          <p class="muted">${formatDate(r.date)}</p>
          <p>${r.sets.map(s => `${escapeHtml(s.reps)}${s.weight != null && s.weight !== '' ? ' @ ' + escapeHtml(s.weight) + unitLabel() : ''}`).join(', ')}</p>
        </div>
      `).join('')}
    `;
  }

  return `
    <div class="top-bar"><h1>History</h1></div>
    ${toggle}
    ${state.history.map(entry => {
      const expanded = state.ui.expandedHistoryIds.includes(entry.id);
      return `
      <div class="card">
        <div class="history-entry-header" data-action="toggle-history-expand" data-entry-id="${entry.id}">
          <div>
            <h3>${escapeHtml(entry.sessionName)}</h3>
            <p class="muted">${formatDate(entry.date)}</p>
          </div>
          <button class="icon-btn" data-action="delete-history-entry" data-entry-id="${entry.id}">🗑</button>
        </div>
        ${expanded ? `
          <div class="history-detail">
            ${entry.exercises.map(ex => `
              <p><strong>${escapeHtml(ex.name)}:</strong> ${ex.sets.map(s => `${escapeHtml(s.reps)}${s.weight != null && s.weight !== '' ? '@' + escapeHtml(s.weight) + unitLabel() : ''}${s.completed ? '' : ' (skipped)'}`).join(', ')}</p>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    }).join('')}
  `;
}

function renderSettingsTab() {
  return `
    <div class="top-bar"><h1>Settings</h1></div>
    <div class="card">
      <label class="field-label">Weight unit label</label>
      <input type="text" data-field="unit" value="${escapeHtml(state.unit)}" maxlength="6">
      <p class="muted">Just a label shown next to weight fields (e.g. kg, lb) — changing it does not convert existing numbers.</p>
    </div>
    <div class="card">
      <h3>Backup your data</h3>
      <p class="muted">Everything is stored only in this browser. Export a backup occasionally so you don't lose it if you clear browser data or switch phones.</p>
      <div class="row wrap" style="margin-top:8px;">
        <button class="btn" data-action="export-data">Export backup (.json)</button>
        <button class="btn" data-action="import-data">Import backup</button>
      </div>
    </div>
    <div class="card">
      <h3>Danger zone</h3>
      <button class="btn danger block" data-action="clear-all-data">Erase all data</button>
    </div>
  `;
}

// ---------- Mutations ----------

function findSession(sessionId) {
  return state.routine.sessions.find(s => s.id === sessionId);
}

function handleStartSession(sessionId) {
  const s = findSession(sessionId);
  if (!s) return;
  if (s.exercises.length === 0) {
    showToast('Add exercises to this session first.');
    return;
  }
  const draft = {
    sessionId: s.id,
    sessionName: s.name,
    startedAt: new Date().toISOString(),
    exercises: s.exercises.map(ex => {
      const prev = lastLoggedSets(ex.id, ex.name);
      const numSets = ex.targetSets || 1;
      const sets = [];
      for (let i = 0; i < numSets; i++) {
        const prevSet = prev && prev[i];
        sets.push({
          reps: ex.targetReps != null ? String(ex.targetReps) : '',
          weight: prevSet && prevSet.weight != null ? String(prevSet.weight) : '',
          done: false
        });
      }
      return { exerciseId: ex.id, name: ex.name, targetSets: ex.targetSets, targetReps: ex.targetReps, sets };
    })
  };
  state.activeWorkoutDraft = draft;
  saveState();
  render();
}

function handleFinishWorkout() {
  const draft = state.activeWorkoutDraft;
  if (!draft) return;
  const entry = {
    id: uid(),
    sessionId: draft.sessionId,
    sessionName: draft.sessionName,
    date: new Date().toISOString(),
    exercises: draft.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.sets.map(s => ({
        reps: s.reps === '' ? null : Number(s.reps),
        weight: s.weight === '' ? null : Number(s.weight),
        completed: !!s.done
      }))
    }))
  };
  state.history.unshift(entry);
  state.activeWorkoutDraft = null;
  saveState();
  render();
  showToast('Session saved to History.');
}

function handleCancelWorkout() {
  if (!confirm('Discard this workout? Nothing will be saved.')) return;
  state.activeWorkoutDraft = null;
  saveState();
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `gym-companion-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importDataFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== 'object' || !parsed.routine) {
        alert('That file doesn\'t look like a Gym Companion backup.');
        return;
      }
      if (!confirm('Import this backup? It will replace all data currently in this browser.')) return;
      const base = defaultState();
      state = {
        ...base,
        ...parsed,
        routine: { ...base.routine, ...(parsed.routine || {}) },
        ui: { ...base.ui, ...(parsed.ui || {}) }
      };
      saveState();
      render();
      showToast('Backup imported.');
    } catch (e) {
      alert('Could not read that file as JSON.');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('Erase ALL routines and history from this browser? This cannot be undone.')) return;
  if (!confirm('Really sure? This is permanent.')) return;
  state = defaultState();
  saveState();
  render();
}

// ---------- Event delegation ----------

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tab-btn');
  if (tabBtn) {
    state.ui.activeTab = tabBtn.dataset.tab;
    saveState();
    render();
    return;
  }

  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const sessionId = target.dataset.sessionId;
  const exerciseId = target.dataset.exerciseId;
  const setIndex = target.dataset.setIndex != null ? Number(target.dataset.setIndex) : null;

  switch (action) {
    case 'start-session':
      handleStartSession(sessionId);
      break;
    case 'finish-workout':
      handleFinishWorkout();
      break;
    case 'cancel-workout':
      handleCancelWorkout();
      break;
    case 'toggle-set-done': {
      const ex = state.activeWorkoutDraft.exercises.find(x => x.exerciseId === exerciseId);
      ex.sets[setIndex].done = !ex.sets[setIndex].done;
      saveState();
      render();
      break;
    }
    case 'add-set': {
      const ex = state.activeWorkoutDraft.exercises.find(x => x.exerciseId === exerciseId);
      const last = ex.sets[ex.sets.length - 1];
      ex.sets.push({ reps: last ? last.reps : String(ex.targetReps || ''), weight: last ? last.weight : '', done: false });
      saveState();
      render();
      break;
    }
    case 'remove-set': {
      const ex = state.activeWorkoutDraft.exercises.find(x => x.exerciseId === exerciseId);
      if (ex.sets.length > 1) ex.sets.pop();
      saveState();
      render();
      break;
    }
    case 'add-session': {
      const s = { id: uid(), name: `Session ${state.routine.sessions.length + 1}`, exercises: [] };
      state.routine.sessions.push(s);
      state.ui.expandedSessionIds.push(s.id);
      saveState();
      render();
      break;
    }
    case 'delete-session': {
      if (!confirm('Delete this session and its exercises?')) break;
      state.routine.sessions = state.routine.sessions.filter(s => s.id !== sessionId);
      saveState();
      render();
      break;
    }
    case 'move-session-up':
    case 'move-session-down': {
      const list = state.routine.sessions;
      const idx = list.findIndex(s => s.id === sessionId);
      const swapWith = action === 'move-session-up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= list.length) break;
      [list[idx], list[swapWith]] = [list[swapWith], list[idx]];
      saveState();
      render();
      break;
    }
    case 'toggle-session-expand': {
      const i = state.ui.expandedSessionIds.indexOf(sessionId);
      if (i === -1) state.ui.expandedSessionIds.push(sessionId);
      else state.ui.expandedSessionIds.splice(i, 1);
      saveState();
      render();
      break;
    }
    case 'add-exercise': {
      const s = findSession(sessionId);
      s.exercises.push({ id: uid(), name: '', targetSets: 3, targetReps: 10 });
      saveState();
      render();
      break;
    }
    case 'delete-exercise': {
      const s = findSession(sessionId);
      s.exercises = s.exercises.filter(ex => ex.id !== exerciseId);
      saveState();
      render();
      break;
    }
    case 'move-exercise-up':
    case 'move-exercise-down': {
      const s = findSession(sessionId);
      const idx = s.exercises.findIndex(ex => ex.id === exerciseId);
      const swapWith = action === 'move-exercise-up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= s.exercises.length) break;
      [s.exercises[idx], s.exercises[swapWith]] = [s.exercises[swapWith], s.exercises[idx]];
      saveState();
      render();
      break;
    }
    case 'toggle-history-expand': {
      const entryId = target.dataset.entryId;
      const i = state.ui.expandedHistoryIds.indexOf(entryId);
      if (i === -1) state.ui.expandedHistoryIds.push(entryId);
      else state.ui.expandedHistoryIds.splice(i, 1);
      saveState();
      render();
      break;
    }
    case 'delete-history-entry': {
      const entryId = target.dataset.entryId;
      if (!confirm('Delete this logged session?')) break;
      state.history = state.history.filter(h => h.id !== entryId);
      saveState();
      render();
      break;
    }
    case 'history-view': {
      state.ui.historyViewMode = target.dataset.mode;
      saveState();
      render();
      break;
    }
    case 'export-data':
      exportData();
      break;
    case 'import-data':
      document.getElementById('import-file-input').click();
      break;
    case 'clear-all-data':
      clearAllData();
      break;
  }
});

document.addEventListener('input', (e) => {
  const field = e.target.dataset.field;
  if (!field) return;
  const sessionId = e.target.dataset.sessionId;
  const exerciseId = e.target.dataset.exerciseId;
  const setIndex = e.target.dataset.setIndex != null ? Number(e.target.dataset.setIndex) : null;

  switch (field) {
    case 'routine-name':
      state.routine.name = e.target.value;
      saveState();
      break;
    case 'session-name': {
      const s = findSession(sessionId);
      s.name = e.target.value;
      saveState();
      break;
    }
    case 'exercise-name': {
      const s = findSession(sessionId);
      const ex = s.exercises.find(x => x.id === exerciseId);
      ex.name = e.target.value;
      saveState();
      break;
    }
    case 'target-sets': {
      const s = findSession(sessionId);
      const ex = s.exercises.find(x => x.id === exerciseId);
      ex.targetSets = e.target.value === '' ? '' : Number(e.target.value);
      saveState();
      break;
    }
    case 'target-reps': {
      const s = findSession(sessionId);
      const ex = s.exercises.find(x => x.id === exerciseId);
      ex.targetReps = e.target.value === '' ? '' : Number(e.target.value);
      saveState();
      break;
    }
    case 'set-reps': {
      const ex = state.activeWorkoutDraft.exercises.find(x => x.exerciseId === exerciseId);
      ex.sets[setIndex].reps = e.target.value;
      saveState();
      break;
    }
    case 'set-weight': {
      const ex = state.activeWorkoutDraft.exercises.find(x => x.exerciseId === exerciseId);
      ex.sets[setIndex].weight = e.target.value;
      saveState();
      break;
    }
    case 'unit':
      state.unit = e.target.value;
      saveState();
      break;
  }
});

// Changes that should trigger a full re-render (blur/change rather than every keystroke)
document.addEventListener('change', (e) => {
  if (e.target.id === 'exercise-filter') {
    state.ui.historyExerciseFilter = e.target.value;
    saveState();
    render();
    return;
  }
  if (e.target.id === 'import-file-input' && e.target.files[0]) {
    importDataFromFile(e.target.files[0]);
    e.target.value = '';
    return;
  }
  const field = e.target.dataset.field;
  if (field === 'target-sets' || field === 'target-reps' || field === 'unit' ||
      field === 'session-name' || field === 'exercise-name' || field === 'routine-name') {
    render();
  }
});

// ---------- Init ----------

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
