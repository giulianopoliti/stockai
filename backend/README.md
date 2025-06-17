# StockAI Backend

Backend FastAPI para el sistema de gestión de stock con capacidades de OCR usando Amazon Textract.

## Características

- 🔍 **OCR Real** con Amazon Textract - Extrae texto de facturas escaneadas
- 🧠 **IA Inteligente** con OpenAI GPT-3.5 - Procesa texto y detecta productos
- 📝 **Procesamiento Avanzado** - Mapea productos a inventario existente
- 🚀 **API REST** con FastAPI - Documentación automática
- 🔗 **CORS Configurado** para Next.js frontend
- 📊 **Detección Precisa** de productos, cantidades y precios
- 🛡️ **Fallback Inteligente** - Funciona sin APIs externas para desarrollo

## Configuración

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar APIs

#### AWS Textract (para OCR real)
1. **Crear usuario IAM** en AWS Console
2. **Asignar permisos** de Textract (ver sección de permisos abajo)
3. **Obtener credenciales** (Access Key + Secret Key)

#### OpenAI (para procesamiento inteligente)
1. **Crear cuenta** en https://platform.openai.com
2. **Generar API Key** en https://platform.openai.com/api-keys
3. **Configurar facturación** (necesario para usar la API)

### 3. Crear archivo .env

Copia `env_template.txt` a `.env` y completa tus credenciales:

```bash
# Copiar template
cp env_template.txt .env

# Editar con tus credenciales
# AWS_ACCESS_KEY_ID=tu_aws_access_key
# AWS_SECRET_ACCESS_KEY=tu_aws_secret_key
# OPENAI_API_KEY=tu_openai_api_key
```

**⚠️ Importante**: Sin estas APIs configuradas, el sistema funcionará con simulación para desarrollo.

## Ejecutar el servidor

```bash
python main.py
```

O usando uvicorn directamente:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: http://localhost:8000

## Endpoints

### `GET /`
Health check básico

### `POST /process-invoice`
Procesa una imagen de factura usando OCR
- **Input**: Archivo de imagen (multipart/form-data)
- **Output**: Lista de productos detectados con cantidades y confianza

### `POST /process-text`
Procesa texto libre para detectar productos
- **Input**: Texto en formato JSON
- **Output**: Lista de productos detectados

### `GET /health`
Endpoint de health check

## Uso desde el frontend

```javascript
// Procesar imagen de factura
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/process-invoice', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

## Permisos AWS requeridos

Tu usuario de AWS necesita los siguientes permisos:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "textract:DetectDocumentText",
                "textract:AnalyzeDocument"
            ],
            "Resource": "*"
        }
    ]
}
```

## Desarrollo

Para desarrollo local, puedes usar el modo debug:

```bash
uvicorn main:app --reload --log-level debug
```

La documentación automática estará disponible en:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc 