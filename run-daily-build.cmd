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

echo [%date% %time%] Starting daily URA build...

cd /d "%ROOT%\scripts"
"%NODE%" build.js --skip-hdb
if errorlevel 1 (
  echo [%date% %time%] BUILD FAILED
  exit /b 1
)

cd /d "%ROOT%"
git add data/ .github/ scripts/build.js scripts/ura-fetcher.js scripts/fetch-schools.js
git -c user.name="kindle0088-sys" -c user.email="kindle0088-sys@users.noreply.github.com" commit -m "chore: daily URA data build"
if errorlevel 1 (
  echo [%date% %time%] Nothing to commit or commit failed
) else (
  echo [%date% %time%] Committed
)

git pull --rebase
git push origin main
if errorlevel 1 (
  echo [%date% %time%] PUSH FAILED
  exit /b 1
)

echo [%date% %time%] Done.
endlocal
