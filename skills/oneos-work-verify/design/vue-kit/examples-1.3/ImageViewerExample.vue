<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button, Tag } from 'ant-design-vue';
import { EyeOutlined } from '@ant-design/icons-vue';
import { deliveryImageItems, returnImageItems, singleImageItems } from '../../image-viewer-fixtures';
import OneosImageViewer from '../patterns/OneosImageViewer.vue';
import OneosPage from '../patterns/OneosPage.vue';
import OneosSection from '../patterns/OneosSection.vue';

const album = ref<'delivery' | 'return' | 'single' | 'empty' | 'restricted' | 'broken'>('delivery');
const open = ref(false);
const activeIndex = ref(0);
const items = computed(() => {
  if (album.value === 'return') return returnImageItems;
  if (album.value === 'single') return singleImageItems;
  if (album.value === 'empty') return [];
  if (album.value === 'restricted') return deliveryImageItems.map((item, index) => (index === 0 ? { ...item, canDownload: false } : item));
  if (album.value === 'broken') return [{ ...deliveryImageItems[0]!, id: 'broken-image', url: 'data:image/svg+xml,invalid%ZZ', name: '加载失败示例.svg' }, ...deliveryImageItems.slice(1)];
  return deliveryImageItems;
});
const albumName = computed(() => ({ delivery: '交车相册', return: '还车相册', single: '单张状态', empty: '空相册', restricted: '下载受限', broken: '加载失败' })[album.value]);

function view(index: number) {
  const item = items.value[index];
  if (!item) return;
  activeIndex.value = index;
  open.value = true;
}

async function failedDownload() {
  throw new Error('示范下载失败');
}
</script>

<template>
  <OneosPage label="图片查看器">
    <template #header><div class="lab-page-title"><h1>图片查看器</h1><span class="oneos-secondary">交车与还车按同车同次分别成册</span></div></template>
    <template #summary><p class="oneos-secondary">部位缩略图只决定起始图片；进入后可查看该册全部部位照片。</p></template>
    <OneosSection title="车辆部位相册" description="示范数据仅用于组件验收，不对应真实车辆或客户。">
      <template #aside><Tag color="processing">{{ albumName }}</Tag></template>
      <div class="iv-example-actions"><Button :type="album === 'delivery' ? 'primary' : 'default'" @click="album = 'delivery'">交车相册</Button><Button :type="album === 'return' ? 'primary' : 'default'" @click="album = 'return'">还车相册</Button><Button :type="album === 'single' ? 'primary' : 'default'" @click="album = 'single'">单张</Button><Button :type="album === 'empty' ? 'primary' : 'default'" @click="album = 'empty'">空态</Button><Button :type="album === 'restricted' ? 'primary' : 'default'" @click="album = 'restricted'">禁下载</Button><Button :type="album === 'broken' ? 'primary' : 'default'" @click="album = 'broken'">坏图重试</Button></div>
      <div v-if="items.length" class="iv-example-grid">
        <article v-for="(item, index) in items" :key="item.id" class="iv-example-card"><button type="button" :aria-label="`预览${item.partLabel}`" @click="view(index)"><img :src="item.url" :alt="item.alt" /><span><EyeOutlined />预览</span></button><div><strong>{{ item.partLabel }}</strong><small>{{ item.name }}</small></div></article>
      </div>
      <div v-else class="iv-example-empty">暂无图片 <Button size="small" @click="open = true">打开空相册</Button></div>
    </OneosSection>
    <OneosImageViewer v-model:open="open" v-model:active-index="activeIndex" :items="items" :title="`车辆沪A·D2308 · ${albumName}`" :on-download="album === 'broken' ? failedDownload : undefined" />
  </OneosPage>
</template>

<style scoped>
.iv-example-actions { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
.iv-example-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
.iv-example-card { border:1px solid var(--oneos-line); border-radius:10px; overflow:hidden; background:var(--oneos-surface); }
.iv-example-card button { position:relative; display:block; width:100%; padding:0; border:0; background:var(--oneos-fill); cursor:pointer; }
.iv-example-card img { display:block; width:100%; aspect-ratio:4/3; object-fit:cover; }
.iv-example-card button span { position:absolute; inset:auto 8px 8px auto; padding:4px 8px; border-radius:6px; background:rgb(23 44 62 / .82); color:#fff; font-size:12px; }
.iv-example-card div { display:grid; gap:3px; padding:9px 10px; }
.iv-example-card small { overflow:hidden; color:var(--oneos-muted); font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
.iv-example-empty { padding:36px; color:var(--oneos-muted); text-align:center; border:1px dashed var(--oneos-line); border-radius:10px; }
</style>
