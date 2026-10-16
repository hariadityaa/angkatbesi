/* Iron Log — all data stored in this browser via localStorage. No server. */

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
      quickStartMode: 'templates'
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

// ---------- Progress & stats (all derived from history, nothing extra stored) ----------

function isNum(v) {
  return v != null && v !== '' && !isNaN(Number(v));
}

function roundWeight(n) {
  return Math.round(n * 100) / 100;
}

function weightIncrement() {
  return /lb/i.test(state.unit || '') ? 5 : 2.5;
}

// Heaviest completed set, or null for bodyweight / nothing completed.
function topWeight(sets) {
  const w = sets.filter(s => s.completed && isNum(s.weight) && Number(s.weight) > 0).map(s => Number(s.weight));
  return w.length ? Math.max(...w) : null;
}

// Next workout's weights: last session's, plus one increment if every set was completed.
function progressionFor(exerciseId, name) {
  const prev = lastLoggedSets(exerciseId, name);
  if (!prev || !prev.length) return null;
  const inc = prev.every(s => s.completed) ? weightIncrement() : 0;
  const weights = prev.map(s => isNum(s.weight) && Number(s.weight) > 0 ? roundWeight(Number(s.weight) + inc) : null);
  const used = prev.filter(s => isNum(s.weight) && Number(s.weight) > 0).map(s => Number(s.weight));
  const last = used.length ? Math.max(...used) : null;
  return { weights, last, next: last == null ? null : roundWeight(last + inc), up: inc > 0 && last != null };
}

function entryVolume(entry) {
  let v = 0;
  for (const ex of entry.exercises) {
    for (const s of ex.sets) {
      if (s.completed && isNum(s.reps) && isNum(s.weight)) v += Number(s.reps) * Number(s.weight);
    }
  }
  return v;
}

function entrySetCounts(entry) {
  let done = 0, total = 0;
  for (const ex of entry.exercises) {
    for (const s of ex.sets) { total++; if (s.completed) done++; }
  }
  return { done, total };
}

function formatVolume(v) {
  return v >= 10000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v).toLocaleString();
}

function formatDuration(ms) {
  const m = Math.max(1, Math.round(ms / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

// Walk history oldest-first. A PR is a completed set heavier than any earlier one for that exercise.
function prsByEntry() {
  const best = new Map();
  const out = new Map();
  for (let i = state.history.length - 1; i >= 0; i--) {
    const entry = state.history[i];
    const prs = [];
    for (const ex of entry.exercises) {
      const key = ex.name.trim().toLowerCase();
      const top = topWeight(ex.sets);
      if (top == null) continue;
      if (best.has(key) && top > best.get(key)) prs.push({ name: ex.name, weight: top, gain: roundWeight(top - best.get(key)) });
      if (!best.has(key) || top > best.get(key)) best.set(key, top);
    }
    out.set(entry.id, prs);
  }
  return out;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Weeks start on Monday.
function startOfWeek(d) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function daysAgo(iso) {
  return Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86400000);
}

function relativeDay(iso) {
  const n = daysAgo(iso);
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  if (n < 14) return `${n} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Consecutive weeks with at least one session. This week counts once it has one.
function weekStreak() {
  const weeks = new Set(state.history.map(h => startOfWeek(new Date(h.date)).getTime()));
  const w = startOfWeek(new Date());
  if (!weeks.has(w.getTime())) w.setDate(w.getDate() - 7);
  let n = 0;
  while (weeks.has(w.getTime())) { n++; w.setDate(w.getDate() - 7); }
  return n;
}

// The session after the last one logged, in routine order. Skips sessions with no exercises.
function nextSession() {
  const sessions = state.routine.sessions.filter(s => s.exercises.length);
  if (!sessions.length) return null;
  const last = state.history[0];
  if (!last) return sessions[0];
  let i = sessions.findIndex(s => s.id === last.sessionId);
  if (i === -1) i = sessions.findIndex(s => s.name === last.sessionName);
  return sessions[(i + 1) % sessions.length];
}

function lastDoneFor(session) {
  const h = state.history.find(e => e.sessionId === session.id) ||
    state.history.find(e => e.sessionName === session.name);
  return h ? h.date : null;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function sparkline(values) {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const span = (Math.max(...values) - min) || 1;
  const pts = values.map((v, i) =>
    `${(i / (values.length - 1) * 100).toFixed(2)},${(30 - (v - min) / span * 28).toFixed(2)}`).join(' ');
  return `<svg class="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}"/></svg>`;
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
      <div class="row mt-2">
        <button class="btn small" data-action="rest-sub15">−15s</button>
        <button class="btn small" data-action="rest-add15">+15s</button>
        <button class="btn small ghost" data-action="rest-skip">Skip rest</button>
      </div>
    </div>
  `;
}

// ---------- Rendering ----------

// Lucide-style outline icons (1.5px stroke, inherits currentColor)
const ICONS = {
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  up: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  down: '<path d="M12 5v14m-6-6 6 6 6-6"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  reorder: '<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'
};
function icon(name) {
  return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>';
}


function render() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === state.ui.activeTab);
  });
  const app = document.getElementById('app');
  let html;
  switch (state.ui.activeTab) {
    case 'routine': html = renderRoutineTab(); break;
    case 'history': html = renderHistoryTab(); break;
    case 'settings': html = renderSettingsTab(); break;
    default: html = renderTrainTab();
  }
  app.innerHTML = renderUpdateBanner() + html + renderSheet();
  document.body.classList.toggle('sheet-open', !!sheet);
  justChecked = null;
  if (sheet && sheet.focusName) {
    sheet.focusName = false;
    const el = document.getElementById('sheet-ex-name');
    if (el) el.focus();
  }
}

