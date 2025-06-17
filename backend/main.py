from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import boto3
from botocore.exceptions import ClientError
import json
import base64
from typing import List, Dict, Any
import os
from pydantic import BaseModel
import openai
from dotenv import load_dotenv
import re
from datetime import datetime
import tempfile
import shutil

# Cargar variables de entorno
load_dotenv()

app = FastAPI(title="StockAI Backend", description="Backend for stock management with OCR capabilities", version="1.0.0")

# Configuración CORS para production
allowed_origins = [
    "http://localhost:3000",  # Desarrollo local
    "https://*.vercel.app",   # Todas las URLs de Vercel
    "https://stockai*.vercel.app",  # Tu dominio específico
]

# Permitir dominio personalizado de Vercel si está configurado
vercel_url = os.getenv("VERCEL_URL")
if vercel_url:
    allowed_origins.append(f"https://{vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Verificar variables de entorno
aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print(f"AWS_ACCESS_KEY_ID: {'Configured' if aws_access_key else 'Missing'}")
print(f"AWS_SECRET_ACCESS_KEY: {'Configured' if aws_secret_key else 'Missing'}")
print(f"OPENAI_API_KEY: {'Configured' if OPENAI_API_KEY else 'Missing'}")

# Configuración de AWS Textract (solo si las credenciales están disponibles)
textract_client = None
if aws_access_key and aws_secret_key:
    textract_client = boto3.client(
        'textract',
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key
    )

# Configuración de OpenAI (solo si la API key está disponible)
openai_client = openai.OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Definir modelos primero
class Proveedor(BaseModel):
    id: int
    nombre: str
    impuesto: float
    telefono: str
    cuit: str = None
    email: str = None
    direccion: str = None

class ProductoStock(BaseModel):
    id: int
    nombre: str
    stock: int
    stock_minimo: int
    precio_base: float
    categoria: str
    codigo: str
    proveedor_id: int
    ultima_actualizacion: str

class ProductDetected(BaseModel):
    nombre: str
    cantidad: int
    precio_sin_impuestos: float = None
    precio_con_impuestos: float = None
    confianza: float

class ResumenFactura(BaseModel):
    subtotal: float
    impuestos: float
    total: float

class OCRResponse(BaseModel):
    productos: List[ProductDetected]
    proveedor: Proveedor = None
    resumen: ResumenFactura = None
    texto_completo: str
    success: bool

# Funciones para manejar datos JSON
def cargar_proveedores() -> List[Proveedor]:
    try:
        with open('data/proveedores.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return [Proveedor(**item) for item in data]
    except FileNotFoundError:
        return []

def cargar_stock() -> List[ProductoStock]:
    try:
        with open('data/stock.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return [ProductoStock(**item) for item in data]
    except FileNotFoundError:
        return []

def guardar_stock(productos: List[ProductoStock]):
    try:
        data = [producto.model_dump() for producto in productos]
        with open('data/stock.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error guardando stock: {e}")

def detectar_proveedor(texto_factura: str) -> Proveedor:
    """Detecta el proveedor basado en el texto de la factura con búsqueda flexible"""
    proveedores = cargar_proveedores()
    texto_lower = texto_factura.lower()
    
    print(f"🔍 Detectando proveedor en texto: '{texto_factura}'")
    print(f"📋 Proveedores disponibles: {[p.nombre for p in proveedores]}")
    
    # Mapeo específico para cada proveedor
    mapeos_proveedores = {
        "HIF HIH Distribuciones": [
            "h&h", "hih", "hif", "hyf", "h & h", "distribuciones",
            "h&h distribuciones", "hif hih", "distribuciones h&h"
        ],
        "SMALL TASTES": [
            "small", "tastes", "small tastes"
        ],
        "Coca-Cola FEMSA": [
            "coca", "cola", "coca-cola", "femsa", "coca cola"
        ],
        "Distribuidora Central": [
            "central", "distribuidora", "dist central", "distribuidora central"
        ]
    }
    
    # 1. Buscar coincidencias directas por nombre completo
    for proveedor in proveedores:
        if proveedor.nombre.lower() in texto_lower:
            print(f"✅ Proveedor encontrado por nombre completo: {proveedor.nombre}")
            return proveedor
        
        # Buscar por CUIT si está disponible
        if proveedor.cuit and proveedor.cuit in texto_factura:
            print(f"✅ Proveedor encontrado por CUIT: {proveedor.nombre}")
            return proveedor
    
    # 2. Buscar usando mapeos específicos
    mejor_coincidencia = None
    mejor_score = 0
    
    for proveedor in proveedores:
        palabras_clave = mapeos_proveedores.get(proveedor.nombre, [])
        score = 0
        coincidencias_encontradas = []
        
        for palabra_clave in palabras_clave:
            if palabra_clave.lower() in texto_lower:
                score += len(palabra_clave)  # Dar más peso a palabras más largas
                coincidencias_encontradas.append(palabra_clave)
        
        print(f"🎯 {proveedor.nombre}: score={score}, coincidencias={coincidencias_encontradas}")
        
        if score > mejor_score:
            mejor_score = score
            mejor_coincidencia = proveedor
    
    if mejor_coincidencia and mejor_score > 0:
        print(f"✅ Proveedor encontrado por mapeo: {mejor_coincidencia.nombre} (score: {mejor_score})")
        return mejor_coincidencia
    
    # 3. Búsqueda fuzzy por palabras individuales
    for proveedor in proveedores:
        palabras_proveedor = proveedor.nombre.lower().split()
        palabras_texto = texto_lower.split()
        
        coincidencias = 0
        for palabra_prov in palabras_proveedor:
            if len(palabra_prov) > 2:  # Ignorar palabras muy cortas
                for palabra_texto in palabras_texto:
                    # Verificar si las palabras son similares
                    if (palabra_prov in palabra_texto or palabra_texto in palabra_prov or
                        abs(len(palabra_prov) - len(palabra_texto)) <= 2):
                        coincidencias += 1
                        break
        
        print(f"🔤 {proveedor.nombre}: {coincidencias} coincidencias de palabra")
        
        if coincidencias >= 1:
            print(f"✅ Proveedor encontrado por coincidencia de palabras: {proveedor.nombre}")
            return proveedor
    
    print(f"❌ No se encontró proveedor específico. Usando fallback: {proveedores[0].nombre if proveedores else 'None'}")
    # Si no se encuentra, devolver el primero como fallback
    return proveedores[0] if proveedores else None

@app.get("/")
async def root():
    return {"message": "StockAI Backend is running"}

@app.post("/process-invoice", response_model=OCRResponse)
async def process_invoice(file: UploadFile = File(...)):
    """
    Procesa una imagen de factura usando Amazon Textract
    """
    try:
        # Validar tipo de archivo
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
        # Verificar si AWS Textract está configurado
        if not textract_client:
            # Si no hay credenciales de AWS, usar datos simulados
            texto_completo = "FACTURA SIMULADA\nCoca-Cola 2L - 2 unidades - $450 c/u\nPan Lactal - 1 unidad - $280\nLeche Entera 1L - 3 unidades - $320 c/u\nTOTAL: $1890"
            productos_detectados = procesar_texto_fallback(texto_completo)
            
            return OCRResponse(
                productos=productos_detectados,
                texto_completo=texto_completo + "\n\n[NOTA: Usando datos simulados - Configure AWS Textract para procesamiento real]",
                success=True
            )
        
        # Leer el archivo
        image_bytes = await file.read()
        
        # Procesar con Textract
        try:
            response = textract_client.detect_document_text(
                Document={'Bytes': image_bytes}
            )
        except ClientError as e:
            # Si hay error en Textract, usar fallback
            texto_completo = f"Error en AWS Textract: {str(e)}\nUsando datos simulados..."
            productos_detectados = procesar_texto_fallback(texto_completo)
            return OCRResponse(
                productos=productos_detectados,
                texto_completo=texto_completo,
                success=True
            )
        
        # Extraer texto de la respuesta
        texto_completo = ""
        lineas = []
        
        for block in response['Blocks']:
            if block['BlockType'] == 'LINE':
                texto_completo += block['Text'] + "\n"
                lineas.append(block['Text'])
        
        # Detectar proveedor y procesar productos con impuestos
        proveedor_detectado = detectar_proveedor(texto_completo)
        productos_detectados = await procesar_texto_con_openai(texto_completo)
        
        # Calcular impuestos y resumen
        productos_con_impuestos = []
        subtotal = 0
        
        for producto in productos_detectados:
            if producto.precio_sin_impuestos:
                impuesto_porcentaje = proveedor_detectado.impuesto if proveedor_detectado else 21
                precio_con_impuestos = producto.precio_sin_impuestos * (1 + impuesto_porcentaje / 100)
                
                producto.precio_con_impuestos = round(precio_con_impuestos, 2)
                subtotal += producto.precio_sin_impuestos * producto.cantidad
            
            productos_con_impuestos.append(producto)
        
        # Calcular resumen
        impuesto_porcentaje = proveedor_detectado.impuesto if proveedor_detectado else 21
        impuestos_total = subtotal * (impuesto_porcentaje / 100)
        total = subtotal + impuestos_total
        
        resumen = ResumenFactura(
            subtotal=round(subtotal, 2),
            impuestos=round(impuestos_total, 2),
            total=round(total, 2)
        )
        
        return OCRResponse(
            productos=productos_con_impuestos,
            proveedor=proveedor_detectado,
            resumen=resumen,
            texto_completo=texto_completo,
            success=True
        )
        
    except Exception as e:
        # En caso de cualquier error, usar fallback
        texto_fallback = "Error procesando imagen - usando datos simulados\nCoca-Cola 2L - 1 unidad\nPan Lactal - 2 unidades"
        productos_fallback = procesar_texto_fallback(texto_fallback)
        return OCRResponse(
            productos=productos_fallback,
            texto_completo=f"Error: {str(e)}\n{texto_fallback}",
            success=False
        )

async def procesar_texto_con_openai(texto_completo: str) -> List[ProductDetected]:
    """
    Usa OpenAI para procesar el texto extraído de la factura y detectar productos
    """
    # Si OpenAI no está configurado, usar fallback directamente
    if not openai_client:
        print("OpenAI no configurado, usando procesamiento fallback")
        return procesar_texto_fallback(texto_completo)
    
    try:
        # Base de datos de productos conocidos (en producción esto vendría de una BD)
        productos_conocidos = [
            "Coca-Cola 2L", "Pan Lactal", "Leche Entera 1L", "Agua Mineral 500ml",
            "Yogur Ser", "Fideos Matarazzo", "Chicles Beldent", "Cerveza Quilmes",
            "Aceite Natura", "Arroz Gallo", "Azúcar Ledesma", "Cafe La Virginia",
            "Galletas Oreo", "Queso Cremoso", "Manteca La Serenísima", "Tomate Enlatado"
        ]
        
        prompt = f"""
Eres un experto en procesamiento de facturas. Analiza el texto y extrae productos con ESPECIFICACIONES COMPLETAS y PRECIOS.

TEXTO DE LA FACTURA:
{texto_completo}

PRODUCTOS CONOCIDOS EN NUESTRO INVENTARIO:
{', '.join(productos_conocidos)}

INSTRUCCIONES CRÍTICAS PARA ESPECIFICACIONES:
1. INCLUYE SIEMPRE especificaciones de tamaño en el nombre del producto:
   - GRAMAJES: 95G, 40G, 250G, 500G, etc.
   - VOLÚMENES: 200ML, 500ML, 1L, 2L, etc.
   - PRESENTACIONES: MINIT, GRANDE, CHICO, etc.
   - SABORES: JAMON, QUESO, FRUTILLA, LIMA, etc.

2. EJEMPLOS DE NOMBRES CORRECTOS:
   - "TWISTOS MINIT JAMON 95G" (NO "TWISTOS MINIT JAMON")
   - "COCA COLA 500ML" (NO "COCA COLA")
   - "YOGUR SER 150G FRUTILLA" (NO "YOGUR SER")
   - "SPRITE LIMA 2L" (NO "SPRITE LIMA")

3. PROCESAMIENTO DE PRECIOS:
   - Busca valores monetarios ($, pesos, decimales)
   - Si hay precio total, divídelo por cantidad
   - Devuelve precio unitario SIN impuestos
   - Formatos: "$1,250.50", "1250,50", "1.250,50"

4. PATRONES DE PRODUCTOS A BUSCAR:
   - "300063098 TWISTOS MINIT JAMON 95GX30X1 2.00 $1849.96"
   - "CÓDIGO PRODUCTO ESPECIFICACION CANTIDAD PRECIO"
   - "Marca Producto Tamaño cantidad precio"

FORMATO DE RESPUESTA (JSON):
{{
    "productos": [
        {{
            "nombre": "MARCA PRODUCTO ESPECIFICACION_COMPLETA",
            "cantidad": numero_entero_exacto,
            "precio_sin_impuestos": precio_unitario_sin_impuestos,
            "confianza": porcentaje_de_confianza_0_a_100
        }}
    ]
}}

REGLAS IMPORTANTES:
- SIEMPRE incluye gramajes (G) y volúmenes (ML/L) en el nombre
- NO omitas especificaciones de tamaño (95G, 40G, 500ML, etc.)
- Cada especificación diferente es un producto diferente
- Mapea a productos conocidos pero mantén especificaciones

Responde SOLO con el JSON válido, sin explicaciones adicionales.
"""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un asistente experto en procesamiento de facturas. Respondes solo con JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=1000
        )
        
        # Extraer y parsear la respuesta
        content = response.choices[0].message.content.strip()
        
        # Limpiar la respuesta si tiene marcadores de código
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        
        # Parsear JSON
        result = json.loads(content)
        
        # Convertir a objetos ProductDetected
        productos = []
        for item in result.get('productos', []):
            # Mejorar el procesamiento de precios sin impuestos
            precio_raw = item.get('precio_sin_impuestos') or item.get('precio')  # fallback para compatibilidad
            precio_procesado = None
            
            if precio_raw is not None:
                try:
                    # Limpiar el precio: remover símbolos y normalizar decimales
                    precio_str = str(precio_raw)
                    # Remover símbolos como $, espacios
                    precio_str = precio_str.replace('$', '').replace(' ', '')
                    # Normalizar decimales (convertir comas a puntos)
                    precio_str = precio_str.replace(',', '.')
                    precio_procesado = float(precio_str)
                except (ValueError, TypeError):
                    precio_procesado = None
            
            productos.append(ProductDetected(
                nombre=item['nombre'],
                cantidad=item['cantidad'],
                precio_sin_impuestos=precio_procesado,
                confianza=item['confianza']
            ))
        
        return productos
        
    except Exception as e:
        print(f"Error en OpenAI: {e}")
        # Fallback a procesamiento básico
        return procesar_texto_fallback(texto_completo)

def procesar_texto_fallback(texto: str) -> List[ProductDetected]:
    """
    Procesamiento fallback sin IA para cuando OpenAI no esté disponible
    """
    productos = []
    
    productos_conocidos = {
        "coca": {"nombre": "Coca-Cola 2L", "precio": 450},
        "pan": {"nombre": "Pan Lactal", "precio": 280},
        "leche": {"nombre": "Leche Entera 1L", "precio": 320},
        "agua": {"nombre": "Agua Mineral 500ml", "precio": 120},
        "yogur": {"nombre": "Yogur Ser", "precio": 150},
        "fideos": {"nombre": "Fideos Matarazzo", "precio": 200},
    }
    
    lineas = texto.split('\n')
    for linea in lineas:
        linea_lower = linea.lower()
        
        for palabra_clave, producto_info in productos_conocidos.items():
            if palabra_clave in linea_lower:
                # Extraer cantidad
                numeros = re.findall(r'\d+', linea)
                cantidad = int(numeros[0]) if numeros else 1
                
                productos.append(ProductDetected(
                    nombre=producto_info["nombre"],
                    cantidad=cantidad,
                    precio_sin_impuestos=producto_info["precio"],
                    confianza=85.0
                ))
                break
    
    return productos

class TextInput(BaseModel):
    texto: str
    productos_actuales: List[dict] = []

@app.post("/process-text")
async def process_text(input_data: TextInput):
    """
    Procesa texto libre para detectar productos y cantidades usando matching inteligente con OpenAI
    """
    try:
        # Cargar productos actuales del stock si no se proporcionaron
        productos_actuales = input_data.productos_actuales
        if not productos_actuales:
            stock_actual = cargar_stock()
            productos_actuales = [producto.model_dump() for producto in stock_actual]
        
        # Procesar con matching inteligente usando OpenAI
        resultado_matching = await procesar_texto_con_matching_inteligente(
            input_data.texto, 
            productos_actuales
        )
        
        # Detectar proveedor usando el resultado de OpenAI si está disponible
        proveedor_detectado = None
        if resultado_matching.get("proveedor_detectado"):
            # Buscar el proveedor por nombre exacto
            proveedores = cargar_proveedores()
            for prov in proveedores:
                if prov.nombre == resultado_matching["proveedor_detectado"]:
                    proveedor_detectado = prov
                    print(f"✅ Proveedor detectado por OpenAI: {prov.nombre}")
                    break
        
        # Si OpenAI no detectó proveedor, usar la función fallback
        if not proveedor_detectado:
            proveedor_detectado = detectar_proveedor(input_data.texto)
            print(f"🔄 Usando detección fallback de proveedor: {proveedor_detectado.nombre if proveedor_detectado else 'None'}")
        
        # Calcular impuestos para productos con precio
        productos_con_impuestos = []
        subtotal = 0
        
        for producto_info in resultado_matching["productos"]:
            if producto_info.get("precio_sin_impuestos"):
                impuesto_porcentaje = proveedor_detectado.impuesto if proveedor_detectado else 21
                precio_con_impuestos = producto_info["precio_sin_impuestos"] * (1 + impuesto_porcentaje / 100)
                producto_info["precio_con_impuestos"] = round(precio_con_impuestos, 2)
                subtotal += producto_info["precio_sin_impuestos"] * producto_info["cantidad"]
            
            productos_con_impuestos.append(producto_info)
        
        # Calcular resumen si hay precios
        resumen = None
        if subtotal > 0:
            impuesto_porcentaje = proveedor_detectado.impuesto if proveedor_detectado else 21
            impuestos_total = subtotal * (impuesto_porcentaje / 100)
            total = subtotal + impuestos_total
            
            resumen = ResumenFactura(
                subtotal=round(subtotal, 2),
                impuestos=round(impuestos_total, 2),
                total=round(total, 2)
            )
        
        return {
            "productos": productos_con_impuestos,
            "proveedor": proveedor_detectado,
            "resumen": resumen,
            "analisis_ia": resultado_matching.get("analisis_ia", ""),
            "texto_procesado": input_data.texto,
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando el texto: {str(e)}")

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...), productos_actuales: str = Form("[]")):
    """
    Procesa un archivo de audio, lo transcribe con Whisper y luego hace matching inteligente
    """
    try:
        # Validar tipo de archivo
        audio_types = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/flac']
        if file.content_type not in audio_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipo de archivo no soportado. Use: {', '.join(audio_types)}"
            )
        
        # Validar tamaño (máximo 25MB como límite de Whisper)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > 25 * 1024 * 1024:  # 25MB
            raise HTTPException(status_code=400, detail="El archivo es muy grande (máximo 25MB)")
        
        # Verificar si OpenAI está configurado
        if not openai_client:
            raise HTTPException(
                status_code=503, 
                detail="OpenAI Whisper no está configurado. Configure OPENAI_API_KEY."
            )
        
        # Parsear productos actuales
        try:
            productos_actuales_list = json.loads(productos_actuales) if productos_actuales != "[]" else []
        except json.JSONDecodeError:
            productos_actuales_list = []
        
        # Cargar productos actuales del stock si no se proporcionaron
        if not productos_actuales_list:
            stock_actual = cargar_stock()
            productos_actuales_list = [producto.model_dump() for producto in stock_actual]
        
        # Crear archivo temporal para Whisper
        temp_file = None
        try:
            # Crear archivo temporal con la extensión correcta
            file_extension = ".mp3"  # Default
            if file.content_type == "audio/wav":
                file_extension = ".wav"
            elif file.content_type == "audio/m4a":
                file_extension = ".m4a"
            elif file.content_type == "audio/webm":
                file_extension = ".webm"
            elif file.content_type == "audio/flac":
                file_extension = ".flac"
            
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
            temp_file.write(content)
            temp_file.close()
            
            # Validar duración mínima del archivo (al menos 1 segundo)
            file_stats = os.stat(temp_file.name)
            if file_stats.st_size < 1000:  # Menos de 1KB probablemente es muy corto
                raise HTTPException(
                    status_code=400,
                    detail="El audio es muy corto. Grabe al menos 1-2 segundos."
                )
            
            # Transcribir con Whisper
            with open(temp_file.name, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="es",  # Especificar español para mejor precisión
                    prompt="Productos, inventario, stock, mercadería, llegaron, entraron, salieron"  # Ayudar con el contexto
                )
            
            texto_transcrito = transcript.text.strip()
            print(f"Audio transcrito: '{texto_transcrito}'")
            
            # Validaciones más estrictas para texto transcrito
            if not texto_transcrito:
                raise HTTPException(
                    status_code=400, 
                    detail="No se detectó ningún audio o el audio está en silencio"
                )
            
            # Verificar que el texto tenga contenido real (no solo ruido)
            if len(texto_transcrito) < 5:
                raise HTTPException(
                    status_code=400,
                    detail="El audio transcrito es muy corto. Hable más claramente."
                )
            
            # Detectar si el texto parece ser ruido o sin sentido
            palabras = texto_transcrito.split()
            if len(palabras) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="No se pudieron detectar palabras claras en el audio"
                )
            
            # Verificar que hay al menos algunas palabras relacionadas con inventario
            palabras_clave_inventario = [
                'producto', 'productos', 'llegaron', 'llegó', 'entraron', 'entró', 
                'salieron', 'salió', 'stock', 'inventario', 'mercadería', 'mercaderia',
                'cantidad', 'unidades', 'cajas', 'latas', 'botellas', 'paquetes',
                'twistos', 'smirnoff', 'coca', 'sprite', 'yogur', 'leche', 'pan'
            ]
            
            texto_lower = texto_transcrito.lower()
            tiene_contexto_inventario = any(palabra in texto_lower for palabra in palabras_clave_inventario)
            
            if not tiene_contexto_inventario and len(palabras) < 4:
                print(f"Texto sin contexto de inventario: '{texto_transcrito}'")
                raise HTTPException(
                    status_code=400,
                    detail=f"El audio no parece contener información sobre productos o inventario. Texto detectado: '{texto_transcrito}'"
                )
            
            # Procesar con matching inteligente usando OpenAI
            resultado_matching = await procesar_texto_con_matching_inteligente(
                texto_transcrito, 
                productos_actuales_list
            )
            
            # Detectar proveedor usando el resultado de OpenAI si está disponible
            proveedor_detectado = None
            if resultado_matching.get("proveedor_detectado"):
                # Buscar el proveedor por nombre exacto
                proveedores = cargar_proveedores()
                for prov in proveedores:
                    if prov.nombre == resultado_matching["proveedor_detectado"]:
                        proveedor_detectado = prov
                        print(f"✅ Proveedor detectado por OpenAI: {prov.nombre}")
                        break
            
            # Si OpenAI no detectó proveedor, usar la función fallback
            if not proveedor_detectado:
                proveedor_detectado = detectar_proveedor(texto_transcrito)
                print(f"🔄 Usando detección fallback de proveedor: {proveedor_detectado.nombre if proveedor_detectado else 'None'}")
            
            # Calcular impuestos para productos con precio
            productos_con_impuestos = []
            subtotal = 0
            
            for producto_info in resultado_matching["productos"]:
                if producto_info.get("precio_sin_impuestos"):
                    impuesto_porcentaje = proveedor_detectado.impuesto if proveedor_detectado else 21
                    precio_con_impuestos = producto_info["precio_sin_impuestos"] * (1 + impuesto_porcentaje / 100)
                    producto_info["precio_con_impuestos"] = round(precio_con_impuestos, 2)
                    subtotal += producto_info["precio_sin_impuestos"] * producto_info["cantidad"]
                
                productos_con_impuestos.append(producto_info)
            
            # Calcular resumen si hay precios
            resumen = None
            if subtotal > 0:
                impuesto_porcentaje = proveedor_detectado.impuesto if proveedor_detectado else 21
                impuestos_total = subtotal * (impuesto_porcentaje / 100)
                total = subtotal + impuestos_total
                
                resumen = ResumenFactura(
                    subtotal=round(subtotal, 2),
                    impuestos=round(impuestos_total, 2),
                    total=round(total, 2)
                )
            
            # Agregar información sobre la transcripción al análisis
            analisis_completo = f"🎙️ Transcripción de audio: \"{texto_transcrito}\"\n\n{resultado_matching.get('analisis_ia', '')}"
            
            return {
                "productos": productos_con_impuestos,
                "proveedor": proveedor_detectado,
                "resumen": resumen,
                "analisis_ia": analisis_completo,
                "texto_transcrito": texto_transcrito,
                "texto_procesado": texto_transcrito,  # Para compatibilidad
                "success": True
            }
            
        finally:
            # Limpiar archivo temporal
            if temp_file and os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
                
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error procesando audio: {e}")
        raise HTTPException(status_code=500, detail=f"Error procesando el audio: {str(e)}")

