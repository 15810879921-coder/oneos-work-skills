<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue';
import { App, ConfigProvider, theme } from 'ant-design-vue';
import { buildOneosRuntime } from './theme';
import { preserveHostTheme } from './host-theme-guard';
import { useSelectAccessibility } from './select-accessibility';
import { useNoticeTheme } from './notice-theme';
import './patterns.scoped.css';
import './query.scoped.css';
import './runtime.css';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ preferences?: Record<string, unknown> }>();
preserveHostTheme();
const root = ref<HTMLElement>();
const ready = ref(false);
useSelectAccessibility(root);
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : undefined;
const systemDark = ref(media?.matches ?? false);
const onSystemChange = () => { systemDark.value = media?.matches ?? false; };
onMounted(() => {
  // Ant 4.2.6 caches the notification portal on its first mount. The page
  // element must exist before App mounts; never remount it on theme changes.
  ready.value = true;
  media?.addEventListener('change', onSystemChange);
});
onBeforeUnmount(() => media?.removeEventListener('change', onSystemChange));
const runtime = computed(() => buildOneosRuntime(props.preferences, systemDark.value));
// Modal has no trigger node; always keep portals within the opt-in surface.
function popupContainer() { return root.value!; }
const RuntimeApp = defineComponent({
  name: 'OneosRuntimeApp',
  setup(_, { slots }) {
    // This component is below ConfigProvider and reads its local theme only.
    const { hashId } = theme.useToken();
    useNoticeTheme(root, hashId);
    return () => h(App, null, slots);
  },
});
</script>
<template>
  <ConfigProvider :theme="runtime.theme" :wave="{ disabled: true }" :auto-insert-space-in-button="false" :get-popup-container="popupContainer">
    <div ref="root" v-bind="$attrs" class="oneos-surface" data-oneos-runtime="1" :data-mode="runtime.appearance.mode" :data-density="runtime.appearance.density" :style="runtime.variables">
      <RuntimeApp v-if="ready"><slot :container="popupContainer" :appearance="runtime.appearance" /></RuntimeApp>
    </div>
  </ConfigProvider>
</template>
