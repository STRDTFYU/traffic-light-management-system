@echo off
echo Starting development API server...

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

REM Check if required packages are installed
if not exist node_modules\express (
    echo Installing required packages...
    npm install express cors ws nodemon --save
)

REM Start the server
echo Starting server on port 3000...
node --experimental-json-modules api-server.js

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to start the server
    pause
    exit /b 1
)
