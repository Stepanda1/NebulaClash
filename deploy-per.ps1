$ErrorActionPreference = "Stop"

param(
  [string]$Host = "37.140.192.43",
  [int]$Port = 22,
  [string]$User = "u3426655",
  [string]$SitePath = "/var/www/u3426655/data/www/nebulaclash.com",
  [string]$BackendPath = "/var/www/u3426655/data/nebulaclash-backend",
  [switch]$UploadBackend,
  [switch]$ResetBackendState = $true
)

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Invoke-Remote($command) {
  & ssh -p $Port "$User@$Host" $command
  if ($LASTEXITCODE -ne 0) {
    throw "Remote command failed: $command"
  }
}

Set-Location $projectDir

Write-Host "Building frontend..."
npm run build
if ($LASTEXITCODE -ne 0) {
  throw "Frontend build failed"
}

Write-Host "Uploading static files to $SitePath ..."
& scp -P $Port -r "dist/." "$User@$Host`:$SitePath/"
if ($LASTEXITCODE -ne 0) {
  throw "Static upload failed"
}
Invoke-Remote "find '$SitePath' -type d -exec chmod 755 {} + && find '$SitePath' -type f -exec chmod 644 {} +"

if ($UploadBackend) {
  Write-Host "Preparing backend directory $BackendPath ..."
  Invoke-Remote "mkdir -p '$BackendPath' '$BackendPath/data'"

  Write-Host "Uploading backend files..."
  & scp -P $Port -r ".\server" "$User@$Host`:$BackendPath/"
  if ($LASTEXITCODE -ne 0) { throw "Backend server upload failed" }

  & scp -P $Port ".\package.json" "$User@$Host`:$BackendPath/"
  if ($LASTEXITCODE -ne 0) { throw "package.json upload failed" }

  & scp -P $Port ".\package-lock.json" "$User@$Host`:$BackendPath/"
  if ($LASTEXITCODE -ne 0) { throw "package-lock.json upload failed" }

  & scp -P $Port ".\data\.gitkeep" "$User@$Host`:$BackendPath/data/"
  if ($LASTEXITCODE -ne 0) { throw "data/.gitkeep upload failed" }
  Invoke-Remote "chmod 755 '$BackendPath' '$BackendPath/server' '$BackendPath/data' && chmod 644 '$BackendPath/package.json' '$BackendPath/package-lock.json' '$BackendPath/server/'*.mjs"
  if ($ResetBackendState) {
    Write-Host "Resetting backend wallet state..."
    Invoke-Remote "cat > '$BackendPath/data/wallet-state.json' <<'EOF'
{
  ""wallets"": {},
  ""orders"": {}
}
EOF"
    Invoke-Remote "chmod 644 '$BackendPath/data/wallet-state.json'"
  }
}

Write-Host "Done."
