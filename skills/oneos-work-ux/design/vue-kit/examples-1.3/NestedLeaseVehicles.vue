<script setup lang="ts">
import { computed } from 'vue';
import { Button, Empty, Input, Spin } from 'ant-design-vue';
import { LeftOutlined, RightOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { VxeGrid, type VxeGridProps } from 'vxe-table';
import OneosLedgerCell from '../../src/components/oneos-design/patterns/OneosLedgerCell.vue';
import { approvalTone, display, filterVehicles, minuteTime, type LeaseExample, type LeaseVehicle, type VehiclePanelState } from './nested-lease-fixtures';
import { vehicleReplacements } from './nested-lease-replacements';
import NestedLeaseVehicleIdentity from './NestedLeaseVehicleIdentity.vue';

const props = defineProps<{ contract: LeaseExample; state: VehiclePanelState; mobile: boolean }>();
const emit = defineEmits<{ update: [VehiclePanelState]; retry: []; view: [LeaseVehicle]; history: [LeaseVehicle]; collapse: [] }>();
const pageSize = 4;
const filtered = computed(() => props.state.phase === 'empty' ? [] : filterVehicles(props.contract.vehicles, props.state)
  .filter((vehicle) => !props.state.replacementsOnly || vehicleReplacements(props.contract, vehicle).length > 0));
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const page = computed(() => Math.min(props.state.page, pages.value));
const shown = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const stageOptions = computed(() => [
  { value: 'current', label: '当前履约' }, { value: 'waiting', label: '待交车' },
  { value: 'history', label: '历史车辆' }, { value: 'all', label: '全部车辆' },
].map((item) => ({ ...item, count: item.value === 'all' ? props.contract.vehicles.length : props.contract.vehicles.filter((vehicle) => vehicle.fulfillment === item.value).length })));
const emptyText = computed(() => !props.contract.vehicles.length || props.state.phase === 'empty' ? '该合同暂无车辆明细'
  : props.state.text || props.state.replacementsOnly ? '没有符合条件的车辆'
  : props.state.stage === 'current' ? '暂无当前履约车辆' : props.state.stage === 'waiting' ? '暂无待交车辆' : '暂无历史车辆');
const columns: VxeGridProps<LeaseVehicle>['columns'] = [
  { field: 'plate', title: '车辆 / 履约情况', minWidth: 300, slots: { default: 'identity' } },
  { field: 'pickupApprovalStatus', title: '提车应收', minWidth: 118, slots: { default: 'pickup' } },
  { field: 'deliveryDate', title: '交车 / 交车时间', minWidth: 174, slots: { default: 'delivery' } },
  { field: 'bill', title: '账单', minWidth: 110, slots: { default: 'bill' } },
  { field: 'returnedDate', title: '还车 / 还车时间', minWidth: 174, slots: { default: 'returned' } },
  { field: 'settlement', title: '还车结算', minWidth: 118, slots: { default: 'settlement' } },
  { field: 'actions', title: '操作', width: 152, fixed: 'right', slots: { default: 'actions' } },
];
function update(patch: Partial<VehiclePanelState>) { emit('update', { ...props.state, ...patch }); }
function clear() { update({ text: '', stage: 'current', page: 1, replacementsOnly: false }); }
</script>

<template>
  <section class="nl-vehicles" :data-contract="contract.id" :aria-label="`${contract.code} 车辆明细`" :aria-busy="state.phase === 'loading'">
    <header class="nl-vehicles__heading">
      <div class="nl-vehicles__title"><h3>合同车辆</h3><span class="oneos-number">{{ contract.code }}</span><span class="nl-scope">仅此合同</span></div>
      <Button class="nl-collapse" type="text" @click="emit('collapse')">收起明细</Button>
    </header>
    <div class="nl-vehicles__filters">
      <div class="nl-stage-filters" role="group" :aria-label="`${contract.code} 车辆状态筛选`">
        <Button v-for="item in stageOptions" :key="item.value" type="text" :class="{ 'is-active': state.stage === item.value }"
          :aria-pressed="state.stage === item.value" :disabled="state.phase === 'loading' || state.phase === 'error'"
          @click="update({ stage: item.value as VehiclePanelState['stage'], page: 1 })">
          {{ item.label }}<span class="oneos-number">{{ state.phase === 'loading' || state.phase === 'error' ? '—' : state.phase === 'empty' ? 0 : item.count }}</span>
        </Button>
      </div>
      <Input :value="state.text" class="nl-vehicle-search" allow-clear placeholder="车牌或 VIN" :aria-label="`${contract.code} 搜索车辆`"
        :disabled="state.phase === 'loading' || state.phase === 'error'" @update:value="update({ text: $event, page: 1 })">
        <template #prefix><SearchOutlined /></template>
      </Input>
    </div>
    <div v-if="state.replacementsOnly" class="nl-replacement-filter"><span>有换车记录的车辆</span><Button type="text" @click="update({ replacementsOnly: false, page: 1 })">清除条件</Button></div>
    <div v-if="state.phase === 'loading'" class="nl-child-message" role="status"><Spin /><strong>正在加载这份合同的车辆</strong></div>
    <div v-else-if="state.phase === 'error'" class="nl-child-message" role="alert">
      <strong>车辆明细加载失败</strong><span>合同信息仍可查看，请重试。</span><Button aria-label="重试车辆明细" @click="emit('retry')"><ReloadOutlined />重试车辆明细</Button>
    </div>
    <div v-else-if="!filtered.length" class="nl-child-message">
      <Empty :image="Empty.PRESENTED_IMAGE_SIMPLE" :description="emptyText">
        <Button v-if="state.text || state.replacementsOnly" @click="clear">清空车辆筛选</Button>
        <Button v-else-if="contract.vehicles.length && state.phase !== 'empty'" @click="update({ stage: 'all', page: 1 })">查看全部车辆</Button>
      </Empty>
    </div>
    <VxeGrid v-else-if="!mobile" class="nl-child-table" :columns="columns" :data="shown" :row-config="{ keyField: 'id', isHover: true }"
      :column-config="{ resizable: true }" :scroll-x="{ enabled: false }" :scroll-y="{ enabled: false }" border="inner" auto-resize>
      <template #identity="{ row }"><NestedLeaseVehicleIdentity :contract="contract" :vehicle="row" @view="emit('view', $event)" /></template>
      <template #pickup="{ row }"><OneosLedgerCell :secondary="display(row.pickupApprovalDate)" secondary-number>
        <span class="nl-status" :data-tone="approvalTone(row.pickupApprovalStatus)"><i />{{ display(row.pickupApprovalStatus) }}</span>
      </OneosLedgerCell></template>
      <template #delivery="{ row }"><OneosLedgerCell :secondary="minuteTime(row.deliveryDate)" secondary-number>
        <span class="nl-status" :data-tone="row.stage === 'waiting' ? 'neutral' : 'success'"><i />{{ row.stage === 'waiting' ? '待交车' : '已交车' }}</span>
      </OneosLedgerCell></template>
      <template #bill="{ row }"><OneosLedgerCell>
        <span :class="{ 'nl-error-text': row.bill === '逾期' }">{{ row.bill }}</span>
      </OneosLedgerCell></template>
      <template #returned="{ row }"><OneosLedgerCell :secondary="minuteTime(row.returnedDate)" secondary-number>
        <span class="nl-status" :data-tone="row.stage === 'returned' ? 'success' : 'neutral'"><i />{{ row.stage === 'returned' ? '已还车' : '未还车' }}</span>
      </OneosLedgerCell></template>
      <template #settlement="{ row }"><OneosLedgerCell>
        <span :class="{ 'nl-warning-text': row.settlement === '待结算' }">{{ row.settlement }}</span>
      </OneosLedgerCell></template>
      <template #actions="{ row }"><div class="nl-vehicle-actions"><Button type="text" class="nl-row-action" @click="emit('view', row)">查看</Button>
        <Button v-if="vehicleReplacements(contract, row).length" type="text" class="nl-row-action" :aria-label="`${row.plate} 换车记录 ${vehicleReplacements(contract, row).length}`" @click="emit('history', row)">换车记录 <span class="oneos-number">{{ vehicleReplacements(contract, row).length }}</span></Button></div></template>
    </VxeGrid>
    <div v-else class="nl-vehicle-cards">
      <article v-for="vehicle in shown" :key="vehicle.id" class="nl-vehicle-card">
        <header><NestedLeaseVehicleIdentity :contract="contract" :vehicle="vehicle" @view="emit('view', $event)" /></header>
        <dl class="nl-vehicle-flow">
          <div><dt>提车应收</dt><dd><span class="nl-status" :data-tone="approvalTone(vehicle.pickupApprovalStatus)"><i />{{ display(vehicle.pickupApprovalStatus) }}</span><time class="oneos-number nl-card-time">{{ display(vehicle.pickupApprovalDate) }}</time></dd></div>
          <div><dt>交车 / 交车时间</dt><dd>{{ vehicle.stage === 'waiting' ? '待交车' : '已交车' }}<time class="oneos-number nl-card-time">{{ minuteTime(vehicle.deliveryDate) }}</time></dd></div>
          <div><dt>账单</dt><dd :class="{ 'nl-error-text': vehicle.bill === '逾期' }">{{ vehicle.bill }}</dd></div>
          <div><dt>还车 / 还车时间</dt><dd>{{ vehicle.stage === 'returned' ? '已还车' : '未还车' }}<time class="oneos-number nl-card-time">{{ minuteTime(vehicle.returnedDate) }}</time></dd></div>
          <div><dt>还车结算</dt><dd :class="{ 'nl-warning-text': vehicle.settlement === '待结算' }">{{ vehicle.settlement }}</dd></div>
        </dl>
        <div class="nl-mobile-vehicle-actions"><Button type="text" class="nl-card-view" @click="emit('view', vehicle)">查看车辆详情<RightOutlined /></Button>
          <Button v-if="vehicleReplacements(contract, vehicle).length" type="text" :aria-label="`${vehicle.plate} 换车记录 ${vehicleReplacements(contract, vehicle).length}`" @click="emit('history', vehicle)">换车记录 <span class="oneos-number">{{ vehicleReplacements(contract, vehicle).length }}</span></Button></div>
      </article>
    </div>
    <footer v-if="state.phase === 'normal' && filtered.length" class="nl-child-pagination">
      <span>本合同 <b class="oneos-number">{{ filtered.length }}</b> 辆<span> · {{ stageOptions.find((item) => item.value === state.stage)?.label }}</span><span v-if="state.text || state.replacementsOnly"> · 符合条件</span><span v-if="filtered.length > pageSize"> · 每页 {{ pageSize }} 辆</span></span>
      <div v-if="pages > 1" class="nl-page-controls"><Button type="text" :disabled="page === 1" :aria-label="`${contract.code} 上一页车辆`" @click="update({ page: page - 1 })"><LeftOutlined /></Button>
        <span class="oneos-number">{{ page }} / {{ pages }}</span><Button type="text" :disabled="page === pages" :aria-label="`${contract.code} 下一页车辆`" @click="update({ page: page + 1 })"><RightOutlined /></Button></div>
    </footer>
  </section>
</template>
