<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Button, Empty, Input, Select, Spin } from 'ant-design-vue';
import { DownOutlined, RightOutlined, ReloadOutlined, SearchOutlined, LeftOutlined } from '@ant-design/icons-vue';
import { VxeGrid, type VxeGridInstance, type VxeGridProps } from 'vxe-table';
import OneosKpiStrip from '../../src/components/oneos-design/patterns/OneosKpiStrip.vue';
import OneosLedgerCell from '../../src/components/oneos-design/patterns/OneosLedgerCell.vue';
import OneosPage from '../../src/components/oneos-design/patterns/OneosPage.vue';
import NestedLeaseVehicles from './NestedLeaseVehicles.vue';
import NestedLeaseDetail from './NestedLeaseDetail.vue';
import { LEASE_EXAMPLES, LEASE_STATUSES, approvalTone, execution, filterLeases, leaseStatus, newVehicleState,
  type ExampleState, type LeaseExample, type LeaseQuery, type LeaseStatus, type LeaseVehicle, type VehiclePanelState } from './nested-lease-fixtures';
import './nested-lease.css';
import { replacementCounts } from './nested-lease-replacements';

const props = defineProps<{ scenario: ExampleState; vehicleScenario: ExampleState }>();
const emit = defineEmits<{ retry: [] }>();
const grid = ref<VxeGridInstance<LeaseExample>>();
const media = window.matchMedia('(max-width: 767px)');
const mobile = ref(media.matches);
const draft = reactive<LeaseQuery>({ text: '', approval: undefined });
const applied = ref<LeaseQuery>({ ...draft });
const status = ref<LeaseStatus | 'all'>('all');
const current = ref(1);
const pageSize = 5;
const expanded = ref<string[]>([LEASE_EXAMPLES[0]!.id]);
const childStates = reactive<Record<string, VehiclePanelState>>(Object.fromEntries(LEASE_EXAMPLES.map((row) => [row.id, newVehicleState()])));
const detail = ref<{ contract: LeaseExample; vehicle?: LeaseVehicle; tab?: 'info' | 'history' } | null>(null);
let origin: HTMLElement | null = null;
const tableScroll = ref<HTMLElement>();
let savedScroll = 0;
let savedWindowScroll = 0;
let savedMainScroll = 0;
const timers = new Set<ReturnType<typeof setTimeout>>();
let scenarioRevision = 0;
const filterBase = computed(() => props.scenario === 'empty' ? [] : filterLeases(LEASE_EXAMPLES, applied.value));
const filtered = computed(() => filterBase.value.filter((row) => status.value === 'all' || row.status === status.value));
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const shown = computed(() => filtered.value.slice((current.value - 1) * pageSize, current.value * pageSize));
const unavailable = computed(() => props.scenario === 'loading' || props.scenario === 'error');
const counts = computed(() => [
  { key: 'all', label: '全部合同', value: filterBase.value.length, description: '当前查询范围内的合同总数' },
  ...LEASE_STATUSES.map((item) => ({ key: item.value, label: item.label, tone: item.tone, value: filterBase.value.filter((row) => row.status === item.value).length, description: '按合同统计，不按车辆统计' })),
]);
const columns: VxeGridProps<LeaseExample>['columns'] = [
  { type: 'expand', width: 44, slots: { default: 'expandIcon', content: 'vehicles' } },
  { field: 'code', title: '合同 / 项目', minWidth: 238, slots: { default: 'identity' } },
  { field: 'customer', title: '客户 / 负责人', minWidth: 210, slots: { default: 'customer' } },
  { field: 'status', title: '合同 / 审批状态', width: 172, slots: { default: 'status' } },
  { field: 'execution', title: '车辆执行情况', width: 246, slots: { default: 'execution' } },
  { field: 'signingMethod', title: '签署方式 / 进度', width: 148, slots: { default: 'signing' } },
  { field: 'period', title: '租赁开始 / 结束', width: 162, slots: { default: 'period' } },
  { field: 'actions', title: '操作', width: 80, fixed: 'right', slots: { default: 'actions' } },
];
function vehiclesFor(row: LeaseExample): LeaseVehicle[] {
  return childStates[row.id]?.phase === 'empty' ? [] : row.vehicles;
}
function updateChild(row: LeaseExample, state: VehiclePanelState) { childStates[row.id] = state; }
function toggle(row: LeaseExample, open = !expanded.value.includes(row.id)) {
  expanded.value = open ? [...new Set([...expanded.value, row.id])] : expanded.value.filter((id) => id !== row.id);
  void grid.value?.setRowExpand(row, open);
}
function collapseAll() {
  expanded.value = [];
  void grid.value?.clearRowExpand();
}
function restoreExpansions() {
  void nextTick(() => {
    if (!grid.value) return;
    void grid.value.setRowExpand(shown.value.filter((row) => expanded.value.includes(row.id)), true);
  });
}
function query() { applied.value = { ...draft }; current.value = 1; tableScroll.value?.scrollTo({ top: 0 }); }
function reset() { draft.text = ''; draft.approval = undefined; status.value = 'all'; query(); emit('retry'); }
function selectStatus(key: string) { status.value = key as LeaseStatus | 'all'; current.value = 1; tableScroll.value?.scrollTo({ top: 0 }); }
function turnPage(page: number) { current.value = page; tableScroll.value?.scrollTo({ top: 0 }); }
function refresh() { emit('retry'); }
function retryVehicles(row: LeaseExample) {
  childStates[row.id] = { ...childStates[row.id]!, phase: 'loading' };
  const revision = scenarioRevision;
  const timer = setTimeout(() => {
    timers.delete(timer);
    if (revision === scenarioRevision) childStates[row.id] = { ...childStates[row.id]!, phase: 'normal' };
  }, 350);
  timers.add(timer);
}
function openDetail(contract: LeaseExample, vehicle?: LeaseVehicle, tab: 'info' | 'history' = 'info') {
  origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  savedScroll = tableScroll.value?.scrollTop || 0;
  savedWindowScroll = window.scrollY;
  savedMainScroll = document.querySelector('.lab-main > main')?.scrollTop || 0;
  detail.value = { contract: { ...contract, vehicles: vehiclesFor(contract) }, vehicle, tab };
  void nextTick(() => document.querySelector<HTMLButtonElement>('.nl-detail button')?.focus());
}
function openRelated(vehicle: LeaseVehicle) {
  if (detail.value) detail.value = { ...detail.value, vehicle, tab: 'info' };
  void nextTick(() => { document.querySelector('.lab-main > main')?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }); });
}
function showReplacements(contract: LeaseExample) {
  childStates[contract.id] = { ...childStates[contract.id]!, stage: 'all', page: 1, text: '', replacementsOnly: true };
  toggle(contract, true);
}
function changesFor(contract: LeaseExample) { return childStates[contract.id]?.phase === 'empty' ? { total: 0, pending: 0 } : replacementCounts(contract); }
async function back() {
  detail.value = null;
  await nextTick();
  await grid.value?.recalculate();
  tableScroll.value?.scrollTo({ top: savedScroll });
  document.querySelector('.lab-main > main')?.scrollTo({ top: savedMainScroll });
  window.scrollTo({ top: savedWindowScroll });
  origin?.focus({ preventScroll: true });
}
function onMedia(event: MediaQueryListEvent) { mobile.value = event.matches; }
watch([shown, mobile, grid], restoreExpansions);
watch(() => props.vehicleScenario, (phase) => {
  scenarioRevision += 1;
  for (const row of LEASE_EXAMPLES) childStates[row.id] = { ...childStates[row.id]!, phase };
}, { immediate: true });
onMounted(() => { media.addEventListener('change', onMedia); restoreExpansions(); });
onBeforeUnmount(() => { media.removeEventListener('change', onMedia); timers.forEach(clearTimeout); });
</script>

