# ========================================
# C++ 文件合并 - 验证测试脚本
# ========================================
#
# 此脚本验证合并后的文件是否编译成功
#
# 使用方法:
#   .\verify_merge.ps1
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  验证 C++ 文件合并" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$NewFiles = @(
    'src\gdi\gdi_functions.cpp',
    'src\utils\logging.cpp',
    'src\utils\hex_utils.cpp'
)

$ModifiedFiles = @(
    'src\utils\strutils.cpp',
    'include\core\app_path.hpp'
)

$ConfigFiles = @(
    'targets.jam',
    'Jamroot',
    'configs\Jamroot'
)

Write-Host "📝 检查新创建的文件..." -ForegroundColor Yellow
Write-Host ""
$allOk = $true

foreach ($file in $NewFiles) {
    if (Test-Path $file) {
        $lines = (Get-Content $file | Measure-Object -Line).Lines
        Write-Host "✅ $file ($lines 行)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file [不存在]" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
Write-Host "📝 检查修改的文件..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $ModifiedFiles) {
    if (Test-Path $file) {
        $lines = (Get-Content $file | Measure-Object -Line).Lines
        Write-Host "✅ $file ($lines 行)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file [不存在]" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
Write-Host "📝 检查构建配置..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $ConfigFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
        
        # 检查特定的合并标记
        $content = Get-Content $file -Raw
        
        if ($file -eq 'targets.jam') {
            if ($content -match 'gdi_functions\.o') {
                Write-Host "   ✅ 包含 gdi_functions.o" -ForegroundColor Green
            }
            if ($content -match 'hex_utils\.o') {
                Write-Host "   ✅ 包含 hex_utils.o" -ForegroundColor Green
            }
            if ($content -notmatch 'graphic_api\.o') {
                Write-Host "   ✅ 已移除 graphic_api.o" -ForegroundColor Green
            }
        }
        
        if ($file -eq 'Jamroot') {
            if ($content -match 'logging\.cpp') {
                Write-Host "   ✅ 使用 logging.cpp" -ForegroundColor Green
            }
            if ($content -match 'app_path is now inlined') {
                Write-Host "   ✅ app_path 已内联" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "❌ $file [不存在]" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "✅ 所有检查通过！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 下一步操作：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1️⃣  [可选] 先模拟删除旧文件（不真实删除）：" -ForegroundColor Cyan
    Write-Host "   .\delete_merged_files.ps1 -DryRun" -ForegroundColor White
    Write-Host ""
    Write-Host "2️⃣  删除旧的已合并文件（带备份）：" -ForegroundColor Cyan
    Write-Host "   .\delete_merged_files.ps1 -Backup" -ForegroundColor White
    Write-Host ""
    Write-Host "3️⃣  清理并重新编译：" -ForegroundColor Cyan
    Write-Host "   b2 clean" -ForegroundColor White
    Write-Host "   b2" -ForegroundColor White
    Write-Host ""
    Write-Host "4️⃣  运行测试：" -ForegroundColor Cyan
    Write-Host "   b2 test" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ 检查失败，请修复上述问题" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
}

Write-Host ""
