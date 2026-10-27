// Local design examples only. Snapshot of oneos_pc/oneos-page-canon/data.ts; never import into business code.
export type PageType =
  | 'ledger'
  | 'form-b1'
  | 'form-sidebar'
  | 'detail'
  | 'h5'
  | 'workbench';

export type BillStatus = 'pending' | 'doing' | 'done';

/**
 * 任务类型：我要办的（处置）/ 我要审的（审核）。
 * H5 待办收件箱按它分档——「进来就知道自己要做什么」靠的是动作类型，不是单据状态。
 */
export type TaskKind = 'handle' | 'review';

export type CanonBill = {
  id: string;
  code: string;
  title: string;
  customer: string;
  plate: string;
  region: string;
  owner: string;
  amount: number;
  /** 已收金额：台账范例用它演示「应收 / 已收 + 差额」复合金额格 */
  received: number;
  status: BillStatus;
  kind: TaskKind;
  updatedAt: string;
  /** 以下字段供表单 / 详情范例展示真实业务密度与跨列写法 */
  contact: string;
  phone: string;
  settle: string;
  site: string;
  planDay: string;
  remark: string;
};

export const STATUS_LABEL: Record<BillStatus, string> = {
  pending: '待处理',
  doing: '处理中',
  done: '已办结',
};

export const KIND_LABEL: Record<TaskKind, string> = {
  handle: '处置',
  review: '审核',
};

export const REGION_OPTIONS = [
  { value: '华东', label: '华东' },
  { value: '华南', label: '华南' },
  { value: '华北', label: '华北' },
];

export const OWNER_OPTIONS = [
  { value: '刘洋', label: '刘洋' },
  { value: '陈可', label: '陈可' },
  { value: '周宁', label: '周宁' },
];

export const SETTLE_OPTIONS = [
  { value: '月结', label: '月结' },
  { value: '现结', label: '现结' },
  { value: '预付扣减', label: '预付扣减' },
];

export const SITE_OPTIONS = [
  { value: '嘉兴一号站', label: '嘉兴一号站' },
  { value: '临平服务站', label: '临平服务站' },
  { value: '南海服务站', label: '南海服务站' },
];

/**
 * 处置填报的已传凭证。范例页不连对象存储，用内联 SVG 占位，
 * 保证「已办事项」在查看态能看见结果，而不是空上传区（体验规范 §2 条 3）。
 */
