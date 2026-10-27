<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button } from 'ant-design-vue';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';
import OneosPage from '../../src/components/oneos-design/patterns/OneosPage.vue';
import OneosSection from '../../src/components/oneos-design/patterns/OneosSection.vue';
import OneosDescriptions, { type DescriptionItem } from '../../src/components/oneos-design/patterns/OneosDescriptions.vue';
import { approvalTone, execution, leaseStatus, fulfillmentState, mileage, minuteTime, type LeaseExample, type LeaseVehicle } from './nested-lease-fixtures';
import { vehicleReplacements } from './nested-lease-replacements';
import NestedLeaseHistory from './NestedLeaseHistory.vue';
const props = defineProps<{ contract: LeaseExample; vehicle?: LeaseVehicle; initialTab?: 'info' | 'history' }>();
defineEmits<{ back: []; vehicle: [LeaseVehicle] }>();
const activeTab = ref<'info' | 'history'>(props.initialTab || 'info');
watch([() => props.vehicle?.id, () => props.initialTab], () => { activeTab.value = props.initialTab || 'info'; });
const identity = computed<DescriptionItem[]>(() => props.vehicle ? [
  { key: 'plate', label: '车牌', value: props.vehicle.plate, mono: true },
  { key: 'vin', label: 'VIN', value: props.vehicle.vin, mono: true },
  { key: 'model', label: '车型', value: props.vehicle.model },
  { key: 'contract', label: '所属合同', value: props.contract.code, mono: true },
  { key: 'project', label: '项目名称', value: props.contract.project },
  { key: 'customer', label: '客户', value: props.contract.customer },
] : [
  { key: 'code', label: '合同编码', value: props.contract.code, mono: true },
  { key: 'project', label: '项目名称', value: props.contract.project },
  { key: 'customer', label: '客户', value: props.contract.customer },
  { key: 'company', label: '签约公司', value: props.contract.company },
  { key: 'owner', label: '业务负责人', value: props.contract.owner },
  { key: 'period', label: '租赁期间', value: `${props.contract.start} 至 ${props.contract.end}`, mono: true },
  { key: 'approval', label: '审批状态', value: props.contract.approval },
  { key: 'approver', label: '当前审批人', value: props.contract.approver },
  { key: 'signing', label: '签署情况', value: `${props.contract.signingMethod} · ${props.contract.signingStatus}` },
]);
const progress = computed<DescriptionItem[]>(() => {
  if (props.vehicle) return [
    { key: 'pickupApproval', label: '提车应收审批状态', value: props.vehicle.pickupApprovalStatus },
    { key: 'pickupApprovalDate', label: '提车应收审批日期', value: props.vehicle.pickupApprovalDate, mono: true },
    { key: 'plan', label: '交车安排', value: props.vehicle.deliveryPlan },
    { key: 'delivered', label: '交车时间', value: minuteTime(props.vehicle.deliveryDate), mono: true },
    { key: 'deliverer', label: '交车经办人', value: props.vehicle.deliveryPerson },
    { key: 'bill', label: '租赁账单', value: props.vehicle.bill },
    { key: 'returned', label: '还车时间', value: minuteTime(props.vehicle.returnedDate), mono: true },
    { key: 'returner', label: '还车经办人', value: props.vehicle.returnPerson },
    { key: 'settlement', label: '还车结算', value: props.vehicle.settlement },
  ];
  const counts = execution(props.contract.vehicles);
  return [
    { key: 'total', label: '合同车辆', value: `${counts.total} 辆`, mono: true },
    { key: 'delivered', label: '累计已交车', value: `${counts.delivered} 辆`, mono: true },
    { key: 'waiting', label: '待交车', value: `${counts.total - counts.delivered} 辆`, mono: true },
    { key: 'renting', label: '租赁中', value: `${counts.renting} 辆`, mono: true },
    { key: 'returned', label: '已还车', value: `${counts.returned} 辆`, mono: true },
  ];
});
</script>
<template>
  <OneosPage kind="detail" :label="vehicle ? '合同车辆详情' : '合同详情'" class="nl-detail" :class="{ 'nl-detail--business': !vehicle }">
    <template #header><div class="lab-form-title"><Button aria-label="返回主子台账" class="lab-icon-button" @click="$emit('back')"><ArrowLeftOutlined /></Button><span class="lab-title-divider" /><h1>{{ vehicle ? '合同车辆详情' : '合同详情' }}</h1></div></template>
    <template #summary>
    <div class="nl-detail-status"><span class="nl-status nl-detail-tag" :data-tone="vehicle ? fulfillmentState(vehicle).tone : leaseStatus(contract.status).tone"><i />{{ vehicle ? fulfillmentState(vehicle).label : leaseStatus(contract.status).label }}</span></div>
    <div v-if="vehicle" class="nl-detail-tabs" role="group" aria-label="车辆详情内容"><Button type="text" :class="{ 'is-active': activeTab === 'info' }" :aria-pressed="activeTab === 'info'" @click="activeTab = 'info'">执行信息</Button><Button type="text" :class="{ 'is-active': activeTab === 'history' }" :aria-pressed="activeTab === 'history'" @click="activeTab = 'history'">换车记录 <span class="oneos-number">{{ vehicleReplacements(contract, vehicle).length }}</span></Button></div>
    </template>
    <NestedLeaseHistory v-if="vehicle && activeTab === 'history'" :contract="contract" :vehicle="vehicle" @vehicle="$emit('vehicle', $event)" />
    <template v-else>
    <OneosSection :title="vehicle ? '车辆基本信息' : '合同基本信息'"><OneosDescriptions :items="identity" bordered><template #approval="{ item }"><span class="nl-detail-tag nl-status" :data-tone="approvalTone(String(item.value || ''))">{{ item.value || '—' }}</span></template></OneosDescriptions></OneosSection>
    <OneosSection :title="vehicle ? '车辆执行情况' : '合同执行情况'"><OneosDescriptions :items="progress" bordered /></OneosSection>
    <OneosSection v-if="vehicle" title="里程情况"><OneosDescriptions bordered :items="[
      {key:'current',label:'完成里程',value:mileage(vehicle.mileage),mono:true},
      {key:'target',label:'要求里程',value:mileage(vehicle.targetMileage),mono:true},
      {key:'result',label:'履约结论',value:vehicle.mileageConclusion},
    ]" /></OneosSection>
    <div v-else class="nl-audit"><span>创建人 <strong>{{ contract.creator || '未记录' }}</strong></span><span>创建时间 <strong class="oneos-number">{{ contract.created || '未记录' }}</strong></span></div>
    </template>
  </OneosPage>
</template>
