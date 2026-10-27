// OneOS PC 1.3 · opt-in runtime v1. No global preferences or DOM writes.
export const RUNTIME_VERSION = '1.0.6';
export const PREVIEW_STORAGE_KEY = 'oneos.design-canon.preferences.v1';
export const DEFAULT_PREFERENCES = Object.freeze({
  theme: Object.freeze({ mode: 'light', colorPrimary: '#007A55', radius: '0.625', semiDarkSidebar: false, semiDarkHeader: false }),
  app: Object.freeze({ compact: false, layout: 'sidebar-nav' }),
  sidebar: Object.freeze({ collapsed: false }),
  tabbar: Object.freeze({ enable: true }),
  breadcrumb: Object.freeze({ enable: true }),
});
const choice = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const flag = (value, fallback = false) => typeof value === 'boolean' ? value : fallback;
const color = (value) => typeof value === 'string' && /^(#[\da-f]{6}|#[\da-f]{3}|(?:hsl|rgb)a?\([\d\s.,%/+-]+\))$/i.test(value.trim()) ? value.trim() : '#007A55';

export function normalizePreferences(input = {}) {
  if (!input || typeof input !== 'object') input = {};
  const t = input.theme || {}, a = input.app || {};
  const radius = Number(t.radius ?? 0.625);
  return {
    theme: {
      mode: choice(t.mode, ['light', 'dark', 'auto'], 'light'),
      colorPrimary: color(t.colorPrimary),
      radius: Number.isFinite(radius) ? String(Math.min(1, Math.max(0, radius))) : '0.625',
      semiDarkSidebar: flag(t.semiDarkSidebar), semiDarkHeader: flag(t.semiDarkHeader),
    },
    app: { compact: flag(a.compact), layout: choice(a.layout, ['sidebar-nav', 'header-nav'], 'sidebar-nav') },
    sidebar: { collapsed: flag(input.sidebar?.collapsed) },
    tabbar: { enable: flag(input.tabbar?.enable, true) },
    breadcrumb: { enable: flag(input.breadcrumb?.enable, true) },
  };
}
export function resolveAppearance(preferences, systemDark = false) {
  const p = normalizePreferences(preferences);
  return {
    mode: p.theme.mode === 'auto' ? (systemDark ? 'dark' : 'light') : p.theme.mode,
    primary: p.theme.colorPrimary,
    radius: Math.round(Number(p.theme.radius) * 16),
    controlHeight: p.app.compact ? 32 : 36,
    density: p.app.compact ? 'compact' : 'comfortable',
  };
}
export function loadPreviewPreferences(storage) {
  try { return normalizePreferences(JSON.parse(storage?.getItem(PREVIEW_STORAGE_KEY) || '{}')); }
  catch { return normalizePreferences(); }
}
export function getPreviewStorage(owner) {
  try { return owner?.localStorage; } catch { return undefined; }
}
export function savePreviewPreferences(storage, preferences) {
  try { storage?.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(normalizePreferences(preferences))); return Boolean(storage); }
  catch { return false; }
}
