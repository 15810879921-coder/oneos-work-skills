export type InsuranceRisk = 'normal' | 'warning' | 'expired' | 'missing';
export interface InsuranceExampleRow {
  id: string;
  plate: string;
  vin: string;
  model: string;
  customer: string;
  company: string;
  operation: string;
  risk: InsuranceRisk;
  owner: string;
  compulsory: string;
  commercial: string;
  attachments: number;
  updated: string;
}

export const RISK_LABEL: Record<InsuranceRisk, string> = {
  normal: '保障正常',
  warning: '临期预警',
  expired: '核心险种逾期',
  missing: '核心险种待购',
};

// Fictional, fixed examples. These flags do not implement insurance eligibility rules.
const seeds: [string, string, InsuranceRisk, string, string][] = [
  ['浙A88216F', '嘉兴运力', 'warning', '2026-09-23', '2026-09-30'],
  ['浙F12345D', '沪杭物流', 'normal', '2027-06-18', '2027-06-18'],
  ['粤A99881', '南海车队', 'expired', '2026-08-30', '2026-08-30'],
  ['京A76543', '京津城配', 'missing', '', ''],
  ['浙A66666F', '嘉兴运力', 'warning', '2026-10-01', '2026-09-26'],
  ['沪D22331', '沪杭物流', 'normal', '2027-04-22', '2027-04-22'],
  ['浙A50213F', '临平冷链', 'warning', '2026-09-18', '2026-09-18'],
  ['粤B71204', '南海车队', 'normal', '2027-03-11', '2027-03-11'],
  ['京C31882', '京津城配', 'expired', '2026-09-05', '2026-09-05'],
  ['浙F88126D', '嘉兴运力', 'warning', '2026-10-05', '2026-10-05'],
  ['浙A51008F', '临平冷链', 'missing', '', ''],
  ['沪D30991', '沪杭物流', 'normal', '2027-08-01', '2027-08-01'],
];

export const INSURANCE_EXAMPLES: InsuranceExampleRow[] = seeds.map(
  (row, index) => ({
    id: 'vehicle-demo-' + (index + 1),
    plate: row[0],
    customer: row[1],
    risk: row[2],
    compulsory: row[3],
    commercial: row[4],
    vin: 'LDEMO20260911' + String(index + 1).padStart(4, '0'),
    model: index % 3 === 0 ? '49T 氢能牵引车' : '18T 氢能物流车',
    company: index % 3 === 0 ? '羚牛华南' : '羚牛华东',
    operation: index === 3 || index === 10 ? '待租' : '在租',
    owner: ['刘洋', '陈可', '周宁'][index % 3]!,
    attachments: row[2] === 'missing' ? 0 : 2,
    updated: '2026-09-' + String(11 - (index % 5)).padStart(2, '0'),
  }),
);

export function getExampleOperationRows(
  operation: 'export' | 'download',
  allRows: InsuranceExampleRow[],
  filteredRows: InsuranceExampleRow[],
  selectedIds: string[],
) {
  if (operation === 'download' && selectedIds.length) {
    const selected = new Set(selectedIds);
    return allRows.filter((row) => selected.has(row.id));
  }
  return [...filteredRows];
}