// ---------- Update banner ----------
let updateReady = false;
function renderUpdateBanner() {
  if (!updateReady) return '';
  return `
    <div class="card update-banner" role="status">
      <p><strong>A new version of Iron Log is ready.</strong></p>
      <button class="btn primary block mt-2" data-action="update-app">Update now</button>
    </div>`;
}

// ---------- Install ----------
// Chrome's menu install says "already installed" for any page on an origin that has an
// installed app (other apps live on hurrymeow.github.io). The page prompt checks scope correctly.
let installEvent = null;
const INSTALL_DECLINED = 'heavyho.installDeclined';
const isStandalone = () => matchMedia('(display-mode: standalone)').matches;

function installDeclined() {
  try { return localStorage.getItem(INSTALL_DECLINED) === '1'; } catch { return false; }
}

function renderInstallCard() {
  if (!installEvent || installDeclined() || isStandalone()) return '';
  return `
    <div class="card">
      <h3>Put Iron Log on your home screen</h3>
      <p class="muted">Open it like any other app. It works without internet too.</p>
      <div class="row install-row">
        <button class="btn primary" data-action="install-app">Install app</button>
        <button class="btn" data-action="install-decline">Not now</button>
      </div>
    </div>`;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  render();
});
window.addEventListener('appinstalled', () => { installEvent = null; render(); });

async function handleInstall() {
  const e = installEvent;
  installEvent = null;
  render();
  if (e) await e.prompt().catch(() => {});
}

function renderInstallSettings() {
  if (isStandalone()) return '';
  const body = installEvent
    ? '<button class="btn primary block mt-2" data-action="install-app">Install app</button>'
    : `<p class="muted">Android Chrome: an <strong>Install app</strong> button appears here once Chrome allows it. Reload and wait a few seconds. If an old HeavyHo icon is on your home screen, uninstall it first.</p>
       <p class="muted">iPhone Safari: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p>`;
  return `
    <div class="card">
      <h3>Install app</h3>
      ${body}
    </div>`;
}

function handleDeclineInstall() {
  try { localStorage.setItem(INSTALL_DECLINED, '1'); } catch { /* storage blocked */ }
  render();
}

let finishSummary = null; // { entryId } of the session just finished, until dismissed

function renderTrainTab() {
  if (state.activeWorkoutDraft) return renderActiveWorkout(state.activeWorkoutDraft);
  if (finishSummary) return renderFinishSummary();

  const sessions = state.routine.sessions;
  const next = nextSession();
  if (!next) {
    if (sessions.length) {
      return `
        <div class="top-bar"><h1>Train</h1></div>
        ${renderInstallCard()}
        <div class="empty-state">
          <p>Your sessions have no exercises yet.</p>
          <button class="btn primary mt-3" data-action="go-routine">Add exercises</button>
        </div>`;
    }
    return `
      <div class="top-bar"><h1>Train</h1></div>
      ${renderInstallCard()}
      <div class="card hero">
        <p class="eyebrow">Get started</p>
        <h2>Pick a program</h2>
        <p class="muted">One tap sets up your routine. You can edit everything later.</p>
        <div class="mt-3">${renderTemplateRows()}</div>
        <button class="btn ghost block mt-3" data-action="build-own">Or build your own</button>
      </div>`;
  }

  const others = sessions.filter(s => s !== next && s.exercises.length);
  return `
    <div class="top-bar">
      <div>
        <h1>Train</h1>
        <p class="muted">${greeting()}. ${escapeHtml(next.name)} is up.</p>
      </div>
    </div>
    ${renderInstallCard()}
    ${renderWeekCard()}
    ${renderStatTiles()}
    ${renderNextUpCard(next)}
    ${others.length ? `
      <div class="card">
        <p class="eyebrow">Or pick another</p>
        ${others.map(s => {
          const last = lastDoneFor(s);
          return `
          <div class="row between other-row">
            <div>
              <h3>${escapeHtml(s.name)}</h3>
              <p class="muted">${s.exercises.length} exercise${s.exercises.length === 1 ? '' : 's'} · ${last ? 'last ' + relativeDay(last) : 'not done yet'}</p>
            </div>
            <button class="btn small" data-action="start-session" data-session-id="${s.id}">Start</button>
          </div>`;
        }).join('')}
      </div>` : ''}
  `;
}