async def procesar_texto_con_matching_inteligente(texto: str, productos_actuales: List[dict]) -> dict:
    """
    Usa OpenAI para analizar el texto y hacer matching inteligente con productos existentes
    """
    # Validación previa del texto
    if not texto or len(texto.strip()) < 3:
        return {
            "productos": [],
            "analisis_ia": "Error: El texto está vacío o es muy corto para procesar."
        }
    
    # Si OpenAI no está configurado, usar fallback
    if not openai_client:
        print("OpenAI no configurado, usando procesamiento fallback para matching")
        return procesar_matching_fallback(texto, productos_actuales)
    
    try:
        # Preparar lista de productos para el prompt
        productos_inventario = []
        for producto in productos_actuales:
            productos_inventario.append(f"ID: {producto.get('id', 'N/A')} - {producto.get('nombre', 'Sin nombre')} - ${producto.get('precio_base', 0)} - Stock: {producto.get('stock', 0)}")
        
        productos_texto = '\n'.join(productos_inventario[:50])  # Limitar para no exceder tokens
        
        # Obtener lista de proveedores para el prompt
        proveedores = cargar_proveedores()
        proveedores_texto = '\n'.join([f"- {p.nombre}" for p in proveedores])
        
        prompt = f"""
Eres un asistente experto en gestión de inventarios. Analiza el texto de entrada de mercadería y haz matching inteligente con los productos existentes.

TEXTO DE ENTRADA:
{texto}

INVENTARIO ACTUAL:
{productos_texto}

PROVEEDORES REGISTRADOS:
{proveedores_texto}

INSTRUCCIONES:
1. Analiza el texto para identificar:
   - QUE productos llegaron
   - CANTIDADES exactas
   - PROVEEDOR/DISTRIBUIDORA mencionada (ver lista arriba)
   - PRECIOS si se mencionan
   - ACCIÓN (entrada/salida)

2. Para cada producto detectado:
   - Si coincide con un producto existente: usar el ID y nombre exacto del inventario
   - Si es un producto nuevo: marcarlo como "es_nuevo": true
   - Calcular nivel de confianza del matching

3. EJEMPLOS DE MATCHING:
   - Texto: "10 latas de smirnoff manzana" → Buscar productos similares a "Smirnoff", "bebida", "lata", "manzana"
   - Texto: "llegaron fideos" → Buscar "Fideos", "pasta", productos similares
   - Texto: "5 coca cola" → Buscar "Coca", "Coca-Cola", "gaseosa"

4. DETECCIÓN DE PROVEEDOR MUY IMPORTANTE:
   - Si el texto menciona "H&H", "HiH", "H & H", "HIH distribuciones" → Es "HIF HIH Distribuciones"
   - Si menciona "Small Tastes", "Small" → Es "SMALL TASTES"
   - Si menciona "Coca Cola", "Femsa" → Es "Coca-Cola FEMSA"
   - Si menciona "Central", "Distribuidora Central" → Es "Distribuidora Central"
   - IMPORTANTE: En el análisis menciona claramente qué proveedor detectaste

FORMATO DE RESPUESTA (JSON):
{{
    "productos": [
        {{
            "nombre": "Nombre del producto (del inventario si hay match, sino el detectado)",
            "cantidad": numero_entero,
            "precio_sin_impuestos": precio_unitario_o_null,
            "accion": "entrada" o "salida",  
            "confianza": porcentaje_0_a_100,
            "es_nuevo": true_o_false,
            "producto_id": id_del_producto_existente_o_null
        }}
    ],
    "proveedor_detectado": "Nombre exacto del proveedor de la lista o null",
    "analisis_ia": "Explicación detallada de lo que detectaste, incluyendo el proveedor identificado y cómo hiciste el matching"
}}

REGLAS IMPORTANTES:
- SOLO procesa texto que claramente mencione productos o inventario
- SI el texto no tiene sentido o no menciona productos, devuelve lista vacía
- NO inventes productos que no se mencionan claramente
- Sé generoso con el matching SOLO si hay productos realmente mencionados
- Si no estás seguro de qué producto es, indica menor confianza
- La explicación debe ser clara sobre las decisiones tomadas
- SIEMPRE menciona qué proveedor detectaste en el análisis
- Si detectas H&H en cualquier variación, debe ser "HIF HIH Distribuciones"

EJEMPLO DE TEXTOS QUE NO DEBES PROCESAR:
- Ruido sin sentido: "hmm ah eh ok"
- Texto irrelevante: "hola como estas"
- Audio de fondo sin productos mencionados

Responde SOLO con el JSON válido:
"""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto en matching de productos de inventario. Tu trabajo es ser inteligente y flexible para encontrar coincidencias, incluso con nombres similares o sinónimos. Respondes únicamente con JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=2000
        )
        
        # Extraer y parsear la respuesta
        content = response.choices[0].message.content.strip()
        
        # Limpiar la respuesta si tiene marcadores de código
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        
        print(f"Respuesta de OpenAI para matching: {content}")
        
        # Parsear JSON
        result = json.loads(content)
        
        return result
        
    except Exception as e:
        print(f"Error en OpenAI para matching: {e}")
        # Fallback a procesamiento básico
        return procesar_matching_fallback(texto, productos_actuales)

