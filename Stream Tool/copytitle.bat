@echo off
rem AZPM: copies a VOD title for the current match to the clipboard.
rem The Stream Tool has to be open. See Resources\AZPM\Scripts\copytitle.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Resources\AZPM\Scripts\copytitle.ps1"
if errorlevel 1 pause
