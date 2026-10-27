<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  Button,
  Cascader,
  Collapse,
  Drawer,
  Form,
  Input,
  Select,
  type FormInstance,
} from "ant-design-vue";
import { EditOutlined, LeftOutlined } from "@ant-design/icons-vue";
import {
  basicFields,
  invoiceFields,
  fieldText,
  statusLabels,
  statusOptions,
  regions,
  managers,
  cities,
  clone,
  type Customer,
  type CustomerStatus,
} from "./customer-responsive-data";

const props = defineProps<{
  row: Customer | null;
  editing: boolean;
  compact: boolean;
  container: () => HTMLElement;
}>();
const emit = defineEmits<{
  back: [];
  edit: [];
  dirtyChange: [dirty: boolean];
  save: [row: Customer, confirmed: boolean];
}>();
const draft = ref<Customer | null>(null);
const pageContent = ref<HTMLElement>();
let detailScrollTop = 0;
const form = ref<FormInstance>();
const error = ref("");
const expandedSections = ref<string[]>(["basic"]);
watch(
  () => props.row,
  (row, previous) => {
    draft.value = row ? clone(row) : null;
    error.value = "";
    if (row?.id !== previous?.id) {
      expandedSections.value = ["basic"];
      detailScrollTop = 0;
    }
  },
  { immediate: true },
);
watch(
  () => props.editing,
  async (editing) => {
    const body = pageContent.value?.parentElement;
    if (editing) detailScrollTop = body?.scrollTop || 0;
    if (props.row) draft.value = clone(props.row);
    error.value = "";
    await nextTick();
    if (body) body.scrollTop = editing ? 0 : detailScrollTop;
  },
);
const contactKeys = ["contact", "mobile", "phone", "manager"];
const sections = [
  {
    key: "basic",
    name: "客户基本信息",
    fields: basicFields,
    detailFields: [
      ...basicFields.filter((field) => contactKeys.includes(field.key)),
      ...basicFields.filter((field) => !contactKeys.includes(field.key)),
    ],
  },
  {
    key: "invoice",
    name: "客户开票信息",
    fields: invoiceFields,
    detailFields: invoiceFields,
  },
];
const dirty = computed(
  () =>
    props.editing && JSON.stringify(draft.value) !== JSON.stringify(props.row),
);
watch(dirty, (value) => emit("dirtyChange", value), {
  immediate: true,
  flush: "sync",
});
async function save(confirmed: boolean) {
  try {
    await form.value?.validate();
    if (draft.value) emit("save", clone(draft.value), confirmed);
  } catch {
    error.value = "请检查客户名称与业务经理。";
    if (!expandedSections.value.includes("basic")) {
      expandedSections.value.push("basic");
    }
  }
}
</script>

