<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '筛选与操作' });
</script>

<template>
  <div class="oneos-toolbar" role="group" :aria-label="label">
    <div class="oneos-toolbar__fields"><slot /></div>
    <div v-if="$slots.actions" class="oneos-toolbar__actions"><slot name="actions" /></div>
  </div>
</template>
