"use client"

import { useState, useEffect } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Mic, Scan, Trash2, Plus, Minus, MicOff, Calculator, ShoppingCart, CreditCard } from "lucide-react"

// Productos disponibles (simulando base de datos)
const productosDisponibles = [
  { id: 1, nombre: "Coca-Cola 2L", precio: 450, codigo: "7790895001234", stock: 15 },
  { id: 2, nombre: "Pan Lactal", precio: 280, codigo: "7790895001235", stock: 8 },
  { id: 3, nombre: "Leche Entera 1L", precio: 320, codigo: "7790895001236", stock: 12 },
  { id: 4, nombre: "Agua Mineral 500ml", precio: 120, codigo: "7790895001237", stock: 25 },
  { id: 5, nombre: "Chicles Beldent", precio: 80, codigo: "7790895001238", stock: 30 },
  { id: 6, nombre: "Twistos Jamón 95gr", precio: 180, codigo: "7790895001239", stock: 20 },
  { id: 7, nombre: "Smirnoff Ice Manzana", precio: 350, codigo: "7790895001240", stock: 10 },
]

interface ProductoVenta {
  id: number
  nombre: string
  precio: number
  cantidad: number
  subtotal: number
}

export default function VentasPage() {
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([])
  const [codigoEscaner, setCodigoEscaner] = useState("")
  const [textoInput, setTextoInput] = useState("")
  const [grabando, setGrabando] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [showFinalizarModal, setShowFinalizarModal] = useState(false)
  const [total, setTotal] = useState(0)

  // Calcular total cuando cambian los productos
  useEffect(() => {
    const nuevoTotal = productosVenta.reduce((sum, producto) => sum + producto.subtotal, 0)
    setTotal(nuevoTotal)
  }, [productosVenta])

  // Atajo de teclado F3 para finalizar venta
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault()
        if (productosVenta.length > 0) {
          setShowFinalizarModal(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [productosVenta])

  // Función para agregar producto por código de barras
  const agregarProductoPorCodigo = (codigo: string) => {
    const producto = productosDisponibles.find((p) => p.codigo === codigo)
    if (producto) {
      agregarProducto(producto)
      setCodigoEscaner("")
    }
  }

  // Función para agregar producto a la venta
  const agregarProducto = (producto: any, cantidad = 1) => {
    setProductosVenta((prev) => {
      const existente = prev.find((p) => p.id === producto.id)
      if (existente) {
        return prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + cantidad, subtotal: (p.cantidad + cantidad) * p.precio }
            : p,
        )
      } else {
        return [
          ...prev,
          {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
            subtotal: producto.precio * cantidad,
          },
        ]
      }
    })
  }

  // Función para buscar producto por texto
  const buscarProductoPorTexto = (texto: string) => {
    // Simular búsqueda inteligente con IA
    const textoLower = texto.toLowerCase()

    // Extraer cantidad si existe (ej: "2 twistos")
    const matchCantidad = texto.match(/^(\d+)\s+(.+)/)
    const cantidad = matchCantidad ? Number.parseInt(matchCantidad[1]) : 1
    const nombreBuscar = matchCantidad ? matchCantidad[2] : texto

    // Buscar producto que coincida
    const producto = productosDisponibles.find(
      (p) =>
        p.nombre.toLowerCase().includes(nombreBuscar.toLowerCase()) ||
        nombreBuscar.toLowerCase().includes(p.nombre.toLowerCase().split(" ")[0]),
    )

    if (producto) {
      agregarProducto(producto, cantidad)
      setTextoInput("")
    } else {
      alert(`No se encontró el producto: ${texto}`)
    }
  }

  // Función para cambiar cantidad
  const cambiarCantidad = (id: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(id)
      return
    }

    setProductosVenta((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio } : p)),
    )
  }

  // Función para eliminar producto
  const eliminarProducto = (id: number) => {
    setProductosVenta((prev) => prev.filter((p) => p.id !== id))
  }

  // Función para limpiar venta
  const limpiarVenta = () => {
    setProductosVenta([])
    setCodigoEscaner("")
    setTextoInput("")
  }

  // Funciones para grabación de audio
  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" })
        await procesarAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setGrabando(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("No se pudo acceder al micrófono")
    }
  }

  const detenerGrabacion = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setGrabando(false)
    }
  }

  const procesarAudio = async (audioBlob: Blob) => {
    // Simular procesamiento de audio con IA
    // En producción, esto se enviaría al backend
    setTimeout(() => {
      const textosSimulados = [
        "2 twistos de jamón",
        "1 coca cola de 2 litros",
        "3 chicles beldent",
        "1 smirnoff ice manzana",
      ]
      const textoSimulado = textosSimulados[Math.floor(Math.random() * textosSimulados.length)]
      buscarProductoPorTexto(textoSimulado)
    }, 1500)
  }

  // Función para finalizar venta
  const finalizarVenta = () => {
    // Aquí se procesaría el pago y se actualizaría el stock
    alert(`Venta finalizada por $${total.toLocaleString()}`)
    limpiarVenta()
    setShowFinalizarModal(false)
  }

  return (
    <SidebarInset className="min-h-screen">
      <header className="glass-header flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-6">
          <SidebarTrigger className="-ml-1 hover:glass-button transition-all duration-300 text-gray-300 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-white/10" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-300 font-medium">Sistema de Ventas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-4rem)]">
        {/* Panel Principal - Lista de Productos */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="glass-card flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-gradient flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-emerald-400" />
                Venta Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {productosVenta.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="p-6 bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-xl rounded-2xl border border-gray-500/20">
                      <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">Sin productos</h3>
                      <p className="text-gray-400">Escanea un código o busca productos para comenzar</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {productosVenta.map((producto) => (
                    <div key={producto.id} className="glass rounded-xl p-4 border border-white/10 hover-glow group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg">{producto.nombre}</h3>
                          <p className="text-gray-400">${producto.precio.toLocaleString()} c/u</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="glass-button h-8 w-8 p-0 border-red-500/30 hover:border-red-400 hover:bg-red-500/20"
                              onClick={() => cambiarCantidad(producto.id, producto.cantidad - 1)}
                            >
                              <Minus className="h-3 w-3 text-red-400" />
                            </Button>

                            <span className="text-white font-bold text-lg min-w-[2rem] text-center">
                              {producto.cantidad}
                            </span>

                            <Button
                              size="sm"
                              variant="outline"
                              className="glass-button h-8 w-8 p-0 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20"
                              onClick={() => cambiarCantidad(producto.id, producto.cantidad + 1)}
                            >
                              <Plus className="h-3 w-3 text-emerald-400" />
                            </Button>
                          </div>

                          <div className="text-right min-w-[6rem]">
                            <p className="text-xl font-bold text-gradient">${producto.subtotal.toLocaleString()}</p>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="glass-button border-red-500/30 hover:border-red-400 hover:bg-red-500/20 ml-2"
                            onClick={() => eliminarProducto(producto.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtotal */}
              {productosVenta.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-300">SUBTOTAL:</span>
                    <span className="text-4xl font-bold text-gradient">${total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral - Controles */}
        <div className="space-y-4">
          {/* Escáner */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-gradient-primary flex items-center gap-2 text-lg">
                <Scan className="h-5 w-5" />
                Escáner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Código de barras"
                  value={codigoEscaner}
                  onChange={(e) => setCodigoEscaner(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && agregarProductoPorCodigo(codigoEscaner)}
                  className="glass-input"
                />
                <Button
                  onClick={() => agregarProductoPorCodigo(codigoEscaner)}
                  disabled={!codigoEscaner.trim()}
                  className="glass-button border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/20"
                >
                  <Scan className="h-4 w-4 text-blue-400" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Búsqueda por Texto */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-gradient-accent flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Ej: 2 twistos de jamón"
                value={textoInput}
                onChange={(e) => setTextoInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && buscarProductoPorTexto(textoInput)}
                className="glass-input text-sm"
              />
              <Button
                onClick={() => buscarProductoPorTexto(textoInput)}
                disabled={!textoInput.trim()}
                className="w-full glass-button border-violet-500/30 hover:border-violet-400 hover:bg-violet-500/20"
              >
                Buscar Producto
              </Button>
            </CardContent>
          </Card>

          {/* Audio */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-emerald-300 flex items-center gap-2 text-lg">
                <Mic className="h-5 w-5" />
                Audio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={grabando ? detenerGrabacion : iniciarGrabacion}
                className={`w-full glass-button transition-all duration-300 ${
                  grabando
                    ? "border-red-500/50 hover:border-red-400 bg-red-500/20 animate-pulse"
                    : "border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                {grabando ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2 text-red-400" />
                    Detener
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2 text-emerald-400" />
                    Grabar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={() => setShowFinalizarModal(true)}
                disabled={productosVenta.length === 0}
                className="w-full glass-button border-emerald-500/50 hover:border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Finalizar Venta (F3)
              </Button>

              <Button
                onClick={limpiarVenta}
                disabled={productosVenta.length === 0}
                variant="outline"
                className="w-full glass-button border-red-500/30 hover:border-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                Limpiar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Finalizar Venta */}
      <Dialog open={showFinalizarModal} onOpenChange={setShowFinalizarModal}>
        <DialogContent className="glass-modal max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gradient text-center text-xl">🛒 Finalizar Venta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="glass rounded-xl p-4 border border-white/10">
              <div className="text-center space-y-2">
                <p className="text-gray-400">Total a cobrar:</p>
                <p className="text-4xl font-bold text-gradient">${total.toLocaleString()}</p>
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
              <p>• {productosVenta.length} productos</p>
              <p>• Total de unidades: {productosVenta.reduce((sum, p) => sum + p.cantidad, 0)}</p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={finalizarVenta}
              className="w-full glass-button border-emerald-500/50 hover:border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Confirmar Venta
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFinalizarModal(false)}
              className="w-full glass-button border-gray-500/30 hover:border-gray-400 hover:bg-gray-500/20"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
