/* HeavyHo — all data stored in this browser via localStorage. No server. */

const STORAGE_KEY = 'gymCompanionData_v1';

const SAMPLE_ROUTINE = {
  name: 'Sample Routine',
  sessions: [
    {
      name: 'Day 1: Push',
      exercises: [
        { name: 'Incline Dumbbell Bench Press', sets: 3, reps: '8-12', notes: 'Optional: any setup cue or focus reminder goes here.' },
        { name: 'Dumbbell Lateral Raises', sets: 3, reps: 12 }
      ]
    },
    {
      name: 'Day 2: Pull',
      exercises: [
        { name: 'Machine Lat Pulldown', sets: 3, reps: '8-12' },
        { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', notes: 'Soft knees, push hips straight back.' }
      ]
    }
  ]
};

const ROUTINE_TEMPLATES = [
  {
    key: 'stronglifts-5x5',
    label: 'StrongLifts 5×5',
    description: 'Beginner barbell strength program — 2 alternating full-body workouts, 3x/week.',
    data: {
      name: 'StrongLifts 5x5',
      sessions: [
        {
          name: 'Workout A',
          exercises: [
            { name: 'Squat', sets: 5, reps: 5, notes: 'Add 2.5kg (5lb) each workout while form holds up.' },
            { name: 'Bench Press', sets: 5, reps: 5, notes: 'Add 2.5kg (5lb) each workout while form holds up.' },
            { name: 'Barbell Row', sets: 5, reps: 5, notes: 'Add 2.5kg (5lb) each workout while form holds up.' }
          ]
        },
        {
          name: 'Workout B',
          exercises: [
            { name: 'Squat', sets: 5, reps: 5, notes: 'Same bar-weight progression as Workout A.' },
            { name: 'Overhead Press', sets: 5, reps: 5, notes: 'Add 2.5kg (5lb) each workout while form holds up.' },
            { name: 'Deadlift', sets: 1, reps: 5, notes: 'Just one top set — add 5kg (10lb) each workout.' }
          ]
        }
      ]
    }
  },
  {
    key: 'texas-method',
    label: 'Texas Method',
    description: 'Intermediate barbell program — volume, recovery and intensity days across the week.',
    data: {
      name: 'Texas Method',
      sessions: [
        {
          name: 'Volume Day (Mon)',
          exercises: [
            { name: 'Squat', sets: 5, reps: 5, notes: "Heaviest weekly squat volume — moderate-heavy across all 5 sets." },
            { name: 'Bench Press / Overhead Press', sets: 5, reps: 5, notes: 'Alternate emphasis weekly with the other press.' },
            { name: 'Chin-Ups or Back Extension', sets: 3, reps: '8-10' }
          ]
        },
        {
          name: 'Recovery Day (Wed)',
          exercises: [
            { name: 'Squat (light)', sets: 2, reps: 5, notes: "About 80-90% of Monday's top weight — focus on speed and form." },
            { name: 'Overhead Press / Bench Press', sets: 3, reps: 5, notes: "Whichever press you didn't emphasize Monday." },
            { name: 'Chin-Ups or Back Extension', sets: 3, reps: '8-10' }
          ]
        },
        {
          name: 'Intensity Day (Fri)',
          exercises: [
            { name: 'Squat', sets: 1, reps: 5, notes: "Heaviest set of the week — beat last Friday's weight." },
            { name: 'Bench Press / Overhead Press', sets: 1, reps: 5, notes: 'Heaviest single set of the week.' },
            { name: 'Deadlift', sets: 1, reps: 5, notes: 'Heaviest set of the week.' }
          ]
        }
      ]
    }
  },
  {
    key: 'ppl',
    label: 'Push / Pull / Legs',
    description: 'Classic 3-day split by movement pattern — repeat the cycle 2x/week for a 6-day split.',
    data: {
      name: 'Push Pull Legs',
      sessions: [
        {
          name: 'Push (Chest, Shoulders, Triceps)',
          exercises: [
            { name: 'Barbell Bench Press', sets: 4, reps: '6-8' },
            { name: 'Overhead Press', sets: 3, reps: '8-10' },
            { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
            { name: 'Lateral Raises', sets: 3, reps: '12-15' },
            { name: 'Triceps Pushdown', sets: 3, reps: '10-12' }
          ]
        },
        {
          name: 'Pull (Back, Biceps)',
          exercises: [
            { name: 'Deadlift', sets: 3, reps: 5, notes: 'Heaviest lift of the week — prioritize form.' },
            { name: 'Pull-Ups or Lat Pulldown', sets: 4, reps: '6-10' },
            { name: 'Barbell Row', sets: 3, reps: '8-10' },
            { name: 'Face Pulls', sets: 3, reps: 15 },
            { name: 'Barbell or Dumbbell Curl', sets: 3, reps: '10-12' }
          ]
        },
        {
          name: 'Legs (Quads, Hamstrings, Glutes)',
          exercises: [
            { name: 'Squat', sets: 4, reps: '6-8' },
            { name: 'Romanian Deadlift', sets: 3, reps: '8-10' },
            { name: 'Leg Press', sets: 3, reps: '10-12' },
            { name: 'Leg Curl', sets: 3, reps: '12-15' },
            { name: 'Calf Raises', sets: 4, reps: '15-20' }
          ]
        }
      ]
    }
  }
];

function defaultState() {
  return {
    version: 1,
    unit: 'kg',
    restSeconds: 90,
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
      historyExerciseFilter: '',
      importPanelOpen: false,
      templatesPanelOpen: false
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

// Rest timer lives outside persisted state — it doesn't need to survive a reload.
let restState = { running: false, remaining: 0, duration: Number(state.restSeconds) || 90 };
let restIntervalHandle = null;

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

function formatMMSS(totalSeconds) {
  const t = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function unitLabel() {
  return escapeHtml(state.unit || 'kg');
}

// First number found in a reps value like "8-12" or "10" — used to pre-fill a set's rep input.
function parseRepsLow(targetReps) {
  const m = String(targetReps == null ? '' : targetReps).match(/\d+/);
  return m ? m[0] : '';
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

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Rest timer ----------

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) { /* audio not available, ignore */ }
}

function clearRestInterval() {
  if (restIntervalHandle) {
    clearInterval(restIntervalHandle);
    restIntervalHandle = null;
  }
}

function startRestTimer() {
  clearRestInterval();
  const duration = Number(state.restSeconds) || 90;
  restState = { running: true, remaining: duration, duration };
  restIntervalHandle = setInterval(() => {
    restState.remaining -= 1;
    if (restState.remaining <= 0) {
      clearRestInterval();
      restState.running = false;
      restState.remaining = 0;
      beep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      updateRestBannerDom();
      showToast('Rest done — next set!');
      setTimeout(() => { if (!restState.running) render(); }, 400);
      return;
    }
    updateRestBannerDom();
  }, 1000);
}

function adjustRestTimer(deltaSeconds) {
  if (!restState.running) return;
  restState.remaining = Math.max(0, restState.remaining + deltaSeconds);
  restState.duration = Math.max(restState.duration, restState.remaining);
  updateRestBannerDom();
}

function skipRestTimer() {
  clearRestInterval();
  restState.running = false;
  restState.remaining = 0;
  render();
}

function stopRestTimerSilently() {
  clearRestInterval();
  restState = { running: false, remaining: 0, duration: Number(state.restSeconds) || 90 };
}

function updateRestBannerDom() {
  const remEl = document.getElementById('rest-remaining');
  const barEl = document.getElementById('rest-progress-bar');
  if (!remEl || !barEl) return;
  remEl.textContent = formatMMSS(restState.remaining);
  const pct = restState.duration ? Math.max(0, Math.min(100, (restState.remaining / restState.duration) * 100)) : 0;
  barEl.style.width = pct + '%';
}

function renderRestBanner() {
  if (!restState.running) return '';
  const pct = restState.duration ? Math.max(0, Math.min(100, (restState.remaining / restState.duration) * 100)) : 0;
  return `
    <div class="rest-banner" id="rest-banner">
      <div class="row between">
        <span>Rest</span>
        <span id="rest-remaining" class="rest-remaining-text">${formatMMSS(restState.remaining)}</span>
      </div>
      <div class="rest-progress-track"><div class="rest-progress-fill" id="rest-progress-bar" style="width:${pct}%"></div></div>
      <div class="row" style="margin-top:8px;">
        <button class="btn small" data-action="rest-sub15">−15s</button>
        <button class="btn small" data-action="rest-add15">+15s</button>
        <button class="btn small ghost" data-action="rest-skip">Skip rest</button>
      </div>
    </div>
  `;
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
    ${renderRestBanner()}
    <div class="card">
      ${draft.exercises.map(ex => `
        <div class="exercise-row">
          <div class="row between">
            <h3>${escapeHtml(ex.name)}</h3>
            <span class="pill">target ${ex.targetSets}x${escapeHtml(ex.targetReps)}</span>
          </div>
          ${ex.notes ? `<p class="muted" style="margin:2px 0 8px;">${escapeHtml(ex.notes)}</p>` : ''}
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
    ${renderTemplatesPanel()}
    ${renderImportPanel()}
  `;
}

function renderTemplatesPanel() {
  const open = state.ui.templatesPanelOpen;
  return `
    <div class="card">
      <div class="row between" data-action="toggle-templates-panel" style="cursor:pointer;">
        <h3>Start from a template</h3>
        <span class="icon-btn">${open ? '▾' : '▸'}</span>
      </div>
      ${open ? `
        <p class="muted">Adds that program's sessions to your routine — nothing existing is deleted.</p>
        ${ROUTINE_TEMPLATES.map(t => `
          <div class="exercise-row">
            <div class="row between">
              <div>
                <h3 style="font-size:0.95rem;">${escapeHtml(t.label)}</h3>
                <p class="muted">${escapeHtml(t.description)}</p>
              </div>
              <button class="btn small" data-action="use-template" data-template="${t.key}">Use</button>
            </div>
          </div>
        `).join('')}
      ` : ''}
    </div>
  `;
}

function renderImportPanel() {
  const open = state.ui.importPanelOpen;
  return `
    <div class="card">
      <div class="row between" data-action="toggle-import-panel" style="cursor:pointer;">
        <h3>Import routine (paste JSON)</h3>
        <span class="icon-btn">${open ? '▾' : '▸'}</span>
      </div>
      ${open ? `
        <p class="muted">Paste a routine JSON below. It adds these sessions to your current routine — nothing existing is deleted.</p>
        <textarea id="import-json-textarea" rows="9" placeholder='{"name":"My Program","sessions":[{"name":"Day 1","exercises":[{"name":"Bench Press","sets":3,"reps":"8-12","notes":"optional cue"}]}]}'></textarea>
        <div class="row wrap" style="margin-top:8px;">
          <button class="btn primary" data-action="import-routine-json">Import</button>
          <button class="btn small" data-action="download-sample-routine">Download sample JSON</button>
        </div>
      ` : ''}
    </div>
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
              <div style="width:56px;">
                <label class="field-label">Sets</label>
                <input type="number" min="1" data-field="target-sets" data-session-id="${s.id}" data-exercise-id="${ex.id}" value="${ex.targetSets}">
              </div>
              <div style="width:72px;">
                <label class="field-label">Reps</label>
                <input type="text" inputmode="numeric" placeholder="e.g. 8-12" data-field="target-reps" data-session-id="${s.id}" data-exercise-id="${ex.id}" value="${escapeHtml(ex.targetReps)}">
              </div>
              <div class="reorder-btns">
                <button class="icon-btn" data-action="move-exercise-up" data-session-id="${s.id}" data-exercise-id="${ex.id}" ${eIdx === 0 ? 'disabled' : ''}>▲</button>
                <button class="icon-btn" data-action="move-exercise-down" data-session-id="${s.id}" data-exercise-id="${ex.id}" ${eIdx === s.exercises.length - 1 ? 'disabled' : ''}>▼</button>
              </div>
              <button class="icon-btn" data-action="delete-exercise" data-session-id="${s.id}" data-exercise-id="${ex.id}">🗑</button>
            </div>
            <input type="text" style="margin-top:6px;" placeholder="Notes (optional)"
              data-field="exercise-notes" data-session-id="${s.id}" data-exercise-id="${ex.id}" value="${escapeHtml(ex.notes || '')}">
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
      <label class="field-label">Rest timer default (seconds)</label>
      <input type="number" min="0" step="5" data-field="rest-seconds" value="${escapeHtml(state.restSeconds)}">
      <p class="muted">Starts counting down automatically whenever you check off a set during a workout.</p>
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
  stopRestTimerSilently();
  const draft = {
    sessionId: s.id,
    sessionName: s.name,
    startedAt: new Date().toISOString(),
    exercises: s.exercises.map(ex => {
      const prev = lastLoggedSets(ex.id, ex.name);
      const numSets = Number(ex.targetSets) || 1;
      const sets = [];
      for (let i = 0; i < numSets; i++) {
        const prevSet = prev && prev[i];
        sets.push({
          reps: parseRepsLow(ex.targetReps),
          weight: prevSet && prevSet.weight != null ? String(prevSet.weight) : '',
          done: false
        });
      }
      return { exerciseId: ex.id, name: ex.name, targetSets: ex.targetSets, targetReps: ex.targetReps, notes: ex.notes || '', sets };
    })
  };
  state.activeWorkoutDraft = draft;
  saveState();
  render();
}

function handleFinishWorkout() {
  const draft = state.activeWorkoutDraft;
  if (!draft) return;
  stopRestTimerSilently();
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
  stopRestTimerSilently();
  state.activeWorkoutDraft = null;
  saveState();
  render();
}

function exportData() {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadJson(`gym-companion-backup-${stamp}.json`, state);
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

function sessionsFromRoutineData(routineData) {
  return routineData.sessions.map(s => ({
    id: uid(),
    name: String(s.name || 'Untitled Session'),
    exercises: Array.isArray(s.exercises) ? s.exercises.map(e => ({
      id: uid(),
      name: String(e.name || ''),
      targetSets: Number(e.sets != null ? e.sets : e.targetSets) || 3,
      targetReps: String(e.reps != null ? e.reps : (e.targetReps != null ? e.targetReps : '10')),
      notes: e.notes ? String(e.notes) : ''
    })) : []
  }));
}

// Adds a routine's sessions to the current routine (never deletes existing ones).
function applyRoutineData(routineData, confirmMessage) {
  const newSessions = sessionsFromRoutineData(routineData);
  if (newSessions.length === 0) {
    alert('No sessions found.');
    return false;
  }
  const msg = confirmMessage || `Import ${newSessions.length} session(s) into your routine? Existing sessions are kept.`;
  if (!confirm(msg)) return false;
  const wasEmpty = state.routine.sessions.length === 0;
  state.routine.sessions.push(...newSessions);
  if (wasEmpty && routineData.name) state.routine.name = String(routineData.name);
  saveState();
  return true;
}

function importRoutineFromJsonText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    alert('That is not valid JSON.');
    return false;
  }
  const routineData = parsed && parsed.routine && Array.isArray(parsed.routine.sessions)
    ? parsed.routine
    : parsed;
  if (!routineData || !Array.isArray(routineData.sessions)) {
    alert('JSON must have a "sessions" array (each with a "name" and "exercises").');
    return false;
  }
  return applyRoutineData(routineData);
}

function clearAllData() {
  if (!confirm('Erase ALL routines and history from this browser? This cannot be undone.')) return;
  if (!confirm('Really sure? This is permanent.')) return;
  stopRestTimerSilently();
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
      const nowDone = ex.sets[setIndex].done;
      saveState();
      if (nowDone) startRestTimer();
      render();
      break;
    }
    case 'add-set': {
      const ex = state.activeWorkoutDraft.exercises.find(x => x.exerciseId === exerciseId);
      const last = ex.sets[ex.sets.length - 1];
      ex.sets.push({ reps: last ? last.reps : parseRepsLow(ex.targetReps), weight: last ? last.weight : '', done: false });
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
    case 'rest-add15':
      adjustRestTimer(15);
      break;
    case 'rest-sub15':
      adjustRestTimer(-15);
      break;
    case 'rest-skip':
      skipRestTimer();
      break;
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
      s.exercises.push({ id: uid(), name: '', targetSets: 3, targetReps: '10', notes: '' });
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
    case 'toggle-templates-panel':
      state.ui.templatesPanelOpen = !state.ui.templatesPanelOpen;
      saveState();
      render();
      break;
    case 'toggle-import-panel':
      state.ui.importPanelOpen = !state.ui.importPanelOpen;
      saveState();
      render();
      break;
    case 'import-routine-json': {
      const text = document.getElementById('import-json-textarea').value;
      if (importRoutineFromJsonText(text)) {
        state.ui.importPanelOpen = false;
        render();
        showToast('Routine imported.');
      }
      break;
    }
    case 'download-sample-routine':
      downloadJson('gym-companion-sample-routine.json', SAMPLE_ROUTINE);
      break;
    case 'use-template': {
      const tpl = ROUTINE_TEMPLATES.find(t => t.key === target.dataset.template);
      if (!tpl) break;
      const msg = `Add "${tpl.label}" (${tpl.data.sessions.length} sessions) to your routine? Existing sessions are kept.`;
      if (applyRoutineData(tpl.data, msg)) {
        render();
        showToast(`${tpl.label} added.`);
      }
      break;
    }
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
    case 'exercise-notes': {
      const s = findSession(sessionId);
      const ex = s.exercises.find(x => x.id === exerciseId);
      ex.notes = e.target.value;
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
      ex.targetReps = e.target.value;
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
    case 'rest-seconds':
      state.restSeconds = e.target.value === '' ? '' : Number(e.target.value);
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
  if (field === 'target-sets' || field === 'target-reps' || field === 'unit' || field === 'rest-seconds' ||
      field === 'session-name' || field === 'exercise-name' || field === 'routine-name' || field === 'exercise-notes') {
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
