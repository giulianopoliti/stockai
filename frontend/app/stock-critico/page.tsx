"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ShoppingCart, TrendingDown } from "lucide-react"

const stockCritico = [
  {
    id: 1,
    nombre: "Pan Lactal",
    stock: 3,
    minimo: 12,
    precio: 280,
    categoria: "Panadería",
    ventasDiarias: 8,
    diasRestantes: 0.4,
  },
  {
    id: 2,
    nombre: "Yogur Ser",
    stock: 2,
    minimo: 10,
    precio: 150,
    categoria: "Lácteos",
    ventasDiarias: 5,
    diasRestantes: 0.4,
  },
  {
    id: 3,
    nombre: "Leche Entera 1L",
    stock: 7,
    minimo: 15,
    precio: 320,
    categoria: "Lácteos",
    ventasDiarias: 12,
    diasRestantes: 0.6,
  },
  {
    id: 4,
    nombre: "Cigarrillos Marlboro",
    stock: 4,
    minimo: 12,
    precio: 450,
    categoria: "Cigarrillos",
    ventasDiarias: 6,
    diasRestantes: 0.7,
  },
]

const stockBajo = [
  {
    id: 5,
    nombre: "Coca-Cola 2L",
    stock: 8,
    minimo: 15,
    precio: 450,
    categoria: "Bebidas",
    ventasDiarias: 4,
    diasRestantes: 2,
  },
  {
    id: 6,
    nombre: "Agua Mineral 500ml",
    stock: 18,
    minimo: 25,
    precio: 120,
    categoria: "Bebidas",
    ventasDiarias: 8,
    diasRestantes: 2.3,
  },
]

export default function StockCriticoPage() {
  const generarPedido = (productos: any[]) => {
    const productosParaPedido = productos.map((p) => ({
      ...p,
      cantidadSugerida: Math.max(p.minimo * 2 - p.stock, p.minimo),
    }))

    // Aquí se redirigiría a la página de pedidos con estos productos
    console.log("Generar pedido para:", productosParaPedido)
    alert("Pedido generado automáticamente")
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
                <BreadcrumbPage>Stock Crítico</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-4">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stockCritico.length}</div>
                  <div className="text-sm text-red-600">Productos críticos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stockBajo.length}</div>
                  <div className="text-sm text-yellow-600">Stock bajo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button className="w-full" onClick={() => generarPedido([...stockCritico, ...stockBajo])}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Generar pedido automático
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stock crítico */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Stock Crítico - Acción Inmediata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockCritico.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/30"
                >
                  <div className="flex-1">
                    <div className="font-medium text-red-900">{producto.nombre}</div>
                    <div className="text-sm text-red-700">
                      {producto.categoria} • ${producto.precio}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Se agota en {producto.diasRestantes < 1 ? "menos de 1 día" : `${producto.diasRestantes} días`}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        {producto.stock} / {producto.minimo}
                      </div>
                      <div className="text-xs text-red-500">Venta diaria: {producto.ventasDiarias}</div>
                    </div>

                    <Badge className="bg-red-500/20 text-red-600 border-red-500/30">CRÍTICO</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock bajo */}
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <TrendingDown className="h-5 w-5" />
              Stock Bajo - Planificar Reposición
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockBajo.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50/30"
                >
                  <div className="flex-1">
                    <div className="font-medium text-yellow-900">{producto.nombre}</div>
                    <div className="text-sm text-yellow-700">
                      {producto.categoria} • ${producto.precio}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">Se agota en {producto.diasRestantes} días</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-yellow-600">
                        {producto.stock} / {producto.minimo}
                      </div>
                      <div className="text-xs text-yellow-500">Venta diaria: {producto.ventasDiarias}</div>
                    </div>

                    <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">BAJO</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
