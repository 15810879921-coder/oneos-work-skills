<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  Button,
  Cascader,
  ConfigProvider,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Select,
} from "ant-design-vue";
import {
  AppstoreOutlined,
  CheckOutlined,
  CloseOutlined,
  FilterOutlined,
  LeftOutlined,
  MenuOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";
import { VxeTable, VxeColumn } from "vxe-table";
import CustomerResponsivePanels from "./CustomerResponsivePanels.vue";
import {
  createCustomerNavigation,
  type CustomerLocation,
} from "./customer-responsive-navigation";
import {
  cities,
  clone,
  creators,
  customers,
  emptyQuery,
  filterCustomers,
  managers,
  regions,
  statusLabels,
  statusOptions,
  type Customer,
  type CustomerQuery,
  type CustomerStatus,
} from "./customer-responsive-data";

const app = ref<HTMLElement>();
const compact = ref(true);
let observer: ResizeObserver | undefined;
const container = () => app.value || document.body;
const popupContainer = (trigger?: HTMLElement) =>
  (trigger?.closest(".crp-app") as HTMLElement) || container();
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (entry) compact.value = entry.contentRect.width < 600;
  });
  if (app.value) observer.observe(app.value);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  if (feedbackTimer) clearTimeout(feedbackTimer);
});

const rows = ref(clone(customers));
const pending = ref(emptyQuery());
const applied = ref(emptyQuery());
const page = ref(1);
const pageSize = ref(10);
const filterOpen = ref(false);
const menuOpen = ref(false);
const activeRow = ref<Customer | null>(null);
const editing = ref(false);
const dirty = ref(false);
const discardOpen = ref(false);
let navigation: ReturnType<typeof createCustomerNavigation> | undefined;

function showLocation(location: CustomerLocation) {
  if (location.view === "list") {
    activeRow.value = null;
    editing.value = false;
  } else {
    const row = rows.value.find((item) => item.id === location.customerId);
    if (!row) return;
    if (activeRow.value?.id !== row.id) activeRow.value = clone(row);
    editing.value = location.view === "edit";
  }
}
function onHistoryChange(event: PopStateEvent) {
  navigation?.receive(event.state);
}
onMounted(() => {
  navigation = createCustomerNavigation(history, {
    isDirty: () => dirty.value,
    onChange: showLocation,
    onDiscardPrompt: (open) => {
      discardOpen.value = open;
    },
  });
  window.addEventListener("popstate", onHistoryChange);
});
onBeforeUnmount(() => window.removeEventListener("popstate", onHistoryChange));
const feedback = ref("");
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
const filtered = computed(() => filterCustomers(rows.value, applied.value));
const statsBase = computed(() =>
  filterCustomers(rows.value, applied.value, true),
);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize.value)),
);
const paged = computed(() =>
  filtered.value.slice(
    (page.value - 1) * pageSize.value,
    page.value * pageSize.value,
  ),
);
const stats = computed(() => [
  { key: "all", label: "全部客户", count: statsBase.value.length },
  ...(["cooperating", "negotiating", "ended", ""] as CustomerStatus[]).map(
    (key) => ({
      key,
      label: statusLabels[key],
      count: statsBase.value.filter((row) => row.status === key).length,
    }),
  ),
]);
const filterCount = computed(() => countFilters(applied.value));
const pendingPeriod = computed<[string, string] | undefined>({
  get: () =>
    pending.value.period?.length === 2
      ? (pending.value.period as [string, string])
      : undefined,
  set: (value) => {
    pending.value.period = value || [];
  },
});
const activeChips = computed(() =>
  [
    applied.value.name && `名称：${applied.value.name}`,
    applied.value.code && `编码：${applied.value.code}`,
    applied.value.statuses.length &&
      applied.value.statuses.map((value) => statusLabels[value]).join("、"),
    applied.value.region,
    applied.value.city.join(" / "),
    applied.value.managers.join("、"),
    applied.value.creators.length &&
      `创建人：${applied.value.creators.join("、")}`,
    applied.value.period.length && "创建时间已筛选",
  ].filter(Boolean),
);
function countFilters(query: CustomerQuery) {
  return [
    query.code,
    query.statuses.length,
    query.region,
    query.city.length,
    query.managers.length,
    query.creators.length,
    query.period.length,
  ].filter(Boolean).length;
}
function normalizeQuery(query: CustomerQuery): CustomerQuery {
  return {
    ...emptyQuery(),
    ...clone(query),
    statuses: query.statuses || [],
    city: query.city || [],
    managers: query.managers || [],
    creators: query.creators || [],
    period: query.period || [],
    code: query.code?.trim() || "",
    region: query.region || "",
  };
}
function search() {
  applied.value = normalizeQuery(pending.value);
  page.value = 1;
  filterOpen.value = false;
}
function reset() {
  pending.value = emptyQuery();
  applied.value = emptyQuery();
  page.value = 1;
}
function chooseStatus(key: string) {
  if (key === "") return;
  const value = key === "all" ? [] : [key as CustomerStatus];
  applied.value.statuses = value;
  pending.value.statuses = [...value];
  page.value = 1;
}
function tell(message: string) {
  feedback.value = message;
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedback.value = "";
  }, 4200);
}
function openCustomer(row: Customer) {
  navigation?.openCustomer(row.id);
}
function saveCustomer(row: Customer, confirmed: boolean) {
  row.status ||= "";
  row.region ||= "";
  row.city ||= [];
  const index = rows.value.findIndex((item) => item.id === row.id);
  if (index >= 0) rows.value[index] = row;
  activeRow.value = clone(row);
  dirty.value = false;
  navigation?.back(true);
  tell(`示例客户已${confirmed ? "确认" : "保存"}，刷新后恢复。`);
}
watch([pageCount, pageSize], () => {
  page.value = Math.min(page.value, pageCount.value);
});
</script>

