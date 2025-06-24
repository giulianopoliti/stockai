import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Tipos de datos
interface Proveedor {
  id: number;
  nombre: string;
  impuesto: number;
  telefono: string;
  cuit?: string;
  email?: string;
  direccion?: string;
}

interface ProductoStock {
  id: number;
  nombre: string;
  stock: number;
  stock_minimo: number;
  precio_base: number;
  categoria: string;
  codigo: string;
  proveedor_id: number;
  ultima_actualizacion: string;
}

// Rutas de archivos de datos - MIGRADO: Lee desde backend/data/
const BACKEND_DATA_DIR = path.join(process.cwd(), '..', 'backend', 'data');
const STOCK_FILE = path.join(BACKEND_DATA_DIR, 'stock.json');
const PROVEEDORES_FILE = path.join(BACKEND_DATA_DIR, 'proveedores.json');

// Asegurar que el directorio de datos existe
async function ensureDataDirectory() {
  try {
    await fs.access(BACKEND_DATA_DIR);
  } catch {
    await fs.mkdir(BACKEND_DATA_DIR, { recursive: true });
  }
}

// Funciones para cargar datos
async function cargarStock(): Promise<ProductoStock[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(STOCK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No se encontró archivo de stock, creando uno nuevo');
    // Datos iniciales de ejemplo
    const stockInicial: ProductoStock[] = [
      {
        id: 1,
        nombre: "TWISTOS MINIT JAMON 95G",
        stock: 25,
        stock_minimo: 10,
        precio_base: 150,
        categoria: "Snacks",
        codigo: "TWI001",
        proveedor_id: 1,
        ultima_actualizacion: new Date().toISOString()
      },
      {
        id: 2,
        nombre: "SMIRNOFF ICE MANZANA 275ML",
        stock: 12,
        stock_minimo: 5,
        precio_base: 280,
        categoria: "Bebidas",
        codigo: "SMI001",
        proveedor_id: 2,
        ultima_actualizacion: new Date().toISOString()
      },
      {
        id: 3,
        nombre: "COCA-COLA 500ML",
        stock: 30,
        stock_minimo: 15,
        precio_base: 200,
        categoria: "Bebidas",
        codigo: "COC001",
        proveedor_id: 3,
        ultima_actualizacion: new Date().toISOString()
      }
    ];
    await guardarStock(stockInicial);
    return stockInicial;
  }
}

async function cargarProveedores(): Promise<Proveedor[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(PROVEEDORES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No se encontró archivo de proveedores, creando uno nuevo');
    // Datos iniciales de ejemplo
    const proveedoresIniciales: Proveedor[] = [
      {
        id: 1,
        nombre: "HIF HIH Distribuciones",
        impuesto: 25,
        telefono: "123456789",
        cuit: "20123456789",
        email: "contacto@hih.com",
        direccion: "Av. Principal 123"
      },
      {
        id: 2,
        nombre: "SMALL TASTES",
        impuesto: 21,
        telefono: "987654321",
        cuit: "20987654321",
        email: "ventas@smalltastes.com",
        direccion: "Calle Comercio 456"
      },
      {
        id: 3,
        nombre: "Coca-Cola FEMSA",
        impuesto: 21,
        telefono: "555123456",
        cuit: "20555123456",
        email: "distribuidores@cocacola.com",
        direccion: "Zona Industrial 789"
      },
      {
        id: 4,
        nombre: "Distribuidora Central",
        impuesto: 21,
        telefono: "444987654",
        cuit: "20444987654",
        email: "info@distcentral.com",
        direccion: "Centro Logístico 321"
      }
    ];
    await guardarProveedores(proveedoresIniciales);
    return proveedoresIniciales;
  }
}

