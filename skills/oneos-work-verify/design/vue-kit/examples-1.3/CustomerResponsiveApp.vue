<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Button, ConfigProvider, Segmented, Select } from "ant-design-vue";
import {
  BulbOutlined,
  MobileOutlined,
  TabletOutlined,
  ExpandOutlined,
} from "@ant-design/icons-vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import OneosSurface from "../../src/components/oneos-design/patterns/OneosSurface.vue";
import CustomerResponsivePage from "./CustomerResponsivePage.vue";
import "./customer-responsive.css";

const params = new URLSearchParams(location.search);
const mode = ref(params.get("mode") === "fold" ? "fold" : "phone");
const theme = ref<"light" | "dark">(
  params.get("theme") === "dark" ? "dark" : "light",
);
const primary = ref(params.get("primary") === "rose" ? "#BD4667" : "#007A55");
const embedded = params.get("embed") === "1";
const deviceStyle = computed(() =>
  embedded
    ? {}
    : {
        width: mode.value === "phone" ? "390px" : "820px",
        height: mode.value === "phone" ? "844px" : "900px",
      },
);
function updateAddress() {
  const url = new URL(location.href);
  url.searchParams.set("mode", mode.value);
  url.searchParams.set("theme", theme.value);
  history.replaceState(history.state, "", url);
}
// Back changes the customer page, while the selected preview size/theme stays.
onMounted(() => window.addEventListener("popstate", updateAddress));
onBeforeUnmount(() => window.removeEventListener("popstate", updateAddress));
const openFull = computed(
  () =>
    `?mode=${mode.value}&embed=1&theme=${theme.value}&primary=${primary.value === "#BD4667" ? "rose" : "green"}`,
);
</script>

<template>
  <ConfigProvider :locale="zhCN">
    <OneosSurface
      class="crp-review"
      :class="{ 'is-embedded': embedded }"
      :mode="theme"
      :primary="primary"
    >
      <header v-if="!embedded" class="crp-review-bar">
        <div class="crp-review-title">
          <span class="crp-review-mark">O</span>
          <div><strong>客户管理</strong><span>多屏适配 · 交互原型</span></div>
        </div>
        <Segmented
          v-model:value="mode"
          aria-label="预览设备"
          :options="[
            { value: 'phone', label: '手机紧凑模式' },
            { value: 'fold', label: '折叠屏展开模式' },
          ]"
          @change="updateAddress"
        >
          <template #label="{ value }"
            ><MobileOutlined v-if="value === 'phone'" /><TabletOutlined
              v-else
            /><span>{{
              value === "phone" ? "手机紧凑模式" : "折叠屏展开模式"
            }}</span></template
          >
        </Segmented>
        <div class="crp-review-tools">
          <Select
            v-model:value="primary"
            aria-label="原型主题色"
            :options="[
              { value: '#007A55', label: '青绿' },
              { value: '#BD4667', label: '玫红' },
            ]"
          />
          <Button
            :aria-label="theme === 'light' ? '查看深色效果' : '查看浅色效果'"
            @click="
              theme = theme === 'light' ? 'dark' : 'light';
              updateAddress();
            "
            ><BulbOutlined />{{ theme === "light" ? "深色" : "浅色" }}</Button
          >
          <Button :href="openFull" target="_blank"
            ><ExpandOutlined /><span class="crp-open-label"
              >原尺寸体验</span
            ></Button
          >
        </div>
      </header>
      <main class="crp-stage">
        <div v-if="!embedded" class="crp-stage-caption">
          <span>{{
            mode === "phone" ? "手机 / 折叠屏外屏" : "折叠屏展开 / 中等屏幕"
          }}</span
          ><span class="oneos-number">{{
            mode === "phone" ? "390 × 844" : "820 × 900"
          }}</span>
        </div>
        <div class="crp-device" :style="deviceStyle">
          <CustomerResponsivePage />
        </div>
        <p v-if="!embedded" class="crp-stage-note">
          示例客户 · 不连接业务数据<span>可切换尺寸，筛选与编辑内容会保留</span>
        </p>
      </main>
    </OneosSurface>
  </ConfigProvider>
</template>
