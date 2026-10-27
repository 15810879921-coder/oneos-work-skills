<script setup lang="ts">
defineProps<{ collapsed?: boolean }>();
defineEmits<{ activate: [] }>();
</script>

<template>
  <button type="button" class="oneos-shell-brand" :class="{ 'is-collapsed': collapsed }" title="OneOS · 羚牛运营管理平台" aria-label="OneOS 品牌入口" @click="$emit('activate')">
    <span class="oneos-shell-brand__mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v8M6.2 5.9a8 8 0 1 0 11.6 0" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
    </span>
    <span v-if="!collapsed" class="oneos-shell-brand__text"><strong>OneOS</strong><small>羚牛 · 运营管理平台</small></span>
  </button>
</template>
