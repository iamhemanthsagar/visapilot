interface Env {
  [key: string]: unknown
}

interface EventContext {
  request: Request
  env: Env
  params: Record<string, string | string[]>
}

export async function onRequestGet(context: EventContext): Promise<Response> {
  const request = context.request
  
  // Cloudflare Zero Trust / Cloudflare Access injects these headers
  const cfEmail = request.headers.get('Cf-Access-Authenticated-User-Email') || request.headers.get('cf-access-authenticated-user-email')
  const cfJwt = request.headers.get('Cf-Access-Jwt-Assertion') || request.headers.get('cf-access-jwt-assertion')
  const country = request.headers.get('cf-ipcountry') || 'US'

  if (cfEmail) {
    const cleanEmail = cfEmail.trim().toLowerCase()
    const localPart = cleanEmail.split('@')[0] || 'User'
    const name = localPart
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    const role = cleanEmail.includes('counsel') || cleanEmail.includes('law') ? 'COUNSEL' : 'CONSULTANT'

    return new Response(
      JSON.stringify({
        authenticated: true,
        source: 'cloudflare_access',
        user: {
          id: `cf_${btoa(cleanEmail).substring(0, 16)}`,
          email: cleanEmail,
          name,
          role,
          country,
          token: cfJwt ? `cf_jwt_${cfJwt.substring(0, 24)}...` : `cf_tok_${Date.now()}`,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    )
  }

  return new Response(
    JSON.stringify({
      authenticated: false,
      source: 'local_or_direct',
      user: null,
      country,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  )
}
