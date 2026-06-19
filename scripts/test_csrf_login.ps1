# Test script: CSRF + login + admin endpoint call
# Usage: powershell -ExecutionPolicy Bypass -File .\test_csrf_login.ps1

$base = 'http://127.0.0.1:8000'
$csrfUrl = "$base/sanctum/csrf-cookie"
$loginUrl = "$base/api/v1/auth/login"
$adminListUrl = "$base/api/v1/admin/my-users"

# temp files
$cookieFile = "$env:TEMP\csfr_cookies.txt"

if (Test-Path $cookieFile) { Remove-Item $cookieFile -ErrorAction SilentlyContinue }

function Invoke-WithCookies($method, $url, $body = $null) {
    $headers = @{
        'Accept' = 'application/json'
    }

    if ($body -ne $null) {
        $json = $body | ConvertTo-Json -Depth 10
        $headers['Content-Type'] = 'application/json'
        $resp = Invoke-WebRequest -Uri $url -Method $method -Body $json -Headers $headers -WebSession $global:ws -UseBasicParsing -ErrorAction Stop
    } else {
        $resp = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -WebSession $global:ws -UseBasicParsing -ErrorAction Stop
    }
    return $resp
}

try {
    $global:ws = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    Write-Host "Fetching CSRF cookie from $csrfUrl"
    Invoke-WithCookies -method GET -url $csrfUrl | Out-Null

    # show cookies
    $global:ws.Cookies.GetCookies($base) | ForEach-Object { Write-Host "Cookie: $($_.Name) = $($_.Value)" }

    Write-Host "Attempting login as admin@collabsearch.com / password"
    $loginBody = @{ email = 'admin@collabsearch.com'; password = 'password' }
    $loginResp = Invoke-WithCookies -method POST -url $loginUrl -body $loginBody
    Write-Host "Login status: $($loginResp.StatusCode)"
    $loginResp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5 | Write-Host

    Write-Host "Calling admin list endpoint (with Bearer token)"
    $loginJson = $loginResp.Content | ConvertFrom-Json
    $token = $loginJson.token

    $adminHeaders = @{
        'Accept' = 'application/json'
        'Authorization' = "Bearer $token"
    }

    $adminResp = Invoke-WebRequest -Uri $adminListUrl -Method GET -Headers $adminHeaders -WebSession $global:ws -UseBasicParsing -ErrorAction Stop
    Write-Host "Admin list status: $($adminResp.StatusCode)"
    $adminResp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $r = $_.Exception.Response
        try { $reader = New-Object System.IO.StreamReader($r.GetResponseStream()); $reader.ReadToEnd() | Write-Host } catch {}
    }
}
