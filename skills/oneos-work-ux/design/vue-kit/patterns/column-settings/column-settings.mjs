/** Presentation preferences only. Default definitions own labels and locks. */
export function normalizeColumns(defaults, input, {minWidth = 40, maxWidth = 600} = {}) {
  const definitions = defaults.map(column => ({...column}));
  const byKey = new Map(definitions.map(column => [column.key, column]));
  const seen = new Set();
  const editable = [];
  for (const value of Array.isArray(input) ? input : []) {
    const definition = byKey.get(value?.key);
    if (!definition || definition.locked || seen.has(definition.key)) continue;
    seen.add(definition.key);
    const width = typeof value.width === 'number' || (typeof value.width === 'string' && value.width.trim()) ? Number(value.width) : NaN;
    editable.push({...definition,
      visible: typeof value.visible === 'boolean' ? value.visible : definition.visible !== false,
      width: Number.isFinite(width) && width > 0 ? Math.min(maxWidth, Math.max(minWidth, width)) : definition.width,
    });
  }
  // Retain saved order; newly introduced columns use their default values in
  // default order before the locked final column. Retired fields are omitted.
  editable.push(...definitions.filter(column => !column.locked && !seen.has(column.key)));
  let index = 0;
  return definitions.map(column => column.locked ? {...column, visible: true} : editable[index++]);
}

export function canMoveColumn(columns, key, delta) {
  const from = columns.findIndex(column => column.key === key);
  const to = from + delta;
  return from >= 0 && (delta === -1 || delta === 1) && to >= 0 && to < columns.length && !columns[from].locked && !columns[to].locked;
}

export function moveColumn(columns, key, targetKey) {
  const from = columns.findIndex(column => column.key === key);
  const to = columns.findIndex(column => column.key === targetKey);
  if (from < 0 || to < 0 || from === to || columns[from].locked || columns[to].locked) return columns;
  if (columns.slice(Math.min(from, to), Math.max(from, to) + 1).some(column => column.locked)) return columns;
  const next = columns.map(column => ({...column}));
  const [column] = next.splice(from, 1);
  next.splice(to, 0, column);
  return next;
}

export function columnSettingsStorageKey({scope, userId, tableId}) {
  if (!scope || !userId || !tableId) throw new Error('Column settings require an explicit scope, user, and table.');
  return ['oneos', 'table-columns', 'v1', scope, userId, tableId].map(encodeURIComponent).join(':');
}

const copy = columns => columns.map(column => ({...column}));

/** State is supplied by the caller so the same logic works with Vue reactive state and plain tests. */
export function createColumnSettingsManager({defaults, state = {}, columns, save, scopeLabel = '仅当前页面生效', widthOptions, onError} = {}) {
  let alive = true, generation = 0, writer, stream;
  function configure({columns: input, save: nextSave, scopeLabel: label = '仅当前页面生效', saved = false} = {}) {
    ++generation;
    writer = typeof nextSave === 'function' ? nextSave : null;
    stream = {pending: null, running: false, promise: Promise.resolve()};
    Object.assign(state, {columns: normalizeColumns(defaults, input, widthOptions), columnsSaveScope: label,
      columnsSaveStatus: writer ? (saved ? 'saved' : 'idle') : 'session', columnsSaveError: '', columnsPersisted: !!saved});
  }
  function persist() {
    if (!alive || !writer) return Promise.resolve(false);
    const current = stream, run = generation, saveSnapshot = writer;
    current.pending = copy(state.columns);
    state.columnsSaveStatus = 'saving';
    state.columnsSaveError = '';
    state.columnsPersisted = false;
    if (current.running) return current.promise;
    current.running = true;
    current.promise = (async () => {
      let success = false;
      while (current.pending && alive && run === generation) {
        const snapshot = current.pending;
        current.pending = null;
        try {
          const result = await saveSnapshot(snapshot);
          if (result === false || result?.success === false) throw new Error(result?.message || '列设置保存未成功，请重试');
          if (!alive || run !== generation) return false;
          success = true;
          if (!current.pending) Object.assign(state, {columnsSaveStatus: 'saved', columnsSaveError: '', columnsPersisted: true});
        } catch (error) {
          if (!alive || run !== generation) return false;
          success = false;
          if (!current.pending) {
            const message = error?.message || '列设置保存失败，请重试';
            Object.assign(state, {columnsSaveStatus: 'error', columnsSaveError: message, columnsPersisted: false});
            onError?.(message);
          }
        }
      }
      current.running = false;
      return success;
    })();
    return current.promise;
  }
  function setColumns(input) {
    if (!alive) return state.columns;
    state.columns = normalizeColumns(defaults, input, widthOptions);
    void persist();
    return state.columns;
  }
  configure({columns, save, scopeLabel});
  return {state, configure, setColumns, retrySave: persist, whenSaved: () => stream.promise,
    restoreDefaults: () => setColumns(defaults), dispose() {alive = false; ++generation; stream.pending = null;}};
}

/** Browser-only preview storage. No account or server synchronization is implied. */
export function createLocalColumnSettings({defaults, state = {}, scope = 'preview', userId = 'local-preview', tableId, storage = () => globalThis.localStorage, legacyKeys = [], widthOptions} = {}) {
  const key = columnSettingsStorageKey({scope, userId, tableId});
  let columns, existed = false, migrated = false, loadError = '';
  try {
    const target = storage();
    if (!target) throw new Error('本机存储不可用');
    let raw = target.getItem(key);
    // Unscoped historical preview keys must never seed a real user namespace.
    if (raw === null && scope === 'preview' && userId === 'local-preview') for (const oldKey of legacyKeys) {
      raw = target.getItem(oldKey);
      if (raw !== null) {migrated = true; break;}
    }
    if (raw !== null) {
      const data = JSON.parse(raw);
      columns = Array.isArray(data) ? data : data?.columns;
      if (!Array.isArray(columns)) throw new Error('本机列设置格式无效');
      existed = true;
    }
  } catch (error) {loadError = `本机列设置读取失败：${error?.message || '请重试'}`;}
  const manager = createColumnSettingsManager({defaults, state, columns, widthOptions,
    scopeLabel: '本机预览保存 · 当前浏览器',
    save: next => {
      const target = storage();
      if (!target) throw new Error('本机存储不可用，请重试');
      const value = JSON.stringify({version: 1, columns: next.map(({key, width, visible}) => ({key, width, visible}))});
      target.setItem(key, value);
      if (target.getItem(key) !== value) throw new Error('本机列设置未保存成功，请重试');
    }});
  if (loadError) Object.assign(state, {columnsSaveStatus: 'error', columnsSaveError: loadError});
  else if (existed) {
    Object.assign(state, {columnsSaveStatus: 'saved', columnsPersisted: true});
    // Also rewrite sanitized legacy/retired fields into the explicit scope key.
    manager.setColumns(state.columns);
  }
  return {...manager, storageKey: key, migrated};
}
