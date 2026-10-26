# YouTube AI Autopilot — local pipeline E2E test
# Safe by default: does NOT publish or upload anything to YouTube/Instagram.
# Run from the project root in PowerShell while `npm run dev` is running.

$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:3000"
$ProjectRoot = (Get-Location).Path
$ReportPath = Join-Path $ProjectRoot ("e2e-test-report-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".json")
$Results = [System.Collections.Generic.List[object]]::new()

function Add-Result([string]$Stage, [bool]$Passed, [string]$Message, $Data = $null) {
    $item = [ordered]@{
        stage = $Stage
        passed = $Passed
        message = $Message
        data = $Data
        time = (Get-Date).ToString("o")
    }
    $Results.Add([pscustomobject]$item)
    $mark = if ($Passed) { "PASS" } else { "FAIL" }
    Write-Host ("[{0}] {1} - {2}" -f $mark, $Stage, $Message) -ForegroundColor $(if ($Passed) { "Green" } else { "Red" })
}

function Invoke-JsonPost([string]$Path, $Body) {
    $json = $Body | ConvertTo-Json -Depth 12
    try {
        return Invoke-RestMethod -Uri "$BaseUrl$Path" -Method Post -ContentType "application/json" -Body $json -TimeoutSec 240
    } catch {
        $detail = $_.Exception.Message
        if ($_.ErrorDetails.Message) { $detail += " | " + $_.ErrorDetails.Message }
        throw "$Path request failed: $detail"
    }
}

Write-Host "`n=== AUTOPILOT E2E TEST (NO SOCIAL PUBLISHING) ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"
Write-Host "Target:  $BaseUrl"
Write-Host "This test can generate local files and use configured AI/TTS providers; it will NOT publish." -ForegroundColor Yellow

# Stage 0: prerequisites
try {
    $health = Invoke-WebRequest -Uri "$BaseUrl/" -Method Get -TimeoutSec 20
    if ($health.StatusCode -ge 200 -and $health.StatusCode -lt 400) {
        Add-Result "0-server" $true "Next.js app reachable (HTTP $($health.StatusCode))"
    } else {
        Add-Result "0-server" $false "Unexpected HTTP $($health.StatusCode)"
        throw "App not reachable"
    }
} catch {
    Add-Result "0-server" $false $_.Exception.Message
    throw "Start the app in another PowerShell window with: npm run dev"
}

$script = $null
$audio = $null
$video = $null
$thumbnail = $null

# Stage 1: script generation (requires GROQ_API_KEY in .env.local)
try {
    $script = Invoke-JsonPost "/api/videos/generate" @{
        topic = "3 practical habits that improve focus"
        language = "Hindi"
        channelName = "Autopilot E2E Test"
        category = "motivation"
        mode = "shorts"
    }
    if (-not $script.title -or -not $script.script) {
        throw "API returned no title or script. Response: $($script | ConvertTo-Json -Depth 6 -Compress)"
    }
    Add-Result "1-script" $true "Generated title and script" @{
        title = $script.title
        scriptCharacters = ([string]$script.script).Length
        tagsCount = @($script.tags).Count
    }
} catch {
    Add-Result "1-script" $false $_.Exception.Message
    throw "Stop: fix script generation before testing later stages."
}

# Stage 2: voice-over generation (uses local TTS/provider; no social upload)
try {
    $textForVoice = ([string]$script.hook + ". " + [string]$script.script).Trim()
    if ($textForVoice.Length -gt 430) { $textForVoice = $textForVoice.Substring(0, 430) }
    $audio = Invoke-JsonPost "/api/voiceover" @{
        text = $textForVoice
        category = "motivation"
        isShorts = $true
        translateHindi = $false
    }
    if (-not $audio.success -or -not $audio.audioUrl) {
        throw "API did not return success/audioUrl. Response: $($audio | ConvertTo-Json -Depth 5 -Compress)"
    }
    $audioFile = Join-Path $ProjectRoot ("storage\audio\" + [IO.Path]::GetFileName([uri]::UnescapeDataString([string]$audio.audioUrl)))
    if (-not (Test-Path $audioFile)) { throw "Audio URL returned but local file not found: $audioFile" }
    $audioSize = (Get-Item $audioFile).Length
    if ($audioSize -lt 1000) { throw "Audio file looks too small ($audioSize bytes)." }
    Add-Result "2-voiceover" $true "Audio created ($audioSize bytes; provider=$($audio.provider))" @{ audioUrl = $audio.audioUrl; bytes = $audioSize; provider = $audio.provider }
} catch {
    Add-Result "2-voiceover" $false $_.Exception.Message
    throw "Stop: fix voice-over generation before testing render."
}

# Stage 3: render a local vertical video using the generated script/audio
try {
    $video = Invoke-JsonPost "/api/video/generate" @{
        audioUrl = $audio.audioUrl
        title = [string]$script.title
        script = $textForVoice
        hook = [string]$script.hook
        videoType = "shorts"
        category = "motivation"
        videoMode = "typography"
        language = "hi"
    }
    if (-not $video.success -or -not $video.videoId) {
        throw "API did not return success/videoId. Response: $($video | ConvertTo-Json -Depth 5 -Compress)"
    }
    $videoFile = Join-Path $ProjectRoot ("storage\videos\" + [string]$video.videoId + ".mp4")
    if (-not (Test-Path $videoFile)) { throw "Render API returned success but MP4 is missing: $videoFile" }
    $videoSize = (Get-Item $videoFile).Length
    if ($videoSize -lt 10000) { throw "MP4 looks too small ($videoSize bytes)." }
    Add-Result "3-render-video" $true "MP4 rendered ($videoSize bytes; duration=$($video.duration)s)" @{ videoId = $video.videoId; videoUrl = $video.videoUrl; bytes = $videoSize; duration = $video.duration; videoMode = $video.videoMode }
} catch {
    Add-Result "3-render-video" $false $_.Exception.Message
    throw "Stop: fix MP4 rendering before testing thumbnail."
}

# Stage 4: thumbnail generation
try {
    $thumbnail = Invoke-JsonPost "/api/thumbnail" @{
        title = [string]$script.title
        boldText = [string]$script.thumbnail.boldText
        category = "motivation"
        videoType = "shorts"
    }
    if (-not $thumbnail.success -or -not $thumbnail.fileName) {
        throw "API did not return success/fileName. Response: $($thumbnail | ConvertTo-Json -Depth 5 -Compress)"
    }
    $thumbnailFile = Join-Path $ProjectRoot ("storage\thumbnails\" + [string]$thumbnail.fileName)
    if (-not (Test-Path $thumbnailFile)) { throw "Thumbnail API returned success but image is missing: $thumbnailFile" }
    $thumbSize = (Get-Item $thumbnailFile).Length
    if ($thumbSize -lt 1000) { throw "Thumbnail looks too small ($thumbSize bytes)." }
    Add-Result "4-thumbnail" $true "Thumbnail created ($thumbSize bytes; $($thumbnail.width)x$($thumbnail.height))" @{ thumbnailUrl = $thumbnail.thumbnailUrl; fileName = $thumbnail.fileName; bytes = $thumbSize; width = $thumbnail.width; height = $thumbnail.height }
} catch {
    Add-Result "4-thumbnail" $false $_.Exception.Message
    throw "Stop: fix thumbnail generation."
}

# Stage 5: report. Publishing deliberately excluded.
$report = [ordered]@{
    project = $ProjectRoot
    baseUrl = $BaseUrl
    publishTested = $false
    note = "No YouTube or Instagram upload was attempted. Publishing must be a separate explicit test."
    results = @($Results)
    generated = @{
        title = $script.title
        audioUrl = $audio.audioUrl
        videoUrl = $video.videoUrl
        thumbnailUrl = $thumbnail.thumbnailUrl
    }
}
$report | ConvertTo-Json -Depth 12 | Set-Content -Path $ReportPath -Encoding utf8
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
$Results | Format-Table stage, passed, message -Wrap -AutoSize
Write-Host "Report saved: $ReportPath" -ForegroundColor Cyan

if (@($Results | Where-Object { -not $_.passed }).Count -gt 0) {
    exit 1
}
Write-Host "`nAll local media-pipeline stages passed. Review the MP4 and thumbnail before any publishing test." -ForegroundColor Green
