"use client"

import { useState } from "react"
import { ArrowLeft, Brain, ShoppingCart, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

// Datos de ejemplo de sugerencias IA
const sugerenciasIA = [
  {
    id: 1,
    producto: "Coca-Cola 500ml",
    stockActual: 2,
    cantidadSugerida: 24,
    razon: "Producto más vendido, stock crítico",
    prioridad: "alta",
    precio: 150,
    seleccionado: true,
  },
  {
    id: 2,
    producto: "Pan Lactal",
    stockActual: 5,
    cantidadSugerida: 12,
    razon: "Consumo diario constante",
    prioridad: "media",
    precio: 280,
    seleccionado: true,
  },
  {
    id: 3,
    producto: "Leche Entera 1L",
    stockActual: 1,
    cantidadSugerida: 18,
    razon: "Stock crítico, alta demanda matutina",
    prioridad: "alta",
    precio: 320,
    seleccionado: true,
  },
  {
    id: 4,
    producto: "Agua Mineral 500ml",
    stockActual: 8,
    cantidadSugerida: 36,
    razon: "Temporada calurosa, aumento de ventas",
    prioridad: "media",
    precio: 120,
    seleccionado: false,
  },
  {
    id: 5,
    producto: "Chicles Beldent",
    stockActual: 15,
    cantidadSugerida: 20,
    razon: "Producto impulso, buena rotación",
    prioridad: "baja",
    precio: 80,
    seleccionado: false,
  },
  {
    id: 6,
    producto: "Cigarrillos Marlboro",
    stockActual: 8,
    cantidadSugerida: 15,
    razon: "Reposición regular necesaria",
    prioridad: "media",
    precio: 450,
    seleccionado: true,
  },
]

export default function SugerenciasPedidos() {
  const [productos, setProductos] = useState(sugerenciasIA)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const toggleSeleccion = (id: number) => {
    setProductos(productos.map((p) => (p.id === id ? { ...p, seleccionado: !p.seleccionado } : p)))
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "bg-red-500/20 border-red-500/30 text-red-400"
      case "media":
        return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
      case "baja":
        return "bg-green-500/20 border-green-500/30 text-green-400"
      default:
        return "bg-gray-500/20 border-gray-500/30 text-gray-400"
    }
  }

  const productosSeleccionados = productos.filter((p) => p.seleccionado)
  const totalEstimado = productosSeleccionados.reduce((total, p) => total + p.precio * p.cantidadSugerida, 0)

  const confirmarPedido = () => {
    setMostrarConfirmacion(true)
    setTimeout(() => {
      setMostrarConfirmacion(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Sugerencias IA</h1>
            <p className="text-gray-400 text-sm">Pedidos recomendados para tu negocio</p>
          </div>
        </div>

        {/* Resumen IA */}
        <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border-purple-500/30 shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Análisis inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                • <span className="text-purple-400 font-semibold">3 productos</span> en stock crítico
              </p>
              <p className="text-gray-300">
                • Patrón detectado: <span className="text-blue-400 font-semibold">Mayor demanda de bebidas</span>
              </p>
              <p className="text-gray-300">
                • Recomendación: <span className="text-green-400 font-semibold">Pedido urgente sugerido</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de productos sugeridos */}
        <div className="space-y-3">
          {productos.map((producto) => (
            <Card key={producto.id} className="bg-white/5 backdrop-blur-xl border-white/10 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={producto.seleccionado}
                    onCheckedChange={() => toggleSeleccion(producto.id)}
                    className="mt-1 border-white/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-medium text-sm">{producto.producto}</h3>
                        <p className="text-gray-400 text-xs">Stock actual: {producto.stockActual}</p>
                      </div>
                      <Badge className={`${getPrioridadColor(producto.prioridad)} text-xs`}>{producto.prioridad}</Badge>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-300 text-xs">Cantidad sugerida:</span>
                        <span className="text-white font-bold text-lg">{producto.cantidadSugerida}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-xs">Costo estimado:</span>
                        <span className="text-green-400 font-semibold text-sm">
                          ${(producto.precio * producto.cantidadSugerida).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-blue-400" />
                      <p className="text-blue-400 text-xs">{producto.razon}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumen del pedido */}
        {productosSeleccionados.length > 0 && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl sticky bottom-4">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Productos seleccionados:</span>
                  <span className="text-white font-bold">{productosSeleccionados.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total estimado:</span>
                  <span className="text-green-400 font-bold text-lg">${totalEstimado.toLocaleString()}</span>
                </div>
                <Button
                  onClick={confirmarPedido}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white h-12 font-semibold"
                  disabled={productosSeleccionados.length === 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Confirmar pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmación */}
        {mostrarConfirmacion && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="bg-green-600/90 backdrop-blur-xl border-green-500/30 shadow-2xl mx-4 max-w-sm">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-white mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">¡Pedido confirmado!</h3>
                <p className="text-green-100 text-sm">
                  Tu pedido ha sido registrado. Próximamente podrás enviarlo directamente a tus proveedores.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
