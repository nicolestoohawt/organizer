'use strict';

/*
 * Application root. Creates the Vue app, injects the store into EVERY
 * component via a tiny global mixin (this is what fixes the previous
 * "store is undefined" crashes), registers all components and boots.
 */
(function () {
  const { createApp } = Vue;

  const app = createApp({
    name: 'OrganizerRoot',
    computed: {
      viewComponent() {
        const map = {
          board: 'board-view',
          projects: 'projects-view',
          sprints: 'sprints-view',
          reports: 'reports-view'
        };
        return map[this.store.view] || 'board-view';
      }
    },
    template: `
      <div class="flex min-h-screen flex-col bg-slate-100">
        <template v-if="store.user">
          <app-header></app-header>
          <main class="flex-1">
            <div v-if="!store.booted" class="flex h-[60vh] items-center justify-center">
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <svg class="h-8 w-8 animate-spin text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <p class="text-sm font-semibold">Loading workspace…</p>
              </div>
            </div>
            <component v-else :is="viewComponent"></component>
          </main>
          <task-modal></task-modal>
        </template>
        <login-view v-else></login-view>
        <toast-host></toast-host>
      </div>
    `
  });

  /* ------------------------------------------------------------------
   * THE FIX: make `store`, `actions`, `getters` and `Utils` resolvable
   * in every component's template and methods. Previously, components
   * referenced a `store` that existed in one script's scope only, so
   * `store.loading` / `store.toast` threw "store is undefined".
   * ------------------------------------------------------------------ */
  app.mixin({
    computed: {
      store() { return window.store; },
      actions() { return window.storeActions; },
      getters() { return window.storeGetters; },
      Utils() { return window.Utils; }
    }
  });

  // global components
  app.component('user-avatar', window.AppComponents.UserAvatar);
  app.component('empty-state', window.AppComponents.EmptyState);
  app.component('task-card', window.AppComponents.TaskCard);
  app.component('board-column', window.AppComponents.BoardColumn);
  app.component('app-modal', window.AppComponents.AppModal);
  app.component('toast-host', window.AppComponents.ToastHost);
  app.component('app-header', window.AppComponents.AppHeader);
  app.component('task-modal', window.AppComponents.TaskModal);

  // views
  app.component('login-view', window.AppViews.LoginView);
  app.component('board-view', window.AppViews.BoardView);
  app.component('projects-view', window.AppViews.ProjectsView);
  app.component('sprints-view', window.AppViews.SprintsView);
  app.component('reports-view', window.AppViews.ReportsView);

  app.mount('#app');

  // boot: restore session if present, otherwise show the login screen
  if (window.store.user) {
    window.storeActions.refresh();
  } else {
    window.store.booted = true;
  }
})();