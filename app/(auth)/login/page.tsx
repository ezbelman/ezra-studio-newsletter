import { Suspense } from 'react'
import { LoginForm } from './login-form'

function LoginSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-line p-8 shadow-card">
      <div className="h-6 w-32 bg-line rounded animate-pulse mb-2" />
      <div className="h-4 w-48 bg-line/60 rounded animate-pulse mb-7" />
      <div className="space-y-4">
        <div className="h-10 bg-line/40 rounded animate-pulse" />
        <div className="h-10 bg-line/40 rounded animate-pulse" />
        <div className="h-10 bg-cyan/20 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
