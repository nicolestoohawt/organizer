'use strict';

/*
 * Central reactive store + actions + getters.
 *
 * The single source of truth is `window.store` (a Vue `reactive` object).
 * `window.storeActions` mutate it, `window.storeGetters` derive from it.
 * app.js injects all three into every component via a small global mixin,
 * so `store.loading`, `store.toast`, … always resolve. That is the fix
 * for the previous "store is undefined" crashes.
 */
(function () {
  const { reactive } = Vue;

  const state = reactive({
    // session
    user: null,
    // ui
    view: 'board',          // board | projects | sprints | reports
    booted: false,
    loading: false,
    saving: false,
    error: null,
    toast: null,            // { id, type, message }
    search: '',
    // data
    projects: [],
    sprints: [],
    tasks: [],
    // selection
    currentProjectId: null,
    currentSprintId: '',     // '' = all, 'backlog' = unscheduled, otherwise a sprint id
    reportSprintId: null,
    // task editor modal
    taskModal: { open: false, mode: 'create', draft: null }
  });

  // restore lightweight session (no auth — just a name)
  try { state.user = JSON.parse(localStorage.getItem('organizer.user') || 'null'); } catch (err) { state.user = null; }

  let toastTimer = null;

  const actions = {
    // ---------- session ----------
    login(name) {
      const clean = String(name || '').trim();
      if (!clean) return;
      state.user = { name: clean };
      try { localStorage.setItem('organizer.user', JSON.stringify(state.user)); } catch (err) {}
      actions.toast('success', 'Welcome, ' + clean + '! Drag cards between columns to update status.');
      actions.refresh();
    },
    logout() {
      state.user = null;
      try { localStorage.removeItem('organizer.user'); } catch (err) {}
      state.view = 'board';
    },

    // ---------- ui ----------
    setView(view) { state.view = view; },
    toast(type, message) {
      state.toast = { id: Date.now(), type: type, message: message };
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { state.toast = null; }, 3400);
    },
    dismissToast() { clearTimeout(toastTimer); state.toast = null; },

    // ---------- data loading ----------
    async refresh() {
      state.loading = true;
      state.error = null;
      try {
        const results = await Promise.all([window.API.listProjects(), window.API.listSprints(), window.API.listTasks()]);
        state.projects = results[0];
        state.sprints = results[1];
        state.tasks = results[2];
        if (!state.currentProjectId && state.projects.length) state.currentProjectId = state.projects[0].id;
        const active = state.sprints.find((s) => s.status === 'active' && s.project_id === state.currentProjectId);
        state.currentSprintId = active ? active.id : '';
      } catch (err) {
        state.error = 'Failed to load workspace data.';
        actions.toast('error', state.error);
      } finally {
        state.loading = false;
        state.booted = true;
      }
    },

    selectProject(projectId) {
      state.currentProjectId = projectId;
      const active = state.sprints.find((s) => s.project_id === projectId && s.status === 'active');
      state.currentSprintId = active ? active.id : '';
    },

    // ---------- projects ----------
    async createProject(data) {
      const name = String(data.name || '').trim();
      if (!name) { actions.toast('error', 'Project name is required.'); return null; }
      state.saving = true;
      try {
        const project = await window.API.createProject({ name: name, description: String(data.description || '').trim() });
        state.projects.push(project);
        if (!state.currentProjectId) actions.selectProject(project.id);
        actions.toast('success', 'Project "' + project.name + '" created.');
        return project;
      } catch (err) {
        actions.toast('error', 'Could not create the project.');
        return null;
      } finally { state.saving = false; }
    },
    async deleteProject(projectId) {
      try {
        await window.API.deleteProject(projectId);
        state.projects = state.projects.filter((p) => p.id !== projectId);
        state.sprints = state.sprints.filter((s) => s.project_id !== projectId);
        state.tasks = state.tasks.filter((t) => t.project_id !== projectId);
        if (state.currentProjectId === projectId) {
          state.currentProjectId = state.projects.length ? state.projects[0].id : null;
          state.currentSprintId = '';
        }
        actions.toast('success', 'Project deleted.');
      } catch (err) { actions.toast('error', 'Could not delete the project.'); }
    },

    // ---------- sprints ----------
    async createSprint(data) {
      const name = String(data.name || '').trim();
      if (!name) { actions.toast('error', 'Sprint name is required.'); return null; }
      if (!data.project_id) { actions.toast('error', 'Sprints need a project.'); return null; }
      state.saving = true;
      try {
        const sprint = await window.API.createSprint(data);
        state.sprints.push(sprint);
        actions.toast('success', sprint.name + ' created — start it when the team is ready.');
        return sprint;
      } catch (err) {
        actions.toast('error', 'Could not create the sprint.');
        return null;
      } finally { state.saving = false; }
    },
    async startSprint(sprintId) {
      try {
        const sprint = await window.API.startSprint(sprintId);
        const existing = state.sprints.find((s) => s.id === sprintId);
        if (existing) Object.assign(existing, sprint);
        state.sprints.forEach((s) => {
          if (s.project_id === sprint.project_id && s.id !== sprintId && s.status === 'active') s.status = 'planned';
        });
        if (state.currentProjectId === sprint.project_id) state.currentSprintId = sprintId;
        actions.toast('success', sprint.name + ' is now active. Good luck!');
      } catch (err) { actions.toast('error', 'Could not start the sprint.'); }
    },
    async completeSprint(sprintId) {
      try {
        const result = await window.API.completeSprint(sprintId);
        const existing = state.sprints.find((s) => s.id === sprintId);
        if (existing) Object.assign(existing, result.sprint || { status: 'completed' });
        (result.carried_over || []).forEach((taskId) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (task) { task.sprint_id = null; task.status = 'backlog'; }
        });
        actions.toast('success', 'Sprint completed. Unfinished tasks moved to the backlog.');
      } catch (err) { actions.toast('error', 'Could not complete the sprint.'); }
    },

    // ---------- tasks ----------
    async moveTask(taskId, status) {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task || task.status === status) return;
      const previous = task.status;
      task.status = status; // optimistic update
      try {
        await window.API.updateTask(taskId, { status: status });
      } catch (err) {
        task.status = previous;
        actions.toast('error', 'Could not move the task.');
      }
    },
    async deleteTask(taskId) {
      try {
        await window.API.deleteTask(taskId);
        state.tasks = state.tasks.filter((t) => t.id !== taskId);
        actions.closeTaskModal();
        actions.toast('success', 'Task deleted.');
      } catch (err) { actions.toast('error', 'Could not delete the task.'); }
    },

    // ---------- task editor modal ----------
    openTaskModal(mode, task, presetStatus) {
      if (mode !== 'edit' && !state.projects.length) {
        actions.toast('info', 'Create a project first, then add tasks to it.');
        return;
      }
      const t = task || {};
      const projectId = t.project_id || state.currentProjectId;
      const active = state.sprints.find((s) => s.status === 'active' && s.project_id === projectId);
      state.taskModal = {
        open: true,
        mode: mode || 'create',
        draft: {
          id: t.id || null,
          name: t.name || '',
          description: t.description || '',
          status: presetStatus || t.status || 'todo',
          priority: t.priority || 'medium',
          assignee: t.assignee || '',
          story_points: t.story_points == null ? null : t.story_points,
          project_id: projectId,
          sprint_id: t.sprint_id != null ? t.sprint_id : (active ? active.id : null),
          due_date: t.due_date || '',
          labels: (t.labels || []).join(', ')
        }
      };
    },
    closeTaskModal() {
      state.taskModal = { open: false, mode: 'create', draft: null };
    },
    async saveTaskModal() {
      const d = state.taskModal.draft;
      if (!d) return;
      if (!d.name || !d.name.trim()) { actions.toast('error', 'Task name is required.'); return; }
      if (!d.project_id) { actions.toast('error', 'Pick a project for this task.'); return; }

      const payload = {
        name: d.name.trim(),
        description: String(d.description || '').trim(),
        status: d.status,
        priority: d.priority,
        assignee: String(d.assignee || '').trim(),
        story_points: (d.story_points === '' || d.story_points == null) ? null : Number(d.story_points),
        project_id: d.project_id,
        sprint_id: d.sprint_id || null,
        due_date: d.due_date || null,
        labels: String(d.labels || '').split(',').map((s) => s.trim()).filter(Boolean)
      };

      state.saving = true;
      try {
        if (state.taskModal.mode === 'edit' && d.id) {
          const updated = await window.API.updateTask(d.id, payload);
          const index = state.tasks.findIndex((t) => t.id === d.id);
          if (index !== -1) state.tasks.splice(index, 1, updated);
          actions.toast('success', 'Task updated.');
        } else {
          const created = await window.API.createTask(payload);
          state.tasks.push(created);
          actions.toast('success', 'Task created.');
        }
        actions.closeTaskModal();
      } catch (err) {
        actions.toast('error', 'Could not save the task.');
      } finally { state.saving = false; }
    },

    // ---------- reports ----------
    openReport(sprintId) {
      state.reportSprintId = sprintId;
      state.view = 'reports';
    }
  };

  const getters = {
    currentProject: () => state.projects.find((p) => p.id === state.currentProjectId) || null,

    currentSprint: () => {
      const id = state.currentSprintId;
      if (!id || id === 'backlog') return null;
      return state.sprints.find((s) => s.id === id) || null;
    },

    sprintOptions: () => {
      const pid = state.currentProjectId;
      const sprints = state.sprints.filter((s) => !pid || s.project_id === pid);
      return [{ value: '', label: 'All tasks' }, { value: 'backlog', label: 'Backlog — unscheduled' }].concat(
        sprints.map((s) => ({
          value: s.id,
          label: s.name + (s.status === 'active' ? ' (active)' : s.status === 'completed' ? ' (completed)' : '')
        }))
      );
    },

    assignees: () => {
      const set = new Set();
      state.tasks.forEach((t) => { if (t.assignee) set.add(t.assignee); });
      if (state.user && state.user.name) set.add(state.user.name);
      return Array.from(set).sort();
    },

    boardColumns: () => {
      let list = state.tasks;
      if (state.currentProjectId) list = list.filter((t) => t.project_id === state.currentProjectId);
      if (state.currentSprintId === 'backlog') list = list.filter((t) => !t.sprint_id);
      else if (state.currentSprintId) list = list.filter((t) => t.sprint_id === state.currentSprintId);

      const q = state.search.trim().toLowerCase();
      if (q) {
        list = list.filter((t) => {
          const hay = [t.name, t.description, t.assignee, (t.labels || []).join(' ')].join(' ').toLowerCase();
          return hay.includes(q);
        });
      }

      const rank = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = list.slice().sort((a, b) => {
        const ra = rank[a.priority] != null ? rank[a.priority] : 4;
        const rb = rank[b.priority] != null ? rank[b.priority] : 4;
        if (ra !== rb) return ra - rb;
        return (b.story_points || 0) - (a.story_points || 0);
      });

      return window.Utils.STATUSES.map((status) => ({
        id: status.id,
        label: status.label,
        dot: status.dot,
        tasks: sorted.filter((t) => (t.status || 'backlog') === status.id)
      }));
    },

    sprintReport: (sprintId) => {
      const sprint = state.sprints.find((s) => s.id === sprintId);
      if (!sprint) return null;
      const tasks = state.tasks.filter((t) => t.sprint_id === sprintId);
      const doneTasks = tasks.filter((t) => t.status === 'done');
      const totalPoints = tasks.reduce((a, t) => a + (t.story_points || 0), 0);
      const donePoints = doneTasks.reduce((a, t) => a + (t.story_points || 0), 0);

      const byStatus = window.Utils.STATUSES.map((st) => ({
        id: st.id, label: st.label, dot: st.dot,
        count: tasks.filter((t) => (t.status || 'backlog') === st.id).length
      }));

      const byAssignee = {};
      tasks.forEach((t) => {
        const key = t.assignee || 'Unassigned';
        if (!byAssignee[key]) byAssignee[key] = { name: key, total: 0, done: 0, points: 0 };
        byAssignee[key].total += 1;
        byAssignee[key].points += t.story_points || 0;
        if (t.status === 'done') byAssignee[key].done += 1;
      });

      return {
        sprint: sprint,
        taskCount: tasks.length,
        doneCount: doneTasks.length,
        totalPoints: totalPoints,
        donePoints: donePoints,
        pct: totalPoints ? Math.round((donePoints / totalPoints) * 100) : 0,
        byStatus: byStatus,
        byAssignee: Object.values(byAssignee).sort((a, b) => b.total - a.total),
        daysLeft: sprint.end_date ? window.Utils.daysUntil(sprint.end_date) : null
      };
    }
  };

  window.store = state;
  window.storeActions = actions;
  window.storeGetters = getters;
})();