# OneOS V2 · Vue + Ant Design 组件映射（开发交棒）

> **给谁**：现网 Vue 3 + Ant Design Vue + VXE + Vben 的开发。  
> **可点手册**：`/?p=oneos-v2&view=vue-map`（怎么落地 / 组件映射 / 页面范例 / Token 闸）  
> **组件态位**：`/?p=oneos-v2`（组件廊）  
> **页面范例**：`/?p=oneos-page-canon`  
> **测量尺**：`ONEOS-DESIGN.md` · **页面怎么排**：`ONEOS-PAGE-CANON.md`

**原则**：不对 100% DOM。锁**可见效果 + 语义对等**。先核对目标测试基线的已有主题接线，再最小合并缺失的 Token / 样式；页面原有业务行为优先。

**要放进前端代码、对着原型抠齐**：先读 [`vue-kit/README.md`](./vue-kit/README.md)，可点 `/?p=oneos-v2&view=vue-map`（默认「怎么落地」）。

---

## 0. 怎么操作（5 步）

2026-09-10 起先执行 [`UI-MIGRATION-CONTRACT.md`](./UI-MIGRATION-CONTRACT.md)。**现有页面的字段、数据、校验、权限和事件优先于范例**。Vue 公共结构已提供于 `vue-kit/patterns`，可由 `sync-patterns.py` 同步；展示样板独立运行，不改正式入口。

```text
① 核对目标提交
   锁定测试部署源提交；检查这个分支是否已有主题接线，不能套用旧本地分支的结论
   历史 DS-PILOT 样板仅在局部 OneosSurface 接入 ConfigProvider；此句不代表当前正式入口状态

② 主题跟偏好
   先沿用目标基线已有 Vben 主题；接入 OneOS token-bridge 时对照合并，不重复全局 Provider；Ant Token 只写真值 hex

③ 控件走映射表（本文 §2 / §3）
   禁止第三套库；台账表认 VXE

④ 复用公共页面结构（不是 React）
   OneosPage / OneosSection / OneosToolbar / OneosFieldGrid / OneosDescriptions
   原有表单、VXE、按钮通过插槽承载；保留属性、model、校验、权限指令与事件
   通用布局不再逐页复制；局部 CSS 仅处理本页特有内容

⑤ 对照原型勾必须齐
   密度 / gutter / 主 CTA / 文案 / 空错载 / 信息不被裁
   同时比较业务原值、限制和事件；原型文案若改变业务含义，保留现网口径
```

拷贝清单与验收勾在 `vue-kit/README.md`。

**主题三态（2026-09-14 已核源码）**：规范期望是主题随偏好变化、Ant 水波关闭且不重复接入。最新成功测试部署记录指向 `develop@a8e5156f`；该源码 `apps/web-antd/src/app.vue` 已有 Vben 原生全局 `ConfigProvider`（`useAntdDesignTokens`），`layouts/basic.vue` 无本地新增的 OneOS Provider，`src/styles` 目录不存在，未见旧本地的 `legacy-pages.css` 全局覆盖。旧本地工作树另有布局层全局 OneOS Provider 和局部 `OneosSurface` 接线；不能将其当作测试已部署。测试源码锁文件为 Ant Design Vue 4.2.6、VXE 4.21.9，这只是本次基线版本，后续仍以目标提交锁文件为准；Ant 水波在测试页的实际效果仍需实测。React Ant Design 的 `primaryShadow`、`optionHeight`、`headerBg` 等属性不得直接填入 Vue 4 的组件 Token。

---

## 0a. 搜索与组合筛选按能力接入（2026-09-11）

统一搜索区外观，不强制每页都支持合一智能搜。先查 [搜索与组合筛选契约](./UI-MIGRATION-CONTRACT.md) 与 [首批能力清单](./.spec/search-capability-inventory.md)。

