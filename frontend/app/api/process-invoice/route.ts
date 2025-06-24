import { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Esquemas de datos
const ProductoDetectado = z.object({
  nombre: z.string().describe('Nombre completo del producto con especificaciones (ej: TWISTOS MINIT JAMON 95G)'),
  cantidad: z.number().describe('Cantidad exacta de unidades'),
  precio_sin_impuestos: z.number().optional().describe('Precio unitario sin impuestos - 0 para productos bonificados'),
  es_bonificacion: z.boolean().default(false).describe('True si el producto es bonificado (gratis)'),
  confianza: z.number().min(0).max(100).describe('Nivel de confianza de la detección')
});

const ProveedorDetectado = z.object({
  nombre: z.string().describe('Nombre del proveedor detectado'),
  cuit: z.string().optional().describe('CUIT del proveedor si está visible'),
  direccion: z.string().optional().describe('Dirección del proveedor si está visible')
});

const ResumenFactura = z.object({
  subtotal: z.number().describe('Subtotal antes de impuestos'),
  impuestos: z.number().describe('Monto total de impuestos'),
  total: z.number().describe('Total final de la factura')
});

const OCRResponse = z.object({
  productos: z.array(ProductoDetectado),
  proveedor: ProveedorDetectado.optional(),
  resumen: ResumenFactura.optional(),
  texto_completo: z.string().describe('Todo el texto visible en la imagen'),
  success: z.boolean()
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 === INICIANDO PROCESAMIENTO DE FACTURA ===');
    
    // Verificación temprana de configuración
    console.log('🔧 === VERIFICACIÓN DE CONFIGURACIÓN ===');
    console.log('🔑 Google API Key:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'CONFIGURADA' : '❌ FALTANTE');
    console.log('🌍 Entorno:', process.env.NODE_ENV);
    console.log('📅 Timestamp:', new Date().toISOString());
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY no está configurada');
      return Response.json({ 
        error: 'Configuración faltante: Google API Key no configurada en variables de entorno',
        success: false 
      }, { status: 500 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📄 Archivo recibido: ${file.name}, tamaño: ${file.size} bytes, tipo: ${file.type}`);

    // Validar tipo de archivo (imágenes y PDFs)
    const tiposPermitidos = ['image/', 'application/pdf'];
    const esArchivoValido = tiposPermitidos.some(tipo => file.type.startsWith(tipo));
    
    if (!esArchivoValido) {
      return Response.json({ 
        error: 'El archivo debe ser una imagen (JPG, PNG, etc.) o un PDF' 
      }, { status: 400 });
    }

    // Convertir archivo a base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type;
    
    // Log del tipo de archivo para debugging
    console.log(`📋 Procesando archivo: ${file.type === 'application/pdf' ? 'PDF' : 'Imagen'}`);
    console.log(`📏 Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

          console.log('🔄 Iniciando análisis con Gemini 2.5 Flash...');
      console.log('🔑 Google API Key disponible:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'SÍ' : 'NO');
      console.log('🔑 Primeros caracteres:', process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10) + '...');

      // Procesar imagen con Gemini 2.5 Flash - Mejor para documentos y más barato
      const result = await generateObject({
        model: google('gemini-2.5-flash'),
      schema: OCRResponse,
      messages: [
        {
          role: 'system',
          content: `Eres un experto en lectura sistemática de facturas argentinas (imágenes y PDFs). DEBES seguir un PROCESO PASO A PASO.

PROVEEDORES COMUNES A DETECTAR:
- HIF HIH Distribuciones (H&H): Snacks, Twistos, golosinas
- SMALL TASTES: Chocolates, dulces, confitería
- Coca-Cola FEMSA: Bebidas, gaseosas
- Distribuidora Central: Productos varios

METODOLOGÍA OBLIGATORIA:

**PASO 1: ESCANEO COMPLETO DE LÍNEAS**
- Localiza la sección de productos (después de datos del cliente)
- Identifica TODAS las líneas que empiecen con códigos: "300063098", "300063097", etc.
- CUENTA las líneas visibles y repórtalas mentalmente

**PASO 2: LECTURA LÍNEA POR LÍNEA** 
Lee cada línea de IZQUIERDA A DERECHA en este orden:
1. Primera línea con código 300063098
2. Segunda línea con código 300063097  
3. Tercera línea con código 300063264
4. Cuarta línea (si existe)
5. Quinta línea (si existe)
6. Sexta línea (si existe)

**PASO 3: EXTRACCIÓN POR LÍNEA**
Para cada línea detectada:
- Código: 300063XXX
- Descripción: (C) TWISTOS MINIT [SABOR] [TAMAÑO]
- Cantidad: X.00 Unidades
- Importe: $XXXX.XX (columna más a la derecha)

**PASO 4: VERIFICACIÓN FINAL**
- ¿Cuántas líneas de productos procesé?
- ¿Coincide con las que vi inicialmente?
- Si faltan líneas, BUSCARLAS de nuevo

**REGLAS DE BONIFICACIÓN:**
- Importe = $0 o celda vacía → es_bonificacion: true, precio_sin_impuestos: 0
- Importe > $0 → es_bonificacion: false, calcular precio

**EJEMPLO DE VERIFICACIÓN:**
"Detecté 6 líneas de productos en total:
1. Código 300063098 - TWISTOS JAMON 95G - 2 unidades - $1493.96
2. Código 300063097 - TWISTOS QUESO 95G - 4 unidades - $0
[continuar con todas...]"

CRITICAL: NO TERMINES hasta procesar TODAS las líneas visibles.`
        },
                  {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'ANALIZA ESTA FACTURA PASO A PASO (imagen o PDF escaneado). Lee TODAS las líneas de productos secuencialmente. No te saltes ninguna línea. Sigue la metodología paso a paso que te indiqué.'
              },
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64}`
            }
          ]
        }
      ],
      temperature: 0.0, // Temperatura mínima para máxima precisión numérica
    });

          console.log('✅ Gemini completó el análisis OCR');
      
      // Procesar datos y aplicar lógica de negocio
      const responseData = result.object;
      
      console.log(`\n📦 === PRODUCTOS DETECTADOS POR GEMINI ===`);
      console.log(`📊 Total productos encontrados: ${responseData.productos.length}`);
      responseData.productos.forEach((producto, index) => {
        console.log(`\n📝 Producto ${index + 1}:`);
        console.log(`   🏷️  Nombre: ${producto.nombre}`);
        console.log(`   🔢 Cantidad: ${producto.cantidad}`);
        console.log(`   💵 Precio sin impuestos: $${producto.precio_sin_impuestos || 0}`);
        console.log(`   🎁 Es bonificación: ${producto.es_bonificacion ? 'SÍ' : 'NO'}`);
        console.log(`   📊 Confianza: ${producto.confianza}%`);
      });
    
          // Cargar proveedores conocidos para matching
      console.log(`\n🏢 === DETECCIÓN DE PROVEEDOR ===`);
      const proveedoresConocidos = await cargarProveedores();
      console.log(`📋 Proveedores conocidos: ${proveedoresConocidos.length}`);
      
      let proveedorFinal = responseData.proveedor;
      
      if (responseData.proveedor?.nombre) {
        console.log(`🔍 Proveedor detectado por Gemini: "${responseData.proveedor.nombre}"`);
        const proveedorMatched = detectarProveedor(responseData.proveedor.nombre, proveedoresConocidos);
        if (proveedorMatched) {
          console.log(`✅ Proveedor matched: "${proveedorMatched.nombre}"`);
          console.log(`📊 Impuesto del proveedor: ${proveedorMatched.impuesto}%`);
          proveedorFinal = proveedorMatched;
        } else {
          console.log(`❌ No se pudo hacer match del proveedor`);
        }
      } else {
        console.log(`⚠️ Gemini no detectó proveedor en la factura`);
        // Si no se detecta proveedor, usar uno por defecto para cálculos
        proveedorFinal = { id: 999, nombre: "Proveedor General", impuesto: 21, telefono: "000000000" } as any;
        console.log(`🔄 Usando proveedor por defecto: ${proveedorFinal?.nombre} (${(proveedorFinal as any)?.impuesto}% IVA)`);
      }

          // Calcular impuestos (siempre, con proveedor detectado o por defecto)
      console.log(`\n💰 === CÁLCULO DE IMPUESTOS ===`);
      console.log(`🏢 Proveedor para cálculos: ${proveedorFinal?.nombre || 'Ninguno'}`);
      
      const productosConImpuestos = responseData.productos.map((producto, index) => {
        console.log(`\n📝 Procesando Producto ${index + 1}: "${producto.nombre}"`);
        
        if (producto.precio_sin_impuestos) {
          const impuestoPorcentaje = (proveedorFinal as any).impuesto || 21;
          const precioConImpuestos = producto.precio_sin_impuestos * (1 + impuestoPorcentaje / 100);
          
          console.log(`   💵 Precio base (sin imp.): $${producto.precio_sin_impuestos}`);
          console.log(`   📊 Impuesto aplicado: ${impuestoPorcentaje}%`);
          console.log(`   💲 Precio final (con imp.): $${precioConImpuestos.toFixed(2)}`);
          console.log(`   🔢 Cantidad: ${producto.cantidad} unidades`);
          console.log(`   💰 Subtotal línea (sin imp.): $${(producto.precio_sin_impuestos * producto.cantidad).toFixed(2)}`);
          console.log(`   💸 Total línea (con imp.): $${(precioConImpuestos * producto.cantidad).toFixed(2)}`);
          
          return {
            ...producto,
            precio_con_impuestos: Math.round(precioConImpuestos * 100) / 100
          };
        } else if (producto.es_bonificacion) {
          console.log(`   🎁 PRODUCTO BONIFICADO - Sin costo`);
          console.log(`   🔢 Cantidad bonificada: ${producto.cantidad} unidades`);
          return producto;
        } else {
          console.log(`   ❓ Sin precio detectado o sin proveedor - No se calculan impuestos`);
          return producto;
        }
      });

    // Calcular resumen si no se detectó
    let resumenFinal = responseData.resumen;
    
    console.log(`\n📊 === CÁLCULO DE RESUMEN FINAL ===`);
    
    if (!resumenFinal && productosConImpuestos.length > 0) {
      console.log(`🧮 Calculando resumen manualmente...`);
      
      const subtotal = productosConImpuestos.reduce((acc, p) => 
        acc + (p.precio_sin_impuestos || 0) * p.cantidad, 0
      );
      const impuestoPorcentaje = (proveedorFinal as any).impuesto || 21;
      const impuestos = subtotal * (impuestoPorcentaje / 100);
      const total = subtotal + impuestos;
      
      console.log(`   📈 Subtotal (sin impuestos): $${subtotal.toFixed(2)}`);
      console.log(`   📊 Impuestos totales (${impuestoPorcentaje}%): $${impuestos.toFixed(2)}`);
      console.log(`   💰 TOTAL FACTURA: $${total.toFixed(2)}`);
      
      resumenFinal = {
        subtotal: Math.round(subtotal * 100) / 100,
        impuestos: Math.round(impuestos * 100) / 100,
        total: Math.round(total * 100) / 100
      };
    } else if (responseData.resumen) {
      console.log(`✨ Gemini detectó resumen automáticamente:`);
      console.log(`   📈 Subtotal: $${responseData.resumen.subtotal}`);
      console.log(`   📊 Impuestos: $${responseData.resumen.impuestos}`);
      console.log(`   💰 Total: $${responseData.resumen.total}`);
    } else {
      console.log(`⚠️ No se pudo calcular resumen (falta proveedor o productos sin precio)`);
    }

    const respuestaFinal = {
      productos: productosConImpuestos,
      proveedor: proveedorFinal,
      resumen: resumenFinal,
      texto_completo: responseData.texto_completo,
      success: true
    };

    console.log(`\n🎉 === RESULTADO FINAL ===`);
    console.log(`✅ Productos procesados: ${respuestaFinal.productos.length}`);
    console.log(`🏢 Proveedor final: ${respuestaFinal.proveedor?.nombre || 'No detectado'}`);
    console.log(`💰 Total de la factura: $${respuestaFinal.resumen?.total || 'No calculado'}`);
    console.log(`📄 Caracteres de texto OCR: ${responseData.texto_completo.length}`);

    return Response.json(respuestaFinal);

  } catch (error) {
    console.error('🚨 ERROR PROCESANDO FACTURA:', error);
    console.error('🔍 Tipo de error:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('📝 Mensaje de error:', error instanceof Error ? error.message : String(error));
    console.error('📊 Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    
    // Verificar variables de entorno
    console.error('🔑 GOOGLE_GENERATIVE_AI_API_KEY presente:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    console.error('🔑 Primeros caracteres de la key:', process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10) + '...');
    
    // Mensaje específico según tipo de archivo
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const esPDF = file?.type === 'application/pdf';
    
    console.error('📄 Tipo de archivo procesado:', file?.type);
    console.error('📏 Tamaño del archivo:', file?.size, 'bytes');
    
    // Fallback con datos simulados y información de debug
    const respuestaFallback = {
      productos: [
        {
          nombre: "🚨 ERROR - Producto simulado",
          cantidad: 1,
          precio_sin_impuestos: 100,
          precio_con_impuestos: 121,
          confianza: 60
        }
      ],
      texto_completo: `🚨 ERROR DETALLADO:
      
Tipo: ${error instanceof Error ? error.constructor.name : typeof error}
Mensaje: ${error instanceof Error ? error.message : String(error)}
Google API Key: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'CONFIGURADA' : 'FALTANTE'}
Archivo: ${file?.type} (${file?.size} bytes)
Entorno: ${process.env.NODE_ENV}
Timestamp: ${new Date().toISOString()}

Stack: ${error instanceof Error ? error.stack : 'No disponible'}

[DATOS SIMULADOS - REVISAR ERROR ARRIBA]`,
      success: false,
      debug: {
        hasApiKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        environment: process.env.NODE_ENV,
        fileType: file?.type,
        fileSize: file?.size,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    };

    return Response.json(respuestaFallback);
  }
}

// Funciones auxiliares (migradas del backend Python)
async function cargarProveedores() {
  try {
    // En producción, esto vendría de una base de datos
    return [
      { id: 1, nombre: "HIF HIH Distribuciones", impuesto: 32, telefono: "123456789", cuit: "20123456789" },
      { id: 2, nombre: "SMALL TASTES", impuesto: 21, telefono: "987654321", cuit: "20987654321" },
      { id: 3, nombre: "Coca-Cola FEMSA", impuesto: 21, telefono: "555123456", cuit: "20555123456" },
      { id: 4, nombre: "Distribuidora Central", impuesto: 21, telefono: "444987654", cuit: "20444987654" }
    ];
  } catch (error) {
    console.error('Error cargando proveedores:', error);
    return [];
  }
}

function detectarProveedor(textoProveedor: string, proveedores: any[]) {
  const texto = textoProveedor.toLowerCase();
  
  // Mapeos específicos para cada proveedor
  const mapeos = {
    "HIF HIH Distribuciones": ["h&h", "hih", "hif", "h & h", "distribuciones", "hih distribuciones"],
    "SMALL TASTES": ["small", "tastes", "small tastes", "golosinas", "dulces"],
    "Coca-Cola FEMSA": ["coca", "cola", "coca-cola", "femsa", "bebidas"],
    "Distribuidora Central": ["central", "distribuidora", "dist central", "mayorista"]
  };
  
  // Buscar coincidencias
  for (const proveedor of proveedores) {
    const palabrasClave = mapeos[proveedor.nombre as keyof typeof mapeos] || [];
    
    // Coincidencia directa
    if (proveedor.nombre.toLowerCase().includes(texto) || texto.includes(proveedor.nombre.toLowerCase())) {
      return proveedor;
    }
    
    // Coincidencia por palabras clave
    for (const palabra of palabrasClave) {
      if (texto.includes(palabra)) {
        return proveedor;
      }
    }
  }
  
  return null;
} 