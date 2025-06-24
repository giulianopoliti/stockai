import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Interfaz para Proveedor
interface Proveedor {
  id: number;
  nombre: string;
  impuesto: number;
  telefono: string;
  cuit?: string;
  email?: string;
  direccion?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Leer proveedores desde el archivo JSON del backend
    const proveedoresPath = join(process.cwd(), '..', 'backend', 'data', 'proveedores.json');
    
    let proveedores: Proveedor[];
    
    try {
      const proveedoresData = readFileSync(proveedoresPath, 'utf-8');
      proveedores = JSON.parse(proveedoresData);
    } catch (error) {
      // Fallback con proveedores por defecto si no se puede leer el archivo
      console.warn('No se pudo leer proveedores.json, usando datos por defecto:', error);
      proveedores = [
        {
          id: 1,
          nombre: "SMALL TASTES",
          impuesto: 21,
          telefono: "011-4567-8901",
          cuit: "20-12345678-9",
          email: "ventas@smalltastes.com.ar",
          direccion: "Av. Corrientes 1234, CABA"
        },
        {
          id: 2,
          nombre: "HIF HIH Distribuciones",
          impuesto: 32,
          telefono: "2267403230",
          cuit: "33-71167678-9",
          email: "hyfdistribucion@gmail.com",
          direccion: "Av. Victor Hugo y Colectora 3, Buenos Aires"
        },
        {
          id: 3,
          nombre: "Coca-Cola FEMSA",
          impuesto: 21,
          telefono: "0800-222-2652",
          cuit: "30-50000000-1",
          email: "distribuidores@coca-cola.com",
          direccion: "Parque Industrial Norte"
        },
        {
          id: 4,
          nombre: "Distribuidora Central",
          impuesto: 25,
          telefono: "011-5555-1234",
          cuit: "33-11111111-9",
          email: "info@distcentral.com.ar",
          direccion: "Av. San Martín 5678, Quilmes"
        }
      ];
    }

    return Response.json({
      proveedores,
      success: true
    });

  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    return Response.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 