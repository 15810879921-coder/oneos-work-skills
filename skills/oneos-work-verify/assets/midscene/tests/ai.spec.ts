import { test as base, expect } from '@playwright/test';
import { PlaywrightAiFixture, type PlayWrightAiFixtureType } from '@midscene/web/playwright';

const test = base.extend<PlayWrightAiFixtureType>(PlaywrightAiFixture({ cache: true }));

test('真实TEST页面视觉接线检查（不代表完整业务验收）', async ({ page, aiAssert }) => {
  const url = process.env.ONEOS_TEST_URL;
  const expected = process.env.ONEOS_TEST_EXPECTED_TEXT;
  if (!url || !expected || process.env.ONEOS_TEST_ENV_KIND !== 'test') {
    throw new Error('Run npm run test:ai after explicitly configuring a TEST environment.');
  }
  const response = await page.goto(url);
  expect(response?.ok(), 'Target document should load successfully').toBeTruthy();
  await aiAssert(`页面中可见以下已指定的业务内容：${expected}`);
  // Add actual AC-driven operations, deterministic API/file assertions, roles,
  // data setup/cleanup and deployment evidence in the project test repository.
});