<template>
  <Drawer
    :open="!!row"
    :get-container="container"
    :root-style="{ position: 'absolute' }"
    width="100%"
    :closable="false"
    :mask="false"
    :mask-closable="false"
    class="crp-drawer crp-customer-drawer crp-customer-page"
    @close="emit('back')"
  >
    <template #title>
      <div class="crp-page-title">
        <Button
          type="text"
          class="crp-icon-button"
          :aria-label="editing ? '返回客户详情' : '返回客户列表'"
          @click="emit('back')"
          ><LeftOutlined
        /></Button>
        <h1>{{ editing ? "编辑客户" : "客户详情" }}</h1>
      </div>
    </template>
    <template #extra
      ><Button v-if="!editing" @click="emit('edit')"
        ><EditOutlined />编辑</Button
      ></template
    >
    <div v-if="row && draft" ref="pageContent" class="crp-page-content">
      <div class="crp-detail-heading">
        <span :class="['crp-status', `is-${row.status || 'unset'}`]"
          ><i />{{ statusLabels[row.status] }}</span
        >
        <h2>{{ row.name }}</h2>
        <span class="oneos-number">{{ row.code }}</span>
      </div>
      <Form
        v-if="editing"
        ref="form"
        :model="draft"
        layout="vertical"
        :rules="{
          name: [
            { required: true, whitespace: true, message: '请输入客户名称' },
          ],
          manager: [{ required: true, message: '请选择业务经理' }],
        }"
      >
        <Collapse
          v-model:active-key="expandedSections"
          ghost
          expand-icon-position="end"
          class="crp-detail-sections"
        >
          <Collapse.Panel
            v-for="section in sections"
            :key="section.key"
            :header="section.name"
            force-render
          >
            <div class="crp-field-grid" :class="{ 'is-one-column': compact }">
              <Form.Item
                v-for="field in section.fields"
                :key="field.key"
                :name="field.key"
                :label="field.label"
                :class="{ 'is-full': field.full }"
              >
                <Select
                  v-if="field.type === 'status'"
                  :value="draft.status || undefined"
                  @update:value="
                    (value) => {
                      if (draft) draft.status = (value as CustomerStatus) || '';
                    }
                  "
                  :options="statusOptions"
                  placeholder="请选择合作状态"
                  allow-clear
                />
                <Select
                  v-else-if="field.type === 'region'"
                  :value="draft.region || undefined"
                  @update:value="
                    (value) => {
                      if (draft) draft.region = String(value || '');
                    }
                  "
                  :options="regions.map((value) => ({ value, label: value }))"
                  placeholder="请选择区域"
                  allow-clear
                />
                <Select
                  v-else-if="field.type === 'manager'"
                  :value="draft.manager || undefined"
                  @update:value="
                    (value) => {
                      if (draft) draft.manager = String(value || '');
                    }
                  "
                  :options="managers.map((value) => ({ value, label: value }))"
                  placeholder="请选择业务经理"
                />
                <Cascader
                  v-else-if="field.type === 'city'"
                  v-model:value="draft.city"
                  :options="cities"
                  placeholder="请选择城市"
                />
                <Input.TextArea
                  v-else-if="field.type === 'textarea'"
                  v-model:value="draft.remark"
                  :auto-size="{ minRows: 3, maxRows: 6 }"
                  placeholder="请输入备注"
                />
                <Input
                  v-else
                  :value="String(draft[field.key] ?? '')"
                  @update:value="
                    (value) => {
                      if (draft) (draft[field.key] as string) = value;
                    }
                  "
                  :disabled="field.key === 'code'"
                  :class="{ 'oneos-number': field.mono }"
                  :placeholder="
                    field.key === 'code' ? '自动生成' : `请输入${field.label}`
                  "
                />
              </Form.Item>
            </div>
          </Collapse.Panel>
        </Collapse>
      </Form>
      <Collapse
        v-else
        v-model:active-key="expandedSections"
        ghost
        expand-icon-position="end"
        class="crp-detail-sections"
      >
        <Collapse.Panel
          v-for="section in sections"
          :key="section.key"
          :header="section.name"
        >
          <dl
            class="crp-description-grid"
            :class="{ 'is-one-column': compact }"
          >
            <div
              v-for="field in section.detailFields"
              :key="field.key"
              :class="{ 'is-full': field.full }"
            >
              <dt>{{ field.label }}</dt>
              <dd :class="{ 'oneos-number': field.mono }">
                <a
                  v-if="
                    ['mobile', 'phone'].includes(field.key) && row[field.key]
                  "
                  class="crp-contact-link"
                  :href="`tel:${String(row[field.key]).replace(/[^+\d]/g, '')}`"
                  :aria-label="`拨打${field.label} ${row[field.key]}`"
                  >{{ fieldText(row, field.key) }}</a
                >
                <template v-else>{{ fieldText(row, field.key) }}</template>
              </dd>
            </div>
          </dl>
        </Collapse.Panel>
        <Collapse.Panel key="created" header="创建信息">
          <dl class="crp-description-grid">
            <div>
              <dt>创建人</dt>
              <dd>{{ row.creator }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd class="oneos-number">{{ row.createdAt }}</dd>
            </div>
          </dl>
        </Collapse.Panel>
      </Collapse>
    </div>
    <template v-if="editing" #footer
      ><div class="crp-panel-footer">
        <span role="alert" class="crp-form-error">{{ error }}</span
        ><Button @click="emit('back')">取消</Button
        ><Button @click="save(false)">保存</Button
        ><Button type="primary" @click="save(true)">确认</Button>
      </div></template
    >
  </Drawer>
</template>
