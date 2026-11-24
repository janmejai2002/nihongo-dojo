# Generates assets/nihongo.ico — a multi-resolution PNG-compressed icon.
# Run once; the .ico is committed, so this only needs re-running if the mark changes.
# Windows Vista+ accepts PNG payloads inside .ico at every size.

Add-Type -AssemblyName System.Drawing

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$streams = @()

foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.InterpolationMode = 'HighQualityBicubic'

  # background: near-black rounded square (ink block)
  $r = [Math]::Max(2, [int]($s * 0.18))
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc(0, 0, $d, $d, 180, 90)
  $path.AddArc($s - $d, 0, $d, $d, 270, 90)
  $path.AddArc($s - $d, $s - $d, $d, $d, 0, 90)
  $path.AddArc(0, $s - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 18, 16, 15))
  $g.FillPath($bg, $path)

  # the mark: 日 in vermilion — legible down to 16px, unlike anything denser
  $fontSize = [float]($s * 0.56)
  $families = @('Yu Gothic UI', 'Yu Gothic', 'MS Gothic', 'Segoe UI')
  $fam = $null
  foreach ($f in $families) {
    try { $fam = New-Object System.Drawing.FontFamily $f; break } catch {}
  }
  if (-not $fam) { $fam = [System.Drawing.FontFamily]::GenericSansSerif }
  $font = New-Object System.Drawing.Font($fam, $fontSize, [System.Drawing.FontStyle]::Bold,
    [System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
  $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 217, 79, 61))
  $rect = New-Object System.Drawing.RectangleF(0, 0, $s, $s)
  $g.DrawString([char]0x65E5, $font, $ink, $rect, $fmt)

  $g.Dispose()
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  $streams += , @{ size = $s; bytes = $ms.ToArray() }
}

# assemble the .ico container by hand
$out = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter($out)
$w.Write([UInt16]0)                 # reserved
$w.Write([UInt16]1)                 # type: icon
$w.Write([UInt16]$streams.Count)

$offset = 6 + (16 * $streams.Count)
foreach ($e in $streams) {
  $dim = if ($e.size -ge 256) { 0 } else { $e.size }
  $w.Write([Byte]$dim); $w.Write([Byte]$dim)
  $w.Write([Byte]0); $w.Write([Byte]0)     # palette, reserved
  $w.Write([UInt16]1); $w.Write([UInt16]32) # planes, bpp
  $w.Write([UInt32]$e.bytes.Length)
  $w.Write([UInt32]$offset)
  $offset += $e.bytes.Length
}
foreach ($e in $streams) { $w.Write($e.bytes) }
$w.Flush()

$dest = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'nihongo.ico'
[System.IO.File]::WriteAllBytes($dest, $out.ToArray())
$w.Dispose(); $out.Dispose()

Write-Host "Wrote $dest ($([Math]::Round((Get-Item $dest).Length / 1kb, 1)) KB, $($streams.Count) sizes)"
