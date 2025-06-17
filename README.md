# 🤖 StockAI - Sistema de Gestión de Inventario Inteligente

Sistema completo de gestión de inventario con procesamiento OCR de facturas, detección automática de productos usando IA, y cálculos de impuestos por proveedor.

## 🏗️ Arquitectura

```
stockai/
├── frontend/          # Next.js + TypeScript + Tailwind
│   ├── app/           # Páginas de la aplicación
│   ├── components/    # Componentes reutilizables
│   └── lib/          # Utilidades
├── backend/           # FastAPI + Python
│   ├── data/         # Almacenamiento JSON
│   ├── main.py       # Servidor principal
│   └── requirements.txt
└── docs/             # Documentación
```

## ✨ Características

### 🖼️ **Procesamiento de Facturas**
- **OCR con AWS Textract** para extraer texto de imágenes
- **IA con OpenAI** para detectar productos específicos con gramajes y sabores
- **Detección automática de proveedores** por nombre y CUIT
- **Cálculo automático de impuestos** según el proveedor

### 📦 **Gestión de Stock**
- **Matching inteligente** de productos con IA
- **Actualización automática** de inventario
- **Alertas de stock crítico**
- **Historial de movimientos**

### 🏢 **Proveedores Configurados**
- **SMALL TASTES**: 21% impuesto
- **HIF HIH DistriDuciones**: 32% impuesto  
- **Coca-Cola FEMSA**: 21% impuesto
- **Distribuidora Central**: 25% impuesto

## 🚀 Instalación y Configuración

### 📋 **Prerrequisitos**
- Node.js 18+ 
- Python 3.12+
- Cuentas en AWS y OpenAI (opcional)

### 🔧 **Setup Automático**
```powershell
# Ejecutar script de configuración
./setup.ps1
```

### 🔧 **Setup Manual**

#### **Frontend**
```bash
cd frontend
npm install
npm run dev
```

#### **Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Configurar variables de entorno (opcional)
copy env_example.txt .env
# Editar .env con tus claves de AWS y OpenAI

python main.py
```

## 🌐 **URLs**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

## 🔑 **Variables de Entorno**

### Backend `.env` (Opcional)
```bash
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key  
AWS_REGION=us-east-1
OPENAI_API_KEY=tu_openai_key
```

**Nota**: Sin estas claves, el sistema funciona con datos simulados.

## 📡 **API Endpoints**

### **Facturas**
- `POST /process-invoice` - Procesar imagen de factura
- `POST /process-text` - Procesar texto libre

### **Stock**
- `GET /api/stock` - Obtener inventario
- `PUT /api/stock` - Actualizar stock con IA

### **Proveedores**
- `GET /api/proveedores` - Lista de proveedores

## 🎯 **Casos de Uso**

### **1. Procesar Factura**
1. Subir imagen de factura
2. IA detecta productos con especificaciones completas
3. Sistema calcula impuestos por proveedor
4. Matching inteligente con stock existente
5. Actualización automática de inventario

### **2. Entrada Manual**
```
"Entraron 10 Twistos Minit Jamón 95G y 5 Coca Cola 2L"
```
IA procesa y actualiza el stock correspondiente.

## 🔬 **Tecnologías**

### **Frontend**
- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes

### **Backend**
- **FastAPI** - API REST
- **OpenAI** - Procesamiento de lenguaje natural
- **AWS Textract** - OCR
- **Pydantic** - Validación de datos

## 🧪 **Testing**

```bash
# Frontend
cd frontend
npm test

# Backend  
cd backend
pytest
```

## 📈 **Roadmap**

- [ ] Autenticación de usuarios
- [ ] Base de datos PostgreSQL
- [ ] Dashboard de analytics
- [ ] Exportación a Excel
- [ ] API de terceros para precios
- [ ] Notificaciones push
- [ ] Modo offline

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 **Licencia**

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

## 📞 **Soporte**

Para soporte técnico, abre un issue en GitHub. 