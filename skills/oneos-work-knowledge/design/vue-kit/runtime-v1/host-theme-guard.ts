import { onBeforeUnmount, watch } from 'vue';
import { globalDesignTokenApi } from 'ant-design-vue/es/theme/internal';

export const RUNTIME_THEME_MARKER = '__oneosRuntimeScope';
export const RUNTIME_THEME_VALUE = 'oneos-runtime-v1';

/**
 * Ant 4.2.6 writes every nested DesignTokenProvider into its global fallback.
 * Keep our marked tokens local to Vue injection; restore only our own global
 * write synchronously. Unmarked host/legacy theme changes continue normally.
 * Pinned compatibility adapter: revalidate before upgrading Ant Design Vue.
 */
export function preserveHostTheme() {
  let hostTheme = globalDesignTokenApi.value;
  const stop = watch(globalDesignTokenApi, (next) => {
    // Multiple opt-in pages can be mounted. Another guard may already restore it.
    if (next !== globalDesignTokenApi.value) return;
    if ((next?.token as Record<string, unknown> | undefined)?.[RUNTIME_THEME_MARKER] === RUNTIME_THEME_VALUE) {
      globalDesignTokenApi.value = hostTheme;
    } else {
      hostTheme = next;
    }
  }, { flush: 'sync' });
  onBeforeUnmount(stop);
}
