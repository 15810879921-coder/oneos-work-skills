<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button, Dropdown, Input, Menu, Modal, Select, Tag } from 'ant-design-vue';
import { CopyOutlined, DeleteOutlined, HistoryOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { VxeGrid, type VxeGridProps } from 'vxe-table';
import { OneosPage, OneosToolbar, OneosValidationIndicator } from '../../src/components/oneos-design/patterns';
import {
  createValidationRows,
  formatValidationCost,
  formatValidationQuantity,
  type ValidationRow,
} from '../../src/components/oneos-design/validation-fixtures';
import '../../src/components/oneos-design/oneos-ds-validation.css';
import { createMaterialRecognitionItems, materialKindLabels, materialRecognitionBatch } from '../../src/components/oneos-design/material-recognition-fixtures';

type Filter = 'all' | 'success' | 'error' | 'duplicate' | 'unknown';

function getDropdownContainer(node: HTMLElement): HTMLElement { return node.closest<HTMLElement>('.oneos-surface') || document.body; }

const rows = ref<ValidationRow[]>(createValidationRows());
const keyword = ref('');
const status = ref<Filter>('all');
const applied = ref({ keyword: '', status: 'all' as Filter });
const focused = ref<ValidationRow>();
const editing = ref<ValidationRow>();
const editCustomer = ref('');
const editCost = ref('');
const deleting = ref<ValidationRow>();
const invalid = ref('');
const historyOpen = ref(false);
const notice = ref('');
const sample = ref<'validation' | 'material'>('validation');
const materialItems = createMaterialRecognitionItems();
const materialOpen = ref(false);
const materialHandled = ref(false);
const materialForm = ref({ owner: '', basis: '', proof: '' });
const materialInvalid = ref('');
const materialHistory = ref<Array<{ owner: string; basis: string; proof: string }>>([]);
const materialCounts = computed(() => Object.fromEntries(materialKindLabels.map((kind) => [kind, materialItems.filter((item) => item.kind === kind && !item.duplicate).length])));
const oilItems = computed(() => materialItems.filter((item) => item.kind === '加油' && !item.duplicate));
const oilKnown = computed(() => oilItems.value.reduce((sum, item) => sum + (item.amount ?? 0), 0));
const oilMissing = computed(() => oilItems.value.filter((item) => item.amount == null).length);
function saveMaterial() { if (!['客户承担', '我司承担'].includes(materialForm.value.owner) || !materialForm.value.basis.trim() || !materialForm.value.proof.trim()) { materialInvalid.value = '请补齐承担方、依据和实际办理凭据后再登记处理。'; return; } materialHistory.value.push({ owner: materialForm.value.owner, basis: materialForm.value.basis.trim(), proof: materialForm.value.proof.trim() }); materialHandled.value = true; materialInvalid.value = ''; }

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'success', label: '正确' },
  { value: 'error', label: '疑似有误' },
  { value: 'duplicate', label: '疑似重复' },
  { value: 'unknown', label: '无法核验' },
];

const shown = computed(() => rows.value.filter((row) => {
  if (!`${row.orderNo}${row.plate}${row.customer}`.toLowerCase().includes(applied.value.keyword.toLowerCase())) return false;
  if (applied.value.status === 'all') return true;
  const checks = [row.customerCheck, row.costCheck, row.recordCheck];
  return applied.value.status === 'success'
    ? checks.every((check) => check.status === 'success')
    : checks.some((check) => applied.value.status === 'error' ? ['error', 'warning'].includes(check.status) : check.status === applied.value.status);
}));

const metrics = computed(() => ({
  count: rows.value.length,
  quantity: formatValidationQuantity(rows.value.reduce((sum, row) => sum + row.quantity, 0)),
  cost: formatValidationCost(rows.value.reduce((sum, row) => sum + (row.cost ?? 0) * row.quantity, 0)),
}));

function validationRowClass({ row }: { row: ValidationRow }) {
  return ['error', 'warning', 'duplicate'].includes(row.recordCheck.status) ? `oneos-validation-row--${row.recordCheck.status}` : '';
}

function edit(row: ValidationRow) {
  if (!row.editable) return;
  editing.value = { ...row };
  invalid.value = '';
  editCustomer.value = row.customer;
  editCost.value = row.cost == null ? '' : String(row.cost);
}

