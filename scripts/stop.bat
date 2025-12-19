@echo off
REM Stop the Sugarcane Disease Detection application

echo Stopping Sugarcane Disease Detection containers...
docker-compose stop

echo.
echo Containers stopped successfully!
echo.
echo To remove containers completely, run: docker-compose down
pause
