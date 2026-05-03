import { Suspense } from 'react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginFallback() {
  return (
    <div className="bg-navy-soft/20 border border-white/8 rounded p-8 backdrop-blur-sm">
      <h1 className="text-white font-display font-700 text-xl mb-1">Welcome back</h1>
      <p className="text-white/40 text-sm mb-8">Sign in to your workspace</p>
      <div className="h-48" />
    </div>
  )
}
