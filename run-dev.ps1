$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = Join-Path $Backend ".venv/Scripts/python.exe"
$EnvFile = Join-Path $Backend ".env"
$Manage = Join-Path $Backend "manage.py"

function Stop-ProcessTree {
    param([int]$ProcessId)

    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
        Stop-ProcessTree -ProcessId $child.ProcessId
    }

    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Stop-StaleForgeFrontend {
    $listeners = Get-NetTCPConnection -LocalPort 5175 -State Listen -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
        $isForgeVite = $process.Name -eq "node.exe" -and
            $process.CommandLine -like "*$Root*" -and
            $process.CommandLine -like "*vite*" -and
            $process.CommandLine -like "*--port 5175*"

        if (-not $isForgeVite) {
            Write-Error "A porta 5175 está sendo usada por outro processo. Encerre-o antes de rodar o Forge."
        }

        Write-Host "Encerrando uma instância antiga do frontend..."
        Stop-ProcessTree -ProcessId $listener.OwningProcess
    }
}

function Wait-ForFrontend {
    param([System.Diagnostics.Process]$Process)

    $deadline = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $deadline) {
        $Process.Refresh()
        if ($Process.HasExited) {
            Write-Error "O frontend encerrou durante a inicialização. Rode 'npm run dev' dentro de frontend para ver os logs."
        }

        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:5175/signin" -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                return
            }
        }
        catch {
            # O Vite ainda está inicializando.
        }

        Start-Sleep -Milliseconds 250
    }

    Write-Error "O frontend não respondeu em http://127.0.0.1:5175/ dentro de 90 segundos."
}

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

Stop-StaleForgeFrontend
$frontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--", "--host", "127.0.0.1", "--port", "5175" -WorkingDirectory $Frontend -WindowStyle Hidden -PassThru
try {
    Wait-ForFrontend -Process $frontendProcess
    & $Python $Manage runserver 127.0.0.1:8000
}
finally {
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-ProcessTree -ProcessId $frontendProcess.Id
    }
}
