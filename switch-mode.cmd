@echo off
IF "%1"=="" (
    echo Please specify a mode: dev or prod
    exit /b 1
)

IF "%1"=="dev" (
    echo Switching to development mode...
    echo Setting up development environment...
    copy /Y .env.development .env
    set VITE_APP_MODE=development
    set VITE_DEMO_MODE=true
    echo Starting development server...
    npm run dev
) ELSE IF "%1"=="prod" (
    echo Switching to production mode...
    echo Setting up production environment...
    copy /Y .env.production .env
    set VITE_APP_MODE=production
    set VITE_DEMO_MODE=false
    echo Starting production server...
    npm run start
) ELSE (
    echo Invalid mode. Please use dev or prod
    exit /b 1
)
