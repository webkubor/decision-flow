# 决策记录

> 每轮一份，来自 `templates/decision-card.md`。**只追加，不覆盖**——避免幸存者偏差。

| 日期 | 记录 | 比的是哪层 | 候选 | 结论 |
|---|---|---|---|---|
| 2026-11-11 | [Hermes 记忆层优化](./2026-11-11-hermes-memory-provider.md) | Agent 工作流（记忆层） | A 内建调优 / B byterover / C 云语义 | 已被下一卡取代；A 有效，byterover 与云语义作墓碑 |
| 2026-11-11 | [Hermes 记忆结构优化 + cs 打通](./2026-11-11-hermes-cs-memory-structure.md) | Agent 工作流（记忆层） | A 内建调优 / B 内建+cs MCP / C 第三方 provider | **选定 B**：原子化（2561→1918，WR 0%→100%，召回 76%→100%）+ cs MCP 打通（11 工具，零新增依赖） |
