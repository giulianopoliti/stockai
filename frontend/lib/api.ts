const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
export const API_BASE_URL = baseUrl

console.log('🔧 API Configuration Debug:')
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('API_BASE_URL:', API_BASE_URL)

export const api = {
  stock: `${API_BASE_URL}/api/stock`,
  processText: `${API_BASE_URL}/process-text`,
  processAudio: `${API_BASE_URL}/process-audio`,
  processInvoice: `${API_BASE_URL}/process-invoice`,
  proveedores: `${API_BASE_URL}/api/proveedores`,
} 

console.log('🔧 API Endpoints:', api) 