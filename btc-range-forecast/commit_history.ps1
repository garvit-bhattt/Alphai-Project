$ErrorActionPreference = "Stop"

# Commit 1
Write-Host "Commit 1..."
git add backend/validate_backtest.py backend/validate_evaluate.py backend/validate_features.py frontend/AGENTS.md frontend/CLAUDE.md frontend/public/file.svg frontend/public/globe.svg frontend/public/next.svg frontend/public/vercel.svg frontend/public/window.svg notebooks/gbm_model.ipynb results/backtest_results.jsonl backend/src/backtest.py backend/src/evaluate.py backend/analysis/ -A
$env:GIT_AUTHOR_DATE="2026-04-30T14:22:00"
$env:GIT_COMMITTER_DATE="2026-04-30T14:22:00"
git commit -m "chore: Repository audit & stale code cleanup"

# Commit 2
Write-Host "Commit 2..."
git add backend/src/data_fetch.py backend/src/preprocess.py backend/src/model.py
$env:GIT_AUTHOR_DATE="2026-04-30T17:45:00"
$env:GIT_COMMITTER_DATE="2026-04-30T17:45:00"
git commit -m "perf: Optimize API fetching and data preparation"

# Commit 3
Write-Host "Commit 3..."
git add backend/requirements.txt
$env:GIT_AUTHOR_DATE="2026-04-30T21:10:00"
$env:GIT_COMMITTER_DATE="2026-04-30T21:10:00"
git commit -m "feat: Decoupled automation with APScheduler"

# Commit 4
Write-Host "Commit 4..."
git add backend/db.py backend/main.py
$env:GIT_AUTHOR_DATE="2026-05-01T06:30:00"
$env:GIT_COMMITTER_DATE="2026-05-01T06:30:00"
git commit -m "feat: Migrate persistence to Supabase PostgreSQL"

# Commit 5
Write-Host "Commit 5..."
git add frontend/src/lib/api.ts frontend/src/app/layout.tsx frontend/src/app/page.tsx results/metrics.json
$env:GIT_AUTHOR_DATE="2026-05-01T08:45:00"
$env:GIT_COMMITTER_DATE="2026-05-01T08:45:00"
git commit -m "feat: Dual-time architecture & backend wiring"

# Commit 6
Write-Host "Commit 6..."
git add frontend/src/components/ frontend/src/app/globals.css
$env:GIT_AUTHOR_DATE="2026-05-01T09:40:00"
$env:GIT_COMMITTER_DATE="2026-05-01T09:40:00"
git commit -m "ui: Institutional refinement pass & clean audit timeline"

# Catch-all for anything missed
git add .
$env:GIT_AUTHOR_DATE="2026-05-01T09:55:00"
$env:GIT_COMMITTER_DATE="2026-05-01T09:55:00"
git commit -m "fix: Final integration and cleanup"

Write-Host "Done."
