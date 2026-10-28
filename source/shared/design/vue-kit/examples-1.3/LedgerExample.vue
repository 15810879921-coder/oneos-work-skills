<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Button, Empty, Input, Pagination, Select, Space, Spin } from 'ant-design-vue';
import {
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { VxeGrid, type VxeGridProps } from 'vxe-table';
import { OneosPage, OneosToolbar } from '../../src/components/oneos-design/patterns';
import {
  CANON_BILLS,
  REGION_OPTIONS,
  OWNER_OPTIONS,
  STATUS_LABEL,
  money,
  type CanonBill,
  type BillStatus,
} from './fixtures';

const props = withDefaults(defineProps<{ scenario: 'normal' | 'empty' | 'error' | 'loading'; review?: boolean }>(), { review: false });
const emit = defineEmits<{ view: [CanonBill]; edit: [CanonBill]; create: []; retry: [] }>();
const draft = reactive({
  text: '',
  region: undefined as string | undefined,
  owner: undefined as string | undefined,
});
const applied = ref({ ...draft });
const status = ref<BillStatus | 'all'>('all');
const current = ref(1);
const pageSize = 8;
const filtered = computed(() =>
  CANON_BILLS.filter((row) => {
    const q = applied.value;
    return (
      (!q.text || [row.code, row.title, row.customer, row.plate].some((v) => v.includes(q.text))) &&
      (!q.region || row.region === q.region) &&
      (!q.owner || row.owner === q.owner)
    );
  }),
);
const activeRows = computed(() =>
  props.scenario === 'empty'
    ? []
    : filtered.value.filter((row) => status.value === 'all' || row.status === status.value),
);
const shown = computed(() =>
  activeRows.value.slice((current.value - 1) * pageSize, current.value * pageSize),
);
const counts = computed(() => [
  {
    label: '全部单据',
    value: filtered.value.length,
    suffix: '单',
    detail: '当前筛选范围',
    state: 'all',
  },
  {
    label: '待处理',
    value: filtered.value.filter((r) => r.status === 'pending').length,
    suffix: '单',
    detail: '等待开始办理',
    state: 'pending',
  },
  {
    label: '处理中',
    value: filtered.value.filter((r) => r.status === 'doing').length,
    suffix: '单',
    detail: '正在推进事项',
    state: 'doing',
  },
  {
    label: '已办结',
    value: filtered.value.filter((r) => r.status === 'done').length,
    suffix: '单',
    detail: '已完成的事项',
    state: 'done',
  },
]);
const columns: VxeGridProps<CanonBill>['columns'] = [
  { field: 'code', title: '单据 / 事项', width: 236, slots: { default: 'identity' } },
  { field: 'customer', title: '客户 / 车牌', width: 192, slots: { default: 'customer' } },
  { field: 'region', title: '区域 / 服务站点', width: 146, slots: { default: 'region' } },
  { field: 'status', title: '状态 / 负责人', width: 136, slots: { default: 'status' } },
  {
    field: 'amount',
    title: '金额 / 结算方式',
    width: 156,
    align: 'right',
    slots: { default: 'amount' },
  },
  { field: 'contact', title: '联系人 / 电话', width: 156, slots: { default: 'contact' } },
  { field: 'planDay', title: '计划完成 / 更新', width: 158, slots: { default: 'date' } },
  { field: 'actions', title: '操作', width: 126, fixed: 'right', slots: { default: 'actions' } },
];
function query() {
  applied.value = { ...draft };
  current.value = 1;
}
function reset() {
  draft.text = '';
  draft.region = undefined;
  draft.owner = undefined;
  status.value = 'all';
  query();
  emit('retry');
}
function selectStatus(next: string) {
  status.value = next as typeof status.value;
  current.value = 1;
}
function displayCount(value: number) {
  if (!props.review) return value;
  if (props.scenario === 'empty') return 0;
  if (props.scenario === 'error' || props.scenario === 'loading') return '—';
  return value;
}
</script>

<template>
  <OneosPage kind="ledger" label="单据台账" :class="{ 'lab-ledger-review': review }">
    <template v-if="!review" #header
      ><div class="lab-page-title">
        <h1>单据台账</h1>
        <span class="oneos-secondary">查询与办理</span>
      </div>
      <Button type="primary" @click="emit('create')"><PlusOutlined />新增单据</Button></template
    >
    <template #summary
      ><div class="lab-metrics" :aria-busy="scenario === 'loading'">
        <button
          v-for="item in counts"
          :key="item.label"
          type="button"
          :aria-pressed="status === item.state"
          :title="review ? item.detail : undefined"
          @click="selectStatus(item.state)"
        >
          <div class="lab-metric-label">{{ item.label }}</div>
          <div class="lab-metric-value oneos-number">
            {{ displayCount(item.value) }}<small>{{ item.suffix }}</small>
          </div>
          <span class="lab-metric-description">{{ item.detail }}</span>
        </button>
      </div></template
    >
    <div class="lab-ledger-card">
      <OneosToolbar label="筛选单据"
        ><Input
          v-model:value="draft.text"
          aria-label="搜索单据"
          placeholder="单号、事项、客户或车牌"
          allow-clear
          class="lab-search"
          @press-enter="query"
          ><template #prefix><SearchOutlined /></template></Input
        ><Select
          v-model:value="draft.region"
          aria-label="区域"
          placeholder="全部区域"
          allow-clear
          :options="REGION_OPTIONS"
          class="lab-filter"
        /><Select
          v-model:value="draft.owner"
          aria-label="负责人"
          placeholder="全部负责人"
          allow-clear
          show-search
          option-filter-prop="label"
          :options="OWNER_OPTIONS"
          class="lab-filter"
        /><template #actions>
          <div class="lab-query-actions" role="group" aria-label="执行查询">
            <Button @click="reset">重置</Button>
            <Button type="primary" @click="query">查询</Button>
          </div>
        </template
        ></OneosToolbar
      >
      <div v-if="review" class="lab-ledger-actions" role="group" aria-label="单据操作">
        <Button aria-label="刷新单据" title="刷新单据" class="lab-icon-button" @click="query"><ReloadOutlined /></Button>
        <Button type="primary" @click="emit('create')"><PlusOutlined />新增单据</Button>
      </div>
      <div v-if="!review" class="lab-ledger-toolbar">
        <div class="lab-status-tabs" aria-label="单据状态">
          <button
            v-for="item in counts"
            :key="item.state"
            type="button"
            :class="{ 'is-active': status === item.state }"
            :aria-pressed="status === item.state"
            @click="selectStatus(item.state)"
          >
            {{ item.state === 'all' ? '全部' : item.label
            }}<span class="oneos-number">{{ item.value }}</span>
          </button>
        </div>
        <Button aria-label="刷新单据" class="lab-icon-button" @click="query"
          ><ReloadOutlined
        /></Button>
      </div>
      <div v-if="scenario === 'error'" class="lab-table-message" role="alert">
        <ExclamationCircleOutlined class="lab-error-icon" />
        <h3>单据加载失败</h3>
        <p>数据暂时无法显示，请重试。</p>
        <Button aria-label="重新加载" @click="emit('retry')"><ReloadOutlined />重新加载</Button>
      </div>
      <div v-else-if="scenario === 'loading'" class="lab-table-message" role="status">
        <Spin size="large" />
        <h3>正在加载单据</h3>
        <p>请稍候</p>
      </div>
      <div v-else-if="activeRows.length === 0" class="lab-table-message">
        <Empty :image="Empty.PRESENTED_IMAGE_SIMPLE" description="没有符合条件的单据"
          ><Button @click="reset">清空筛选</Button></Empty
        >
      </div>
      <div v-else class="lab-grid-wrap">
      <VxeGrid
        :key="review ? 'compact-review' : 'original'"
        :columns="columns"
        :data="shown"
        :row-config="{ keyField: 'id', isHover: true }"
        :column-config="{ resizable: true }"
        :height="review ? 'auto' : 560"
        :border="false"
        :show-overflow="false"
        :show-header-overflow="false"
      >
        <template #identity="{ row }"
          ><span v-if="review" class="lab-code-text oneos-number">{{ row.code }}</span><Button v-else type="link" class="lab-code oneos-number" @click="emit('view', row)">{{
            row.code
          }}</Button>
          <div class="lab-cell-secondary">{{ row.title }}</div></template
        >
        <template #customer="{ row }"
          ><div class="lab-cell-primary">{{ row.customer }}</div>
          <div class="lab-cell-secondary oneos-number">{{ row.plate }}</div></template
        >
        <template #region="{ row }"
          ><div>{{ row.region }}</div>
          <div class="lab-cell-secondary">{{ row.site }}</div></template
        >
        <template #status="{ row }"
          ><span :class="['lab-status', `is-${row.status}`]"
            ><i />{{ STATUS_LABEL[row.status as BillStatus] }}</span
          >
          <div class="lab-cell-secondary">{{ row.owner }}</div></template
        >
        <template #amount="{ row }"
          ><div class="lab-cell-primary oneos-number">¥{{ money(row.amount) }}</div>
          <div class="lab-cell-secondary">{{ row.settle }}</div></template
        >
        <template #contact="{ row }"
          ><div>{{ row.contact }}</div>
          <div class="lab-cell-secondary oneos-number">{{ row.phone }}</div></template
        >
        <template #date="{ row }"
          ><div class="oneos-number">{{ row.planDay }}</div>
          <div class="lab-cell-secondary oneos-number">{{ row.updatedAt }}</div></template
        >
        <template #actions="{ row }"
          ><Space :size="2"
            ><Button type="link" class="lab-row-action" @click="emit('view', row)">查看</Button
            ><Button type="link" class="lab-row-action" @click="emit('edit', row)"
              >编辑</Button
            ></Space
          ></template
        >
      </VxeGrid>
      </div>
      <div class="lab-pagination">
        <span class="oneos-secondary"
          >共 <b class="oneos-number">{{ review && (scenario === 'error' || scenario === 'loading') ? '—' : activeRows.length }}</b> 条单据</span
        ><Pagination
          v-model:current="current"
          :total="activeRows.length"
          :page-size="pageSize"
          :show-size-changer="false"
          :show-less-items="true"
          :disabled="review && (scenario === 'error' || scenario === 'loading')"
        />
      </div>
    </div>
  </OneosPage>
</template>
