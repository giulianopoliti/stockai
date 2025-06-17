# Script para ejecutar el frontend (Next.js) y backend (FastAPI) simultáneamente

Write-Host "🚀 Iniciando StockAI..." -ForegroundColor Green

# Verificar si Python está instalado
try {
    python --version
    Write-Host "✅ Python encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Python no encontrado. Por favor instala Python 3.8+" -ForegroundColor Red
    exit 1
}

# Verificar si pnpm está instalado
try {
    pnpm --version
    Write-Host "✅ pnpm encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Instalar dependencias del backend si no existen
if (-not (Test-Path "backend/venv")) {
    Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Yellow
    cd backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    cd ..
} else {
    Write-Host "✅ Dependencias del backend ya instaladas" -ForegroundColor Green
}

# Instalar dependencias del frontend si no existen
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Yellow
    cd frontend
    pnpm install
    cd ..
} else {
    Write-Host "✅ Dependencias del frontend ya instaladas" -ForegroundColor Green
}

Write-Host "🔥 Iniciando servidores..." -ForegroundColor Cyan

# Iniciar backend en segundo plano
Start-Job -ScriptBlock {
    cd $using:PWD\backend
    .\venv\Scripts\Activate.ps1
    python main.py
} -Name "Backend"

# Esperar un momento para que el backend se inicie
Start-Sleep -Seconds 3

# Iniciar frontend
Start-Job -ScriptBlock {
    cd $using:PWD\frontend
    pnpm run dev
} -Name "Frontend"

Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow

# Mantener el script corriendo y mostrar logs
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Red
    Get-Job | Stop-Job
    Get-Job | Remove-Job
} 