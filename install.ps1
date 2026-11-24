<#
  Installs Nihongo Dojo as a Start Menu app.

      .\install.ps1              install for the current user
      .\install.ps1 -Desktop     also put a shortcut on the desktop
      .\install.ps1 -Uninstall   remove the shortcuts (the project folder is left alone)

  There is nothing to "install" in the MSI sense — no services, no registry, no admin rights.
  It creates a Start Menu folder with shortcuts that open the dashboard in a Chromium browser
  with --app, which gives a chrome-less window that behaves like a native app: own taskbar entry,
  pinnable, no address bar. Everything runs from the filesystem, so it works with no network.
#>

param([switch]$Desktop, [switch]$Uninstall)

try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}

$root      = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboard = Join-Path $root 'dashboard\index.html'
$sheets    = Join-Path $root 'worksheets\index.html'
$icon      = Join-Path $root 'assets\nihongo.ico'
$startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Nihongo Dojo'

function Write-Step($msg, $colour = 'Gray') { Write-Host "  $msg" -ForegroundColor $colour }

Write-Host ''
Write-Host '  Nihongo Dojo' -ForegroundColor White -NoNewline
Write-Host '  ·  installer' -ForegroundColor DarkGray
Write-Host ''

# ---------- uninstall ----------
if ($Uninstall) {
  $removed = 0
  if (Test-Path $startMenu) { Remove-Item $startMenu -Recurse -Force; $removed++ ; Write-Step 'Removed Start Menu entries.' }
  $desk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Nihongo Dojo.lnk'
  if (Test-Path $desk) { Remove-Item $desk -Force; $removed++ ; Write-Step 'Removed desktop shortcut.' }
  if ($removed -eq 0) { Write-Step 'Nothing was installed.' 'DarkYellow' }
  else { Write-Step 'Done. Your progress and the project folder are untouched.' 'Green' }
  Write-Host ''
  return
}

# ---------- sanity ----------
foreach ($p in @($dashboard, $sheets)) {
  if (-not (Test-Path $p)) { Write-Step "Missing: $p" 'Red'; Write-Host ''; exit 1 }
}
if (-not (Test-Path $icon)) {
  Write-Step 'Icon missing — generating it.' 'DarkYellow'
  & (Join-Path $root 'assets\make-icon.ps1') | Out-Null
}

# ---------- find a Chromium browser for app mode ----------
$candidates = @(
  @{ n = 'Microsoft Edge'; p = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" },
  @{ n = 'Microsoft Edge'; p = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" },
  @{ n = 'Google Chrome';  p = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" },
  @{ n = 'Google Chrome';  p = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe" },
  @{ n = 'Google Chrome';  p = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe" },
  @{ n = 'Brave';          p = "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe" }
)
$browser = $null
foreach ($c in $candidates) {
  if ($c.p -and (Test-Path $c.p)) { $browser = $c; break }
}

function New-Shortcut($path, $target, $arguments, $desc, $workDir, $iconPath) {
  $sh = New-Object -ComObject WScript.Shell
  $lnk = $sh.CreateShortcut($path)
  $lnk.TargetPath       = $target
  if ($arguments) { $lnk.Arguments = $arguments }
  $lnk.WorkingDirectory = $workDir
  $lnk.Description      = $desc
  $lnk.IconLocation     = "$iconPath,0"
  $lnk.Save()
  [Runtime.InteropServices.Marshal]::ReleaseComObject($sh) | Out-Null
}

function Uri($p) { ([Uri]$p).AbsoluteUri }

New-Item -ItemType Directory -Force -Path $startMenu | Out-Null

if ($browser) {
  Write-Step "Found $($browser.n) — installing in app-window mode."
  New-Shortcut (Join-Path $startMenu 'Nihongo Dojo.lnk') $browser.p "--app=$(Uri $dashboard)" `
    'Japanese trainer — hiragana to JLPT N3. Works offline.' $root $icon
  New-Shortcut (Join-Path $startMenu 'Japanese Worksheets.lnk') $browser.p "--app=$(Uri $sheets)" `
    'Printable katakana, kanji and composition worksheets.' $root $icon
} else {
  Write-Step 'No Chromium browser found — falling back to your default browser.' 'DarkYellow'
  Write-Step 'The app will open in a normal tab rather than its own window.' 'DarkGray'
  New-Shortcut (Join-Path $startMenu 'Nihongo Dojo.lnk') $dashboard $null `
    'Japanese trainer — hiragana to JLPT N3. Works offline.' $root $icon
  New-Shortcut (Join-Path $startMenu 'Japanese Worksheets.lnk') $sheets $null `
    'Printable katakana, kanji and composition worksheets.' $root $icon
}

if ($Desktop) {
  $desk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Nihongo Dojo.lnk'
  if ($browser) { New-Shortcut $desk $browser.p "--app=$(Uri $dashboard)" 'Japanese trainer' $root $icon }
  else { New-Shortcut $desk $dashboard $null 'Japanese trainer' $root $icon }
  Write-Step 'Desktop shortcut created.'
}

Write-Host ''
Write-Step 'Installed.' 'Green'
Write-Host ''
Write-Step 'Press the Windows key and type "nihongo", "dojo", "japanese" or "worksheets".' 'White'
Write-Step 'Right-click the result to pin it to Start or the taskbar.' 'DarkGray'
Write-Host ''
Write-Step 'Progress is stored by the browser against the path of this folder. If you move the' 'DarkGray'
Write-Step 'project, export your progress from the Progress tab first, then re-run this script.' 'DarkGray'
Write-Host ''