async function guardarStock(productos: ProductoStock[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await fs.writeFile(STOCK_FILE, JSON.stringify(productos, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error guardando stock:', error);
    throw new Error('No se pudo guardar el stock');
  }
}

async function guardarProveedores(proveedores: Proveedor[]): Promise<void> {
  try {
    await ensureDataDirectory();
    await fs.writeFile(PROVEEDORES_FILE, JSON.stringify(proveedores, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error guardando proveedores:', error);
    throw new Error('No se pudieron guardar los proveedores');
  }
}

// GET - Obtener stock actual
export async function GET() {
  try {
    const stock = await cargarStock();
    const proveedores = await cargarProveedores();
    
    // Enriquecer con datos del proveedor y precio con impuestos
    const stockEnriquecido = stock.map(producto => {
      const proveedor = proveedores.find(p => p.id === producto.proveedor_id);
      const impuesto = proveedor?.impuesto || 21;
      const precioConImpuestos = producto.precio_base * (1 + impuesto / 100);
      
      return {
        ...producto,
        precio_con_impuestos: Math.round(precioConImpuestos * 100) / 100,
        proveedor_nombre: proveedor?.nombre || "Desconocido"
      };
    });
    
    return Response.json({ stock: stockEnriquecido, success: true });
  } catch (error) {
    console.error('Error cargando stock:', error);
    return Response.json({ 
      error: `Error cargando stock: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// PUT - Actualizar stock con matching inteligente
export async function PUT(request: NextRequest) {
  try {
    const { productos_actualizados } = await request.json();
    
    if (!productos_actualizados || !Array.isArray(productos_actualizados)) {
      return Response.json({ 
        error: 'Se requiere un array de productos_actualizados' 
      }, { status: 400 });
    }

    const stockActual = await cargarStock();
    let productosActualizados = 0;
    let productosNuevos = 0;
    let productosConError = 0;

    console.log(`\n=== ACTUALIZACIÓN DE STOCK ===`);
    console.log(`Recibidos ${productos_actualizados.length} productos para procesar`);
    console.log(`Stock actual tiene ${stockActual.length} productos`);

    // Procesar cada producto detectado
    for (const productoDetectado of productos_actualizados) {
      try {
        const { nombre, cantidad, accion = 'entrada', es_nuevo = false, producto_id } = productoDetectado;
        
        if (es_nuevo || !producto_id) {
          // Crear nuevo producto
          const nuevoId = Math.max(...stockActual.map(p => p.id), 0) + 1;
          const precioBase = productoDetectado.precio_sin_impuestos || 0;
          
          const productoNuevo: ProductoStock = {
            id: nuevoId,
            nombre,
            stock: accion === 'entrada' ? cantidad : 0,
            stock_minimo: 5,
            precio_base: precioBase,
            categoria: "Nuevo",
            codigo: `AUTO${nuevoId.toString().padStart(3, '0')}`,
            proveedor_id: 1, // Default al primer proveedor
            ultima_actualizacion: new Date().toISOString()
          };
          
          stockActual.push(productoNuevo);
          productosNuevos++;
          console.log(`Nuevo producto: ${productoNuevo.nombre} -> Stock: ${productoNuevo.stock}`);
        } else {
          // Actualizar producto existente
          const indiceProducto = stockActual.findIndex(p => p.id === producto_id);
          
          if (indiceProducto !== -1) {
            if (accion === 'entrada') {
              stockActual[indiceProducto].stock += cantidad;
            } else {
              stockActual[indiceProducto].stock = Math.max(0, stockActual[indiceProducto].stock - cantidad);
            }
            
            stockActual[indiceProducto].ultima_actualizacion = new Date().toISOString();
            productosActualizados++;
            console.log(`Actualizado: ${stockActual[indiceProducto].nombre} -> Stock: ${stockActual[indiceProducto].stock}`);
          } else {
            console.error(`No se encontró producto con ID: ${producto_id}`);
            productosConError++;
          }
        }
      } catch (error) {
        console.error(`Error procesando producto:`, error);
        productosConError++;
      }
    }

    // Guardar cambios
    await guardarStock(stockActual);
    console.log(`Stock guardado correctamente.`);

    const mensaje = `Stock actualizado: ${productosActualizados} actualizados, ${productosNuevos} nuevos, ${productosConError} errores`;

    return Response.json({
      message: mensaje,
      productos_actualizados: productosActualizados,
      productos_nuevos: productosNuevos,
      productos_con_error: productosConError,
      success: true
    });

  } catch (error) {
    console.error('Error actualizando stock:', error);
    return Response.json({ 
      error: `Error actualizando stock: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 