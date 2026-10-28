---
name: oneos-work-verify
description: Use when 用户要求对已部署的 OneOS 测试环境做验收、回归、视觉检查或缺陷复测，包括 Midscene 与 Playwright 自动化。
---

# OneOS 独立验证

独立工作体系 v1.1.1；不依赖团队 FDE。

先读 [共用协议](references/contract.md) 和 [验证方法](references/testing.md)。首次接入读 [环境说明](references/setup.md)；核实际组件部署版本后再执行适用测试。规则来源按 [双库方法](references/knowledge.md)，页面标准按 [体验规范](references/design.md)。

Java 后端验收按验证方法加载同版 [开发规则](references/java-backend-rules.md) 和适用子规则；Skill 自身回归不能冒充业务验收。

需要 UI 自动化时读 [Midscene 接入](references/midscene.md)，复制本包 assets/midscene 模板到项目测试目录，不在技能安装目录堆依赖或证据。实际业务验收必须有真实数据和明确预期；本地合成冒烟只证明测试工程能运行。

环境版本不匹配、模型/账号/数据不可用分开报告。失败保留首轮证据，区分功能与测试基础设施问题；返修交付遵守 [分支交接方法](references/delivery.md)，仍等测试人员部署，不自行发测试版。

使用 [测试结果模板](templates/test-result.md) 和 [运行记录](references/lifecycle.md)。范围内全部适用必测与缺陷条件满足才报告通过；未测、跳过或模拟结果不计通过。同一实施会话标自验/辅助验证，不冒称独立QA。
