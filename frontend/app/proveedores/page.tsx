"use client"

import { useState } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Phone, Mail, MapPin, Package, Plus } from "lucide-react"

const proveedores = [
  {
    id: 1,
    nombre: "Distribuidora Central",
    contacto: "Juan Pérez",
    telefono: "+54 11 4567-8901",
    email: "juan@distribuidora.com",
    direccion: "Av. Corrientes 1234, CABA",
    productos: ["Bebidas", "Golosinas", "Cigarrillos"],
    ultimoPedido: "2024-01-10",
    estado: "activo",
    descuento: 15,
    plazoEntrega: "24-48hs",
  },
  {
    id: 2,
    nombre: "Lácteos del Sur",
    contacto: "María González",
    telefono: "+54 11 4567-8902",
    email: "maria@lacteossur.com",
    direccion: "Ruta 2 Km 45, La Plata",
    productos: ["Lácteos", "Yogures", "Quesos"],
    ultimoPedido: "2024-01-08",
    estado: "activo",
    descuento: 10,
    plazoEntrega: "48-72hs",
  },
  {
    id: 3,
    nombre: "Panadería Artesanal",
    contacto: "Carlos Rodríguez",
    telefono: "+54 11 4567-8903",
    email: "carlos@panaderia.com",
    direccion: "San Martín 567, San Isidro",
    productos: ["Pan", "Facturas", "Masas"],
    ultimoPedido: "2024-01-12",
    estado: "activo",
    descuento: 5,
    plazoEntrega: "Diario",
  },
  {
    id: 4,
    nombre: "Almacén Mayorista",
    contacto: "Ana López",
    telefono: "+54 11 4567-8904",
    email: "ana@almacen.com",
    direccion: "Av. San Juan 890, CABA",
    productos: ["Fideos", "Arroz", "Conservas", "Aceites"],
    ultimoPedido: "2024-01-05",
    estado: "inactivo",
    descuento: 20,
    plazoEntrega: "72hs",
  },
]

export default function ProveedoresPage() {
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<any>(null)

  const getEstadoColor = (estado: string) => {
    return estado === "activo"
      ? "bg-green-500/20 text-green-600 border-green-500/30"
      : "bg-gray-500/20 text-gray-600 border-gray-500/30"
  }

  const crearPedido = (proveedor: any) => {
    // Aquí se redirigiría a crear un pedido para este proveedor
    console.log("Crear pedido para:", proveedor.nombre)
    alert(`Creando pedido para ${proveedor.nombre}`)
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Proveedores</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Header con botón agregar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Proveedores</h2>
            <p className="text-muted-foreground">Administra tus proveedores y contactos</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Proveedor
          </Button>
        </div>

        {/* Lista de proveedores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {proveedores.map((proveedor) => (
            <Card key={proveedor.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {proveedor.nombre}
                  </CardTitle>
                  <Badge className={getEstadoColor(proveedor.estado)}>{proveedor.estado}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información de contacto */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{proveedor.contacto}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{proveedor.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{proveedor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{proveedor.direccion}</span>
                  </div>
                </div>

                {/* Productos que suministra */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Package className="h-4 w-4" />
                    Productos:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proveedor.productos.map((producto, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {producto}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Información comercial */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Descuento:</span>
                    <div className="font-medium text-green-600">{proveedor.descuento}%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrega:</span>
                    <div className="font-medium">{proveedor.plazoEntrega}</div>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Último pedido:</span>
                  <div className="font-medium">{new Date(proveedor.ultimoPedido).toLocaleDateString()}</div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => crearPedido(proveedor)}
                    disabled={proveedor.estado === "inactivo"}
                  >
                    Crear Pedido
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Ver Historial
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SidebarInset>
  )
}