function renderWeekCard() {
  const trained = new Set(state.history.map(h => startOfDay(new Date(h.date)).getTime()));
  const today = startOfDay(new Date()).getTime();
  const day = startOfWeek(new Date());
  let count = 0;
  const dots = [];
  for (let i = 0; i < 7; i++) {
    const t = day.getTime();
    const on = trained.has(t);
    if (on) count++;
    dots.push(`<div class="day ${on ? 'on' : ''} ${t === today ? 'today' : ''} ${t > today ? 'future' : ''}">
      <span class="dot">${on ? icon('check') : ''}</span><span class="day-label">${'MTWTFSS'[i]}</span></div>`);
    day.setDate(day.getDate() + 1);
  }
  const streak = weekStreak();
  const last = state.history[0];
  const sub = last ? `Last trained ${relativeDay(last.date)}` : 'Your first session lights up a day.';
  return `
    <div class="card">
      <div class="row between">
        <div>
          <h3>${count} session${count === 1 ? '' : 's'} this week</h3>
          <p class="muted">${sub}</p>
        </div>
        ${streak > 1 ? `<span class="pill">${streak}-week streak</span>` : ''}
      </div>
      <div class="week-strip">${dots.join('')}</div>
    </div>`;
}

function renderStatTiles() {
  if (!state.history.length) return '';
  const weekStart = startOfWeek(new Date()).getTime();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prs = prsByEntry();
  let volume = 0, sessions = 0, prCount = 0;
  for (const h of state.history) {
    const t = new Date(h.date).getTime();
    if (t >= weekStart) volume += entryVolume(h);
    if (t >= monthStart) { sessions++; prCount += (prs.get(h.id) || []).length; }
  }
  return `
    <div class="stat-grid">
      <div class="stat"><span class="stat-value">${formatVolume(volume)}</span><span class="stat-label">${unitLabel()} lifted this week</span></div>
      <div class="stat"><span class="stat-value">${sessions}</span><span class="stat-label">sessions this month</span></div>
      <div class="stat"><span class="stat-value ${prCount ? 'up' : ''}">${prCount}</span><span class="stat-label">PRs this month</span></div>
    </div>`;
}

function renderNextUpCard(s) {
  const last = lastDoneFor(s);
  return `
    <div class="card hero">
      <p class="eyebrow">Next up</p>
      <h2>${escapeHtml(s.name)}</h2>
      <p class="muted">${s.exercises.length} exercise${s.exercises.length === 1 ? '' : 's'} · ${last ? 'last done ' + relativeDay(last) : 'first time'}</p>
      <ul class="lift-list">
        ${s.exercises.map(ex => {
          const p = progressionFor(ex.id, ex.name);
          let target = '<span class="muted">new</span>';
          if (p && p.last != null) {
            target = p.up
              ? `<span class="muted">${p.last} →</span> <strong class="up">${p.next}</strong>`
              : `<strong>${p.last}</strong>`;
          } else if (p) {
            target = '<span class="muted">—</span>';
          }
          return `
          <li>
            <span class="lift-name">${escapeHtml(ex.name)}</span>
            <span class="lift-scheme">${escapeHtml(ex.targetSets)}×${escapeHtml(ex.targetReps)}</span>
            <span class="lift-target">${target}</span>
          </li>`;
        }).join('')}
      </ul>
      <button class="btn primary block mt-3" data-action="start-session" data-session-id="${s.id}">Start ${escapeHtml(s.name)}</button>
    </div>`;
}

function renderFinishSummary() {
  const entry = state.history.find(h => h.id === finishSummary.entryId);
  if (!entry) { finishSummary = null; return renderTrainTab(); }
  const prs = prsByEntry().get(entry.id) || [];
  const { done, total } = entrySetCounts(entry);
  const duration = entry.startedAt ? formatDuration(new Date(entry.date) - new Date(entry.startedAt)) : '—';
  const next = nextSession();
  return `
    <div class="summary">
      <div class="summary-badge">${icon('check')}</div>
      <h1>${escapeHtml(entry.sessionName)} done</h1>
      <p class="muted">${formatDate(entry.date)}</p>
    </div>
    <div class="stat-grid">
      <div class="stat"><span class="stat-value">${duration}</span><span class="stat-label">duration</span></div>
      <div class="stat"><span class="stat-value">${formatVolume(entryVolume(entry))}</span><span class="stat-label">${unitLabel()} lifted</span></div>
      <div class="stat"><span class="stat-value">${done}/${total}</span><span class="stat-label">sets done</span></div>
    </div>
    <div class="card">
      ${prs.length ? `
        <p class="eyebrow">New personal bests</p>
        <ul class="lift-list">
          ${prs.map(pr => `
            <li>
              <span class="lift-name">${escapeHtml(pr.name)}</span>
              <span class="lift-target"><strong class="up">${pr.weight}${unitLabel()}</strong> <span class="muted">+${pr.gain}</span></span>
            </li>`).join('')}
        </ul>
      ` : `
        <p class="eyebrow">Logged</p>
        <p class="muted">No new bests today. Weights carry over to next time.</p>
      `}
      ${next ? `<p class="muted mt-2">Next time: <strong>${escapeHtml(next.name)}</strong></p>` : ''}
    </div>
    <button class="btn primary block" data-action="dismiss-summary">Done</button>
  `;
}

