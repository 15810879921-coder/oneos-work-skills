<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Menu,
  Pagination,
  Select,
  Spin,
  Tag,
} from 'ant-design-vue';
import {
  CheckCircleOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import { VxeGrid, type VxeGridProps } from 'vxe-table';
import {
  OneosPage,
  OneosToolbar,
} from '../../src/components/oneos-design/patterns';
import {
  getExampleOperationRows,
  INSURANCE_EXAMPLES,
  RISK_LABEL,
  type InsuranceExampleRow,
  type InsuranceRisk,
} from './multi-action-fixtures';
import './multi-action.css';

type Panel =
  | 'compare-list'
  | 'compare-create'
  | 'recognize'
  | 'tasks'
  | 'import'
  | 'export'
  | 'download'
  | 'maintenance'
  | 'add'
  | 'detail';
const props = defineProps<{
  scenario: 'normal' | 'empty' | 'loading' | 'error';
  readonly: boolean;
}>();
const emit = defineEmits<{ retry: [] }>();
const vehicles = ref(INSURANCE_EXAMPLES.map((row) => ({ ...row })));
const draft = reactive({
  text: '',
  customer: undefined as string | undefined,
  operation: undefined as string | undefined,
});
const applied = ref({ ...draft });
const risk = ref<InsuranceRisk | 'all'>('all');
const page = ref(1);
const pageSize = 8;
const selectedIds = ref<string[]>([]);
const unavailable = computed(
  () => props.scenario === 'loading' || props.scenario === 'error',
);
const baseRows = computed(() =>
  props.scenario === 'empty'
    ? []
    : vehicles.value.filter((row) => {
        const q = applied.value;
        return (
          (!q.text ||
            [row.plate, row.vin].some((value) =>
              value.toLowerCase().includes(q.text.toLowerCase()),
            )) &&
          (!q.customer || row.customer === q.customer) &&
          (!q.operation || row.operation === q.operation)
        );
      }),
);
const filtered = computed(() =>
  baseRows.value.filter(
    (row) => risk.value === 'all' || row.risk === risk.value,
  ),
);
const shown = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);
const selected = computed(() =>
  vehicles.value.filter((row) => selectedIds.value.includes(row.id)),
);
const currentSelected = computed(
  () => shown.value.filter((row) => selectedIds.value.includes(row.id)).length,
);
const selectedElsewhere = computed(
  () => selected.value.length - currentSelected.value,
);
const customerOptions = [
  ...new Set(INSURANCE_EXAMPLES.map((row) => row.customer)),
].map((value) => ({ value, label: value }));
const metrics = computed(() => [
  { key: 'all' as const, label: '台账车辆', detail: '当前查询范围', value: baseRows.value.length },
  {
    key: 'warning' as const,
    label: '临期预警',
    detail: '即将到期需处理',
    value: baseRows.value.filter((row) => row.risk === 'warning').length,
  },
  {
    key: 'expired' as const,
    label: '核心险种逾期',
    detail: '点击筛选逾期车辆',
    value: baseRows.value.filter((row) => row.risk === 'expired').length,
  },
  {
    key: 'missing' as const,
    label: '核心险种待购',
    detail: '点击筛选待购车辆',
    value: baseRows.value.filter((row) => row.risk === 'missing').length,
  },
]);
const columns = computed<VxeGridProps<InsuranceExampleRow>['columns']>(() => [
  ...(!props.readonly
    ? [
        {
          field: 'selection',
          width: 44,
          fixed: 'left' as const,
          slots: { header: 'selectAll', default: 'selection' },
        },
      ]
    : []),
  {
    field: 'plate',
    title: '车辆 / 车型',
    width: 174,
    slots: { default: 'vehicle' },
  },
  {
    field: 'customer',
    title: '客户 / 归属公司',
    minWidth: 166,
    slots: { default: 'customer' },
  },
  {
    field: 'risk',
    title: '保险状态 / 跟进人',
    width: 152,
    slots: { default: 'risk' },
  },
  {
    field: 'compulsory',
    title: '交强险到期',
    width: 156,
    slots: { default: 'compulsory' },
  },
  {
    field: 'commercial',
    title: '商业险到期',
    width: 156,
    slots: { default: 'commercial' },
  },
  {
    field: 'attachments',
    title: '保单附件 / 更新',
    width: 138,
    slots: { default: 'attachments' },
  },
  {
    field: 'actions',
    title: '操作',
    width: 110,
    fixed: 'right',
    slots: { default: 'actions' },
  },
]);
function query() {
  applied.value = { ...draft, text: draft.text.trim() };
  page.value = 1;
}
function reset() {
  draft.text = '';
  draft.customer = undefined;
  draft.operation = undefined;
  risk.value = 'all';
  selectedIds.value = [];
  query();
  emit('retry');
}
function chooseRisk(next: InsuranceRisk | 'all') {
  risk.value = next;
  page.value = 1;
}
function selectRow(id: string, checked: boolean) {
  selectedIds.value = checked
    ? [...new Set([...selectedIds.value, id])]
    : selectedIds.value.filter((key) => key !== id);
}
function selectPage(checked: boolean) {
  const pageIds = new Set(shown.value.map((row) => row.id));
  selectedIds.value = checked
    ? [...new Set([...selectedIds.value, ...pageIds])]
    : selectedIds.value.filter((id) => !pageIds.has(id));
}
watch(
  () => [props.readonly, props.scenario],
  () => {
    selectedIds.value = [];
    panel.value = undefined;
    page.value = 1;
  },
);

