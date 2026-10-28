// Isolated design-lab examples. No business API, identifiers or mutation handlers.
import { addReplacementExamples, type LeaseReplacement } from './nested-lease-replacements';
export type LeaseStatus = 'active' | 'submitted' | 'draft' | 'terminated';
export type VehicleStage = 'waiting' | 'renting' | 'returned';
export type ExampleState = 'normal' | 'empty' | 'loading' | 'error';
export type Tone = 'success' | 'processing' | 'warning' | 'error' | 'neutral';

export const LEASE_STATUSES: { value: LeaseStatus; label: string; tone: Tone }[] = [
  { value: 'active', label: '合同进行中', tone: 'success' },
  { value: 'submitted', label: '已提交审批', tone: 'processing' },
  { value: 'draft', label: '草稿', tone: 'neutral' },
  { value: 'terminated', label: '已终止', tone: 'neutral' },
];
export const VEHICLE_STAGES: { value: VehicleStage; label: string; tone: Tone }[] = [
  { value: 'waiting', label: '待交车', tone: 'neutral' },
  { value: 'renting', label: '租赁中', tone: 'processing' },
  { value: 'returned', label: '已还车', tone: 'success' },
];
export interface LeaseVehicle {
  id: string; plate: string; vin: string; model: string; stage: VehicleStage;
  positionId: string; fulfillment: 'current' | 'waiting' | 'history';
  fulfillmentLabel?: string;
  relation?: { prefix: string; plate: string; vehicleId?: string };
  deliveryDate: string; deliveryPerson: string; deliveryPlan: string;
  pickupApprovalStatus: string; pickupApprovalDate: string;
  bill: string; returnedDate: string; returnPerson: string;
  settlement: string; mileage: number | null; targetMileage: number | null;
  mileageConclusion: string;
}
export interface LeaseExample {
  id: string; code: string; project: string; customer: string; owner: string;
  status: LeaseStatus; approval: string; approver: string; company: string;
  signingMethod: string; signingStatus: string; start: string; end: string;
  creator: string | null; created: string | null; vehicles: LeaseVehicle[];
  replacements: LeaseReplacement[];
}
export interface LeaseQuery { text: string; approval?: string }
export interface VehiclePanelState { text: string; stage: 'current' | 'waiting' | 'history' | 'all'; page: number; phase: ExampleState; replacementsOnly: boolean }

function fleet(contractIndex: number, count: number): LeaseVehicle[] {
  const stages: VehicleStage[] = ['renting', 'renting', 'waiting', 'returned', 'renting', 'waiting'];
  return Array.from({ length: count }, (_, index) => {
    const stage = stages[index % stages.length]!;
    const serial = contractIndex * 100 + index + 1;
    const delivered = stage !== 'waiting';
    return {
      id: `vehicle-${contractIndex}-${index}`, plate: `浙A${String(90000 + serial)}F`,
      positionId: `position-${contractIndex}-${index}`, fulfillment: stage === 'renting' ? 'current' : stage === 'waiting' ? 'waiting' : 'history',
      vin: `LDEMO${String(serial).padStart(12, '0')}`, model: index % 2 ? '4.5T 氢能轻卡' : '18T 氢能厢式车', stage,
      deliveryDate: delivered ? '2026-08-20 09:30:18' : '', deliveryPerson: delivered ? '陈可' : '',
      deliveryPlan: '杭州 · 2026-09-15',
      pickupApprovalStatus: delivered ? '审批通过' : index % 6 === 2 ? '审批中' : '未提交',
      pickupApprovalDate: delivered ? '2026-08-18' : '',
      bill: stage === 'waiting' ? '未生成' : index % 6 === 1 ? '逾期' : '正常',
      returnedDate: stage === 'returned' ? '2026-09-08 16:45:06' : '', returnPerson: stage === 'returned' ? '周宁' : '',
      settlement: stage === 'returned' ? '待结算' : '未发生',
      mileage: delivered ? 4600 + index * 520 : null,
      targetMileage: delivered ? 8000 : null,
      mileageConclusion: delivered ? '进行中' : '未开始',
    };
  });
}

