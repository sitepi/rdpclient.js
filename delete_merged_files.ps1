# ========================================
# C++ 文件合并 - 旧文件删除脚本
# ========================================
# 
# 此脚本将删除已合并的旧源文件
# 请在确认新文件编译通过后再执行
#
# 使用方法:
#   .\delete_merged_files.ps1
#
# 或者先备份:
#   .\delete_merged_files.ps1 -Backup
# ========================================

param(
    [switch]$Backup = $false,
    [switch]$DryRun = $false
)

$FilesToDelete = @(
    'src\gdi\graphic_api.cpp',
    'src\gdi\screen_functions.cpp',
    'src\utils\log_as_syslog.cpp',
    'src\utils\log_as_logprint.cpp',
    'src\utils\hexadecimal_string_to_buffer.cpp',
    'src\utils\hexdump.cpp',
    'src\utils\sugar\multisz.cpp',
    'src\core\app_path.cpp'
)

$BackupDir = "backup_merged_files_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  C++ 文件合并 - 旧文件删除" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Backup) {
    Write-Host "📦 创建备份目录: $BackupDir" -ForegroundColor Yellow
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
}

$DeletedCount = 0
$NotFoundCount = 0

foreach ($file in $FilesToDelete) {
    if (Test-Path $file) {
        Write-Host "🗑️  准备删除: $file" -ForegroundColor Yellow
        
        if ($Backup -and -not $DryRun) {
            $backupPath = Join-Path $BackupDir $file
            $backupDir = Split-Path $backupPath -Parent
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            Copy-Item $file $backupPath -Force
            Write-Host "   ✅ 已备份到: $backupPath" -ForegroundColor Green
        }
        
        if (-not $DryRun) {
            Remove-Item $file -Force
            Write-Host "   ✅ 已删除" -ForegroundColor Green
        } else {
            Write-Host "   ⏭️  [DRY RUN] 将删除" -ForegroundColor Magenta
        }
        
        $DeletedCount++
    } else {
        Write-Host "⚠️  文件不存在: $file" -ForegroundColor Red
        $NotFoundCount++
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 删除统计" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 已删除:    $DeletedCount 个文件" -ForegroundColor Green
Write-Host "⚠️  未找到:    $NotFoundCount 个文件" -ForegroundColor Yellow

if ($Backup -and -not $DryRun) {
    Write-Host "📦 备份位置:  $BackupDir" -ForegroundColor Cyan
}

if ($DryRun) {
    Write-Host ""
    Write-Host "ℹ️  这是 DRY RUN 模式，未实际删除文件" -ForegroundColor Magenta
    Write-Host "   要真正删除，请运行: .\delete_merged_files.ps1" -ForegroundColor Magenta
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 操作完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $DryRun) {
    Write-Host "⚠️  下一步建议:" -ForegroundColor Yellow
    Write-Host "   1. 运行编译测试: b2 clean && b2" -ForegroundColor White
    Write-Host "   2. 运行单元测试: b2 test" -ForegroundColor White
    Write-Host "   3. 提交变更到 Git" -ForegroundColor White
    Write-Host ""
}