| 页面已有能力 | 接入原则 |
|---|---|
| 单字段搜索 | 保留原字段、输入/选择方式、参数转换和查询事件；只统一视觉 |
| 合一关键词搜索 | 仅在原接口已支持相同 OR 范围、匹配方式和权限时复用；占位文案与实际范围一致 |
| 独立组合筛选 | 保留字段名、ID/文本值、单选/多选和 AND/OR 规则；使用原 Vben 表单与调用逻辑 |
| 原型有、接口未核实的能力 | 标为待核对；保留原可用路径，不新增业务参数或前端模拟查询 |

搜索框中能检索选项，不等于台账接口支持模糊搜索；一个关键词也不能同时写入多个 AND 参数来冒充 OR。不得为了减少控件删除非等价筛选，不得通过合并分页响应或过滤当前页模拟全量结果。数据库表、关联和服务的技术映射只放实现清单，不进入业务界面。

本文后续范例中的“合一智能搜”均以已有能力为前提。公共组件继续通过插槽承载原控件和事件。

## 0b. 三层怎么用

```text
① 页面怎么排  →  范例廊 oneos-page-canon（六型式，只许抄这里）
② 组件用哪个  →  本文映射表（React V2* ⇄ a-* / VXE / Vben）
③ 数字怎么量  →  ONEOS-DESIGN.md Token + 硬门禁；态位对照组件廊
```

PC 1.3 的页面展示先认 `ONEOS-PAGE-CANON.md` §0 与对应 1.3 可点样板；`oneos-baseline-ledger` 只供核对 Token 测量值，其历史布局不覆盖当前连体统计带或页型。

---

## 1. 硬闸（踩一条 = 未完成）

- 禁止把 `UIComponents.tsx` / `V2Button.tsx` 等 React 源码拷进 `ln-one-os-web`
- 允许移植 Token CSS / 类名 / 布局到 Vue `styles/*-parity.css`
- 禁止第三套库（shadcn、Element 新页、Vant、再造 `O2*`）
- 台账表格认 **VXE**（`useVbenVxeGrid`）；不要为「像原型」改成 `a-table`
- `ConfigProvider :wave="{ disabled: true }"`，禁 Ant 水波
- 主色必须跟随偏好：`var(--oneos-primary)`，禁写死 `#007A55` / 旧紫 / 若依蓝
- PC 控件高 **36** · 圆角 **10** · 字号 **13**；H5 可点 **≥44**

### 必须齐 / 允许差

| 必须齐 | 允许差（追这些算浪费） |
|---|---|
| 密度 36/10/13 · 表头 32/12/600 · gutter 24 | 组件内部 DOM |
| 复合格每行 ≥12px 且不被裁 | 表格引擎（现网认 VXE） |
| 无私有 `*-trigger` / `*-input` 绕过官方控件 | 图标 SVG、虚拟列表 |
| 主色跟随偏好；无第二套主色 | 动效曲线、下拉栏位布局 |
| 主 CTA、状态文案、空错载权、流程步骤 | — |

---

## 2. 按钮变体

同一操作区只允许 **1 个 primary**。弹窗取消左、确认右。

| 原型 | 现网 | 必须齐 | Vue 片段 |
|---|---|---|---|
| `primary` | `a-button type="primary"` | 36/10、主色实心白字、**无阴影** | `<a-button type="primary">提交</a-button>` |
| `secondary` | `a-button` 默认 | 可见描边 | `<a-button>暂存</a-button>` |
| `outline` | `ghost` + 主色描边 | 主色描边 + 主色字 | `<a-button type="text" class="oneos-btn-outline">导出</a-button>` |
| `ghost` | `type="text"` | 无边框次要 | `<a-button type="text">取消</a-button>` |
| `danger` | `type="primary" danger` | 实心危险色 | `<a-button type="primary" danger>删除</a-button>` |
| `link` | `type="link"` | 链接色=主色；「更多筛选」不用此档 | `<a-button type="link">查看明细</a-button>` |
| `back` | `default` + 返回文案 | 详情页头次钮 | `<a-button>返回列表</a-button>` |
| 危险次操作 | `default` + `--ln-error` | 不新建 CSS 家族 | 内联 `color` / `borderColor` |

