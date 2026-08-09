$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Backend ".venv/Scripts/python.exe"
$EnvFile = Join-Path $Backend ".env"
$Manage = Join-Path $Backend "manage.py"

if (-not (Test-Path $Python)) {
    Write-Error "Ambiente virtual não encontrado em backend/.venv. Instale as dependências antes de rodar."
}

if (-not (Test-Path $EnvFile)) {
    Write-Error "Arquivo backend/.env não encontrado. Crie o .env antes de rodar o servidor."
}

Write-Host "Forge dev server"
Write-Host "Frontend: http://127.0.0.1:5175/"
Write-Host "Backend:  http://127.0.0.1:8000/"
Write-Host "Para parar, pressione Ctrl+C."
Write-Host ""

$frontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $Root -WindowStyle Hidden -PassThru
try {
    & $Python $Manage runserver 127.0.0.1:8000
}
finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
    }
}
