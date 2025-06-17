"use client"

import React from "react"
import { useState } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Mic, Scan, Trash2, Plus, Minus, MicOff, Calculator } from "lucide-react"

// Productos disponibles (simulando base de datos)
const productosDisponibles = [
  { id: 1, nombre: "Coca-Cola 2L", precio: 450, codigo: "7790895001234", stock: 15 },
  { id: 2, nombre: "Pan Lactal", precio: 280, codigo: "7790895001235", stock: 8 },
  { id: 3, nombre: "Leche Entera 1L", precio: 320, codigo: "7790895001236", stock: 12 },
  { id: 4, nombre: "Agua Mineral 500ml", precio: 120, codigo: "7790895001237", stock: 25 },
  { id: 5, nombre: "Chicles Beldent", precio: 80, codigo: "7790895001238", stock: 30 },
]

interface ProductoVenta {
  id: number
  nombre: string
  precio: number
  cantidad: number
  subtotal: number
}

export default function VentasPage() {
  const [ventaActual, setVentaActual] = useState<ProductoVenta[]>([])
  const [codigoInput, setCodigoInput] = useState("")
  const [textoInput, setTextoInput] = useState("")
  const [total, setTotal] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [showVariosModal, setShowVariosModal] = useState(false)
  const [variosData, setVariosData] = useState({ descripcion: "", cantidad: 1, precio: 0 })

  // Simular escáner de código de barras
  const escanearProducto = (codigo: string) => {
    const producto = productosDisponibles.find((p) => p.codigo === codigo)
    if (producto) {
      agregarProducto(producto)
      setCodigoInput("")
    }
  }

  // Agregar producto a la venta
  const agregarProducto = (producto: any, cantidad = 1) => {
    const productoExistente = ventaActual.find((p) => p.id === producto.id)

    if (productoExistente) {
      const nuevaVenta = ventaActual.map((p) =>
        p.id === producto.id
          ? { ...p, cantidad: p.cantidad + cantidad, subtotal: (p.cantidad + cantidad) * p.precio }
          : p,
      )
      setVentaActual(nuevaVenta)
    } else {
      const nuevoProducto: ProductoVenta = {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: cantidad,
        subtotal: producto.precio * cantidad,
      }
      setVentaActual([...ventaActual, nuevoProducto])
    }

    calcularTotal()
  }

  // Procesar texto con IA (simulado)
  const procesarTexto = (texto: string) => {
    if (!texto.trim()) return

    const textoLower = texto.toLowerCase()

    if (textoLower.includes("coca") || textoLower.includes("gaseosa")) {
      const cantidad = extraerCantidad(texto)
      const producto = productosDisponibles.find((p) => p.nombre.toLowerCase().includes("coca"))
      if (producto) agregarProducto(producto, cantidad)
    }

    if (textoLower.includes("pan")) {
      const cantidad = extraerCantidad(texto)
      const producto = productosDisponibles.find((p) => p.nombre.toLowerCase().includes("pan"))
      if (producto) agregarProducto(producto, cantidad)
    }

    setTextoInput("")
  }

  const extraerCantidad = (texto: string): number => {
    const numeros = texto.match(/\d+/)
    return numeros ? Number.parseInt(numeros[0]) : 1
  }

  const modificarCantidad = (id: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(id)
      return
    }

    const nuevaVenta = ventaActual.map((p) =>
      p.id === id ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio } : p,
    )
    setVentaActual(nuevaVenta)
    calcularTotal()
  }

  const eliminarProducto = (id: number) => {
    setVentaActual(ventaActual.filter((p) => p.id !== id))
    calcularTotal()
  }

  const calcularTotal = () => {
    const nuevoTotal = ventaActual.reduce((sum, producto) => sum + producto.subtotal, 0)
    setTotal(nuevoTotal)
  }

  const confirmarVenta = () => {
    if (ventaActual.length === 0) return

    alert(`Venta confirmada por $${total.toLocaleString()}`)
    setVentaActual([])
    setTotal(0)
  }

  const limpiarVenta = () => {
    setVentaActual([])
    setTotal(0)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Aquí iría la lógica real de grabación
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false)
        // Simular resultado de speech-to-text
        procesarTexto("2 cocas de 2 litros")
      }, 3000)
    }
  }

  const agregarVarios = () => {
    if (variosData.descripcion && variosData.precio > 0) {
      const nuevoProducto: ProductoVenta = {
        id: Date.now(), // ID temporal
        nombre: variosData.descripcion,
        precio: variosData.precio,
        cantidad: variosData.cantidad,
        subtotal: variosData.precio * variosData.cantidad,
      }
      setVentaActual([...ventaActual, nuevoProducto])
      setShowVariosModal(false)
      setVariosData({ descripcion: "", cantidad: 1, precio: 0 })
      calcularTotal()
    }
  }

  React.useEffect(() => {
    calcularTotal()
  }, [ventaActual])

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 glass-card border-0 border-b border-white/20">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-white/20" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Punto de Venta</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 gap-6 p-6">
        {/* Panel izquierdo - Controles compactos */}
        <div className="w-80 space-y-4">
          {/* Escáner */}
          <div className="glass-card rounded-2xl p-4 smooth-transition">
            <div className="flex items-center gap-2 mb-3">
              <Scan className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Escáner</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Código de barras"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && escanearProducto(codigoInput)}
                className="glass-input border-0 text-sm h-9"
              />
              <Button onClick={() => escanearProducto(codigoInput)} size="sm" className="glass-button border-0 px-3">
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Entrada por voz/texto */}
          <div className="glass-card rounded-2xl p-4 smooth-transition">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Entrada rápida</span>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: 2 cocas"
                  value={textoInput}
                  onChange={(e) => setTextoInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && procesarTexto(textoInput)}
                  className="glass-input border-0 text-sm h-9"
                />
                <Button onClick={() => procesarTexto(textoInput)} size="sm" className="glass-button border-0 px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={toggleRecording}
                variant="outline"
                size="sm"
                className={`w-full glass-button border-0 h-9 ${isRecording ? "recording bg-red-500/20 text-red-600" : ""}`}
              >
                {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isRecording ? "Grabando..." : "Grabar"}
              </Button>
            </div>
          </div>
        </div>

        {/* Panel derecho - Venta actual (más grande) */}
        <div className="flex-1 space-y-4">
          <div className="glass-card rounded-2xl p-6 h-full smooth-transition">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Venta Actual</h2>
              <Button variant="outline" size="sm" onClick={limpiarVenta} className="glass-button border-0">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>

            {ventaActual.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Scan className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay productos en la venta</p>
                <p className="text-sm">Escanea un código o usa entrada de texto</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {ventaActual.map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between p-4 glass-card rounded-xl smooth-transition hover:scale-[1.02]"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800">{producto.nombre}</div>
                        <div className="text-sm text-slate-600">${producto.precio} c/u</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => modificarCantidad(producto.id, producto.cantidad - 1)}
                            className="glass-button border-0 w-8 h-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-slate-800">{producto.cantidad}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => modificarCantidad(producto.id, producto.cantidad + 1)}
                            className="glass-button border-0 w-8 h-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="w-20 text-right font-bold text-slate-800">
                          ${producto.subtotal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="bg-white/30" />

                <div className="flex justify-between items-center text-2xl font-bold text-slate-800 py-4">
                  <span>Total:</span>
                  <span className="text-green-600">${total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowVariosModal(true)}
                variant="outline"
                className="glass-button border-0 flex-1 h-12"
              >
                <Calculator className="h-4 w-4 mr-2" />
                VARIOS
              </Button>
              <Button
                onClick={confirmarVenta}
                disabled={ventaActual.length === 0}
                className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 font-semibold text-lg"
              >
                Confirmar Venta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal VARIOS */}
      <Dialog open={showVariosModal} onOpenChange={setShowVariosModal}>
        <DialogContent className="glass-card border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Agregar Producto Varios</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Descripción</label>
              <Input
                placeholder="Ej: Producto sin código"
                value={variosData.descripcion}
                onChange={(e) => setVariosData({ ...variosData, descripcion: e.target.value })}
                className="glass-input border-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Cantidad</label>
                <Input
                  type="number"
                  min="1"
                  value={variosData.cantidad}
                  onChange={(e) => setVariosData({ ...variosData, cantidad: Number.parseInt(e.target.value) || 1 })}
                  className="glass-input border-0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Precio unitario</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={variosData.precio || ""}
                  onChange={(e) => setVariosData({ ...variosData, precio: Number.parseFloat(e.target.value) || 0 })}
                  className="glass-input border-0"
                />
              </div>
            </div>

            {variosData.precio > 0 && variosData.cantidad > 0 && (
              <div className="glass-card rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-bold text-lg text-slate-800">
                    ${(variosData.precio * variosData.cantidad).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariosModal(false)} className="glass-button border-0">
              Cancelar
            </Button>
            <Button
              onClick={agregarVarios}
              disabled={!variosData.descripcion || variosData.precio <= 0}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
