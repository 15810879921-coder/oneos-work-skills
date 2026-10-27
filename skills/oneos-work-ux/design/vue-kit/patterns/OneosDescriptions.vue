<script setup lang="ts">
export interface DescriptionItem {
  key: string;
  label: string;
  value?: string | number | null;
  mono?: boolean;
  full?: boolean;
}
withDefaults(defineProps<{ items: DescriptionItem[]; emptyText?: string; bordered?: boolean }>(), { emptyText: '—', bordered: false });
</script>

<template>
  <dl class="oneos-descriptions" :class="{ 'oneos-descriptions--bordered': bordered }">
    <div v-for="item in items" :key="item.key" :class="{ 'is-full': item.full }">
      <dt>{{ item.label }}</dt>
      <dd :class="{ 'oneos-number': item.mono }">
        <slot :name="item.key" :item="item">{{
          item.value === null || item.value === undefined || item.value === ''
            ? emptyText
            : item.value
        }}</slot>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.oneos-descriptions--bordered {
  gap: 0;
  border-top: 1px solid var(--oneos-line-soft);
  border-left: 1px solid var(--oneos-line-soft);
  border-radius: 6px;
  overflow: hidden;
}
.oneos-descriptions--bordered > div {
  padding: 14px 16px;
  border-right: 1px solid var(--oneos-line-soft);
  border-bottom: 1px solid var(--oneos-line-soft);
}
.oneos-descriptions--bordered dt { line-height: 18px; font-weight: 400; }
.oneos-descriptions--bordered dd { min-height: 22px; font-size: 13px; font-weight: 400; line-height: 1.65; }
</style>
