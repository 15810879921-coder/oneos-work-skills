<script setup lang="ts">
import { ref } from 'vue';
import OneosSurface from '../patterns/OneosSurface.vue';
import ImageViewerExample from './ImageViewerExample.vue';

const mode = ref<'light' | 'dark'>('light');
</script>

<template>
  <OneosSurface class="image-viewer-standalone" :mode="mode">
    <header class="image-viewer-standalone__header"><strong>OneOS V2 · Vue 3 图片查看器</strong><button type="button" @click="mode = mode === 'light' ? 'dark' : 'light'">{{ mode === 'light' ? '深色预览' : '浅色预览' }}</button></header>
    <ImageViewerExample />
  </OneosSurface>
</template>

<style scoped>
.image-viewer-standalone { min-height: 100vh; background:var(--oneos-canvas); }
.image-viewer-standalone__header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid var(--oneos-line); color:var(--oneos-ink); background:var(--oneos-surface); }
.image-viewer-standalone__header button { min-height:32px; padding:0 10px; border:1px solid var(--oneos-line-control); border-radius:8px; color:var(--oneos-ink); background:transparent; cursor:pointer; }
</style>
