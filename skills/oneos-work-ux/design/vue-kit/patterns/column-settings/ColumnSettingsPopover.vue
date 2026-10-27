<script setup>
import {Button as AButton, Checkbox as ACheckbox, InputNumber as AInputNumber, Popover as APopover} from 'ant-design-vue';
import {ArrowDown, ArrowUp, GripVertical, LockKeyhole, Settings, X} from 'lucide-vue-next';
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {canMoveColumn, moveColumn} from './column-settings.mjs';

const props = defineProps({
  open: {type: Boolean, default: undefined}, columns: {type: Array, required: true}, defaults: {type: Array, required: true},
  getPopupContainer: {type: Function, required: true}, widthEnabled: Boolean,
  minWidth: {type: Number, default: 100}, maxWidth: {type: Number, default: 420},
  saveStatus: String, saveError: String, saveScope: {type: String, default: '仅当前页面生效'},
});
const emit = defineEmits(['update:open', 'change', 'retry']);
const trigger = ref(), panel = ref(), dragKey = ref(''), dropKey = ref('');
const localOpen = ref(false);
const opened = computed(() => props.open === undefined ? localOpen.value : props.open);
const panelWidth = ref(360), panelHeight = ref(400);
const hiddenCount = computed(() => props.columns.filter(column => !column.visible).length);
const statusText = computed(() => ({saving: '正在保存…', saved: '已保存', idle: '更改后自动保存', session: '刷新后恢复默认'}[props.saveStatus] || ''));
const triggerElement = () => trigger.value?.$el || trigger.value;
let observer, observedContainer;
function measure() {
  const element = triggerElement();
  const container = element && props.getPopupContainer(element);
  const available = Math.min(window.innerWidth - 24, (container?.clientWidth || window.innerWidth) - 24);
  panelWidth.value = Math.max(1, Math.min(380, available));
  panelHeight.value = Math.max(120, Math.min(440, window.innerHeight - 180));
  if (container && observer && container !== observedContainer) {observer.disconnect(); observer.observe(container); observedContainer = container;}
}
function setOpen(value) {
  if (value) measure();
  localOpen.value = value;
  emit('update:open', value);
  dragKey.value = ''; dropKey.value = '';
  nextTick(() => {
    if (value) panel.value?.querySelector('button:not(:disabled),input:not(:disabled)')?.focus({preventScroll: true});
    else triggerElement()?.focus({preventScroll: true});
  });
}
function changeColumn(key, patch) {
  emit('change', props.columns.map(column => column.key === key && !column.locked ? {...column, ...patch} : {...column}));
}
async function move(key, delta) {
  if (!canMoveColumn(props.columns, key, delta)) return;
  const index = props.columns.findIndex(column => column.key === key);
  emit('change', moveColumn(props.columns, key, props.columns[index + delta].key));
  await nextTick();
  if (!opened.value) return;
  const row = [...(panel.value?.querySelectorAll('[data-column-key]') || [])].find(element => element.dataset.columnKey === key);
  // Reaching a locked boundary disables the pressed button. Keep keyboard control on this column.
  const target = row?.querySelector(`[data-move="${delta}"]:not(:disabled)`) || row?.querySelector('.ocs-move:not(:disabled)') || row?.querySelector('input:not(:disabled)') || row?.querySelector('.ocs-handle:not(:disabled)');
  target?.focus({preventScroll: true});
}
function dragStart(event, column) {
  if (column.locked) {event.preventDefault(); return;}
  dragKey.value = column.key;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', column.key);
}
function dragOver(event, column) {
  if (!dragKey.value || column.locked) return;
  event.preventDefault(); event.dataTransfer.dropEffect = 'move'; dropKey.value = column.key;
}
function drop(event, column) {
  event.preventDefault();
  if (dragKey.value && !column.locked) emit('change', moveColumn(props.columns, dragKey.value, column.key));
  dragKey.value = ''; dropKey.value = '';
}
watch(() => props.open, value => {if (!value) {dragKey.value = ''; dropKey.value = '';}});
onMounted(() => {observer = new ResizeObserver(measure); measure(); window.addEventListener('resize', measure);});
onBeforeUnmount(() => {observer?.disconnect(); window.removeEventListener('resize', measure);});
</script>

