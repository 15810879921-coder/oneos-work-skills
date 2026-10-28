<script setup lang="ts">
import { computed } from 'vue';
import { Button, Empty, Timeline } from 'ant-design-vue';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons-vue';
import {
  OneosDescriptions,
  OneosPage,
  OneosSection,
} from '../../src/components/oneos-design/patterns';
import { CANON_TRACE, STATUS_LABEL, money, type CanonBill } from './fixtures';

const props = defineProps<{ row: CanonBill }>();
const emit = defineEmits<{ back: []; edit: [] }>();
const items = computed(() => [
  { key: 'title', label: '事项', value: props.row.title },
  { key: 'customer', label: '客户', value: props.row.customer },
  { key: 'plate', label: '车牌', value: props.row.plate, mono: true },
  { key: 'region', label: '区域', value: props.row.region },
  { key: 'site', label: '服务站点', value: props.row.site },
  { key: 'settle', label: '结算方式', value: props.row.settle },
  { key: 'amount', label: '金额', value: `¥${money(props.row.amount)}`, mono: true },
  { key: 'contact', label: '对接人', value: props.row.contact },
  { key: 'phone', label: '联系电话', value: props.row.phone, mono: true },
  { key: 'remark', label: '情况描述', value: props.row.remark, full: true },
]);
// The source only supplies a history for this record. Never fabricate histories for other rows.
const trace = computed(() => (props.row.id === '3' ? CANON_TRACE : []));
</script>

<template>
  <OneosPage kind="detail" label="单据详情" class="lab-standard-detail">
    <template #header
      ><div class="lab-form-title">
        <Button aria-label="返回台账" class="lab-icon-button" @click="emit('back')"
          ><ArrowLeftOutlined /></Button
        ><span class="lab-title-divider" />
        <div>
          <h1>单据详情</h1>
        </div>
      </div>
      <Button type="primary" aria-label="编辑" @click="emit('edit')"
        ><EditOutlined />编辑</Button
      ></template
    >
    <template #summary
      ><div class="lab-detail-summary">
        <div>
          <span :class="['lab-status', `is-${row.status}`]"
            ><i />{{ STATUS_LABEL[row.status] }}</span
          >
        </div>
        <div class="lab-detail-context">
          <div>
            <span>负责人</span><strong>{{ row.owner }}</strong>
          </div>
          <div>
            <span>更新日期</span><strong class="oneos-number">{{ row.updatedAt }}</strong>
          </div>
        </div>
      </div></template
    >
    <OneosSection title="单据概要"
      ><template #aside>基本信息</template><OneosDescriptions bordered :items="items"
    /></OneosSection>
    <OneosSection title="处理记录"
      ><template #aside>{{ trace.length }} 条</template
      ><Timeline v-if="trace.length" class="lab-timeline"
        ><Timeline.Item
          v-for="(item, i) in trace"
          :key="item.time"
          :color="i === 0 ? 'var(--oneos-primary)' : 'var(--oneos-line)'"
          ><div class="lab-timeline-entry">
            <strong>{{ item.what }}</strong
            ><span class="oneos-secondary"
              >{{ item.who }}<span class="lab-meta-dot">·</span
              ><time class="oneos-number">{{ item.time }}</time></span
            >
          </div></Timeline.Item
        ></Timeline
      ><Empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" description="暂无处理记录"
    /></OneosSection>
  </OneosPage>
</template>
