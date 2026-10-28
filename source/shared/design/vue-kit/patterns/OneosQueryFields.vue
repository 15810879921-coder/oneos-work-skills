<script setup lang="ts">
import type { Component } from 'vue';
import { computed, watch } from 'vue';

// Only arrange the existing Vben field renderers. They still own values, rules,
// event bindings and option loading; hiding the panel never unmounts a field.
const props = defineProps<{
  fields: Array<{ fieldName: string; formItemClass?: string; [key: string]: any }>;
  fieldComponent: Component;
  expanded: boolean;
  values?: Record<string, unknown>;
}>();
const emit = defineEmits<{ countChange: [count: number] }>();
const primary = computed(() => props.fields.filter(field => field.formItemClass?.includes('is-primary')));
const advanced = computed(() => props.fields.filter(field => !field.formItemClass?.includes('is-primary')));
const hasValue = (value: unknown): boolean =>
  Array.isArray(value) ? value.some(hasValue) : value !== undefined && value !== null && value !== '';
const filledCount = computed(() => advanced.value.filter(field => hasValue(props.values?.[field.fieldName])).length);
watch(filledCount, count => emit('countChange', count), { immediate: true });
</script>

<template>
  <component
    :is="fieldComponent"
    v-for="field in primary"
    :key="field.fieldName"
    v-bind="field"
    :class="field.formItemClass"
  />
  <div v-show="expanded" class="oneos-query-panel" role="group" aria-label="更多筛选条件">
    <div class="oneos-query-panel__fields">
      <component
        :is="fieldComponent"
        v-for="field in advanced"
        :key="field.fieldName"
        v-bind="field"
        :class="field.formItemClass"
      />
    </div>
  </div>
</template>