def procesar_matching_fallback(texto: str, productos_actuales: List[dict]) -> dict:
    """
    Procesamiento fallback para matching cuando OpenAI no está disponible
    """
    productos_detectados = []
    texto_lower = texto.lower()
    
    # Validación previa - no procesar texto sin sentido
    if len(texto.strip()) < 5:
        return {
            "productos": [],
            "analisis_ia": f"Análisis fallback: El texto '{texto}' es muy corto para procesar."
        }
    
    # Verificar que el texto tenga al menos una palabra relacionada con inventario
    palabras_inventario = [
        'producto', 'productos', 'llegaron', 'llegó', 'entraron', 'entró', 
        'salieron', 'salió', 'stock', 'inventario', 'mercadería', 'mercaderia',
        'cantidad', 'unidades', 'cajas', 'latas', 'botellas', 'paquetes'
    ]
    
    tiene_contexto = any(palabra in texto_lower for palabra in palabras_inventario)
    if not tiene_contexto:
        return {
            "productos": [],
            "analisis_ia": f"Análisis fallback: El texto '{texto}' no parece contener información sobre productos o inventario."
        }
    
    # Palabras clave para detectar productos comunes
    palabras_clave = {
        "twistos": ["twistos", "twisted", "snack"],
        "smirnoff": ["smirnoff", "smirn", "vodka", "lata"],
        "jamon": ["jamon", "jamón"],
        "queso": ["queso"],
        "grapefruit": ["grapef", "pomelo", "toronja"],
        "lima": ["lima", "lime"],
        "naranja": ["orang", "naranja"],
        "coca": ["coca", "cola"],
        "sprite": ["sprite"],
        "fanta": ["fanta"],
        "yogur": ["yogur", "yogurt"],
        "leche": ["leche"],
        "pan": ["pan", "lactal"],
        "fideos": ["fideos", "pasta", "macarrones"],
        "agua": ["agua"],
        "cerveza": ["cerveza", "quilmes", "brahma"]
    }
    
    # Buscar coincidencias
    for producto_actual in productos_actuales:
        nombre_actual = producto_actual.get('nombre', '').lower()
        
        # Buscar coincidencias directas por palabras clave
        for palabra_base, variantes in palabras_clave.items():
            if any(variante in texto_lower for variante in variantes):
                # Verificar si la palabra clave está en el nombre del producto
                if palabra_base in nombre_actual or any(variante in nombre_actual for variante in variantes):
                    # Extraer cantidad del texto
                    numeros = re.findall(r'\d+', texto)
                    cantidad = int(numeros[0]) if numeros else 1
                    
                    productos_detectados.append({
                        "nombre": producto_actual.get('nombre'),
                        "cantidad": cantidad,
                        "precio_sin_impuestos": producto_actual.get('precio_base'),
                        "accion": "entrada",
                        "confianza": 85,
                        "es_nuevo": False,
                        "producto_id": producto_actual.get('id')
                    })
                    break
        
        # Si ya encontramos un producto, no seguir buscando
        if productos_detectados:
            break
    
    # Si no se encontró nada, crear producto genérico
    if not productos_detectados:
        numeros = re.findall(r'\d+', texto)
        cantidad = int(numeros[0]) if numeros else 1
        
        productos_detectados.append({
            "nombre": "Producto detectado",
            "cantidad": cantidad,
            "precio_sin_impuestos": None,
            "accion": "entrada", 
            "confianza": 60,
            "es_nuevo": True,
            "producto_id": None
        })
    
    return {
        "productos": productos_detectados,
        "analisis_ia": f"Análisis fallback: Procesé el texto '{texto}' y encontré {len(productos_detectados)} coincidencias usando patrones básicos."
    }

