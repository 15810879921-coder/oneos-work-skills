/** Public types for the JavaScript preference adapter used by strict Vue projects. */
export interface NormalizedPreferences {
  theme: {
    mode: 'light' | 'dark' | 'auto';
    colorPrimary: string;
    radius: string;
    semiDarkSidebar: boolean;
    semiDarkHeader: boolean;
  };
  app: { compact: boolean; layout: 'sidebar-nav' | 'header-nav' };
  sidebar: { collapsed: boolean };
  tabbar: { enable: boolean };
  breadcrumb: { enable: boolean };
}

export interface RuntimeAppearance {
  mode: 'light' | 'dark';
  primary: string;
  radius: number;
  controlHeight: 32 | 36;
  density: 'compact' | 'comfortable';
}

export interface PreviewStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const RUNTIME_VERSION: '1.0.6';
export const PREVIEW_STORAGE_KEY: 'oneos.design-canon.preferences.v1';
export const DEFAULT_PREFERENCES: {
  readonly [Key in keyof NormalizedPreferences]: Readonly<NormalizedPreferences[Key]>;
};

/** Runtime validation accepts untrusted persisted or host configuration. */
export function normalizePreferences(input?: unknown): NormalizedPreferences;
export function resolveAppearance(preferences?: unknown, systemDark?: boolean): RuntimeAppearance;
export function loadPreviewPreferences(storage?: Pick<PreviewStorage, 'getItem'> | null): NormalizedPreferences;
export function getPreviewStorage(owner?: { readonly localStorage?: PreviewStorage } | null): PreviewStorage | undefined;
export function savePreviewPreferences(storage: Pick<PreviewStorage, 'setItem'> | null | undefined, preferences?: unknown): boolean;