---

## 3. 组件全表

### 3.1 录入

| 原型 | 现网 | 必须齐 | 禁止 |
|---|---|---|---|
| `V2Input` | `a-input` / `a-input-number` / `a-input-password` | 36/10、focus 主色环；`amount` 右对齐+mono；仅原业务允许时按原时机格式化，精度和提交原值不变；只读**虚线边** | 原生 input；自造 `*-field`；`readOnly` 冒充详情 |
| `V2Textarea` | `a-textarea` | 最小高 88；`showCount` 超限转红 | 自造边框 |
| `V2FieldLabel` | `a-form-item` label | 必填标「必填」轻量红字，禁红星红胶囊 | 各页自拼 |
| `V2ImageUpload` | `a-upload` | invalid 红虚线；loading 走条锁交互 | 加载时装「暂无」 |

### 3.2 选择

| 原型 | 现网 | 必须齐 | 禁止 |
|---|---|---|---|
| `V2Select` | `a-select` | 选项行 36/13；默认可清空；禁「请选择」假选项；名录 `show-search` 常开；>200 条远程搜 | 面板内再套灰底 input（框中框） |
| `V2Cascader` | `a-cascader` | `change-on-select`；全国=清空，禁伪节点；提交拆字段 | 拆成两个 Select |
| `V2DatePicker` | `a-date-picker` | 36/10；选中日跟随 `--oneos-primary` | 浏览器自带日期框；浮层写死青绿 |
| `V2SingleInputDateRangePicker` | `a-range-picker`（新建页视觉默认） | 单框双日历；存量页面保留已验证的单边日期、时间精度与参数边界 | 为统一外观改动原查询语义 |
| `V2DateRangePicker` | 两个 `a-date-picker` | 仅起止分别校验时 | 当默认区间 |
| `V2TimePicker` 族 | `a-time-picker` | 与日期同档 | 原生 time |
| `V2RadioGroup` | `a-radio-group` | card 通栏等宽；description ≤一句 | 台阶化宽度 |
| `V2CheckboxGroup` / `V2Switch` | `a-checkbox-group` / `a-switch` | 开态走主色 | — |
| `V2Pagination` | VXE pager / `a-pagination` | 「N 条/页」全文；H5 不用台式分页 | 原生 select 条数 |

**下拉搜索分档（§4.1a）**

| 维度 | 搜索 |
|---|---|
| 名录型（客户/项目/人员/车牌/VIN/站点/合同号） | **always**，不看当前几条 |
| 枚举型 ≤7 | 不出搜索框 |
| 枚举型 8–20 | 搜索进触发器 |
| 名录 >200 | `filterOption=false` + `@search` 远程，防抖 300ms，限 20 条 |

### 3.3 反馈

| 原型 | 现网 | 必须齐 | 禁止 |
|---|---|---|---|
| `V2Modal` | `a-modal` | 圆角 14；脚部 `a-button`；取消左确认右 | 自造 `*-modal` |
| `V2Drawer` | `a-drawer` | 宽 360/480/720；只承载「看一眼就回」 | 重详情塞抽屉 |
| `V2Popconfirm` | `a-popconfirm` / `Modal.confirm` | 替代浏览器原生确认框 | 原生 confirm/alert |
| `V2Badge` / `V2Tag` | `a-tag` / `a-badge` | 颜色+文字双通道；`purple` 读作主色 | 纯色块无文字 |
| `V2Empty` | `a-empty` | 原因一句 + 下一步 | Ant 默认黑匣子 |
| `V2Toast` | `message` / `notification` | 最多 1 条；z=`--ln-z-toast` | 黑圈叉 |

### 3.4 结构 / 台账

