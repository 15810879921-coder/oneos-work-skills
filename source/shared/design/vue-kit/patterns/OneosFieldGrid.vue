<script setup lang="ts">
withDefaults(defineProps<{ columns?: 1 | 2 | 3 }>(), { columns: 3 });
</script>

<template>
  <div class="oneos-field-grid" :data-columns="columns"><slot /></div>
</template>