const panel = ref<Panel>();
const panelTitle: Record<Panel, string> = {
  'compare-list': '比价单管理',
  'compare-create': '一键发起比价单',
  recognize: '保单批量识别',
  tasks: '识别任务记录',
  import: '批量导入',
  export: '导出台账',
  download: '下载保单',
  maintenance: '状态纠正',
  add: '新增保单',
  detail: '车辆保险管理',
};
const panelStage = ref<'start' | 'files' | 'result'>('start');
const panelError = ref('');
const focused = ref<InsuranceExampleRow>(vehicles.value[0]!);
const scopedRows = ref<InsuranceExampleRow[]>([]);
const scopeLabel = ref('');
const feedback = ref('');
const compareTypes = ref<string[]>(['交强险', '商业险']);
const compareRemark = ref('');
const expandedCompare = ref('');
const comparisons = ref([
  {
    code: 'BJ-20260911-003',
    title: '华东区域 9 月续保比价',
    count: 4,
    status: '待报价',
    rows: vehicles.value.slice(0, 4),
  },
  {
    code: 'BJ-20260909-002',
    title: '南海车队保险采购',
    count: 2,
    status: '审核中',
    rows: vehicles.value.slice(6, 8),
  },
]);
const tasks = ref([
  { id: 'TASK-003', file: '嘉兴运力_续保单.pdf', count: 4, status: '待确认' },
  { id: 'TASK-002', file: '南海车队_商业险.pdf', count: 2, status: '待确认' },
  { id: 'TASK-001', file: '临平冷链_保单.pdf', count: 1, status: '识别失败' },
]);
const pendingTasks = computed(
  () => tasks.value.filter((task) => task.status === '待确认').length,
);
const activeTaskId = ref('');
const newPolicy = reactive({
  vehicleId: '',
  type: undefined as string | undefined,
  number: '',
  start: '',
  end: '',
});
const savedPolicies = ref<
  {
    vehicleId: string;
    type: string;
    number: string;
    start: string;
    end: string;
  }[]
>([]);
const reviewRecords = computed(() => {
  const count =
    panel.value === 'import'
      ? 3
      : tasks.value.find((task) => task.id === activeTaskId.value)?.count || 2;
  return Array.from({ length: count }, (_, index) => ({
    plate: vehicles.value[Math.floor(index / 2)]!.plate,
    type: index % 2 ? '商业险' : '交强险',
    end: index % 2 ? '2027-09-29' : '2027-09-22',
  }));
});
const canOpen = (action: Panel) =>
  !props.readonly ||
  ['compare-list', 'tasks', 'detail', 'export', 'download'].includes(action);