| 原型 | 现网 | 必须齐 | 禁止 |
|---|---|---|---|
| `V2Table` / `V2TableStack` | **VXE** `useVbenVxeGrid` | 表头 32/12/600 + 主色 inset；行高写 `height`；复合格 `auto`；右粘表头阴影**叠**主色线 | 手写 `<table>`；`td` 写 `min-height` |
| `V2Descriptions` | `OneosDescriptions` 或对等 `a-descriptions` | 纵向标签/值、浅边框；普通缺值「—」，创建信息按 `ONEOS-DESIGN.md` §3.6b；`mono`；长文本整行 | `readOnly` 输入框冒充详情 |
| `V2Steps` / `V2Timeline` / `V2ApprovalProgress` | `a-steps` / `a-timeline` | 进度轴默认垂直；流程名称、意见与权限沿原业务 | 因样板把审批一律改称审核或修改规则 |
| `V2SegmentedControl` | `a-segmented` | **仅多视角时出现** | 只有列表还留空分段器 |
| `V2StatusTabs` | 胶囊 button | 已有 count 保留；选中主色实心白字；不同语义分类不因样板去重删除 | 强制新增无数据来源的数量；用 `a-tabs` 默认皮；Pill 占筛选顶 |
| `V2FilterSearch` | `a-input` + `.obl-search` 或 1.3 `.lab-search` 对等皮 | 内嵌放大镜、PC 宽 cap 320；1.3 紧凑/多操作查询使用 `flex:1 1 220px; min-width:170px; max-width:320px`，具体见 `ONEOS-DESIGN.md` §3.3 | 取消宽度上限后拉满；内塞 Select；用历史 1.2 的 220px 下限覆盖当前紧凑变体 |
| `V2FilterMoreButton` | 文字链 | 滑杆图标 + 文案 + 下箭头 | 描边钮冒充 |
| `V2LedgerChrome` | `.oneos-ledger` + Vben `Page` | 无模块标题墙；筛与表同卡；gutter 24 | 页头 h1+灰字 |
| `V2ValidationIndicator` | `OneosValidationIndicator` + `a-popover` | 五种显式状态、16/1.75 图标、320px 卡片；共同 `oneos-ds-validation.css`；按原权限替换，重复只提示 | 黑色 Tooltip 放操作；缺依据判正确；自造重复检测 |
| `OperationActions` | 链接 + `a-dropdown` | 操作列外显“查看”；名称可同时点击；其他动作按权限与空间收进更多；文字13/400默认正文色，hover/focus主题色，横向三点16/1.75 | 四五个动作平铺；因名称可点击就隐藏操作列“查看” |
| `DetailEntryLink` | 主键列自定义链接 | 名称/主键可点击，悬停下划线；不追加“查看 ›”；操作列仍外显“查看” | 蓝链 `#1677FF` |

### 3.5 H5

| 原型 | 现网 | 必须齐 | 禁止 |
|---|---|---|---|
| `V2MobileHeader` | H5 顶栏薄封装 | 触控 ≥44；**无伪状态条** | 画时间/信号/电量伪条 |
| `V2MobileActionBar` | 吸底条 | 壳内 `absolute`；子钮 `a-button` | `fixed` 飞出框 |
| `V2MobileBottomNav` | 底导 | 与 ActionBar **不同屏叠加** | 两排抢底 |
| H5 Sheet | Popup Portal 进壳 | 贴手机框底 | 浏览器居中大 Modal |
| H5 长列表 | 无限滚动 | 滑到底追加 | 台式页码分页 |

---

## 4. 页面规范示例（六型式）

预览：`/?p=oneos-page-canon&type={ledger|form-b1|form-sidebar|detail|h5|workbench}`  
测量：`/?p=oneos-baseline-ledger`

### 4.1 台账 Ledger

**何时**：扫账、筛选、进详情。  
**现网**：Vben `Page` + `useVbenVxeGrid`；筛 `useVbenForm`；钮 `a-button`。

