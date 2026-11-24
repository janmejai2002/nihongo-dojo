# 日本語道場 launcher. Opens the dashboard in the default browser.
# Usage:  .\START.ps1          -> dashboard
#         .\START.ps1 -Sheets  -> printable worksheets hub

param([switch]$Sheets)

# Without this the Japanese in the banner comes out as mojibake in a default console.
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = if ($Sheets) { Join-Path $root 'worksheets\index.html' }
          else { Join-Path $root 'dashboard\index.html' }

if (-not (Test-Path $target)) { Write-Host "Missing: $target" -ForegroundColor Red; exit 1 }

Write-Host ''
Write-Host '  日本語道場  ' -ForegroundColor White -NoNewline
Write-Host 'nihongo dojo' -ForegroundColor DarkGray
Write-Host ''

$progress = Join-Path $root 'learner\progress.json'
if (Test-Path $progress) {
  try {
    $p = Get-Content $progress -Raw | ConvertFrom-Json
    $cards = if ($p.srs) { ($p.srs.PSObject.Properties | Measure-Object).Count } else { 0 }
    Write-Host "  Sprint $($p.sprint)  ·  $cards cards in the SRS  ·  last sync $($p.updated)" -ForegroundColor DarkGray
  } catch { Write-Host '  (progress.json present but unreadable)' -ForegroundColor DarkYellow }
} else {
  Write-Host '  No progress file yet — this is session one.' -ForegroundColor DarkGray
}

# Flag a newer export sitting in Downloads that has not been pulled in yet.
$dl = Join-Path $HOME 'Downloads'
if (Test-Path $dl) {
  $newest = Get-ChildItem -Path $dl -Filter 'nihongo-progress-*.json' -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($newest) {
    $stale = -not (Test-Path $progress) -or $newest.LastWriteTime -gt (Get-Item $progress).LastWriteTime
    if ($stale) {
      Write-Host ''
      Write-Host "  ! Unsynced export: $($newest.Name)" -ForegroundColor Yellow
      Write-Host '    Run claude in this folder and type /nihon — it will ingest it.' -ForegroundColor DarkGray
    }
  }
}

Write-Host ''
Write-Host '  Opening the dashboard...' -ForegroundColor DarkGray
Write-Host ''
Start-Process $target
