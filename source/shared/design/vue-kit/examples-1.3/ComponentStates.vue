<script setup lang="ts">
import { ref } from 'vue';
import { Button, DatePicker, Form, Input, Select, Space, Spin } from 'ant-design-vue';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons-vue';
import {
  OneosFieldGrid,
  OneosPage,
  OneosSection,
} from '../../src/components/oneos-design/patterns';
const text = ref('嘉兴运力');
const selected = ref('刘洋');
const notice = ref('');
const samples = [
  { label: '主文字', name: 'ink', color: 'var(--oneos-ink)' },
  { label: '品牌与操作', name: 'primary', color: 'var(--oneos-primary)' },
  { label: '成功', name: 'success', color: 'var(--oneos-success)' },
  { label: '预警', name: 'warning', color: 'var(--oneos-warning)' },
  { label: '异常', name: 'error', color: 'var(--oneos-error)' },
  { label: '画布', name: 'canvas', color: 'var(--oneos-canvas)' },
];
</script>

<template>
  <OneosPage label="组件状态">
    <template #header
      ><div class="lab-page-title">
        <h1>组件状态</h1>
        <span class="oneos-secondary">原生控件，共用主题</span>
      </div></template
    >
    <template #summary
      ><div class="lab-token-strip">
        <div v-for="sample in samples" :key="sample.name">
          <i :style="{ background: sample.color }" />
          <div>
            {{ sample.label }}<small>{{ sample.name }}</small>
          </div>
        </div>
      </div></template
    >
    <OneosSection title="输入与反馈" description="内容与限制由业务提供，展示组件保留输入原值。"
      ><template #aside>常规 · 焦点 · 只读 · 禁用 · 错误 · 加载</template
      ><Form layout="vertical"
        ><OneosFieldGrid
          ><Form.Item label="常规"><Input v-model:value="text" aria-label="常规输入" /></Form.Item
          ><Form.Item label="搜索"
            ><Input aria-label="搜索输入" placeholder="输入关键词"
              ><template #prefix><SearchOutlined /></template></Input></Form.Item
          ><Form.Item label="只读" extra="内容可选择和复制"
            ><Input
              aria-label="只读输入"
              readonly
              value="WO-20260827-0001"
              class="oneos-number" /></Form.Item
          ><Form.Item label="禁用"
            ><Input aria-label="禁用输入" disabled value="由业务条件禁用" /></Form.Item
          ><Form.Item label="错误" validate-status="error" help="请填写事项"
            ><Input aria-label="错误输入" aria-invalid="true" placeholder="请填写事项" /></Form.Item
          ><Form.Item label="加载中"
            ><Input aria-label="加载中的输入" readonly value="正在获取选项"
              ><template #suffix
                ><LoadingOutlined spin /></template></Input></Form.Item></OneosFieldGrid></Form
    ></OneosSection>
    <OneosSection title="选择与日期"
      ><template #aside>使用原生浮层与键盘行为</template
      ><Form layout="vertical"
        ><OneosFieldGrid
          ><Form.Item label="负责人"
            ><Select
              v-model:value="selected"
              aria-label="状态样板负责人"
              :options="[
                { value: '刘洋', label: '刘洋' },
                { value: '陈可', label: '陈可' },
                { value: '周宁', label: '周宁' },
              ]" /></Form.Item
          ><Form.Item label="日期" html-for="state-date"
            ><DatePicker id="state-date" class="lab-full-control" /></Form.Item
          ><Form.Item label="禁用选择"
            ><Select
              disabled
              aria-label="禁用选择"
              value="locked"
              :options="[
                { value: 'locked', label: '由业务条件禁用' },
              ]" /></Form.Item></OneosFieldGrid></Form
    ></OneosSection>
    <OneosSection title="操作层级"
      ><template #aside>页面提供事件、权限与禁用条件</template
      ><Space wrap
        ><Button type="primary" @click="notice = '主操作事件已触发，仅当前示例'">主操作</Button
        ><Button @click="notice = '次操作事件已触发，仅当前示例'">次操作</Button
        ><Button type="link" @click="notice = '文字操作事件已触发，仅当前示例'">文字操作</Button
        ><Button danger @click="notice = '危险操作样式已演示，未删除任何数据'">危险操作</Button
        ><Button disabled>不可操作</Button><Button loading>处理中</Button></Space
      >
      <p v-if="notice" role="status" class="oneos-secondary">{{ notice }}</p></OneosSection
    >
    <OneosSection title="密度与文字"
      ><div class="lab-type-spec">
        <div><strong class="lab-type-heading">单据详情</strong><span>页名 · 20 / 650</span></div>
        <div><strong>客户与业务信息</strong><span>内容 · 13 / 400</span></div>
        <div><strong class="oneos-number">128,000.00</strong><span>数据 · 等宽数字</span></div>
        <div>
          <strong class="oneos-secondary">更新于 2026-08-27</strong><span>辅助 · 12 / 400</span>
        </div>
      </div></OneosSection
    >
  </OneosPage>
</template>
