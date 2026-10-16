'use strict';

/*
 * Shared helpers, constants and enums for the Organizer frontend.
 * Everything is attached to `window.Utils` so it is available to every
 * classic (non-bundled) script that loads after this one.
 */
(function () {
  const pad = (n) => String(n).padStart(2, '0');

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function formatRange(a, b) {
    if (!a || !b) return '—';
    return formatDate(a) + ' → ' + formatDate(b);
  }

  function initials(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return parts.slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const target = new Date(iso + 'T00:00:00');
    const today = new Date(todayISO() + 'T00:00:00');
    return Math.round((target - today) / 86400000);
  }

  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function debounce(fn, wait) {
    let t = null;
    return function () {
      const args = arguments;
      const self = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(self, args), wait);
    };
  }

  /* Kanban columns — ids mirror organizer.py's TaskStatus enum */
  const STATUSES = [
    { id: 'backlog',     label: 'Backlog',     dot: 'bg-slate-400',   chip: 'bg-slate-100 text-slate-600 ring-slate-200' },
    { id: 'todo',        label: 'To Do',       dot: 'bg-indigo-500',   chip: 'bg-indigo-100 text-indigo-700 ring-indigo-200' },
    { id: 'in_progress', label: 'In Progress',  dot: 'bg-amber-500',   chip: 'bg-amber-100 text-amber-700 ring-amber-200' },
    { id: 'in_review',   label: 'In Review',    dot: 'bg-sky-500',     chip: 'bg-sky-100 text-sky-700 ring-sky-200' },
    { id: 'done',        label: 'Done',         dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700 ring-emerald-200' }
  ];

  const PRIORITIES = [
    { id: 'low',      label: 'Low',      rank: 3, badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
    { id: 'medium',   label: 'Medium',   rank: 2, badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
    { id: 'high',     label: 'High',     rank: 1, badge: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' },
    { id: 'critical', label: 'Critical', rank: 0, badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' }
  ];

  const statusById = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];
  const priorityById = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];

  function priorityRank(id) {
    const p = priorityById(id);
    return p ? p.rank : 4;
  }

  window.Utils = {
    formatDate,
    formatRange,
    initials,
    todayISO,
    daysUntil,
    uid,
    debounce,
    STATUSES,
    PRIORITIES,
    statusById,
    priorityById,
    priorityRank
  };
})();