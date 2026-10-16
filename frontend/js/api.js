'use strict';

/*
 * Data access layer for the Organizer frontend.
 *
 * Two modes:
 *  1. HTTP  — set `window.ORGANIZER_API_URL` (e.g. 'http://127.0.0.1:8000/api')
 *             before this script loads to talk to a real server that wraps
 *             the `organizer.py` OrganizerService (Flask/FastAPI).
 *  2. Local — default. Persists to localStorage so the SPA is fully
 *             functional when opened straight from the filesystem (file://).
 */
(function () {
  const LS_KEY = 'organizer.data.v1';
  const BASE_URL = window.ORGANIZER_API_URL || '';
  const USE_HTTP = Boolean(BASE_URL);

  // ---------------- helpers ----------------
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const uid = (prefix) => prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------------- demo seed ----------------
  function seed() {
    const now = new Date().toISOString();
    const t = (id, name, description, status, priority, assignee, points, project, sprint, due, labels) => ({
      id, name, description, status, priority, assignee,
      story_points: points, project_id: project, sprint_id: sprint || null,
      due_date: due || null, labels: labels || [], created_at: now, updated_at: now
    });

    return {
      projects: [
        { id: 'p-apollo', name: 'Apollo Web Platform', description: 'Customer-facing marketing site and documentation portal.', created_at: now, updated_at: now },
        { id: 'p-nova', name: 'Nova Mobile App', description: 'Cross-platform companion app for field teams.', created_at: now, updated_at: now }
      ],
      sprints: [
        { id: 's-01', project_id: 'p-apollo', name: 'Sprint 1', goal: 'Ship the new landing page', start_date: '2026-10-05', end_date: '2026-10-18', status: 'active', created_at: now, updated_at: now },
        { id: 's-02', project_id: 'p-apollo', name: 'Sprint 2', goal: 'Docs portal MVP', start_date: '2026-10-19', end_date: '2026-11-01', status: 'planned', created_at: now, updated_at: now }
      ],
      tasks: [
        t('t-01', 'Design hero section for landing page', 'New visual language with animated gradient background.', 'todo', 'medium', 'Maya Chen', 3, 'p-apollo', 's-01', '2026-10-18', ['design']),
        t('t-02', 'Wire up analytics events', 'Track scroll depth and CTA clicks for the launch funnel.', 'in_progress', 'high', 'Priya Patel', 2, 'p-apollo', 's-01', '2026-10-17', ['analytics']),
        t('t-03', 'Implement pricing page', 'Three tiers with a monthly/annual toggle.', 'in_review', 'medium', 'Diego Torres', 5, 'p-apollo', 's-01', '2026-10-16', ['frontend']),
        t('t-04', 'Fix nav overflow on mobile', 'Hamburger menu clips on screens under 360px wide.', 'done', 'high', 'Maya Chen', 2, 'p-apollo', 's-01', '2026-10-12', ['bug']),
        t('t-05', 'Write A/B test plan for CTA', 'Define hypotheses, variants and success metrics.', 'backlog', 'low', '', 3, 'p-apollo', 's-01', null, ['growth']),
        t('t-06', 'Accessibility audit: color contrast', 'WCAG AA pass across all marketing pages.', 'done', 'medium', 'Sam Okafor', 2, 'p-apollo', 's-01', '2026-10-10', ['a11y']),
        t('t-07', 'Docs portal information architecture', 'Top-level sections, navigation and URL scheme.', 'backlog', 'high', 'Sam Okafor', 5, 'p-apollo', 's-02', '2026-10-24', ['docs']),
        t('t-08', 'Search indexing for docs', 'Evaluate pagefind vs. a custom index.', 'backlog', 'medium', '', 8, 'p-apollo', 's-02', null, ['docs', 'research']),
        t('t-09', 'Dark mode support', 'Tokenize colors and add a theme switcher.', 'backlog', 'low', '', 5, 'p-apollo', null, null, ['enhancement']),
        t('t-10', 'Replace placeholder copy', 'Final marketing text from the content team.', 'todo', 'low', 'Jordan Lee', 1, 'p-apollo', null, '2026-10-20', ['content']),
        t('t-11', 'Offline mode spike', 'Cache recent inspections for airplane-mode access.', 'todo', 'high', 'Alex Kim', 3, 'p-nova', null, '2026-10-22', ['spike']),
        t('t-12', 'Push notification prototype', 'Background sync + local notifications on both platforms.', 'in_progress', 'medium', 'Jordan Lee', 5, 'p-nova', null, '2026-10-21', ['mobile']),
        t('t-13', 'Crash on login (Android 14)', 'Null pointer in the session restore path.', 'done', 'critical', 'Alex Kim', 2, 'p-nova', null, '2026-10-09', ['bug']),
        t('t-14', 'Sync conflict resolution design', 'Last-write-wins vs. field-level merge.', 'in_review', 'high', 'Alex Kim', 5, 'p-nova', null, '2026-10-17', ['design'])
      ]
    };
  }

  let db = null;
  function database() {
    if (db) return db;
    try {
      const raw = localStorage.getItem(LS_KEY);
      db = raw ? JSON.parse(raw) : null;
    } catch (err) { db = null; }
    if (!db || !Array.isArray(db.projects) || !Array.isArray(db.sprints) || !Array.isArray(db.tasks)) {
      db = seed();
      persist();
    }
    return db;
  }
  function persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(db)); } catch (err) { /* storage full or disabled */ }
  }
  const read = async (fn) => { await delay(60 + Math.random() * 90); return fn(); };
  const write = async (fn) => { await delay(90 + Math.random() * 120); const out = fn(); persist(); return out; };

  // ---------------- local backend (mirrors organizer.py's OrganizerService) ----------------
  const local = {
    listProjects: () => read(() => clone(database().projects)),
    createProject: (d) => write(() => {
      const now = new Date().toISOString();
      const project = { id: uid('p'), name: d.name, description: d.description || '', created_at: now, updated_at: now };
      db.projects.push(project);
      return clone(project);
    }),
    deleteProject: (id) => write(() => {
      db.projects = db.projects.filter((p) => p.id !== id);
      db.sprints = db.sprints.filter((s) => s.project_id !== id);
      db.tasks = db.tasks.filter((t) => t.project_id !== id);
      return { ok: true };
    }),

    listSprints: () => read(() => clone(database().sprints)),
    createSprint: (d) => write(() => {
      const now = new Date().toISOString();
      const sprint = {
        id: uid('s'), project_id: d.project_id, name: d.name, goal: d.goal || '',
        start_date: d.start_date, end_date: d.end_date, status: 'planned',
        created_at: now, updated_at: now
      };
      db.sprints.push(sprint);
      return clone(sprint);
    }),
    startSprint: (id) => write(() => {
      const sprint = db.sprints.find((s) => s.id === id);
      if (!sprint) throw new Error('Sprint not found');
      db.sprints.forEach((s) => { if (s.project_id === sprint.project_id && s.status === 'active') s.status = 'planned'; });
      sprint.status = 'active';
      sprint.updated_at = new Date().toISOString();
      return clone(sprint);
    }),
    completeSprint: (id) => write(() => {
      const sprint = db.sprints.find((s) => s.id === id);
      if (!sprint) throw new Error('Sprint not found');
      sprint.status = 'completed';
      const carried = [];
      db.tasks.forEach((t) => {
        if (t.sprint_id === id && t.status !== 'done') { t.sprint_id = null; t.status = 'backlog'; carried.push(t.id); }
      });
      return { sprint: clone(sprint), carried_over: carried };
    }),

    listTasks: () => read(() => clone(database().tasks)),
    createTask: (d) => write(() => {
      const now = new Date().toISOString();
      const task = {
        id: uid('t'), name: d.name, description: d.description || '',
        status: d.status || 'todo', priority: d.priority || 'medium',
        assignee: d.assignee || '', story_points: (d.story_points == null ? null : d.story_points),
        project_id: d.project_id, sprint_id: d.sprint_id || null,
        due_date: d.due_date || null, labels: d.labels || [],
        created_at: now, updated_at: now
      };
      db.tasks.push(task);
      return clone(task);
    }),
    updateTask: (id, patch) => write(() => {
      const task = db.tasks.find((t) => t.id === id);
      if (!task) throw new Error('Task not found');
      Object.keys(patch).forEach((k) => { task[k] = patch[k]; });
      task.updated_at = new Date().toISOString();
      return clone(task);
    }),
    deleteTask: (id) => write(() => {
      db.tasks = db.tasks.filter((t) => t.id !== id);
      return { ok: true };
    })
  };

  // ---------------- optional HTTP backend ----------------
  async function http(method, path, body) {
    const res = await fetch(BASE_URL + path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API error ' + res.status + ' on ' + method + ' ' + path);
    if (res.status === 204) return null;
    return res.json();
  }

  window.API = {
    mode: USE_HTTP ? 'http' : 'local',

    /* handy during development: wipe local demo data and reseed */
    resetDemoData() { db = null; try { localStorage.removeItem(LS_KEY); } catch (err) {} database(); },

    listProjects: () => (USE_HTTP ? http('GET', '/projects') : local.listProjects()),
    createProject: (d) => (USE_HTTP ? http('POST', '/projects', d) : local.createProject(d)),
    deleteProject: (id) => (USE_HTTP ? http('DELETE', '/projects/' + id) : local.deleteProject(id)),

    listSprints: () => (USE_HTTP ? http('GET', '/sprints') : local.listSprints()),
    createSprint: (d) => (USE_HTTP ? http('POST', '/sprints', d) : local.createSprint(d)),
    startSprint: (id) => (USE_HTTP ? http('POST', '/sprints/' + id + '/start') : local.startSprint(id)),
    completeSprint: (id) => (USE_HTTP ? http('POST', '/sprints/' + id + '/complete') : local.completeSprint(id)),

    listTasks: () => (USE_HTTP ? http('GET', '/tasks') : local.listTasks()),
    createTask: (d) => (USE_HTTP ? http('POST', '/tasks', d) : local.createTask(d)),
    updateTask: (id, patch) => (USE_HTTP ? http('PATCH', '/tasks/' + id, patch) : local.updateTask(id, patch)),
    deleteTask: (id) => (USE_HTTP ? http('DELETE', '/tasks/' + id) : local.deleteTask(id))
  };
})();