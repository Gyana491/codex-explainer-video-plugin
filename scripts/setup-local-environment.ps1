param(
    [string]$NodeVersion = "22.23.1",
    [string]$FfmpegArchive = "",
    [string]$ToolRoot = (Join-Path $env:LOCALAPPDATA "CodexTools"),
    [string]$MarketplaceRoot = ""
)

$ErrorActionPreference = "Stop"

if (-not $FfmpegArchive -or -not (Test-Path -LiteralPath $FfmpegArchive)) {
    throw "Provide an existing FFmpeg release archive with -FfmpegArchive."
}

if (-not $MarketplaceRoot) {
    $MarketplaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

$pluginRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$expectedPluginRoot = Join-Path $MarketplaceRoot "codex-explainer-video-plugin"
if ($pluginRoot -ne $expectedPluginRoot) {
    throw "Expected plugin root '$expectedPluginRoot', found '$pluginRoot'."
}

New-Item -ItemType Directory -Force -Path $ToolRoot | Out-Null

$nodeDir = Join-Path $ToolRoot "node-x64"
$nodeExe = Join-Path $nodeDir "node.exe"
if (-not (Test-Path -LiteralPath $nodeExe)) {
    $nodeZip = Join-Path $env:TEMP "node-v$NodeVersion-win-x64.zip"
    $nodeStage = Join-Path $env:TEMP ("codex-node-x64-" + [guid]::NewGuid().ToString("N"))
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip" -OutFile $nodeZip
    Expand-Archive -LiteralPath $nodeZip -DestinationPath $nodeStage
    $expandedNode = Join-Path $nodeStage "node-v$NodeVersion-win-x64"
    if (-not (Test-Path -LiteralPath $expandedNode)) {
        throw "The Node.js archive did not contain the expected x64 directory."
    }
    Move-Item -LiteralPath $expandedNode -Destination $nodeDir
}

$nodeArch = (& $nodeExe -p "process.arch").Trim()
if ($nodeArch -ne "x64") {
    throw "Portable Node.js has architecture '$nodeArch', expected 'x64'."
}

$ffmpegDir = Join-Path $ToolRoot "ffmpeg"
$ffmpegExe = Join-Path $ffmpegDir "bin\ffmpeg.exe"
$ffprobeExe = Join-Path $ffmpegDir "bin\ffprobe.exe"
if (-not (Test-Path -LiteralPath $ffmpegExe)) {
    $ffmpegStage = Join-Path $env:TEMP ("codex-ffmpeg-" + [guid]::NewGuid().ToString("N"))
    Expand-Archive -LiteralPath $FfmpegArchive -DestinationPath $ffmpegStage
    $expandedFfmpeg = Get-ChildItem -LiteralPath $ffmpegStage -Directory | Select-Object -First 1
    if (-not $expandedFfmpeg -or -not (Test-Path -LiteralPath (Join-Path $expandedFfmpeg.FullName "bin\ffmpeg.exe"))) {
        throw "The FFmpeg archive did not contain the expected bin/ffmpeg.exe layout."
    }
    Move-Item -LiteralPath $expandedFfmpeg.FullName -Destination $ffmpegDir
}

if (-not (Test-Path -LiteralPath $ffprobeExe)) {
    throw "FFprobe was not found next to FFmpeg."
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathParts = @($userPath -split ";" | Where-Object { $_ })
$requiredPaths = @($nodeDir, (Join-Path $ffmpegDir "bin"))
foreach ($requiredPath in $requiredPaths) {
    if ($pathParts -notcontains $requiredPath) {
        $pathParts = @($requiredPath) + $pathParts
    }
}
[Environment]::SetEnvironmentVariable("Path", ($pathParts -join ";"), "User")

$marketplacePath = Join-Path $MarketplaceRoot ".agents\plugins\marketplace.json"
if (Test-Path -LiteralPath $marketplacePath) {
    throw "Marketplace already exists at '$marketplacePath'; refusing to overwrite it."
}
New-Item -ItemType Directory -Force -Path (Split-Path $marketplacePath -Parent) | Out-Null
$marketplace = [ordered]@{
    name = "explainer-local"
    interface = [ordered]@{ displayName = "Explainer Local" }
    plugins = @(
        [ordered]@{
            name = "codex-explainer-video-plugin"
            source = [ordered]@{
                source = "local"
                path = "./codex-explainer-video-plugin"
            }
            policy = [ordered]@{
                installation = "AVAILABLE"
                authentication = "ON_INSTALL"
            }
            category = "Productivity"
        }
    )
}
$marketplace | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $marketplacePath -Encoding utf8NoBOM

Write-Output "NODE_EXE=$nodeExe"
Write-Output "NODE_ARCH=$nodeArch"
Write-Output "FFMPEG_EXE=$ffmpegExe"
Write-Output "FFPROBE_EXE=$ffprobeExe"
Write-Output "MARKETPLACE_ROOT=$MarketplaceRoot"
Write-Output "MARKETPLACE_PATH=$marketplacePath"