<template>
  <APopover :open="opened" trigger="click" placement="bottomRight" :get-popup-container="getPopupContainer"
    overlay-class-name="oneos-column-settings-overlay" :overlay-style="{width:panelWidth+'px',maxWidth:'calc(100vw - 24px)'}"
    :auto-adjust-overflow="true" @open-change="setOpen">
    <template #content>
      <section ref="panel" class="ocs-panel" role="dialog" aria-label="列设置" @keydown.esc.stop.prevent="setOpen(false)">
        <div class="ocs-heading"><strong>列设置</strong><div class="ocs-heading-actions"><AButton type="link" size="small" @click="emit('change',defaults.map(column=>({...column})))">恢复默认</AButton><button type="button" class="ocs-close" aria-label="关闭列设置" title="关闭" @click="setOpen(false)"><X :size="16"/></button></div></div>
        <p class="ocs-summary" aria-live="polite">已隐藏 {{hiddenCount}} 列</p>
        <div class="ocs-list" :style="{maxHeight:panelHeight+'px'}">
          <div v-for="column in columns" :key="column.key" class="ocs-row" :class="{'ocs-row--target':dropKey===column.key,'ocs-row--dragging':dragKey===column.key}"
            :data-column-key="column.key" @dragover="dragOver($event,column)" @drop="drop($event,column)">
            <div class="ocs-field">
              <button type="button" class="ocs-handle" :draggable="!column.locked" :disabled="column.locked" :aria-label="'拖动'+column.title+'调整顺序'"
                :title="column.locked?'固定列':'拖动调整顺序，也可使用上下移按钮'" @dragstart="dragStart($event,column)" @dragend="dragKey='';dropKey=''">
                <LockKeyhole v-if="column.locked" :size="14"/><GripVertical v-else :size="15"/>
              </button>
              <ACheckbox :checked="column.visible" :disabled="column.locked" @change="changeColumn(column.key,{visible:$event.target.checked})"><span class="ocs-label">{{column.title}}</span></ACheckbox>
              <span v-if="column.locked" class="ocs-locked">固定</span>
            </div>
            <div v-if="widthEnabled || !column.locked" class="ocs-controls">
              <label v-if="widthEnabled" class="ocs-width"><span>列宽</span><AInputNumber :value="column.width" :min="minWidth" :max="maxWidth" :step="10" size="small"
                :disabled="column.locked" :aria-label="column.title+'列宽'" @change="value=>{if(value!==null)changeColumn(column.key,{width:value})}"/><span>px</span></label>
              <div class="ocs-moves"><button type="button" class="ocs-move" data-move="-1" :disabled="!canMoveColumn(columns,column.key,-1)" :aria-label="'上移'+column.title" title="上移" @click="move(column.key,-1)"><ArrowUp :size="14"/></button><button type="button" class="ocs-move" data-move="1" :disabled="!canMoveColumn(columns,column.key,1)" :aria-label="'下移'+column.title" title="下移" @click="move(column.key,1)"><ArrowDown :size="14"/></button></div>
            </div>
          </div>
        </div>
        <div class="ocs-save" aria-live="polite"><span>{{saveScope}}</span><span v-if="saveStatus!=='error'">{{statusText}}</span></div>
        <div v-if="saveStatus==='error'" class="ocs-error" role="alert"><span>{{saveError||'列设置保存失败，当前展示仍生效'}}</span><AButton type="link" size="small" @click="emit('retry')">重试保存</AButton></div>
      </section>
    </template>
    <AButton ref="trigger" class="ocs-trigger" type="text" size="small" aria-label="列设置" :aria-expanded="opened" aria-haspopup="dialog" :title="hiddenCount?'列设置，已隐藏'+hiddenCount+'列':'列设置'" @click.stop>
      <Settings :size="14"/><span v-if="hiddenCount" class="ocs-count" aria-hidden="true">{{hiddenCount}}</span>
    </AButton>
  </APopover>
</template>

