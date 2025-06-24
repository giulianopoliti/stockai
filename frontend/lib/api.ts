// 🚀 Migrado a APIs locales de Next.js - Sin backend Python
const isLocal = process.env.NODE_ENV === 'development'
const baseUrl = isLocal ? '' : (process.env.NEXT_PUBLIC_API_URL || '')

console.log('🔧 API Configuration (Migrado a Next.js):')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('BASE_URL:', baseUrl || 'APIs locales de Next.js')

export const api = {
  // ✅ APIs migradas a Next.js
  stock: `${baseUrl}/api/stock`,
  processInvoice: `${baseUrl}/api/process-invoice`, 
  processAudio: `${baseUrl}/api/process-audio`,
  
  // 🔄 APIs pendientes de migración (mantienen backend Python)
  processText: `${baseUrl}/api/process-text`, // TODO: Crear route.ts
  proveedores: `${baseUrl}/api/proveedores`, // TODO: Crear route.ts
} 

console.log('🔧 API Endpoints (Next.js):', api) 