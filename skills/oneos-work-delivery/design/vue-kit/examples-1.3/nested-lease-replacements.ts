import type { LeaseExample, LeaseVehicle, Tone } from './nested-lease-fixtures';

export interface ReplacementEvent { title: string; at: string; by: string; detail: string }
export interface LeaseReplacement {
  id: string; positionId: string; kind: '临时替换' | '永久替换';
  fromId: string; toId?: string; fromPlate: string; toPlate: string;
  phase: '审批中' | '交接中' | '代用中' | '已完成';
  reason: string; pending: string; events: ReplacementEvent[];
}
const event = (title: string, at: string, by: string, detail = ''): ReplacementEvent => ({ title, at, by, detail });
export function replacementTone(record: LeaseReplacement): Tone {
  return record.phase === '已完成' ? 'success' : record.phase === '代用中' ? 'processing' : 'warning';
}
export function vehicleReplacements(contract: LeaseExample, vehicle: LeaseVehicle) {
  return contract.replacements.filter((record) => record.positionId === vehicle.positionId);
}
export function replacementCounts(contract: LeaseExample) {
  return { total: contract.replacements.length, pending: contract.replacements.filter((record) => record.phase === '审批中' || record.phase === '交接中').length };
}

// Explicit fictional associations. A historical participant keeps its own bill and handover data.
function historical(contract: LeaseExample, current: LeaseVehicle, plate: string, returnedAt: string, label = '已被替换') {
  const id = `history-${contract.id}-${contract.vehicles.length}`;
  const vehicle: LeaseVehicle = {
    ...current, id, plate, vin: `LHIST${String(contract.vehicles.length).padStart(12, '0')}`,
    fulfillment: 'history', fulfillmentLabel: label, relation: undefined,
    stage: returnedAt ? 'returned' : 'renting', deliveryDate: '2026-08-20 09:30:18',
    returnedDate: returnedAt, returnPerson: returnedAt ? '周宁' : '',
    bill: '已结清', settlement: returnedAt ? '已结清' : '未发生',
    mileage: 2100, mileageConclusion: '已结束',
  };
  contract.vehicles.push(vehicle);
  return vehicle;
}
function relation(vehicle: LeaseVehicle, other: LeaseVehicle, prefix: string) {
  vehicle.relation = { prefix, plate: other.plate, vehicleId: other.id };
}
function record(contract: LeaseExample, from: LeaseVehicle, to: LeaseVehicle, kind: LeaseReplacement['kind'], phase: LeaseReplacement['phase'], reason: string, pending: string, events: ReplacementEvent[]) {
  contract.replacements.push({ id: `HC-202609-${String(contract.replacements.length + 1).padStart(3, '0')}-${contract.id.slice(-1)}`,
    positionId: from.positionId, kind, fromId: from.id, toId: to.id, fromPlate: from.plate, toPlate: to.plate, phase, reason, pending, events });
}
export function addReplacementExamples(contract: LeaseExample, index: number) {
  if (index === 0) {
    const permanent = contract.vehicles[0]!;
    const old = historical(contract, permanent, '浙A88001F', '2026-09-04 09:10:00');
    permanent.deliveryDate = '2026-09-04 09:30:18';
    relation(permanent, old, '由'); relation(old, permanent, '已由');
    record(contract, old, permanent, '永久替换', '已完成', '原车维修周期较长，安排同型车辆继续履约。', '', [
      event('发起永久替换', '2026-09-03 10:00', '刘洋', `${old.plate} → ${permanent.plate}`),
      event('审批通过', '2026-09-03 15:20', '李岚'),
      event('原车已收回', '2026-09-04 09:10', '周宁', old.plate),
      event('替换车已交付', '2026-09-04 09:30', '陈可', permanent.plate),
    ]);
    const temporary = contract.vehicles[1]!;
    const source = historical(contract, temporary, '浙A88002F', '', '临时换出');
    source.bill = '待结清'; source.mileageConclusion = '暂停履约';
    temporary.deliveryDate = '2026-09-10 14:30:00'; temporary.fulfillmentLabel = '临时代用'; temporary.bill = '正常';
    relation(temporary, source, '临时代用'); relation(source, temporary, '当前由');
    record(contract, source, temporary, '临时替换', '交接中', '原车故障停用，先交付代用车辆保障客户用车。', '原车待收回', [
      event('发起临时替换', '2026-09-10 09:00', '刘洋', `${source.plate} → ${temporary.plate}`),
      event('审批通过', '2026-09-10 11:00', '李岚'),
      event('替换车已交付', '2026-09-10 14:30', '陈可', `${temporary.plate} 已交付，${source.plate} 尚未收回。`),
    ]);
    const latest = contract.vehicles[4]!;
    const first = historical(contract, latest, '浙A88003F', '2026-09-01 10:00:00');
    const middle = historical(contract, latest, '浙A88004F', '2026-09-11 10:40:00');
    middle.deliveryDate = '2026-09-01 10:30:00'; latest.deliveryDate = '2026-09-11 11:00:00';
    relation(first, middle, '已由'); relation(middle, latest, '已由'); relation(latest, middle, '由');
    record(contract, first, middle, '永久替换', '已完成', '原车故障，办理永久替换。', '', [
      event('发起永久替换', '2026-08-31 09:00', '刘洋', `${first.plate} → ${middle.plate}`),
      event('审批通过', '2026-08-31 15:00', '李岚'), event('原车已收回', '2026-09-01 10:00', '周宁', first.plate),
      event('替换车已交付', '2026-09-01 10:30', '陈可', middle.plate),
    ]);
    record(contract, middle, latest, '永久替换', '已完成', '客户线路调整，更换适合该线路的车型。', '', [
      event('发起永久替换', '2026-09-10 09:00', '刘洋', `${middle.plate} → ${latest.plate}`),
      event('审批通过', '2026-09-10 16:00', '李岚'), event('原车已收回', '2026-09-11 10:40', '周宁', middle.plate),
      event('替换车已交付', '2026-09-11 11:00', '陈可', latest.plate),
    ]);
  }
  if (index === 1) {
    const restored = contract.vehicles[0]!;
    const substitute = historical(contract, restored, '浙A88101F', '2026-09-08 16:00:00', '代用结束');
    substitute.deliveryDate = '2026-09-01 10:00:00'; restored.fulfillmentLabel = '已换回履约';
    relation(restored, substitute, '曾由'); relation(substitute, restored, '已换回');
    record(contract, restored, substitute, '临时替换', '已完成', '原车年审期间临时代用，现已恢复原车履约。', '', [
      event('发起临时替换', '2026-08-31 09:00', '陈可', `${restored.plate} → ${substitute.plate}`),
      event('审批通过', '2026-08-31 14:00', '李岚'), event('原车已收回', '2026-09-01 09:30', '周宁', restored.plate),
      event('代用车已交付', '2026-09-01 10:00', '陈可', substitute.plate),
      event('原车恢复履约', '2026-09-08 15:30', '陈可', `${substitute.plate} → ${restored.plate}`),
      event('代用车已收回', '2026-09-08 16:00', '周宁', substitute.plate),
    ]);
    const awaiting = contract.vehicles[1]!;
    awaiting.relation = { prefix: '拟由', plate: '浙A88102F' };
    contract.replacements.push({ id: 'HC-202609-002-2', positionId: awaiting.positionId,
      kind: '永久替换', fromId: awaiting.id, fromPlate: awaiting.plate, toPlate: '浙A88102F', phase: '审批中',
      reason: '客户申请调整车型，尚未审批和交接。', pending: '等待审批，原车继续履约',
      events: [event('发起永久替换', '2026-09-12 09:00', '陈可', `${awaiting.plate} → 浙A88102F，拟替换车辆尚未加入本合同履约。`)] });
  }
}
