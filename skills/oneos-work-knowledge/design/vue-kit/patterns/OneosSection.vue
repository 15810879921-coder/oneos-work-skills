<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<template>
  <section class="oneos-section" :aria-label="title">
    <header class="oneos-section__header">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.aside" class="oneos-section__aside"><slot name="aside" /></div>
    </header>
    <div class="oneos-section__body"><slot /></div>
  </section>
</template>
