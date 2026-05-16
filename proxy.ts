import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

// Exact paths that are always public
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

// Prefix-based public paths (checked with startsWith)
const PUBLIC_PREFIXES = [
  '/api/auth/',     // Supabase auth callback
  '/api/subscribe', // public subscribe endpoint
  '/api/track/',    // email open/click tracking pixels (no auth)
  '/api/webhooks/', // Resend webhooks — use their own signing secret
  '/api/cron/',     // Vercel cron — uses CRON_SECRET header
  '/api/v1/',       // public API — uses Bearer token auth
  '/s/',            // public newsletter/issue viewer
  '/unsubscribe',   // one-click opt-out
  '/invite/',       // invite accept flow
]

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  )
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Skip auth check for public routes
  if (isPublicPath(pathname)) return supabaseResponse

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname.startsWith('/') && !pathname.startsWith('//')) {
      url.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (['/login', '/signup'].includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
