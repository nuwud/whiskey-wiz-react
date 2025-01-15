import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // CORS headers for Shopify domains
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*.myshopify.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Serve the embed script
  const scriptContent = await fetch(
    new URL('/public/embed.js', request.url)
  ).then(res => res.text())

  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript',
      ...corsHeaders,
    },
  })
}