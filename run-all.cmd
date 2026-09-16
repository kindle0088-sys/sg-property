@echo off
rem ============================================================
rem run-all.cmd - URAMonthlyBuild launcher
rem
rem Why this wrapper exists (2026-09-16 incident):
rem   The scheduled task used to call node.exe by an absolute
rem   version-pinned path (versions\22.22.2-2\node.exe). When the
rem   managed node was upgraded on 2026-09-12 the old directory was
rem   removed, so the task died instantly with 0x80070002
rem   (ERROR_FILE_NOT_FOUND) and wrote nothing to the build log.
rem   This launcher resolves node at runtime from versions\current
rem   (falling back to the newest installed version) so future node
rem   upgrades can no longer break the monthly build.
rem
rem Also redirects all output to a file: under Task Scheduler the
rem process stdout is an unread pipe and large output blocks forever.
rem ============================================================
setlocal enabledelayedexpansion

set "NODE_ROOT=C:\Users\jiali\.workbuddy\binaries\node\versions"
set "REPO=C:\Users\jiali\WorkBuddy\Claw\sg-property"
set "LOG=%REPO%\logs\launcher.log"

if not exist "%REPO%\logs" mkdir "%REPO%\logs"

set "NODE="
if exist "%NODE_ROOT%\current" (
  set /p VER=<"%NODE_ROOT%\current"
  if exist "%NODE_ROOT%\!VER!\node.exe" set "NODE=%NODE_ROOT%\!VER!\node.exe"
)

if not defined NODE (
  for /f "delims=" %%d in ('dir /b /ad /o-n "%NODE_ROOT%"') do (
    if not defined NODE if exist "%NODE_ROOT%\%%d\node.exe" set "NODE=%NODE_ROOT%\%%d\node.exe"
  )
)

if not defined NODE (
  echo [%date% %time%] FATAL: no usable node.exe under %NODE_ROOT% >> "%LOG%"
  exit /b 1
)

echo [%date% %time%] launcher start: node=%NODE% >> "%LOG%"
"%NODE%" "%REPO%\run-all.mjs" >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
echo [%date% %time%] launcher done: exit=%RC% >> "%LOG%"
exit /b %RC%
