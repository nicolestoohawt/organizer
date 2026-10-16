'use strict';

/*
 * Page-level views for the Organizer SPA. `store`, `actions`, `getters`
 * and `Utils` are injected into every component by the mixin in app.js.
 */
(function () {

  // ================================================================ login
  const LoginView = {
    name: 'LoginView',
    data() { return { name: '' }; },
    methods: {
      submit() {
        if (this.name.trim()) this.actions.login(this.name);
      }
    },
    template: `
      <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-10">
        <div class="w-full max-w-md">
          <div class="mb-8 text-center">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-950">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path>
              </svg>
            </div>
            <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-white">Welcome to Organizer</h1>
            <p class="mt-2 text-sm text-slate-400">Your agile workspace for boards, sprints and shipping.</p>
          </div>

          <form @submit.prevent="submit" class="rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:p-8">
            <label for="login-name" class="block text-sm font-bold text-slate-700">What should we call you?</label>
            <input id="login-name" v-model="name" type="text" placeholder="e.g. Ada Lovelace" autofocus
              class="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            <p class="mt-2 text-xs text-slate-400">No password needed — just a name for now.</p>
            <button type="submit" :disabled="!name.trim()"
              class="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
              Enter workspace →
            </button>
          </form>

          <div class="mt-6 grid grid-cols-3 gap-3 text-center text-[11px] font-semibold text-slate-400">
            <div class="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">Kanban board</div>
            <div class="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">Sprint planning</div>
            <div class="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">Velocity reports</div>
          </div>
        </div>
      </div>
    `
  };

  // ================================================================ board
  const BoardView = {
    name: 'BoardView',
    computed: {
      sprint() { return this.getters.currentSprint(); },
      sprintProgress() {
        const s = this.sprint;
        if (!s) return { done: 0, total: 0, pct: 0 };
        const tasks = this.store.tasks.filter((t) => t.sprint_id === s.id);
        const total = tasks.reduce((a, t) => a + (t.story_points || 0), 0);
        const done = tasks.filter((t) => t.status === 'done').reduce((a, t) => a + (t.story_points || 0), 0);
        return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0 };
      }
    },
    template: `
      <div class="mx-auto max-w-[100rem] px-4 py-5 sm:px-6">
        <!-- toolbar -->
        <div class="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <select :value="store.currentProjectId || ''" @change="actions.selectProject($event.target.value)"
              class="max-w-[14rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <option v-if="!store.projects.length" value="" disabled>No projects yet</option>
              <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <select :value="store.currentSprintId" @change="store.currentSprintId = $event.target.value"
              class="max-w-[16rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <option v-for="opt in getters.sprintOptions()" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <span class="hidden items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 lg:inline-flex">
              <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
              drag cards between columns
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative flex-1 sm:flex-none">
              <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.874 7.874 0 1 0 5.196 5.196a7.874 7.874 0 0 0 10.607 10.607Z"></path>
              </svg>
              <input v-model="store.search" type="search" placeholder="Search tasks…"
                class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 shadow-sm placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-60">
            </div>
            <button @click="actions.openTaskModal('create')"
              class="shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500">
              + Task
            </button>
          </div>
        </div>

        <!-- active sprint banner -->
        <div v-if="sprint" class="mb-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Active</span>
                <h2 class="text-sm font-bold text-slate-800">{{ sprint.name }}</h2>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                <span class="font-semibold text-slate-600">Goal:</span> {{ sprint.goal || 'No goal set' }}
                · {{ Utils.formatRange(sprint.start_date, sprint.end_date) }}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Points done</p>
              <p class="text-sm font-extrabold text-slate-800">{{ sprintProgress.done }} / {{ sprintProgress.total }} pts</p>
            </div>
          </div>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" :style="{ width: sprintProgress.pct + '%' }"></div>
          </div>
        </div>

        <!-- kanban columns -->
        <div class="flex gap-4 overflow-x-auto pb-4">
          <board-column v-for="col in getters.boardColumns()" :key="col.id" :status="col" :tasks="col.tasks"
            @move="actions.moveTask($event.taskId, $event.status)"
            @new-task="actions.openTaskModal('create', null, $event)"
            @edit-task="actions.openTaskModal('edit', $event)">
          </board-column>
        </div>
      </div>
    `
  };

  // ================================================================ projects
  const ProjectsView = {
    name: 'ProjectsView',
    data() {
      return { modalOpen: false, form: { name: '', description: '' } };
    },
    methods: {
      openModal() {
        this.form = { name: '', description: '' };
        this.modalOpen = true;
      },
      async save() {
        const project = await this.actions.createProject({ name: this.form.name, description: this.form.description });
        if (project) this.modalOpen = false;
      },
      openBoard(project) {
        this.actions.selectProject(project.id);
        this.actions.setView('board');
      },
      async remove(project) {
        if (!window.confirm('Delete project "' + project.name + '" and all of its sprints and tasks?')) return;
        await this.actions.deleteProject(project.id);
      },
      stats(project) {
        const tasks = this.store.tasks.filter((t) => t.project_id === project.id);
        const done = tasks.filter((t) => t.status === 'done').length;
        return {
          sprints: this.store.sprints.filter((s) => s.project_id === project.id).length,
          tasks: tasks.length,
          done: done,
          pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0
        };
      }
    },
    template: `
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-xl font-extrabold tracking-tight text-slate-900">Projects</h1>
            <p class="mt-0.5 text-sm text-slate-500">Group sprints and tasks under a shared goal.</p>
          </div>
          <button @click="openModal"
            class="inline-flex items-center gap-1.5 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            New project
          </button>
        </div>

        <div v-if="store.projects.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article v-for="p in store.projects" :key="p.id"
            class="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:shadow-lg hover:ring-indigo-200">
            <div class="flex items-start justify-between gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white">
                {{ Utils.initials(p.name) }}
              </div>
              <button @click="remove(p)" title="Delete project"
                class="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.2v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"></path>
                </svg>
              </button>
            </div>
            <h2 class="mt-3 text-base font-bold text-slate-800">{{ p.name }}</h2>
            <p class="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">{{ p.description || 'No description.' }}</p>
            <div class="mt-4 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl bg-slate-50 py-2 ring-1 ring-slate-100">
                <p class="text-base font-extrabold text-slate-800">{{ stats(p).sprints }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Sprints</p>
              </div>
              <div class="rounded-xl bg-slate-50 py-2 ring-1 ring-slate-100">
                <p class="text-base font-extrabold text-slate-800">{{ stats(p).tasks }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tasks</p>
              </div>
              <div class="rounded-xl bg-slate-50 py-2 ring-1 ring-slate-100">
                <p class="text-base font-extrabold text-emerald-600">{{ stats(p).done }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Done</p>
              </div>
            </div>
            <div class="mt-4">
              <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-emerald-500 transition-all duration-500" :style="{ width: stats(p).pct + '%' }"></div>
              </div>
              <p class="mt-1.5 text-[11px] font-semibold text-slate-400">{{ stats(p).pct }}% complete</p>
            </div>
            <button @click="openBoard(p)"
              class="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700">
              Open board →
            </button>
          </article>
        </div>

        <empty-state v-else title="No projects yet"
          subtitle="Create your first project to start planning sprints and organizing tasks on the board.">
          <button @click="openModal" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-500">Create project</button>
        </empty-state>

        <app-modal :open="modalOpen" title="New project" @close="modalOpen = false">
          <form id="project-form" class="space-y-4" @submit.prevent="save">
            <div>
              <label for="project-name" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Name</label>
              <input id="project-name" v-model="form.name" type="text" required placeholder="e.g. Apollo Web Platform"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            </div>
            <div>
              <label for="project-desc" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
              <textarea id="project-desc" v-model="form.description" rows="3" placeholder="What is this project about?"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"></textarea>
            </div>
          </form>
          <template #footer>
            <div class="flex justify-end gap-2">
              <button type="button" @click="modalOpen = false"
                class="rounded-lg px-3.5 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100">Cancel</button>
              <button type="submit" form="project-form" :disabled="store.saving"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50">Create project</button>
            </div>
          </template>
        </app-modal>
      </div>
    `
  };

  // ================================================================ sprints
  const SprintsView = {
    name: 'SprintsView',
    data() {
      return {
        modalOpen: false,
        form: { name: '', goal: '', start_date: '', end_date: '' }
      };
    },
    computed: {
      project() { return this.getters.currentProject(); },
      sprints() {
        return this.project ? this.store.sprints.filter((s) => s.project_id === this.project.id) : [];
      }
    },
    methods: {
      openModal() {
        const n = this.sprints.length + 1;
        const today = window.Utils.todayISO();
        const end = new Date(Date.now() + 13 * 86400000).toISOString().slice(0, 10);
        this.form = { name: 'Sprint ' + n, goal: '', start_date: today, end_date: end };
        this.modalOpen = true;
      },
      async save() {
        const sprint = await this.actions.createSprint({
          name: this.form.name,
          goal: this.form.goal,
          start_date: this.form.start_date,
          end_date: this.form.end_date,
          project_id: this.project ? this.project.id : null
        });
        if (sprint) this.modalOpen = false;
      },
      daysLeft(s) { return window.Utils.daysUntil(s.end_date); },
      sprintStats(s) {
        const tasks = this.store.tasks.filter((t) => t.sprint_id === s.id);
        const done = tasks.filter((t) => t.status === 'done');
        return {
          tasks: tasks.length,
          done: done.length,
          points: tasks.reduce((a, t) => a + (t.story_points || 0), 0),
          donePoints: done.reduce((a, t) => a + (t.story_points || 0), 0)
        };
      },
      statusBadge(s) {
        const map = {
          active: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
          planned: 'bg-slate-100 text-slate-600 ring-slate-200',
          completed: 'bg-indigo-100 text-indigo-700 ring-indigo-200'
        };
        return map[s.status] || map.planned;
      },
      viewReport(s) { this.actions.openReport(s.id); }
    },
    template: `
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-xl font-extrabold tracking-tight text-slate-900">Sprints</h1>
            <p class="mt-0.5 text-sm text-slate-500">Time-boxed iterations for <span class="font-semibold text-slate-700">{{ project ? project.name : '…' }}</span></p>
          </div>
          <button @click="openModal" :disabled="!project"
            class="inline-flex items-center gap-1.5 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            New sprint
          </button>
        </div>

        <div v-if="!project">
          <empty-state title="Pick or create a project first"
            subtitle="Sprints belong to a project — select one on the board or create it in Projects.">
            <button @click="actions.setView('projects')" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-500">Go to projects</button>
          </empty-state>
        </div>

        <div v-else-if="sprints.length" class="space-y-3">
          <article v-for="s in sprints" :key="s.id"
            class="rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:shadow-md"
            :class="s.status === 'active' ? 'ring-2 ring-emerald-300' : ''">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-base font-bold text-slate-800">{{ s.name }}</h2>
                  <span :class="statusBadge(s)" class="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1">{{ s.status }}</span>
                </div>
                <p class="mt-1 text-sm text-slate-500">{{ s.goal || 'No goal set.' }}</p>
                <p class="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path>
                  </svg>
                  {{ Utils.formatRange(s.start_date, s.end_date) }}
                  <span v-if="s.status === 'active' && daysLeft(s) !== null" class="text-emerald-600">· {{ daysLeft(s) }}d left</span>
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                  {{ sprintStats(s).done }}/{{ sprintStats(s).tasks }} tasks · {{ sprintStats(s).donePoints }}/{{ sprintStats(s).points }} pts
                </span>
                <button v-if="s.status === 'planned'" @click="actions.startSprint(s.id)"
                  class="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500">Start sprint</button>
                <button v-if="s.status === 'active'" @click="actions.completeSprint(s.id)"
                  class="rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500">Complete</button>
                <button @click="viewReport(s)"
                  class="rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200">Report</button>
              </div>
            </div>
          </article>
        </div>

        <empty-state v-else title="No sprints yet"
          subtitle="Create a sprint to start iterating. Typical sprints run one or two weeks.">
          <button @click="openModal" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-500">Create sprint</button>
        </empty-state>

        <app-modal :open="modalOpen" title="New sprint" @close="modalOpen = false">
          <form id="sprint-form" class="space-y-4" @submit.prevent="save">
            <div>
              <label for="sprint-name" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Name</label>
              <input id="sprint-name" v-model="form.name" type="text" required
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            </div>
            <div>
              <label for="sprint-goal" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Sprint goal</label>
              <input id="sprint-goal" v-model="form.goal" type="text" placeholder="What are we trying to achieve?"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="sprint-start" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Start</label>
                <input id="sprint-start" v-model="form.start_date" type="date" required
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              </div>
              <div>
                <label for="sprint-end" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">End</label>
                <input id="sprint-end" v-model="form.end_date" type="date" required
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              </div>
            </div>
          </form>
          <template #footer>
            <div class="flex justify-end gap-2">
              <button type="button" @click="modalOpen = false"
                class="rounded-lg px-3.5 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100">Cancel</button>
              <button type="submit" form="sprint-form" :disabled="store.saving"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50">Create sprint</button>
            </div>
          </template>
        </app-modal>
      </div>
    `
  };

  // ================================================================ reports
  const ReportsView = {
    name: 'ReportsView',
    data() {
      return { sprintId: null };
    },
    computed: {
      options() {
        const pid = this.store.currentProjectId;
        return this.store.sprints.filter((s) => !pid || s.project_id === pid);
      },
      report() {
        return this.sprintId ? this.getters.sprintReport(this.sprintId) : null;
      }
    },
    watch: {
      'store.currentProjectId'() { this.pickSprint(); },
      'store.reportSprintId'(value) { if (value) this.sprintId = value; }
    },
    mounted() { this.pickSprint(); },
    methods: {
      pickSprint() {
        if (this.store.reportSprintId && this.options.some((s) => s.id === this.store.reportSprintId)) {
          this.sprintId = this.store.reportSprintId;
          return;
        }
        const active = this.options.find((s) => s.status === 'active');
        this.sprintId = active ? active.id : (this.options.length ? this.options[0].id : null);
      },
      barWidth(count) {
        const max = Math.max.apply(null, this.report.byStatus.map((s) => s.count).concat([1]));
        return Math.round((count / max) * 100);
      }
    },
    template: `
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-xl font-extrabold tracking-tight text-slate-900">Reports</h1>
            <p class="mt-0.5 text-sm text-slate-500">Velocity and status for a selected sprint.</p>
          </div>
          <select v-model="sprintId"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            <option v-for="s in options" :key="s.id" :value="s.id">{{ s.name }} ({{ s.status }})</option>
          </select>
        </div>

        <template v-if="report">
          <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div class="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Committed</p>
              <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ report.totalPoints }}<span class="ml-1 text-xs font-semibold text-slate-400">pts</span></p>
            </div>
            <div class="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
              <p class="mt-1 text-2xl font-extrabold text-emerald-600">{{ report.donePoints }}<span class="ml-1 text-xs font-semibold text-slate-400">pts</span></p>
            </div>
            <div class="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completion</p>
              <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ report.pct }}<span class="ml-1 text-xs font-semibold text-slate-400">%</span></p>
            </div>
            <div class="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time</p>
              <p class="mt-1 text-2xl font-extrabold text-slate-900">
                {{ report.daysLeft === null ? '—' : (report.daysLeft < 0 ? Math.abs(report.daysLeft) + 'd over' : report.daysLeft + 'd left') }}
              </p>
            </div>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <section class="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 class="text-sm font-bold text-slate-800">Work by status</h2>
              <div class="mt-4 space-y-3.5">
                <div v-for="st in report.byStatus" :key="st.id">
                  <div class="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span class="flex items-center gap-1.5"><span :class="st.dot" class="h-2 w-2 rounded-full"></span>{{ st.label }}</span>
                    <span>{{ st.count }}</span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div :class="st.dot" class="h-full rounded-full transition-all duration-500" :style="{ width: barWidth(st.count) + '%' }"></div>
                  </div>
                </div>
              </div>
            </section>

            <section class="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 class="text-sm font-bold text-slate-800">By assignee</h2>
              <div class="mt-2 overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th class="py-2 pr-3">Person</th>
                      <th class="px-3 py-2">Tasks</th>
                      <th class="px-3 py-2">Done</th>
                      <th class="px-3 py-2">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="a in report.byAssignee" :key="a.name" class="border-t border-slate-100">
                      <td class="py-2.5 pr-3">
                        <div class="flex items-center gap-2.5">
                          <user-avatar :name="a.name" size="sm"></user-avatar>
                          <span class="font-semibold text-slate-700">{{ a.name }}</span>
                        </div>
                      </td>
                      <td class="px-3 py-2.5 text-slate-500">{{ a.total }}</td>
                      <td class="px-3 py-2.5 font-semibold text-emerald-600">{{ a.done }}</td>
                      <td class="px-3 py-2.5 text-slate-500">{{ a.points }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="!report.byAssignee.length" class="mt-3 text-xs text-slate-400">No tasks in this sprint yet.</p>
            </section>
          </div>

          <p class="mt-4 text-xs text-slate-400">
            {{ report.sprint.name }} · {{ Utils.formatRange(report.sprint.start_date, report.sprint.end_date) }} · {{ report.taskCount }} tasks total
          </p>
        </template>

        <empty-state v-else title="No sprint selected"
          subtitle="Create a sprint first, then come back for velocity and status reports."></empty-state>
      </div>
    `
  };

  window.AppViews = { LoginView, BoardView, ProjectsView, SprintsView, ReportsView };
})();