function saveEdit() {
  if (!editing.value) return;
  if (!editCustomer.value.trim()) { invalid.value = '请选择客户名称'; return; }
  const cost = Number(editCost.value);
  if (!editCost.value.trim() || !Number.isFinite(cost) || cost < 0) { invalid.value = '请输入不小于 0 的成本单价'; return; }
  const draft = editing.value;
  rows.value = rows.value.map((row) => row.id !== draft.id ? row : {
    ...draft,
    customer: editCustomer.value.trim(),
    cost,
    customerCheck: editCustomer.value.trim() === row.customer ? row.customerCheck : { status: 'unknown', title: '客户待重新核验', details: ['客户已修改，等待新的核验结果。'] },
    costCheck: cost === row.cost ? row.costCheck : { status: 'unknown', title: '成本待重新核验', details: ['成本已修改，等待新的核验结果。'] },
    recordCheck: row.recordCheck.status === 'duplicate' || (editCustomer.value.trim() === row.customer && cost === row.cost)
      ? row.recordCheck
      : { status: 'unknown', title: '待重新核验', details: ['记录已修改，等待新的核验结果。'] },
  });
  editing.value = undefined;
  notice.value = '已保存示例记录';
}

function replace(row: ValidationRow, field: 'customer' | 'cost') {
  if (!row.editable || !row.replaceable || (field === 'customer' ? !row.systemCustomer : row.systemCost == null)) return;
  rows.value = rows.value.map((item) => {
    if (item.id !== row.id) return item;
    const next = field === 'customer'
      ? { ...item, customer: item.systemCustomer, customerCheck: { status: 'success' as const, title: '客户名称正确', details: ['已替换为加氢时登记的客户。'] } }
      : { ...item, cost: item.systemCost, costCheck: { status: 'success' as const, title: '成本单价正确', details: ['已替换为适用标准成本。'] } };
    return next.recordCheck.status !== 'duplicate' && next.customerCheck.status === 'success' && next.costCheck.status === 'success'
      ? { ...next, recordCheck: { status: 'success' as const, title: '核验正确', details: ['已提供的核验项均一致。'] } }
      : next;
  });
  notice.value = field === 'customer' ? '已替换客户名称' : '已替换成本单价';
}

function showHistory(row: ValidationRow) {
  focused.value = row;
  historyOpen.value = true;
}

function copyOrder(row: ValidationRow) {
  navigator.clipboard.writeText(row.orderNo)
    .then(() => { notice.value = '已复制订单编号'; })
    .catch(() => { notice.value = `复制未完成，订单编号：${row.orderNo}`; });
}

function query() {
  applied.value = { keyword: keyword.value.trim(), status: status.value };
}

function reset() {
  keyword.value = '';
  status.value = 'all';
  applied.value = { keyword: '', status: 'all' };
}

function remove(row: ValidationRow) {
  if (!row.editable) return;
  rows.value = rows.value.filter((item) => item.id !== row.id);
  deleting.value = undefined;
  notice.value = '已删除示例记录';
}

const columns = computed<VxeGridProps<ValidationRow>['columns']>(() => [
  { field: 'orderNo', title: '订单编号 / 加氢时间', width: 206, slots: { default: 'orderNo' } },
  { field: 'plate', title: '车牌号', width: 132, slots: { default: 'plate' } },
  { field: 'customer', title: '客户名称', width: 270, slots: { default: 'customer' } },
  { field: 'quantity', title: '加氢量(kg)', width: 112, align: 'right', slots: { default: 'quantity' } },
  { field: 'cost', title: '成本单价(元/kg)', width: 154, align: 'right', slots: { default: 'cost' } },
  { field: 'record', title: '数据核验', width: 176, slots: { default: 'record' } },
  { field: 'actions', title: '操作', width: 104, fixed: 'right', slots: { default: 'actions' } },
]);
</script>