<template>
  <div
    ref="app"
    class="crp-app"
    :class="{ 'is-compact': compact }"
    :data-layout="compact ? 'phone' : 'fold'"
  >
    <ConfigProvider :get-popup-container="popupContainer">
      <div
        class="crp-list-view"
        :inert="activeRow ? true : undefined"
        :aria-hidden="activeRow ? true : undefined"
      >
        <header class="crp-app-header">
          <Button
            type="text"
            class="crp-icon-button"
            aria-label="打开业务导航"
            @click="menuOpen = true"
            ><MenuOutlined
          /></Button>
          <span class="crp-wordmark">ONE<span>OS</span></span
          ><span class="crp-header-divider" />
          <h1>客户管理</h1>
          <span class="crp-header-spacer" /><span
            class="crp-account"
            aria-label="当前示例用户王宁"
            >宁</span
          >
        </header>

        <div class="crp-workspace">
          <form class="crp-search-row" @submit.prevent="search">
            <Input
              v-model:value="pending.name"
              aria-label="客户名称"
              placeholder="输入客户名称"
              allow-clear
              ><template #prefix><SearchOutlined /></template
            ></Input>
            <Button html-type="submit" class="crp-query-button">查询</Button>
            <Button
              class="crp-filter-button"
              :class="{ 'is-active': filterCount }"
              @click="filterOpen = true"
              ><FilterOutlined /><span>筛选</span
              ><b v-if="filterCount">{{ filterCount }}</b></Button
            >
          </form>
          <div class="crp-stat-strip" aria-label="客户合作状态统计">
            <component
              :is="stat.key === '' ? 'div' : 'button'"
              v-for="stat in stats"
              :key="stat.key"
              :type="stat.key === '' ? undefined : 'button'"
              class="crp-stat"
              :class="{
                'is-active':
                  stat.key === 'all'
                    ? !applied.statuses.length
                    : applied.statuses.length === 1 &&
                      applied.statuses[0] === stat.key,
                'is-readonly': stat.key === '',
              }"
              :aria-pressed="
                stat.key === ''
                  ? undefined
                  : stat.key === 'all'
                    ? !applied.statuses.length
                    : applied.statuses.includes(stat.key as CustomerStatus)
              "
              @click="chooseStatus(stat.key)"
            >
              <span class="crp-stat-label"
                ><i
                  v-if="stat.key !== 'all'"
                  :class="['crp-dot', `is-${stat.key || 'unset'}`]"
                />{{ stat.label }}</span
              ><strong class="oneos-number">{{ stat.count }}</strong>
            </component>
          </div>

          <div v-if="activeChips.length" class="crp-active-filters">
            <div>
              <span v-for="chip in activeChips" :key="String(chip)">{{
                chip
              }}</span>
            </div>
            <Button type="text" @click="reset">重置</Button>
          </div>

          <section class="crp-list-panel" aria-label="客户列表">
            <div v-if="!filtered.length" class="crp-empty">
              <Empty description="没有找到符合条件的客户" /><Button
                @click="reset"
                >清空条件，查看全部</Button
              >
            </div>
            <div
              v-else-if="compact"
              class="crp-records"
              aria-label="客户紧凑列表"
            >
              <article v-for="row in paged" :key="row.id" class="crp-record">
                <div class="crp-record-content">
                  <div class="crp-record-title">
                    <h2>
                      <button
                        type="button"
                        class="crp-customer-name"
                        :aria-label="`查看${row.name}详情`"
                        @click.stop="openCustomer(row)"
                      >
                        {{ row.name }}
                      </button>
                    </h2>
                    <span :class="['crp-status', `is-${row.status || 'unset'}`]"
                      ><i />{{ statusLabels[row.status] }}</span
                    >
                  </div>
                  <div class="crp-contact-line">
                    <span>{{ row.contact || "未填写联系人" }}</span
                    ><span class="oneos-number">{{ row.mobile || "—" }}</span
                    ><span class="crp-owner"
                      >业务经理 {{ row.manager || "—" }}</span
                    >
                  </div>
                  <div class="crp-record-bottom">
                    <span class="crp-place"
                      >{{ row.region || "未设置区域" }}<i>·</i
                      >{{ row.city.at(-1) || "未设置城市" }}</span
                    >
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="crp-table-container">
              <VxeTable
                :data="paged"
                height="100%"
                :row-config="{ keyField: 'id', isHover: true }"
                :column-config="{ resizable: true }"
                :border="false"
                :show-overflow="false"
                :show-header-overflow="false"
                class="crp-table"
              >
                <VxeColumn title="客户名称 / 编码" :min-width="200"
                  ><template #default="{ row }"
                    ><div class="crp-table-name">
                      <button
                        type="button"
                        class="crp-customer-name"
                        :aria-label="`查看${row.name}详情`"
                        @click.stop="openCustomer(row)"
                      >
                        {{ row.name }}
                      </button>
                    </div>
                    <div class="crp-secondary oneos-number">
                      {{ row.code }}
                    </div></template
                  ></VxeColumn
                >
                <VxeColumn title="合作状态 / 业务经理" :min-width="136"
                  ><template #default="{ row }"
                    ><span
                      :class="['crp-status', `is-${row.status || 'unset'}`]"
                      ><i />{{
                        statusLabels[row.status as CustomerStatus]
                      }}</span
                    >
                    <div class="crp-secondary">
                      {{ row.manager || "—" }}
                    </div></template
                  ></VxeColumn
                >
                <VxeColumn title="联系人 / 手机" :min-width="134"
                  ><template #default="{ row }"
                    ><span>{{ row.contact || "—" }}</span>
                    <div class="crp-secondary oneos-number">
                      {{ row.mobile || "—" }}
                    </div></template
                  ></VxeColumn
                >
                <VxeColumn title="区域 / 城市" :min-width="108"
                  ><template #default="{ row }"
                    ><span>{{ row.region || "—" }}</span>
                    <div class="crp-secondary">
                      {{ row.city.at(-1) || "—" }}
                    </div></template
                  ></VxeColumn
                >
              </VxeTable>
            </div>

            <footer class="crp-pagination">
              <span
                >共 <b class="oneos-number">{{ filtered.length }}</b> 项</span
              ><Select
                v-model:value="pageSize"
                aria-label="每页条数"
                :options="[
                  { value: 10, label: '10 条/页' },
                  { value: 20, label: '20 条/页' },
                ]"
                @change="page = 1"
              />
              <div>
                <Button
                  type="text"
                  :disabled="page <= 1"
                  class="crp-icon-button"
                  aria-label="上一页"
                  @click="page--"
                  ><LeftOutlined /></Button
                ><span class="oneos-number"
                  ><b>{{ page }}</b
                  ><i>/</i>{{ pageCount }}</span
                ><Button
                  type="text"
                  :disabled="page >= pageCount"
                  class="crp-icon-button"
                  aria-label="下一页"
                  @click="page++"
                  ><RightOutlined
                /></Button>
              </div>
            </footer>
          </section>
        </div>
      </div>
      <div v-if="feedback" class="crp-feedback" role="status">
        <CheckOutlined /><span>{{ feedback }}</span
        ><Button
          type="text"
          class="crp-icon-button"
          aria-label="关闭提示"
          @click="feedback = ''"
          ><CloseOutlined
        /></Button>
      </div>

      <Drawer
        :open="filterOpen"
        :get-container="container"
        :root-style="{ position: 'absolute' }"
        :width="compact ? '100%' : 520"
        title="筛选客户"
        class="crp-drawer"
        @close="filterOpen = false"
      >
        <p class="crp-panel-intro">设置筛选条件后，点击查询更新列表。</p>
        <Form
          name="customer_filter"
          :model="pending"
          layout="vertical"
          class="crp-filter-form"
          ><div class="crp-field-grid" :class="{ 'is-one-column': compact }">
            <Form.Item label="客户编码" name="code"
              ><Input
                v-model:value="pending.code"
                placeholder="输入完整客户编码"
                allow-clear
            /></Form.Item>
            <Form.Item label="合作状态" name="statuses"
              ><Select
                v-model:value="pending.statuses"
                mode="multiple"
                :options="statusOptions"
                placeholder="全部状态"
                allow-clear
            /></Form.Item>
            <Form.Item label="区域" name="region"
              ><Select
                :value="pending.region || undefined"
                @update:value="
                  (value) => (pending.region = String(value || ''))
                "
                :options="regions.map((value) => ({ value, label: value }))"
                placeholder="全部区域"
                allow-clear
            /></Form.Item>
            <Form.Item label="城市" name="city"
              ><Cascader
                v-model:value="pending.city"
                :options="cities"
                placeholder="全部城市"
                change-on-select
            /></Form.Item>
            <Form.Item label="业务经理" name="managers"
              ><Select
                v-model:value="pending.managers"
                mode="multiple"
                :options="managers.map((value) => ({ value, label: value }))"
                placeholder="全部业务经理"
                allow-clear
            /></Form.Item>
            <Form.Item label="创建人" name="creators"
              ><Select
                v-model:value="pending.creators"
                mode="multiple"
                :options="creators.map((value) => ({ value, label: value }))"
                placeholder="全部创建人"
                allow-clear
            /></Form.Item>
            <Form.Item label="创建时间" name="period" class="is-full"
              ><DatePicker.RangePicker
                v-model:value="pendingPeriod"
                value-format="YYYY-MM-DD HH:mm:ss"
                :show-time="true"
                :allow-clear="true"
                :placeholder="['开始时间', '结束时间']"
                popup-class-name="crp-date-popup"
            /></Form.Item></div
        ></Form>
        <template #footer
          ><div class="crp-filter-footer">
            <Button @click="reset">重置</Button
            ><Button type="primary" @click="search">查询</Button>
          </div></template
        >
      </Drawer>
      <CustomerResponsivePanels
        :row="activeRow"
        :editing="editing"
        :compact="compact"
        :container="container"
        @back="navigation?.back()"
        @edit="navigation?.editCustomer()"
        @dirty-change="dirty = $event"
        @save="saveCustomer"
      />
      <Modal
        :open="discardOpen"
        :get-container="container"
        :style="{ top: '25%' }"
        :width="320"
        title="放弃未保存的修改？"
        ok-text="放弃修改"
        cancel-text="继续编辑"
        @cancel="navigation?.continueEditing()"
        @ok="navigation?.discardChanges()"
        ><p>本次修改尚未保存，放弃后不会保留。</p></Modal
      >
      <Drawer
        :open="menuOpen"
        :get-container="container"
        :root-style="{ position: 'absolute' }"
        placement="left"
        :width="268"
        title="ONEOS"
        class="crp-drawer crp-nav-drawer"
        @close="menuOpen = false"
        ><div class="crp-nav-label">业务管理</div>
        <Button type="text" block class="is-current" @click="menuOpen = false"
          ><AppstoreOutlined />客户管理<RightOutlined
        /></Button>
        <div class="crp-nav-foot">客户管理 · 多屏体验原型</div></Drawer
      >
    </ConfigProvider>
  </div>
</template>
