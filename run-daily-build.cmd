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

echo [%date% %time%] Done.
endlocal
