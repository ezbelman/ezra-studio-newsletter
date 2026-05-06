import { Suspense } from 'react'
import { ForgotPasswordForm } from './forgot-password-form'

function ForgotPasswordSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-line p-8 shadow-card">
      <div className="h-6 w-44 bg-line rounded animate-pulse mb-2" />
      <div className="h-4 w-56 bg-line/60 rounded animate-pulse mb-7" />
      <div className="space-y-4">
        <div className="h-10 bg-line/40 rounded animate-pulse" />
        <div className="h-10 bg-accent/20 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordSkeleton />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
