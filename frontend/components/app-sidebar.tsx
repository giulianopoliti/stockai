"use client"

import type * as React from "react"
import { ShoppingCart, Package, Users, ClipboardList, AlertTriangle, BarChart3 } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Ventas",
    url: "/",
    icon: ShoppingCart,
  },
  {
    title: "Stock",
    url: "/stock",
    icon: Package,
  },
  {
    title: "Stock Crítico",
    url: "/stock-critico",
    icon: AlertTriangle,
  },
  {
    title: "Proveedores",
    url: "/proveedores",
    icon: Users,
  },
  {
    title: "Pedidos",
    url: "/pedidos",
    icon: ClipboardList,
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: BarChart3,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" className="glass-sidebar" {...props}>
      <SidebarHeader className="glass border-0 border-b border-white/[0.05] m-2 rounded-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/80 to-cyan-500/80 text-white shadow-lg backdrop-blur-xl border border-white/10">
            <Package className="h-5 w-5" />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-bold text-gradient">Stock.AI</span>
            <span className="truncate text-xs text-gray-400">Punto de venta inteligente</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 font-semibold">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="border-0 data-[active=true]:glass-button data-[active=true]:text-gradient-primary rounded-xl transition-all duration-300 hover:glass-button hover:text-white group"
                  >
                    <a href={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail className="bg-white/5" />
    </Sidebar>
  )
}