let justChecked = null; // "exerciseId:setIndex" of the set just ticked, so only it animates

function renderActiveWorkout(draft) {
  let done = 0, total = 0;
  for (const ex of draft.exercises) for (const set of ex.sets) { total++; if (set.done) done++; }
  const pct = total ? Math.round(done / total * 100) : 0;
  return `
    <div class="top-bar">
      <div>
        <h1>${escapeHtml(draft.sessionName)}</h1>
        <p class="muted">Started ${formatDate(draft.startedAt)}</p>
      </div>
      <button class="btn ghost" data-action="cancel-workout">Cancel</button>
    </div>
    <div class="progress-strip">
      <div class="row between">
        <span class="muted">${done === total && total ? 'All sets done' : 'Progress'}</span>
        <span class="mono">${done}/${total} sets</span>
      </div>
      <div class="rest-progress-track"><div class="rest-progress-fill" style="width:${pct}%"></div></div>
    </div>
    ${renderRestBanner()}
    <div class="card">
      ${draft.exercises.map(ex => `
        <div class="exercise-row">
          <div class="row between">
            <h3>${escapeHtml(ex.name)}</h3>
            ${ex.sets.length && ex.sets.every(set => set.done)
              ? `<span class="pill success">${icon('check')} done</span>`
              : `<span class="pill">target ${ex.targetSets}x${escapeHtml(ex.targetReps)}</span>`}
          </div>
          ${ex.notes ? `<p class="muted">${escapeHtml(ex.notes)}</p>` : ''}
          <div class="row muted set-head">
            <span class="num-col">#</span>
            <span class="grow">Reps</span>
            <span class="grow">Weight (${unitLabel()})</span>
            <span class="chk-col"></span>
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
              <button class="check-btn ${set.done ? 'checked' : ''} ${justChecked === ex.exerciseId + ':' + i ? 'pop' : ''}"
                data-action="toggle-set-done" data-exercise-id="${ex.exerciseId}" data-set-index="${i}"aria-label="Mark set done">${icon('check')}</button>
            </div>
          `).join('')}
          <div class="row mt-2">
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
  const empty = r.sessions.length === 0;
  return `
    <div class="top-bar routine-head">
      <input type="text" id="routine-name-input" class="title-input" data-field="routine-name"
        value="${escapeHtml(r.name)}" placeholder="Routine name" aria-label="Routine name" enterkeyhint="done">
      <label class="icon-btn" for="routine-name-input" aria-label="Rename routine">${icon('pencil')}</label>
      ${routineReorder
        ? '<button class="btn small primary" data-action="reorder-done">Done</button>'
        : '<button class="icon-btn" data-action="open-routine-menu" aria-label="Routine options">' + icon('more') + '</button>'}
    </div>
    ${routineReorder ? '<p class="muted reorder-hint">Use the arrows to reorder sessions and exercises.</p>' : ''}
    ${empty ? renderQuickStartPanel() : ''}
    ${r.sessions.map((s, sIdx) => renderSessionCard(s, sIdx, r.sessions.length)).join('')}
    ${routineReorder ? '' : '<button class="btn dashed block" data-action="add-session">+ Add session</button>'}
  `;
}

function renderQuickStartPanel() {
  const mode = state.ui.quickStartMode || 'templates';
  return `
    <div class="card">
      <h3>Quick start</h3>
      <p class="muted">Pick a template or paste a routine someone shared with you.</p>
      <div class="tabs-toggle mt-3">
        <button class="${mode === 'templates' ? 'active' : ''}" data-action="quickstart-tab" data-mode="templates">Templates</button>
        <button class="${mode === 'json' ? 'active' : ''}" data-action="quickstart-tab" data-mode="json">Paste JSON</button>
      </div>
      ${mode === 'templates' ? renderTemplateRows() : renderImportJsonForm()}
    </div>
  `;
}

function renderTemplateRows() {
  return `
    ${ROUTINE_TEMPLATES.map(t => `
      <div class="exercise-row">
        <div class="row between">
          <div>
            <h3>${escapeHtml(t.label)}</h3>
            <p class="muted">${escapeHtml(t.description)}</p>
          </div>
          <button class="btn small" data-action="use-template" data-template="${t.key}">Use</button>
        </div>
      </div>
    `).join('')}
  `;
}

function renderImportJsonForm() {
  return `
    <p class="muted">Edit the sample below or paste your own. Importing adds these sessions without deleting anything.</p>
    <textarea id="import-json-textarea" class="mt-2" rows="9">${escapeHtml(JSON.stringify(SAMPLE_ROUTINE, null, 2))}</textarea>
    <button class="btn primary block mt-3" data-action="import-routine-json">Import</button>
    <div class="row mt-2">
      <button class="btn small ghost" data-action="copy-sample-routine">Copy sample</button>
      <button class="btn small ghost" data-action="download-sample-routine">Download sample</button>
    </div>
  `;
}

function sessionSetCount(s) {
  return s.exercises.reduce((n, ex) => n + (Number(ex.targetSets) || 0), 0);
}

function sessionStats(s) {
  const n = s.exercises.length;
  if (!n) return 'No exercises yet';
  const sets = sessionSetCount(s);
  return `${n} exercise${n === 1 ? '' : 's'} · ${sets} set${sets === 1 ? '' : 's'}`;
}

function sessionSummary(s) {
  return s.exercises.map(ex => ex.name || 'Untitled').join(' · ');
}

function exerciseTarget(ex) {
  return `${ex.targetSets || '–'} × ${ex.targetReps || '–'}`;
}

function renderSessionCard(s, sIdx, total) {
  const expanded = state.ui.expandedSessionIds.includes(s.id);
  return `
    <div class="card">
      <div class="row">
        <button class="disclosure" data-action="toggle-session-expand" data-session-id="${s.id}" aria-expanded="${expanded}">
          <span class="disclosure-text">
            <h3 data-session-title="${s.id}">${escapeHtml(s.name) || 'Untitled session'}</h3>
            <span class="muted">${sessionStats(s)}</span>
            ${!expanded && s.exercises.length ? `<span class="muted session-names">${escapeHtml(sessionSummary(s))}</span>` : ''}
          </span>
          ${routineReorder ? '' : icon('chevDown')}
        </button>
        ${routineReorder ? `
          <div class="row reorder-inline">
            <button class="icon-btn" data-action="move-session-up" data-session-id="${s.id}" ${sIdx === 0 ? 'disabled' : ''} aria-label="Move up">${icon('up')}</button>
            <button class="icon-btn" data-action="move-session-down" data-session-id="${s.id}" ${sIdx === total - 1 ? 'disabled' : ''} aria-label="Move down">${icon('down')}</button>
          </div>` : ''}
      </div>
      ${expanded ? `
        <hr class="divider">
        <label class="field-label" for="session-name-${s.id}">Session name</label>
        <input type="text" id="session-name-${s.id}" data-field="session-name" data-session-id="${s.id}" value="${escapeHtml(s.name)}">
        <div class="ex-list mt-3">
        ${s.exercises.map((ex, eIdx) => `
          <div class="ex-line-wrap">
            <button class="ex-line" data-action="edit-exercise" data-session-id="${s.id}" data-exercise-id="${ex.id}">
              <span class="ex-line-text">
                <span class="ex-line-name">${escapeHtml(ex.name) || '<span class="muted">Untitled</span>'}</span>
                ${ex.notes ? `<span class="muted ex-line-notes">${escapeHtml(ex.notes)}</span>` : ''}
              </span>
              <span class="ex-line-target">${escapeHtml(exerciseTarget(ex))}</span>
            </button>
            ${routineReorder ? `
              <div class="row reorder-inline">
                <button class="icon-btn" data-action="move-exercise-up" data-session-id="${s.id}" data-exercise-id="${ex.id}" ${eIdx === 0 ? 'disabled' : ''} aria-label="Move up">${icon('up')}</button>
                <button class="icon-btn" data-action="move-exercise-down" data-session-id="${s.id}" data-exercise-id="${ex.id}" ${eIdx === s.exercises.length - 1 ? 'disabled' : ''} aria-label="Move down">${icon('down')}</button>
              </div>` : ''}
          </div>
        `).join('')}
        </div>
        ${routineReorder ? '' : `
        <div class="row between mt-3">
          <button class="btn small" data-action="add-exercise" data-session-id="${s.id}">+ Add exercise</button>
          <button class="btn small ghost danger-text" data-action="delete-session" data-session-id="${s.id}">${icon('trash')} Delete session</button>
        </div>`}
      ` : ''}
    </div>
  `;
}

// ---------- Bottom sheet ----------
// One sheet at a time. Opening pushes a history entry so Android back closes it.
let sheet = null;          // { kind: 'menu' | 'templates' | 'import' | 'exercise', sessionId, exerciseId, isNew }
let sheetAnimate = false;  // slide in only on first open, not on re-renders
let routineReorder = false;

function openSheet(next) {
  if (!sheet) {
    sheetAnimate = true;
    history.pushState({ sheet: true }, '');
  }
  sheet = next;
  render();
}

function closeSheet() {
  if (!sheet) return;
  if (history.state && history.state.sheet) history.back(); // popstate finishes the close
  else dismissSheet();
}

function dismissSheet() {
  if (!sheet) return;
  if (sheet.kind === 'exercise' && sheet.isNew) {
    const s = findSession(sheet.sessionId);
    const ex = s && s.exercises.find(x => x.id === sheet.exerciseId);
    if (ex && !ex.name.trim()) {
      s.exercises = s.exercises.filter(x => x !== ex);
      saveState();
    }
  }
  sheet = null;
  render();
}

window.addEventListener('popstate', () => { if (sheet) dismissSheet(); });

function renderSheet() {
  if (!sheet) return '';
  let body = '';
  switch (sheet.kind) {
    case 'menu': body = renderRoutineMenu(); break;
    case 'templates': body = `<h2>Add from template</h2><p class="muted">Adds that program's sessions. Nothing existing is deleted.</p><div class="mt-3">${renderTemplateRows()}</div>`; break;
    case 'import': body = `<h2>Import JSON</h2>${renderImportJsonForm()}`; break;
    case 'exercise': body = renderExerciseSheet(); break;
  }
  const anim = sheetAnimate ? ' sheet-enter' : '';
  sheetAnimate = false;
  return `
    <div class="sheet-backdrop${anim}" data-action="close-sheet"></div>
    <div class="sheet${anim}" role="dialog" aria-modal="true">
      <div class="sheet-handle" aria-hidden="true"></div>
      ${body}
    </div>
  `;
}

