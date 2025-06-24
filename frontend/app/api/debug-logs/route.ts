import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasGoogleApiKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    googleApiKeyPrefix: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10) + '...' || 'NO KEY',
    vercelUrl: process.env.VERCEL_URL || 'localhost',
    headers: Object.fromEntries(request.headers.entries()),
    userAgent: request.headers.get('user-agent') || 'unknown'
  };

  return Response.json({
    status: 'Debug Info',
    data: debugInfo,
    message: 'Esta información ayuda a diagnosticar problemas de configuración'
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 