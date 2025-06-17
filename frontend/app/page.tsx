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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, AlertTriangle, Brain, Camera } from "lucide-react"

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

const Index = () => {
  return (
    <SidebarInset className="min-h-screen">
      <header className="glass-header flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-6">
          <SidebarTrigger className="-ml-1 hover:glass-button transition-all duration-300 text-gray-300 hover:text-white" suppressHydrationWarning />
          <Separator orientation="vertical" className="mr-2 h-4 bg-white/10" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-300 font-medium">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">¡Bienvenido a Stock.AI!</h1>
            <p className="text-gray-400 text-lg">Tu sistema de gestión inteligente con IA</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Productos</CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-lg group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300 border border-blue-500/20">
                <Package className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">1,234</div>
              <p className="text-xs text-emerald-400 font-medium">+2.1% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Ventas del Día</CardTitle>
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-lg group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all duration-300 border border-emerald-500/20">
                <ShoppingCart className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">$45,231</div>
              <p className="text-xs text-emerald-400 font-medium">+12.5% desde ayer</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Proveedores Activos</CardTitle>
              <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl rounded-lg group-hover:from-violet-500/30 group-hover:to-purple-500/30 transition-all duration-300 border border-violet-500/20">
                <Users className="h-4 w-4 text-violet-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">42</div>
              <p className="text-xs text-emerald-400 font-medium">+3 nuevos este mes</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Stock Crítico</CardTitle>
              <div className="p-2 bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-lg group-hover:from-red-500/30 group-hover:to-pink-500/30 transition-all duration-300 border border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">23</div>
              <p className="text-xs text-red-400 font-medium">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card hover-lift">
            <CardHeader>
              <CardTitle className="text-gradient flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400" />
                Funciones IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 glass rounded-xl border border-cyan-500/20 hover-glow group">
                <h3 className="font-semibold text-gradient-primary flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4" />
                  Procesamiento de Facturas
                </h3>
                <p className="text-sm text-gray-400">
                  Arrastra fotos de facturas y la IA extrae automáticamente productos, cantidades y precios.
                </p>
              </div>
              
              <div className="p-4 glass rounded-xl border border-violet-500/20 hover-glow group">
                <h3 className="font-semibold text-gradient-accent flex items-center gap-2 mb-3">
                  <Mic className="h-4 w-4" />
                  Entrada por Voz
                </h3>
                <p className="text-sm text-gray-400">
                  Graba audios como "llegaron 10 Smirnoff" y el sistema actualiza el inventario automáticamente.
                </p>
              </div>

              <div className="p-4 glass rounded-xl border border-emerald-500/20 hover-glow group">
                <h3 className="font-semibold text-emerald-300 flex items-center gap-2 mb-3">
                  <Scan className="h-4 w-4" />
                  Matching Inteligente
                </h3>
                <p className="text-sm text-gray-400">
                  La IA identifica productos automáticamente comparando con tu inventario actual.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader>
              <CardTitle className="text-gradient">Accesos Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <a 
                href="/stock" 
                className="flex items-center gap-3 p-4 glass rounded-xl hover:glass-button transition-all duration-300 group hover-glow"
              >
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-lg group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300 border border-blue-500/20">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-gradient-primary transition-all">Gestión de Stock</h3>
                  <p className="text-sm text-gray-400">Actualiza inventario con IA</p>
                </div>
              </a>
              
              <a 
                href="/pedidos" 
                className="flex items-center gap-3 p-4 glass rounded-xl hover:glass-button transition-all duration-300 group hover-glow"
              >
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-lg group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300 border border-green-500/20">
                  <ShoppingCart className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-green-300 transition-all">Gestión de Pedidos</h3>
                  <p className="text-sm text-gray-400">Administra órdenes y entregas</p>
                </div>
              </a>
              
              <a 
                href="/stock-critico" 
                className="flex items-center gap-3 p-4 glass rounded-xl hover:glass-button transition-all duration-300 group hover-glow"
              >
                <div className="p-2 bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-lg group-hover:from-red-500/30 group-hover:to-pink-500/30 transition-all duration-300 border border-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-red-300 transition-all">Stock Crítico</h3>
                  <p className="text-sm text-gray-400">Productos con stock bajo</p>
                </div>
              </a>

              <a 
                href="/proveedores" 
                className="flex items-center gap-3 p-4 glass rounded-xl hover:glass-button transition-all duration-300 group hover-glow"
              >
                <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl rounded-lg group-hover:from-violet-500/30 group-hover:to-purple-500/30 transition-all duration-300 border border-violet-500/20">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-violet-300 transition-all">Proveedores</h3>
                  <p className="text-sm text-gray-400">Gestiona distribuidoras</p>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle className="text-gradient">¿Cómo funciona Stock.AI?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-xl w-16 h-16 flex items-center justify-center mx-auto border border-blue-500/20">
                  <span className="text-2xl font-bold text-gradient-primary">1</span>
                </div>
                <h3 className="font-semibold text-white">Entrada de Datos</h3>
                <p className="text-sm text-gray-400">
                  Escribe, graba audio o sube fotos de facturas. La IA procesa cualquier formato.
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl rounded-xl w-16 h-16 flex items-center justify-center mx-auto border border-violet-500/20">
                  <span className="text-2xl font-bold text-gradient-accent">2</span>
                </div>
                <h3 className="font-semibold text-white">Análisis Inteligente</h3>
                <p className="text-sm text-gray-400">
                  OpenAI analiza el contenido y hace matching automático con tu inventario existente.
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-xl w-16 h-16 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <span className="text-2xl font-bold text-emerald-300">3</span>
                </div>
                <h3 className="font-semibold text-white">Actualización Automática</h3>
                <p className="text-sm text-gray-400">
                  Confirma los cambios y el stock se actualiza instantáneamente con precios e impuestos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
};

export default Index;
