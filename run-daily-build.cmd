@echo off
REM ============================================================
REM SG Property Dashboard - Monthly URA Build (run via Task Scheduler)
REM Runs from Singapore local machine (URA API is geo-restricted:
REM it times out from GitHub Actions' US runners).
REM Scheduled: monthly on the 16th, 09:00 Singapore time.
REM URA data publishes monthly around the 15th; 16th leaves a buffer.
REM HDB is handled by GitHub Actions CI (daily), not here.
REM ============================================================

setlocal
set "ROOT=C:\Users\jiali\WorkBuddy\Claw\property-dashboard"
set "NODE=C:\Users\jiali\.workbuddy\binaries\node\versions\22.22.2\node.exe"
set "GH=%LOCALAPPDATA%\Programs\GitHub CLI\gh.exe"
if not exist "%GH%" set "GH=gh"

echo [%date% %time%] Starting monthly URA build...
mkdir "%ROOT%\logs" 2>nul
set "LOG=%ROOT%\logs\daily-build.log"
echo [%date% %time%] ===== monthly URA build start ===== >> "%LOG%"

REM --- 防 .git 损坏：禁用 git 自动 gc（2026-08-02 事故根因：loose objects 超阈值
REM     触发 auto-gc，repack 与构建并发中断导致对象丢失）---
git -C "%ROOT%" config gc.auto 0
if errorlevel 1 echo [%date% %time%] WARN: failed to disable auto-gc >> "%LOG%"
echo [%date% %time%] Step: pre-fetch checks done >> "%LOG%"

REM --- 2026-08-06 事故预防：检测残留 rebase 状态（上次 pull --rebase 冲突未解决
REM     会让后续构建在 detached HEAD 上 commit，数据永远推不上去）---
if exist "%ROOT%\.git\rebase-merge" (
  echo [%date% %time%] WARN: stale rebase state found, aborting
  git -C "%ROOT%" rebase --abort
)
if exist "%ROOT%\.git\rebase-apply" (
  echo [%date% %time%] WARN: stale rebase-apply state found, aborting
  git -C "%ROOT%" rebase --abort
)

REM --- 2026-08-06 事故预防：构建前先把本地对齐 remote，避免"先 commit 后 rebase"冲突。
REM     fetch 后若本地落后则 fast-forward（秒级）；若领先/分叉则丢弃本地 commit
REM     （数据由本次构建重新生成，reflog 可找回）。---
git -C "%ROOT%" fetch origin
if errorlevel 1 (
  echo [%date% %time%] WARN: git fetch failed, waiting 60s before retry >> "%LOG%"
  REM --- ping 做延时：timeout 命令在计划任务(无控制台)下不支持 stdin 重定向会秒退 ---
  ping -n 61 127.0.0.1 >nul
  git -C "%ROOT%" fetch origin
  if errorlevel 1 (
    echo [%date% %time%] ERROR: git fetch failed twice, aborting >> "%LOG%"
    echo [%date% %time%] FETCH FAILED: git fetch origin failed twice (likely network) >> "%ROOT%\logs\build-error.log"
    exit /b 1
  )
)
REM --- 2026-08-13: 改用 FETCH_HEAD 对齐远程。原因：本机对 git 写 refs/remotes/origin/* 的
REM     loose ref 有静默拦截（update-ref 返回 0 但文件不落地，fetch 反复重建的
REM     refs/remotes/origin/ 目录也会被清掉），origin/main 无法解析；FETCH_HEAD 是
REM     fetch 直接产物，不依赖 remote-tracking ref。 ---
git -C "%ROOT%" merge --ff-only FETCH_HEAD
if errorlevel 1 (
  echo [%date% %time%] WARN: local branch diverged from remote, discarding local commits (rebuild regenerates data) >> "%LOG%"
  git -C "%ROOT%" reset --mixed FETCH_HEAD
  if errorlevel 1 (
    echo [%date% %time%] ERROR: reset failed, aborting >> "%LOG%"
    exit /b 1
  )
)
echo [%date% %time%] Step: aligned with remote >> "%LOG%"

cd /d "%ROOT%\scripts"
"%NODE%" build.js --skip-hdb
if errorlevel 1 (
  echo [%date% %time%] BUILD FAILED >> "%LOG%"
  "%NODE%" "%ROOT%\scripts\write-status.js" build_failed
  REM --- failure notification: append log + open a GitHub issue (once per failure streak) ---
  echo [%date% %time%] BUILD FAILED >> "%ROOT%\logs\build-error.log"
  "%GH%" issue list -R kindle0088-sys/sg-property --state open --search "Monthly URA build failed" --json number --jq "length" > "%TEMP%\gh-open.txt" 2>nul
  set /p OPEN_ISSUES=<"%TEMP%\gh-open.txt"
  if not defined OPEN_ISSUES set OPEN_ISSUES=0
  if "%OPEN_ISSUES%"=="0" (
    "%GH%" issue create -R kindle0088-sys/sg-property --title "Monthly URA build failed" --body "Local scheduled build failed at %date% %time%. See logs\build-error.log." >nul 2>&1
  )
  exit /b 1
)

cd /d "%ROOT%"
git add data/ .github/
git diff --cached --name-only | findstr /R "data/projects data/projects-index data/districts data/rentals data/property-index" >nul
if errorlevel 1 (
  echo [%date% %time%] Only timestamp/aggregate changes; skipping commit >> "%LOG%"
  echo [%date% %time%] Only timestamp/aggregate changes; skipping commit
  git reset -q
) else (
  git -c user.name="kindle0088-sys" -c user.email="kindle0088-sys@users.noreply.github.com" commit -m "chore: monthly URA data build"
  if errorlevel 1 (
    echo [%date% %time%] Commit failed >> "%LOG%"
    echo [%date% %time%] Commit failed
  ) else (
    for /f "delims=" %%h in ('git rev-parse HEAD') do set "HEAD_SHA=%%h"
    echo [%date% %time%] Committed >> "%LOG%"
    echo [%date% %time%] Committed
  )
)

REM --- 对齐 remote 后基于最新数据 commit，push 应为 fast-forward；失败则记录日志 + 开 issue ---
git push origin main
if errorlevel 1 (
  echo [%date% %time%] PUSH FAILED >> "%LOG%"
  echo [%date% %time%] PUSH FAILED >> "%ROOT%\logs\build-error.log"
  "%NODE%" "%ROOT%\scripts\write-status.js" push_failed "%HEAD_SHA%"
  REM --- push 失败也开 issue（2026-08-06 事故类型：构建成功但发布失败）---
  "%GH%" issue list -R kindle0088-sys/sg-property --state open --search "Monthly URA push failed" --json number --jq "length" > "%TEMP%\gh-open.txt" 2>nul
  set /p OPEN_ISSUES=<"%TEMP%\gh-open.txt"
  if not defined OPEN_ISSUES set OPEN_ISSUES=0
  if "%OPEN_ISSUES%"=="0" (
    "%GH%" issue create -R kindle0088-sys/sg-property --title "Monthly URA push failed" --body "Local scheduled build succeeded but push failed at %date% %time%. See logs\build-error.log." >nul 2>&1
  )
  echo [%date% %time%] PUSH FAILED
  exit /b 1
)

REM --- 错峰显式 gc：构建+推送全部完成后主动打包 loose objects ---
REM --- 2026-08-11 事故教训：.git\info 缺失时 gc --quiet 会清空整个对象库且返回 exit 0，
REM     必须先确保 .git\info 目录存在，再跑 gc ---
if not exist "%ROOT%\.git\info" mkdir "%ROOT%\.git\info"
git -C "%ROOT%" gc --quiet
if errorlevel 1 (
  echo [%date% %time%] WARN: git gc reported an error
) else (
  echo [%date% %time%] GC done
)
REM --- gc 后对象库完整性校验：防止 gc 静默清空对象（2026-08-11 事故）---
git -C "%ROOT%" fsck --quick --no-dangling >nul 2>&1
if errorlevel 1 (
  echo [%date% %time%] CRITICAL: git fsck failed after gc, object store corrupt! >> "%LOG%"
  echo [%date% %time%] CRITICAL: git fsck failed after gc, object store corrupt! >> "%ROOT%\logs\build-error.log"
)

REM --- loose objects 数量监控（超阈值提醒，防止再次堆积）---
for /f "tokens=2 delims= " %%b in ('git -C "%ROOT%" count-objects -v ^| findstr /b "count:"') do set "LOOSE_NUM=%%b"
if not defined LOOSE_NUM set "LOOSE_NUM=?"
echo [%date% %time%] Loose objects: %LOOSE_NUM%
if not "%LOOSE_NUM%"=="?" if "%LOOSE_NUM%" GTR "6700" (
  echo [%date% %time%] WARN: loose objects %LOOSE_NUM% exceed threshold 6700, run manual gc
)

"%NODE%" "%ROOT%\scripts\write-status.js" ok "%HEAD_SHA%" true
echo [%date% %time%] Done. >> "%LOG%"
echo [%date% %time%] Done.
endlocal
