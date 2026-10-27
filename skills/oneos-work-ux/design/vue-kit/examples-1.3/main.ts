import { createApp } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import VxeUI from 'vxe-pc-ui';
import VXETable from 'vxe-table';
import zhCN from 'vxe-pc-ui/lib/language/zh-CN';
import 'ant-design-vue/dist/reset.css';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';
import App from './App.vue';
import './lab.css';

VxeUI.setI18n('zh-CN', zhCN);
VxeUI.setLanguage('zh-CN');
dayjs.locale('zh-cn');
createApp(App).use(VxeUI).use(VXETable).mount('#app');