```text
[ PC 1.3 连体统计带：已有 KPI；数量/来源/权限/口径按业务 ]
┌ 一张卡：筛选方案 A + 查询/重置 ───────── ┐
│ 已核实能力的搜索(宽≤320)  原有维度与更多筛选 │
│ 已选条件按该页原查询时机展示              │
├ 表头工具行：Pill+count     导出 / 新建 ──┤
│ 表头 sticky 32/12/600 + 主色 inset 线    │
│ 复合格 主行+副行     操作列右粘 ≤2+⋮     │
│ 分页 「N 条/页」                          │
└─────────────────────────────────────────┘
```

列宽必须写 `column.width`（对等 `colgroup`）。缺宽度会被等分，看起来「页面太空」。

此处统计带、Pill、筛选与搜索只演示视觉排布。正式页仅显示已有数据源与权限允许的统计；KPI 点击筛选及合一搜索须已有同口径的请求、参数与返回结果证据，否则保留原交互。展开与查询/重置后是否收起沿该页原行为，不能直接复制范例动作。

### 4.2 表单 B1 横向整屏

**何时**：离开台账办一单、无右栏。  
**现网**：`a-form`；页头扁平返回；一行 ≤3 列（`a-col :span="8"`）；长表单吸底。

以下为短表单页头操作示意；长表单主 CTA 只放吸底条，原页保存/提交语义不变。

```text
[← 返回列表]  新增工单                     [短表单：原有操作]
┌ 分区卡 · 一行≤3列 ─────────────────────────┐
│ 字段>6 拆卡；备注/上传整行 span 24          │
│ 内容 max-width 1240 居中                    │
└────────────────────────────────────────────┘
        长表单：吸底条（原有提示 + CTA；末字段/错误可见）
```

禁止 `auto-fill minmax(240px,1fr)`（1440 宽会铺 6 列）。

吸底条验收看最后一个字段、错误提示和主操作均可见且可操作：滚动区与底栏分离时无需重复占位，覆盖式底栏才按实际遮挡高度留安全区，不强制某个 `padding-bottom` 或 `flex` 值。

### 4.3 表单 A 侧栏

**何时**：办一单且要右栏指派 / SLA / 审核轴。  
**现网**：左 `a-form` + 右 340 卡片（`a-steps`）。

```text
[← 返回]  故障处置  [原业务独立标识按合同保留]
┌ 左主表单三段卡 ──────────┬ 右 340px ─┐
│ 基本信息 / 现场 / 结论     │ 指派 / SLA │
└──────────────────────────┴────────────┘
```

### 4.4 详情 Detail

**何时**：只读看一单；编辑走表单页。  
**现网映射**：`OneosDescriptions` 或效果对等的 `a-descriptions`，标签在上、值在下并使用浅边框；已有处理记录继续用 `a-timeline`。资料详情正文最大 1240px；合同、车辆、费用等明细详情正文可用工作区全宽；两者页头、滚动区域与外边距均用工作区宽度。

普通业务字段缺值「—」；详情创建信息例外见 `ONEOS-DESIGN.md` §3.6b。禁止用输入框装只读。

### 4.5 H5

**何时**：手机壳内办完。  
**现网**：无限加载；筛选 Popup；底栏 `a-button`。

禁台式分页、禁伪系统状态条、禁 `fixed` 飞出壳。

### 4.6 工作台 Workbench

**何时**：登录后首页：待办 / 快捷 / KPI。  
**现网映射**：欢迎条 + 待办 + 快捷；已有 KPI 使用当前视觉 Token，数量、来源、权限与口径按业务。禁第二套主色。

看板 / 主从：**过业务门槛才上**，PRD 写「视图决策」。未上的视角不要留空分段器。

---

## 5. Token 速查

