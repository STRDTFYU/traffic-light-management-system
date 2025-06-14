@echo off
setlocal enabledelayedexpansion

if "%1"=="" (
    goto :help
)

set "CURL_CMD=curl -X POST http://localhost:3000/admin/config -H "Content-Type: application/json""

if "%1"=="latency" (
    if "%2"=="on" (
        if "%3"=="" (
            %CURL_CMD% -d "{\"minLatency\":100,\"maxLatency\":1000}"
        ) else (
            %CURL_CMD% -d "{\"minLatency\":%3,\"maxLatency\":%4}"
        )
    ) else (
        %CURL_CMD% -d "{\"minLatency\":0,\"maxLatency\":0}"
    )
    goto :eof
)

if "%1"=="errors" (
    if "%2"=="on" (
        if "%3"=="" (
            %CURL_CMD% -d "{\"simulateErrors\":true,\"errorRate\":0.1}"
        ) else (
            %CURL_CMD% -d "{\"simulateErrors\":true,\"errorRate\":%3}"
        )
    ) else (
        %CURL_CMD% -d "{\"simulateErrors\":false}"
    )
    goto :eof
)

if "%1"=="update" (
    if "%2"=="" (
        echo Error: Please specify update interval in milliseconds
        goto :help
    )
    %CURL_CMD% -d "{\"updateInterval\":%2}"
    goto :eof
)

if "%1"=="reset" (
    %CURL_CMD% -d "{\"simulateErrors\":false,\"minLatency\":0,\"maxLatency\":0,\"updateInterval\":5000}"
    goto :eof
)

if "%1"=="status" (
    curl -X GET http://localhost:3000/health
    goto :eof
)

:help
echo Traffic Light API Control Script
echo Usage:
echo   control-api latency on [min max]  - Enable latency simulation (optional min/max in ms)
echo   control-api latency off           - Disable latency simulation
echo   control-api errors on [rate]      - Enable error simulation (optional rate 0-1)
echo   control-api errors off            - Disable error simulation
echo   control-api update ^<interval^>     - Set update interval in milliseconds
echo   control-api reset                 - Reset all settings to defaults
echo   control-api status               - Show current API status
goto :eof