<template>
  <NestedLeaseDetail v-if="detail" :contract="detail.contract" :vehicle="detail.vehicle" :initial-tab="detail.tab" @back="back" @vehicle="openRelated" />
  <OneosPage v-show="!detail" kind="ledger" label="租赁合同主子台账" class="nl-page">
    <template #summary>
      <OneosKpiStrip :items="counts" label="合同状态统计" unit="份" compact selectable :selected-keys="[status]" :disabled="unavailable"
        :loading="scenario === 'loading'" :error="scenario === 'error'" error-text="合同统计暂不可用。" @select="selectStatus" @retry="refresh" />
    </template>
    <div class="nl-ledger">
      <form class="nl-filters" @submit.prevent="query">
        <Input v-model:value="draft.text" allow-clear class="nl-contract-search" aria-label="搜索合同" placeholder="合同编码、项目或客户"><template #prefix><SearchOutlined /></template></Input>
        <Select v-model:value="draft.approval" aria-label="筛选审批状态" class="nl-approval-filter" placeholder="审批状态" allow-clear
          :options="['未提交','待审批','审批中','审批通过'].map((value) => ({value,label:value}))" />
        <div class="nl-query-actions"><Button @click="reset">重置</Button><Button type="primary" html-type="submit">查询</Button></div>
      </form>
      <div class="nl-tools"><div><strong>合同执行情况</strong><span class="nl-tools-hint">展开查看车辆明细</span></div>
        <div class="nl-tool-actions"><Button type="text" :disabled="!expanded.length || unavailable" @click="collapseAll">全部收起</Button><Button class="lab-icon-button" aria-label="刷新合同" @click="refresh"><ReloadOutlined /></Button></div>
      </div>
      <div v-if="scenario === 'loading'" class="nl-parent-message" role="status"><Spin /><strong>正在加载合同</strong></div>
      <div v-else-if="scenario === 'error'" class="nl-parent-message" role="alert"><strong>合同加载失败</strong><span>请重试，已填写的条件会保留。</span><Button aria-label="重试合同" @click="refresh"><ReloadOutlined />重试合同</Button></div>
      <div v-else-if="!filtered.length" class="nl-parent-message"><Empty :image="Empty.PRESENTED_IMAGE_SIMPLE" description="没有符合条件的合同"><Button @click="reset">清空合同筛选</Button></Empty></div>
      <div v-else ref="tableScroll" class="nl-table-scroll">
        <VxeGrid v-if="!mobile" ref="grid" class="nl-parent-table" :columns="columns" :data="shown"
          :row-config="{ keyField: 'id', isHover: true }" :column-config="{ resizable: true }"
          :expand-config="{ trigger: 'manual', showIcon: false, padding: false, mode: 'fixed' }"
          :scroll-x="{ enabled: false }" :scroll-y="{ enabled: false }" border="inner" auto-resize>
          <template #expandIcon="{ row }"><Button type="text" class="nl-expand" :aria-label="`${expanded.includes(row.id) ? '收起' : '展开'} ${row.code} 车辆明细`" :aria-expanded="expanded.includes(row.id)" @click="toggle(row)"><DownOutlined v-if="expanded.includes(row.id)" /><RightOutlined v-else /></Button></template>
          <template #identity="{ row }"><OneosLedgerCell :secondary="row.project"><Button type="link" class="nl-data-link oneos-number" @click="openDetail(row)">{{ row.code }}</Button></OneosLedgerCell></template>
          <template #customer="{ row }"><OneosLedgerCell :primary="row.customer" :secondary="row.owner" /></template>
          <template #status="{ row }"><OneosLedgerCell><span class="nl-status" :data-tone="leaseStatus(row.status).tone"><i />{{ leaseStatus(row.status).label }}</span><template #secondary><span class="nl-status nl-status--secondary" :data-tone="approvalTone(row.approval)">{{ row.approval }}</span><span v-if="row.approver" class="nl-approver"> · {{ row.approver }}</span></template></OneosLedgerCell></template>
          <template #execution="{ row }"><OneosLedgerCell><Button type="link" class="nl-execution-link" :aria-label="`${row.code} 已交 ${execution(vehiclesFor(row)).delivered} / ${execution(vehiclesFor(row)).total} 辆 · 在用 ${execution(vehiclesFor(row)).renting}`" @click="toggle(row, true)">已交 <b class="oneos-number">{{ execution(vehiclesFor(row)).delivered }}</b><span class="nl-of"> / {{ execution(vehiclesFor(row)).total }} 辆 · 在用 {{ execution(vehiclesFor(row)).renting }}</span></Button><template #secondary><span>已还 {{ execution(vehiclesFor(row)).returned }}</span><template v-if="changesFor(row).total"><span class="nl-middle-dot">·</span><Button type="link" class="nl-summary-changes" :aria-label="`${row.code} 换车 ${changesFor(row).total} 笔，换车记录 ${changesFor(row).total} 笔`" @click="showReplacements(row)">换车 {{ changesFor(row).total }} 笔</Button><span v-if="changesFor(row).pending" class="nl-warning-text"> · 待办 {{ changesFor(row).pending }}</span></template></template></OneosLedgerCell></template>
          <template #signing="{ row }"><OneosLedgerCell :primary="row.signingMethod" :secondary="row.signingStatus" /></template>
          <template #period="{ row }"><OneosLedgerCell :primary="row.start" :secondary="row.end" primary-number secondary-number /></template>
          <template #actions="{ row }"><Button type="text" class="nl-row-action" @click="openDetail(row)">查看</Button></template>
          <template #vehicles="{ row }"><NestedLeaseVehicles :contract="row" :state="childStates[row.id]!" :mobile="false" @update="updateChild(row, $event)" @retry="retryVehicles(row)" @view="openDetail(row, $event)" @history="openDetail(row, $event, 'history')" @collapse="toggle(row, false)" /></template>
        </VxeGrid>
        <div v-else class="nl-contract-cards">
          <article v-for="row in shown" :key="row.id" class="nl-contract-card" :class="{ 'is-expanded': expanded.includes(row.id) }" :data-contract-card="row.id">
            <div class="nl-contract-card__body"><header><Button type="link" class="nl-data-link oneos-number" @click="openDetail(row)">{{ row.code }}</Button><span class="nl-status" :data-tone="leaseStatus(row.status).tone"><i />{{ leaseStatus(row.status).label }}</span></header>
              <h3>{{ row.project }}</h3><p class="nl-customer-name">{{ row.customer }}</p>
              <dl><div><dt>审批状态</dt><dd :class="row.approval === '审批中' ? 'nl-warning-text' : ''">{{ row.approval }}{{ row.approver ? ` · ${row.approver}` : '' }}</dd></div>
                <div><dt>业务负责人</dt><dd>{{ row.owner }}</dd></div><div><dt>签署情况</dt><dd>{{ row.signingMethod }} · {{ row.signingStatus }}</dd></div>
                <div><dt>租赁期间</dt><dd class="oneos-number">{{ row.start }}<br />{{ row.end }}</dd></div></dl>
              <div class="nl-mobile-execution"><span>已交 <b class="oneos-number">{{ execution(vehiclesFor(row)).delivered }} / {{ execution(vehiclesFor(row)).total }}</b> 辆</span><span>在用 {{ execution(vehiclesFor(row)).renting }} · 已还 {{ execution(vehiclesFor(row)).returned }}</span></div>
              <div v-if="changesFor(row).total" class="nl-mobile-changes"><Button type="link" :aria-label="`${row.code} 换车 ${changesFor(row).total} 笔，换车记录 ${changesFor(row).total} 笔`" @click="showReplacements(row)">换车记录 {{ changesFor(row).total }} 笔</Button><span v-if="changesFor(row).pending" class="nl-warning-text">待办 {{ changesFor(row).pending }}</span></div>
              <div class="nl-card-actions"><Button type="text" @click="openDetail(row)">查看合同</Button><Button type="text" :aria-expanded="expanded.includes(row.id)" @click="toggle(row)">{{ expanded.includes(row.id) ? '收起车辆' : '展开车辆' }}<span class="oneos-number">{{ vehiclesFor(row).length }}</span><DownOutlined v-if="expanded.includes(row.id)" /><RightOutlined v-else /></Button></div>
            </div>
            <NestedLeaseVehicles v-if="expanded.includes(row.id)" :contract="row" :state="childStates[row.id]!" :mobile="true" @update="updateChild(row, $event)" @retry="retryVehicles(row)" @view="openDetail(row, $event)" @history="openDetail(row, $event, 'history')" @collapse="toggle(row, false)" />
          </article>
        </div>
      </div>
      <footer class="nl-pagination"><span>共 <b class="oneos-number">{{ unavailable ? '—' : filtered.length }}</b> 份合同</span>
        <div v-if="!unavailable && filtered.length" class="nl-page-controls"><span v-if="!mobile" class="oneos-secondary">每页 {{ pageSize }} 份</span><Button :disabled="current === 1" aria-label="上一页合同" @click="turnPage(current - 1)"><LeftOutlined /></Button><span class="oneos-number">{{ current }} / {{ pages }}</span><Button :disabled="current === pages" aria-label="下一页合同" @click="turnPage(current + 1)"><RightOutlined /></Button></div>
      </footer>
    </div>
  </OneosPage>
</template>
