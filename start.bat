@echo off
echo Starting Nutrition Tracker Application...
echo.

echo Installing dependencies...
call npm run install-all

echo.
echo Starting the application...
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:5000
echo.

call npm run dev

pause