function photoStub(label: string, tone: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="${tone}"/><text x="80" y="86" font-family="system-ui" font-size="15" fill="#ffffff" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const CANON_PHOTOS = [
  { id: 'p1', name: '到站照片.jpg', url: photoStub('到站照片', '#0f766e'), size: 421_000 },
  { id: 'p2', name: '检测小票.jpg', url: photoStub('检测小票', '#475569'), size: 318_000 },
];

/** 范例页统一「今天」，让临期 / 逾期徽标可复现 */
export const CANON_TODAY = '2026-08-27';

/** 距计划完成日天数：负数为已逾期 */
export function daysToPlan(date: string, today = CANON_TODAY) {
  const d = new Date(`${date}T00:00:00`).getTime();
  const t = new Date(`${today}T00:00:00`).getTime();
  return Math.round((d - t) / 86400000);
}

export type TraceItem = { time: string; who: string; what: string };

export const CANON_TRACE: TraceItem[] = [
  { time: '2026-08-25 16:20', who: '周宁', what: '核对完成，金额与站内流水一致，提交办结' },
  { time: '2026-08-25 11:05', who: '周宁', what: '现场取得加注小票 3 张，回填金额 45,200.00' },
  { time: '2026-08-25 09:12', who: '系统', what: '按站内现结规则自动成单，指派至华南服务组' },
];

export const CANON_BILLS: CanonBill[] = [
  {
    id: '1',
    code: 'WO-20260827-0001',
    title: '氢堆压力异常回访',
    customer: '嘉兴运力',
    plate: '浙A88888F',
    region: '华东',
    owner: '刘洋',
    amount: 12800,
    received: 0,
    status: 'pending',
    kind: 'handle',
    updatedAt: '2026-08-27',
    contact: '钱敏',
    phone: '13805730001',
    settle: '月结',
    site: '嘉兴一号站',
    planDay: '2026-08-29',
    remark: '司机反馈满氢后压力回落偏快，需到站复测并记录两次读数。',
  },
  {
    id: '2',
    code: 'WO-20260826-0018',
    title: '证照临期续办',
    customer: '沪杭物流',
    plate: '浙F12345D',
    region: '华东',
    owner: '陈可',
    amount: 3600,
    received: 3600,
    status: 'doing',
    kind: 'handle',
    updatedAt: '2026-08-26',
    contact: '许强',
    phone: '13905710018',
    settle: '月结',
    site: '临平服务站',
    planDay: '2026-08-28',
    remark: '道路运输证 9 月 3 日到期，需先取得年检合格证明。',
  },
  {
    id: '3',
    code: 'WO-20260825-0007',
    title: '站内现结核对',
    customer: '南海外部车队',
    plate: '粤A99881',
    region: '华南',
    owner: '周宁',
    amount: 45200,
    received: 45200,
    status: 'done',
    kind: 'review',
    updatedAt: '2026-08-25',
    contact: '罗启明',
    phone: '13602450007',
    settle: '现结',
    site: '南海服务站',
    planDay: '2026-08-25',
    remark: '现场加注 3 车次，小票与站内流水已逐笔核对一致。',
  },
  {
    id: '4',
    code: 'WO-20260824-0012',
    title: '交车资料补齐',
    customer: '京津城配',
    plate: '京A76543',
    region: '华北',
    owner: '刘洋',
    amount: 0,
    received: 0,
    status: 'pending',
    kind: 'handle',
    updatedAt: '2026-08-24',
    contact: '张宇',
    phone: '13701160012',
    settle: '月结',
    site: '临平服务站',
    planDay: '2026-08-30',
    remark: '缺交接单签字页与随车工具清单照片。',
  },
  {
    id: '5',
    code: 'WO-20260823-0004',
    title: '里程履约跟进',
    customer: '嘉兴运力',
    plate: '浙A66666F',
    region: '华东',
    owner: '陈可',
    amount: 8900,
    received: 4000,
    status: 'doing',
    kind: 'handle',
    updatedAt: '2026-08-23',
    contact: '钱敏',
    phone: '13805730001',
    settle: '预付扣减',
    site: '嘉兴一号站',
    planDay: '2026-08-31',
    remark: '本月里程低于合同约定下限，需与客户确认后续排班。',
  },
  {
    id: '6',
    code: 'WO-20260822-0009',
    title: '替换车归还结算',
    customer: '沪杭物流',
    plate: '沪D22331',
    region: '华东',
    owner: '周宁',
    amount: 15600,
    received: 15600,
    status: 'done',
    kind: 'review',
    updatedAt: '2026-08-22',
    contact: '许强',
    phone: '13905710018',
    settle: '月结',
    site: '临平服务站',
    planDay: '2026-08-22',
    remark: '替换车已归还，车损与超期费用一并计入本期账单。',
  },
  {
    id: '7',
    code: 'WO-20260821-0031',
    title: '站内加注差异复核',
    customer: '临平冷链',
    plate: '浙A50213F',
    region: '华东',
    owner: '陈可',
    amount: 26400,
    received: 0,
    status: 'pending',
    kind: 'review',
    updatedAt: '2026-08-21',
    contact: '沈立',
    phone: '13906510031',
    settle: '月结',
    site: '临平服务站',
    planDay: '2026-08-24',
    remark: '站内流水与客户自记加注量差 42 公斤，需调取枪号记录复核。',
  },
  {
    id: '8',
    code: 'WO-20260821-0028',
    title: '外部车队开票资料核验',
    customer: '南海外部车队',
    plate: '粤B71204',
    region: '华南',
    owner: '周宁',
    amount: 9800,
    received: 2000,
    status: 'doing',
    kind: 'review',
    updatedAt: '2026-08-21',
    contact: '罗启明',
    phone: '13602450007',
    settle: '现结',
    site: '南海服务站',
    planDay: '2026-08-26',
    remark: '客户变更开票主体，需重新取得营业执照与授权书。',
  },
  {
    id: '9',
    code: 'WO-20260820-0016',
    title: '车辆过户资料预审',
    customer: '京津城配',
    plate: '京C31882',
    region: '华北',
    owner: '刘洋',
    amount: 5400,
    received: 0,
    status: 'pending',
    kind: 'review',
    updatedAt: '2026-08-20',
    contact: '张宇',
    phone: '13701160012',
    settle: '月结',
    site: '临平服务站',
    planDay: '2026-09-02',
    remark: '过户前需结清本期账单并解除车辆抵押登记。',
  },
  {
    id: '10',
    code: 'WO-20260819-0011',
    title: '季度账单对账',
    customer: '嘉兴运力',
    plate: '浙A31207F',
    region: '华东',
    owner: '刘洋',
    amount: 33800,
    received: 20000,
    status: 'doing',
    kind: 'review',
    updatedAt: '2026-08-19',
    contact: '钱敏',
    phone: '13805730001',
    settle: '预付扣减',
    site: '嘉兴一号站',
    planDay: '2026-09-05',
    remark: '预付余额不足以覆盖本季度差额，需客户补款后再核销。',
  },
  {
    id: '11',
    code: 'WO-20260818-0006',
    title: '冷链温控异常回访',
    customer: '临平冷链',
    plate: '浙A50213F',
    region: '华东',
    owner: '陈可',
    amount: 7200,
    received: 7200,
    status: 'done',
    kind: 'handle',
    updatedAt: '2026-08-18',
    contact: '沈立',
    phone: '13906510031',
    settle: '月结',
    site: '临平服务站',
    planDay: '2026-08-19',
    remark: '温控记录仪已更换，连续两日回传数据正常，单据办结。',
  },
];

export function money(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function readPageType(): PageType {
  if (typeof window === 'undefined') return 'ledger';
  const q = new URLSearchParams(window.location.search).get('type');
  if (
    q === 'form-b1' ||
    q === 'form-sidebar' ||
    q === 'detail' ||
    q === 'h5' ||
    q === 'workbench' ||
    q === 'ledger'
  ) {
    return q;
  }
  return 'ledger';
}

export function setPageTypeInUrl(type: PageType) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('type', type);
  window.history.replaceState({}, '', url.toString());
}