<style>
.oneos-column-settings-overlay{box-sizing:border-box;min-width:0!important;}
.oneos-column-settings-overlay .ant-popover-inner{box-sizing:border-box;min-width:0;max-width:100%;padding:12px;}
.oneos-column-settings-overlay .ant-popover-inner-content{min-width:0;max-width:100%;}
.ocs-panel,.ocs-panel *{box-sizing:border-box;}
.ocs-panel{width:100%;min-width:0;max-width:100%;color:var(--ln-ink,inherit);font-size:var(--lease-font,14px);white-space:normal;text-align:left;}
.ocs-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;}
.ocs-heading strong{font-size:inherit;}.ocs-heading .ant-btn{flex:none;}
.ocs-heading-actions{display:flex;align-items:center;flex-wrap:wrap;justify-content:flex-end;gap:6px;min-width:0;}
.ocs-panel .ocs-summary{margin:2px 0 8px;color:var(--ln-muted,#64758a);font-size:12px;}
.ocs-list{width:100%;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;}
.ocs-row{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;padding:9px 2px;border-top:1px solid var(--ln-hairline-weak,#e9eef3);min-width:0;max-width:100%;}
.ocs-row--target{background:var(--primary-light,#edf7f5);box-shadow:inset 0 2px var(--primary,#00805f);}.ocs-row--dragging{opacity:.6;}
.ocs-field{display:flex;align-items:flex-start;gap:6px;min-width:0;max-width:100%;}
.ocs-field .ant-checkbox-wrapper{display:flex;align-items:flex-start;flex:1;min-width:0;margin:0!important;white-space:normal;line-height:22px;}
.ocs-field .ant-checkbox{flex:none;align-self:flex-start;margin-top:3px;}.ocs-field .ant-checkbox+span{min-width:0;padding-inline-end:0;}
.ocs-label{overflow-wrap:anywhere;word-break:break-word;white-space:normal;}
.ocs-locked{flex:none;padding-top:2px;font-size:12px;color:var(--ln-muted,#64758a);}
.ocs-panel button.ocs-handle,.ocs-panel button.ocs-move,.ocs-panel button.ocs-close{display:inline-flex;align-items:center;justify-content:center;flex:none;width:26px;height:26px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--ln-muted,#64758a);font:inherit;cursor:pointer;}
.ocs-panel button.ocs-handle{width:20px;cursor:grab;}.ocs-panel button.ocs-handle:active{cursor:grabbing;}
.ocs-panel button.ocs-handle:disabled,.ocs-panel button.ocs-move:disabled{opacity:.4;cursor:default;}
.ocs-panel button.ocs-move:hover:not(:disabled),.ocs-panel button.ocs-close:hover{background:var(--primary-light,#edf7f5);color:var(--primary,#00805f);}
.ocs-panel button:focus-visible{outline:2px solid var(--primary,#00805f);outline-offset:1px;}
.ocs-controls{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:6px 10px;padding-inline-start:26px;min-width:0;max-width:100%;}
.ocs-width{display:flex;align-items:center;gap:6px;min-width:0;max-width:100%;margin:0;color:var(--ln-muted,#64758a);font-size:12px;}
.ocs-width .ant-input-number{width:80px;min-width:0;max-width:100%;}.ocs-width>span{flex:none;}
.ocs-moves{display:flex;gap:2px;flex:none;margin-inline-start:auto;}
.ocs-save{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 8px;padding-top:10px;border-top:1px solid var(--ln-hairline-weak,#e9eef3);color:var(--ln-muted,#64758a);font-size:12px;overflow-wrap:anywhere;}
.ocs-error{display:flex;align-items:flex-start;flex-wrap:wrap;gap:2px 6px;margin-top:4px;color:var(--ln-danger,#c53030);font-size:12px;overflow-wrap:anywhere;}.ocs-error>span{flex:1 1 180px;min-width:0;}.ocs-error .ant-btn{flex:none;padding:0;}
.ocs-trigger.ant-btn{display:inline-flex;align-items:center;justify-content:center;gap:3px;flex:none;height:26px;min-width:26px;padding:0 3px;border:0;box-shadow:none;}
.ocs-count{font-size:11px;line-height:1;font-variant-numeric:tabular-nums;}
</style>
