param(
  [string]$SshHost = "37.140.192.43",
  [int]$Port = 22,
  [string]$User = "u3426655",
  [string]$SitePath = "/var/www/u3426655/data/www/nebulaclash.com",
  [string]$BackendPath = "/var/www/u3426655/data/nebulaclash-backend",
  [string]$Password = $env:NEBULACLASH_DEPLOY_PASSWORD,
  [switch]$UploadBackend,
  [switch]$ResetBackendState = $true
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$hasPutty = [bool](Get-Command pscp -ErrorAction SilentlyContinue) -and [bool](Get-Command plink -ErrorAction SilentlyContinue)
$usePuttyWithPassword = $hasPutty -and -not [string]::IsNullOrWhiteSpace($Password)

function Invoke-Upload {
  param(
    [string]$LocalPath,
    [string]$RemotePath,
    [switch]$Recurse
  )

  if ($usePuttyWithPassword) {
    $args = @("-batch", "-pw", $Password, "-P", $Port)
    if ($Recurse) { $args += "-r" }
    $args += @($LocalPath, "$User@$SshHost`:$RemotePath")
    & pscp @args
  } else {
    $args = @("-P", $Port)
    if ($Recurse) { $args += "-r" }
    $args += @($LocalPath, "$User@$SshHost`:$RemotePath")
    & scp @args
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Upload failed: $LocalPath -> $RemotePath"
  }
}

function Invoke-Remote($command) {
  if ($usePuttyWithPassword) {
    & plink -batch -pw $Password -P $Port "$User@$SshHost" $command
  } else {
    & ssh -p $Port "$User@$SshHost" $command
  }
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
Invoke-Upload -LocalPath "dist/." -RemotePath "$SitePath/" -Recurse
Invoke-Remote "find '$SitePath' -type d -exec chmod 755 {} + && find '$SitePath' -type f -exec chmod 644 {} +"

if ($UploadBackend) {
  Write-Host "Preparing backend directory $BackendPath ..."
  Invoke-Remote "mkdir -p '$BackendPath' '$BackendPath/data'"

  Write-Host "Uploading backend files..."
  Invoke-Upload -LocalPath ".\server" -RemotePath "$BackendPath/" -Recurse
  Invoke-Upload -LocalPath ".\package.json" -RemotePath "$BackendPath/"
  Invoke-Upload -LocalPath ".\package-lock.json" -RemotePath "$BackendPath/"
  Invoke-Upload -LocalPath ".\data\.gitkeep" -RemotePath "$BackendPath/data/"
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
