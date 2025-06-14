@echo off
setlocal enabledelayedexpansion

echo Testing Traffic Light Management API...
echo.

echo 1. Testing health endpoint...
curl -s http://localhost:3000/health
echo.
echo.

echo 2. Testing carrefours endpoint...
curl -s http://localhost:3000/carrefours | findstr "id"
echo.

echo 3. Testing alerts endpoint...
curl -s http://localhost:3000/alerts
echo.
echo.

echo 4. Testing maintenance endpoint...
curl -s http://localhost:3000/maintenance
echo.
echo.

echo 5. Testing configuration...
echo Enabling error simulation (20%% rate)...
curl -X POST -H "Content-Type: application/json" -d "{\"simulateErrors\":true,\"errorRate\":0.2}" http://localhost:3000/admin/config
echo.
echo.

echo 6. Testing latency simulation...
echo Setting latency to 200-500ms...
curl -X POST -H "Content-Type: application/json" -d "{\"minLatency\":200,\"maxLatency\":500}" http://localhost:3000/admin/config
echo.
echo.

echo 7. Creating test maintenance task...
curl -X POST -H "Content-Type: application/json" -d "{\"carrefourId\":\"API_1\",\"type\":\"routine\"}" http://localhost:3000/maintenance
echo.
echo.

echo 8. Testing statistics endpoint...
curl -s http://localhost:3000/statistics
echo.
echo.

echo 9. Testing traffic pattern endpoint...
curl -s http://localhost:3000/traffic-pattern
echo.
echo.

echo 10. Testing traffic pattern for specific time...
curl -s "http://localhost:3000/traffic-pattern?time=2025-06-14T08:00:00Z"
echo.
echo.

echo 11. Verifying final configuration...
curl -s http://localhost:3000/health
echo.
echo.

echo Testing complete!
