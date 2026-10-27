<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  CloseOutlined,
  DownloadOutlined,
  LeftOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  RotateLeftOutlined,
} from '@ant-design/icons-vue';
import './../../components/image-viewer.css';

export interface OneosImageViewerItem {
  id: string;
  url: string;
  name?: string;
  alt?: string;
  partKey?: string;
  partLabel?: string;
  downloadUrl?: string;
  canDownload?: boolean;
}

const props = withDefaults(
  defineProps<{
    items: OneosImageViewerItem[];
    open: boolean;
    activeIndex: number;
    title?: string;
    onDownload?: (item: OneosImageViewerItem) => void | Promise<void>;
  }>(),
  { title: '图片预览' },
);
const emit = defineEmits<{ 'update:open': [value: boolean]; 'update:activeIndex': [value: number] }>();

const dialog = ref<HTMLElement>();
const activeElement = ref<HTMLElement>();
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const imageState = ref<'loading' | 'ready' | 'error'>('loading');
const attempt = ref(0);
const downloading = ref(false);
const downloadError = ref('');
const drag = ref<{ x: number; y: number; offsetX: number; offsetY: number }>();
let bodyOverflow = '';
let scrollLocked = false;

const safeIndex = computed(() => Math.min(Math.max(props.activeIndex, 0), Math.max(props.items.length - 1, 0)));
const current = computed(() => props.items[safeIndex.value]);
const currentName = computed(() => current.value?.partLabel || current.value?.name || '图片');
const itemCount = computed(() => props.items.length);
const canDownload = computed(() => !!current.value && current.value.canDownload !== false);
const isZoomed = computed(() => scale.value > 1);

function resetView() {
  scale.value = 1;
  offset.value = { x: 0, y: 0 };
  imageState.value = current.value ? 'loading' : 'ready';
  downloadError.value = '';
  drag.value = undefined;
}

function setIndex(index: number) {
  if (index < 0 || index >= props.items.length || index === safeIndex.value) return;
  emit('update:activeIndex', index);
}

function close() {
  emit('update:open', false);
}

function zoom(delta: number) {
  scale.value = Math.min(4, Math.max(1, Number((scale.value + delta).toFixed(2))));
  if (scale.value === 1) offset.value = { x: 0, y: 0 };
}

function retryImage() {
  imageState.value = 'loading';
  attempt.value += 1;
}

function imageLoaded() {
  imageState.value = 'ready';
}

function imageFailed() {
  imageState.value = 'error';
}

function startDrag(event: PointerEvent) {
  if (!isZoomed.value || imageState.value !== 'ready') return;
  if (event.target instanceof Element && event.target.closest('button')) return;
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture?.(event.pointerId);
  drag.value = { x: event.clientX, y: event.clientY, offsetX: offset.value.x, offsetY: offset.value.y };
}

function moveDrag(event: PointerEvent) {
  if (!drag.value) return;
  offset.value = {
    x: drag.value.offsetX + event.clientX - drag.value.x,
    y: drag.value.offsetY + event.clientY - drag.value.y,
  };
}

function endDrag() {
  drag.value = undefined;
}

async function defaultDownload(item: OneosImageViewerItem) {
  const response = await fetch(item.downloadUrl || item.url);
  if (!response.ok) throw new Error(`下载失败（${response.status}）`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = item.name || '图片';
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

async function download() {
  if (!current.value || !canDownload.value || downloading.value) return;
  const item = current.value;
  downloading.value = true;
  downloadError.value = '';
  try {
    if (props.onDownload) await props.onDownload(item);
    else await defaultDownload(item);
  } catch {
    if (current.value?.id === item.id) downloadError.value = '原图下载失败，请重试。';
  } finally {
    downloading.value = false;
  }
}

function keydown(event: KeyboardEvent) {
  if (!props.open || event.defaultPrevented) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  } else if (event.key === 'ArrowLeft' && safeIndex.value > 0) {
    event.preventDefault();
    setIndex(safeIndex.value - 1);
  } else if (event.key === 'ArrowRight' && safeIndex.value < itemCount.value - 1) {
    event.preventDefault();
    setIndex(safeIndex.value + 1);
  }
}

function trapFocus(event: KeyboardEvent) {
  if (!props.open || event.key !== 'Tab' || !dialog.value) return;
  const controls = Array.from(dialog.value.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter((element) => element.getClientRects().length > 0);
  if (!controls.length) {
    event.preventDefault();
    dialog.value.focus();
    return;
  }
  const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
  if (event.shiftKey && (currentIndex <= 0 || !dialog.value.contains(document.activeElement))) {
    event.preventDefault();
    controls[controls.length - 1]?.focus();
  } else if (!event.shiftKey && currentIndex === controls.length - 1) {
    event.preventDefault();
    controls[0]?.focus();
  }
}

function lockScroll() {
  if (scrollLocked) return;
  bodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  scrollLocked = true;
}

function restoreFocusAndScroll() {
  if (!scrollLocked) return;
  document.body.style.overflow = bodyOverflow;
  scrollLocked = false;
  activeElement.value?.focus();
  activeElement.value = undefined;
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      activeElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      resetView();
      lockScroll();
      await nextTick();
      dialog.value?.focus();
    } else {
      restoreFocusAndScroll();
    }
  },
  { immediate: true, flush: 'post' },
);
watch([safeIndex, () => props.items.map((item) => `${item.id}:${item.url}`).join('|')], resetView);

