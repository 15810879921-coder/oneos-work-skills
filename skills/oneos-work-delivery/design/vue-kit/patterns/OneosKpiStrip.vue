<script setup lang="ts">
export interface KpiItem {
  key: string;
  label: string;
  value: number;
  description: string;
  tone?: string;
}
withDefaults(defineProps<{ items: KpiItem[]; loading?: boolean; error?: boolean; label?: string; unit?: string; compact?: boolean }>(), { label: '统计概览', unit: '个', compact: false });
defineEmits<{ retry: [] }>();
</script>

<template>
  <section class="oneos-kpi" :class="{ 'oneos-kpi--compact': compact }" :aria-label="label" :aria-busy="loading">
    <div class="oneos-kpi__strip">
      <div v-for="item in items" :key="item.key" class="oneos-kpi__item" :data-tone="item.tone || 'neutral'" :title="compact ? (loading ? '正在统计…' : error ? '统计暂不可用' : item.description) : undefined">
        <div class="oneos-kpi__heading"><span>{{ item.label }}</span><i aria-hidden="true" /></div>
        <div class="oneos-kpi__value oneos-number"><span>{{ loading || error ? '—' : item.value.toLocaleString('zh-CN') }}</span><small>{{ unit }}</small></div>
        <p>{{ loading ? '正在统计…' : error ? '统计暂不可用' : item.description }}</p>
      </div>
    </div>
    <div v-if="error" class="oneos-kpi__error" role="status">统计暂不可用，客户列表仍可正常使用。<button type="button" @click="$emit('retry')">重试</button></div>
  </section>
</template>
