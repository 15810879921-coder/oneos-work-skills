# 后端规则来源与维护

规则版本：1.1.1。主体来源：李振 2026-10-28 11:28（Asia/Shanghai）的17段原文，本次会话已明确采用；仅加编号，技术子规则属于会话确认的补充，不归称原文。

原始钉钉消息 ID：`msgNRunmTl8uTFRwbUXr2oS2Q==`。核验依据为 HiFox 运行 `cd0eaa04-7842-49c6-aa16-9a01774cbba4` 第58条工具结果，原查询 complete=true、hasMore=false、failures=[]，发送者精确解析为李振。此处只保存定位，不分发完整聊天、身份数据或凭据。维护证据包保留17段原文指纹及逐段一致性检查。

## 技术资料

2026-10-28核对下列官方资料；实际项目仍以其锁定JDK、框架、数据库版本为准。资料解释技术行为，本套的准入和验收要求属于工程约束，不声称官方文档要求所有项目采用同一方案。

- [Java 8 CompletableFuture](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html)：默认执行器、汇聚与取消语义。
- [Oracle Java 21 虚拟线程](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)：每任务线程、适用负载及下游资源限制。
- [Spring 事务事件](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)：事务阶段绑定。提交后执行不等于持久化投递，是结合故障窗口作出的工程判断。
- [MySQL 8.4 一致性读](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)：隔离级别与快照差异；不得泛化到其他数据库。
- [AWS Transactional Outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)：双写故障窗口、同事务Outbox、重复消息及消费幂等。

## 维护规则

### 1.1.1 查询选型补充来源

李振 2026-10-28 15:32:33（Asia/Shanghai）消息 `msgo0RU+NPinLfN2OcTurW9GQ==` 指出：不一定必须批量查询，应比较单个与批量查询的耗时合理性。当前会话用户明确授权据此升级 ONEOS-WORK 系列。此前实际分析在无测量证据时优先承诺批量化，构成本次行为回归的失败基线。

本次在技术子规则补充语义等价、现状基线、代表性数据、可比端到端成本、保留现状及无证据只给条件方案，并同步开发/验证/知识证据入口。17 条主体标题和正文仍逐段保留原文；新增内容是本次工程化细化，不冒称李振逐字原文或已测性能结果。新增查询选型专项回归，旧八组结论不自动沿用为新版已执行结果。

### 同轮空值意见的纠正与最终口径

15:38:04 消息 `msgJPH+60x8vTGWN6701bQCUg==` 的“查询全部加非空判断”，已被李振15:44:33消息 `msgUUwL+G9CWd0RcP9vVPobwQ==` 明确纠正为按场景判断是否需要校验，某些业务允许为空。15:48:15 消息 `msgN7BeBiExrfuqKiBGI6vR9A==` 进一步要求与需求、对应开发任务联动，明确可空/非空；15:50:42 消息 `msgabjliSul1Yk8q39y+cP7DQ==` 补充需求易读、开发任务详细的表达要求。以上均为2026-10-28 Asia/Shanghai，读取结果complete=true、failures=[]。

采用纠正后的最终口径，早先“全部非空”不再是适用要求。空值子规则中的字段行为、权限边界和验证例子是工程化细化，不冒称原话；不由这次反馈直接改写任何具体业务字段的可空性。来源维护保留替代关系，不能将多个时间点的相反意见并列为同时生效规则。

规则正文、技术子规则和 [Skill回归](skill-regression.md) 在源码 shared 目录维护一次，构建到四个独立包，不跨包读取 sibling 文件。更新入口/共用协议引用、版本、文件SHA256及sharedDigest；有源码仓权限时再同步正式仓，不能将本地改动冒称远端已发布。

按规则变更影响运行Skill场景回归；核心语义大幅调整完整运行八组。业务测试仍按实际改动定向选择。只换入口名称不构成独立验证；报告注明执行者、材料版本、场景、实际决策和失败，不把静态包含关键词当行为测试通过。