| Token | 出厂值 | 现网 |
|---|---|---|
| `--oneos-primary` | `#007A55`（跟随偏好） | `token.colorPrimary` |
| `--ln-ink / --ln-body / --ln-muted` | `#0A2540 / #425466 / #627D98` | colorText 三级 |
| `--ln-canvas / --ln-surface-card` | `#F3F5F8 / #FFFFFF` | colorBgLayout / Container |
| `--ln-control-height / --ln-radius-control` | `36px / 10px` | controlHeight / borderRadius |
| `--ln-font-mono` | 等宽 + tabular | 车牌/单号/金额/日期 |
| `--ln-z-overlay-mask / overlay / popover / toast` | `10060 / 10061 / 10080 / 10090` | Ant `zIndex` 用**数字常量**，禁 `var()` 字符串 |
| `--ln-table-row-min-height` | 标准档三行 ≥72 | VXE `row-config.height`；`td` 写 `height` 不是 `min-height` |

浮层选中态必须 `var(--oneos-primary)`，触发器与面板同轮跟随。

---

## 6. 源码指针

| 认哪份 | 路径 |
|---|---|
| 测量尺 | `src/resources/design-system/ONEOS-DESIGN.md` |
| 页面型式 | `src/resources/design-system/ONEOS-PAGE-CANON.md` |
| Token CSS | `src/resources/design-system/oneos-ds-tokens.css` |
| 层级数字面 | `src/resources/design-system/z-index.ts` |
| 若依预设 | `src/resources/design-system/ruoyi-theme-preset.json` |
| 组件廊 | `src/prototypes/oneos-v2/ComponentCanon.tsx` |
| 范例廊 | `src/prototypes/oneos-page-canon/` |
| 台账测量 | `src/prototypes/oneos-baseline-ledger/` |
| 本表数据 | `src/resources/design-system/vue-ant-map.ts` |

现网主题 CSS 落在 `ln-one-os-web` 的 `oneos-v2-theme.css`（薄封装，不拷 React）。

### 数据核验的成对示范

React：`oneos-page-canon?view=validation`；Vue：`vue-kit/examples-1.3/ValidationLedger.vue`（本地 `http://127.0.0.1:5670/?view=validation&revision=1.3`）。样本来自 `validation-fixtures.ts`；组件消费状态、依据、对照值与动作，不计算业务核验结果。验收正确、错误、重复、无法核验、锁定、编辑、深色与窄屏后再接业务页。

同入口的「材料识别」从 `material-recognition-fixtures.ts` 读取构造批次。React 使用 V2Button/V2Modal，Vue 使用 Ant Button/Modal；四类是业务分类而非核验结果。关闭提醒不清待处理；承担方、依据和办理凭据三项齐全才能登记处理。

### 图片查看的成对示范（2026-09-23）

React：`V2ImageViewer`，入口为 `oneos-v2` 组件廊的图片区域；Vue 3：`vue-kit/patterns/OneosImageViewer.vue`，示范为 `vue-kit/examples-1.3/ImageViewerExample.vue`。共用 `image-viewer-fixtures.ts` 构造样本。预览、当前原图下载、完整相册翻页、缩放拖动与复位按 [§4.2b](./ONEOS-DESIGN.md#42b-图片查看与跨部位相册2026-09-23) 对齐。

调用方先按原权限整理同车同次交车或同次还车的全部位图片，传入完整有序 `items` 与点击项 `activeIndex`；不同交接记录分册。Vue 使用 `v-model:open`、`v-model:active-index`，下载受 `canDownload` 和 `onDownload` 控制。上传组件的已完成图片可以打开查看器；它不接管上传请求、原附件标识、编辑回显、删除或提交规则。

开发提供的静态盘点显示通用 `FileUpload`、`ImageUpload` 及故障、证照等独立查看区已有不同实现；迁移前逐项核对本页图片顺序、下载方式和权限。177 处静态入口不等于 177 个独立页面，也不等于已经统一完成。详见 [本轮附录](./.spec/image-viewer-implementation.md)。
