# Midscene 与 Playwright 接入

适用：用户已要求在允许的测试环境实际验证 UI；页面/账号/数据和部署版本已确认。模板位于 assets/midscene，使用 @midscene/web 1.17.1 和 @playwright/test 1.64.1（本包构建时查询的发布版本；升级另验）。它是可移植测试工程模板，不代表你项目已有自动化或已测通过。

## 运行
把 assets/midscene 复制到目标测试仓的隔离目录；查看 package.json，根据其 engines 及实际依赖选择 Node。使用随包锁文件安装依赖；首次安装需要网络和浏览器。不要把 node_modules、浏览器、.env、storageState 或密钥打包进技能。

`npm ci`
`npx playwright install chromium`
`npm run test:smoke` —— 只验证本地合成页面及确定性断言，不调用模型、不验证业务。

实际目标：根据 .env.example 在执行环境安全配置 ONEOS_TEST_URL、ONEOS_TEST_EXPECTED_TEXT、模型供应商所需变量。复制前不要假设已有密钥；不要打印其值。`npm run test:ai` 会访问指定 URL，通过 Midscene 做一次视觉断言，只是接线检查。登录态需在真实项目 fixtures 中配置，测试数据与执行范围由交接限定；未登录不能把登录页当业务页测试成功。

## 编写业务用例
先锁定AC和预期，再编写动作和断言。aiTap/aiInput等小步骤比模糊“测一下整个系统”容易控制；复杂探索有限额。稳定动作改为 Playwright，日期/数量/金额/导出用确定性断言。模板没有内置保险算法或伪造预期，业务样例从本任务正式合同取。

一次失败保存首轮截图、trace、模型报告、网络/接口必要证据（脱敏）；区分定位、模型、环境和功能。重试不能改写断言，cache不得当通过证据。平台运行到时限先收集结果再交接；不遗留自启动后台测试。

页面数据和截图会传给所配置模型，选用团队允许的模型及测试数据。凭据不写入报告，认证状态文件不进入版本库。报告默认上传实际团队附件/制品存储，回读成功后按保留策略清理本地；本包不自动配置云存储。

能力分级：本地模拟冒烟通过 ≠ 模型接线通过 ≠ 真实业务验收通过。分别报告，不合并成“已集成并全面测试”。

官方依据：
- https://www.midscenejs.com/integrate-with-playwright
- https://www.midscenejs.com/sdk/playwright
- https://midscenejs.com/caching （缓存计划/定位；aiQuery/aiAssert结果不缓存）
- https://www.midscenejs.com/data-privacy
