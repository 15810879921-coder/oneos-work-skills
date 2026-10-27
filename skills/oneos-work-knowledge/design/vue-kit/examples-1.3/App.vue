<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Button, ConfigProvider, Select, Space, Tooltip } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import {
  AppstoreOutlined,
  CheckOutlined,
  FileTextOutlined,
  FormOutlined,
  BulbOutlined,
  TableOutlined,
  ProfileOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue';
import { OneosSurface } from '../../src/components/oneos-design/patterns';
import { CANON_BILLS, type CanonBill } from './fixtures';
import LedgerExample from './LedgerExample.vue';
import FormExample from './FormExample.vue';
import DetailExample from './DetailExample.vue';
import ComponentStates from './ComponentStates.vue';
import MultiActionLedger from './MultiActionLedger.vue';
import ValidationLedger from './ValidationLedger.vue';
import NestedLeaseLedger from './NestedLeaseLedger.vue';
import ImageViewerExample from './ImageViewerExample.vue';
import './review-1.3.css';

type View = 'ledger' | 'multi' | 'validation' | 'nested' | 'form' | 'detail' | 'components' | 'image-viewer';
const views = [
  { key: 'ledger' as View, name: '台账页', icon: TableOutlined, hint: '查询与批量处理' },
  { key: 'multi' as View, name: '多操作台账', icon: ProfileOutlined, hint: '保险采购 · 操作分组' },
  { key: 'validation' as View, name: '数据核验台账', icon: TableOutlined, hint: '三类字段核验' },
  { key: 'nested' as View, name: '主子台账', icon: TableOutlined, hint: '租赁合同 · 车辆明细' },
  { key: 'form' as View, name: '表单页', icon: FormOutlined, hint: '分组录入与反馈' },
  { key: 'detail' as View, name: '详情页', icon: FileTextOutlined, hint: '只读信息与记录' },
  { key: 'components' as View, name: '组件状态', icon: AppstoreOutlined, hint: '控件与主题' },
  { key: 'image-viewer' as View, name: '图片查看器', icon: PictureOutlined, hint: '相册、缩放与下载' },
];
const initial = new URLSearchParams(location.search).get('view');
const view = ref<View>(views.some((v) => v.key === initial) ? (initial as View) : 'ledger');
const revision = ref<'1.2' | '1.3'>(new URLSearchParams(location.search).get('revision') === '1.2' ? '1.2' : '1.3');
const review = computed(() => revision.value === '1.3');
const visibleViews = computed(() => views.filter((item) => review.value || !['multi', 'nested', 'validation'].includes(item.key)));
const readOnlyExample = ref<'full' | 'read'>('full');
const mode = ref<'light' | 'dark'>('light');
const primary = ref('#007A55');
const density = ref<'comfortable' | 'compact'>('comfortable');
const scenario = ref<'normal' | 'empty' | 'error' | 'loading'>('normal');
const vehicleScenario = ref<'normal' | 'empty' | 'error' | 'loading'>('normal');
const selected = ref<CanonBill>(CANON_BILLS[2]!);
const formSeed = ref<CanonBill>(CANON_BILLS[0]!);
const editorKey = ref(0);
const lastEvent = ref('示例数据 · 不连接业务');
const heading = computed(() => views.find((v) => v.key === view.value)!.name);
const snapshot = reactive({ localSaves: 0 });

function navigate(next: View) {
  view.value = next;
  const url = new URL(location.href);
  url.searchParams.set('view', next);
  history.replaceState(null, '', url);
}
function changeRevision() {
  if (revision.value === '1.2' && ['multi', 'nested', 'validation'].includes(view.value)) navigate('ledger');
  const url = new URL(location.href);
  url.searchParams.set('revision', revision.value);
  history.replaceState(null, '', url);
}
if (!review.value && ['multi', 'nested', 'validation'].includes(view.value)) navigate('ledger');
function detail(row: CanonBill) {
  selected.value = row;
  navigate('detail');
}
function edit(row: CanonBill) {
  formSeed.value = row;
  editorKey.value += 1;
  navigate('form');
}
function saved() {
  snapshot.localSaves += 1;
  lastEvent.value = `已暂存到本页示例 · 第 ${snapshot.localSaves} 次`;
}
</script>

<template>
  <ConfigProvider :locale="zhCN">
    <OneosSurface :mode="mode" :primary="primary" :density="density">
      <div class="lab-shell" :class="{ 'lab-review': review, 'lab-multi-view': view === 'multi', 'lab-nested-view': view === 'nested' }">
        <aside class="lab-sidebar" aria-label="规范导航">
          <a class="lab-brand" href="?view=ledger" aria-label="OneOS 页面规范首页"
            ><span class="lab-brand-mark" aria-hidden="true"><i /></span
            ><span>ONE<span class="lab-brand-light">OS</span><small>页面与组件规范</small></span></a
          >
          <div class="lab-nav-label">页面范式</div>
          <nav>
            <button
              v-for="item in visibleViews"
              :key="item.key"
              type="button"
              :class="{ 'is-active': view === item.key }"
              :aria-current="view === item.key ? 'page' : undefined"
              @click="navigate(item.key)"
            >
              <component :is="item.icon" /><span
                >{{ item.name }}<small>{{ item.hint }}</small></span
              >
            </button>
          </nav>
          <div class="lab-sidebar-foot">
            <span class="lab-version">ONEOS V2 <b>{{ revision }}</b></span>
            <p>统一界面，保留业务。</p>
            <div class="lab-stack-label">Vue · Ant Design · VXE</div>
          </div>
        </aside>
        <div class="lab-main">
          <header class="lab-topbar">
            <div class="lab-breadcrumb">
              设计规范 <span>/</span> <strong>{{ heading }}</strong>
            </div>
            <Space :size="10"
              ><span class="lab-preview-tag"><CheckOutlined /> {{ review ? '评审样板 · 待确认' : '本地样板' }}</span
              ><Tooltip :title="mode === 'light' ? '切换深色' : '切换浅色'"
                ><Button
                  class="lab-icon-button"
                  :aria-label="mode === 'light' ? '切换深色' : '切换浅色'"
                  @click="mode = mode === 'light' ? 'dark' : 'light'"
                  ><BulbOutlined /></Button></Tooltip
            ></Space>
          </header>
          <div class="lab-inspector" aria-label="样板验证控制">
            <div class="lab-inspector-status" role="status">{{ lastEvent }}</div>
            <div class="lab-inspector-controls">
              <label class="lab-revision-control"
                >版本
                <Select
                  v-model:value="revision"
                  aria-label="规范版本"
                  :options="[
                    { value: '1.3', label: '1.3 紧凑评审' },
                    { value: '1.2', label: '1.2 原版对照' },
                  ]"
                  @change="changeRevision"
                /></label>
              <label
                >密度
                <Select
                  v-model:value="density"
                  aria-label="界面密度"
                  :options="[
                    { value: 'comfortable', label: '标准 36' },
                    { value: 'compact', label: '紧凑 32' },
                  ]" /></label
              ><label v-if="view === 'ledger' || view === 'multi' || view === 'nested'"
                >状态
                <Select
                  v-model:value="scenario"
                  aria-label="台账展示状态"
                  :options="[
                    { value: 'normal', label: '正常' },
                    { value: 'empty', label: '无结果' },
                    { value: 'loading', label: '加载中' },
                    { value: 'error', label: '加载失败' },
                  ]" /></label
              ><label v-if="view === 'nested'">车辆明细
                <Select v-model:value="vehicleScenario" aria-label="车辆明细展示状态" :options="[{value:'normal',label:'正常'},{value:'empty',label:'无车辆'},{value:'loading',label:'加载中'},{value:'error',label:'加载失败'}]" />
              </label><label v-if="view === 'multi'">权限
                <Select v-model:value="readOnlyExample" aria-label="示例操作权限" :options="[{value:'full',label:'完整操作'},{value:'read',label:'只读模式'}]" />
              </label><label v-if="view === 'components' || view === 'validation'"
                >主色
                <Select
                  v-model:value="primary"
                  aria-label="主题主色"
                  :options="[
                    { value: '#007A55', label: '青绿' },
                    { value: '#2463A6', label: '蓝色' },
                  ]"
              /></label>
            </div>
          </div>
          <main>
            <LedgerExample
              v-if="view === 'ledger'"
              :review="review"
              :scenario="scenario"
              @view="detail"
              @edit="edit"
              @create="edit(CANON_BILLS[0]!)"
              @retry="scenario = 'normal'"
            />
            <MultiActionLedger v-else-if="view === 'multi'" :scenario="scenario" :readonly="readOnlyExample === 'read'" @retry="scenario = 'normal'" />
            <ValidationLedger v-else-if="view === 'validation'" />
            <NestedLeaseLedger v-else-if="view === 'nested'" :scenario="scenario" :vehicle-scenario="vehicleScenario" @retry="scenario = 'normal'" />
            <FormExample
              v-else-if="view === 'form'"
              :key="editorKey"
              :seed="formSeed"
              @back="navigate('ledger')"
              @saved="saved"
            />
            <DetailExample
              v-else-if="view === 'detail'"
              :row="selected"
              @back="navigate('ledger')"
              @edit="edit(selected)"
            />
            <ImageViewerExample v-else-if="view === 'image-viewer'" />
            <ComponentStates v-else />
          </main>
        </div>
      </div>
    </OneosSurface>
  </ConfigProvider>
</template>
