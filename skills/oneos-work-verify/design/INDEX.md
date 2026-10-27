# 规范快照阅读索引

身份、原始路径与哈希见 [manifest.json](manifest.json)。本目录是已交付正式规范的固定派生副本，不是新的规范决定源。用户/项目核实的新正式版本优先，并记录替代；本包没有完成云端迁移。

| 任务 | 正文 |
|---|---|
| 选页面范式、布局、普通/复杂表格、表单/详情 | [ONEOS-PAGE-CANON.md](ONEOS-PAGE-CANON.md) |
| 颜色、字号、Token、栅格、控件和状态 | [ONEOS-DESIGN.md](ONEOS-DESIGN.md) |
| 页面首屏、任务操作、空错态、纠错和验收 | [PAGE-DESIGN-CONSTRAINTS.md](PAGE-DESIGN-CONSTRAINTS.md) |
| 旧业务界面迁移 | [UI-MIGRATION-CONTRACT.md](UI-MIGRATION-CONTRACT.md) |
| Vue / Ant / VXE 对等实现 | [VUE-ANT-MAPPING.md](VUE-ANT-MAPPING.md) |
| Token 来源 | [oneos-ds-tokens.css](oneos-ds-tokens.css) |

先用 rg 定位相关章节，再完整读取适用规则、例外和依赖；不要默认读全部范例。vue-kit/runtime-v1、patterns、examples-1.3 保留同栈文本源码，仅按需要读取。只复用适用组件，不把业务专属限制和 Mock 当正式功能。

原文保持不改；其中链接指向上游完整工程的内容、历史本机地址及构建命令不保证包含或适用于本包。没有编译预览、字体/截图和宿主依赖，不能直接宣称此目录可独立运行网页；缺少的资源通过项目现行设计来源取得，禁止执行旧绝对路径脚本。包内正文与范例足以明确规范身份及主要规则，实际页面仍需在目标项目验证。
