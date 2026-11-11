#!/usr/bin/env node
/**
 * 决策卡字段检查：保证每轮记录的字段同构、可跨轮对比。
 *
 * 为什么要有这个门禁：决策闭环的价值全在"数据可比"。字段缺一项，
 * 这一轮就和上一轮对不上，累积的复盘数据会退化成零散笔记。
 *
 * 用法：
 *   node scripts/check-record.mjs records/2026-11-11-example.md
 *   node scripts/check-record.mjs records/*.md
 *
 * 退出码：0 = 通过；1 = 有问题（打印缺项清单）。
 */
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_SECTIONS = [
  '## S 圈定对象',
  '## H 假设',
  '## M 指标',
  '## P 最小试点',
  '## R 复盘',
];

// P-1..P-7 七个字段的语义锚点（卡片里以表头形式出现）
const REQUIRED_FIELDS = [
  ['P-1 场景', '任务'],
  ['P-2 耗时', '耗时'],
  ['P-3 成本', '成本'],
  ['P-4 返工', '返工'],
  ['P-5 排障', '排障'],
  ['P-6 分发', '分发'],
  ['P-7 结论', '结论'],
];

function check(file) {
  const src = fs.readFileSync(file, 'utf8');
  const errors = [];
  const warnings = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!src.includes(section)) errors.push(`缺小节：${section}`);
  }

  for (const [label, anchor] of REQUIRED_FIELDS) {
    if (!src.includes(anchor)) errors.push(`缺字段：${label}`);
  }

  // 占位符未替换 = 这轮还没填完，不能算一轮有效数据
  // 注意：占位符一律形如 <...>，所以这里不能用「以 < 开头」去过滤——
  // 那会把所有占位符自己滤掉（踩过的坑：模板因此被误判为通过）。
  const placeholders = [...src.matchAll(/<[^<>\n]{1,24}>/g)].map((m) => m[0]);
  if (placeholders.length) {
    errors.push(`仍有未填占位符 ${placeholders.length} 处，例如：${placeholders.slice(0, 3).join(' ')}`);
  }

  // 已立项但还没测量的字段：不算错，但要在复盘时补齐
  const pending = [...src.matchAll(/待测/g)].length;
  if (pending) warnings.push(`还有 ${pending} 处标记「待测」：本轮数据未齐，复盘前须补齐`);

  return { errors, warnings };
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('用法：node scripts/check-record.mjs records/<file>.md');
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`✗ ${file}：文件不存在`);
    failed += 1;
    continue;
  }
  const { errors, warnings } = check(abs);
  if (errors.length) {
    console.error(`✗ ${file}`);
    for (const e of errors) console.error(`  · ${e}`);
    failed += 1;
  } else {
    console.log(`✓ ${file}：字段齐全，可入经验库`);
  }
  for (const w of warnings) console.warn(`  ! ${file} · ${w}`);
}

process.exit(failed ? 1 : 0);
