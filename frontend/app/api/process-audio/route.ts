import { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import OpenAI from 'openai';
import { z } from 'zod';

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Esquemas para el resultado del procesamiento de audio
const ProductoDetectadoAudio = z.object({
  nombre: z.string().describe('Nombre del producto detectado'),
  cantidad: z.number().describe('Cantidad mencionada'),
  accion: z.enum(['entrada', 'salida']).describe('Si los productos llegaron (entrada) o salieron (salida)'),
  confianza: z.number().min(0).max(100).describe('Nivel de confianza de la detección'),
  es_nuevo: z.boolean().describe('Si es un producto que no está en el inventario actual'),
  producto_id: z.number().optional().describe('ID del producto existente si hay match')
});

const AudioProcessingResponse = z.object({
  productos: z.array(ProductoDetectadoAudio),
  proveedor_detectado: z.string().optional().describe('Nombre del proveedor mencionado'),
  analisis_ia: z.string().describe('Explicación detallada del análisis realizado'),
  texto_transcrito: z.string().describe('Texto exacto transcrito del audio')
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const productosActuales = formData.get('productos_actuales') || '[]';
    
    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validar tipo de archivo de audio
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/flac'];
    if (!audioTypes.includes(audioFile.type)) {
      return Response.json({ 
        error: `Tipo de archivo no soportado. Use: ${audioTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validar tamaño (máximo 25MB para Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return Response.json({ 
        error: 'El archivo es muy grande (máximo 25MB)' 
      }, { status: 400 });
    }

    // Transcribir audio con Whisper
    const transcription = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es', // Español para mejor precisión
      prompt: 'Productos, inventario, stock, mercadería, llegaron, entraron, salieron' // Contexto
    });

    const textoTranscrito = transcription.text.trim();
    console.log('Audio transcrito:', textoTranscrito);

    // Validaciones del texto transcrito
    if (!textoTranscrito || textoTranscrito.length < 5) {
      return Response.json({ 
        error: 'No se detectó ningún audio o el audio está en silencio' 
      }, { status: 400 });
    }

    // Verificar contexto de inventario
    const palabrasInventario = [
      'producto', 'productos', 'llegaron', 'llegó', 'entraron', 'entró',
      'salieron', 'salió', 'stock', 'inventario', 'mercadería', 'mercaderia',
      'cantidad', 'unidades', 'cajas', 'latas', 'botellas', 'paquetes',
      'twistos', 'smirnoff', 'coca', 'sprite', 'yogur', 'leche', 'pan'
    ];

    const textoLower = textoTranscrito.toLowerCase();
    const tieneContextoInventario = palabrasInventario.some(palabra => textoLower.includes(palabra));

    if (!tieneContextoInventario && textoTranscrito.split(' ').length < 4) {
      return Response.json({ 
        error: `El audio no parece contener información sobre productos o inventario. Texto detectado: "${textoTranscrito}"` 
      }, { status: 400 });
    }

    // Parsear productos actuales
    let productosActualesList;
    try {
      productosActualesList = typeof productosActuales === 'string' 
        ? JSON.parse(productosActuales) 
        : [];
    } catch {
      productosActualesList = [];
    }

    // Cargar stock actual si no se proporcionó
    if (productosActualesList.length === 0) {
      productosActualesList = await cargarStockActual();
    }

    // Procesar con matching inteligente usando IA
    const resultado = await procesarTextoConMatchingInteligente(textoTranscrito, productosActualesList);

    // Detectar proveedor
    const proveedores = await cargarProveedores();
    let proveedorDetectado = null;
    
    if (resultado.proveedor_detectado) {
      proveedorDetectado = proveedores.find(p => p.nombre === resultado.proveedor_detectado);
    }

    if (!proveedorDetectado) {
      proveedorDetectado = detectarProveedorEnTexto(textoTranscrito, proveedores);
    }

    // Calcular impuestos para productos con precio
    const productosConImpuestos = resultado.productos.map(producto => {
      if ('precio_sin_impuestos' in producto && producto.precio_sin_impuestos && typeof producto.precio_sin_impuestos === 'number') {
        const impuestoPorcentaje = proveedorDetectado?.impuesto || 21;
        const precioConImpuestos = producto.precio_sin_impuestos * (1 + impuestoPorcentaje / 100);
        return {
          ...producto,
          precio_con_impuestos: Math.round(precioConImpuestos * 100) / 100
        };
      }
      return producto;
    });

    // Calcular resumen si hay precios
    let resumen = null;
    const productosConPrecio = productosConImpuestos.filter(p => 'precio_sin_impuestos' in p && p.precio_sin_impuestos);
    
    if (productosConPrecio.length > 0) {
      const subtotal = productosConPrecio.reduce((acc, p) => 
        acc + ((p as any).precio_sin_impuestos * p.cantidad), 0
      );
      const impuestoPorcentaje = proveedorDetectado?.impuesto || 21;
      const impuestosTotal = subtotal * (impuestoPorcentaje / 100);
      const total = subtotal + impuestosTotal;
      
      resumen = {
        subtotal: Math.round(subtotal * 100) / 100,
        impuestos: Math.round(impuestosTotal * 100) / 100,
        total: Math.round(total * 100) / 100
      };
    }

    const analisisCompleto = `🎙️ Transcripción de audio: "${textoTranscrito}"\n\n${resultado.analisis_ia}`;

    return Response.json({
      productos: productosConImpuestos,
      proveedor: proveedorDetectado,
      resumen,
      analisis_ia: analisisCompleto,
      texto_transcrito: textoTranscrito,
      texto_procesado: textoTranscrito,
      success: true
    });

  } catch (error) {
    console.error('Error procesando audio:', error);
    return Response.json({ 
      error: `Error procesando el audio: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Función para procesar texto con matching inteligente usando IA
async function procesarTextoConMatchingInteligente(texto: string, productosActuales: any[]) {
  try {
    // Preparar lista de productos para el prompt
    const productosInventario = productosActuales.slice(0, 50).map(producto => 
      `ID: ${producto.id || 'N/A'} - ${producto.nombre || 'Sin nombre'} - $${producto.precio_base || 0} - Stock: ${producto.stock || 0}`
    ).join('\n');

    const proveedores = await cargarProveedores();
    const proveedoresTexto = proveedores.map(p => `- ${p.nombre}`).join('\n');

    const result = await generateObject({
      model: openai('gpt-3.5-turbo'),
      schema: z.object({
        productos: z.array(ProductoDetectadoAudio),
        proveedor_detectado: z.string().optional(),
        analisis_ia: z.string()
      }),
      messages: [
        {
          role: 'system',
          content: `Eres un asistente experto en gestión de inventarios. Analiza el texto de entrada de mercadería y haz matching inteligente con los productos existentes.

INSTRUCCIONES:
1. Analiza el texto para identificar:
   - QUE productos llegaron/salieron
   - CANTIDADES exactas
   - PROVEEDOR/DISTRIBUIDORA mencionada
   - ACCIÓN (entrada/salida)

2. Para cada producto detectado:
   - Si coincide con un producto existente: usar el ID y nombre exacto del inventario
   - Si es un producto nuevo: marcarlo como "es_nuevo": true
   - Calcular nivel de confianza del matching

3. DETECCIÓN DE PROVEEDOR MUY IMPORTANTE:
   - Si el texto menciona "H&H", "HiH", "H & H", "HIH distribuciones" → Es "HIF HIH Distribuciones"
   - Si menciona "Small Tastes", "Small" → Es "SMALL TASTES"
   - Si menciona "Coca Cola", "Femsa" → Es "Coca-Cola FEMSA"
   - Si menciona "Central", "Distribuidora Central" → Es "Distribuidora Central"

REGLAS IMPORTANTES:
- SOLO procesa texto que claramente mencione productos o inventario
- NO inventes productos que no se mencionan claramente
- Sé generoso con el matching SOLO si hay productos realmente mencionados`
        },
        {
          role: 'user',
          content: `
TEXTO DE ENTRADA:
${texto}

INVENTARIO ACTUAL:
${productosInventario}

PROVEEDORES REGISTRADOS:
${proveedoresTexto}

Analiza el texto y haz matching inteligente con los productos existentes.`
        }
      ],
      temperature: 0.2
    });

    return result.object;

  } catch (error) {
    console.error('Error en matching inteligente:', error);
    return {
      productos: [],
      analisis_ia: `Error en el análisis: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Funciones auxiliares
async function cargarStockActual() {
  try {
    // En producción, esto vendría de una base de datos
    return [
      { id: 1, nombre: "TWISTOS MINIT JAMON 95G", precio_base: 150, stock: 25 },
      { id: 2, nombre: "SMIRNOFF ICE MANZANA 275ML", precio_base: 280, stock: 12 },
      { id: 3, nombre: "COCA-COLA 500ML", precio_base: 200, stock: 30 },
      { id: 4, nombre: "SPRITE LIMA 2L", precio_base: 350, stock: 8 }
    ];
  } catch (error) {
    console.error('Error cargando stock:', error);
    return [];
  }
}

async function cargarProveedores() {
  try {
    return [
      { id: 1, nombre: "HIF HIH Distribuciones", impuesto: 25, telefono: "123456789", cuit: "20123456789" },
      { id: 2, nombre: "SMALL TASTES", impuesto: 21, telefono: "987654321", cuit: "20987654321" },
      { id: 3, nombre: "Coca-Cola FEMSA", impuesto: 21, telefono: "555123456", cuit: "20555123456" },
      { id: 4, nombre: "Distribuidora Central", impuesto: 21, telefono: "444987654", cuit: "20444987654" }
    ];
  } catch (error) {
    console.error('Error cargando proveedores:', error);
    return [];
  }
}

function detectarProveedorEnTexto(texto: string, proveedores: any[]) {
  const textoLower = texto.toLowerCase();
  
  const mapeos = {
    "HIF HIH Distribuciones": ["h&h", "hih", "hif", "h & h", "distribuciones"],
    "SMALL TASTES": ["small", "tastes", "small tastes"],
    "Coca-Cola FEMSA": ["coca", "cola", "coca-cola", "femsa"],
    "Distribuidora Central": ["central", "distribuidora", "dist central"]
  };
  
  for (const proveedor of proveedores) {
    const palabrasClave = mapeos[proveedor.nombre as keyof typeof mapeos] || [];
    
    for (const palabra of palabrasClave) {
      if (textoLower.includes(palabra)) {
        return proveedor;
      }
    }
  }
  
  return null;
} 