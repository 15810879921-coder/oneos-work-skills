import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('合成筛选与导出：仅验证浏览器执行器', async ({ page }) => {
  const html = readFileSync(new URL('../fixtures/smoke.html', import.meta.url), 'utf8');
  await page.setContent(html);
  await page.getByLabel('状态').selectOption('pending');
  await expect(page.locator('tbody tr:visible')).toHaveCount(2);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出筛选结果' }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  if (!stream) throw new Error('No download content');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString('utf8').trim().split('\n');
  expect(csv).toEqual(['id,status', 'sample-1,pending', 'sample-3,pending']);
});
