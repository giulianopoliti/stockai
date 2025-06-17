"use client"

import { useState } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ClipboardList, Plus, Send, Eye, Calendar, DollarSign } from "lucide-react"

const pedidosHistorial = [
  {
    id: 1,
    proveedor: "Distribuidora Central",
    fecha: "2024-01-10",
    estado: "entregado",
    total: 15750,
    productos: 8,
    fechaEntrega: "2024-01-12",
  },
  {
    id: 2,
    proveedor: "Lácteos del Sur",
    fecha: "2024-01-08",
    estado: "pendiente",
    total: 8900,
    productos: 5,
    fechaEntrega: "2024-01-15",
  },
  {
    id: 3,
    proveedor: "Panadería Artesanal",
    fecha: "2024-01-12",
    estado: "enviado",
    total: 2400,
    productos: 12,
    fechaEntrega: "2024-01-13",
  },
]

const sugerenciasIA = [
  {
    proveedor: "Distribuidora Central",
    productos: [
      { nombre: "Coca-Cola 2L", cantidad: 24, precio: 380, urgencia: "alta" },
      { nombre: "Chicles Beldent", cantidad: 50, precio: 65, urgencia: "media" },
    ],
    total: 12370,
    razon: "Stock crítico detectado",
  },
  {
    proveedor: "Lácteos del Sur",
    productos: [
      { nombre: "Yogur Ser", cantidad: 20, precio: 120, urgencia: "alta" },
      { nombre: "Leche Entera 1L", cantidad: 18, precio: 280, urgencia: "alta" },
    ],
    total: 7440,
    razon: "Productos lácteos con alta rotación",
  },
]

export default function PedidosPage() {
  const [vistaActual, setVistaActual] = useState<"historial" | "sugerencias" | "nuevo">("sugerencias")

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "entregado":
        return "bg-green-500/20 text-green-600 border-green-500/30"
      case "enviado":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30"
      case "pendiente":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30"
    }
  }

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case "alta":
        return "bg-red-500/20 text-red-600 border-red-500/30"
      case "media":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
      case "baja":
        return "bg-green-500/20 text-green-600 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30"
    }
  }

  const crearPedidoSugerido = (sugerencia: any) => {
    alert(`Creando pedido para ${sugerencia.proveedor} por $${sugerencia.total.toLocaleString()}`)
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
                <BreadcrumbPage>Gestión de Pedidos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Navegación de pestañas */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={vistaActual === "sugerencias" ? "default" : "outline"}
              onClick={() => setVistaActual("sugerencias")}
            >
              🤖 Sugerencias IA
            </Button>
            <Button
              variant={vistaActual === "historial" ? "default" : "outline"}
              onClick={() => setVistaActual("historial")}
            >
              Historial
            </Button>
            <Button variant={vistaActual === "nuevo" ? "default" : "outline"} onClick={() => setVistaActual("nuevo")}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Pedido
            </Button>
          </div>
        </div>

        {/* Sugerencias IA */}
        {vistaActual === "sugerencias" && (
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">🤖 Pedidos Sugeridos por IA</CardTitle>
                <p className="text-sm text-blue-600">Basado en tu stock actual y patrones de venta</p>
              </CardHeader>
            </Card>

            {sugerenciasIA.map((sugerencia, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{sugerencia.proveedor}</CardTitle>
                    <Badge variant="outline" className="text-blue-600">
                      {sugerencia.razon}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {sugerencia.productos.map((producto, pIndex) => (
                      <div key={pIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{producto.nombre}</div>
                          <div className="text-sm text-muted-foreground">${producto.precio} c/u</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-medium">Cant: {producto.cantidad}</div>
                            <div className="text-sm text-muted-foreground">
                              ${(producto.precio * producto.cantidad).toLocaleString()}
                            </div>
                          </div>
                          <Badge className={getUrgenciaColor(producto.urgencia)}>{producto.urgencia}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-lg font-bold">Total: ${sugerencia.total.toLocaleString()}</div>
                    <Button onClick={() => crearPedidoSugerido(sugerencia)}>
                      <Send className="h-4 w-4 mr-2" />
                      Crear Pedido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Historial de pedidos */}
        {vistaActual === "historial" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Historial de Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pedidosHistorial.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{pedido.proveedor}</div>
                        <div className="text-sm text-muted-foreground">
                          Pedido #{pedido.id} • {pedido.productos} productos
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(pedido.fecha).toLocaleDateString()}
                          </span>
                          <span>Entrega: {new Date(pedido.fechaEntrega).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {pedido.total.toLocaleString()}
                          </div>
                        </div>

                        <Badge className={getEstadoColor(pedido.estado)}>{pedido.estado}</Badge>

                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Nuevo pedido */}
        {vistaActual === "nuevo" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Proveedor</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distribuidora">Distribuidora Central</SelectItem>
                        <SelectItem value="lacteos">Lácteos del Sur</SelectItem>
                        <SelectItem value="panaderia">Panadería Artesanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Fecha de entrega</label>
                    <Input type="date" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notas del pedido</label>
                  <Input placeholder="Observaciones adicionales..." />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">Crear Pedido Manual</Button>
                  <Button variant="outline" className="flex-1">
                    Usar Sugerencias IA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SidebarInset>
  )
}
