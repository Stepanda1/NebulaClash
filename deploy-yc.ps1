$ErrorActionPreference = "Stop"

$projectDir = "C:\Users\stepa\.gemini\antigravity\scratch\match3-game"
$awsCli = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$endpoint = "https://storage.yandexcloud.net"
$bucket = "match3-game"

Set-Location $projectDir
npm run build

& $awsCli --endpoint-url $endpoint s3 sync dist "s3://$bucket" --delete
