// Sends finished workouts to the Google Health app as strength training sessions.
// Each sent entry carries gh: { state: 'pending' | 'done' | 'failed', name, error }.
// Entries without gh were finished while disconnected. "Send past workouts" sends them.
// Ported from Makan Meter's js/health.js. Same OAuth client, different scope.
const Health = (() => {
  // Public. Google only accepts it from origins registered in GCP project makan-meter.
  const CLIENT_ID = '949780689105-f1afhqjrdc9aemvatebmveuod2i03tjq.apps.googleusercontent.com';
  const SCOPE = 'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.writeonly';
  const API = 'https://health.googleapis.com/v4/users/me/dataTypes/exercise/dataPoints';

  const ON_KEY = 'ironlog.health';
  const TOKEN_KEY = 'ironlog.healthToken';
  const DELETES_KEY = 'ironlog.healthDeletes';

  // ---------- Calories ----------
  // Effort comes from density: completed sets per minute. Long rests mean a lower average burn.
  // MET runs from 3.5 (Compendium: moderate resistance training) to 6.0 (vigorous lifting).
  // 0.25 sets/min (heavy, 4 min per set) maps to 3.5. 0.75 sets/min (circuit pace) maps to 6.0.
  const MET_MIN = 3.5;
  const MET_MAX = 6.0;
  const DENSITY_LOW = 0.25;
  const MET_PER_DENSITY = (MET_MAX - MET_MIN) / 0.5;
  // Caps a workout left open by mistake: count at most this many minutes per completed set.
  const MAX_MIN_PER_SET = 5;

  function bodyweightKg(weight, unit) {
    const w = Number(weight);
    if (!(w > 0)) return null;
    return /lb/i.test(unit || '') ? w * 0.45359237 : w;
  }

  // Active kcal only. MET includes resting burn (1 MET), which Google counts separately.
  function estimate(entry, weight, unit) {
    const kg = bodyweightKg(weight, unit);
    if (!kg || !entry.startedAt) return null;
    let sets = 0;
    for (const ex of entry.exercises) for (const s of ex.sets) if (s.completed) sets++;
    if (!sets) return null;
    const elapsed = (Date.parse(entry.date) - Date.parse(entry.startedAt)) / 60000;
    const minutes = Math.min(Math.max(elapsed, 1), sets * MAX_MIN_PER_SET);
    const density = sets / minutes;
    const met = Math.min(MET_MAX, Math.max(MET_MIN, MET_MIN + (density - DENSITY_LOW) * MET_PER_DENSITY));
    return { kcal: Math.round((met - 1) * kg * minutes / 60), met: Math.round(met * 10) / 10, minutes: Math.round(minutes) };
  }

  // ---------- Mapping ----------
  const utcOffset = (d) => `${-d.getTimezoneOffset() * 60}s`;

  function setsLine(ex, unit) {
    const done = ex.sets.filter(s => s.completed);
    if (!done.length) return null;
    return `${ex.name}: ` + done.map(s => `${s.reps ?? '?'}${s.weight != null ? ` @ ${s.weight}${unit}` : ''}`).join(', ');
  }

  function toDataPoint(entry, weight, unit) {
    const start = new Date(entry.startedAt || entry.date);
    const end = new Date(Math.max(Date.parse(entry.date), start.getTime() + 60000));
    const est = estimate(entry, weight, unit);
    const notes = [entry.sessionName, ...entry.exercises.map(ex => setsLine(ex, unit)).filter(Boolean)].join('\n');
    const exercise = {
      exerciseType: 'STRENGTH_TRAINING',
      displayName: entry.sessionName || 'Strength training',
      interval: { startTime: start.toISOString(), endTime: end.toISOString(), startUtcOffset: utcOffset(start), endUtcOffset: utcOffset(end) },
      metricsSummary: est ? { caloriesKcal: est.kcal } : {},
      notes: notes.slice(0, 2000)
    };
    if (est) exercise.activeDuration = `${est.minutes * 60}s`;
    return { exercise, dataSource: { recordingMethod: 'MANUAL' } };
  }

  // ---------- Storage ----------
  function get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function set(key, v) {
    try {
      if (v == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(v));
    } catch { /* storage blocked */ }
  }

  const isConnected = () => get(ON_KEY) === true;
  const queuedDeletes = () => get(DELETES_KEY) || [];
  const queueDelete = (name) => set(DELETES_KEY, [...queuedDeletes(), name]);

  function validToken(now = Date.now()) {
    const t = get(TOKEN_KEY);
    return t && t.exp - 60000 > now ? t.token : null;
  }

  const unsent = (entries) => entries.filter(e => !e.gh || e.gh.state === 'failed');
  const waitingCount = (entries) => entries.filter(e => e.gh?.state === 'pending').length + queuedDeletes().length;

  // ---------- Sign-in ----------
  let gisPromise;
  function preload() {
    if (!gisPromise) {
      gisPromise = new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) return resolve();
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => {
          gisPromise = null;
          reject(new Error('Could not load Google sign-in'));
        };
        document.head.append(s);
      });
    }
    return gisPromise;
  }

  // Opens Google's popup. After the first consent it usually closes by itself.
  // Call it straight from a tap, or the browser blocks the popup.
  async function getToken() {
    await preload();
    const oauth2 = window.google.accounts.oauth2;
    return new Promise((resolve, reject) => {
      oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (r) => {
          if (r.error || !r.access_token) return reject(new Error(r.error_description || r.error || 'No token'));
          if (!oauth2.hasGrantedAllScopes(r, SCOPE)) return reject(new Error('Permission was not given'));
          set(TOKEN_KEY, { token: r.access_token, exp: Date.now() + Number(r.expires_in || 3600) * 1000 });
          set(ON_KEY, true);
          resolve(r.access_token);
        },
        error_callback: (e) => reject(new Error(e?.type === 'popup_closed' ? 'Sign-in was closed' : e?.message || 'Sign-in failed'))
      }).requestAccessToken({ prompt: '' });
    });
  }

  function disconnect() {
    const token = validToken();
    if (token) window.google?.accounts?.oauth2?.revoke(token, () => {});
    set(ON_KEY, null);
    set(TOKEN_KEY, null);
    set(DELETES_KEY, null);
  }

  // ---------- API ----------
  class AuthError extends Error {}

  async function call(token, method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) throw new AuthError('Google sign-in expired');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = new Error(data?.error?.message || `HTTP ${res.status}`);
      e.status = res.status;
      throw e;
    }
    return data;
  }

  const permanent = (e) => !(e instanceof AuthError) && e.status >= 400 && e.status < 500;

  // ---------- Sync ----------
  // Sends pending entries and queued deletes. save() persists entries after each change.
  // Returns { needsSignIn, error }.
  let running = null;
  function sync(deps) {
    if (!running) running = runSync(deps).finally(() => { running = null; });
    return running;
  }

  async function runSync({ entries, weight, unit, save }) {
    const pending = entries.filter(e => e.gh?.state === 'pending');
    const deletes = queuedDeletes();
    if (!isConnected() || (!pending.length && !deletes.length)) return {};
    const token = validToken();
    if (!token) return { needsSignIn: true };
    try {
      if (deletes.length) {
        try {
          await call(token, 'POST', `${API}:batchDelete`, { names: deletes });
        } catch (e) {
          if (!permanent(e)) throw e; // A 4xx means the sessions are already gone or invalid.
        }
        set(DELETES_KEY, queuedDeletes().filter(n => !deletes.includes(n)));
      }
      for (const e of pending) {
        try {
          const op = await call(token, 'POST', API, toDataPoint(e, weight, unit));
          // A 200 can still carry a failed operation. Only a returned name proves it was stored.
          if (op?.error) e.gh = { state: 'failed', error: op.error.message || `Error ${op.error.code}` };
          else if (op?.response?.name) e.gh = { state: 'done', name: op.response.name };
          else if (op?.done === false) e.gh = { state: 'done', name: null }; // Still processing at Google.
          else e.gh = { state: 'failed', error: `No session returned (${JSON.stringify(op).slice(0, 200)})` };
        } catch (err) {
          if (!permanent(err)) throw err;
          e.gh = { state: 'failed', error: err.message };
        }
        save();
      }
      return {};
    } catch (e) {
      if (e instanceof AuthError) {
        set(TOKEN_KEY, null);
        return { needsSignIn: true };
      }
      return { error: e.message };
    }
  }

  // Asks Google which exercise sessions it holds within 12 h of this workout's start.
  // Returns the matching data points (Google only lists ones this app may see).
  async function check(entry) {
    const token = validToken();
    if (!token) throw new AuthError('Google sign-in expired');
    const at = Date.parse(entry.startedAt || entry.date);
    const from = new Date(at - 12 * 3600000).toISOString();
    const until = new Date(at + 12 * 3600000).toISOString();
    const filter = `exercise.interval.start_time >= "${from}" AND exercise.interval.start_time < "${until}"`;
    let data;
    try {
      data = await call(token, 'GET', `${API}?pageSize=50&filter=${encodeURIComponent(filter)}`);
    } catch (e) {
      if (!permanent(e)) throw e;
      data = await call(token, 'GET', `${API}?pageSize=50`); // Filter refused: scan recent sessions.
    }
    return data.dataPoints || [];
  }

  return { estimate, toDataPoint, isConnected, check, validToken, unsent, waitingCount, queueDelete, preload, getToken, disconnect, sync };
})();
