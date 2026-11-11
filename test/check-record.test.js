import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(root, 'scripts', 'check-record.mjs');

function runChecker(files) {
  // 警告走 stderr，成功信息走 stdout，两个流都要捕获，否则断言看不到警告
  try {
    const res = spawnSync(process.execPath, [checker, ...files], { encoding: 'utf8' });
    return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const COMPLETE_CARD = `# 决策卡 — 示例

## S 圈定对象

- **这次比什么（一句话）**：示例
- **比的是哪一层**：技术栈

## H 假设

| 候选 | 声明 |
|---|---|
| A | 在场景下用 A 让指标达标 |

## M 指标

| 角色 | 指标 | 口径 | 阈值 |
|---|---|---|---|
| **主指标** | 耗时 | 1 次 | ≤ 4h |

## P 最小试点

- **同一个任务**：示例任务
- **产物形态**：窗口程序

| 候选 | 产物路径 | P-2 耗时(h) | P-3 成本 | P-4 返工 | P-5 排障 | P-6 分发 |
|---|---|---|---|---|---|---|
| A | a/ | 2 | 0 | 首跑通过 | 自修 0.5h | 2 步 / 80MB |

## R 复盘

- **P-7 结论**：验证了 A
`;

test('完整填好的决策卡通过检查', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-'));
  const file = path.join(dir, 'card.md');
  fs.writeFileSync(file, COMPLETE_CARD);
  const { code, out } = runChecker([file]);
  assert.equal(code, 0, out);
  assert.match(out, /字段齐全/);
});

test('缺小节会被拦下', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-'));
  const file = path.join(dir, 'card.md');
  fs.writeFileSync(file, COMPLETE_CARD.replace('## R 复盘', '## 复盘'));
  const { code, out } = runChecker([file]);
  assert.equal(code, 1);
  assert.match(out, /缺小节/);
});

test('残留占位符会被拦下（模板不得被误判为通过）', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-'));
  const file = path.join(dir, 'card.md');
  fs.writeFileSync(file, COMPLETE_CARD.replace('示例', '<待填>'));
  const { code, out } = runChecker([file]);
  assert.equal(code, 1);
  assert.match(out, /未填占位符/);
});

test('缺 P-x 字段会被拦下', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-'));
  const file = path.join(dir, 'card.md');
  fs.writeFileSync(file, COMPLETE_CARD.replace('P-6 分发', 'P-6 体积'));
  const { code, out } = runChecker([file]);
  assert.equal(code, 1);
  assert.match(out, /缺字段/);
});

test('「待测」标记只警告不拦截（数据未齐也可入档）', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-'));
  const file = path.join(dir, 'card.md');
  fs.writeFileSync(file, COMPLETE_CARD.replace('| 2 | 0 |', '| 待测 | 待测 |'));
  const { code, out } = runChecker([file]);
  assert.equal(code, 0, out);
  assert.match(out, /待测/);
});

test('仓内模板必然因占位符未填而失败（门禁自身有效）', () => {
  const { code, out } = runChecker([path.join(root, 'templates', 'decision-card.md')]);
  assert.equal(code, 1, out);
  assert.match(out, /未填占位符/);
});

test('仓内已有记录通过检查', () => {
  const { code, out } = runChecker([path.join(root, 'records', '2026-11-11-desktop-shell-stack.md')]);
  assert.equal(code, 0, out);
});
