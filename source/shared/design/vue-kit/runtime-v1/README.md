# OneOS PC 1.3 · Vue Runtime 1.0.6

2026-10-26。1.0.5 补齐 Message/Notification 跟随宿主圆角（含直角）、本页容器和已打开消息的动态主题；徽标圆点和状态标签的固定语义形状保留。1.0.3 修正自定义主题下按钮正常/悬停/按下的文字颜色，并按自身背景处理步骤图标、默认徽标计数；提示框和自定义实色标签保留各自颜色语义。已包含 1.0.2 的严格 TypeScript 声明补丁。规范页与接入页面复用同一主题适配器；六个业务页面由各自任务显式接入，迁移状态与接口完成度单独验收。

## 使用入口

1.0.6 修正规范表单/详情的 767/1279 视口断点与 bordered 描述表连续边框。`pattern-contract.css` 是最新确认的布局增量，生成到隔离后的 `patterns.scoped.css`；原有全局 patterns 文件保持不变，避免影响未接入页面。页型结构与业务字段须同时遵守 `ONEOS-PAGE-CANON.md` 的本批映射，不能以 Runtime 接入替代页面符合性验收。

- 页面范例：`oneos-page-canon`，默认进入规范总览。
- 组件规范：`oneos-v2`，默认进入基础控件；`?view=vue-map` 进入前端接入。
- 本机独立预览：`http://127.0.0.1:5698/`，仅绑定本机回环地址。
- 旧 React 范例使用 `?renderer=react`；H5、历史表单布局和工作台保留原入口，未纳入本次 Vue PC 验收。

支持 Vue 3.5.42、Ant Design Vue 4.2.6、VXE Table 4.21.9、VXE PC UI 4.12.16。版本固定在规范子应用的 package-lock.json；它们来自本机已验证前端依赖，不升级根项目和业务服务依赖。VXE 是表格库，axe-core 是独立的无障碍检测工具；实际扫描覆盖与未验证项以验收报告为准。

## 规范结构

| 范围 | 运行内容 |
| --- | --- |
| 页面范式 | 标准台账、多操作台账、主子台账、数据核验、分组表单、业务详情 |
| 控件 | 按钮、输入、数值、单/多选、树选、级联、日期/区间/时间、复选/单选/开关、滑块、标签、徽标、附件、页签、步骤、分页 |
| 状态与反馈 | 正常、无数据、加载、失败/重试、禁用、校验；弹窗、抽屉、确认、消息、通知、结果页、图片查看 |
| 框架设置 | 主题色、light/dark/auto、圆角、密度、侧栏/顶栏布局预览、折叠、半深色、标签栏和面包屑 |

范例复用 examples-1.3 和 patterns；默认量尺为普通控件 36px、紧凑 32px、单层表头 32px、圆角 10px、PC 工作区 24px。内容行高按单行/双行/三行与业务内容登记，不强制所有行同高。默认圆角不是覆盖用户设置的常量。

## 对接本机 RuoYi / Vben

这里适配的是本机已验证的 RuoYi/Vben 前端，并非承诺所有 RuoYi 分支使用同一接口。

| 偏好字段 | 行为 |
| --- | --- |
| theme.colorPrimary | 同步 Ant 按钮、链接、选中态及 VXE；前景色按当前背景保证文字可读，业务状态色保持独立 |
| theme.mode | light / dark / auto；auto 监听系统主题变化 |
| theme.radius | rem 数值，默认 0.625；适配范围 0–1rem（0–16px） |
| app.compact | false 为 36px，true 为 32px；不重复叠加 compact 算法 |
| theme.semiDarkSidebar / semiDarkHeader | 规范页演示对应效果；业务端仍由原框架布局负责 |
| app.layout / sidebar.collapsed | 规范页支持 sidebar-nav / header-nav 与折叠；其他布局沿用原框架，不能用此示例替换全站布局 |
| tabbar.enable / breadcrumb.enable | 规范页展示显隐；不写入原框架存储 |

```vue
<OneosDesignProvider :preferences="preferences" v-slot="{ container }">
  <ApprovedBusinessPage />
  <Modal :get-container="container" />
  <Drawer :get-container="container" />
</OneosDesignProvider>
```

`preferences` 从原前端的偏好存储读取；适配器不 resetPreferences、不改 CONFIG_VERSION，不重置用户设置。消息与通知在 Provider 内的子组件使用 `App.useApp()`；不要使用脱离上下文的全局静态消息入口。业务控件继续保留原 props、model、事件、权限和接口。完整接入本目录的运行文件及字体，并满足 `@ctrl/tinycolor@3.6.1`，不要只复制一个 .vue 文件。

