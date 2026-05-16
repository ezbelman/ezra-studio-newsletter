import { NextResponse } from 'next/server'

export function apiOk<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json(meta ? { data, meta } : { data })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