async def procesar_factura_especifica(texto_factura: str) -> List[ProductDetected]:
    """
    Procesa específicamente facturas de Coca-Cola para extraer productos, cantidades y precios
    """
    # Si OpenAI no está configurado, usar fallback
    if not openai_client:
        print("OpenAI no configurado, usando procesamiento fallback")
        return procesar_texto_fallback(texto_factura)
    
    try:
        prompt = f"""
Analiza EXHAUSTIVAMENTE esta factura y extrae TODOS los productos vendidos con sus ESPECIFICACIONES COMPLETAS y PRECIOS EXACTOS.

TEXTO DE LA FACTURA:
{texto_factura}

INSTRUCCIONES CRÍTICAS PARA PRODUCTOS:
1. Busca TODAS las líneas de productos e incluye ESPECIFICACIONES COMPLETAS:
   - GRAMAJES: 95G, 40G, 250G, etc.
   - VOLÚMENES: 200ML, 500ML, 1L, 2L, etc.
   - PRESENTACIONES: X6, X12, X24, TETRA, etc.
   - TAMAÑOS: MINIT, GRANDE, CHICO, etc.

2. EJEMPLOS ESPECÍFICOS de lo que debes capturar:
   - "TWISTOS MINIT JAMON 95GX30X1" → "TWISTOS MINIT JAMON 95G"
   - "COCA COLA 500ML X6" → "COCA COLA 500ML"
   - "SPRITE LIMA 2L TETRA" → "SPRITE LIMA 2L"
   - "YOGUR SER 150G FRUTILLA" → "YOGUR SER 150G FRUTILLA"

3. NOMBRES DE PRODUCTOS deben incluir:
   - Marca + Producto + Sabor/Tipo + Tamaño/Volumen
   - NO incluyas códigos SKU al inicio
   - SÍ incluye especificaciones importantes (gramos, ML, sabores)

4. CÁLCULO DE CANTIDADES Y PRECIOS:
   - Cantidad = número exacto de unidades vendidas
   - Precio = precio unitario SIN impuestos (divide precio total ÷ cantidad)
   - Si hay presentaciones múltiples (X6), cuenta unidades individuales

PATRONES ESPECÍFICOS A BUSCAR:
- "300063098 TWISTOS MINIT JAMON 95GX30X1 2.00 Unidades $1849.96" 
  → Producto: "TWISTOS MINIT JAMON 95G", Cantidad: 2, Precio: 924.98
- "300063264 TWISTOS MINIT JAMON 40GX112X1 4.00 Unidades $1609.96"
  → Producto: "TWISTOS MINIT JAMON 40G", Cantidad: 4, Precio: 402.49

FORMATO DE RESPUESTA (JSON):
{{
    "productos": [
        {{
            "nombre": "MARCA PRODUCTO ESPECIFICACION",
            "cantidad": numero_entero_unidades_exactas,
            "precio_sin_impuestos": precio_unitario_sin_impuestos,
            "confianza": 95
        }}
    ]
}}

EJEMPLOS CORRECTOS:
- "TWISTOS MINIT JAMON 95G" (NO "TWISTOS MINIT JAMON")
- "COCA COLA 500ML" (NO "COCA COLA")
- "SPRITE LIMA 2L" (NO "SPRITE LIMA")

CRÍTICO: 
- SIEMPRE incluye gramajes (G) y volúmenes (ML/L) en el nombre
- NUNCA omitas especificaciones de tamaño
- Cada línea de producto debe generar UNA entrada separada
- Busca TODAS las líneas que empiecen con códigos numéricos

Responde SOLO con el JSON válido:
"""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto en análisis exhaustivo de facturas de distribuidoras. Tu trabajo es encontrar TODOS los productos sin excepción. Debes ser meticuloso y no omitir ningún producto. Respondes únicamente con JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=4000
        )
        
        # Extraer y parsear la respuesta
        content = response.choices[0].message.content.strip()
        
        # Limpiar la respuesta si tiene marcadores de código
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        
        print(f"Respuesta de OpenAI: {content}")
        
        # Parsear JSON
        result = json.loads(content)
        
        # Convertir a objetos ProductDetected
        productos = []
        for item in result.get('productos', []):
            # Mejorar el procesamiento de precios sin impuestos
            precio_raw = item.get('precio_sin_impuestos') or item.get('precio', 0)  # fallback para compatibilidad
            precio_procesado = 0
            
            if precio_raw:
                try:
                    # Limpiar el precio: remover símbolos y normalizar decimales
                    precio_str = str(precio_raw)
                    # Remover símbolos como $, espacios
                    precio_str = precio_str.replace('$', '').replace(' ', '')
                    # Normalizar decimales (convertir comas a puntos)
                    precio_str = precio_str.replace(',', '.')
                    precio_procesado = float(precio_str)
                except (ValueError, TypeError):
                    precio_procesado = 0
            
            productos.append(ProductDetected(
                nombre=item['nombre'],
                cantidad=item['cantidad'],
                precio_sin_impuestos=precio_procesado if precio_procesado > 0 else None,
                confianza=item.get('confianza', 95)
            ))
        
        return productos
        
    except Exception as e:
        print(f"Error en OpenAI procesando factura específica: {e}")
        # Fallback a procesamiento básico
        return procesar_texto_fallback(texto_factura)

