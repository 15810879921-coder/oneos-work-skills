<script setup lang="ts">
import { computed } from 'vue';
import { ConfigProvider } from 'ant-design-vue';
import { buildOneOsAntdTheme } from '../antd-theme';
import './patterns.css';
import './query.css';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    mode?: 'light' | 'dark';
    primary?: string;
    density?: 'comfortable' | 'compact';
  }>(),
  { mode: 'light', primary: '#007A55', density: 'comfortable' },
);

const primaryInk = computed(() => {
  if (props.mode !== 'dark' || !/^#[\da-f]{6}$/i.test(props.primary)) return props.primary;
  const value = Number.parseInt(props.primary.slice(1), 16);
  return (
    '#' +
    [16, 8, 0]
      .map((shift) =>
        Math.round(((value >> shift) & 255) * 0.55 + 255 * 0.45)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
});

const config = computed(() =>
  buildOneOsAntdTheme({
    isDark: props.mode === 'dark',
    compact: false,
    tokens: { colorPrimary: props.primary, colorLink: primaryInk.value },
    controlHeight: props.density === 'compact' ? 32 : 36,
    borderRadius: 10,
  }),
);

// Theme stays within this subtree. No mutation of document, preferences or form values.
const variables = computed(() => {
  const token = config.value.token!;
  return {
    '--oneos-primary': props.primary,
    '--oneos-primary-ink': primaryInk.value,
    '--oneos-canvas': String(token.colorBgLayout),
    '--oneos-surface': String(token.colorBgContainer),
    '--oneos-elevated': String(token.colorBgElevated),
    '--oneos-ink': String(token.colorText),
    '--oneos-body': String(token.colorTextSecondary),
    '--oneos-muted': props.mode === 'dark' ? '#A0AEC0' : '#596E83',
    '--oneos-line': String(token.colorBorder),
    '--oneos-line-control': props.mode === 'dark' ? '#2D3748' : '#C7D2DD',
    '--oneos-line-soft': String(token.colorBorderSecondary),
    '--oneos-fill': String(token.colorFillAlter),
    '--oneos-hover': String(token.colorFillSecondary),
    '--oneos-error': props.mode === 'dark' ? '#FF8C8C' : '#B42318',
    '--oneos-warning': props.mode === 'dark' ? '#FBBF24' : '#9A5B00',
    '--oneos-success': props.mode === 'dark' ? '#6EE7B7' : '#007A55',
    '--oneos-control-height': `${props.density === 'compact' ? 32 : 36}px`,
  };
});
</script>

<template>
  <ConfigProvider :theme="config" :wave="{ disabled: true }" :auto-insert-space-in-button="false">
    <div v-bind="$attrs" class="oneos-surface" :data-mode="mode" :data-density="density" :style="variables">
      <slot />
    </div>
  </ConfigProvider>
</template>
