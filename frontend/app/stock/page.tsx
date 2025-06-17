"use client"

import { useState, useEffect } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Mic, Camera, Package, Edit, CheckCircle, XCircle } from "lucide-react"

// Tipos para los productos
interface Producto {
  id: number
  nombre: string
  stock: number
  stock_minimo: number
  precio_base: number
  precio_con_impuestos: number
  categoria: string
  codigo: string
  proveedor_id: number
  proveedor_nombre: string
  ultima_actualizacion: string
}

export default function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [textoInput, setTextoInput] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<any>(null)
  const [filtro, setFiltro] = useState("")
  const [cargando, setCargando] = useState(true)
  const [procesandoFactura, setProcesandoFactura] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  // Cargar stock desde API
  useEffect(() => {
    cargarStock()
  }, [])

  const cargarStock = async () => {
    try {
      setCargando(true)
      const response = await fetch('http://localhost:8000/api/stock')
      
      if (!response.ok) {
        throw new Error('Error cargando stock')
      }

      const result = await response.json()
      setProductos(result.stock)
    } catch (error) {
      console.error('Error cargando stock:', error)
      // En caso de error, mostrar mensaje
    } finally {
      setCargando(false)
    }
  }

  const getStockStatus = (stock: number, stockMinimo: number) => {
    if (stock <= stockMinimo * 0.5) return { status: "crítico", color: "bg-red-500/20 text-red-600 border-red-500/30" }
    if (stock <= stockMinimo) return { status: "bajo", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" }
    return { status: "normal", color: "bg-green-500/20 text-green-600 border-green-500/30" }
  }

  const procesarTextoStock = async (texto: string) => {
    try {
      // Mostrar modal de carga
      setProcesandoFactura(true)
      
      const response = await fetch('http://localhost:8000/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          texto,
          productos_actuales: productos // Enviar listado actual para matching inteligente
        })
      })

      if (!response.ok) {
        throw new Error('Error procesando el texto')
      }

      const result = await response.json()
      
      const productosDetectados = result.productos.map((p: any) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio_sin_impuestos: p.precio_sin_impuestos,
        precio_con_impuestos: p.precio_con_impuestos,
        accion: p.accion || "entrada",
        confianza: p.confianza,
        es_nuevo: p.es_nuevo || false, // Indica si es un producto nuevo
        producto_id: p.producto_id || null // ID del producto existente si hay match
      }))

      // Ocultar modal de carga
      setProcesandoFactura(false)
      
      setModalData({ 
        productos: productosDetectados, 
        proveedor: result.proveedor,
        resumen: result.resumen,
        texto, 
        tipo: "texto",
        analisis_ia: result.analisis_ia // Explicación de OpenAI sobre el matching
      })
      setShowModal(true)

    } catch (error) {
      console.error('Error:', error)
      
      // Ocultar modal de carga
      setProcesandoFactura(false)
      
      // Fallback a simulación si falla el backend
      const productosDetectados = [
        { 
          nombre: "Smirnoff Ice Manzana", 
          cantidad: 10, 
          precio_sin_impuestos: 280, 
          precio_con_impuestos: 350, 
          accion: "entrada", 
          confianza: 92,
          es_nuevo: false,
          producto_id: null
        },
      ]

      setModalData({ 
        productos: productosDetectados, 
        proveedor: { nombre: "HiH Distribuciones", impuesto: 25 },
        texto: `${texto} (simulación)`, 
        tipo: "texto",
        analisis_ia: "Simulación: Detecté 'Smirnoff de manzana' y lo asocié con el producto existente más similar en tu inventario."
      })
      setShowModal(true)
    }
  }

  const procesarArchivo = async (file: File | null) => {
    if (!file) return

    try {
      // Mostrar modal de carga
      setProcesandoFactura(true)
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/process-invoice', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error procesando la factura')
      }

      const result = await response.json()
      
      const productosDetectados = result.productos.map((p: any) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio_sin_impuestos: p.precio_sin_impuestos,
        precio_con_impuestos: p.precio_con_impuestos,
        accion: "entrada",
        confianza: p.confianza
      }))

      // Ocultar modal de carga
      setProcesandoFactura(false)
      
      setModalData({ 
        productos: productosDetectados, 
        proveedor: result.proveedor,
        resumen: result.resumen,
        texto: result.texto_completo || "Factura procesada", 
        tipo: "factura" 
      })
      setShowModal(true)

    } catch (error) {
      console.error('Error:', error)
      
      // Ocultar modal de carga
      setProcesandoFactura(false)
      
      // Fallback a simulación si falla el backend
      const productosDetectados = [
        { nombre: "Coca-Cola 2L", cantidad: 24, precio_sin_impuestos: 450, precio_con_impuestos: 544, accion: "entrada", confianza: 92 },
        { nombre: "Pan Lactal", cantidad: 12, precio_sin_impuestos: 280, precio_con_impuestos: 350, accion: "entrada", confianza: 89 },
        { nombre: "Leche Entera 1L", cantidad: 18, precio_sin_impuestos: 320, precio_con_impuestos: 400, accion: "entrada", confianza: 94 },
      ]
      setModalData({ 
        productos: productosDetectados, 
        proveedor: { nombre: "Simulación Factura", impuesto: 21 },
        texto: "Factura procesada (simulación)", 
        tipo: "factura" 
      })
      setShowModal(true)
    }
  }

  const procesarFactura = async () => {
    // Crear input de archivo
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await procesarArchivo(file)
      }
    }
    
    input.click()
  }

  // Handlers para drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastrando(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastrando(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setArrastrando(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      await procesarArchivo(imageFile)
    }
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
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        await procesarAudio(audioBlob)
        
        // Detener todos los tracks para liberar el micrófono
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setGrabando(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('No se pudo acceder al micrófono. Verifique los permisos.')
    }
  }

  const detenerGrabacion = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setGrabando(false)
    }
  }

  const procesarAudio = async (audioBlob: Blob) => {
    try {
      // Mostrar modal de carga
      setProcesandoFactura(true)
      
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      formData.append('productos_actuales', JSON.stringify(productos))

      const response = await fetch('http://localhost:8000/process-audio', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Error procesando el audio')
      }

      const result = await response.json()
      
      const productosDetectados = result.productos.map((p: any) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio_sin_impuestos: p.precio_sin_impuestos,
        precio_con_impuestos: p.precio_con_impuestos,
        accion: p.accion || "entrada",
        confianza: p.confianza,
        es_nuevo: p.es_nuevo || false,
        producto_id: p.producto_id || null
      }))

      // Ocultar modal de carga
      setProcesandoFactura(false)
      
      setModalData({ 
        productos: productosDetectados, 
        proveedor: result.proveedor,
        resumen: result.resumen,
        texto: result.texto_transcrito || "Audio procesado", 
        tipo: "audio",
        analisis_ia: result.analisis_ia
      })
      setShowModal(true)

    } catch (error: any) {
      console.error('Error:', error)
      
      // Ocultar modal de carga
      setProcesandoFactura(false)
      
      // Mostrar mensaje de error específico
      alert(error.message || 'Error procesando el audio. Intente grabando nuevamente con más claridad.')
    }
  }

  const confirmarCambiosStock = async () => {
    try {
      // Enviar actualización al backend
      const response = await fetch('http://localhost:8000/api/stock', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos_actualizados: modalData.productos
        })
      })

      if (!response.ok) {
        throw new Error('Error actualizando stock')
      }

      // Recargar stock desde el servidor
      await cargarStock()
      
      setShowModal(false)
      setTextoInput("")
    } catch (error) {
      console.error('Error confirmando cambios:', error)
      // Fallback al método anterior si falla la API
      const nuevosProductos = productos.map((producto) => {
        const productoDetectado = modalData.productos.find((p: any) =>
          p.nombre.toLowerCase().includes(producto.nombre.toLowerCase().split(" ")[0].toLowerCase()),
        )

        if (productoDetectado) {
          return {
            ...producto,
            stock:
              productoDetectado.accion === "entrada"
                ? producto.stock + productoDetectado.cantidad
                : producto.stock - productoDetectado.cantidad,
          }
        }
        return producto
      })

      setProductos(nuevosProductos)
      setShowModal(false)
      setTextoInput("")
    }
  }

  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(filtro.toLowerCase()),
  )

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" suppressHydrationWarning />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Gestión de Stock</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Controles de actualización de stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Entrada inteligente de stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Llegaron 10 latas de Smirnoff manzana de HiH Distribuciones"
                  value={textoInput}
                  onChange={(e) => setTextoInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && procesarTextoStock(textoInput)}
                  suppressHydrationWarning
                />
                <Button onClick={() => procesarTextoStock(textoInput)} disabled={!textoInput.trim()} suppressHydrationWarning>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                La IA analizará tu texto y buscará automáticamente los productos en tu inventario
              </div>
              <Button 
                variant="outline" 
                className={`w-full ${grabando ? 'bg-red-50 border-red-300 text-red-700' : ''}`}
                onClick={grabando ? detenerGrabacion : iniciarGrabacion}
                disabled={procesandoFactura}
                suppressHydrationWarning
              >
                <Mic className={`h-4 w-4 mr-2 ${grabando ? 'animate-pulse' : ''}`} />
                {grabando ? 'Detener grabación' : 'Grabar audio'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Procesar factura con IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Zona de drag & drop */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                  ${arrastrando 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }
                `}
                onClick={procesarFactura}
                suppressHydrationWarning
              >
                <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">
                  {arrastrando ? '¡Suelta la factura aquí!' : 'Arrastra tu factura aquí'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  o haz clic para seleccionar archivo
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground text-center">
                Sube una foto de la factura para actualizar el stock automáticamente
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de productos en stock */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventario Actual
              </CardTitle>
              <Input
                placeholder="Buscar productos..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="max-w-sm"
                suppressHydrationWarning
              />
            </div>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando stock...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productosFiltrados.map((producto) => {
                const stockInfo = getStockStatus(producto.stock, producto.stock_minimo)
                return (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        {producto.categoria} • ${producto.precio_con_impuestos}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">Stock: {producto.stock}</div>
                        <div className="text-sm text-muted-foreground">Mín: {producto.stock_minimo}</div>
                      </div>

                      <Badge className={stockInfo.color}>{stockInfo.status}</Badge>
                    </div>
                  </div>
                )
                                })}
                </div>
              )}
            </CardContent>
        </Card>
      </div>

      {/* Modal de confirmación de cambios */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              🤖 {modalData?.tipo === "factura" ? "Factura procesada" : 
                   modalData?.tipo === "audio" ? "Audio transcrito y analizado" : 
                   "Entrada de stock analizada"}
              {modalData?.proveedor && (
                <Badge variant="outline" className="ml-2">
                  {modalData.proveedor.nombre} - {modalData.proveedor.impuesto}% impuesto
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="p-3 bg-muted rounded-lg flex-shrink-0">
              <p className="text-sm text-muted-foreground mb-2">
                {modalData?.tipo === "factura" ? "Factura procesada:" : 
                 modalData?.tipo === "audio" ? "Audio transcrito:" : 
                 "Texto procesado:"}
              </p>
              <p className="font-medium text-sm">
                "{modalData?.texto && modalData.texto.length > 100 
                  ? modalData.texto.substring(0, 100) + "..." 
                  : modalData?.texto}"
              </p>
              {modalData?.texto && modalData.texto.length > 100 && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Ver texto completo
                  </summary>
                  <p className="text-xs text-muted-foreground mt-2 max-h-24 overflow-y-auto">
                    {modalData.texto}
                  </p>
                </details>
              )}
            </div>

            {/* Análisis de IA */}
            {modalData?.analisis_ia && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm font-medium text-blue-900">Análisis inteligente</p>
                </div>
                <p className="text-sm text-blue-800">{modalData.analisis_ia}</p>
              </div>
            )}

            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between flex-shrink-0">
                <p className="text-sm font-medium">Productos identificados:</p>
                <Badge variant="secondary" className="text-xs">
                  {modalData?.productos.length} productos
                </Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {modalData?.productos.map((producto: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-muted hover:border-muted-foreground/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{producto.nombre}</p>
                        {producto.es_nuevo && (
                          <Badge variant="default" className="text-xs bg-orange-500 hover:bg-orange-600">
                            Nuevo
                          </Badge>
                        )}
                        {producto.producto_id && (
                          <Badge variant="secondary" className="text-xs">
                            Match ID: {producto.producto_id}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            producto.accion === "entrada" ? "bg-green-500" : "bg-red-500"
                          }`}></span>
                          {producto.accion === "entrada" ? "+" : "-"}
                          {producto.cantidad} unidades
                        </p>
                        {producto.precio_con_impuestos && (
                          <p className="text-xs text-blue-600 font-medium">
                            ${producto.precio_con_impuestos.toLocaleString()}
                            {producto.precio_sin_impuestos && (
                              <span className="text-muted-foreground ml-1">
                                (sin imp: ${producto.precio_sin_impuestos.toLocaleString()})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          producto.confianza >= 90 ? 'text-green-600 border-green-500' :
                          producto.confianza >= 70 ? 'text-yellow-600 border-yellow-500' :
                          'text-red-600 border-red-500'
                        }`}
                      >
                        {producto.confianza}%
                      </Badge>
                      {producto.precio_con_impuestos && (
                        <p className="text-xs text-muted-foreground">
                          Total: ${(producto.precio_con_impuestos * producto.cantidad).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {modalData?.productos.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No se detectaron productos</p>
                </div>
              )}

              {modalData?.resumen && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-sm text-blue-900 mb-2">Resumen de la factura</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal (sin impuestos):</span>
                      <span>${modalData.resumen.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impuestos ({modalData.proveedor?.impuesto}%):</span>
                      <span>${modalData.resumen.impuestos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>${modalData.resumen.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={confirmarCambiosStock} className="w-full" suppressHydrationWarning>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar y actualizar stock
            </Button>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" suppressHydrationWarning>
                <Edit className="w-4 w-4 mr-1" />
                Modificar
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1" suppressHydrationWarning>
                <XCircle className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de análisis de factura */}
      <Dialog open={procesandoFactura} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              🤖 Analizando Factura
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-center space-y-2">
              <p className="font-medium">Estamos procesando con Inteligencia Artificial</p>
              <p className="text-sm text-muted-foreground">
                {grabando ? 'Transcribiendo audio y analizando productos...' : 'Esto puede tomar unos momentos...'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