function sheetItem(action, iconName, label, sub) {
  return `
    <button class="sheet-item" data-action="${action}">
      ${icon(iconName)}
      <span class="disclosure-text"><span>${label}</span>${sub ? `<span class="muted">${sub}</span>` : ''}</span>
    </button>
  `;
}

function renderRoutineMenu() {
  const hasExercises = state.routine.sessions.some(s => s.exercises.length);
  return `
    ${state.routine.sessions.length ? sheetItem('reorder-start', 'reorder', 'Reorder') : ''}
    ${hasExercises ? sheetItem('share-routine', 'share', 'Share routine', 'Sessions, exercises, sets and reps. No weights or history.') : ''}
    ${hasExercises ? sheetItem('download-routine', 'download', 'Download .json') : ''}
    ${sheetItem('open-templates', 'grid', 'Add from template')}
    ${sheetItem('open-import', 'clipboard', 'Import JSON')}
  `;
}

function renderExerciseSheet() {
  const s = findSession(sheet.sessionId);
  const ex = s && s.exercises.find(x => x.id === sheet.exerciseId);
  if (!ex) return '';
  const ids = `data-session-id="${s.id}" data-exercise-id="${ex.id}"`;
  return `
    <h2>${sheet.isNew ? 'New exercise' : 'Edit exercise'}</h2>
    <label class="field-label mt-3" for="sheet-ex-name">Name</label>
    <input type="text" id="sheet-ex-name" placeholder="e.g. Squat" data-field="exercise-name" ${ids} value="${escapeHtml(ex.name)}">
    <div class="row mt-3">
      <div class="grow">
        <label class="field-label" for="sheet-ex-sets">Sets</label>
        <input type="number" id="sheet-ex-sets" min="1" inputmode="numeric" data-field="target-sets" ${ids} value="${ex.targetSets}">
      </div>
      <div class="grow">
        <label class="field-label" for="sheet-ex-reps">Reps</label>
        <input type="text" id="sheet-ex-reps" inputmode="numeric" placeholder="e.g. 8-12" data-field="target-reps" ${ids} value="${escapeHtml(ex.targetReps)}">
      </div>
    </div>
    <label class="field-label mt-3" for="sheet-ex-notes">Notes</label>
    <input type="text" id="sheet-ex-notes" placeholder="Optional" data-field="exercise-notes" ${ids} value="${escapeHtml(ex.notes || '')}">
    <div class="row between mt-4">
      <button class="btn ghost danger-text" data-action="delete-exercise" ${ids}>${icon('trash')} Delete</button>
      <button class="btn primary" data-action="close-sheet">Done</button>
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
    const prs = prsByEntry();
    const rows = [];
    // oldest first, so progression reads top-to-bottom
    for (let i = state.history.length - 1; i >= 0; i--) {
      const entry = state.history[i];
      const ex = entry.exercises.find(e => e.name === selected);
      if (ex) rows.push({ date: entry.date, sets: ex.sets, top: topWeight(ex.sets), pr: (prs.get(entry.id) || []).some(p => p.name === ex.name) });
    }
    const tops = rows.map(r => r.top).filter(t => t != null);
    return `
      <div class="top-bar"><h1>History</h1></div>
      ${toggle}
      <div class="card">
        <label class="field-label">Exercise</label>
        <select id="exercise-filter">
          ${names.map(n => `<option value="${escapeHtml(n)}" ${n === selected ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('')}
        </select>
      </div>
      ${tops.length ? `
        <div class="card">
          <div class="stat-grid flat">
            <div class="stat"><span class="stat-value">${Math.max(...tops)}</span><span class="stat-label">best ${unitLabel()}</span></div>
            <div class="stat"><span class="stat-value">${tops[tops.length - 1]}</span><span class="stat-label">latest ${unitLabel()}</span></div>
            <div class="stat"><span class="stat-value">${rows.length}</span><span class="stat-label">sessions</span></div>
          </div>
          ${sparkline(tops)}
        </div>` : ''}
      ${rows.length === 0 ? '<p class="muted">No logged sets for this exercise yet.</p>' : rows.map(r => `
        <div class="card">
          <div class="row between"><p class="muted">${formatDate(r.date)}</p>${r.pr ? '<span class="pill success">PR</span>' : ''}</div>
          <p>${r.sets.map(s => `${escapeHtml(s.reps)}${s.weight != null && s.weight !== '' ? ' @ ' + escapeHtml(s.weight) + unitLabel() : ''}`).join(', ')}</p>
        </div>
      `).join('')}
    `;
  }

  const prs = prsByEntry();
  return `
    <div class="top-bar"><h1>History</h1></div>
    ${toggle}
    ${state.history.map(entry => {
      const expanded = state.ui.expandedHistoryIds.includes(entry.id);
      const prCount = (prs.get(entry.id) || []).length;
      const { done } = entrySetCounts(entry);
      return `
      <div class="card">
        <button class="disclosure" data-action="toggle-history-expand" data-entry-id="${entry.id}" aria-expanded="${expanded}">
          <span class="disclosure-text">
            <h3>${escapeHtml(entry.sessionName)}</h3>
            <span class="muted">${formatDate(entry.date)}</span>
            <span class="muted mono">${formatVolume(entryVolume(entry))} ${unitLabel()} volume · ${done} sets${prCount ? ` · <span class="up">${prCount} PR${prCount === 1 ? '' : 's'}</span>` : ''}</span>
          </span>
          ${icon('chevDown')}
        </button>
        ${expanded ? `
          <div class="history-detail">
            ${entry.exercises.map(ex => `
              <p><strong>${escapeHtml(ex.name)}:</strong> ${ex.sets.map(s => `${escapeHtml(s.reps)}${s.weight != null && s.weight !== '' ? '@' + escapeHtml(s.weight) + unitLabel() : ''}${s.completed ? '' : ' (skipped)'}`).join(', ')}</p>
            `).join('')}
            <div class="row mt-3">
              <button class="btn small ghost danger-text" data-action="delete-history-entry" data-entry-id="${entry.id}">${icon('trash')} Delete entry</button>
            </div>
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
    ${renderInstallSettings()}
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
      <div class="row wrap mt-2">
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
      const prog = progressionFor(ex.id, ex.name);
      const numSets = Number(ex.targetSets) || 1;
      const sets = [];
      for (let i = 0; i < numSets; i++) {
        const w = prog && prog.weights[i];
        sets.push({
          reps: parseRepsLow(ex.targetReps),
          weight: w != null ? String(w) : '',
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
    startedAt: draft.startedAt,
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
  finishSummary = { entryId: entry.id };
  if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
  render();
  window.scrollTo(0, 0);
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
  downloadJson(`iron-log-backup-${stamp}.json`, state);
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
  const wasEmpty = state.routine.sessions.length === 0;
  const msg = confirmMessage || `Import ${newSessions.length} session(s) into your routine? Existing sessions are kept.`;
  if (!wasEmpty && !confirm(msg)) return false;
  state.routine.sessions.push(...newSessions);
  state.ui.expandedSessionIds.push(...newSessions.map(s => s.id));
  if (wasEmpty && routineData.name) state.routine.name = String(routineData.name);
  saveState();
  return true;
}

// Routine only, in the same shape the Paste JSON importer accepts. Excludes ids and workout history.
function routineForSharing() {
  return {
    name: state.routine.name,
    sessions: state.routine.sessions
      .filter(s => s.exercises.length)
      .map(s => ({
        name: s.name,
        exercises: s.exercises.map(e => ({
          name: e.name,
          sets: e.targetSets,
          reps: /^\d+$/.test(e.targetReps) ? Number(e.targetReps) : e.targetReps,
          ...(e.notes ? { notes: e.notes } : {})
        }))
      }))
  };
}

function routineShareFilename() {
  const slug = state.routine.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'routine';
  return `iron-log-${slug}.json`;
}

function copyRoutineJson() {
  const text = JSON.stringify(routineForSharing(), null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Routine JSON copied.'))
      .catch(() => alert('Could not copy — your browser blocked clipboard access.'));
  } else {
    alert('Clipboard access isn\'t available here — use Download .json instead.');
  }
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
    finishSummary = null;
    routineReorder = false;
    if (sheet) closeSheet();
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
    case 'update-app':
      window.location.reload();
      break;
    case 'install-app':
      handleInstall();
      break;
    case 'install-decline':
      handleDeclineInstall();
      break;
    case 'cancel-workout':
      handleCancelWorkout();
      break;
    case 'dismiss-summary':
      finishSummary = null;
      render();
      break;
    case 'go-routine':
      state.ui.activeTab = 'routine';
      saveState();
      render();
      break;
    case 'build-own': {
      const s = { id: uid(), name: 'Session 1', exercises: [] };
      state.routine.sessions.push(s);
      state.ui.expandedSessionIds.push(s.id);
      state.ui.activeTab = 'routine';
      saveState();
      render();
      break;
    }
    case 'toggle-set-done': {
      const ex = state.activeWorkoutDraft.exercises.find(x => x.exerciseId === exerciseId);
      ex.sets[setIndex].done = !ex.sets[setIndex].done;
      const nowDone = ex.sets[setIndex].done;
      if (nowDone) justChecked = exerciseId + ':' + setIndex;
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
      const ex = { id: uid(), name: '', targetSets: 3, targetReps: '10', notes: '' };
      s.exercises.push(ex);
      saveState();
      openSheet({ kind: 'exercise', sessionId, exerciseId: ex.id, isNew: true, focusName: true });
      break;
    }
    case 'edit-exercise':
      openSheet({ kind: 'exercise', sessionId, exerciseId });
      break;
    case 'delete-exercise': {
      const s = findSession(sessionId);
      s.exercises = s.exercises.filter(ex => ex.id !== exerciseId);
      saveState();
      if (sheet) closeSheet();
      else render();
      break;
    }
    case 'close-sheet':
      closeSheet();
      break;
    case 'open-routine-menu':
      openSheet({ kind: 'menu' });
      break;
    case 'open-templates':
      openSheet({ kind: 'templates' });
      break;
    case 'open-import':
      openSheet({ kind: 'import' });
      break;
    case 'reorder-start':
      routineReorder = true;
      closeSheet();
      render();
      break;
    case 'reorder-done':
      routineReorder = false;
      render();
      break;
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
    case 'quickstart-tab':
      state.ui.quickStartMode = target.dataset.mode;
      saveState();
      render();
      break;
    case 'import-routine-json': {
      const text = document.getElementById('import-json-textarea').value;
      if (importRoutineFromJsonText(text)) {
        if (sheet) closeSheet();
        render();
        showToast('Routine imported.');
      }
      break;
    }
    case 'share-routine':
      closeSheet();
      if (navigator.share) {
        navigator.share({ title: state.routine.name, text: JSON.stringify(routineForSharing(), null, 2) })
          .catch(err => { if (err && err.name !== 'AbortError') copyRoutineJson(); });
      } else {
        copyRoutineJson();
      }
      break;
    case 'download-routine':
      closeSheet();
      downloadJson(routineShareFilename(), routineForSharing());
      break;
    case 'download-sample-routine':
      downloadJson('iron-log-sample-routine.json', SAMPLE_ROUTINE);
      break;
    case 'copy-sample-routine': {
      const text = JSON.stringify(SAMPLE_ROUTINE, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => showToast('Sample JSON copied.'))
          .catch(() => alert('Could not copy — your browser blocked clipboard access.'));
      } else {
        alert('Clipboard access isn\'t available here — use Download sample instead.');
      }
      break;
    }
    case 'use-template': {
      const tpl = ROUTINE_TEMPLATES.find(t => t.key === target.dataset.template);
      if (!tpl) break;
      const msg = `Add "${tpl.label}" (${tpl.data.sessions.length} sessions) to your routine? Existing sessions are kept.`;
      if (applyRoutineData(tpl.data, msg)) {
        if (sheet) closeSheet();
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
      const title = document.querySelector(`[data-session-title="${sessionId}"]`);
      if (title) title.textContent = s.name || 'Untitled session';
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheet) closeSheet();
  else if (e.key === 'Enter' && e.target.classList.contains('title-input')) e.target.blur();
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
  // The exercise sheet stays open while editing. The list behind it re-renders on close.
  if (sheet && sheet.kind === 'exercise') return;
  if (field === 'target-sets' || field === 'target-reps' || field === 'unit' || field === 'rest-seconds' ||
      field === 'session-name' || field === 'exercise-name' || field === 'routine-name' || field === 'exercise-notes') {
    render();
  }
});

// ---------- Init ----------

render();

// ---------- Updates ----------
// A new deploy ships a new sw.js. It installs, takes over at once and fires
// controllerchange. The open page still runs the old code, so offer a reload
// instead of reloading mid-workout. The installed app can sit in the background
// for days, so also check when it comes back to the foreground.
const UPDATE_CHECK_MS = 30 * 60 * 1000;
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  // The first install also fires controllerchange. That is not an update.
  let hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => {
    if (hadController) { updateReady = true; render(); }
    hadController = true;
  });

  window.addEventListener('load', () => {
    sw.register('sw.js').then((reg) => {
      const check = () => reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
      setInterval(check, UPDATE_CHECK_MS);
    }).catch(() => {});
  });
}
