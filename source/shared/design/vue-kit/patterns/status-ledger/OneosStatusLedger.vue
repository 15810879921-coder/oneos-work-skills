<script setup lang="ts">
import { computed } from 'vue';
import { Button, Tooltip } from 'ant-design-vue';
import { DownOutlined, UpOutlined, SlidersOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue';

export interface LedgerTab { key: string; label: string; count?: number | string; disabled?: boolean; title?: string }
const props = withDefaults(defineProps<{
  id: string;
  variant?: 'status' | 'standard';
  expanded?: boolean;
  filterCount?: number;
  tabs?: LedgerTab[];
  activeKey?: string;
  tabsLabel?: string;
  querying?: boolean;
  queryDisabled?: boolean;
}>(), { variant: 'status', expanded: false, filterCount: 0, tabs: () => [], activeKey: '', tabsLabel: '记录状态', querying: false, queryDisabled: false });
const emit = defineEmits<{
  'update:expanded': [value: boolean];
  'update:activeKey': [value: string];
  query: [];
  reset: [];
}>();
const panelId = computed(() => `${props.id}-records`);
function tabKeydown(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const enabled = props.tabs.map((tab, i) => ({ tab, i })).filter(({ tab }) => !tab.disabled);
  if (!enabled.length) return;
  const current = enabled.findIndex(item => item.i === index);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
  const item = enabled[next]!;
  emit('update:activeKey', item.tab.key);
  (event.currentTarget as HTMLElement).closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[item.i]?.focus();
}
</script>

<template>
  <section class="oneos-status-ledger" :class="{ 'oneos-standard-ledger': variant === 'standard' }" :data-oneos-pattern="variant === 'standard' ? 'standard-ledger@1.0.0' : 'status-ledger@1.0.2'" :data-ledger-id="id">
    <form class="osl-query" role="search" aria-label="查询条件" @submit.prevent="emit('query')">
      <div class="osl-query-row" data-pattern-region="query">
        <div class="osl-primary"><slot name="primary" /></div>
        <div class="osl-query-actions">
          <Button v-if="$slots.advanced" type="link" class="osl-more" :aria-expanded="expanded" :aria-controls="`${id}-advanced`" @click="emit('update:expanded', !expanded)">
            <SlidersOutlined /><span>{{ expanded ? '收起' : '更多筛选' }}</span><span v-if="filterCount" class="osl-filter-count">{{ filterCount }}</span><UpOutlined v-if="expanded" /><DownOutlined v-else />
          </Button>
          <Button :disabled="queryDisabled" @click="emit('reset')"><template #icon><ReloadOutlined /></template>重置</Button>
          <Button type="primary" html-type="submit" :loading="querying" :disabled="queryDisabled"><template #icon><SearchOutlined /></template>查询</Button>
          <template v-if="variant === 'standard' && $slots.actions"><span class="osl-action-divider" aria-hidden="true" /><slot name="actions" /></template>
        </div>
      </div>
      <div v-if="$slots.advanced" v-show="expanded" :id="`${id}-advanced`" class="osl-advanced" data-pattern-region="advanced"><slot name="advanced" /></div>
      <div v-if="$slots.queryNotice" class="osl-query-notice"><slot name="queryNotice" /></div>
    </form>
    <div v-if="variant !== 'standard' || tabs.length || $slots.title" class="osl-toolbar" data-pattern-region="toolbar">
      <div v-if="tabs.length" class="osl-tabs" role="tablist" :aria-label="tabsLabel">
        <Tooltip v-for="(tab, index) in tabs" :key="tab.key" :title="tab.title" :trigger="['hover','focus']">
          <button :id="`${id}-tab-${index}`" type="button" role="tab" :aria-selected="activeKey === tab.key" :aria-controls="panelId" :tabindex="activeKey === tab.key ? 0 : -1" :disabled="tab.disabled" @click="emit('update:activeKey', tab.key)" @keydown="tabKeydown($event, index)">
            <span>{{ tab.label }}</span><span v-if="tab.count !== undefined" class="osl-tab-count">{{ tab.count }}</span>
          </button>
        </Tooltip>
      </div>
      <div v-else class="osl-title"><slot name="title" /></div>
      <div v-if="variant !== 'standard'" class="osl-actions"><slot name="actions" /></div>
    </div>
    <div v-if="$slots.secondary" class="osl-secondary"><slot name="secondary" /></div>
    <div :id="panelId" class="osl-records" :role="tabs.length ? 'tabpanel' : undefined" :aria-labelledby="tabs.length ? `${id}-tab-${tabs.findIndex(tab => tab.key === activeKey)}` : undefined" data-pattern-region="records"><slot /></div>
    <div v-if="$slots.footer" class="osl-footer" data-pattern-region="footer"><slot name="footer" /></div>
  </section>
</template>

<style src="./status-ledger.css"></style>
