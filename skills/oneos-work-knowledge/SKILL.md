---
name: oneos-work-knowledge
description: Use when 用户需要联合检索 OneOS 业务库和开发库、关联规则与实现、沉淀已确认规则、处理来源冲突或控制知识读取成本。
---

# OneOS 双库知识

独立工作体系 v1.0.0；不依赖团队 FDE。

先读 [共用协议](references/contract.md) 与 [双库方法](references/knowledge.md)，首次接入读 [工具配置](references/setup.md)。默认先检索现有云端知识，不为咨询新建知识仓库。

使用当前包 scripts/kb.py 固定版本、搜索和读取，或用已授权官方连接器完成等价操作。最多5条候选、按需正文；未知状态、SHA不符、旧版本和关联缺口显式保留，不能因为摘要相关就当正式规则。

维护业务规则→模块/接口→测试与证据的 [关联记录](templates/knowledge-link.json)。业务结论按来源确认，开发事实按当前代码/环境证据；locator、语义核对、运行验证分别记录。体验标准的决定归本包 [设计职责](references/design.md)，知识职责处理保存与索引。

写回只在已授权目标范围内，经官方仓库/平台工具执行并回读；候选不自动转确认，局部失败只续缺少同步，不重跑业务。输出命中依据、结论/未知、可复核来源、实际写回状态和读取体积，不虚报token节省。