const seeds: [string, string, LeaseStatus, string, number][] = [
  ['杭州城配运力项目', '岚海智慧物流有限公司', 'active', '审批通过', 6],
  ['临港园区短驳项目', '临港园区运输有限公司', 'active', '审批通过', 2],
  ['绍兴冷链运力项目', '青禾冷链配送有限公司', 'draft', '未提交', 0],
  ['嘉兴城市配送项目', '云帆城市配送有限公司', 'submitted', '审批中', 5],
  ['华东干线运力项目', '岚海智慧物流有限公司', 'active', '审批通过', 28],
  ['宁波港区运输项目', '临港园区运输有限公司', 'terminated', '审批通过', 3],
  ['金华商超配送项目', '青禾冷链配送有限公司', 'draft', '未提交', 4],
  ['湖州园区接驳项目', '云帆城市配送有限公司', 'submitted', '待审批', 3],
];
export const LEASE_EXAMPLES: LeaseExample[] = seeds.map(([project, customer, status, approval, count], index) => {
  const vehicles = fleet(index, count);
  if (status === 'draft' || status === 'submitted') vehicles.forEach((vehicle) => {
    Object.assign(vehicle, { stage: 'waiting', fulfillment: 'waiting', deliveryDate: '', deliveryPerson: '', pickupApprovalStatus: '未提交', pickupApprovalDate: '', bill: '未生成', returnedDate: '', returnPerson: '', settlement: '未发生', mileage: null, targetMileage: null, mileageConclusion: '未开始' });
  });
  if (status === 'terminated') vehicles.forEach((vehicle) => {
    Object.assign(vehicle, { stage: 'returned', fulfillment: 'history', deliveryDate: '2026-06-01 10:20:00', deliveryPerson: '陈可', pickupApprovalStatus: '审批通过', pickupApprovalDate: '2026-05-29', bill: '正常', returnedDate: '2026-09-01 15:40:00', returnPerson: '周宁', settlement: '已结清' });
  });
  const contract: LeaseExample = {
    id: `lease-demo-${index + 1}`, code: `ZL-202609-${String(index + 1).padStart(4, '0')}`,
    project, customer, owner: ['刘洋', '陈可', '周宁'][index % 3]!, status, approval,
    approver: approval === '审批中' || approval === '待审批' ? '李岚' : '',
    company: '示例氢能运营有限公司', signingMethod: index % 2 ? '线下盖章' : '线上签署',
    signingStatus: status === 'active' || status === 'terminated' ? '已签署' : '待签署',
    start: '2026-08-01', end: '2027-07-31', creator: index === 2 ? null : '刘洋',
    created: index === 2 ? null : '2026-08-01', vehicles, replacements: [],
  };
  addReplacementExamples(contract, index);
  return contract;
});

export function filterLeases(rows: LeaseExample[], query: LeaseQuery) {
  const text = query.text.trim().toLowerCase();
  return rows.filter((row) => (!text || [row.code, row.project, row.customer].some((value) => value.toLowerCase().includes(text)))
    && (!query.approval || row.approval === query.approval));
}
export function execution(vehicles: LeaseVehicle[]) {
  const positions = [...new Set(vehicles.map((vehicle) => vehicle.positionId))];
  const group = (id: string) => vehicles.filter((vehicle) => vehicle.positionId === id);
  return {
    total: positions.length,
    delivered: positions.filter((id) => group(id).some((vehicle) => !!vehicle.deliveryDate)).length,
    renting: vehicles.filter((vehicle) => vehicle.fulfillment === 'current').length,
    returned: positions.filter((id) => group(id).every((vehicle) => vehicle.fulfillment === 'history') && group(id).some((vehicle) => !!vehicle.returnedDate)).length,
  };
}
export function filterVehicles(vehicles: LeaseVehicle[], state: Pick<VehiclePanelState, 'text' | 'stage'>) {
  const text = state.text.trim().toLowerCase();
  return vehicles.filter((vehicle) => (state.stage === 'all' || vehicle.fulfillment === state.stage)
    && (!text || [vehicle.plate, vehicle.vin].some((value) => value.toLowerCase().includes(text))));
}
export function newVehicleState(): VehiclePanelState {
  return { text: '', stage: 'current', page: 1, phase: 'normal', replacementsOnly: false };
}
export function fulfillmentState(vehicle: LeaseVehicle): { label: string; tone: Tone } {
  return { label: vehicle.fulfillmentLabel || (vehicle.fulfillment === 'current' ? '当前履约' : vehicle.fulfillment === 'waiting' ? '待交车' : '已还车'),
    tone: vehicle.fulfillment === 'current' ? 'processing' : 'neutral' };
}
export function leaseStatus(status: LeaseStatus) { return LEASE_STATUSES.find((item) => item.value === status)!; }
export function vehicleStage(stage: VehicleStage) { return VEHICLE_STAGES.find((item) => item.value === stage)!; }
export function approvalTone(label: string): Tone {
  return label === '审批通过' ? 'success' : label === '审批中' ? 'warning' : label === '待审批' ? 'processing' : 'neutral';
}
export function display(value: string | number | null | undefined) { return value === '' || value == null ? '—' : String(value); }
// Display precision only; do not invent midnight for an old date-only value.
export function minuteTime(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) return '—';
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(text);
  return match ? `${match[1]} ${match[2]}` : text;
}
export function mileage(value: number | null) { return value == null ? '—' : `${value.toLocaleString('zh-CN')} km`; }
