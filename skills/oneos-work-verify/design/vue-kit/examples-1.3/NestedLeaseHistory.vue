<script setup lang="ts">
import { computed } from 'vue';
import { Button, Empty, Timeline } from 'ant-design-vue';
import { minuteTime, type LeaseExample, type LeaseVehicle } from './nested-lease-fixtures';
import { replacementTone, vehicleReplacements } from './nested-lease-replacements';
const props = defineProps<{ contract: LeaseExample; vehicle: LeaseVehicle }>();
const emit = defineEmits<{ vehicle: [LeaseVehicle] }>();
const records = computed(() => [...vehicleReplacements(props.contract, props.vehicle)].reverse());
const chain = computed(() => {
  const steps: { plate: string; id?: string; planned?: boolean }[] = [];
  for (const record of [...records.value].reverse()) {
    if (!steps.length) steps.push({ plate: record.fromPlate, id: record.fromId });
    steps.push({ plate: record.toPlate, id: record.toId, planned: record.phase === '审批中' });
    if (record.events.some((event) => event.title === '原车恢复履约')) steps.push({ plate: record.fromPlate, id: record.fromId });
  }
  return steps;
});
const find = (id?: string) => props.contract.vehicles.find((vehicle) => vehicle.id === id);
function open(id?: string) { const vehicle = find(id); if (vehicle) emit('vehicle', vehicle); }
</script>
<template>
  <section class="nl-history" aria-label="车辆换车履历">
    <div class="nl-history-heading"><h2>换车记录 <span class="oneos-number">{{ records.length }}</span></h2><span class="oneos-number">{{ vehicle.plate }}</span></div>
    <Empty v-if="!records.length" :image="Empty.PRESENTED_IMAGE_SIMPLE" description="该车辆暂无换车记录" />
    <div v-if="chain.length" class="nl-history-chain" aria-label="车辆替换顺序"><template v-for="(step, index) in chain" :key="index"><span v-if="index" class="nl-chain-arrow">{{ step.planned ? '⇢ 拟替换' : '→' }}</span><Button v-if="step.id" type="link" class="oneos-number" @click="open(step.id)">{{ step.plate }}</Button><span v-else class="oneos-number">{{ step.plate }}</span></template></div>
    <article v-for="record in records" :key="record.id" class="nl-replacement-record" :data-record="record.id">
      <header><strong>{{ record.kind }}</strong><span class="nl-status" :data-tone="replacementTone(record)"><i />{{ record.phase }}</span><span class="nl-record-code oneos-number">{{ record.id }}</span></header>
      <div class="nl-replacement-pair">
        <div><span>原车</span><Button type="link" class="oneos-number" :aria-label="`查看原车 ${record.fromPlate}`" @click="open(record.fromId)">{{ record.fromPlate }}</Button></div>
        <span class="nl-replacement-arrow" aria-label="替换为">→</span>
        <div><span>替换车</span><Button v-if="record.toId" type="link" class="oneos-number" :aria-label="`查看替换车 ${record.toPlate}`" @click="open(record.toId)">{{ record.toPlate }}</Button><strong v-else class="oneos-number">{{ record.toPlate }}</strong></div>
      </div>
      <p class="nl-replacement-reason"><span>替换原因</span>{{ record.reason }}</p>
      <div v-if="record.pending" class="nl-pending"><span class="nl-status" data-tone="warning"><i />{{ record.pending }}</span></div>
      <Timeline class="nl-replacement-events">
        <Timeline.Item v-for="(event, index) in record.events" :key="`${record.id}-${index}`" :color="index === record.events.length - 1 ? 'var(--oneos-info-ink)' : 'var(--oneos-line-control)'">
          <div class="nl-event-head"><strong>{{ event.title }}</strong><time class="oneos-number">{{ minuteTime(event.at) }}</time></div>
          <p v-if="event.detail">{{ event.detail }}</p><span class="nl-event-by">经办人 {{ event.by || '未记录' }}</span>
        </Timeline.Item>
      </Timeline>
    </article>
  </section>
</template>