onMounted(() => {
  document.addEventListener('keydown', keydown);
  document.addEventListener('keydown', trapFocus);
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', keydown);
  document.removeEventListener('keydown', trapFocus);
  if (props.open) restoreFocusAndScroll();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="oneos-image-viewer" :class="{ 'is-loading': imageState === 'loading', 'is-error': imageState === 'error', 'is-dragging': !!drag, 'is-downloading': downloading }">
      <div class="oneos-image-viewer__backdrop" @click.self="close" />
      <section ref="dialog" class="oneos-image-viewer__dialog" role="dialog" aria-modal="true" :aria-label="title || '图片预览'" tabindex="-1">
        <header class="oneos-image-viewer__header">
          <div class="oneos-image-viewer__heading"><p class="oneos-image-viewer__title"><strong>{{ title || '图片预览' }}</strong></p><p v-if="current" class="oneos-image-viewer__meta">{{ currentName }} · {{ safeIndex + 1 }}/{{ itemCount }}</p></div>
          <div class="oneos-image-viewer__header-actions"><button type="button" class="oneos-image-viewer__button is-icon-only" aria-label="关闭图片预览" @click="close"><CloseOutlined /></button></div>
        </header>

        <div v-if="current" class="oneos-image-viewer__stage" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="endDrag">
          <button v-if="itemCount > 1" type="button" class="oneos-image-viewer__button oneos-image-viewer__nav is-prev" :disabled="safeIndex === 0" aria-label="上一张" @click="setIndex(safeIndex - 1)"><LeftOutlined /></button>
          <div class="oneos-image-viewer__media" :class="{ 'is-draggable': isZoomed, 'is-dragging': !!drag }">
            <div v-if="imageState === 'loading'" class="oneos-image-viewer__loading" role="status">正在加载图片…</div>
            <div v-else-if="imageState === 'error'" class="oneos-image-viewer__error" role="alert"><span>图片加载失败</span><button type="button" class="oneos-image-viewer__button" @click="retryImage"><ReloadOutlined />重试</button></div>
            <img v-show="imageState !== 'error'" :key="`${current.id}-${attempt}`" class="oneos-image-viewer__image" :class="{ 'is-dragging': !!drag }" :src="current.url" :alt="current.alt || current.name || '图片'" :style="{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }" draggable="false" @load="imageLoaded" @error="imageFailed" />
          </div>
          <button v-if="itemCount > 1" type="button" class="oneos-image-viewer__button oneos-image-viewer__nav is-next" :disabled="safeIndex === itemCount - 1" aria-label="下一张" @click="setIndex(safeIndex + 1)"><RightOutlined /></button>
        </div>
        <div v-else class="oneos-image-viewer__empty" role="status">暂无图片</div>

        <footer v-if="current" class="oneos-image-viewer__footer">
          <div class="oneos-image-viewer__toolbar"><div class="oneos-image-viewer__zoom" aria-label="缩放控制"><button type="button" class="oneos-image-viewer__button is-icon-only" :disabled="scale <= 1" aria-label="缩小图片" @click="zoom(-0.25)"><MinusOutlined /></button><output class="oneos-image-viewer__scale">{{ Math.round(scale * 100) }}%</output><button type="button" class="oneos-image-viewer__button is-icon-only" :disabled="scale >= 4" aria-label="放大图片" @click="zoom(0.25)"><PlusOutlined /></button><button type="button" class="oneos-image-viewer__button" :disabled="scale === 1 && offset.x === 0 && offset.y === 0" aria-label="复位图片" @click="resetView"><RotateLeftOutlined /><span class="oneos-image-viewer__button-label">复位</span></button></div>
          <button v-if="canDownload" type="button" class="oneos-image-viewer__button" :class="{ 'is-downloading': downloading }" :disabled="downloading" :aria-label="downloading ? '正在下载原图' : '下载原图'" @click="download"><DownloadOutlined /><span class="oneos-image-viewer__button-label">{{ downloading ? '下载中…' : '下载原图' }}</span></button></div>
        </footer>
        <p v-if="downloadError" class="oneos-image-viewer__download-feedback is-error" role="alert">{{ downloadError }} <button type="button" class="oneos-image-viewer__button" @click="download">重试</button></p>
        <div v-if="itemCount > 1" class="oneos-image-viewer__thumbs" aria-label="图片缩略图">
          <button v-for="(item, index) in items" :key="item.id" type="button" class="oneos-image-viewer__thumb" :class="{ 'is-active': index === safeIndex }" :aria-current="index === safeIndex ? 'true' : undefined" :aria-label="`查看${item.partLabel || item.name || '图片'}，第 ${index + 1} 张`" @click="setIndex(index)"><img :src="item.url" alt="" /></button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
