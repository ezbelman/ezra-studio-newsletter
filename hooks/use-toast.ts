'use client'
import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

type Listener = (toasts: Toast[]) => void

let _toasts: Toast[] = []
const _listeners = new Set<Listener>()

function notify() {
  _listeners.forEach(l => l([..._toasts]))
}

function addToast(t: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  _toasts = [..._toasts, { id, ...t }]
  notify()
  setTimeout(() => removeToast(id), 4000)
}

export function removeToast(id: string) {
  _toasts = _toasts.filter(t => t.id !== id)
  notify()
}

export const toast = {
  success(title: string, description?: string) {
    addToast({ title, description, variant: 'success' })
  },
  error(title: string, description?: string) {
    addToast({ title, description, variant: 'destructive' })
  },
  info(title: string, description?: string) {
    addToast({ title, description, variant: 'default' })
  },
}

export function useToastStore() {
  const [toasts, setToasts] = useState<Toast[]>([..._toasts])

  useEffect(() => {
    _listeners.add(setToasts)
    return () => { _listeners.delete(setToasts) }
  }, [])

  return { toasts }
}
