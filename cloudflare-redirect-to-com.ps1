# cloudflare-redirect-to-com.ps1
# Creates a 301 Dynamic Redirect Rule (path-for-path) on ostrelya.info and
# ostrelya.org so every request redirects to the matching URL on
# https://ostrelya.com via the Cloudflare Rulesets API.
#
# Usage:
#   $env:CLOUDFLARE_API_TOKEN = "your_token"
#   powershell -ExecutionPolicy Bypass -File cloudflare-redirect-to-com.ps1
#
# Token is NEVER written to this file. It is read from the CLOUDFLARE_API_TOKEN
# env var, or prompted at runtime. Create a scoped API token with:
#   - Zone > Zone > Read            (all three zones)
#   - Zone > Dynamic Redirect > Edit  (all three zones)
#   - Zone > DNS > Edit             (all three zones)  [for placeholder record]

$ErrorActionPreference = 'Stop'
$base = 'https://api.cloudflare.com/client/v4'

# ---- Domains ----
$anchor    = 'ostrelya.com'                 # canonical target (exact host)
$redirects = @('ostrelya.info', 'ostrelya.org')  # TLDs that 301 -> .com

# ---- Token resolution (never hardcoded) ----
$token = $env:CLOUDFLARE_API_TOKEN
# Fallback: read from a local file so the token never needs pasting into chat
# (created by: Set-Content -LiteralPath "$env:TEMP\cftok.txt" -Value "TOKEN" -NoNewline)
if ([string]::IsNullOrWhiteSpace($token)) {
    $tokFile = Join-Path $env:TEMP 'cftok.txt'
    if (Test-Path -LiteralPath $tokFile) {
        $token = (Get-Content -LiteralPath $tokFile -Raw).Trim()
        Write-Output "  (token read from $tokFile)"
    }
}
if ([string]::IsNullOrWhiteSpace($token)) {
    $prompt = Read-Host -AsSecureString 'Paste your Cloudflare API token'
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($prompt)
    $token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
if ([string]::IsNullOrWhiteSpace($token)) { throw 'No API token provided.' }

$headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }

function Invoke-CF($method, $path, $body = $null) {
    $params = @{ Method = $method; Uri = "$base$path"; Headers = $headers }
    if ($null -ne $body) { $params.Body = ($body | ConvertTo-Json -Depth 15) }
    $resp = Invoke-RestMethod @params
    if (-not $resp.success) {
        throw ("Cloudflare error on $method $path : " + ($resp.errors | ConvertTo-Json -Compress))
    }
    return $resp.result
}

function Get-ZoneId($zoneName) {
    $res = Invoke-CF 'GET' "/zones?name=$zoneName"
    if (($res | Measure-Object).Count -eq 0) {
        throw "Zone '$zoneName' not found in this account. Skippable if you meant a different TLD."
    }
    Write-Output ("  zone '{0}' -> id {1} (status {2})" -f $zoneName, $res[0].id, $res[0].status)
    return $res[0].id
}

Write-Output '== Resolving zones =='
$redirectZones = @{}
foreach ($d in $redirects) { $redirectZones[$d] = Get-ZoneId $d }

# ---- Make sure each TLD zone is active & has at least one proxied record ----
# Redirect rules only evaluate proxied (orange-cloud) traffic. If the zone has
# no proxied record, Cloudflare cannot proxy it; we add a harmless originless A
# record (192.0.2.1 = TEST-NET-1, never routed) purely to activate proxying.
function Ensure-ProxiedRecord($zoneId, $zoneName) {
    $existing = Invoke-CF 'GET' "/zones/$zoneId/dns_records?type=A&name=$zoneName"
    if (($existing | Measure-Object).Count -gt 0) {
        Write-Output "  ($zoneName) proxied A record exists; skipping"
        return
    }
    $body = @{ type = 'A'; name = $zoneName; content = '192.0.2.1'; proxied = $true; ttl = 1 }
    $r = Invoke-CF 'POST' "/zones/$zoneId/dns_records" $body
    Write-Output "  ($zoneName) created originless proxied A record ($($r.id))"
}

# ---- Create/update the 301 redirect rule in the dynamic_redirect phase ----
function Add-RedirectRule($zoneId, $zoneName) {
    $expr = 'concat("https://' + $anchor + '", http.request.uri.path, http.request.uri.search)'
    $rule = @{
        expression       = 'true'
        description      = "Permanent 301 $zoneName -> $anchor (path-for-path)"
        action           = 'redirect'
        action_parameters = @{
            from_value = @{
                target_url = @{ expression = $expr }
                status_code = 301
                preserve_query_string = $true
            }
        }
    }
    # PUT to the phase entrypoint; auto-creates the ruleset if none exists.
    $body = @{ rules = @($rule) }
    $r = Invoke-CF 'PUT' "/zones/$zoneId/rulesets/phases/http_request_dynamic_redirect/entrypoint" $body
    Write-Output ("  ({0}) entrypoint ruleset {1} (version {2}) updated with {3} rule(s)" -f `
        $zoneName, $r.id, $r.version, ($r.rules | Measure-Object).Count)
}

foreach ($d in $redirects) {
    Write-Output "== $d =="
    $zid = $redirectZones[$d]
    Ensure-ProxiedRecord $zid $d
    Add-RedirectRule $zid $d
}

Write-Output ''
Write-Output '== Done. Verify with:'
Write-Output "  curl -I https://$($redirects[0])/usluge.html"
Write-Output "  (expect: HTTP/2 301, location: https://$anchor/usluge.html)"