@app.get("/api/proveedores")
async def get_proveedores():
    """
    Obtiene la lista de proveedores
    """
    try:
        proveedores = cargar_proveedores()
        return {"proveedores": proveedores, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cargando proveedores: {str(e)}")

@app.get("/api/stock")
async def get_stock():
    """
    Obtiene el stock actual
    """
    try:
        stock = cargar_stock()
        proveedores = cargar_proveedores()
        
        # Enriquecer con datos del proveedor y precio con impuestos
        stock_enriquecido = []
        for producto in stock:
            proveedor = next((p for p in proveedores if p.id == producto.proveedor_id), None)
            impuesto = proveedor.impuesto if proveedor else 21
            precio_con_impuestos = producto.precio_base * (1 + impuesto / 100)
            
            producto_dict = producto.model_dump()
            producto_dict['precio_con_impuestos'] = round(precio_con_impuestos, 2)
            producto_dict['proveedor_nombre'] = proveedor.nombre if proveedor else "Desconocido"
            
            stock_enriquecido.append(producto_dict)
        
        return {"stock": stock_enriquecido, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cargando stock: {str(e)}")

class ActualizarStockRequest(BaseModel):
    productos_actualizados: List[dict]

async def procesar_matching_con_openai(productos_detectados: List[dict], stock_actual: List[ProductoStock]) -> dict:
    """
    Usa OpenAI para hacer matching inteligente entre productos detectados y stock existente
    """
    if not openai_client:
        print("OpenAI no configurado, usando matching básico")
        return {"actualizaciones": [], "nuevos": productos_detectados}
    
    try:
        # Preparar listas para el prompt
        productos_detectados_str = "\n".join([
            f"- {p['nombre']} (cantidad: {p['cantidad']}, acción: {p.get('accion', 'entrada')}, precio: {p.get('precio_sin_impuestos', 'N/A')})"
            for p in productos_detectados
        ])
        
        productos_stock_str = "\n".join([
            f"- ID:{p.id} {p.nombre} (stock actual: {p.stock})"
            for p in stock_actual
        ]) if stock_actual else "NO HAY PRODUCTOS EN STOCK"
        
        prompt = f"""
Eres un experto en gestión de inventarios. Tu tarea es hacer MATCHING EXACTO entre productos detectados y productos existentes en stock.

PRODUCTOS DETECTADOS EN LA FACTURA:
{productos_detectados_str}

PRODUCTOS EXISTENTES EN STOCK:
{productos_stock_str}

INSTRUCCIONES CRÍTICAS:
1. Solo considera como COINCIDENCIA EXACTA productos que sean REALMENTE el mismo:
   - "TWISTOS MINIT JAMON 95G" NO es igual a "TWISTOS MINIT QUESO 95G"
   - "COCA COLA 500ML" NO es igual a "COCA COLA 2L"
   - Deben coincidir: marca, producto, sabor/tipo Y tamaño

2. PARA CADA PRODUCTO DETECTADO, determina:
   - Si coincide EXACTAMENTE con algún producto del stock → ACTUALIZAR
   - Si NO coincide exactamente → NUEVO PRODUCTO

3. CRITERIOS DE COINCIDENCIA EXACTA:
   - Mismo nombre de marca (COCA, TWISTOS, etc.)
   - Mismo tipo de producto (COLA, MINIT, etc.)
   - Mismo sabor/variante (JAMON, QUESO, LIMA, etc.)
   - Mismo tamaño (95G, 500ML, 2L, etc.)

FORMATO DE RESPUESTA (JSON):
{{
    "actualizaciones": [
        {{
            "producto_detectado": "nombre_exacto_detectado",
            "stock_id": numero_id_del_stock,
            "stock_nombre": "nombre_en_stock",
            "cantidad": numero_cantidad,
            "accion": "entrada_o_salida"
        }}
    ],
         "nuevos": [
         {{
             "nombre": "nombre_producto_nuevo",
             "cantidad": numero_cantidad,
             "accion": "entrada_o_salida",
             "precio_sin_impuestos": precio_unitario_sin_impuestos_o_null
         }}
     ]
}}

EJEMPLOS DE COINCIDENCIAS VÁLIDAS:
- "TWISTOS MINIT JAMON 95G" = "TWISTOS MINIT JAMON 95G" ✓
- "COCA COLA 500ML" = "COCA-COLA 500ML" ✓

EJEMPLOS DE NO COINCIDENCIAS:
- "TWISTOS MINIT JAMON 95G" ≠ "TWISTOS MINIT QUESO 95G" ✗
- "COCA COLA 500ML" ≠ "COCA COLA 2L" ✗

 Sé ESTRICTO en el matching. Ante la duda, crear NUEVO producto.

IMPORTANTE: CONSERVA SIEMPRE los precios originales de los productos detectados.

Responde SOLO con el JSON válido:
"""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto en matching de productos para inventarios. Debes ser muy preciso y conservador en las coincidencias. Respondes únicamente con JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        
        # Limpiar la respuesta si tiene marcadores de código
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        
        print(f"Respuesta de matching OpenAI: {content}")
        
        # Parsear JSON
        result = json.loads(content)
        return result
        
    except Exception as e:
        print(f"Error en matching con OpenAI: {e}")
        # Fallback: todos los productos como nuevos
        return {"actualizaciones": [], "nuevos": productos_detectados}

@app.put("/api/stock")
async def actualizar_stock(request: ActualizarStockRequest):
    """
    Actualiza el stock con los productos detectados usando matching inteligente con OpenAI
    """
    try:
        stock_actual = cargar_stock()
        productos_actualizados = 0
        productos_nuevos = 0
        productos_con_error = 0
        
        print(f"\n=== ACTUALIZACIÓN DE STOCK CON MATCHING IA ===")
        print(f"Recibidos {len(request.productos_actualizados)} productos para procesar")
        print(f"Stock actual tiene {len(stock_actual)} productos")
        
        # Debug: mostrar productos recibidos con precios
        print("PRODUCTOS RECIBIDOS:")
        for i, p in enumerate(request.productos_actualizados):
            precio = p.get('precio_sin_impuestos', 'NO PRICE')
            print(f"  {i+1}. {p['nombre']} - Cantidad: {p['cantidad']} - Precio: {precio}")
        print("=" * 50)
        
        # Usar OpenAI para hacer matching inteligente
        matching_result = await procesar_matching_con_openai(request.productos_actualizados, stock_actual)
        
        print(f"Matching IA resultado:")
        print(f"- Actualizaciones: {len(matching_result.get('actualizaciones', []))}")
        print(f"- Nuevos: {len(matching_result.get('nuevos', []))}")
        
        # Procesar actualizaciones de productos existentes
        for actualizacion in matching_result.get('actualizaciones', []):
            try:
                stock_id = actualizacion['stock_id']
                cantidad = actualizacion['cantidad']
                accion = actualizacion['accion']
                
                # Encontrar el producto por ID
                for i, producto in enumerate(stock_actual):
                    if producto.id == stock_id:
                        if accion == 'entrada':
                            stock_actual[i].stock += cantidad
                        else:
                            stock_actual[i].stock -= cantidad
                        
                        stock_actual[i].ultima_actualizacion = datetime.now().isoformat()
                        productos_actualizados += 1
                        print(f"Actualizado: {producto.nombre} -> Stock: {stock_actual[i].stock}")
                        break
                        
            except Exception as e:
                print(f"Error procesando actualización: {e}")
                productos_con_error += 1
        
        # Procesar productos nuevos
        for nuevo_producto in matching_result.get('nuevos', []):
            try:
                nuevo_id = max([p.id for p in stock_actual] if stock_actual else [0]) + 1
                precio_base = nuevo_producto.get('precio_sin_impuestos', 0) or 0
                
                producto_nuevo = ProductoStock(
                    id=nuevo_id,
                    nombre=nuevo_producto['nombre'],
                    stock=nuevo_producto['cantidad'] if nuevo_producto['accion'] == 'entrada' else 0,
                    stock_minimo=5,
                    precio_base=precio_base,
                    categoria="Nuevo",
                    codigo=f"AUTO{nuevo_id:03d}",
                    proveedor_id=1,
                    ultima_actualizacion=datetime.now().isoformat()
                )
                
                stock_actual.append(producto_nuevo)
                productos_nuevos += 1
                print(f"Nuevo producto: {producto_nuevo.nombre} -> Stock: {producto_nuevo.stock}")
                
            except Exception as e:
                print(f"Error creando producto nuevo: {e}")
                productos_con_error += 1
        
        # Guardar cambios
        print(f"\nGuardando {len(stock_actual)} productos en stock.json...")
        guardar_stock(stock_actual)
        print(f"Stock guardado correctamente.")
        
        return {
            "message": f"Stock actualizado con IA: {productos_actualizados} actualizados, {productos_nuevos} nuevos, {productos_con_error} errores",
            "productos_actualizados": productos_actualizados,
            "productos_nuevos": productos_nuevos,
            "productos_con_error": productos_con_error,
            "success": True
        }
        
    except Exception as e:
        print(f"Error actualizando stock: {e}")
        raise HTTPException(status_code=500, detail=f"Error actualizando stock: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Endpoint de health check
    """
    return {"status": "healthy", "service": "StockAI Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 