正式前端以新目录 `components/oneos-design/runtime-v1/` 接入并直接导入 `OneosDesignProvider.vue`，不覆盖原有 `antd-theme.ts`、`patterns`、`index.ts` 或全站入口。本包的 `base-theme.ts`、`patterns.scoped.css`、`query.scoped.css` 都由 `sync-generated.mjs` 从现行规范自动生成，修改规范后重新生成，禁止分别手工维护。独立字体别名 `OneOS Runtime Mono` 不替换其他页面已经使用的字体定义。运行包不导入 Ant reset 或 VXE 全局样式；继续使用业务前端原有的库初始化。

运行时继承宿主语言，不改全局 locale。Ant Design Vue 4.2.6 的嵌套主题会写入静态消息使用的全局 token fallback；`host-theme-guard.ts` 同步撤回带本运行时标记的这一次写入，让本页仍通过 Vue 上下文取得局部主题，同时保留宿主及旧页面的全局主题更新。该适配器依赖已固定的 Ant 内部导出，升级 Ant 前必须重验无父主题/有父主题、多个实例、挂载/卸载、宿主主题更新及静态 message/Modal，不能把本版本验证外推到其他 Ant 版本。

`notice-theme.ts` 适配 Ant 4.2.6 打开通知时固定主题类的问题：只更新本实例已知的消息/通知主题类，保留内容、关闭回调和原持续时间，不重新打开消息，不重挂业务组件。Provider 等根元素就绪后仅首次挂载 App，确保消息和通知容器处于本页内。嵌套运行实例、未接入页面及静态入口不在修正范围；升级 Ant 时须重新验收。

`select-accessibility.ts` 只在接入根内修正 Ant 4.2.6 的下拉 ARIA 元数据：真实展开状态、已挂载列表引用、已提供的控件/表单标签。它不提供业务含义、不改变值、事件或键盘行为；业务页必须提供明确字段标签，并回归键盘选择、动态选项和错误状态。未具备名称的字段仍作为验收失败，不能用统一空标签掩盖。状态标签的文字颜色与装饰背景分开，浅色文字对比度使用运行时语义色。

实底按钮、步骤图标以及默认徽标分别按 Ant 最终背景选择前景；计数徽标链接悬停按悬停背景计算。品牌色不能写入所有实底组件共用的文字 Token。自定义/preset 实色 Badge、Ribbon、Tag 不套用默认错误色的文字规则；调用页指定自定义底色时须配套可读前景并验收，不能仅凭运行包接入声称任意自定义配色已通过。

## 隔离、版本与验收

规范通过 iframe 装入现有 React 展示壳，Ant reset 和 VXE 库样式留在 iframe。可复用 Runtime 的覆盖以 `.oneos-surface[data-oneos-runtime='1']` 为边界，不修改 document 根主题、VXE 全局主题和旧共享组件。预览存储键仅为 `oneos.design-canon.preferences.v1`；存储不可用时使用内存配置。

业务迁移必须显式登记页面和版本，先读 UI-MIGRATION-CONTRACT.md。六模块由各自任务显式接入并验收；本包不自动迁移其他页面，不替换 5668 已验证运行基线，不写测试环境。不得将规范实例通过写成全前端已经一致。

规范源码：`src/prototypes/oneos-page-canon/vue/`。本目录的 theme.ts、preferences.mjs、colors.mjs、runtime.css 是主题适配实现。独立构建把资源封装为本地 iframe HTML，并输出 `.spec/vue-runtime-manifest.json` 的源码与产物哈希；现有两个入口共用这一个产物。

本机维护命令（由开发代理执行）：

```sh
cd src/prototypes/oneos-page-canon/vue
npm ci --ignore-scripts
npm test
npm run check:runtime
npm run build
npm run dev
```

更新规范代码、范例或规范正文后重新构建和验收，不能继续引用旧截图或旧指纹。静态门禁、真实页面检查、源码隔离与独立复核分别记录。TEST/PROD 的构建、提交和部署均不包含在这些命令内。

可从原型仓运行 `node src/resources/design-system/vue-kit/runtime-v1/export-package.mjs <绝对路径的新目录>` 生成接入包。工具拒绝覆盖旧包，manifest.json 记录每个运行文件的哈希和整包指纹，接入时核验同一版本。`sync-generated.mjs` 和导出工具仅在规范仓维护使用，不需要复制进业务前端。
