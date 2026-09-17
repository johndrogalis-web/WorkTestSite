@echo off
setlocal enabledelayedexpansion
title Verifi Design System - prepare for GitHub

rem ============================================================
rem  Builds a clean copy of this folder with the 1 GB of source
rem  assets left behind, ready to hand to GitHub.
rem
rem  Leaves out:  Images\  Logo\  __pycache__\  publish.bat
rem  Result:      ..\github-ready\design-system\
rem ============================================================

set "SRC=%~dp0"
set "DST=%~dp0..\github-ready\design-system"

echo.
echo   Verifi Design System - preparing a clean copy for GitHub
echo   ---------------------------------------------------------
echo.
echo   From : %SRC%
echo   To   : %DST%
echo.
echo   Leaving behind: Images\  Logo\  __pycache__\
echo.

if exist "%DST%" (
  echo   A previous copy exists. Refreshing it...
  echo.
)

robocopy "%SRC%." "%DST%" /MIR /XD "Images" "Logo" "__pycache__" ".git" /XF "publish.bat" /NFL /NDL /NJH /NJS /NP >nul

if errorlevel 8 (
  echo   [X] Copy failed. Check that the destination is not open in another program.
  echo.
  pause
  exit /b 1
)

set COUNT=0
set BYTES=0
for /r "%DST%" %%F in (*) do (
  set /a COUNT+=1
  set /a BYTES+=%%~zF/1024
)
set /a MB=!BYTES!/1024

echo   [OK] Done.
echo.
echo   !COUNT! files, about !MB! MB
echo.
echo   ---------------------------------------------------------
echo   NEXT STEP
echo   ---------------------------------------------------------
echo.
echo   Open GitHub Desktop and drag this folder onto its window:
echo.
echo      %DST%
echo.
echo   Then: Settings - Pages - Deploy from a branch - main - / (root)
echo.
echo   Do NOT use the drag-and-drop uploader on github.com.
echo   It caps at 100 files per upload and this site is !COUNT!.
echo.
pause
