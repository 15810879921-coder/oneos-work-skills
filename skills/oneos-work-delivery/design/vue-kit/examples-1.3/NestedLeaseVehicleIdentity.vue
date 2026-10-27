<script setup lang="ts">
import { computed } from 'vue';
import { Button } from 'ant-design-vue';
import OneosLedgerCell from '../../src/components/oneos-design/patterns/OneosLedgerCell.vue';
import { fulfillmentState, type LeaseExample, type LeaseVehicle } from './nested-lease-fixtures';
import { vehicleReplacements } from './nested-lease-replacements';
const props = defineProps<{ contract: LeaseExample; vehicle: LeaseVehicle }>();
const emit = defineEmits<{ view: [LeaseVehicle] }>();
const related = computed(() => props.contract.vehicles.find((item) => item.id === props.vehicle.relation?.vehicleId));
const suffixes: Record<string, string> = { '由': '永久替换', '已由': '替换', '当前由': '代用', '曾由': '代用，已换回', '拟由': '替换 · 审批中' };
const suffix = computed(() => suffixes[props.vehicle.relation?.prefix || ''] || '');
const pendingHandover = computed(() => vehicleReplacements(props.contract, props.vehicle).find((record) => record.phase === '交接中')?.pending);
</script>
<template>
  <OneosLedgerCell class="nl-vehicle-identity">
    <div class="nl-identity-main"><Button type="link" class="nl-data-link oneos-number" @click="emit('view', vehicle)">{{ vehicle.plate }}</Button>
      <span class="nl-status" :data-tone="fulfillmentState(vehicle).tone"><i />{{ fulfillmentState(vehicle).label }}</span></div>
    <template #secondary><span v-if="vehicle.relation" class="nl-relation">{{ vehicle.relation.prefix }}
      <Button v-if="related" type="link" class="nl-related-link oneos-number" :aria-label="`查看关联车辆 ${related.plate}`" @click="emit('view', related)">{{ related.plate }}</Button>
      <span v-else class="oneos-number">{{ vehicle.relation.plate }}</span> {{ suffix }}<span v-if="pendingHandover" class="nl-warning-text"> · {{ pendingHandover }}</span>
    </span><span v-else class="oneos-number nl-vin">{{ vehicle.vin }}</span></template>
  </OneosLedgerCell>
</template>