<template>
  <OneosPage kind="ledger" label="数据核验台账">
    <div class="validation-sample-tabs" role="tablist"><button type="button" role="tab" :aria-selected="sample === 'validation'" @click="sample = 'validation'">字段核验</button><button type="button" role="tab" :aria-selected="sample === 'material'" @click="sample = 'material'">材料识别</button></div>
    <div v-if="sample === 'material'" class="material-canon">
      <div class="material-summary" aria-label="材料识别汇总"><div v-for="kind in materialKindLabels" :key="kind"><span>{{ kind }}</span><b class="oneos-number">{{ materialCounts[kind] }}</b><small>笔</small></div></div>
      <section class="lab-ledger-card material-card"><div class="material-card-head"><div><b>材料批次</b><span>{{ materialRecognitionBatch.source }} · {{ materialRecognitionBatch.fileName }}</span></div><span class="material-muted">采购经办：{{ materialRecognitionBatch.operator }}</span></div><div class="material-reminder"><div><b>{{ materialHandled ? '已登记处理' : '采购待处理' }}</b><span>加油 {{ oilItems.length }} 笔 · 已知金额 {{ oilKnown.toFixed(2) }} · 缺金额 {{ oilMissing }} 笔</span><em>未进入车辆氢费明细</em></div><div><Button @click="materialOpen = true">查看明细</Button><Button type="primary" @click="materialOpen = true">{{ materialHandled ? "修正处理" : "登记处理" }}</Button></div></div><div class="material-table"><div class="material-row material-row--head"><span>行号</span><span>品名</span><span>分类</span><span>金额</span><span>经办</span><span>说明</span></div><div v-for="item in materialItems" :key="item.id" class="material-row"><span class="oneos-number">{{ item.line }}</span><span>{{ item.itemName }}</span><span><Tag>{{ item.kind }}</Tag><small v-if="item.duplicate">重复材料，不重复事项</small></span><span class="oneos-number">{{ item.amount == null ? '—' : item.amount.toFixed(2) }}</span><span>{{ item.operator || '待分配' }}</span><span>{{ item.reason }}</span></div></div></section>
      <Modal :open="materialOpen" title="加油材料待处理" :footer="null" @cancel="materialOpen = false"><p>关闭提醒不会清除待处理事项；可重新查看。</p><div class="material-form"><label>承担方<Select aria-label="承担方" v-model:value="materialForm.owner" placeholder="待确认" :options="[{ value: '待确认', label: '待确认' }, { value: '客户承担', label: '客户承担' }, { value: '我司承担', label: '我司承担' }]" /></label><label>依据<Input v-model:value="materialForm.basis" placeholder="客户或合同依据" /></label><label>实际办理凭据<Input v-model:value="materialForm.proof" placeholder="凭据编号或说明" /></label><p v-if="materialInvalid" role="alert">{{ materialInvalid }}</p><p v-for="(item, index) in materialHistory" :key="index">登记 {{ index + 1 }}：{{ item.owner }} · {{ item.basis }} · {{ item.proof }}</p><div><Button @click="materialOpen = false">关闭提醒</Button><Button type="primary" @click="saveMaterial">{{ materialHandled ? "保存修正" : "登记处理" }}</Button></div></div></Modal>
    </div>
    <template v-else>
    <div class="validation-ledger">
      <div class="validation-metrics" aria-label="核验汇总">
        <div><span>记录数</span><b class="oneos-number">{{ metrics.count }}<small>条</small></b></div>
        <div><span>加氢量</span><b class="oneos-number">{{ metrics.quantity }}<small>kg</small></b></div>
        <div><span>成本合计</span><b class="oneos-number">{{ metrics.cost }}<small>元</small></b></div>
      </div>
      <section class="lab-ledger-card validation-ledger-card">
      <OneosToolbar label="数据核验筛选">
        <Input v-model:value="keyword" class="lab-search" aria-label="搜索订单、车牌或客户" placeholder="订单编号 / 车牌 / 客户" @press-enter="query"><template #prefix><SearchOutlined /></template></Input>
        <Select v-model:value="status" :options="filters" aria-label="全部核验状态" />
        <template #actions><Button @click="reset">重置</Button><Button type="primary" @click="query">查询</Button></template>
      </OneosToolbar>
      <div class="validation-business-row"><span>共 <b class="oneos-number">{{ shown.length }}</b> 条</span><span>核验提示可点击查看依据</span></div>
      <div v-if="notice" class="validation-notice" role="status">{{ notice }}<button type="button" aria-label="关闭反馈" @click="notice = ''">×</button></div>
      <VxeGrid :data="shown" :columns="columns" :border="false" :show-overflow="false" :row-config="{ keyField: 'id' }" :row-class-name="validationRowClass" class="lab-vxe-grid">
        <template #orderNo="{ row }"><div><div class="oneos-number lab-cell-primary">{{ row.orderNo }}</div><div class="oneos-number lab-cell-secondary">{{ row.time }}</div></div></template>
        <template #plate="{ row }"><span class="oneos-number">{{ row.plate }}</span></template>
        <template #customer="{ row }"><div class="validation-cell"><span class="oneos-validation-field" :data-status="row.customerCheck.status">{{ row.customer || '—' }}</span><OneosValidationIndicator v-bind="row.customerCheck" :facts="[{ label: '当前客户', value: row.customer || '—' }, { label: '登记客户', value: row.systemCustomer || '—' }]" :action-label="row.customerCheck.status === 'error' && row.systemCustomer ? '替换为登记客户' : undefined" :disabled="!row.replaceable" :disabled-reason="row.replaceable ? undefined : '记录已锁定，仅可查看核验依据。'" @action="replace(row, 'customer')" /></div></template>
        <template #quantity="{ row }"><span class="oneos-number">{{ formatValidationQuantity(row.quantity) }}</span></template>
        <template #cost="{ row }"><div class="validation-cell validation-cell--number"><span class="oneos-validation-field oneos-number" :data-status="row.costCheck.status">{{ formatValidationCost(row.cost) }}</span><OneosValidationIndicator v-bind="row.costCheck" :facts="[{ label: '当前成本', value: formatValidationCost(row.cost), mono: true }, { label: '标准成本', value: formatValidationCost(row.systemCost), mono: true }]" :action-label="row.costCheck.status === 'error' && row.systemCost != null ? '替换为标准成本' : undefined" :disabled="!row.replaceable" :disabled-reason="row.replaceable ? undefined : '记录已锁定，仅可查看核验依据。'" @action="replace(row, 'cost')" /></div></template>
        <template #record="{ row }"><OneosValidationIndicator v-bind="row.recordCheck" :show-label="true" /></template>
        <template #actions="{ row }"><div class="validation-actions"><Button type="text" class="validation-row-action" :disabled="!row.editable" @click="edit(row)">编辑</Button><Dropdown :trigger="['click']" :get-popup-container="getDropdownContainer"><button type="button" class="validation-more" :aria-label="`${row.orderNo} 更多操作`"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg></button><template #overlay><Menu><Menu.Item key="record" @click="showHistory(row)"><HistoryOutlined />核验记录</Menu.Item><Menu.Item key="copy" @click="copyOrder(row)"><CopyOutlined />复制订单编号</Menu.Item><Menu.Divider /><Menu.Item key="delete" :disabled="!row.editable" danger @click="deleting = row"><DeleteOutlined />删除</Menu.Item></Menu></template></Dropdown></div></template>
      </VxeGrid>
      <div class="validation-ledger-footer">疑似重复需人工核实；已锁定记录仅供查看。</div>
      </section>
    </div>
    <Modal :open="!!editing" title="编辑记录" ok-text="保存" cancel-text="取消" :mask-closable="false" @ok="saveEdit" @cancel="editing = undefined">
      <div class="validation-edit-form"><p>{{ editing?.orderNo }}</p><label>客户名称 <span>*</span><Input v-model:value="editCustomer" aria-label="客户名称" /></label><label>成本单价(元/kg) <span>*</span><Input v-model:value="editCost" aria-label="成本单价" inputmode="decimal" /></label><p v-if="invalid" role="alert">{{ invalid }}</p></div>
    </Modal>
    <Modal :open="!!deleting" title="删除记录" ok-text="删除" cancel-text="取消" :ok-button-props="{ danger: true }" @ok="deleting && remove(deleting)" @cancel="deleting = undefined"><p>确认删除订单 {{ deleting?.orderNo }}？</p><p>疑似重复提示本身不会删除记录。</p></Modal>
    <Modal :open="historyOpen" title="核验记录" :footer="null" @cancel="historyOpen = false"><p>{{ focused?.orderNo }}</p><div v-for="check in focused ? [focused.customerCheck, focused.costCheck, focused.recordCheck] : []" :key="check.title"><OneosValidationIndicator v-bind="check" :show-label="true" /><p v-for="detail in check.details" :key="detail">{{ detail }}</p></div></Modal></template>
  </OneosPage>
