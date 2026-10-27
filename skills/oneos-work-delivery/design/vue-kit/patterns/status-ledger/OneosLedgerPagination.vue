<script setup lang="ts">
import { Pagination } from 'ant-design-vue';

function buildOptionText({ value }: { value: number | string }) {
  return `${value} 条/页`;
}

function formatTotal(total: number) {
  return `共 ${total} 条`;
}

const props = withDefaults(
  defineProps<{
    current: number;
    pageSize: number;
    total: number;
    pageSizeOptions?: number[];
    disabled?: boolean;
  }>(),
  { pageSizeOptions: () => [10, 20, 30, 50, 100], disabled: false },
);

const emit = defineEmits<{
  change: [page: number, pageSize: number];
}>();

function handleChange(page: number, pageSize: number) {
  emit('change', page, pageSize);
}
</script>

<template>
  <Pagination
    class="app-pagination oneos-ledger-pagination"
    :build-option-text="buildOptionText"
    :current="props.current"
    :disabled="props.disabled"
    :locale="{ items_per_page: '' }"
    :page-size="props.pageSize"
    :page-size-options="props.pageSizeOptions"
    :show-size-changer="true"
    :show-total="formatTotal"
    :total="props.total"
    @change="handleChange"
  />
</template>

<style scoped>
.oneos-ledger-pagination :deep(.ant-pagination-item-active),
.oneos-ledger-pagination :deep(.ant-pagination-item-active:hover) {
  border-color: var(--oneos-primary-ink, #1677ff) !important;
  background: var(--oneos-fill, #f0f5ff) !important;
}

.oneos-ledger-pagination :deep(.ant-pagination-item-active a),
.oneos-ledger-pagination :deep(.ant-pagination-item-active:hover a) {
  color: var(--oneos-primary-ink, #1677ff) !important;
  font-weight: 700 !important;
}

.oneos-ledger-pagination :deep(.ant-pagination-total-text) {
  color: var(--oneos-body, #475467) !important;
}
</style>
