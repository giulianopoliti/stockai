"use client"

import type * as React from "react"
import { ShoppingCart, Package, Users, ClipboardList, AlertTriangle, BarChart3 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

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
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Sidebar variant="inset" className="glass-card border-0 border-r border-white/20" {...props}>
      <SidebarHeader className="glass-card border-0 border-b border-white/20 m-2 rounded-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
            <Package className="h-5 w-5" />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-bold text-slate-800">Stock.AI</span>
            <span className="truncate text-xs text-slate-600">Punto de venta inteligente</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-semibold">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    onClick={() => router.push(item.url)}
                    className="glass-button border-0 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-cyan-500 data-[active=true]:text-white rounded-xl smooth-transition"
                  >
                    <a href={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail className="bg-white/20" />
    </Sidebar>
  )
}
