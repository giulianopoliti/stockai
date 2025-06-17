# ========================================
# StockAI - Script de Configuración Completa
# ========================================

Write-Host "🏪 Bienvenido a StockAI - Configuración Automática" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Función para verificar si un comando existe
function Test-Command($command) {
    try {
        & $command --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 1. Verificar dependencias
Write-Host "📋 Verificando dependencias..." -ForegroundColor Cyan

# Python
if (Test-Command "python") {
    $pythonVersion = python --version
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python no encontrado. Descarga desde: https://python.org" -ForegroundColor Red
    exit 1
}

# Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js no encontrado. Descarga desde: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# pnpm
if (Test-Command "pnpm") {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm $pnpmVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  pnpm no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm
}

Write-Host ""

# 2. Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan

# Backend
Write-Host "   Backend (Python)..." -ForegroundColor Yellow
if (-not (Test-Path "backend/venv")) {
    cd backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    cd ..
    Write-Host "   ✅ Backend configurado" -ForegroundColor Green
} else {
    Write-Host "   ✅ Backend ya configurado" -ForegroundColor Green
}

# Frontend
Write-Host "   Frontend (Next.js)..." -ForegroundColor Yellow
if (-not (Test-Path "frontend/node_modules")) {
    cd frontend
    pnpm install
    cd ..
    Write-Host "   ✅ Frontend configurado" -ForegroundColor Green
} else {
    Write-Host "   ✅ Frontend ya configurado" -ForegroundColor Green
}

Write-Host ""

# 3. Configurar APIs
Write-Host "🔑 Configuración de APIs" -ForegroundColor Cyan
Write-Host ""

# Copiar template si no existe .env
if (-not (Test-Path "backend/.env")) {
    Write-Host "📄 Creando archivo .env..." -ForegroundColor Yellow
    Copy-Item "backend/env_template.txt" "backend/.env"
    Write-Host "   ✅ Archivo .env creado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Archivo .env ya existe" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 CONFIGURACIÓN REQUERIDA:" -ForegroundColor Magenta
Write-Host ""

Write-Host "1. AWS Textract (para OCR real):" -ForegroundColor White
Write-Host "   • Ve a: https://console.aws.amazon.com/iam/" -ForegroundColor Gray
Write-Host "   • Crea un usuario IAM con permisos de Textract" -ForegroundColor Gray
Write-Host "   • Obtén: Access Key ID y Secret Access Key" -ForegroundColor Gray
Write-Host ""

Write-Host "2. OpenAI (para procesamiento inteligente):" -ForegroundColor White
Write-Host "   • Ve a: https://platform.openai.com/api-keys" -ForegroundColor Gray
Write-Host "   • Crea una cuenta y configura facturación" -ForegroundColor Gray
Write-Host "   • Genera un API Key" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Editar archivo .env:" -ForegroundColor White
Write-Host "   • Abre: backend\.env" -ForegroundColor Gray
Write-Host "   • Completa tus credenciales AWS y OpenAI" -ForegroundColor Gray
Write-Host ""

# 4. Información de uso
Write-Host "🚀 CÓMO USAR EL SISTEMA:" -ForegroundColor Green
Write-Host ""
Write-Host "Opción 1 - Script automático:" -ForegroundColor White
Write-Host "   .\run_dev.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opción 2 - Manual:" -ForegroundColor White
Write-Host "   Backend:  cd backend && .\venv\Scripts\Activate.ps1 && python main.py" -ForegroundColor Cyan
Write-Host "   Frontend: cd frontend && pnpm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "📱 URLs del sistema:" -ForegroundColor Green
Write-Host "   Frontend:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend API:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   Sin configurar AWS + OpenAI, el sistema funcionará con simulación" -ForegroundColor Gray
Write-Host "   para desarrollo. Todas las funciones estarán disponibles." -ForegroundColor Gray
Write-Host ""

$response = Read-Host "¿Quieres abrir el archivo .env para editarlo ahora? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    if (Test-Path "backend/.env") {
        Start-Process notepad "backend\.env"
        Write-Host "✅ Archivo .env abierto en Notepad" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host "   Ejecuta: .\run_dev.ps1 para iniciar el sistema" -ForegroundColor Cyan
Write-Host "" 