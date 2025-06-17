export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  stock: `${API_BASE_URL}/api/stock`,
  processText: `${API_BASE_URL}/process-text`,
  processAudio: `${API_BASE_URL}/process-audio`,
  processInvoice: `${API_BASE_URL}/process-invoice`,
  proveedores: `${API_BASE_URL}/api/proveedores`,
} 