function open(action: Panel, row?: InsuranceExampleRow) {
  if (!canOpen(action)) return;
  if (
    ['download', 'export', 'maintenance', 'compare-create'].includes(action) &&
    unavailable.value
  )
    return;
  if (action === 'compare-create' && !selected.value.length) return;
  panelStage.value = 'start';
  panelError.value = '';
  feedback.value = '';
  activeTaskId.value = '';
  if (row) focused.value = row;
  if (action === 'export' || action === 'download') {
    scopedRows.value = getExampleOperationRows(
      action,
      vehicles.value,
      filtered.value,
      selectedIds.value,
    );
    scopeLabel.value =
      action === 'download' && selected.value.length
        ? '已勾选车辆（包含跨页选择）'
        : '当前筛选结果（全部页）';
  } else if (action === 'compare-create') {
    scopedRows.value = [...selected.value];
    compareTypes.value = ['交强险', '商业险'];
    compareRemark.value = '';
  } else if (action === 'maintenance') {
    scopedRows.value = [...filtered.value];
  }
  if (action === 'add') {
    newPolicy.vehicleId = row?.id || '';
    newPolicy.type = undefined;
    newPolicy.number = '';
    newPolicy.start = '';
    newPolicy.end = '';
  }
  panel.value = action;
}
function menuAction(key: string | number) {
  open(String(key) as Panel);
}
function saveCompare() {
  if (!compareTypes.value.length) {
    panelError.value = '请至少选择一种险种';
    return;
  }
  const code =
    'BJ-DEMO-' + String(comparisons.value.length + 1).padStart(3, '0');
  comparisons.value.unshift({
    code,
    title: compareRemark.value.trim() || '所选车辆保险比价',
    count: scopedRows.value.length,
    status: '草稿',
    rows: [...scopedRows.value],
  });
  feedback.value = code + ' · ' + scopedRows.value.length + ' 辆车';
  panelStage.value = 'result';
  panelError.value = '';
}
function startRecognition() {
  const task = {
    id: 'TASK-DEMO-' + (tasks.value.length + 1),
    file: '示例保单_交强险与商业险.pdf',
    count: 2,
    status: '待确认',
  };
  tasks.value.unshift(task);
  activeTaskId.value = task.id;
  panelStage.value = 'result';
}
function reviewTask(id: string) {
  activeTaskId.value = id;
  panel.value = 'recognize';
  panelStage.value = 'result';
  panelError.value = '';
  feedback.value = '';
}
function confirmTask() {
  const task = tasks.value.find((item) => item.id === activeTaskId.value);
  if (task) task.status = '已确认';
  open('tasks');
}
function savePolicy() {
  if (
    !newPolicy.vehicleId ||
    !newPolicy.type ||
    !newPolicy.number.trim() ||
    !newPolicy.start ||
    !newPolicy.end
  ) {
    panelError.value = '请填写车辆、险种、保单号和保险期间';
    return;
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(newPolicy.start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(newPolicy.end) ||
    newPolicy.end < newPolicy.start
  ) {
    panelError.value = '请填写正确的保险期间，到期日不能早于生效日';
    return;
  }
  const row = vehicles.value.find((item) => item.id === newPolicy.vehicleId);
  if (row) {
    if (newPolicy.type === '交强险') row.compulsory = newPolicy.end;
    if (newPolicy.type === '商业险') row.commercial = newPolicy.end;
    row.updated = '2026-09-11';
    focused.value = row;
    savedPolicies.value.unshift({ ...newPolicy, type: newPolicy.type });
  }
  feedback.value = newPolicy.number.trim();
  panelError.value = '';
  panelStage.value = 'result';
}
function popupContainer(trigger: HTMLElement) {
  return (
    (trigger.closest('.oneos-surface') as HTMLElement) || trigger.parentElement!
  );
}
</script>

<template>
  <div class="multi-host">
    <OneosPage
      kind="ledger"
      label="保险采购多操作台账"
      class="lab-ledger-review multi-ledger"
    >
      <template #summary>
        <div class="lab-metrics" :aria-busy="scenario === 'loading'">
          <button
            v-for="item in metrics"
            :key="item.key"
            type="button"
            :aria-pressed="risk === item.key"
            @click="chooseRisk(item.key)"
          >
            <div class="lab-metric-label">{{ item.label }}</div>
            <div class="lab-metric-value oneos-number">
              {{ unavailable ? '—' : item.value }}<small>辆</small>
            </div>
            <span class="lab-metric-description">{{ item.detail }}</span>
          </button>
        </div>
      </template>
      <div class="lab-ledger-card">
        <OneosToolbar>
          <Input
            v-model:value="draft.text"
            aria-label="搜索车牌或VIN"
            placeholder="车牌 / VIN"
            allow-clear
            class="lab-search"
            @press-enter="query"
            ><template #prefix><SearchOutlined /></template
          ></Input>
          <Select
            v-model:value="draft.customer"
            aria-label="客户"
            placeholder="全部客户"
            allow-clear
            :options="customerOptions"
            class="lab-filter"
            :get-popup-container="popupContainer"
          />
          <Select
            v-model:value="draft.operation"
            aria-label="运营状态"
            placeholder="运营状态"
            allow-clear
            :options="[
              { value: '在租', label: '在租' },
              { value: '待租', label: '待租' },
            ]"
            class="lab-filter"
            :get-popup-container="popupContainer"
          />
          <template #actions
            ><Button @click="reset">重置</Button
            ><Button type="primary" @click="query">查询</Button></template
          >
        </OneosToolbar>

        <div
          class="multi-actions"
          :class="{ 'is-selected': selected.length }"
          role="group"
          :aria-label="selected.length ? '批量操作' : '保险业务操作'"
        >
          <template v-if="selected.length">
            <div class="multi-action-group">
              <span class="multi-selection-count" role="status"
                >已选 <b class="oneos-number">{{ selected.length }}</b> 辆<span
                  v-if="selectedElsewhere"
                  class="multi-selection-outside"
                >
                  · 当前页外 {{ selectedElsewhere }} 辆</span
                ></span
              >
              <Button
                type="primary"
                :disabled="unavailable"
                @click="open('compare-create')"
                >一键发起比价单</Button
              >
              <Button :disabled="unavailable" @click="open('download')"
                >下载所选保单</Button
              >
            </div>
            <div class="multi-action-group">
              <Dropdown
                :trigger="['click']"
                :get-popup-container="popupContainer"
              >
                <Button>其他操作 <DownOutlined /></Button>
                <template #overlay
                  ><Menu @click="({ key }) => menuAction(key)">
                    <Menu.Item key="compare-list">比价单管理</Menu.Item
                    ><Menu.Item key="recognize">保单批量识别</Menu.Item
                    ><Menu.Item key="tasks">识别任务记录</Menu.Item>
                    <Menu.Divider /><Menu.Item key="import">批量导入</Menu.Item
                    ><Menu.Item
                      key="export"
                      :disabled="unavailable || !filtered.length"
                      >导出台账（当前筛选）</Menu.Item
                    ><Menu.Item key="add">新增保单</Menu.Item>
                    <Menu.Divider /><Menu.Item
                      key="maintenance"
                      :disabled="unavailable || !filtered.length"
                      >状态纠正</Menu.Item
                    >
                  </Menu></template
                >
              </Dropdown>
              <Button type="text" @click="selectedIds = []">取消选择</Button>
            </div>
          </template>
          <template v-else>
            <div class="multi-action-group">
              <Button v-if="!readonly" type="primary" @click="open('add')"><PlusOutlined />新增保单</Button>
              <Button v-if="!readonly" @click="menuAction('import')">批量导入</Button>
              <Button :disabled="unavailable || !filtered.length" @click="menuAction('export')">导出台账（当前筛选）</Button>
              <Button :disabled="unavailable || !filtered.length" @click="menuAction('download')">下载保单（当前筛选）</Button>
              <Button @click="open('compare-list')">比价单管理</Button>
              <Button v-if="!readonly" @click="open('recognize')"><FileSearchOutlined />保单批量识别</Button>
              <Button @click="open('tasks')">识别任务记录<span v-if="pendingTasks" class="multi-task-count">{{ pendingTasks }}</span></Button>
              <Button v-if="!readonly" :disabled="unavailable || !filtered.length" @click="menuAction('maintenance')">状态纠正</Button>
            </div>
          </template>
        </div>

        <div v-if="scenario === 'error'" class="lab-table-message" role="alert">
          <ExclamationCircleOutlined class="lab-error-icon" />
          <h3>保险台账加载失败</h3>
          <p>请重试获取列表</p>
          <Button @click="emit('retry')"><ReloadOutlined />重新加载</Button>
        </div>
        <div
          v-else-if="scenario === 'loading'"
          class="lab-table-message"
          role="status"
        >
          <Spin />
          <h3>正在加载保险台账</h3>
        </div>
        <div v-else-if="!filtered.length" class="lab-table-message">
          <Empty
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            description="没有符合条件的车辆"
            ><Button @click="reset">清空筛选</Button></Empty
          >
        </div>
        <div v-else class="lab-grid-wrap">
          <VxeGrid
            :key="readonly ? 'read' : 'edit'"
            :columns="columns"
            :data="shown"
            :row-config="{ keyField: 'id', isHover: true }"
            :column-config="{ resizable: true }"
            height="auto"
            :border="false"
            :show-overflow="false"
          >
            <template #selectAll
              ><Checkbox
                aria-label="选择当前页全部车辆"
                :checked="shown.length > 0 && currentSelected === shown.length"
                :indeterminate="
                  currentSelected > 0 && currentSelected < shown.length
                "
                @change="selectPage($event.target.checked)"
            /></template>
            <template #selection="{ row }"
              ><Checkbox
                :aria-label="'选择 ' + row.plate"
                :checked="selectedIds.includes(row.id)"
                @change="selectRow(row.id, $event.target.checked)"
            /></template>
            <template #vehicle="{ row }"
              ><div class="oneos-number lab-cell-primary">{{ row.plate }}</div>
              <div class="lab-cell-secondary">{{ row.model }}</div></template
            >
            <template #customer="{ row }"
              ><div class="lab-cell-primary">{{ row.customer }}</div>
              <div class="lab-cell-secondary">{{ row.company }}</div></template
            >
            <template #risk="{ row }"
              ><span :class="['multi-risk', 'is-' + row.risk]"
                ><i />{{ RISK_LABEL[row.risk as InsuranceRisk] }}</span
              >
              <div class="lab-cell-secondary">{{ row.owner }}</div></template
            >
            <template #compulsory="{ row }"
              ><div class="oneos-number">{{ row.compulsory || '—' }}</div>
              <div class="lab-cell-secondary">
                {{ row.compulsory ? '交强险' : '未录入' }}
              </div></template
            >
            <template #commercial="{ row }"
              ><div class="oneos-number">{{ row.commercial || '—' }}</div>
              <div class="lab-cell-secondary">
                {{ row.commercial ? '商业险' : '未录入' }}
              </div></template
            >
            <template #attachments="{ row }"
              ><div>
                <span class="oneos-number">{{ row.attachments }}</span> 份
              </div>
              <div class="lab-cell-secondary oneos-number">
                {{ row.updated }}
              </div></template
            >
            <template #actions="{ row }"
              ><Button
                type="link"
                class="lab-row-action"
                @click="open('detail', row)"
                >{{ readonly ? '查看' : '管理' }}</Button
              ></template
            >
          </VxeGrid>
        </div>
        <div class="lab-pagination">
          <span class="oneos-secondary"
            >共
            <b class="oneos-number">{{
              unavailable ? '—' : filtered.length
            }}</b>
            辆<span v-if="selected.length">
              · 已选 {{ selected.length }} 辆</span
            ></span
          ><Pagination
            v-model:current="page"
            :total="filtered.length"
            :page-size="pageSize"
            :show-size-changer="false"
            :disabled="unavailable"
          />
        </div>
      </div>
    </OneosPage>

    <Drawer
      :open="!!panel"
      :title="panel ? panelTitle[panel] : ''"
      placement="right"
      width="min(720px, 100vw)"
      :get-container="false"
      root-class-name="multi-drawer"
      @close="panel = undefined"
    >
      <div class="multi-panel-sample">设计规范示例 · 仅本页模拟数据</div>
      <Alert
        v-if="panelError"
        type="error"
        :message="panelError"
        show-icon
        class="multi-panel-alert"
      />

      <template v-if="panel === 'export' || panel === 'download'">
        <div class="multi-scope-card">
          <span>{{ scopeLabel }}</span
          ><strong
            ><span class="oneos-number">{{ scopedRows.length }}</span> 辆<span
              v-if="panel === 'download'"
            >
              ·
              {{
                scopedRows.reduce((n, row) => n + row.attachments, 0)
              }}
              份保单附件</span
            ></strong
          >
          <p>
            {{
              panel === 'export'
                ? '导出整个已筛集合，不受分页或勾选影响。'
                : '下载范围与上方车辆清单一致。'
            }}
          </p>
        </div>
        <div class="multi-scope-list">
          <div v-for="row in scopedRows" :key="row.id">
            <span class="oneos-number">{{ row.plate }}</span
            ><span>{{ row.customer }}</span
            ><span v-if="panel === 'download'"
              >{{ row.attachments }} 份附件</span
            >
          </div>
        </div>
        <div class="multi-file-card">
          <FileSearchOutlined />
          <div>
            <strong>{{
              panel === 'export'
                ? '保险台账_当前筛选.xlsx'
                : '保单附件_当前范围.zip'
            }}</strong>
            <p>示例文件清单；不下载真实业务文件</p>
          </div>
        </div>
      </template>

      <template v-else-if="panel === 'compare-create'">
        <template v-if="panelStage !== 'result'">
          <div class="multi-scope-card">
            <span>按所选车辆创建</span
            ><strong>{{ scopedRows.length }} 辆车</strong>
          </div>
          <div class="multi-scope-list">
            <div v-for="row in scopedRows" :key="row.id">
              <span class="oneos-number">{{ row.plate }}</span
              ><span>{{ row.customer }}</span>
            </div>
          </div>
          <Form layout="vertical" class="multi-panel-form"
            ><Form.Item label="比价险种" required
              ><Checkbox.Group
                v-model:value="compareTypes"
                :options="[
                  '交强险',
                  '商业险',
                  '承运险',
                  '货物险',
                  '驾意险',
                ]" /></Form.Item
            ><Form.Item label="比价说明"
              ><Input.TextArea
                v-model:value="compareRemark"
                placeholder="例如：华东区域 9 月续保比价"
                :rows="3" /></Form.Item
          ></Form>
        </template>
        <div v-else class="multi-result">
          <CheckCircleOutlined />
          <h2>比价单草稿已保存</h2>
          <p>{{ feedback }}</p>
          <p>尚未提交采购审核，保单台账保持独立。</p>
          <Button @click="open('compare-list')">查看比价单</Button>
        </div>
      </template>

      <template v-else-if="panel === 'compare-list'">
        <div class="multi-panel-heading">
          <span>共 {{ comparisons.length }} 张比价单</span
          ><span class="oneos-secondary">采购申请与保单录入分别维护</span>
        </div>
        <article
          v-for="sheet in comparisons"
          :key="sheet.code"
          class="multi-record-card"
        >
          <div class="multi-record-title">
            <strong>{{ sheet.title }}</strong
            ><Tag>{{ sheet.status }}</Tag>
          </div>
          <div class="oneos-number multi-record-code">{{ sheet.code }}</div>
          <div class="multi-record-bottom">
            <span>{{ sheet.count }} 辆车</span
            ><Button
              type="link"
              @click="
                expandedCompare =
                  expandedCompare === sheet.code ? '' : sheet.code
              "
              >{{
                expandedCompare === sheet.code ? '收起车辆' : '查看车辆'
              }}</Button
            >
          </div>
          <div
            v-if="expandedCompare === sheet.code"
            class="multi-scope-list multi-review-records"
          >
            <div v-for="row in sheet.rows" :key="row.id">
              <span class="oneos-number">{{ row.plate }}</span
              ><span>{{ row.customer }}</span
              ><Button type="link" @click="open('detail', row)">管理</Button>
            </div>
          </div>
        </article>
      </template>

      <template v-else-if="panel === 'recognize' || panel === 'import'">
        <template v-if="panelStage !== 'result'">
          <div class="multi-upload">
            <UploadOutlined />
            <h3>
              {{ panel === 'recognize' ? '上传保单文件' : '上传保单导入表' }}
            </h3>
            <p>
              {{
                panel === 'recognize'
                  ? '保单 PDF、图片'
                  : 'Excel 保单新增 / 续保模板'
              }}
            </p>
            <Button @click="panelStage = 'files'">使用示例文件</Button>
          </div>
          <div v-if="panelStage === 'files'" class="multi-file-card">
            <FileSearchOutlined />
            <div>
              <strong>{{
                panel === 'recognize'
                  ? '示例保单_交强险与商业险.pdf'
                  : '保单新增续保_示例.xlsx'
              }}</strong>
              <p>
                {{
                  panel === 'recognize'
                    ? '2 页 · 待识别'
                    : '3 条示例记录 · 待校验'
                }}
              </p>
            </div>
            <CheckCircleOutlined />
          </div>
          <p class="multi-panel-note">
            此处使用内置文件展示操作过程，不上传本机文件。
          </p>
        </template>
        <template v-else>
          <Alert
            type="success"
            :message="
              panel === 'recognize'
                ? '识别完成，待核对'
                : '校验完成：3 条记录可导入'
            "
            show-icon
          />
          <div class="multi-scope-list multi-review-records">
            <div v-for="(record, index) in reviewRecords" :key="index">
              <span class="oneos-number">{{ record.plate }}</span
              ><span>{{ record.type }}</span
              ><span>{{ record.end }} 到期</span>
            </div>
          </div>
          <p class="multi-panel-note">
            示例字段供核对。实际保险有效性与录入校验沿用业务页面。
          </p>
        </template>
      </template>

      <template v-else-if="panel === 'tasks'">
        <div class="multi-panel-heading">
          <span>待确认 {{ pendingTasks }} 项</span
          ><Button v-if="!readonly" @click="open('recognize')"
            >新建识别任务</Button
          >
        </div>
        <article v-for="task in tasks" :key="task.id" class="multi-record-card">
          <div class="multi-record-title">
            <strong>{{ task.file }}</strong
            ><Tag :color="task.status === '识别失败' ? 'error' : undefined">{{
              task.status
            }}</Tag>
          </div>
          <div class="multi-record-bottom">
            <span>{{ task.count }} 条识别记录</span
            ><Button
              v-if="task.status === '待确认'"
              type="link"
              @click="reviewTask(task.id)"
              >{{ readonly ? '查看' : '核对' }}</Button
            ><Button
              v-else-if="task.status === '识别失败' && !readonly"
              type="link"
              @click="task.status = '待确认'"
              >重新识别</Button
            ><span v-else class="oneos-secondary">{{ task.status === '已确认' ? '已完成核对' : '待处理' }}</span>
          </div>
          <p v-if="task.status === '识别失败'" class="multi-panel-note">
            文件内容不清晰，请重新识别或补充文件。
          </p>
        </article>
      </template>

      <template v-else-if="panel === 'add'">
        <Form
          v-if="panelStage !== 'result'"
          :model="newPolicy"
          layout="vertical"
          class="multi-panel-form"
        >
          <Form.Item
            ><label class="multi-control-label"
              ><span>车辆 <em>*</em></span
              ><Select
                v-model:value="newPolicy.vehicleId"
                aria-label="新增保单车辆"
                placeholder="选择车辆"
                show-search
                option-filter-prop="label"
                :options="
                  vehicles.map((row) => ({
                    value: row.id,
                    label: row.plate + ' · ' + row.customer,
                  }))
                "
                :get-popup-container="popupContainer" /></label
          ></Form.Item>
          <div class="multi-form-grid">
            <Form.Item
              ><label class="multi-control-label"
                ><span>险种 <em>*</em></span
                ><Select
                  v-model:value="newPolicy.type"
                  aria-label="保单险种"
                  placeholder="选择险种"
                  :options="
                    ['交强险', '商业险'].map((value) => ({
                      value,
                      label: value,
                    }))
                  "
                  :get-popup-container="popupContainer" /></label></Form.Item
            ><Form.Item label="保单号" name="number" required
              ><Input
                v-model:value="newPolicy.number"
                aria-label="保单号"
                placeholder="请输入保单号" /></Form.Item
            ><Form.Item label="生效日期" name="start" required
              ><DatePicker
                v-model:value="newPolicy.start"
                aria-label="保单生效日期"
                value-format="YYYY-MM-DD"
                :get-popup-container="popupContainer" /></Form.Item
            ><Form.Item label="到期日期" name="end" required
              ><DatePicker
                v-model:value="newPolicy.end"
                aria-label="保单到期日期"
                value-format="YYYY-MM-DD"
                :get-popup-container="popupContainer"
            /></Form.Item>
          </div>
          <p class="multi-panel-note">
            本页只演示基础录入和保存回显，完整字段、校验与附件要求由保险采购业务表单承载。
          </p>
        </Form>
        <div v-else class="multi-result">
          <CheckCircleOutlined />
          <h2>已保存到本页样例</h2>
          <p class="oneos-number">{{ feedback }}</p>
          <Button @click="open('detail', focused)">查看车辆保险</Button>
        </div>
      </template>

      <template v-else-if="panel === 'detail'">
        <div class="multi-detail-identity">
          <strong class="oneos-number">{{ focused.plate }}</strong
          ><span>{{ focused.model }}</span>
        </div>
        <dl class="multi-description">
          <div>
            <dt>客户</dt>
            <dd>{{ focused.customer }}</dd>
          </div>
          <div>
            <dt>归属公司</dt>
            <dd>{{ focused.company }}</dd>
          </div>
          <div>
            <dt>VIN</dt>
            <dd class="oneos-number">{{ focused.vin }}</dd>
          </div>
          <div>
            <dt>跟进人</dt>
            <dd>{{ focused.owner }}</dd>
          </div>
        </dl>
        <div class="multi-section-heading">
          <h3>保单记录</h3>
          <Button v-if="!readonly" @click="open('add', focused)"
            >新增保单</Button
          >
        </div>
        <article
          v-for="type in ['交强险', '商业险']"
          :key="type"
          class="multi-record-card"
        >
          <div class="multi-record-title">
            <strong>{{ type }}</strong
            ><span class="oneos-secondary">{{
              (type === '交强险' ? focused.compulsory : focused.commercial)
                ? '已录入'
                : '未录入'
            }}</span>
          </div>
          <div class="multi-record-bottom">
            <span>到期日期</span
            ><span class="oneos-number">{{
              (type === '交强险' ? focused.compulsory : focused.commercial) ||
              '—'
            }}</span>
          </div>
        </article>
        <template
          v-if="savedPolicies.some((item) => item.vehicleId === focused.id)"
          ><h3 class="multi-subheading">本页新增记录</h3>
          <article
            v-for="policy in savedPolicies.filter(
              (item) => item.vehicleId === focused.id,
            )"
            :key="policy.number"
            class="multi-record-card"
          >
            <div class="multi-record-title">
              <strong>{{ policy.type }}</strong
              ><span class="oneos-number">{{ policy.number }}</span>
            </div>
            <div class="multi-record-bottom oneos-number">
              {{ policy.start }} 至 {{ policy.end }}
            </div>
          </article></template
        >
      </template>

      <template v-else-if="panel === 'maintenance'">
        <template v-if="panelStage !== 'result'"
          ><Alert
            message="状态纠正"
            description="核对当前筛选车辆的保险状态。示例不会调用业务同步接口。"
            type="warning"
            show-icon
          />
          <div class="multi-scope-card">
            <span>本次检查范围</span
            ><strong>{{ scopedRows.length }} 辆车</strong>
          </div></template
        >
        <div v-else class="multi-result">
          <CheckCircleOutlined />
          <h2>示例检查已完成</h2>
          <p>{{ scopedRows.length }} 辆车已核对，未改动真实业务状态。</p>
        </div>
      </template>

      <template #footer>
        <div class="multi-drawer-footer">
          <span class="oneos-secondary">仅本页示例</span>
          <div>
            <Button @click="panel = undefined">关闭</Button>
            <Button
              v-if="panel === 'compare-create' && panelStage !== 'result'"
              type="primary"
              @click="saveCompare"
              >保存比价单草稿</Button
            >
            <Button
              v-if="panel === 'add' && panelStage !== 'result'"
              type="primary"
              @click="savePolicy"
              >保存</Button
            >
            <Button
              v-if="panel === 'recognize' && panelStage !== 'result'"
              type="primary"
              :disabled="panelStage !== 'files'"
              @click="startRecognition"
              >开始识别</Button
            >
            <Button
              v-if="
                panel === 'recognize' && panelStage === 'result' && !readonly
              "
              type="primary"
              @click="confirmTask"
              >完成核对</Button
            >
            <Button
              v-if="panel === 'import' && panelStage !== 'result'"
              type="primary"
              :disabled="panelStage !== 'files'"
              @click="panelStage = 'result'"
              >校验导入文件</Button
            >
            <Button
              v-if="panel === 'maintenance' && panelStage !== 'result'"
              type="primary"
              @click="panelStage = 'result'"
              >检查当前范围</Button
            >
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>
