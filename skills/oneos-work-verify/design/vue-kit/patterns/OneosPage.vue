<script setup lang="ts">
withDefaults(defineProps<{ kind?: 'ledger' | 'form' | 'detail'; label: string }>(), {
  kind: 'ledger',
});
</script>

<template>
  <section class="oneos-page" :class="`oneos-page--${kind}`" :aria-label="label">
    <div class="oneos-page__measure">
      <header v-if="$slots.header" class="oneos-page__header"><slot name="header" /></header>
      <div v-if="$slots.summary" class="oneos-page__summary"><slot name="summary" /></div>
      <div class="oneos-page__content"><slot /></div>
    </div>
    <footer v-if="$slots.footer" class="oneos-page__footer">
      <div class="oneos-page__footer-inner"><slot name="footer" /></div>
    </footer>
  </section>
</template>