</template>

<style scoped>
.validation-ledger{min-width:0;width:100%}.validation-ledger-card{min-width:0;width:100%;box-sizing:border-box}.lab-vxe-grid{width:100%;max-width:100%}
.validation-ledger :deep(.vxe-body--column){height:56px;padding-block:4px!important}.validation-ledger :deep(.lab-cell-primary){font-size:13px;line-height:20px}.validation-ledger :deep(.lab-cell-secondary){font-size:12px;line-height:20px;margin-top:2px}

.validation-metrics { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--oneos-line);border-radius:10px;background:var(--oneos-surface);margin-bottom:16px; }
.validation-metrics>div { padding:15px 20px;border-right:1px solid var(--oneos-line-soft); }.validation-metrics>div:last-child{border-right:0}.validation-metrics span{display:block;color:var(--oneos-muted);font-size:12px}.validation-metrics b{display:block;margin-top:5px;font-size:22px;font-weight:600;color:var(--oneos-ink)}.validation-metrics small{margin-left:4px;font-size:12px;font-weight:400;color:var(--oneos-muted)}
.validation-ledger-card{overflow:hidden;background:var(--oneos-surface);border:1px solid var(--oneos-line);border-radius:10px}.validation-business-row,.validation-ledger-footer{display:flex;justify-content:space-between;gap:12px;padding:10px 16px;color:var(--oneos-muted);font-size:12px;border-bottom:1px solid var(--oneos-line-soft)}.validation-ledger-footer{border-top:1px solid var(--oneos-line-soft);border-bottom:0}.validation-cell,.validation-actions{display:flex;align-items:center;gap:4px;min-width:0}.validation-cell>.oneos-validation-field{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.validation-actions{justify-content:flex-end;gap:2px}.validation-cell--number{justify-content:flex-end}.validation-row-action.ant-btn{height:32px;padding:0 8px;color:var(--oneos-body);font-weight:400}.validation-row-action.ant-btn:hover{color:var(--oneos-primary)}.validation-more{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--oneos-body);cursor:pointer}.validation-more:hover{color:var(--oneos-primary);background:var(--oneos-hover)}.validation-more svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.75}.validation-notice{padding:8px 16px;color:var(--oneos-body);font-size:12px}.validation-notice button{margin-left:8px;border:0;background:transparent;color:inherit;cursor:pointer}@media(max-width:767px){.validation-metrics{grid-template-columns:1fr}.validation-metrics>div{border-right:0;border-bottom:1px solid var(--oneos-line-soft)}.validation-metrics>div:last-child{border-bottom:0}}
.validation-edit-form{display:grid;gap:16px}.validation-edit-form label{display:block;font-size:13px}.validation-edit-form label span,.validation-edit-form [role="alert"]{color:var(--oneos-error)}.validation-edit-form .ant-input{display:block;margin-top:8px}.validation-row-action.ant-btn:disabled{color:var(--oneos-muted);background:transparent}
.validation-sample-tabs{display:flex;gap:4px;margin-bottom:12px}.validation-sample-tabs button{height:32px;padding:0 12px;border:0;border-radius:6px;background:transparent;color:var(--oneos-body);cursor:pointer}.validation-sample-tabs button[aria-selected="true"]{background:var(--oneos-primary);color:#fff}.material-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--oneos-line);border-radius:10px;overflow:hidden;margin-bottom:12px}.material-summary>div{padding:14px 18px;border-right:1px solid var(--oneos-line-soft)}.material-summary>div:last-child{border:0}.material-summary span,.material-summary small,.material-card-head span,.material-muted{font-size:12px;color:var(--oneos-muted)}.material-summary b{margin:0 4px;font-size:20px}.material-card{overflow:hidden}.material-card-head,.material-reminder{display:flex;justify-content:space-between;gap:16px;padding:12px 16px;border-bottom:1px solid var(--oneos-line-soft)}.material-card-head b,.material-card-head span,.material-reminder b,.material-reminder span,.material-reminder em{display:block}.material-reminder{align-items:center;background:color-mix(in srgb,var(--oneos-warning) 7%,var(--oneos-surface))}.material-reminder em{margin-top:4px;font-size:12px;color:var(--oneos-warning)}.material-reminder>div:last-child{display:flex;gap:8px}.material-table{min-width:760px}.material-row{display:grid;grid-template-columns:64px 1.1fr 1fr 110px 120px 1.8fr;gap:12px;padding:10px 16px;border-bottom:1px solid var(--oneos-line-soft);font-size:13px}.material-row--head{font-size:12px;font-weight:600;color:var(--oneos-muted);background:var(--oneos-fill)}.material-row i{font-style:normal}.material-row i[data-kind="氢气"]{color:var(--oneos-success)}.material-row i[data-kind="加油"]{color:var(--oneos-warning)}.material-row i[data-kind="待识别"]{color:var(--oneos-muted)}.material-row small{display:block;margin-top:3px;color:var(--oneos-muted);font-size:11px}.material-form{display:grid;gap:12px}.material-form label{font-size:13px;color:var(--oneos-body)}.material-form [role="alert"]{color:var(--oneos-error)}.material-form>div{display:flex;justify-content:flex-end;gap:8px}@media(max-width:767px){.material-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.material-summary>div:nth-child(2){border-right:0}.material-summary>div{border-bottom:1px solid var(--oneos-line-soft)}.material-card-head,.material-reminder{align-items:flex-start;flex-direction:column}.material-table{overflow:auto}}
</style>
