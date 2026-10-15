@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   SkillAtlas 数据更新
echo ============================================
echo.
echo [1/5] 搜索 GitHub 仓库（约 5 分钟）...
python tools\collect_skills.py search --pages 2 --min-stars 3
if errorlevel 1 goto fail
echo.
echo [2/5] 更新仓库元数据和真实星标观测（匿名模式限量）...
python tools\collect_skills.py refresh
if errorlevel 1 goto fail
echo.
echo [3/5] 核验 SKILL.md（受 60 次/小时配额限制）...
python tools\collect_skills.py verify --verify-budget 15
if errorlevel 1 goto fail
echo.
echo [4/5] 镜像全量核验（jsDelivr，免配额，约 6 分钟）...
python tools\collect_skills.py scan --workers 12 --min-stars 3
if errorlevel 1 goto fail
echo.
echo [5/5] 生成数据集和今日涨星榜（首次需积累约一天）...
python tools\collect_skills.py emit --min-stars 3
if errorlevel 1 goto fail
echo.
echo 完成。打开 index.html 查看最新数据。
pause
exit /b 0

:fail
echo.
echo 出错，请检查上面的输出。
pause
exit /b 1
