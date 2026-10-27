<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Button, Popover } from 'ant-design-vue';

export type ValidationStatus = 'success' | 'error' | 'warning' | 'duplicate' | 'unknown';

export interface ValidationFact {
  label: string;
  value: string;
  mono?: boolean;
}

let nextContentId = 0;

const props = withDefaults(
  defineProps<{
    status: ValidationStatus;
    title: string;
    details?: string[];
    facts?: ValidationFact[];
    actionLabel?: string;
    disabled?: boolean;
    disabledReason?: string;
    showLabel?: boolean;
  }>(),
  { details: () => [], facts: () => [], disabled: false, showLabel: false },
);

const emit = defineEmits<{ action: [] }>();
const trigger = ref<HTMLElement>();
const content = ref<HTMLElement>();
const open = ref(false);
const contentId = `oneos-validation-${++nextContentId}`;
const focusableSelector = 'button:not(:disabled),a[href],input:not(:disabled)';

function show() {
  open.value = true;
}

function close() {
  open.value = false;
}

function closeAndFocus() {
  trigger.value?.focus();
  open.value = false;
}

function closeAfterBlur(event: FocusEvent) {
  const next = event.relatedTarget;
  if (next instanceof Node && (trigger.value?.contains(next) || content.value?.contains(next))) return;
  close();
}

function closeFromEscape() {
  closeAndFocus();
}

function contentKeys(event: KeyboardEvent) {
  if (event.key !== 'Tab') return;
  const items = Array.from(content.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
  if (!items.length) return;
  if (event.shiftKey && document.activeElement === items[0]) {
    event.preventDefault();
    closeAndFocus();
  } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
    event.preventDefault();
    const pageItems = Array.from(document.querySelectorAll<HTMLElement>(`${focusableSelector},[tabindex="0"]`))
      .filter((item) => !content.value?.contains(item) && item.getClientRects().length);
    pageItems[pageItems.indexOf(trigger.value!) + 1]?.focus();
    open.value = false;
  }
}

function triggerKeys(event: KeyboardEvent) {
  if (event.key !== 'Tab' || event.shiftKey || !open.value) return;
  const first = content.value?.querySelector<HTMLElement>('button:not(:disabled)');
  if (first) {
    event.preventDefault();
    first.focus();
  }
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!open.value) return;
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (!trigger.value?.contains(target) && !content.value?.contains(target)) close();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault();
    closeFromEscape();
  }
}

function getPopupContainer() {
  return trigger.value?.closest<HTMLElement>('.oneos-surface, .canon-root, .vh2-page') ?? document.body;
}

function runAction() {
  if (!props.disabled) {
    emit('action');
    closeAndFocus();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
  document.addEventListener('keydown', handleKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Popover
    :open="open"
    trigger="hover"
    placement="top"
    :mouse-enter-delay="0.15"
    :mouse-leave-delay="0.2"
    :z-index="10080"
    :get-popup-container="getPopupContainer"
    overlay-class-name="oneos-validation-popover"
    @update:open="open = $event"
  >
    <template #content>
      <div ref="content" :id="contentId" class="oneos-validation-content" role="dialog" :aria-label="title" @click.stop @keydown="contentKeys" @focusin="show" @focusout="closeAfterBlur">
        <div class="oneos-validation-title" :data-status="status">
          <svg v-if="status === 'success'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
          <svg v-else-if="status === 'error'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <svg v-else-if="status === 'warning'" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 9 16H3L12 4Z" /><path d="M12 9v5M12 17h.01" /></svg>
          <svg v-else-if="status === 'duplicate'" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="14" height="14" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.8 9a2.3 2.3 0 1 1 3.8 1.75c-.9.73-1.6 1.22-1.6 2.75M12 16.5h.01" /></svg>
          <strong>{{ title }}</strong><button type="button" class="oneos-validation-close" aria-label="关闭核验说明" @click="closeAndFocus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg></button>
        </div>
        <p v-for="detail in details" :key="detail" class="oneos-validation-description">{{ detail }}</p>
        <dl v-if="facts.length" class="oneos-validation-facts">
          <div v-for="fact in facts" :key="fact.label">
            <dt>{{ fact.label }}</dt>
            <dd :class="{ 'is-mono': fact.mono }">{{ fact.value ?? '—' }}</dd>
          </div>
        </dl>
        <div v-if="actionLabel" class="oneos-validation-actions">
          <Button
            type="primary"
            :disabled="disabled"
            :title="disabled ? disabledReason : undefined"
            @click="runAction"
          >{{ actionLabel }}</Button>
        </div>
        <p v-if="disabledReason" class="oneos-validation-description">{{ disabledReason }}</p>
      </div>
    </template>
    <span class="oneos-validation-indicator">
      <button
        ref="trigger"
        type="button"
        class="oneos-validation-trigger"
        :data-status="status"
        :aria-label="title"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-controls="open ? contentId : undefined"
        @focus="show"
        @blur="closeAfterBlur"
        @keydown="triggerKeys"
        @click.stop="show"
      >
        <svg v-if="status === 'success'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
        <svg v-else-if="status === 'error'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        <svg v-else-if="status === 'warning'" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 9 16H3L12 4Z" /><path d="M12 9v5M12 17h.01" /></svg>
        <svg v-else-if="status === 'duplicate'" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="14" height="14" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.8 9a2.3 2.3 0 1 1 3.8 1.75c-.9.73-1.6 1.22-1.6 2.75M12 16.5h.01" /></svg>
        <span v-if="showLabel" class="oneos-validation-trigger__label">{{ title }}</span>
      </button>
    </span>
  </Popover>
</template>

<style scoped>
.oneos-validation-trigger svg,.oneos-validation-title svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
.oneos-validation-close svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; }
</style>
