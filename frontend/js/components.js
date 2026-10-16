'use strict';

/*
 * Reusable UI components. `store`, `actions`, `getters` and `Utils` are
 * injected into every component by the global mixin defined in app.js.
 */
(function () {

  const AVATAR_COLORS = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500'
  ];

  function hashString(str) {
    let h = 0;
    const s = String(str || '?');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // ------------------------------------------------ avatar
  const UserAvatar = {
    name: 'UserAvatar',
    props: {
      name: { type: String, default: '' },
      size: { type: String, default: 'md' }
    },
    computed: {
      color() { return AVATAR_COLORS[hashString(this.name) % AVATAR_COLORS.length]; },
      label() { return window.Utils.initials(this.name); },
      sizeClass() {
        return { sm: 'h-7 w-7 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-12 w-12 text-sm' }[this.size] || 'h-8 w-8 text-xs';
      }
    },
    template: `
      <span :class="[color, sizeClass]"
        class="inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white ring-2 ring-white">{{ label }}</span>
    `
  };

  // ------------------------------------------------ empty state
  const EmptyState = {
    name: 'EmptyState',
    props: {
      title: { type: String, default: 'Nothing here yet' },
      subtitle: { type: String, default: '' }
    },
    template: `
      <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 02.25 6v12a2.25 2.25 0 0 02.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"></path>
          </svg>
        </div>
        <h3 class="text-sm font-bold text-slate-700">{{ title }}</h3>
        <p class="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{{ subtitle }}</p>
        <div class="mt-4"><slot></slot></div>
      </div>
    `
  };

  // ------------------------------------------------ task card (draggable)
  const TaskCard = {
    name: 'TaskCard',
    props: {
      task: { type: Object, required: true }
    },
    emits: ['edit'],
    computed: {
      priority() { return window.Utils.priorityById(this.task.priority); },
      overdue() {
        return Boolean(this.task.due_date && this.task.status !== 'done' && this.task.due_date < window.Utils.todayISO());
      }
    },
    methods: {
      onDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(this.task.id));
      }
    },
    template: `
      <article draggable="true" @dragstart="onDragStart" @click="$emit('edit', task)"
        class="group cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300 hover:shadow-md active:cursor-grabbing">
        <div class="flex items-start justify-between gap-2">
          <h4 class="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-slate-800">{{ task.name }}</h4>
          <span title="Story points"
            class="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">{{ task.story_points == null ? '–' : task.story_points }}</span>
        </div>
        <p v-if="task.description" class="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{{ task.description }}</p>
        <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span :class="priority.badge" class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{{ priority.label }}</span>
          <span v-for="label in (task.labels || []).slice(0, 3)" :key="label"
            class="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 ring-1 ring-indigo-100">{{ label }}</span>
        </div>
        <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div class="flex min-w-0 items-center gap-2">
            <user-avatar :name="task.assignee" size="sm"></user-avatar>
            <span class="max-w-[9rem] truncate text-xs text-slate-500">{{ task.assignee || 'Unassigned' }}</span>
          </div>
          <span v-if="task.due_date" :class="overdue ? 'text-rose-600' : 'text-slate-400'" class="flex shrink-0 items-center gap-1 text-[11px] font-semibold">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path>
            </svg>
            {{ Utils.formatDate(task.due_date) }}
          </span>
        </div>
      </article>
    `
  };

  // ------------------------------------------------ kanban column (drop zone)
  const BoardColumn = {
    name: 'BoardColumn',
    props: {
      status: { type: Object, required: true },
      tasks: { type: Array, default: () => [] }
    },
    emits: ['move', 'new-task', 'edit-task'],
    data() { return { dragOver: false }; },
    computed: {
      points() { return this.tasks.reduce((sum, t) => sum + (t.story_points || 0), 0); }
    },
    methods: {
      onDrop(e) {
        this.dragOver = false;
        const id = e.dataTransfer.getData('text/plain');
        if (id) this.$emit('move', { taskId: id, status: this.status.id });
      },
      onDragLeave(e) {
        if (e.target === e.currentTarget) this.dragOver = false;
      }
    },
    template: `
      <section class="flex w-72 shrink-0 snap-start flex-col rounded-2xl bg-slate-200/60 ring-1 ring-slate-200 sm:w-80">
        <header class="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
          <div class="flex min-w-0 items-center gap-2">
            <span :class="status.dot" class="h-2.5 w-2.5 shrink-0 rounded-full"></span>
            <h3 class="truncate text-xs font-bold uppercase tracking-wider text-slate-600">{{ status.label }}</h3>
            <span class="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{{ tasks.length }}</span>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span class="text-[10px] font-semibold text-slate-400">{{ points }} pts</span>
            <button @click="$emit('new-task', status.id)" title="Add task to this column"
              class="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-indigo-600">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
              </svg>
            </button>
          </div>
        </header>
        <div class="drop-zone flex-1 space-y-2.5 overflow-y-auto px-2.5 pb-3"
          :class="dragOver ? 'rounded-2xl bg-indigo-100/70 ring-2 ring-inset ring-indigo-300' : ''"
          @dragover.prevent="dragOver = true"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop">
          <task-card v-for="task in tasks" :key="task.id" :task="task" @edit="$emit('edit-task', $event)"></task-card>
          <button v-if="!tasks.length" @click="$emit('new-task', status.id)"
            class="flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 py-6 text-xs font-semibold text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
            </svg>
            Drop or add tasks
          </button>
        </div>
      </section>
    `
  };

  // ------------------------------------------------ generic modal
  const AppModal = {
    name: 'AppModal',
    props: {
      open: { type: Boolean, default: false },
      title: { type: String, default: '' }
    },
    emits: ['close'],
    template: `
      <teleport to="body">
        <transition name="fade">
          <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('close')"></div>
            <transition name="pop" appear>
              <div class="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 sm:max-w-lg sm:rounded-2xl">
                <header class="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 class="text-base font-bold text-slate-800">{{ title }}</h2>
                  <button @click="$emit('close')" class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </header>
                <div class="overflow-y-auto px-5 py-4"><slot></slot></div>
                <footer v-if="$slots.footer" class="shrink-0 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
                  <slot name="footer"></slot>
                </footer>
              </div>
            </transition>
          </div>
        </transition>
      </teleport>
    `
  };

  // ------------------------------------------------ toast host
  const ToastHost = {
    name: 'ToastHost',
    computed: {
      styleClass() {
        const map = {
          success: 'text-emerald-700 ring-emerald-200',
          error: 'text-rose-700 ring-rose-200',
          info: 'text-sky-700 ring-sky-200'
        };
        return map[(this.store.toast && this.store.toast.type) || 'info'] || map.info;
      }
    },
    template: `
      <teleport to="body">
        <transition name="toast">
          <div v-if="store.toast" class="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4 sm:justify-end sm:px-6">
            <div @click="actions.dismissToast()"
              class="pointer-events-auto flex max-w-sm cursor-pointer items-start gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-2xl ring-1"
              :class="styleClass">
              <svg v-if="store.toast.type === 'success'" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
              </svg>
              <svg v-else-if="store.toast.type === 'error'" class="mt-0.5 h-5 w-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"></path>
              </svg>
              <svg v-else class="mt-0.5 h-5 w-5 shrink-0 text-sky-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"></path>
              </svg>
              <p class="leading-snug">{{ store.toast.message }}</p>
            </div>
          </div>
        </transition>
      </teleport>
    `
  };

  // ------------------------------------------------ app header
  const AppHeader = {
    name: 'AppHeader',
    computed: {
      nav() {
        return [
          { id: 'board', label: 'Board' },
          { id: 'projects', label: 'Projects' },
          { id: 'sprints', label: 'Sprints' },
          { id: 'reports', label: 'Reports' }
        ];
      }
    },
    methods: {
      isActive(id) { return this.store.view === id; }
    },
    template: `
      <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path>
              </svg>
            </div>
            <div class="leading-tight">
              <p class="text-sm font-extrabold tracking-tight text-slate-900">Organizer</p>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Agile Workspace</p>
            </div>
          </div>

          <nav class="ml-4 hidden items-center gap-1 md:flex">
            <button v-for="item in nav" :key="item.id" @click="actions.setView(item.id)"
              :class="isActive(item.id) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'"
              class="rounded-lg px-3 py-2 text-sm font-semibold transition">{{ item.label }}</button>
          </nav>

          <div class="ml-auto flex items-center gap-2">
            <button @click="actions.openTaskModal('create')"
              class="hidden items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 sm:flex">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
              </svg>
              New
            </button>
            <div class="flex items-center gap-2.5 rounded-xl bg-slate-50 py-1.5 pl-1.5 pr-3 ring-1 ring-slate-200">
              <user-avatar :name="store.user ? store.user.name : ''" size="sm"></user-avatar>
              <span class="hidden max-w-[10rem] truncate text-sm font-semibold text-slate-700 sm:block">{{ store.user ? store.user.name : '' }}</span>
            </div>
            <button @click="actions.logout()" title="Sign out"
              class="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- mobile nav -->
        <nav class="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-3 py-2 md:hidden">
          <button v-for="item in nav" :key="item.id" @click="actions.setView(item.id)"
            :class="isActive(item.id) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'"
            class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition">{{ item.label }}</button>
        </nav>
      </header>
    `
  };

  // ------------------------------------------------ task editor modal
  const TaskModal = {
    name: 'TaskModal',
    data() {
      return { pointOptions: [null, 0, 1, 2, 3, 5, 8, 13, 21] };
    },
    computed: {
      modal() { return this.store.taskModal; },
      draft() { return this.modal.draft || {}; },
      isEdit() { return this.modal.mode === 'edit'; },
      projectSprints() {
        const pid = this.draft.project_id;
        return pid ? this.store.sprints.filter((s) => s.project_id === pid) : [];
      }
    },
    methods: {
      onProjectChange() { this.draft.sprint_id = null; },
      async save() { await this.actions.saveTaskModal(); },
      async remove() {
        const id = this.draft.id;
        if (!id) return;
        if (!window.confirm('Delete this task? This cannot be undone.')) return;
        await this.actions.deleteTask(id);
      }
    },
    template: `
      <app-modal :open="modal.open" :title="isEdit ? 'Edit task' : 'New task'" @close="actions.closeTaskModal()">
        <form v-if="modal.open" id="task-form" class="space-y-4" @submit.prevent="save">
          <div>
            <label for="task-name" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Name</label>
            <input id="task-name" v-model="draft.name" type="text" required placeholder="Short, action-oriented summary"
              class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
          </div>
          <div>
            <label for="task-desc" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
            <textarea id="task-desc" v-model="draft.description" rows="3" placeholder="Context, acceptance criteria, links…"
              class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="task-status" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Status</label>
              <select id="task-status" v-model="draft.status"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option v-for="st in Utils.STATUSES" :key="st.id" :value="st.id">{{ st.label }}</option>
              </select>
            </div>
            <div>
              <label for="task-priority" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Priority</label>
              <select id="task-priority" v-model="draft.priority"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option v-for="pr in Utils.PRIORITIES" :key="pr.id" :value="pr.id">{{ pr.label }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="task-assignee" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Assignee</label>
              <input id="task-assignee" v-model="draft.assignee" list="assignee-options" type="text" placeholder="Who owns it?"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              <datalist id="assignee-options">
                <option v-for="name in getters.assignees()" :key="name" :value="name"></option>
              </datalist>
            </div>
            <div>
              <label for="task-points" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Story points</label>
              <select id="task-points" v-model="draft.story_points"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option v-for="pt in pointOptions" :key="String(pt)" :value="pt">{{ pt === null ? 'Not estimated' : pt + ' pts' }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="task-project" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Project</label>
              <select id="task-project" v-model="draft.project_id" @change="onProjectChange"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option v-if="!store.projects.length" :value="null" disabled>No projects yet</option>
                <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label for="task-sprint" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Sprint</label>
              <select id="task-sprint" v-model="draft.sprint_id"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option :value="null">No sprint — backlog</option>
                <option v-for="s in projectSprints" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="task-due" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Due date</label>
              <input id="task-due" v-model="draft.due_date" type="date"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            </div>
            <div>
              <label for="task-labels" class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Labels</label>
              <input id="task-labels" v-model="draft.labels" type="text" placeholder="design, frontend"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
            </div>
          </div>
        </form>
        <template #footer>
          <div class="flex items-center justify-between gap-3">
            <button v-if="isEdit" type="button" @click="remove"
              class="rounded-lg px-3 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50">Delete</button>
            <span v-else></span>
            <div class="flex items-center gap-2">
              <button type="button" @click="actions.closeTaskModal()"
                class="rounded-lg px-3.5 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100">Cancel</button>
              <button type="submit" form="task-form" :disabled="store.saving"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50">
                {{ isEdit ? 'Save changes' : 'Create task' }}
              </button>
            </div>
          </div>
        </template>
      </app-modal>
    `
  };

  window.AppComponents = { UserAvatar, EmptyState, TaskCard, BoardColumn, AppModal, ToastHost, AppHeader, TaskModal };
})();