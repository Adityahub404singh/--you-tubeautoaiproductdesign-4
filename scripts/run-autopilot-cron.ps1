$ErrorActionPreference = "Stop"
$envFile = Join-Path (Get-Location) ".env.local"
if (-not (Test-Path $envFile)) { throw ".env.local not found in project root." }
$line = Get-Content $envFile | Where-Object { $_ -match '^\s*CRON_SECRET\s*=' } | Select-Object -First 1
if (-not $line) { throw "Add CRON_SECRET to .env.local first." }
$secret = ($line -replace '^\s*CRON_SECRET\s*=\s*', '').Trim().Trim('"').Trim("'")
if ([string]::IsNullOrWhiteSpace($secret)) { throw "CRON_SECRET is empty." }
Write-Host "Autopilot scheduler loop running. Keep this terminal open; Ctrl+C stops it."
while ($true) {
    try {
        $response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/autopilot/run" -Headers @{ Authorization = "Bearer $secret" } -TimeoutSec 300
        $response | ConvertTo-Json -Depth 8
    } catch {
        Write-Host "Scheduler request failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 60
}
