@echo off
REM ============================================================
REM SG Property Dashboard - Daily URA Build (run via Task Scheduler)
REM Runs from Singapore local machine (URA API is geo-restricted:
REM it times out from GitHub Actions' US runners).
REM Scheduled: 06:00 Singapore time (daily URA refresh)
REM ============================================================

setlocal
set "ROOT=C:\Users\jiali\WorkBuddy\Claw\property-dashboard"
set "NODE=C:\Users\jiali\.workbuddy\binaries\node\versions\22.22.2\node.exe"
set "GH=%LOCALAPPDATA%\Programs\GitHub CLI\gh.exe"
if not exist "%GH%" set "GH=gh"

echo [%date% %time%] Starting daily URA build...

REM --- 防 .git 损坏：禁用 git 自动 gc（2026-08-02 事故根因：loose objects 超阈值
REM     触发 auto-gc，repack 与构建并发中断导致对象丢失）---
git -C "%ROOT%" config gc.auto 0
if errorlevel 1 echo [%date% %time%] WARN: failed to disable auto-gc

cd /d "%ROOT%\scripts"
"%NODE%" build.js --skip-hdb
if errorlevel 1 (
  echo [%date% %time%] BUILD FAILED
  REM --- failure notification: append log + open a GitHub issue (once per failure streak) ---
  mkdir "%ROOT%\logs" 2>nul
  echo [%date% %time%] BUILD FAILED >> "%ROOT%\logs\build-error.log"
  "%GH%" issue list -R kindle0088-sys/sg-property --state open --search "Daily URA build failed" --json number --jq "length" > "%TEMP%\gh-open.txt" 2>nul
  set /p OPEN_ISSUES=<"%TEMP%\gh-open.txt"
  if not defined OPEN_ISSUES set OPEN_ISSUES=0
  if "%OPEN_ISSUES%"=="0" (
    "%GH%" issue create -R kindle0088-sys/sg-property --title "Daily URA build failed" --body "Local scheduled build failed at %date% %time%. See logs\build-error.log." >nul 2>&1
  )
  exit /b 1
)

cd /d "%ROOT%"
git add data/ .github/
git diff --cached --name-only | findstr /R "data/projects data/projects-index data/districts data/rentals data/property-index" >nul
if errorlevel 1 (
  echo [%date% %time%] Only timestamp/aggregate changes; skipping commit
  git reset -q
) else (
  git -c user.name="kindle0088-sys" -c user.email="kindle0088-sys@users.noreply.github.com" commit -m "chore: daily URA data build"
  if errorlevel 1 (
    echo [%date% %time%] Commit failed
  ) else (
    echo [%date% %time%] Committed
  )
)

git pull --rebase
git push origin main
if errorlevel 1 (
  echo [%date% %time%] PUSH FAILED
  exit /b 1
)

REM --- 错峰显式 gc：构建+推送全部完成后主动打包 loose objects ---
git -C "%ROOT%" gc --quiet
if errorlevel 1 (
  echo [%date% %time%] WARN: git gc reported an error
) else (
  echo [%date% %time%] GC done
)

REM --- loose objects 数量监控（超阈值提醒，防止再次堆积）---
for /f "tokens=2 delims= " %%b in ('git -C "%ROOT%" count-objects -v ^| findstr /b "count:"') do set "LOOSE_NUM=%%b"
if not defined LOOSE_NUM set "LOOSE_NUM=?"
echo [%date% %time%] Loose objects: %LOOSE_NUM%
if not "%LOOSE_NUM%"=="?" if "%LOOSE_NUM%" GTR "6700" (
  echo [%date% %time%] WARN: loose objects %LOOSE_NUM% exceed threshold 6700, run manual gc
)

echo [%date% %time%] Done.
endlocal
