---
name: oneos-work-delivery
description: Use when 用户要求按独立 ONEOS 工作流整理需求、开发或修复，并将代码交付到测试分支等待统一部署。
---

# OneOS 独立交付

独立工作体系 v1.0.0；不依赖团队 FDE。

先读 [共用协议](references/contract.md)，恢复已有云端记录；首次项目接入读 [接入说明](references/setup.md)。按 [交付方法](references/delivery.md) 工作，知识查询读 [双库方法](references/knowledge.md)。界面任务必须执行 [体验规范](references/design.md)，复杂产品/架构/指标问题按需读 [专业方法](references/specialists.md)。

默认完整推进到授权范围的真实测试分支交接，之后停在等待测试人员统一部署。测试分支若会自动部署，提前停在安全分支/MR并说明未完成目标分支交付。不要调用团队 FDE 或任何发布技能。

用户要求部署后继续验证时，可按本包 [验证方法](references/testing.md) 接续；独立性按实际执行者记录，不由入口名字保证。返修循环保留原验收和历史证据。每个阶段同步 [运行记录](references/lifecycle.md)。

输出：实际完成范围、代码/检查证据、交接与缺口、当前停点和恢复条件。用 [交接模板](templates/handoff.md)；附带检查器只检查材料，不代表远端成功。
