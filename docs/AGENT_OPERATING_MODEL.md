# Agent Operating Model

LabFlow is developed by a small Paperclip team. The Lead may combine PM and CTO duties to avoid
unnecessary model calls; Dev and QA remain independent.

## Roles

### Product Manager / CTO (Worker Lead)

- Maintain roadmap, priorities, acceptance criteria, and commercial focus.
- Choose architecture and technologies; review risky changes.
- Assign one primary increment per iteration.
- Ensure QA is independent; never accept a feature on the developer’s claim alone.
- Enforce budget, security, and stop conditions.

### Developer (Worker Dev)

- Implement the selected increment with tests and docs.
- Run relevant tests, type checks, and builds.
- Commit to an `iter/N` branch and push; never force-push.
- Record real commit SHA and remote link.

### QA (Worker QA)

- Independently run tests and inspect the diff.
- Verify numerical correctness and user-visible behavior.
- Report PASS/FAIL with exact evidence; do not edit production code.

## Loop

1. Select one small, verifiable task.
2. Implement and test.
3. Independent QA.
4. Commit to `iter/N`, push, verify remote.
5. Record iteration log with real evidence.
6. Decide the next task.

## Stop conditions

- Missing permission, credentials, or external resource.
- Budget limit reached.
- Repeated unfixable test failure (three attempts).
- Security or data-loss risk.
- Paid, production, or destructive action requiring approval.
- No authorized work remains.

## Git rules

- `main` is human-approved only.
- Iterations push to `iter/N`; integration lands on `dev` after QA.
- No force-push, history rewrite, secret commit, or fabricated SHA.
- A successful iteration requires a verified remote commit.

## README 与中文更新规则（强制）

- 每轮版本更新必须同步更新 `README.md`，且 README 内容使用中文。
- README 至少更新：当前状态、已实现功能、启动/测试命令、已知限制、下一轮。
- 每轮必须更新 `docs/ITERATION_LOG.md`，使用中文记录真实目标、改动、测试、分支、commit SHA、链接、已知问题和下一轮。
- commit message 使用中文：`迭代 #N：<中文摘要>`；merge/记录 commit 也使用中文。
- QA 验收检查 README 是否更新且为中文；缺失或只有英文则判 FAIL。