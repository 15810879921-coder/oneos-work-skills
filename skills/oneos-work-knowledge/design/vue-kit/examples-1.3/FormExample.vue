<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Button, DatePicker, Form, Input, Select, Space } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import type { RuleObject } from 'ant-design-vue/es/form';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';
import {
  OneosFieldGrid,
  OneosPage,
  OneosSection,
} from '../../src/components/oneos-design/patterns';
import { OWNER_OPTIONS, SETTLE_OPTIONS, SITE_OPTIONS, type CanonBill } from './fixtures';

const props = defineProps<{ seed: CanonBill }>();
const emit = defineEmits<{ back: []; saved: [] }>();
const formRef = ref<FormInstance>();
// These values and rules belong only to the example. Shared components own none of them.
const form = reactive({
  title: props.seed.title,
  customer: props.seed.customer,
  plate: props.seed.plate,
  region: props.seed.region,
  owner: props.seed.owner,
  day: props.seed.updatedAt,
  amount: String(props.seed.amount),
  settle: props.seed.settle,
  planDay: props.seed.planDay,
  contact: props.seed.contact,
  phone: props.seed.phone,
  site: props.seed.site,
  remark: props.seed.remark,
});
const rules: Record<string, RuleObject[]> = {
  title: [{ required: true, whitespace: true, message: '请填写事项', trigger: 'blur' }],
  customer: [{ required: true, whitespace: true, message: '请填写客户', trigger: 'blur' }],
  owner: [{ required: true, message: '请指派负责人', trigger: 'change' }],
};
const missing = computed(
  () => [form.title, form.customer, form.owner].filter((v) => !v?.trim()).length,
);
const filled = computed(
  () =>
    [form.title, form.customer, form.plate, form.owner, form.day].filter((v) =>
      String(v ?? '').trim(),
    ).length,
);
const saved = ref(false);
async function save() {
  try {
    await formRef.value?.validate();
    saved.value = true;
    emit('saved');
  } catch {
    saved.value = false;
  }
}
</script>

<template>
  <OneosPage kind="form" label="新增单据">
    <template #header
      ><div class="lab-form-title">
        <Button aria-label="返回台账" class="lab-icon-button" @click="emit('back')"
          ><ArrowLeftOutlined /></Button
        ><span class="lab-title-divider" />
        <div>
          <h1>新增单据</h1>
        </div>
      </div>
      <span class="lab-meta-label">{{ filled }} / 5 基本信息已填</span></template
    >
    <Form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <div class="lab-form-sections">
        <OneosSection title="基本信息"
          ><template #aside>单据身份与负责人</template>
          <OneosFieldGrid>
            <Form.Item name="title" label="事项" class="is-wide"
              ><Input v-model:value="form.title" aria-label="事项" @change="saved = false"
            /></Form.Item>
            <Form.Item name="customer" label="客户" :extra="`所属区域 ${form.region}`"
              ><Input v-model:value="form.customer" aria-label="客户" @change="saved = false"
            /></Form.Item>
            <Form.Item name="plate" label="车牌"
              ><Input
                v-model:value="form.plate"
                aria-label="车牌"
                class="oneos-number"
                @change="saved = false"
            /></Form.Item>
            <Form.Item name="owner" label="负责人"
              ><Select
                v-model:value="form.owner"
                aria-label="负责人"
                :options="OWNER_OPTIONS"
                show-search
                option-filter-prop="label"
                @change="saved = false"
            /></Form.Item>
            <Form.Item name="day" label="办理日期"
              ><DatePicker
                v-model:value="form.day"
                aria-label="办理日期"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                class="lab-full-control"
                @change="saved = false"
            /></Form.Item>
          </OneosFieldGrid>
        </OneosSection>
        <OneosSection title="费用与安排"
          ><template #aside
            ><span class="oneos-number">{{ form.amount === '' ? '—' : `¥${form.amount}` }}</span> ·
            {{ form.settle }}</template
          >
          <OneosFieldGrid>
            <Form.Item name="amount" label="金额"
              ><Input
                v-model:value="form.amount"
                aria-label="金额"
                prefix="¥"
                class="oneos-number"
                @change="saved = false"
            /></Form.Item>
            <Form.Item name="settle" label="结算方式"
              ><Select
                v-model:value="form.settle"
                aria-label="结算方式"
                :options="SETTLE_OPTIONS"
                @change="saved = false"
            /></Form.Item>
            <Form.Item name="planDay" label="计划完成"
              ><DatePicker
                v-model:value="form.planDay"
                aria-label="计划完成"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                class="lab-full-control"
                @change="saved = false"
            /></Form.Item>
            <Form.Item name="site" label="服务站点"
              ><Select
                v-model:value="form.site"
                aria-label="服务站点"
                :options="SITE_OPTIONS"
                show-search
                option-filter-prop="label"
                @change="saved = false"
            /></Form.Item>
            <Form.Item name="contact" label="对接人"
              ><Input v-model:value="form.contact" aria-label="对接人" @change="saved = false"
            /></Form.Item>
            <Form.Item name="phone" label="联系电话"
              ><Input
                v-model:value="form.phone"
                aria-label="联系电话"
                class="oneos-number"
                @change="saved = false"
            /></Form.Item>
          </OneosFieldGrid>
        </OneosSection>
        <OneosSection title="补充说明"
          ><template #aside>{{ form.remark.length }} 字</template
          ><Form.Item name="remark" label="情况描述" class="lab-last-field"
            ><Input.TextArea
              v-model:value="form.remark"
              aria-label="情况描述"
              :rows="4"
              @change="saved = false" /></Form.Item
        ></OneosSection>
      </div>
    </Form>
    <template #footer
      ><span class="lab-form-status" :class="{ 'is-error': missing > 0 }" role="status"
        ><CheckCircleOutlined v-if="missing === 0" />{{
          missing ? `还有 ${missing} 项必填未完成` : saved ? '已暂存到本页示例' : '必填项已齐'
        }}</span
      ><Space
        ><Button @click="emit('back')">取消</Button
        ><Button :disabled="missing > 0" @click="save">暂存</Button
        ><Button type="primary" :disabled="missing > 0" @click="save">提交</Button></Space
      ></template
    >
  </OneosPage>
</template>
