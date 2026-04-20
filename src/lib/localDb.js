const PREFIX = 'agd_';

function getAll(table) {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}${table}`) || '[]'); }
  catch { return []; }
}

function saveAll(table, items) {
  localStorage.setItem(`${PREFIX}${table}`, JSON.stringify(items));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function applySort(items, sort) {
  if (!sort) return items;
  const { field, order } = typeof sort === 'object' && !Array.isArray(sort)
    ? sort
    : { field: sort[0], order: sort[1] || 'asc' };
  return [...items].sort((a, b) => {
    if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
    if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

function makeEntity(table) {
  return {
    list: async (sort, limit) => {
      let items = getAll(table);
      if (sort) items = applySort(items, sort);
      return limit ? items.slice(0, limit) : items;
    },
    filter: async (filters = {}, sort, limit) => {
      let items = getAll(table).filter(item =>
        Object.entries(filters).every(([k, v]) => item[k] === v)
      );
      if (sort) items = applySort(items, sort);
      return limit ? items.slice(0, limit) : items;
    },
    get: async (id) => getAll(table).find(i => i.id === id) || null,
    create: async (data) => {
      const item = { ...data, id: genId(), created_date: new Date().toISOString() };
      const items = getAll(table);
      items.push(item);
      saveAll(table, items);
      _notify(table);
      return item;
    },
    update: async (id, data) => {
      const items = getAll(table);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) throw new Error(`${table}/${id} not found`);
      items[idx] = { ...items[idx], ...data };
      saveAll(table, items);
      _notify(table);
      return items[idx];
    },
    delete: async (id) => {
      saveAll(table, getAll(table).filter(i => i.id !== id));
      _notify(table);
      return { id };
    },
    subscribe: (cb) => {
      const handler = (e) => { if (e.detail === table) cb(); };
      window.addEventListener('localdb_change', handler);
      return () => window.removeEventListener('localdb_change', handler);
    },
  };
}

function _notify(table) {
  window.dispatchEvent(new CustomEvent('localdb_change', { detail: table }));
}

export const localDb = {
  entities: {
    Agent:            makeEntity('agents'),
    Domain:           makeEntity('domains'),
    Scenario:         makeEntity('scenarios'),
    Threat:           makeEntity('threats'),
    Chain:            makeEntity('chains'),
    Session:          makeEntity('sessions'),
    SessionAgent:     makeEntity('session_agents'),
    SessionSynthesis: makeEntity('session_syntheses'),
    AppConfig:        makeEntity('app_configs'),
    Workspace:        makeEntity('workspaces'),
    WorkspaceMember:  makeEntity('workspace_members'),
  },
};
